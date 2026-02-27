"""
Микросервис записей на приём (Python 3.11, SQLAlchemy ORM).
Реализует паттерн Transactional Outbox: при создании/изменении записи
публикует событие в таблицу events (аналог топика Kafka).

Маршруты:
  GET /                    — записи на сегодня
  GET /?date=YYYY-MM-DD    — записи на дату
  GET /?id=N               — одна запись
  POST /                   — создать запись (публикует событие appointment.created)
  PUT /?id=N               — обновить статус (публикует событие appointment.status_changed)
  DELETE /?id=N            — отменить запись (публикует событие appointment.cancelled)
"""
import json
import logging

from datetime import date as date_type, datetime
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.orm import joinedload

from models import Appointment, Schedule, Specialist, Event, get_session
from utils import setup_logger, ok, error, handle_exception, CORS_HEADERS

logger = setup_logger("appointments")

TOPIC_CREATED = "appointment.created"
TOPIC_STATUS = "appointment.status_changed"
TOPIC_CANCELLED = "appointment.cancelled"
SERVICE_NAME = "appointments"


def _publish_event(session, topic: str, payload: dict) -> None:
    """Публикует событие в очередь (Transactional Outbox)."""
    evt = Event(topic=topic, payload=payload, produced_by=SERVICE_NAME, status="pending")
    session.add(evt)
    logger.info(f"Event published: topic={topic} payload={payload}")


