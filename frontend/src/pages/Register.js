import(useSatte) from "react";

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
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                />

                // TODO: add confirm password field and validation

                <button type="submit">Register</button>
            </form>
        </div>
    );

}


export default Register;
