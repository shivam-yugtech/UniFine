from flask import current_app
from models.auth import get_connection


def list_offences():
    connection = get_connection(current_app.config["DATABASE"])
    rows = connection.execute("SELECT id, title, description, default_amount FROM offences ORDER BY title").fetchall()
    connection.close()
    return [dict(row) for row in rows]


def create_offence(data):
    if not data.get("title") or not data.get("description") or data.get("default_amount") is None:
        return None, "title, description and default_amount are required."
    try:
        amount = float(data["default_amount"])
        if amount < 0:
            raise ValueError
    except (TypeError, ValueError):
        return None, "default_amount must be a non-negative number."
    connection = get_connection(current_app.config["DATABASE"])
    cursor = connection.execute("INSERT INTO offences (title, description, default_amount) VALUES (?, ?, ?)", (data["title"], data["description"], amount))
    connection.commit()
    offence = connection.execute("SELECT id, title, description, default_amount FROM offences WHERE id = ?", (cursor.lastrowid,)).fetchone()
    connection.close()
    return dict(offence), None
