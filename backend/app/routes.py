# This file defines the API routes for the application, including endpoints for creating, retrieving, updating, and deleting items.
from flask import Blueprint, jsonify, request
from .extensions import db
from .models import User, Workout, Meal

import bcrypt
import traceback
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
    
    Path param:
        user_id (int): user primary key
    
    Request JSON:
        age (int): Age in years (5-120)
        sex (str): Gender (Male/Female or M/F)
        weight (float): Weight in kilograms (20-500)
        height (float): Height in centimeters (50-300)
    
    Returns:
        200: Profile updated successfully
        400: Missing user or invalid data
        404: User not found
        500: Database error
    
    Validation:
        age: 5-120 years old
        sex: Male, Female, M, or F
        weight: 20-500 kg (realistic human weights)
        height: 50-300 cm (realistic human heights)
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

# Retrieve single user by ID for profile viewing
@api_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    """
    Retrieve user profile information by user_id
    
    Path param:
        user_id (int): User's unique identifier
    
    Returns:
        200: User data including id, username, email, age, sex, weight, height
        404: User not found
    """
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

@api_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    """
    Delete a user account and all associated data
    
    This is destructive and cannot be undone
    
    Path param:
        user_id (int): user primary key
    
    Returns:
        200: User deleted successfully
        404: User not found
    
    TODO: implement proper authentication and confirmation
    """
    user = User.query.get(user_id)
    if not user: return jsonify({"error": "user not found"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "user deleted"}), 200


# WORKOUT ROUTES

@api_bp.route("/workouts", methods=["POST"])
def create_workout():
    """
    Log a new workout and calculate calories burned
    
    Request JSON:
        name (str, required): Type of workout (e.g., Running, Cycling, Swimming)
        duration (int, required): Duration in minutes (1-1440 = 1 minute to 24 hours)
        user_id (int, required): User's ID who performed the workout
        timestamp (str, optional): ISO format datetime string (defaults to server time)
    
    Returns:
        201: Workout created with calculated calories
        400: Missing required fields or invalid duration
        404: User not found
        500: Database error
    
    Calorie Calculation:
        Calories are calculated using the MET formula:
        Calories = MET * user_weight_kg * (duration_minutes / 60)

    """
    data = request.get_json()

    # Validate user exists
    if not data or "user_id" not in data:
        return jsonify({"error": "user_id required"}), 400

    user = User.query.get(data["user_id"])
    if not user: return jsonify({"error": "user not found"}), 404

    # Validate required fields
    if not all(i in data for i in("name", "duration")):
        return jsonify({"error": "name and duration required"}), 400

    # Validate duration range
    try:
        duration = int(data["duration"])
        if duration <= 0 or duration > 1440:
            return jsonify({"error": "duration must be between 1 and 1440 minutes"}), 400
    except Exception:
        return jsonify({"error": "invalid duration"}), 400

    # Verify user profile is complete (needed for calorie calculation)
    if user.age is None or user.weight is None or user.height is None:
        return jsonify({"error": "user profile incomplete - age, weight and height required"}), 400

    # Determine MET value from workout name
    key = data["name"].strip().lower()
    met = MET_VALUES.get(key, None)
    if met is None:
        # matching for common variations
        if "run" in key:
            met = MET_VALUES.get("running")
        elif "cycle" in key or "bike" in key:
            met = MET_VALUES.get("cycling")
        elif "swim" in key:
            met = MET_VALUES.get("swimming")
        elif "walk" in key:
            met = MET_VALUES.get("walking")
        else:
            met = 6.0  # default moderate intensity

    # Calculate calories based on MET, user weight, and duration
    calories = estimate_calories(met, user.weight, duration)

    # Use provided timestamp or server time
    ts = None
    if "timestamp" in data:
        try:
            ts = datetime.fromisoformat(data["timestamp"])
        except Exception:
            ts = None

    workout = Workout(name=data["name"],
                      duration=duration,
                      user_id=data["user_id"],
                      calories=round(calories, 1),
                      timestamp=ts or datetime.utcnow())

    db.session.add(workout)
    db.session.commit()

    return jsonify({"id": workout.id,
                    "name": workout.name,
                    "duration": workout.duration,
                    "calories": workout.calories,
                    "timestamp": workout.timestamp.isoformat()}), 201

