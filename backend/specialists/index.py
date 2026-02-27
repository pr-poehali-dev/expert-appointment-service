"""
Микросервис специалистов: список врачей и слоты расписания.
GET /  — список всех специалистов
GET /?date=YYYY-MM-DD&specialist_id=N — слоты по специалисту на дату
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p60955846_expert_appointment_s")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    specialist_id = params.get("specialist_id")
    date = params.get("date")

    conn = get_conn()
    cur = conn.cursor()

    if specialist_id and date:
        cur.execute(
            f"""
            SELECT slot_time::text, is_booked
            FROM {SCHEMA}.schedules
            WHERE specialist_id = %s AND work_date = %s
            ORDER BY slot_time
            """,
            (specialist_id, date),
        )
        rows = cur.fetchall()
        slots = [{"time": r[0][:5], "status": "booked" if r[1] else "available"} for r in rows]
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"slots": slots})}

    cur.execute(
        f"""
        SELECT id, name, specialty, experience_years, rating, reviews_count,
               price, emoji, is_available
        FROM {SCHEMA}.specialists
        ORDER BY id
        """
    )
    rows = cur.fetchall()
    specialists = []
    for r in rows:
        specialists.append({
            "id": r[0],
            "name": r[1],
            "specialty": r[2],
            "experience": f"{r[3]} лет",
            "rating": float(r[4]),
            "reviews": r[5],
            "price": f"{r[6]:,} ₽".replace(",", " "),
            "emoji": r[7],
            "available": r[8],
        })
    conn.close()
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"specialists": specialists})}
