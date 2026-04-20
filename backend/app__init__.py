from flask import Flask
from flask_cors import CORS
from .config import Config
from .extensions import db, migrate
import os

# App Factory function
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    print("FRONTEND_URL =", frontend_url)

    # Check if email is configured (for user feedback)
    mail_debug = os.getenv("MAIL_DEBUG", "").lower() in ("1", "true", "yes")
    mail_host = os.getenv("MAIL_HOST")
    if mail_debug:
        print("[MAIL] Debug mode enabled - emails will print to console")
    elif mail_host:
        mail_port = os.getenv("MAIL_PORT")
        print(f"[MAIL] SMTP configured - {mail_host}:{mail_port}")
    else:
        print("[MAIL] WARNING: Email not configured. Set MAIL_DEBUG=true or configure SMTP.")
        print("[MAIL] See EMAIL_SETUP.md for setup instructions.")

    # allow dev frontend (restrict in production)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # initialize shared extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # create tables in dev for quick dev loop
    with app.app_context():
        print("sqlalchemy bound", "sqlalchemy" in app.extensions)
        try:
            db.create_all()
        except Exception as e:
            print("error creating tables", e)

    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    return app