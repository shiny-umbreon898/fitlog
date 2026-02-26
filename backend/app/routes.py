# This file defines the API routes for the application, including endpoints for creating, retrieving, updating, and deleting items.
from flask import Blueprint, jsonify, request
from . import db
from .models import User, Workout, Meal

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
    data = request.get_json()
    user = User(username=data["username"])
    db.session.add(user)
    db.session.commit()
    return jsonify({"id": user.id, "username": user.username})



## CRUD operations for items in the database.
## Add


## Retrieve All Items


## Retrieve Single Item



## Update



## Delete

