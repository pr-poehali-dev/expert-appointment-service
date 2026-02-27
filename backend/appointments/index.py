"""
Микросервис записей: создание, список, статус записей на приём.
GET /           — все записи на сегодня
GET /?date=...  — записи на конкретную дату
POST /          — создать новую запись
POST /?action=status&id=N&status=S — обновить статус записи
"""
import json
import os
import psycopg2
from datetime import date

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

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor()

    if method == "POST":
        action = params.get("action")

        if action == "status":
            apt_id = params.get("id")
            new_status = params.get("status")
            cur.execute(
                f"UPDATE {SCHEMA}.appointments SET status = %s WHERE id = %s",
                (new_status, apt_id),
            )
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        body = json.loads(event.get("body") or "{}")
        specialist_id = body.get("specialist_id")
        patient_name = body.get("patient_name")
        patient_phone = body.get("patient_phone")
        patient_comment = body.get("patient_comment", "")
        appointment_date = body.get("date")
        appointment_time = body.get("time")

        cur.execute(
            f"""
            INSERT INTO {SCHEMA}.appointments
              (specialist_id, patient_name, patient_phone, patient_comment, appointment_date, appointment_time, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending')
            RETURNING id
            """,
            (specialist_id, patient_name, patient_phone, patient_comment, appointment_date, appointment_time),
        )
        apt_id = cur.fetchone()[0]

        cur.execute(
            f"""
            UPDATE {SCHEMA}.schedules
            SET is_booked = TRUE
            WHERE specialist_id = %s AND work_date = %s AND slot_time = %s
            """,
            (specialist_id, appointment_date, appointment_time),
        )

        cur.execute(
            f"""
            SELECT s.name, s.specialty FROM {SCHEMA}.specialists s WHERE s.id = %s
            """,
            (specialist_id,),
        )
        spec = cur.fetchone()
        spec_name = spec[0] if spec else "специалиста"
        spec_specialty = spec[1] if spec else ""

        cur.execute(
            f"""
            INSERT INTO {SCHEMA}.notifications
              (appointment_id, type, title, message, channel, is_read)
            VALUES (%s, 'confirm', %s, %s, 'Email', FALSE)
            """,
            (
                apt_id,
                "Запись подтверждена",
                f"{patient_name} записан(а) на {appointment_date} в {appointment_time} к {spec_specialty} {spec_name}.",
            ),
        )

        conn.commit()
        conn.close()
        return {"statusCode": 201, "headers": CORS, "body": json.dumps({"id": apt_id, "ok": True})}

    target_date = params.get("date", str(date.today()))
    cur.execute(
        f"""
        SELECT a.id, a.patient_name, a.patient_phone, a.appointment_time::text,
               a.status, s.name AS doctor, s.specialty, a.appointment_date::text
        FROM {SCHEMA}.appointments a
        JOIN {SCHEMA}.specialists s ON s.id = a.specialist_id
        WHERE a.appointment_date = %s
        ORDER BY a.appointment_time
        """,
        (target_date,),
    )
    rows = cur.fetchall()
    appointments = []
    for r in rows:
        appointments.append({
            "id": r[0],
            "patient": r[1],
            "phone": r[2],
            "time": r[3][:5],
            "status": r[4],
            "doctor": r[5],
            "specialty": r[6],
            "date": r[7],
        })
    conn.close()
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"appointments": appointments})}
