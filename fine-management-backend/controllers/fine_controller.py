from flask import jsonify, request
from services.fine_service import analytics, create_fine, create_multiple_fines, list_fines, update_fine_status
from utils.helper import error_response, require_roles


@require_roles("ADMIN", "FACULTY", "STUDENT")
def fines():
    user = request.current_user
    if request.method == "GET":
        # A student can never select another student's records through a query parameter.
        student_id = user["student_id"] if user["role"] == "STUDENT" else request.args.get("student_id", type=int)
        return jsonify(list_fines(student_id))
    if user["role"] == "STUDENT":
        return error_response("Students can only view their fines.", 403)
    fine, error = create_fine(request.get_json(silent=True) or {}, user["id"])
    return error_response(error, 400) if error else (jsonify(fine), 201)


@require_roles("ADMIN")
def fine_status(fine_id):
    fine, error = update_fine_status(fine_id, (request.get_json(silent=True) or {}).get("status"))
    return error_response(error, 400 if error != "Fine not found." else 404) if error else jsonify(fine)


@require_roles("ADMIN", "FACULTY")
def multiple_fines():
    fines, error = create_multiple_fines(request.get_json(silent=True) or {}, request.current_user["id"])
    return error_response(error, 400) if error else (jsonify(fines), 201)


@require_roles("ADMIN")
def dashboard_analytics():
    return jsonify(analytics())
