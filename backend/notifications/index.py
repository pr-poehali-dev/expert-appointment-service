"""
Микросервис уведомлений (Python 3.11, SQLAlchemy ORM).
Читает события из таблицы events (Transactional Outbox Pattern) —
аналог консьюмера Kafka. Обрабатывает топики appointment.created,
appointment.status_changed, appointment.cancelled.

Маршруты:
  GET /                        — список уведомлений
  GET /?unread=true            — только непрочитанные
  POST /?action=read&id=N      — отметить как прочитанное
  POST /?action=read_all       — отметить все как прочитанные
  POST /?action=process_events — обработать очередь событий (консьюмер)
"""
import json
import logging

from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload

from models import Notification, Event, get_session
from utils import setup_logger, ok, error, handle_exception, CORS_HEADERS

logger = setup_logger("notifications")

SERVICE_NAME = "notifications"
CONSUMED_TOPICS = {
    "appointment.created",
    "appointment.status_changed",
    "appointment.cancelled",
}


def _process_event(session, evt: Event) -> Notification | None:
    """Создаёт уведомление из события очереди."""
    p = evt.payload or {}

    if evt.topic == "appointment.created":
        notif = Notification(
            appointment_id=p.get("appointment_id"),
            type="confirm",
            title="Запись подтверждена",
            message=(
                f"{p.get('patient_name')} записан(а) к "
                f"{p.get('specialist_specialty', '')} {p.get('specialist_name', '')} "
                f"на {p.get('date')} в {p.get('time')}."
            ),
            channel="Email",
            is_read=False,
        )

    elif evt.topic == "appointment.status_changed":
        status_labels = {
            "confirmed": "подтверждена",
            "cancelled": "отменена",
            "completed": "завершена",
            "pending": "ожидает подтверждения",
        }
        new_status = p.get("new_status", "")
        notif = Notification(
            appointment_id=p.get("appointment_id"),
            type="reminder" if new_status == "confirmed" else "cancel",
            title=f"Статус записи изменён",
            message=(
                f"Запись пациента {p.get('patient_name')} "
                f"{status_labels.get(new_status, new_status)}."
            ),
            channel="SMS + Email",
            is_read=False,
        )

    elif evt.topic == "appointment.cancelled":
        notif = Notification(
            appointment_id=p.get("appointment_id"),
            type="cancel",
            title="Запись отменена",
            message=(
                f"Запись пациента {p.get('patient_name')} к "
                f"{p.get('specialist_name', '')} "
                f"на {p.get('date')} в {p.get('time')} отменена."
            ),
            channel="SMS + Email",
            is_read=False,
        )
    else:
        logger.warning(f"Unknown topic: {evt.topic}")
        return None

    session.add(notif)
    evt.status = "processed"
    evt.consumed_by = SERVICE_NAME
    evt.processed_at = datetime.utcnow()
    logger.info(f"Processed event id={evt.id} topic={evt.topic}")
    return notif


def handler(event: dict, context) -> dict:
    """Обработчик микросервиса уведомлений."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    logger.info(f"Request: {method} params={params}")

    session = None
    try:
        session = get_session()

        # GET — список уведомлений
        if method == "GET":
            query = session.query(Notification).order_by(Notification.created_at.desc())

            if params.get("unread") == "true":
                query = query.filter_by(is_read=False)

            notifications = query.limit(100).all()
            unread_count = session.query(Notification).filter_by(is_read=False).count()

            logger.info(f"Notifications: {len(notifications)} total, {unread_count} unread")
            return ok({
                "notifications": [n.to_dict() for n in notifications],
                "unread": unread_count,
            })

        # POST — действия
        if method == "POST":
            action = params.get("action")

            # Отметить одно как прочитанное
            if action == "read":
                notif_id = params.get("id")
                if not notif_id:
                    return error("Параметр id обязателен")

                notif = session.get(Notification, int(notif_id))
                if not notif:
                    return error("Уведомление не найдено", status=404)

                notif.is_read = True
                session.commit()
                logger.info(f"Marked notification id={notif_id} as read")
                return ok({"ok": True})

            # Отметить все как прочитанные
            if action == "read_all":
                updated = (
                    session.query(Notification)
                    .filter_by(is_read=False)
                    .all()
                )
                for n in updated:
                    n.is_read = True
                session.commit()
                logger.info(f"Marked all {len(updated)} notifications as read")
                return ok({"ok": True, "updated": len(updated)})

            # Обработать очередь событий (консьюмер Outbox)
            if action == "process_events":
                pending_events = (
                    session.query(Event)
                    .filter(
                        Event.topic.in_(CONSUMED_TOPICS),
                        Event.status == "pending",
                    )
                    .order_by(Event.created_at)
                    .limit(50)
                    .all()
                )

                processed = []
                for evt in pending_events:
                    notif = _process_event(session, evt)
                    if notif:
                        processed.append(evt.id)

                session.commit()
                logger.info(f"Processed {len(processed)} events from queue")
                return ok({"processed": len(processed), "event_ids": processed})

            return error(f"Неизвестный action: {action}")

        return error(f"Метод {method} не поддерживается", status=405)

    except SQLAlchemyError as exc:
        if session:
            session.rollback()
        logger.error(f"SQLAlchemyError: {exc}")
        return error("Ошибка базы данных", status=500, details=str(exc))

    except Exception as exc:
        if session:
            session.rollback()
        return handle_exception(logger, exc, context="notifications")

    finally:
        if session:
            session.close()