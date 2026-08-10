import logging
from flask import current_app
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash
from models.auth import get_connection


def authenticate(username, password):
    if not username or not password:
        return {"success": False, "message": "Username and password are required."}
    connection = get_connection(current_app.config["DATABASE"])
    user = connection.execute("SELECT id, username, password, role, student_id FROM users WHERE username = ?", (username,)).fetchone()
    connection.close()
    if not user or not check_password_hash(user["password"], password):
        current_app.logger.warning("Failed login attempt for username=%s", username)
        return {"success": False, "message": "Invalid username or password."}
    token = _serializer().dumps({"id": user["id"], "role": user["role"], "student_id": user["student_id"]})
    current_app.logger.info("User logged in: id=%s role=%s", user["id"], user["role"])
    return {"success": True, "username": user["username"], "role": user["role"], "token": token}


def _serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="fine-management-auth")


def current_user(token):
    try:
        user = _serializer().loads(token, max_age=60 * 60 * 8)
        connection = get_connection(current_app.config["DATABASE"])
        revoked = connection.execute("SELECT 1 FROM revoked_tokens WHERE token = ?", (token,)).fetchone()
        connection.close()
        return None if revoked else user
    except (BadSignature, SignatureExpired):
        return None


def revoke_token(token):
    connection = get_connection(current_app.config["DATABASE"])
    connection.execute("INSERT OR IGNORE INTO revoked_tokens (token) VALUES (?)", (token,))
    connection.commit()
    connection.close()
    current_app.logger.info("User logged out")
