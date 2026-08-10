from flask import Blueprint
from controllers.faculty_controller import faculty_fine_history

faculty_bp = Blueprint("faculty", __name__)
faculty_bp.route("/faculty/fines", methods=["GET"])(faculty_fine_history)
faculty_bp.route("/faculty/fine-history", methods=["GET"])(faculty_fine_history)
