from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from .config import Config
import os

# This file inits the Flask app, sets up the database and migration tools, and registers the API routes.
# Uses App Factory pattern




db = SQLAlchemy()
migrate = Migrate()

# App Factory function
def create_app():

    # Allows multiple instances of the app to be created with different configs (e.g., for testing)

    app = Flask(__name__)
    app.config.from_object(Config)

    #CORS(app)
    ## let frotned access API
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

    print("FRONTEND_URL =", frontend_url)

    CORS(app,
         resources={r"/api/*": {"origins": [frontend_url]}},
         supports_credentials=True
    )

    db.init_app(app)
    migrate.init_app(app, db)

    # check db is bound to app before creating tables
    # create tables if they don't exist (dev only)
    with app.app_context():
        print("sqlalachemy bound ", "sqlalchemy" in app.extensions)
        try :
            db.create_all()
        except Exception as e:
            print("error creating tables ", e)




    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")


    return app
