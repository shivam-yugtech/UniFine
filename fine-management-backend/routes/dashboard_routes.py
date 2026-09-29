from flask import Blueprint
from controllers.dashboard_controller import admin_dashboard, student_dashboard

dashboard_bp = Blueprint("dashboard", __name__)
dashboard_bp.route("/admin/dashboard", methods=["GET"])(admin_dashboard)
dashboard_bp.route("/student/dashboard", methods=["GET"])(student_dashboard)
