"""Database setup for the Fine Management System."""
import sqlite3
from werkzeug.security import generate_password_hash


def get_connection(database):
    connection = sqlite3.connect(database)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_database(database):
    connection = get_connection(database)
    connection.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('ADMIN', 'FACULTY', 'STUDENT')),
            student_id INTEGER
        );
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            roll_number TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            department TEXT NOT NULL,
            semester INTEGER NOT NULL,
            email TEXT UNIQUE NOT NULL
        );
        CREATE TABLE IF NOT EXISTS offences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            default_amount REAL NOT NULL CHECK(default_amount >= 0)
        );
        CREATE TABLE IF NOT EXISTS rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            penalty_amount REAL NOT NULL DEFAULT 0 CHECK(penalty_amount >= 0),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS fines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            offence_id INTEGER NOT NULL,
            amount REAL NOT NULL CHECK(amount >= 0),
            status TEXT NOT NULL DEFAULT 'UNPAID' CHECK(status IN ('UNPAID', 'PAID', 'WAIVED')),
            remarks TEXT,
            created_by INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES students(id),
            FOREIGN KEY(offence_id) REFERENCES offences(id),
            FOREIGN KEY(created_by) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS revoked_tokens (
            token TEXT PRIMARY KEY,
            revoked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    """)
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(students)")}
    if "photo_url" not in columns:
        connection.execute("ALTER TABLE students ADD COLUMN photo_url TEXT")
    # Upgrade any legacy plain-text password values before authenticating users.
    for user in connection.execute("SELECT id, password FROM users").fetchall():
        if not user["password"].startswith(("scrypt:", "pbkdf2:")):
            connection.execute("UPDATE users SET password = ? WHERE id = ?", (generate_password_hash(user["password"]), user["id"]))
    # Demo accounts make the API usable immediately. Change these for deployment.
    connection.execute("INSERT OR IGNORE INTO students (id, roll_number, name, department, semester, email) VALUES (1, '220145', 'Rahul Sharma', 'Computer Science', 6, 'rahul@example.edu')")
    connection.execute("UPDATE students SET photo_url = COALESCE(photo_url, 'https://example.edu/photos/220145.jpg') WHERE id = 1")
    connection.execute("INSERT OR IGNORE INTO users (id, username, password, role) VALUES (1, 'admin', ?, 'ADMIN')", (generate_password_hash("admin123"),))
    connection.execute("INSERT OR IGNORE INTO users (id, username, password, role) VALUES (2, 'faculty', ?, 'FACULTY')", (generate_password_hash("faculty123"),))
    connection.execute("INSERT OR IGNORE INTO users (id, username, password, role, student_id) VALUES (3, 'student', ?, 'STUDENT', 1)", (generate_password_hash("student123"),))
    connection.execute("INSERT OR IGNORE INTO offences (id, title, description, default_amount) VALUES (1, 'Library book overdue', 'Book was returned after the due date.', 100)")
    connection.commit()
    connection.close()
