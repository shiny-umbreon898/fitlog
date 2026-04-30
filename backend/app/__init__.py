from flask import Flask
from flask_cors import CORS
from .config import Config
from .extensions import db, migrate
import os
from sqlalchemy import inspect, text

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    print("FRONTEND_URL =", frontend_url)

    # allow only frontend origin (dev)
    CORS(app, resources={r"/api/*": {"origins": [frontend_url]}}, supports_credentials=True)

    # initialize shared extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # development: import models so SQLAlchemy knows the table metadata, then create tables if missing
    with app.app_context():
        # import models here so db.create_all() sees them
        from . import models
        print("sqlalchemy bound", "sqlalchemy" in app.extensions)
        try:
            # Create all tables if they don't exist
            db.create_all()
            
            # Handle schema migration: replace 'age' column with 'date_of_birth'
            inspector = inspect(db.engine)
            if 'user' in inspector.get_table_names():
                user_columns = [col['name'] for col in inspector.get_columns('user')]
                
                # If old 'age' column exists but not 'date_of_birth', migrate the schema
                if 'age' in user_columns and 'date_of_birth' not in user_columns:
                    print("Migrating schema: removing 'age' column and adding 'date_of_birth'...")
                    try:
                        with db.engine.begin() as connection:
                            # For SQLite, we need to use SQLite-specific syntax
                            db_url = str(db.engine.url)
                            if 'sqlite' in db_url:
                                # SQLite doesn't support DROP COLUMN directly, so we recreate
                                print("SQLite detected - will need to recreate table")
                                # Note: Full schema migration for SQLite is complex
                                # For development, recommend deleting the DB file and restarting
                                print("??  For SQLite, please delete the database file and restart the app")
                                print("   Location: backend/instance/flask_database.db")
                            else:
                                # For PostgreSQL/MySQL
                                connection.execute(text('ALTER TABLE user DROP COLUMN age'))
                                print("? Dropped 'age' column")
                    except Exception as e:
                        print(f"Schema migration note: {e}")
                        print("If using SQLite, the app may need a restart after deleting the database file")
                
                # Ensure date_of_birth and token columns exist
                if 'date_of_birth' not in user_columns:
                    print("Adding date_of_birth column to user table...")
                    with db.engine.begin() as connection:
                        connection.execute(text('ALTER TABLE user ADD COLUMN date_of_birth DATE'))
                
                if 'reset_token' not in user_columns:
                    print("Adding reset_token column to user table...")
                    with db.engine.begin() as connection:
                        connection.execute(text('ALTER TABLE user ADD COLUMN reset_token VARCHAR(100) UNIQUE'))
                
                if 'token_expiry' not in user_columns:
                    print("Adding token_expiry column to user table...")
                    with db.engine.begin() as connection:
                        connection.execute(text('ALTER TABLE user ADD COLUMN token_expiry DATETIME'))
                        
        except Exception as e:
            print("error creating tables", e)

    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    return app
