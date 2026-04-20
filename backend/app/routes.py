# This file defines the API routes for the application, including endpoints for creating, retrieving, updating, and deleting items.
from flask import Blueprint, jsonify, request
from .extensions import db
from .models import User, Workout, Meal

import bcrypt
import traceback
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
from .email import send_welcome_email_async

api_bp = Blueprint("api", __name__)


# CALORIE CALCULATION DOCUMENTATION

# 
# Calories burned during exercise are calculated using the MET (Metabolic Equivalent of Task) method:
#
# Formula: Calories = MET * Weight (kg) * Duration (hours)
#
# MET VALUE: Represents the ratio of metabolic rate during an activity to the resting metabolic rate.
#   MET = 1.0 is at rest
#   MET > 1.0 indicates energy expenditure above resting
#   Higher MET values = more intense/demanding activities
#
# EXAMPLES:
#   Walking (3.5 MET): Low intensity, casual pace
#   Running (9.8 MET): High intensity, significant calorie burn
#   Cycling (7.5 MET): Moderate-high intensity
#   Swimming (6.0 MET): Full-body engagement, water resistance
#
# EXAMPLE CALCULATION:
#   User: 70 kg, 30-minute running session
#   Calories = 9.8 (running MET) * 70 (kg) * 0.5 (hours)
#   Calories = 343 kcal burned
#
# LIMITATIONS:
#   Does not account for age, sex, fitness level, or intensity variations
#   MET values are generalized averages
#   Individual results vary based on metabolism
#

# MET values (Metabolic Equivalent of Task) for different activities
# Based on Compendium of Physical Activities
MET_VALUES = {
    'running': 9.8,      # vigorous running intensity
    'cycling': 7.5,      # moderate cycling
    'swimming': 6.0,     # general swimming
    'walking': 3.5,      # casual walking
    'hiking': 6.0,       # trail hiking with elevation
    'yoga': 3.0,         # gentle yoga practice
    'strength': 6.0,     # weight lifting / resistance training
}


def estimate_calories(met, weight_kg, duration_minutes):
    """
    Calculate calories burned based on MET, weight, and duration.
    
    Args:
        met (float): Metabolic Equivalent of Task value
        weight_kg (float): User's weight in kilograms
        duration_minutes (int): Exercise duration in minutes
    
    Returns:
        float: Estimated calories burned, rounded to 1 decimal place
    
    Formula: calories = MET * weight_kg * (duration_minutes / 60)
    """
    try:
        return met * weight_kg * (duration_minutes / 60.0)
    except Exception:
        return 0.0


# USER AUTHENTICATION ROUTES

@api_bp.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Welcome to FITLOG API"})

@api_bp.route("/hello", methods=["GET"])
def hello():
    return jsonify({"message": "Hello, World"})

@api_bp.route("/users", methods=["POST"])
def create_user():
    """
    Register a new user account
    
    Request JSON:
        username (str, required): Unique username
        email (str, required): Unique email address
        password (str, required): Plaintext password (will be hashed with bcrypt)
    
    Returns:
        201: User created successfully with id, username, email
        400: Missing required fields
        409: Username or email already exists
        500: Database error
    """
    data = request.get_json()
    if not data or not all(k in data for k in ("username", "email", "password")):
        return jsonify({"message": "username, email and password required"}), 400

    # log incoming request for troubleshooting
    try:
        print(f"[API] create_user called with username={data.get('username')} email={data.get('email')}")
    except Exception:
        pass

    # check uniqueness before commit
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"message": "username already exists"}), 409
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "email already exists"}), 409

    hashed_password = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(username=data["username"], email=data["email"], password=hashed_password)

    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError as ie:
        db.session.rollback()
        print("IntegrityError during commit:", ie)
        traceback.print_exc()
        return jsonify({"message": "username or email already exists", "detail": str(ie)}), 409
    except Exception as ex:
        db.session.rollback()
        print("Exception during db.session.commit():", ex)
        traceback.print_exc()
        return jsonify({"message": "internal_server_error", "detail": str(ex)}), 500

    # send welcome email asynchronously (safe to fail)
    try:
        send_welcome_email_async(user.email, user.username)
    except Exception as e:
        print("Failed to trigger welcome email:", e)

    return jsonify({"id": user.id, "username": user.username, "email": user.email}), 201

@api_bp.route("/users/login", methods=["POST"])
def login():
    """
    Authenticate user and return user_id for client-side session.
    
    Request JSON:
        email (str, required): User's email
        password (str, required): User's password (plaintext, will be checked against hash)
    
    Returns:
        200: Login successful with user_id
        400: Missing email or password
        401: Invalid credentials

    """
    data = request.get_json()
    if not data or not all(k in data for k in ("email", "password")):
        return jsonify({"error": "email and password required"}), 400

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not bcrypt.checkpw(data["password"].encode("utf-8"), user.password.encode("utf-8")):
        return jsonify({"error": "invalid email or password"}), 401

    return jsonify({"message": "login successful", "user_id": user.id}), 200


# USER PROFILE ROUTES

@api_bp.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    """
    Update user profile information.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "no data provided"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    # Validate and update each field with range checks
    if "age" in data:
        try:
            age_val = None if data["age"] in (None, "") else int(data["age"])
            if age_val is not None and (age_val < 5 or age_val > 120):
                return jsonify({"error": "age out of range"}), 400
            user.age = age_val
        except (ValueError, TypeError):
            return jsonify({"error": "invalid value for age"}), 400

    if "sex" in data:
        s = str(data["sex"]).strip()
        if s and s.lower() not in ("male", "female", "m", "f"):
            return jsonify({"error": "sex must be Male or Female"}), 400
        user.sex = data["sex"]

    if "weight" in data:
        try:
            w_val = None if data["weight"] in (None, "") else float(data["weight"])
            if w_val is not None and (w_val < 20 or w_val > 500):
                return jsonify({"error": "weight out of range"}), 400
            user.weight = w_val
        except (ValueError, TypeError):
            return jsonify({"error": "invalid value for weight"}), 400

    if "height" in data:
        try:
            h_val = None if data["height"] in (None, "") else float(data["height"])
            if h_val is not None and (h_val < 50 or h_val > 300):
                return jsonify({"error": "height out of range"}), 400
            user.height = h_val
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