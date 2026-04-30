// react hook for managing form state
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {

    // local development and production
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirm_password: "",
        date_of_birth: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    // Calculate age from date of birth for client-side validation
    const calculateAge = (dateString) => {
        if (!dateString) return null;
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // runs when user types in form fields and updates form state
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };


    // runs when user submits form and sends a POST request to backend to register user
    const handleSubmit = async (e) => {


        e.preventDefault();  // prevent page refresh

        // client-side validation
        setError("");

        // validate date of birth is provided
        if (!form.date_of_birth) {
            setError("Date of birth is required");
            return;
        }

        // validate age is 16 or older
        const age = calculateAge(form.date_of_birth);
        if (age === null || age < 16) {
            setError("You must be at least 16 years old to use this app");
            return;
        }

        // validate password match
        if (form.password !== form.confirm_password) {
            setError("Passwords do not match");
            return;
        }

        try {
            console.log("Sending:", form);
            console.log("URL:", `${API_URL}/api/users`);

            // send POST request to flask backend
            const response = await fetch(`${API_URL}/api/users`, {
                method: "POST",

                headers: { "Content-Type": "application/json" },

                body: JSON.stringify({
                    username: form.username,
                    email: form.email,
                    password: form.password,
                    date_of_birth: form.date_of_birth,
                }),
            });


            const data = await response.json();
            

            if (response.ok) {
                alert("Registration successful! Please log in.");
                //window.location.href = "/login"; // redirect to login page

                navigate("/login");

            } else {
                setError(data.error || data.message || "Registration failed");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
            console.error(err);
        }
    
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-container">
                <h1>Register</h1>
                <p style={{color: "#666", fontSize: "14px", marginTop: "-10px"}}>
                    Join Fitlog and start tracking your fitness journey. You must be at least 16 years old.
                </p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={form.username}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="date"
                        name="date_of_birth"
                        placeholder="Date of Birth"
                        value={form.date_of_birth}
                        onChange={handleChange}
                        required
                        max={new Date().toISOString().split('T')[0]}
                    />
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}

                        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                        title="Must be 8 or more characters long and contain at least one uppercase and lowercase letter and a number"
                        required
                    />

                    <input
                        type={showPassword ? "text" : "password"}
                        name="confirm_password"
                        placeholder="Confirm Password"
                        value={form.confirm_password}
                        onChange={handleChange}

                        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                        title="Must be 8 or more characters long and contain at least one uppercase and lowercase letter and a number"
                        required
                    />

                    {/*toggle password visibility*/}
                    <div className="password-toggle">
                        <input
                            type="checkbox"
                            id="show-password"
                            onChange={() => setShowPassword(!showPassword)}
                        />
                        <label htmlFor="show-password">Show Password</label>
                    </div>

                    {error && <p className="auth-error">{error}</p>}
                    <button type="submit">Register</button>
                </form>
            </div>
        </div>
    );

}


export default Register;
