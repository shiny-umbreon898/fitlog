// default React app component from create-react-app
import logo from './logo.svg';
import './App.css';

// React Router component for handling navigation
import { BrowserRouter as Router, Routes, Route, Link, Switch } from "react-router-dom";

// Page Components
import Register from "./pages/Register";
import Login from "./pages/Login";
import Workouts from "./pages/Workouts";

// import Dashboard from "./pages/Dashboard";
// import Profile from "./pages/Profile";



function App() {
    return (

        <Router /* enable nav without page refresh */ >

            <div className="App">

                <h1>Fitlog</h1>

                <nav>
                    <Link to="/register">Register</Link>
                    <Link to="/login">Login</Link>
                    <Link to="/workouts">Workouts</Link>
                </nav>

                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/workouts" element={<Workouts />} />
                </Routes>

            </div>

        </Router>
    );

}

export default App;
