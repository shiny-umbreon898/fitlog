# This file defines the API routes for the application, including endpoints for creating, retrieving, updating, and deleting items.
from flask import Blueprint, jsonify, request
from .extensions import db
from .models import User, Workout, Meal

import bcrypt
import traceback
from sqlalchemy.exc import IntegrityError

api_bp = Blueprint("api", __name__)

@api_bp.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Welcome to FITLOG API"})

@api_bp.route("/hello", methods=["GET"])
def hello():
    return jsonify({"message": "Hello, World"})

@api_bp.route("/users", methods=["POST"])
def create_user():
    data = request.get_json()
    if not data or not all(k in data for k in ("username", "email", "password")):
        return jsonify({"error": "username, email and password required"}), 400

    # check uniqueness before commit
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "username already exists"}), 409
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "email already exists"}), 409

    hashed_password = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(username=data["username"], email=data["email"], password=hashed_password)

    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError as ie:
        db.session.rollback()
        print("IntegrityError during commit:", ie)
        traceback.print_exc()
        return jsonify({"error": "integrity_error", "detail": str(ie)}), 409
    except Exception as ex:
        db.session.rollback()
        print("Exception during db.session.commit():", ex)
        traceback.print_exc()
        return jsonify({"error": "internal_server_error", "detail": str(ex)}), 500

    return jsonify({"id": user.id, "username": user.username, "email": user.email}), 201

@api_bp.route("/users/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not all(k in data for k in ("email", "password")):
        return jsonify({"error": "email and password required"}), 400

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not bcrypt.checkpw(data["password"].encode("utf-8"), user.password.encode("utf-8")):
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