from .extensions import db

# USER
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Account info
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)  # Store hashed passwords
    
    # Personal info
    age = db.Column(db.Integer, nullable=True)
    weight = db.Column(db.Float, nullable=True)  # Weight in kg
    height = db.Column(db.Float, nullable=True)  # Height in cm
        
    def __repr__(self):
        return f"<User {self.username}>"

# WORKOUT
class Workout(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Workout type: running, cycling, swimming, etc.
    name = db.Column(db.String(80), unique=True, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # Duration in minutes
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)  # Foreign key to user
    def __repr__(self):
        return f"<Workout {self.name}>"


# MEAL
class Meal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    calories = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)  # Foreign key to user
    def __repr__(self):
        return f"<Meal {self.name}>"

