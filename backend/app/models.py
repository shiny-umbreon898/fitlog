from .extensions import db
from datetime import datetime

# USER
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Account info
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)  # Store hashed passwords
    
    # Personal info
    age = db.Column(db.Integer, nullable=True)
    sex = db.Column(db.String(10), nullable=True) # M/F
    weight = db.Column(db.Float, nullable=True)  # Weight in kg
    height = db.Column(db.Float, nullable=True)  # Height in cm
        
    # Password reset
    reset_token = db.Column(db.String(100), unique=True, nullable=True)
    token_expiry = db.Column(db.DateTime, nullable=True)
    
    def __repr__(self):
        return f"<User {self.username}>"

# WORKOUT
class Workout(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Workout type: running, cycling, swimming, etc.
    name = db.Column(db.String(80), unique=False, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # Duration in minutes
    calories = db.Column(db.Float, nullable=True)     # Calculated calories burned
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)  # Foreign key to user
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Workout {self.name}>"


# MEAL
class Meal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=False, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    calories = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)  # Foreign key to user
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Meal {self.name}>"