from flask import jsonify, request
from services.rule_service import create_rule, delete_rule, list_rules, update_rule
from utils.helper import error_response, require_roles


@require_roles("ADMIN", "FACULTY", "STUDENT")
def rules():
    if request.method == "GET":
        return jsonify(list_rules())
    if request.current_user["role"] != "ADMIN":
        return error_response("Only administrators can manage rules.", 403)
    rule, error = create_rule(request.get_json(silent=True) or {})
    return error_response(error, 400) if error else (jsonify(rule), 201)


@require_roles("ADMIN")
def rule_detail(rule_id):
    if request.method == "PATCH":
        rule, error = update_rule(rule_id, request.get_json(silent=True) or {})
        return error_response(error, 404 if error == "Rule not found." else 400) if error else jsonify(rule)
    if not delete_rule(rule_id):
        return error_response("Rule not found.", 404)
    return "", 204
