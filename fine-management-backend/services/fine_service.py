from flask import current_app
from models.auth import get_connection


FINE_SELECT = """
    SELECT f.id, f.student_id, s.roll_number, s.name AS student_name,
           f.offence_id, o.title AS offence, f.amount, f.status, f.remarks,
           f.created_at, u.username AS created_by
    FROM fines f
    JOIN students s ON s.id = f.student_id
    JOIN offences o ON o.id = f.offence_id
    JOIN users u ON u.id = f.created_by
"""


def list_fines(student_id=None):
    connection = get_connection(current_app.config["DATABASE"])
    query = FINE_SELECT + (" WHERE f.student_id = ?" if student_id else "") + " ORDER BY f.created_at DESC, f.id DESC"
    rows = connection.execute(query, (student_id,) if student_id else ()).fetchall()
    connection.close()
    return [dict(row) for row in rows]


def list_fines_by_faculty(faculty_id=None, search=""):
    """Return fine issue history, optionally filtered by faculty id or username."""
    connection = get_connection(current_app.config["DATABASE"])
    clauses, params = ["u.role = 'FACULTY'"], []
    if faculty_id is not None:
        clauses.append("f.created_by = ?")
        params.append(faculty_id)
    if search:
        clauses.append("(u.username LIKE ? OR CAST(u.id AS TEXT) LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])
    rows = connection.execute(FINE_SELECT + " WHERE " + " AND ".join(clauses) + " ORDER BY f.created_at DESC, f.id DESC", params).fetchall()
    connection.close()
    return [dict(row) for row in rows]


def create_fine(data, created_by):
    if not data.get("student_id") or not data.get("offence_id"):
        return None, "student_id and offence_id are required."
    connection = get_connection(current_app.config["DATABASE"])
    try:
        student = connection.execute("SELECT id FROM students WHERE id = ?", (data["student_id"],)).fetchone()
        offence = connection.execute("SELECT default_amount FROM offences WHERE id = ?", (data["offence_id"],)).fetchone()
        if not student or not offence:
            return None, "Student or offence was not found."
        amount = float(data.get("amount", offence["default_amount"]))
        if amount < 0:
            return None, "amount must be a non-negative number."
        cursor = connection.execute("INSERT INTO fines (student_id, offence_id, amount, remarks, created_by) VALUES (?, ?, ?, ?, ?)", (data["student_id"], data["offence_id"], amount, data.get("remarks", ""), created_by))
        connection.commit()
        fine = connection.execute(FINE_SELECT + " WHERE f.id = ?", (cursor.lastrowid,)).fetchone()
        current_app.logger.info("Fine created: fine_id=%s student_id=%s issued_by=%s", cursor.lastrowid, data["student_id"], created_by)
        return dict(fine), None
    except (TypeError, ValueError):
        return None, "amount must be a non-negative number."
    finally:
        connection.close()


def update_fine_status(fine_id, status):
    if status not in ("UNPAID", "PAID", "WAIVED"):
        return None, "status must be UNPAID, PAID or WAIVED."
    connection = get_connection(current_app.config["DATABASE"])
    cursor = connection.execute("UPDATE fines SET status = ? WHERE id = ?", (status, fine_id))
    connection.commit()
    fine = connection.execute(FINE_SELECT + " WHERE f.id = ?", (fine_id,)).fetchone()
    connection.close()
    if cursor.rowcount:
        current_app.logger.info("Fine status updated: fine_id=%s status=%s", fine_id, status)
    return (dict(fine), None) if cursor.rowcount else (None, "Fine not found.")


def create_multiple_fines(data, created_by):
    offence_ids = data.get("offence_ids")
    if not isinstance(offence_ids, list) or not offence_ids:
        return None, "offence_ids must contain at least one offence ID."
    created = []
    for offence_id in offence_ids:
        fine, error = create_fine({**data, "offence_id": offence_id}, created_by)
        if error:
            return None, error
        created.append(fine)
    return created, None


def analytics():
    connection = get_connection(current_app.config["DATABASE"])
    totals = connection.execute("SELECT COUNT(*) AS total_fines, COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) AS collected, COALESCE(SUM(CASE WHEN status = 'UNPAID' THEN amount ELSE 0 END), 0) AS outstanding FROM fines").fetchone()
    departments = connection.execute("SELECT s.department, COUNT(f.id) AS fine_count, COALESCE(SUM(f.amount), 0) AS amount FROM students s LEFT JOIN fines f ON f.student_id = s.id GROUP BY s.department ORDER BY amount DESC").fetchall()
    monthly = connection.execute("SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS fine_count, SUM(amount) AS amount FROM fines GROUP BY month ORDER BY month DESC").fetchall()
    common = connection.execute("SELECT o.title AS offence, COUNT(f.id) AS count FROM offences o LEFT JOIN fines f ON f.offence_id = o.id GROUP BY o.id ORDER BY count DESC, o.title LIMIT 5").fetchall()
    connection.close()
    return {"summary": dict(totals), "by_department": [dict(row) for row in departments], "monthly_trends": [dict(row) for row in monthly], "common_offences": [dict(row) for row in common]}
