// react hook for managing form state
import { useEffect, useState } from "react";

function Profile() {
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const userId = localStorage.getItem("user_id");

    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        username: "",
        email: "",
        age: "",
        weight: "",
        height: ""
    });
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!userId) {
            window.location.href = "/login";
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_URL}/api/users/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setForm({
                        username: data.username || "",
                        email: data.email || "",
                        age: data.age ?? "",
                        weight: data.weight ?? "",
                        height: data.height ?? ""
                    });
                } else {
                    console.error("Failed to fetch profile", await res.text());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const payload = {
            age: form.age === "" ? null : Number(form.age),
            weight: form.weight === "" ? null : Number(form.weight),
            height: form.height === "" ? null : Number(form.height)
        };

        try {
            const res = await fetch(`${API_URL}/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                setMessage("Profile updated.");
            } else {
                setMessage(data.error || "Update failed");
            }
        } catch (err) {
            setMessage("Network error");
        }
    };


    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>Profile</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username</label>
                    <input type="text" name="username" value={form.username} readOnly />
                </div>
                <div>
                    <label>Email</label>
                    <input type="email" name="email" value={form.email} readOnly />
                </div>
                <div>
                    <label>Age</label>
                    <input type="number" name="age" value={form.age} onChange={handleChange} />
                </div>
                <div>
                    <label>Weight (kg)</label>
                    <input type="number" name="weight" value={form.weight} onChange={handleChange} step="0.1" />
                </div>
                <div>
                    <label>Height (cm)</label>
                    <input type="number" name="height" value={form.height} onChange={handleChange} step="0.1" />
                </div>
                <button type="submit">Save Profile</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Profile;