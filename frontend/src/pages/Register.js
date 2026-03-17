// react hook for managing form state
import { useState } from "react";

function Register() {

    const [form, setForm] = useState({
        username: "",
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


    // runs when user submits form and sends a POST request to backend to register user
    const handleSubmit = (e) => {


        e.preventDefault();  // prevent page refresh

        // send POST request to flask backend
        const response = fetch("/api/register", {
            method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify(form),
        });

        const data = response.json();
        console.log(data);
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
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}

                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                    title="Must be 8 or more characters long and contain at least one uppercase and lowercase letter and a number"
                    required


                />

                // TODO: add confirm password field and validation

                <button type="submit">Register</button>
            </form>
        </div>
    );

}


export default Register;
