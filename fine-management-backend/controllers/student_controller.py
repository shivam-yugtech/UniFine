from flask import jsonify, request
from services.student_service import create_student, get_student, list_students, verify_student
from utils.helper import error_response, require_roles


@require_roles("ADMIN", "FACULTY")
def students():
    if request.method == "GET":
        return jsonify(list_students())
    student, error = create_student(request.get_json(silent=True) or {})
    return error_response(error, 400) if error else (jsonify(student), 201)


@require_roles("ADMIN", "FACULTY", "STUDENT")
def student_detail(student_id):
    user = request.current_user
    if user["role"] == "STUDENT" and user["student_id"] != student_id:
        return error_response("Students can only view their own profile.", 403)
    student = get_student(student_id)
    return error_response("Student not found.", 404) if not student else jsonify(student)


@require_roles("ADMIN", "FACULTY")
def verify(roll_number):
    student = verify_student(roll_number)
    return error_response("No student found with this roll number.", 404) if not student else jsonify(student)
