from datetime import datetime
from .__init__ import db                  

# USER
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    def __repr__(self):
        return f"<User {self.username}>"

# WORKOUT
class Workout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # Duration in minutes
    def __repr__(self):
        return f"<Workout {self.name}>"


# MEAL
class Meal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    calories = db.Column(db.Integer, nullable=False)
    def __repr__(self):
        return f"<Meal {self.name}>"

