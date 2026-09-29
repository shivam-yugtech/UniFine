"""Rule book storage and validation."""
from flask import current_app
from models.auth import get_connection


FIELDS = "id, title, description, penalty_amount, created_at, updated_at"


def list_rules():
    connection = get_connection(current_app.config["DATABASE"])
    rows = connection.execute(f"SELECT {FIELDS} FROM rules ORDER BY title, id").fetchall()
    connection.close()
    return [dict(row) for row in rows]


def _validated(data):
    title, description = data.get("title"), data.get("description")
    if not isinstance(title, str) or not title.strip() or not isinstance(description, str) or not description.strip():
        return None, "title and description are required."
    try:
        penalty_amount = float(data.get("penalty_amount", 0))
        if penalty_amount < 0:
            raise ValueError
    except (TypeError, ValueError):
        return None, "penalty_amount must be a non-negative number."
    return (title.strip(), description.strip(), penalty_amount), None


def create_rule(data):
    values, error = _validated(data)
    if error:
        return None, error
    connection = get_connection(current_app.config["DATABASE"])
    cursor = connection.execute("INSERT INTO rules (title, description, penalty_amount) VALUES (?, ?, ?)", values)
    connection.commit()
    rule = connection.execute(f"SELECT {FIELDS} FROM rules WHERE id = ?", (cursor.lastrowid,)).fetchone()
    connection.close()
    return dict(rule), None


def update_rule(rule_id, data):
    values, error = _validated(data)
    if error:
        return None, error
    connection = get_connection(current_app.config["DATABASE"])
    cursor = connection.execute("UPDATE rules SET title = ?, description = ?, penalty_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (*values, rule_id))
    connection.commit()
    rule = connection.execute(f"SELECT {FIELDS} FROM rules WHERE id = ?", (rule_id,)).fetchone()
    connection.close()
    return (dict(rule), None) if cursor.rowcount else (None, "Rule not found.")


def delete_rule(rule_id):
    connection = get_connection(current_app.config["DATABASE"])
    cursor = connection.execute("DELETE FROM rules WHERE id = ?", (rule_id,))
    connection.commit()
    connection.close()
    return cursor.rowcount > 0
