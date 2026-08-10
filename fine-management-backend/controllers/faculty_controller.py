from flask import jsonify, request
from services.fine_service import list_fines_by_faculty
from utils.helper import require_roles


@require_roles("ADMIN", "FACULTY")
def faculty_fine_history():
    user = request.current_user
    faculty_id = request.args.get("faculty_id", type=int)
    search = request.args.get("search", "").strip()
    # Faculty can inspect only fines they issued; admins may choose a faculty member or search all.
    if user["role"] == "FACULTY":
        faculty_id, search = user["id"], ""
    return jsonify(list_fines_by_faculty(faculty_id=faculty_id, search=search))