def handler(event: dict, context) -> dict:
    """Обработчик микросервиса записей на приём."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    logger.info(f"Request: {method} params={params}")

    session = None
    try:
        session = get_session()

        # GET
        if method == "GET":
            apt_id = params.get("id")

            # Одна запись
            if apt_id:
                apt = (
                    session.query(Appointment)
                    .options(joinedload(Appointment.specialist))
                    .filter_by(id=int(apt_id))
                    .first()
                )
                if not apt:
                    return error("Запись не найдена", status=404)
                return ok({"appointment": apt.to_dict()})

            # Список по дате
            target_date_str = params.get("date")
            if target_date_str:
                try:
                    target_date = date_type.fromisoformat(target_date_str)
                except ValueError:
                    return error("Неверный формат даты. Ожидается YYYY-MM-DD")
            else:
                target_date = date_type.today()

            appointments = (
                session.query(Appointment)
                .options(joinedload(Appointment.specialist))
                .filter_by(appointment_date=target_date)
                .order_by(Appointment.appointment_time)
                .all()
            )
            logger.info(f"Appointments for {target_date}: {len(appointments)} records")
            return ok({"appointments": [a.to_dict() for a in appointments]})

        # POST — создать запись
        if method == "POST":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return error("Тело запроса должно быть валидным JSON")

            required = ["specialist_id", "patient_name", "patient_phone", "date", "time"]
            missing = [f for f in required if not body.get(f)]
            if missing:
                return error(f"Отсутствуют обязательные поля: {', '.join(missing)}")

            try:
                apt_date = date_type.fromisoformat(str(body["date"]))
            except ValueError:
                return error("Неверный формат даты. Ожидается YYYY-MM-DD")

            spec = session.get(Specialist, int(body["specialist_id"]))
            if not spec:
                return error("Специалист не найден", status=404)

            # Проверяем слот
            slot = (
                session.query(Schedule)
                .filter_by(
                    specialist_id=int(body["specialist_id"]),
                    work_date=apt_date,
                    is_booked=False,
                )
                .filter(Schedule.slot_time == body["time"])
                .first()
            )
            if not slot:
                return error("Выбранное время недоступно или уже занято", status=409)

            # Создаём запись
            apt = Appointment(
                specialist_id=int(body["specialist_id"]),
                patient_name=str(body["patient_name"])[:200],
                patient_phone=str(body["patient_phone"])[:50],
                patient_comment=str(body.get("patient_comment", ""))[:1000] or None,
                appointment_date=apt_date,
                appointment_time=body["time"],
                status="pending",
            )
            session.add(apt)

            # Помечаем слот занятым
            slot.is_booked = True

            # Публикуем событие в очередь (Outbox → notifications прочитает)
            _publish_event(session, TOPIC_CREATED, {
                "appointment_id": None,  # обновим после commit
                "patient_name": apt.patient_name,
                "patient_phone": apt.patient_phone,
                "specialist_name": spec.name,
                "specialist_specialty": spec.specialty,
                "date": str(apt_date),
                "time": str(body["time"]),
            })

            session.commit()
            session.refresh(apt)

            # Обновляем payload события реальным id
            evt = session.query(Event).filter_by(topic=TOPIC_CREATED, status="pending").order_by(Event.id.desc()).first()
            if evt:
                payload = dict(evt.payload)
                payload["appointment_id"] = apt.id
                evt.payload = payload
                session.commit()

            logger.info(f"Created appointment id={apt.id}")
            return ok({"appointment": apt.to_dict()}, status=201)

        # PUT — обновить статус
        if method == "PUT":
            apt_id = params.get("id")
            if not apt_id:
                return error("Параметр id обязателен")

            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return error("Тело запроса должно быть валидным JSON")

            apt = (
                session.query(Appointment)
                .options(joinedload(Appointment.specialist))
                .filter_by(id=int(apt_id))
                .first()
            )
            if not apt:
                return error("Запись не найдена", status=404)

            allowed_statuses = {"pending", "confirmed", "cancelled", "completed"}
            new_status = body.get("status")
            if not new_status or new_status not in allowed_statuses:
                return error(f"Статус должен быть одним из: {', '.join(allowed_statuses)}")

            old_status = apt.status
            apt.status = new_status

            _publish_event(session, TOPIC_STATUS, {
                "appointment_id": apt.id,
                "patient_name": apt.patient_name,
                "old_status": old_status,
                "new_status": new_status,
            })

            session.commit()
            session.refresh(apt)
            logger.info(f"Updated appointment id={apt.id} status={old_status}→{new_status}")
            return ok({"appointment": apt.to_dict()})

        # DELETE — отменить
        if method == "DELETE":
            apt_id = params.get("id")
            if not apt_id:
                return error("Параметр id обязателен")

            apt = (
                session.query(Appointment)
                .options(joinedload(Appointment.specialist))
                .filter_by(id=int(apt_id))
                .first()
            )
            if not apt:
                return error("Запись не найдена", status=404)

            if apt.status == "cancelled":
                return error("Запись уже отменена")

            # Освобождаем слот
            slot = (
                session.query(Schedule)
                .filter_by(
                    specialist_id=apt.specialist_id,
                    work_date=apt.appointment_date,
                )
                .filter(Schedule.slot_time == apt.appointment_time)
                .first()
            )
            if slot:
                slot.is_booked = False

            apt.status = "cancelled"

            _publish_event(session, TOPIC_CANCELLED, {
                "appointment_id": apt.id,
                "patient_name": apt.patient_name,
                "specialist_name": apt.specialist.name if apt.specialist else "",
                "date": apt.appointment_date.isoformat(),
                "time": apt.appointment_time.strftime("%H:%M"),
            })

            session.commit()
            logger.info(f"Cancelled appointment id={apt.id}")
            return ok({"ok": True, "id": apt.id})

        return error(f"Метод {method} не поддерживается", status=405)

    except IntegrityError as exc:
        if session:
            session.rollback()
        logger.warning(f"IntegrityError: {exc}")
        return error("Нарушение уникальности данных", status=409)

    except SQLAlchemyError as exc:
        if session:
            session.rollback()
        logger.error(f"SQLAlchemyError: {exc}")
        return error("Ошибка базы данных", status=500, details=str(exc))

    except Exception as exc:
        if session:
            session.rollback()
        return handle_exception(logger, exc, context="appointments")

    finally:
        if session:
            session.close()