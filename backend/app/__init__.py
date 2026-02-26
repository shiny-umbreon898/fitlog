from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from .config import Config

# This file inits the Flask app, sets up the database and migration tools, and registers the API routes.
# Uses App Factory pattern




db = SQLAlchemy()
migrate = Migrate()

# App Factory function
def create_app():

    # Allows multiple instances of the app to be created with different configs (e.g., for testing)

    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    db.init_app(app)
    migrate.init_app(app, db)

    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")


    return app
