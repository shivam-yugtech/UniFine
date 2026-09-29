from flask import current_app
from models.auth import get_connection


def list_students():
    connection = get_connection(current_app.config["DATABASE"])
    rows = connection.execute("SELECT id, roll_number, name, department, semester, email, photo_url FROM students ORDER BY roll_number").fetchall()
    connection.close()
    return [dict(row) for row in rows]


def get_student(student_id):
    connection = get_connection(current_app.config["DATABASE"])
    row = connection.execute("SELECT id, roll_number, name, department, semester, email, photo_url FROM students WHERE id = ?", (student_id,)).fetchone()
    connection.close()
    return dict(row) if row else None


def create_student(data):
    required = ("roll_number", "name", "department", "semester", "email")
    if any(not data.get(field) for field in required):
        return None, "roll_number, name, department, semester and email are required."
    connection = get_connection(current_app.config["DATABASE"])
    try:
        cursor = connection.execute("INSERT INTO students (roll_number, name, department, semester, email, photo_url) VALUES (?, ?, ?, ?, ?, ?)", tuple(data[field] for field in required) + (data.get("photo_url"),))
        connection.commit()
        return get_student(cursor.lastrowid), None
    except Exception as error:
        return None, f"Could not create student: {error}"
    finally:
        connection.close()


def verify_student(roll_number):
    connection = get_connection(current_app.config["DATABASE"])
    row = connection.execute("SELECT id, roll_number, name, department, semester, email, photo_url FROM students WHERE roll_number = ?", (roll_number,)).fetchone()
    connection.close()
    return dict(row) if row else None
