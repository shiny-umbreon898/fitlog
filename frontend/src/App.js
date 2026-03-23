// default React app component from create-react-app
import logo from './logo.svg';
import './App.css';

// React Router component for handling navigation
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// Page Components
import Register from "./pages/Register";
import Login from "./pages/Login";
import Workouts from "./pages/Workouts";

import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";

function App() {

    // detect if user is looged in
    const userId = localStorage.getItem("user_id");

    // to log user out
    const handleLogout = () => {
        localStorage.removeItem("user_id");
        alert("Logged out successfully");
        window.location.href = "/login"; // redirect to login page
    }

    return (

        <Router /* enable nav without page refresh */ >

            <div className="App">

                <h1>Fitlog</h1>

                <nav>
                    {userId ? ( // if user is logged in, show workouts and logout links
                        <>
                            <Link to="/">Dashboard</Link>
                            <Link to="/calendar">Calendar</Link>
                            <Link to="/workouts">Workouts</Link>
                            <Link to="/profile">Profile</Link>
                            <button onClick={handleLogout}>Logout</button>
                        </>
                    ) : (   //  default links for non-logged in users
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                        </>
                    )}
                </nav>

                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/workouts" element={<Workouts />} />

                    <Route path="/" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/calendar" element={<Calendar />} />

                </Routes>

            </div>

        </Router>
    );

}

export default App;
