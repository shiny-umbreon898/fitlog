from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# single shared extension instances used across the package
db = SQLAlchemy()
migrate = Migrate()