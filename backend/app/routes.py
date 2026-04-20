# This file defines the API routes for the application, including endpoints for creating, retrieving, updating, and deleting items.
from flask import Blueprint, jsonify, request
from .extensions import db
from .models import User, Workout, Meal

import bcrypt
import traceback
import secrets
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta

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
    data = request.get_json()
    if not data or not all(k in data for k in ("username", "email", "password")):
        return jsonify({"error": "username, email and password required"}), 400

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "username already exists"}), 409
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "email already exists"}), 409

    hashed_password = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(username=data["username"], email=data["email"], password=hashed_password)

    db.session.add(user)
    try:
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
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


# USER PROFILE ROUTES

@api_bp.route("/users/<int:user_id>", methods=["PUT"]) 
def update_user(user_id):
    data = request.get_json()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    if "age" in data:
        user.age = data["age"]
    if "sex" in data:
        user.sex = data["sex"]
    if "weight" in data:
        user.weight = data["weight"]
    if "height" in data:
        user.height = data["height"]

    db.session.commit()
    return jsonify({"message": "profile updated"}), 200

@api_bp.route("/users/<int:user_id>", methods=["GET"]) 
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email" : user.email,
        "age": user.age,
        "sex": user.sex,
        "weight": user.weight,
        "height": user.height
    }), 200

@api_bp.route("/users/<int:user_id>", methods=["DELETE"]) 
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user: return jsonify({"error": "user not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "user deleted"}), 200


# WORKOUT ROUTES

@api_bp.route("/workouts", methods=["POST"])
def create_workout():
    data = request.get_json()
    user = User.query.get(data.get("user_id"))
    if not user: return jsonify({"error": "user not found"}), 404

    duration = int(data["duration"])
    key = data["name"].strip().lower()
    met = MET_VALUES.get(key, 6.0)

    calories = estimate_calories(met, user.weight, duration)
    workout = Workout(
        name=data["name"],
        duration=duration,
        user_id=data["user_id"],
        calories=round(calories, 1),
        timestamp=datetime.utcnow()
    )

    db.session.add(workout)
    db.session.commit()
    return jsonify({"message": "workout created", "calories": workout.calories}), 201

@api_bp.route("/users/<int:user_id>/workouts", methods=["GET"])
def get_workouts(user_id):
    workouts = Workout.query.filter_by(user_id=user_id).order_by(Workout.timestamp.desc()).all()
    return jsonify([{"id": w.id, "name": w.name, "duration": w.duration, "calories": w.calories, "timestamp": w.timestamp.isoformat()} for w in workouts]), 200


# MEAL ROUTES

@api_bp.route("/meals", methods=["POST"])
def create_meal():
    data = request.get_json()
    meal = Meal(name=data["name"], calories=data["calories"], user_id=data["user_id"], timestamp=datetime.utcnow())
    db.session.add(meal)
    db.session.commit()
    return jsonify({"message": "meal created"}), 201

@api_bp.route("/users/<int:user_id>/meals", methods=["GET"])
def get_meals(user_id):
    meals = Meal.query.filter_by(user_id=user_id).order_by(Meal.timestamp.desc()).all()
    return jsonify([{"id": m.id, "name": m.name, "calories": m.calories, "timestamp": m.timestamp.isoformat()} for m in meals]), 200


# SUMMARY ROUTE (Daily / Weekly) - used by frontend Dashboard
@api_bp.route('/users/<int:user_id>/summary', methods=['GET'])
def user_summary(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    period = request.args.get('period', 'daily')
    now = datetime.utcnow()

    if period == 'daily':
        # start of today (UTC)
        start = datetime(now.year, now.month, now.day)
        end = start + timedelta(days=1)

        workouts = Workout.query.filter(Workout.user_id==user_id, Workout.timestamp>=start, Workout.timestamp<end).all()
        meals = Meal.query.filter(Meal.user_id==user_id, Meal.timestamp>=start, Meal.timestamp<end).all()

        workouts_count = len(workouts)
        total_workout_calories = sum((w.calories or 0) for w in workouts)
        meals_count = len(meals)
        total_meal_calories = sum((m.calories or 0) for m in meals)

        # hourly breakdown for 24 hours (0-23)
        hourly = []
        for hour in range(24):
            h_start = start + timedelta(hours=hour)
            h_end = h_start + timedelta(hours=1)
            w_sum = sum((w.calories or 0) for w in workouts if h_start <= w.timestamp < h_end)
            m_sum = sum((m.calories or 0) for m in meals if h_start <= m.timestamp < h_end)
            hourly.append({"hour": hour, "workout_calories": round(w_sum, 1), "meal_calories": int(m_sum)})

        return jsonify({
            "period": "daily",
            "date": start.strftime('%Y-%m-%d'),
            "workouts_count": workouts_count,
            "total_workout_calories": round(total_workout_calories, 1),
            "meals_count": meals_count,
            "total_meal_calories": int(total_meal_calories),
            "hourly_breakdown": hourly
        }), 200

    elif period == 'weekly':
        # 7-day window ending today (inclusive)
        end = datetime(now.year, now.month, now.day) + timedelta(days=1)
        start = end - timedelta(days=7)

        workouts = Workout.query.filter(Workout.user_id==user_id, Workout.timestamp>=start, Workout.timestamp<end).all()
        meals = Meal.query.filter(Meal.user_id==user_id, Meal.timestamp>=start, Meal.timestamp<end).all()

        total_workout_calories = sum((w.calories or 0) for w in workouts)
        total_meal_calories = sum((m.calories or 0) for m in meals)

        # daily breakdown for each day in window
        day_breakdown = []
        for d in range(7):
            day_start = start + timedelta(days=d)
            day_end = day_start + timedelta(days=1)
            w_sum = sum((w.calories or 0) for w in workouts if day_start <= w.timestamp < day_end)
            m_sum = sum((m.calories or 0) for m in meals if day_start <= m.timestamp < day_end)
            day_breakdown.append({"date": day_start.strftime('%Y-%m-%d'), "workout_calories": round(w_sum, 1), "meal_calories": int(m_sum)})

        return jsonify({
            "period": "weekly",
            "start_date": start.strftime('%Y-%m-%d'),
            "end_date": (end - timedelta(days=1)).strftime('%Y-%m-%d'),
            "total_workout_calories": round(total_workout_calories, 1),
            "total_meal_calories": int(total_meal_calories),
            "day_breakdown": day_breakdown
        }), 200

    else:
        return jsonify({"error": "invalid period"}), 400


# PASSWORD RESET ROUTES
# These match the /api/users/ pattern used in your frontend

@api_bp.route('/users/forgot-password', methods=['POST', 'OPTIONS'])
def forgot_password():
    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight successful"}), 200

    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    
    if user is None:
        return jsonify({"error": "No user with that email"}), 404
    
    token = secrets.token_hex(16)
    user.reset_token = token
    user.token_expiry = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()

    
    print(f"RESET LINK: http://localhost:3000/reset-password/{token}")
    
    
    return jsonify({"message": "Token generated", "token": token}), 200

@api_bp.route('/users/reset-password/<token>', methods=['POST', 'OPTIONS'])
def reset_password(token):
    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight successful"}), 200

    data = request.get_json()
    new_password = data.get('password')
    user = User.query.filter_by(reset_token=token).first()
    
    if user and user.token_expiry > datetime.utcnow():
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(new_password.encode('utf-8'), salt)
        user.password = hashed.decode('utf-8')
        user.reset_token = None
        user.token_expiry = None
        db.session.commit()
        return jsonify({"message": "Password updated successfully"}), 200
            
    return jsonify({"error": "Invalid or expired link"}), 400