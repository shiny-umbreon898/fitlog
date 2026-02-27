# This file defines the API routes for the application, including endpoints for creating, retrieving, updating, and deleting items.
from flask import Blueprint, jsonify, request
from . import db
from .models import User, Workout, Meal

import bcrypt # For password hashing

api_bp = Blueprint("api", __name__)

## TODO: Add authentication routes (register, login, logout) and CRUD routes for workouts and meals.

## Base route
@api_bp.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Welcome to FITLOG API"})


## Example route to test API is working
@api_bp.route("/hello", methods=["GET"])
def hello():
    return jsonify({"message": "Hello, World"})


## Routes for User Authentication (Register, Login, Logout)

@api_bp.route("/users", methods=["POST"])
def create_user():

    # Create a new user with the provided username, email and password. The password should be hashed before storing in the database.
    # Expected JSON body: {"username": "aaron", "email": "aaron@email.com", password": "password123"}

    data = request.get_json()

    # Validate input
    if not data or not all(i in data for i in("username", "email", "password")):
        return jsonify({"error": "username, email and password required"}), 400

    # Password hashing using bcrypt before storing in the database
    hashed_password = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())

    user = User(username=data["username"],
                email=data["email"],
                password=hashed_password)

    db.session.add(user)
    db.session.commit()

    return jsonify({"id": user.id, 
                    "username": user.username,
                    "email" : user.email}), 201



## CRUD operations for items in the database.
## Add


## Retrieve All Items


## Retrieve Single Item



## Update



## Delete

