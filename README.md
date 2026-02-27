# fitlog
Fitness tracking web app using Flask, React and SQLAlchemy. 
The app allows users to log their workouts, view their workout history, and track their progress over time.

## Tech Stack
Backend: Flask, SQLAlchemy, Flask-Migrate, Flask-CORS
Frontend: React
Database: SQLite (for development), can be switched to PostgreSQL or MySQL for production
Architecture: App Factory pattern and Blueprints for routing

## Installation
1. Install Python 3.8 or higher (backend), and Node.js (for frontend development)
2. Clone the repository
3. Install dependancies using pip - run the following command in the terminal
	pip install flask flask-cors flask-sqlalchemy flask-migrate
	pip install bcrypt # for password hashing

	(will change to pip freeze > requirements.txt in the future for easier dependency management))


## Setup
1. Initialize the database - run the following commands in the terminal
	flask db init
	flask db migrate -m "Initial migration"
	flask db upgrade


2. Run the app - run the following commands in the terminal
	cd backend/app
	python app.py

http://127.0.0.1:5000/ local development server (default Flask port)

http://127.0.0.1:3000/ local development server (default React port)


when running, press Ctrl+C to stop the server

http://127.0.0.1:5000/api/ test endpoint to verify backend is running


# Notes
Flask-SQLAlchemy is used for database management (ORM)
Flask-Migrate is used for database migrations
Flask-CORS is used to handle Cross-Origin Resource Sharing (CORS) issues when the frontend and backend are hosted on different domains or ports.
Uses App Factory pattern to create the Flask app instance and manage configurations. This allows for better modularity and scalability of the application