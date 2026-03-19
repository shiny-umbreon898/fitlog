// react hook for managing form state
import { useState } from "react";

function Login() {

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

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

        // send login request to flask backend
        const response = await fetch("/api/login", {

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

            // redirect to dashboard

            // TODO comment out when dashboard is implemented

            // window.location.href = "/dashboard"; 


        } else {
            alert("Login failed: " + data.message);
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
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />
                <button type="submit">Login</button>
            </form>
        </div>
    );

}

export default Login;