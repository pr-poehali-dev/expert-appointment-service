"""
Утилиты: логирование, CORS-заголовки, стандартные HTTP-ответы.
"""
import json
import logging
import traceback


def setup_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(
            "[%(asctime)s] %(levelname)s [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        ))
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Content-Type": "application/json",
}


def ok(data: dict, status: int = 200) -> dict:
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps(data, ensure_ascii=False)}


def error(message: str, status: int = 400, details: str = "") -> dict:
    body = {"error": message}
    if details:
        body["details"] = details
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps(body, ensure_ascii=False)}


def handle_exception(logger: logging.Logger, exc: Exception, context: str = "") -> dict:
    tb = traceback.format_exc()
    logger.error(f"Unhandled exception in {context}: {exc}\n{tb}")
    return error("Внутренняя ошибка сервера.", status=500, details=str(exc))
