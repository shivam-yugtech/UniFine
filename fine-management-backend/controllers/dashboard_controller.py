from flask import jsonify, request
from services.dashboard_service import admin_dashboard as admin_dashboard_summary
from services.dashboard_service import student_dashboard as student_dashboard_summary
from utils.helper import require_roles


@require_roles("ADMIN")
def admin_dashboard():
    return jsonify(admin_dashboard_summary())


@require_roles("STUDENT")
def student_dashboard():
    return jsonify(student_dashboard_summary(request.current_user["student_id"]))