@api_bp.route("/users/<int:user_id>/workouts", methods=["GET"])
def get_workouts(user_id):
    """
    Retrieve all workouts for a user, sorted by most recent first.
    
    Path param:
        user_id (int): user primary key
    
    Returns:
        200: List of up to 50 most recent workouts with id, name, duration, calories, timestamp
    """
    workouts = Workout.query.filter_by(user_id=user_id).order_by(Workout.timestamp.desc()).limit(50).all()
    return jsonify([{"id": w.id, "name": w.name, "duration": w.duration, "calories": w.calories, "timestamp": w.timestamp.isoformat()} for w in workouts]), 200

@api_bp.route("/workouts/<int:workout_id>", methods=["PUT"])
def update_workout(workout_id):
    """
    Update a workout's name and/or duration
    
    Path param:
        workout_id (int): Workout primary key
    
    Request JSON (optional):
        name (str): New workout type
        duration (int): New duration in minutes (1-1440)
    
    Returns:
        200: Workout updated, calories recalculated if name/duration changed
        400: Invalid duration or missing workout
        404: Workout not found
    
    Note: If name or duration changes, calories are automatically recalculated
    """
    data = request.get_json()
    workout = Workout.query.get(workout_id)
    if not workout: return jsonify({"error": "workout not found"}), 404

    changed = False
    if "name" in data:
        workout.name = data["name"]
        changed = True
    if "duration" in data:
        try:
            dval = int(data["duration"])
            if dval <= 0 or dval > 1440:
                return jsonify({"error": "duration out of range"}), 400
            workout.duration = dval
            changed = True
        except Exception:
            return jsonify({"error": "invalid duration"}), 400

    # Recalculate calories if name or duration changed
    if changed:
        user = User.query.get(workout.user_id)
        if user and user.weight:
            key = workout.name.strip().lower()
            met = MET_VALUES.get(key) or (MET_VALUES.get("running") if "run" in key else None) or 6.0
            workout.calories = round(estimate_calories(met, user.weight, workout.duration), 1)

    db.session.commit()

    return jsonify({"id": workout.id, 
                    "name": workout.name,
                    "duration" : workout.duration,
                    "calories": workout.calories}), 200

@api_bp.route("/workouts/<int:workout_id>", methods=["DELETE"])
def delete_workout(workout_id):
    """
    Delete a workout record
    
    Path param:
        workout_id (int): Workout primary key
    
    Returns:
        200: Workout deleted successfully
        404: Workout not found
    """
    workout = Workout.query.get(workout_id)
    if not workout: return jsonify({"error": "workout not found"}), 404

    db.session.delete(workout)
    db.session.commit()

    return jsonify({"message": "workout deleted"}), 200

# MEAL ROUTES


@api_bp.route("/meals", methods=["POST"])
def create_meal():
    """
    Log a meal with calorie information
    
    Request JSON:
        name (str, required): Meal description (e.g., "Chicken & Rice")
        calories (int, required): Estimated calories (0-20000)
        user_id (int, required): User's ID who consumed the meal 
        timestamp (str, optional): ISO format datetime string (defaults to server time)
    
    Returns:
        201: Meal created successfully
        400: Missing required fields or invalid calories
        404: User not found
    """
    data = request.get_json()
    if not data or not all(k in data for k in ("name", "calories", "user_id")):
        return jsonify({"error": "name, calories and user_id required"}), 400

    try:
        calories = int(data["calories"])
        if calories < 0 or calories > 20000:
            return jsonify({"error": "calories out of range"}), 400
    except Exception:
        return jsonify({"error": "invalid calories"}), 400

    user = User.query.get(data["user_id"])
    if not user: return jsonify({"error": "user not found"}), 404

    ts = None
    if "timestamp" in data:
        try:
            ts = datetime.fromisoformat(data["timestamp"])
        except Exception:
            ts = None

    meal = Meal(name=data["name"], calories=calories, user_id=data["user_id"], timestamp=ts or datetime.utcnow())
    db.session.add(meal)
    db.session.commit()
    return jsonify({"id": meal.id, "name": meal.name, "calories": meal.calories, "timestamp": meal.timestamp.isoformat()}), 201


@api_bp.route("/users/<int:user_id>/meals", methods=["GET"])
def get_meals(user_id):
    """
    Retrieve all meals for a user, sorted by most recent first
    
    Path param:
        user_id (int): user primary key
    
    Returns:
        200: List of up to 50 most recent meals with id, name, calories, timestamp
    """
    meals = Meal.query.filter_by(user_id=user_id).order_by(Meal.timestamp.desc()).limit(50).all()
    return jsonify([{"id": m.id, "name": m.name, "calories": m.calories, "timestamp": m.timestamp.isoformat()} for m in meals]), 200


