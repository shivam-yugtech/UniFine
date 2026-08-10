from flask import Blueprint
from controllers.fine_controller import dashboard_analytics, fine_status, fines, multiple_fines

fine_bp = Blueprint("fine", __name__)
fine_bp.route("/fines", methods=["GET", "POST"])(fines)
fine_bp.route("/fines/<int:fine_id>/status", methods=["PATCH"])(fine_status)
fine_bp.route("/fines/multiple", methods=["POST"])(multiple_fines)
fine_bp.route("/analytics", methods=["GET"])(dashboard_analytics)
