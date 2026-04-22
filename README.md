# Fitlog
Fitness-tracking web app (Flask backend + React frontend) for logging workouts and meals and viewing daily/weekly summaries.

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

    npm install react react-dom react-router-dom react-icons # for frontend dependencies

## Features    
    Register and log in (email + password + date of birth)
    Automatic age calculation from date of birth
    Age verification: Users must be at least 16 years old to use the app
    Save basic profile info: date of birth, sex, weight, height
    Log workouts; calories are estimated on the server using METs and the user's weight
    Log meals (calorie value supplied by user)
    See recent workouts (with timestamps and activity icons)
    View daily and weekly summaries on the Dashboard


## Age Verification & Privacy
**Important:** Fitlog stores user body metrics (weight, height, age) to provide accurate calorie burn estimates. For this reason, the app is restricted to users 16 years and older. This age requirement:
- Is enforced on both client and server side
- Is validated during account creation
- Can be updated in the profile settings
- Ensures responsible use of the app for users who are developing and conscious of health metrics

## Structure
backend/app/models.py: data models
backend/app/routes.py: REST API
frontend/src/pages: React pages and UI logic
frontend/src/App.css: centralized styling and theme


## Quick start (development)
Backend
    Create a virtualenv and install dependencies: `pip install flask flask-cors flask-sqlalchemy flask-migrate bcrypt`
    Run the backend from the backend folder:
     ```bash
     cd backend
     python run.py
     ```
The API runs at http://127.0.0.1:5000

Frontend

From the frontend folder run:
     ```bash
     npm install
     npm start
     ```
The React app runs at http://localhost:3000

## Project layout 
- backend/
  - app/
    - __init__.py : app factory, CORS and extensions
    - extensions.py : single instances of db and migrate
    - models.py : User, Workout, Meal
    - routes.py : all API endpoints (blueprint registered at `/api`)
  - run.py : starts the app in dev

- frontend/
  - src/
    - App.js : routes and navigation
    - pages/ : Register, Login, Workouts, Dashboard, Profile, Calendar
    - App.css : global styles and theme

## Data models and API
How data works (brief)
    Workouts: stored with name, duration (minutes), calculated calories (MET × weight × hours) and a timestamp (UTC). The server does the calorie calculation when you create a workout
    Meals: stored with name, calories and timestamp (UTC).
    Summaries: `/api/users/<id>/summary?period=daily|weekly` returns aggregated workout/meal calories and breakdowns used by the Dashboard 
    Age Calculation: User date_of_birth is stored in the database and age is automatically calculated. This ensures users always see their current age without manual updates

### API Endpoints (excerpt):
    POST /api/users : Register new user (requires date_of_birth, validates age >= 16)
    POST /api/users/login : Login with email and password
    GET /api/users/<id> : Get user profile (includes calculated age)
    PUT /api/users/<id> : Update user profile (sex, weight, height, date_of_birth)
    GET /api/users/<id>/summary?period=daily|weekly : Get daily/weekly workout and meal summaries

On database & schema change:
App uses SQLite by default (`sqlite:///flask_database.db`) On model changes, either:
    Delete the DB file in `backend/instance` and restart (quick but destructive)
    Or use Flask-Migrate to create and apply a migration (preserves data)

## Testing  


## Bugs
- Nav bar not changing on account login/logout (still shows Register/Login after logging in)
  but changes to correct options after refreshing the page (bug in state management, needs fixing)
- Cycling/Swimming workouts not being logged


## Additional features to consider
- Calendar view for workouts and meals (FullCalendar React component)
- Email verification and password reset confirmation
- More detailed workout logging (e.g. sets/reps for strength training)



## Notes
Authentication is minimal: the app stores user_id in localStorage. Can replace with JWT or sessions for production
MET-based calorie estimates are basic. Can later add intensity, better MET mapping, or BMR adjustments for accuracy
Use backticks ` for JavaScript variables in React components to avoid confusion with Markdown formatting
Age is automatically calculated from date_of_birth, no need for manual age field updates


