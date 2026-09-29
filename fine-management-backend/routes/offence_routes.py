from flask import Blueprint
from controllers.offence_controller import offences

offence_bp = Blueprint("offence", __name__)
offence_bp.route("/offences", methods=["GET", "POST"])(offences)
