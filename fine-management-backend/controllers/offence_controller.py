from flask import jsonify, request
from services.offence_service import create_offence, list_offences
from utils.helper import error_response, require_roles


@require_roles("ADMIN", "FACULTY")
def offences():
    if request.method == "GET":
        return jsonify(list_offences())
    offence, error = create_offence(request.get_json(silent=True) or {})
    return error_response(error, 400) if error else (jsonify(offence), 201)
