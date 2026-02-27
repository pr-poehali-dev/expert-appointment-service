"""
Микросервис новостей.
Маршруты:
  GET /?action=list     — список опубликованных новостей
  GET /?action=get&id=N — одна новость
  POST /?action=create  — создать новость
  PUT /?action=update   — обновить новость
  DELETE /?action=delete&id=N — удалить новость
"""
import json
import os
from datetime import datetime

from sqlalchemy import create_engine, text

SCHEMA = "t_p60955846_expert_appointment_s"


def get_engine():
    return create_engine(os.environ["DATABASE_URL"])


def serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
        "Content-Type": "application/json",
    }


def ok(data, status=200):
    return {"statusCode": status, "headers": cors(), "body": json.dumps(data, default=serial)}


def err(msg, status=400):
    return {"statusCode": status, "headers": cors(), "body": json.dumps({"error": msg})}


def handler(event: dict, context) -> dict:
    """Микросервис новостей: список, создание, обновление, удаление."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "list")

    engine = get_engine()

    with engine.connect() as conn:
        if method == "GET" and action == "list":
            rows = conn.execute(text(
                f"SELECT id, title, preview, published_at FROM {SCHEMA}.news WHERE is_published = TRUE ORDER BY published_at DESC LIMIT 20"
            )).fetchall()
            news = [{"id": r[0], "title": r[1], "preview": r[2], "published_at": r[3]} for r in rows]
            return ok({"news": news})

        if method == "GET" and action == "get":
            news_id = int(params.get("id", 0))
            row = conn.execute(text(
                f"SELECT id, title, content, preview, published_at FROM {SCHEMA}.news WHERE id = :id AND is_published = TRUE"
            ), {"id": news_id}).fetchone()
            if not row:
                return err("Новость не найдена", 404)
            return ok({"news": {"id": row[0], "title": row[1], "content": row[2], "preview": row[3], "published_at": row[4]}})

        if method == "POST" and action == "create":
            body = json.loads(event.get("body") or "{}")
            title = body.get("title", "").strip()
            content = body.get("content", "").strip()
            if not title or not content:
                return err("title и content обязательны")
            preview = body.get("preview", content[:150]).strip()
            result = conn.execute(text(
                f"INSERT INTO {SCHEMA}.news (title, content, preview, is_published) VALUES (:t, :c, :p, TRUE) RETURNING id"
            ), {"t": title, "c": content, "p": preview})
            conn.commit()
            return ok({"id": result.fetchone()[0], "message": "Новость создана"}, 201)

        if method == "PUT" and action == "update":
            body = json.loads(event.get("body") or "{}")
            news_id = int(body.get("id", 0))
            title = body.get("title", "").strip()
            content = body.get("content", "").strip()
            preview = body.get("preview", content[:150]).strip()
            conn.execute(text(
                f"UPDATE {SCHEMA}.news SET title=:t, content=:c, preview=:p, updated_at=NOW() WHERE id=:id"
            ), {"t": title, "c": content, "p": preview, "id": news_id})
            conn.commit()
            return ok({"message": "Новость обновлена"})

        if method == "DELETE" and action == "delete":
            news_id = int(params.get("id", 0))
            conn.execute(text(f"DELETE FROM {SCHEMA}.news WHERE id = :id"), {"id": news_id})
            conn.commit()
            return ok({"message": "Новость удалена"})

    return err("Неизвестное действие")