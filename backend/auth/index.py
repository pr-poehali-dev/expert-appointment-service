"""
Микросервис авторизации (Python 3.11, SQLAlchemy ORM).

Маршруты:
  POST /?action=register  — регистрация (role: client | doctor)
  POST /?action=login     — вход, возвращает token
  POST /?action=logout    — выход (удаляет сессию)
  GET  /                  — /me: данные текущего пользователя по токену
"""
import hashlib
import json
import logging
import os
import re
import secrets
from datetime import datetime, timedelta

from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models import User, Session, Specialist, get_session_db
from utils import setup_logger, ok, error, handle_exception, CORS_HEADERS

logger = setup_logger("auth")

TOKEN_TTL_HOURS = 72


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _get_user_by_token(db, token: str) -> User | None:
    """Возвращает пользователя по валидному токену."""
    sess = (
        db.query(Session)
        .filter_by(token=token)
        .filter(Session.expires_at > datetime.utcnow())
        .first()
    )
    if not sess:
        return None
    return sess.user


def handler(event: dict, context) -> dict:
    """Обработчик микросервиса авторизации."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token") or params.get("token")

    logger.info(f"Request: {method} action={params.get('action')}")

    db = None
    try:
        db = get_session_db()

        # GET / — профиль по токену
        if method == "GET":
            if not token:
                return error("Токен не передан", status=401)
            user = _get_user_by_token(db, token)
            if not user:
                return error("Токен недействителен или истёк", status=401)
            result = user.to_dict()
            if user.specialist:
                result["specialist"] = user.specialist.to_dict()
            logger.info(f"GET /me user_id={user.id} role={user.role}")
            return ok({"user": result})

        if method == "POST":
            action = params.get("action")

            # --- REGISTER ---
            if action == "register":
                raw = event.get("body") or "{}"
                try:
                    body = json.loads(raw) if isinstance(raw, str) else raw
                    if not isinstance(body, dict):
                        body = {}
                except (json.JSONDecodeError, TypeError):
                    return error("Тело запроса должно быть валидным JSON")

                required = ["email", "password", "full_name"]
                missing = [f for f in required if not body.get(f)]
                if missing:
                    return error(f"Отсутствуют обязательные поля: {', '.join(missing)}")

                email = str(body["email"]).strip().lower()
                if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
                    return error("Некорректный формат email")

                password = str(body["password"])
                if len(password) < 6:
                    return error("Пароль должен содержать не менее 6 символов")

                role = str(body.get("role", "client"))
                if role not in ("client", "doctor"):
                    return error("Роль должна быть client или doctor")

                specialist_id = None
                if role == "doctor":
                    spec_id = body.get("specialist_id")
                    if not spec_id:
                        return error("Для роли doctor необходимо указать specialist_id")
                    spec = db.get(Specialist, int(spec_id))
                    if not spec:
                        return error("Специалист не найден", status=404)
                    specialist_id = spec.id

                existing = db.query(User).filter_by(email=email).first()
                if existing:
                    return error("Пользователь с таким email уже зарегистрирован", status=409)

                user = User(
                    email=email,
                    password_hash=_hash_password(password),
                    full_name=str(body["full_name"])[:200],
                    phone=str(body.get("phone", ""))[:50] or None,
                    role=role,
                    specialist_id=specialist_id,
                )
                db.add(user)
                db.commit()
                db.refresh(user)

                token_value = secrets.token_hex(32)
                session = Session(
                    user_id=user.id,
                    token=token_value,
                    expires_at=datetime.utcnow() + timedelta(hours=TOKEN_TTL_HOURS),
                )
                db.add(session)
                db.commit()

                logger.info(f"Registered user id={user.id} email={email} role={role}")
                return ok({"token": token_value, "user": user.to_dict()}, status=201)

            # --- LOGIN ---
            if action == "login":
                raw = event.get("body") or "{}"
                try:
                    body = json.loads(raw) if isinstance(raw, str) else raw
                    if not isinstance(body, dict):
                        body = {}
                except (json.JSONDecodeError, TypeError):
                    return error("Тело запроса должно быть валидным JSON")

                email = str(body.get("email", "")).strip().lower()
                password = str(body.get("password", ""))

                if not email or not password:
                    return error("Email и пароль обязательны")

                user = db.query(User).filter_by(email=email, is_active=True).first()
                if not user or user.password_hash != _hash_password(password):
                    return error("Неверный email или пароль", status=401)

                token_value = secrets.token_hex(32)
                session = Session(
                    user_id=user.id,
                    token=token_value,
                    expires_at=datetime.utcnow() + timedelta(hours=TOKEN_TTL_HOURS),
                )
                db.add(session)
                db.commit()

                result = user.to_dict()
                if user.specialist:
                    result["specialist"] = user.specialist.to_dict()

                logger.info(f"Login user_id={user.id} email={email}")
                return ok({"token": token_value, "user": result})

            # --- LOGOUT ---
            if action == "logout":
                if not token:
                    return error("Токен не передан", status=401)
                sess = db.query(Session).filter_by(token=token).first()
                if sess:
                    sess.expires_at = datetime.utcnow()
                    db.commit()
                logger.info(f"Logout token={token[:8]}...")
                return ok({"ok": True})

            return error(f"Неизвестный action: {action}")

        return error(f"Метод {method} не поддерживается", status=405)

    except IntegrityError as exc:
        if db:
            db.rollback()
        logger.warning(f"IntegrityError: {exc}")
        return error("Пользователь с таким email уже существует", status=409)

    except SQLAlchemyError as exc:
        if db:
            db.rollback()
        logger.error(f"SQLAlchemyError: {exc}")
        return error("Ошибка базы данных", status=500, details=str(exc))

    except Exception as exc:
        if db:
            db.rollback()
        return handle_exception(logger, exc, context="auth")

    finally:
        if db:
            db.close()