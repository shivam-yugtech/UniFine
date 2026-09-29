from flask import request, jsonify
from services.auth_service import authenticate, revoke_token
from utils.helper import error_response, require_roles


def login():

    data = request.get_json(silent=True) or {}

    username = data.get("username")
    password = data.get("password")

    result = authenticate(username, password)

    return error_response(result["message"], 401) if not result["success"] else jsonify(result)


@require_roles("ADMIN", "FACULTY", "STUDENT")
def logout():
    token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    revoke_token(token)
    return jsonify({"message": "Logged out successfully. Remove the token from client storage."})
