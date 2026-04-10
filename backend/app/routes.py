# This file defines the API routes for the application, including endpoints for creating, retrieving, updating, and deleting items.
from flask import Blueprint, jsonify, request
from .extensions import db
from .models import User, Workout, Meal

import bcrypt
import traceback
from sqlalchemy.exc import IntegrityError

api_bp = Blueprint("api", __name__)

# MET values approximate for activities per compendium
MET_VALUES = {
    'running': 9.8,
    'cycling': 7.5,
    'swimming': 6.0,
    'walking': 3.5,
    'hiking': 6.0,
    'yoga': 3.0,
    'strength': 6.0,
    # default
}


def estimate_calories(met, weight_kg, duration_minutes):
    # calories = MET * weight_kg * duration_hours
    return met * weight_kg * (duration_minutes / 60.0)


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

# Update user info by ID - update to add age, sex, height, weight fields
@api_bp.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "no data provided"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    # Accept and coerce these fields
    if "age" in data:
        try:
            user.age = None if data["age"] in (None, "") else int(data["age"])
        except (ValueError, TypeError):
            return jsonify({"error": "invalid value for age"}), 400

    if "sex" in data:
        # store as-is; consider normalizing to 'Male'/'Female' or 'M'/'F' if needed
        user.sex = data["sex"]

    if "weight" in data:
        try:
            user.weight = None if data["weight"] in (None, "") else float(data["weight"])
        except (ValueError, TypeError):
            return jsonify({"error": "invalid value for weight"}), 400

    if "height" in data:
        try:
            user.height = None if data["height"] in (None, "") else float(data["height"])
        except (ValueError, TypeError):
            return jsonify({"error": "invalid value for height"}), 400

    try:
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
        print("Exception during user update commit:", ex)
        traceback.print_exc()
        return jsonify({"error": "internal_server_error", "detail": str(ex)}), 500

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "age": user.age,
        "sex": user.sex,
        "weight": user.weight,
        "height": user.height
    }), 200

# Retrieve single user by ID for profile viewing
@api_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"id": user.id, 
                    "username": user.username,
                    "email" : user.email,
                    "age": user.age,
                    "sex": user.sex,
                    "weight": user.weight,
                    "height": user.height}), 200

## Delete user by ID
@api_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
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
    if not data or "user_id" not in data:
        return jsonify({"error": "user_id required"}), 400

    user = User.query.get(data["user_id"])
    if not user: return jsonify({"error": "user not found"}), 404

    # Validate input
    if not all(i in data for i in("name", "duration")):
        return jsonify({"error": "name and duration required"}), 400

    # Optional server-side check for profile completeness
    if user.age is None or user.weight is None or user.height is None:
        return jsonify({"error": "user profile incomplete - age, weight and height required"}), 400

    # determine MET from workout name
    key = data["name"].strip().lower()
    met = MET_VALUES.get(key, None)
    if met is None:
        # try simple mapping
        if "run" in key:
            met = MET_VALUES.get("running")
        elif "cycle" in key or "bike" in key:
            met = MET_VALUES.get("cycling")
        elif "swim" in key:
            met = MET_VALUES.get("swimming")
        elif "walk" in key:
            met = MET_VALUES.get("walking")
        else:
            met = 6.0

    calories = estimate_calories(met, user.weight, data["duration"])

    workout = Workout(name=data["name"],
                      duration=data["duration"],
                      user_id=data["user_id"],
                      calories=round(calories, 1))

    db.session.add(workout)
    db.session.commit()

    return jsonify({"id": workout.id, 
                    "name": workout.name,
                    "duration" : workout.duration,
                    "calories": workout.calories}), 201

## Retrieve all workouts for a user
@api_bp.route("/users/<int:user_id>/workouts", methods=["GET"])
def get_workouts(user_id):
    workouts = Workout.query.filter_by(user_id=user_id).order_by(Workout.id.desc()).limit(20).all()
    return jsonify([{"id": w.id, "name": w.name, "duration": w.duration, "calories": w.calories} for w in workouts]), 200

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