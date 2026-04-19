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
    });

    // password validation pattern: at least 8 characters, one uppercase, one lowercase, and one number
    // password confirmation validation: confirm_password must match password

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

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
                }),
            });


            const data = await response.json();
            

            if (response.ok) {
                alert("Registration successful! Please log in.");
                //window.location.href = "/login"; // redirect to login page

                navigate("/login");

            } else {
                setError(data.message || "Registration failed");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");

        }
    
    };

    return (
        <div>
            <h1>Register</h1>
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
                <div>
                    <label>
                        <input
                            type="checkbox"
                            onChange={() => setShowPassword(!showPassword)}
                        />
                    </label>
                </div>

                {error && <p style={{ color: "red" }}>{error}</p>}
                <button type="submit">Register</button>
            </form>
        </div>
    );

}


export default Register;
