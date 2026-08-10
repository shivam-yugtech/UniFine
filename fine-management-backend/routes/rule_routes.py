from flask import Blueprint
from controllers.rule_controller import rule_detail, rules

rule_bp = Blueprint("rule", __name__)
rule_bp.route("/rules", methods=["GET", "POST"])(rules)
rule_bp.route("/rules/<int:rule_id>", methods=["PATCH", "DELETE"])(rule_detail)
