"""Role-specific dashboard summary queries."""
from flask import current_app
from models.auth import get_connection


def _amount(value):
    return float(value or 0)


def admin_dashboard():
    connection = get_connection(current_app.config["DATABASE"])
    row = connection.execute("""
        SELECT COUNT(*) AS total_fines,
               COALESCE(SUM(amount), 0) AS total_fine_amount,
               COALESCE(SUM(CASE WHEN status = 'UNPAID' THEN 1 ELSE 0 END), 0) AS pending_fine_count,
               COALESCE(SUM(CASE WHEN status = 'UNPAID' THEN amount ELSE 0 END), 0) AS pending_fines,
               COALESCE(SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END), 0) AS paid_fine_count,
               COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) AS paid_fines
        FROM fines
    """).fetchone()
    connection.close()
    return {
        "total_fines": row["total_fines"],
        "total_fine_amount": _amount(row["total_fine_amount"]),
        "pending_fine_count": row["pending_fine_count"],
        "pending_fines": _amount(row["pending_fines"]),
        "paid_fine_count": row["paid_fine_count"],
        "paid_fines": _amount(row["paid_fines"]),
        "revenue": _amount(row["paid_fines"]),
    }


def student_dashboard(student_id):
    connection = get_connection(current_app.config["DATABASE"])
    row = connection.execute("""
        SELECT COUNT(*) AS total_fines,
               COALESCE(SUM(amount), 0) AS total_fine_amount,
               COALESCE(SUM(CASE WHEN status = 'UNPAID' THEN 1 ELSE 0 END), 0) AS pending_fine_count,
               COALESCE(SUM(CASE WHEN status = 'UNPAID' THEN amount ELSE 0 END), 0) AS pending_amount,
               COALESCE(SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END), 0) AS paid_fine_count,
               COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) AS paid_amount
        FROM fines WHERE student_id = ?
    """, (student_id,)).fetchone()
    connection.close()
    return {
        "my_fines": row["total_fines"],
        "total_fine_amount": _amount(row["total_fine_amount"]),
        "pending_fine_count": row["pending_fine_count"],
        "pending_amount": _amount(row["pending_amount"]),
        "paid_fine_count": row["paid_fine_count"],
        "paid_amount": _amount(row["paid_amount"]),
    }
