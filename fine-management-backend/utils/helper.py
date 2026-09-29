from functools import wraps
from flask import jsonify, request
from services.auth_service import current_user


def error_response(message, status):
    return jsonify({"error": {"code": status, "message": message}}), status


def require_roles(*roles):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            header = request.headers.get("Authorization", "")
            token = header.removeprefix("Bearer ").strip()
            user = current_user(token) if token else None
            if not user:
                return error_response("A valid Bearer token is required.", 401)
            if user["role"] not in roles:
                return error_response("You do not have permission for this action.", 403)
            request.current_user = user
            return view(*args, **kwargs)
        return wrapped
    return decorator
