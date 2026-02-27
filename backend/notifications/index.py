"""
Микросервис уведомлений: лента уведомлений, отметка прочитанными.
GET /           — все уведомления
POST /?action=read&id=N  — отметить как прочитанное
POST /?action=read_all   — отметить все как прочитанные
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

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor()

    if method == "POST":
        action = params.get("action")

        if action == "read":
            notif_id = params.get("id")
            cur.execute(
                f"UPDATE {SCHEMA}.notifications SET is_read = TRUE WHERE id = %s",
                (notif_id,),
            )
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        if action == "read_all":
            cur.execute(f"UPDATE {SCHEMA}.notifications SET is_read = TRUE")
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        conn.close()
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Unknown action"})}

    cur.execute(
        f"""
        SELECT n.id, n.type, n.title, n.message, n.channel, n.is_read,
               n.created_at::text
        FROM {SCHEMA}.notifications n
        ORDER BY n.created_at DESC
        LIMIT 50
        """
    )
    rows = cur.fetchall()

    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.notifications WHERE is_read = FALSE"
    )
    unread_count = cur.fetchone()[0]

    notifications = []
    for r in rows:
        notifications.append({
            "id": r[0],
            "type": r[1],
            "title": r[2],
            "message": r[3],
            "channel": r[4],
            "read": r[5],
            "time": r[6],
        })

    conn.close()
    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"notifications": notifications, "unread": unread_count}),
    }
