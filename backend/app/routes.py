# This file defines the API routes for the application, including endpoints for creating, retrieving, updating, and deleting items.
from flask import Blueprint, jsonify, request
from . import db
from .models import User, Workout, Meal

import bcrypt # For password hashing

api_bp = Blueprint("api", __name__)

## TODO: Add authentication routes (register, login, logout) and CRUD routes for workouts and meals.
## TODO: Add JWT authentication for protected routes and user sessions

## Base route
@api_bp.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Welcome to FITLOG API"})


## Example route to test API is working
@api_bp.route("/hello", methods=["GET"])
def hello():
    return jsonify({"message": "Hello, World"})


## Routes for User Authentication (Register, Login, Logout)

## Register a new user
@api_bp.route("/users", methods=["POST"])
def create_user():

    # Create a new user with the provided username, email and password. The password should be hashed before storing in the database.
    # Expected JSON body: {"username": "aaron", "email": "aaron@email.com", password": "password123"}

    data = request.get_json()

    # Validate input
    if not data or not all(i in data for i in("username", "email", "password")):
        return jsonify({"error": "username, email and password required"}), 400

    # TODO: add additional validation for email format, password strength, and check for existing username/email in the database before creating a new user

    # Password hashing using bcrypt before storing in the database
    hashed_password = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode("utf-8") # decode before storing since bcrypt returns bytes

    user = User(username=data["username"],
                email=data["email"],
                password=hashed_password)

    db.session.add(user)
    db.session.commit()

    return jsonify({"id": user.id, 
                    "username": user.username,
                    "email" : user.email}), 201

## Retrieve single user by email for login
@api_bp.route("/users/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data or not all(i in data for i in("email", "password")):
        return jsonify({"error": "email and password required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not bcrypt.checkpw(data["password"].encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({"error": "invalid email or password"}), 401

    return jsonify({"message": "login successful", "user_id": user.id}), 200


# Retrieve single user by ID for profile viewing
@api_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):

    ## TODO: add authentication to ensure only the user themselves or an admin can view the user profile

    user = User.query.get(user_id)
    if not user:  return jsonify({"error": "User not found"}), 404

    return jsonify({"id": user.id, 
                    "username": user.username,
                    "email" : user.email}), 200

## Delete user by ID
@api_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):

    ## TODO: add authentication to ensure only the user themselves or an admin can delete the user account
    ## TODO: add cascading delete to remove all associated workouts and meals when a user is deleted
    ## TODO: add password verification before allowing deletion of user account if user is deleting their own account
    
    user = User.query.get(user_id)
    if not user: return jsonify({"error": "user not found"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "user deleted"}), 200


## Workout Routes

## Create a new workout
@api_bp.route("/workouts", methods=["POST"])
def create_workout():

    data = request.get_json()

    # Check user exists before creating workout
    user = User.query.get(data["user_id"])
    if not user: return jsonify({"error": "user not found"}), 404

    # Validate input
    if not data or not all(i in data for i in("name", "duration")):
        return jsonify({"error": "name and duration required"}), 400

    workout = Workout(name=data["name"],
                      duration=data["duration"],
                      user_id=data["user_id"])

    db.session.add(workout)
    db.session.commit()

    return jsonify({"id": workout.id, 
                    "name": workout.name,
                    "duration" : workout.duration}), 201

## Retrieve all workouts for a user
@api_bp.route("/users/<int:user_id>/workouts", methods=["GET"])
def get_workouts(user_id):

    workouts = Workout.query.filter_by(user_id=user_id).all()

    return jsonify([{"id": w.id, "name": w.name, "duration": w.duration} for w in workouts]), 200


## Update a workout by ID
@api_bp.route("/workouts/<int:workout_id>", methods=["PUT"])
def update_workout(workout_id):

    data = request.get_json()
    workout = Workout.query.get(workout_id)
    if not workout: return jsonify({"error": "workout not found"}), 404

    if "name" in data: workout.name = data["name"]
    if "duration" in data: workout.duration = data["duration"]

    db.session.commit()

    return jsonify({"id": workout.id, 
                    "name": workout.name,
                    "duration" : workout.duration}), 200

## Delete a workout by ID
@api_bp.route("/workouts/<int:workout_id>", methods=["DELETE"])
def delete_workout(workout_id):

    workout = Workout.query.get(workout_id)
    if not workout: return jsonify({"error": "workout not found"}), 404

    db.session.delete(workout)
    db.session.commit()

    return jsonify({"message": "workout deleted"}), 200