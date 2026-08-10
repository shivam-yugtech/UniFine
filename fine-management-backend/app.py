import logging
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from config import Config
from models.auth import init_database

from routes.student_routes import student_bp
from routes.auth_routes import auth_bp
from routes.offence_routes import offence_bp
from routes.fine_routes import fine_bp
from routes.dashboard_routes import dashboard_bp
from routes.rule_routes import rule_bp
from routes.faculty_routes import faculty_bp

app = Flask(__name__)
app.config.from_object(Config)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

CORS(app)

app.register_blueprint(student_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(offence_bp)
app.register_blueprint(fine_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(rule_bp)
app.register_blueprint(faculty_bp)

with app.app_context():
    init_database(app.config["DATABASE"])


@app.route("/")
def home():
    return jsonify({
        "project": "University Fine Management System",
        "version": "1.0",
        "status": "Backend Running Successfully"
    })


@app.route("/ui")
def frontend():
    return send_from_directory(app.static_folder, "index.html")


@app.errorhandler(HTTPException)
def handle_http_error(error):
    """Return framework and route errors in the same JSON shape as API errors."""
    return jsonify({"error": {"code": error.code, "message": error.description}}), error.code


@app.errorhandler(Exception)
def handle_unexpected_error(error):
    app.logger.exception("Unhandled application error")
    return jsonify({"error": {"code": 500, "message": "An unexpected server error occurred."}}), 500


if __name__ == "__main__":
    app.run(debug=True)