# SUMMARY/ANALYTICS ROUTES


@api_bp.route('/users/<int:user_id>/summary', methods=['GET'])
def user_summary(user_id):
    """
    Get daily or weekly summary of workouts and meals with calorie breakdowns
    
    Path param:
        user_id (int): user primary key
    
    Query params:
        period (str, optional): 'daily' or 'weekly' (default: 'daily')
    
    Returns:
        200: Summary with totals and breakdowns
        404: User not found
    
    DAILY RESPONSE:
        {
            "period": "daily",
            "date": "2024-01-15",
            "total_workout_calories": 500.5,
            "total_meal_calories": 2000,
            "workouts_count": 2,
            "meals_count": 5,
            "hourly_breakdown": [
                {"hour": 0, "workout_calories": 0, "meal_calories": 0},
                ...
                {"hour": 23, "workout_calories": 500.5, "meal_calories": 400}
            ]
        }
    
    WEEKLY RESPONSE:
        {
            "period": "weekly",
            "start_date": "2024-01-08",
            "end_date": "2024-01-14",
            "total_workout_calories": 3200.5,
            "total_meal_calories": 14000,
            "day_breakdown": [
                {"date": "2024-01-08", "workout_calories": 400, "meal_calories": 2000, ...},
                ...
            ]
        }
    """
    period = request.args.get('period', 'daily')

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'user not found'}), 404

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    if period == 'weekly':
        # Aggregate last 7 days
        start = today_start - timedelta(days=6)
        day_totals = []
        total_workout_cal = 0.0
        total_meal_cal = 0
        for i in range(7):
            day = start + timedelta(days=i)
            next_day = day + timedelta(days=1)
            workouts = Workout.query.filter(Workout.user_id == user_id, Workout.timestamp >= day, Workout.timestamp < next_day).all()
            meals = Meal.query.filter(Meal.user_id == user_id, Meal.timestamp >= day, Meal.timestamp < next_day).all()
            w_cal = sum((w.calories or 0) for w in workouts)
            m_cal = sum((m.calories or 0) for m in meals)
            total_workout_cal += w_cal
            total_meal_cal += m_cal
            day_totals.append({
                'date': day.date().isoformat(),
                'workout_calories': round(w_cal,1),
                'meal_calories': int(m_cal),
                'workouts': len(workouts),
                'meals': len(meals)
            })

        return jsonify({
            'period': 'weekly',
            'start_date': start.date().isoformat(),
            'end_date': now.date().isoformat(),
            'total_workout_calories': round(total_workout_cal,1),
            'total_meal_calories': int(total_meal_cal),
            'day_breakdown': day_totals
        }), 200

    # Daily summary (default)
    start = today_start
    end = start + timedelta(days=1)
    workouts = Workout.query.filter(Workout.user_id == user_id, Workout.timestamp >= start, Workout.timestamp < end).all()
    meals = Meal.query.filter(Meal.user_id == user_id, Meal.timestamp >= start, Meal.timestamp < end).all()
    total_workout_cal = sum((w.calories or 0) for w in workouts)
    total_meal_cal = sum((m.calories or 0) for m in meals)

    # hourly breakdown (0-23)
    hourly = []
    for hour in range(24):
        h_start = start + timedelta(hours=hour)
        h_end = h_start + timedelta(hours=1)
        w_cal = sum((w.calories or 0) for w in Workout.query.filter(Workout.user_id == user_id, Workout.timestamp >= h_start, Workout.timestamp < h_end).all())
        m_cal = sum((m.calories or 0) for m in Meal.query.filter(Meal.user_id == user_id, Meal.timestamp >= h_start, Meal.timestamp < h_end).all())
        hourly.append({'hour': hour, 'workout_calories': round(w_cal,1), 'meal_calories': int(m_cal)})

    return jsonify({
        'period': 'daily',
        'date': start.date().isoformat(),
        'total_workout_calories': round(total_workout_cal,1),
        'total_meal_calories': int(total_meal_cal),
        'workouts_count': len(workouts),
        'meals_count': len(meals),
        'hourly_breakdown': hourly
    }), 200
