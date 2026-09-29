from flask import Blueprint
from controllers.student_controller import student_detail, students, verify

student_bp = Blueprint("student", __name__)

student_bp.route("/students", methods=["GET", "POST"])(students)
student_bp.route("/students/<int:student_id>", methods=["GET"])(student_detail)
student_bp.route("/students/verify/<string:roll_number>", methods=["GET"])(verify)
