// react hook for managing form state
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {

    // local development and production
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    // use ` backtick for var


    const navigate = useNavigate();


    const [form, setForm] = useState({
        email: "",
        password: "",
    });


    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    // runs when user types in form fields and updates form state
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // runs when user submits form and sends a POST request to flask backend
    const handleSubmit = async (e) => {

        e.preventDefault();  // prevent page refresh

        try {
            // send login request to flask backend
            const response = await fetch(`${API_URL}/api/users`, {

                method: "POST",

                headers: { "Content-Type": "application/json" },

                body: JSON.stringify(form),
            });

            const data = await response.json();
            console.log(data);

            // store token in localStorage for authenticated requests
            if (response.ok) {
                localStorage.setItem("user_id", data.user_id);
                alert("Login successful!");

                //window.location.href = "/dashboard"; // redirect to dashboard
                navigate("/workouts");

            } else {
                alert("Login failed: " + data.message);
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
        }

    };

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
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

                <button type="submit">Login</button>
            </form>
        </div>
    );

}

export default Login;