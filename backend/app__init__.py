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