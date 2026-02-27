"""
Микросервис специалистов (Python 3.11, SQLAlchemy ORM).

Маршруты:
  GET /                                   — список всех специалистов
  GET /?specialist_id=N&date=YYYY-MM-DD   — слоты расписания специалиста на дату
  GET /?specialist_id=N                   — карточка одного специалиста
  POST /                                  — создать специалиста
  PUT /?id=N                              — обновить специалиста
"""
import json
import logging

from datetime import date as date_type
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from models import Specialist, Schedule, get_session
from utils import setup_logger, ok, error, handle_exception, CORS_HEADERS

logger = setup_logger("specialists")


def handler(event: dict, context) -> dict:
    """Обработчик микросервиса специалистов."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    logger.info(f"Request: {method} params={params}")

    session = None
    try:
        session = get_session()

        # GET — список или слоты
        if method == "GET":
            specialist_id = params.get("specialist_id")
            target_date = params.get("date")

            # Слоты конкретного специалиста на дату
            if specialist_id and target_date:
                try:
                    parsed_date = date_type.fromisoformat(target_date)
                except ValueError:
                    return error("Неверный формат даты. Ожидается YYYY-MM-DD")

                spec = session.get(Specialist, int(specialist_id))
                if not spec:
                    return error("Специалист не найден", status=404)

                slots = (
                    session.query(Schedule)
                    .filter_by(specialist_id=int(specialist_id), work_date=parsed_date)
                    .order_by(Schedule.slot_time)
                    .all()
                )
                logger.info(f"Slots for specialist={specialist_id} date={target_date}: {len(slots)} found")
                return ok({"slots": [s.to_dict() for s in slots]})

            # Карточка одного специалиста
            if specialist_id:
                spec = session.get(Specialist, int(specialist_id))
                if not spec:
                    return error("Специалист не найден", status=404)
                return ok({"specialist": spec.to_dict()})

            # Все специалисты
            specialists = session.query(Specialist).order_by(Specialist.id).all()
            logger.info(f"Specialists list: {len(specialists)} records")
            return ok({"specialists": [s.to_dict() for s in specialists]})

        # POST — создать специалиста
        if method == "POST":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return error("Тело запроса должно быть валидным JSON")

            required = ["name", "specialty", "price"]
            missing = [f for f in required if not body.get(f)]
            if missing:
                return error(f"Отсутствуют обязательные поля: {', '.join(missing)}")

            try:
                price = int(body["price"])
                if price <= 0:
                    raise ValueError
            except (ValueError, TypeError):
                return error("Поле price должно быть положительным целым числом")

            spec = Specialist(
                name=str(body["name"])[:200],
                specialty=str(body["specialty"])[:100],
                experience_years=max(0, int(body.get("experience_years", 0))),
                rating=min(5.0, max(0.0, float(body.get("rating", 5.0)))),
                reviews_count=max(0, int(body.get("reviews_count", 0))),
                price=price,
                emoji=str(body.get("emoji", "🩺"))[:10],
                is_available=bool(body.get("is_available", True)),
            )
            session.add(spec)
            session.commit()
            session.refresh(spec)
            logger.info(f"Created specialist id={spec.id} name={spec.name}")
            return ok({"specialist": spec.to_dict()}, status=201)

        # PUT — обновить специалиста
        if method == "PUT":
            spec_id = params.get("id")
            if not spec_id:
                return error("Параметр id обязателен")

            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return error("Тело запроса должно быть валидным JSON")

            spec = session.get(Specialist, int(spec_id))
            if not spec:
                return error("Специалист не найден", status=404)

            updatable = ["name", "specialty", "experience_years", "rating",
                         "reviews_count", "price", "emoji", "is_available"]
            for field in updatable:
                if field in body:
                    setattr(spec, field, body[field])

            session.commit()
            session.refresh(spec)
            logger.info(f"Updated specialist id={spec.id}")
            return ok({"specialist": spec.to_dict()})

        return error(f"Метод {method} не поддерживается", status=405)

    except IntegrityError as exc:
        if session:
            session.rollback()
        logger.warning(f"IntegrityError: {exc}")
        return error("Нарушение уникальности или связей в БД", status=409)

    except SQLAlchemyError as exc:
        if session:
            session.rollback()
        logger.error(f"SQLAlchemyError: {exc}")
        return error("Ошибка базы данных", status=500, details=str(exc))

    except Exception as exc:
        if session:
            session.rollback()
        return handle_exception(logger, exc, context="specialists")

    finally:
        if session:
            session.close()