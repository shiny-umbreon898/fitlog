import { useEffect, useState } from "react";
import '../App.css'; // Import CSS from parent directory

function Workouts() {
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const userId = localStorage.getItem("user_id");

    // store workouts
    const [workouts, setWorkouts] = useState([]);

    // store from user input for new workout
    const [form, setForm] = useState({
        name: "",
        duration: "",
        user_id: userId
    });

    const [profile, setProfile] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({ age: "", sex: "", weight: "", height: "" });

    // activity icons map
    const ICONS = {
        running: "",
        cycling: "",
        swimming: "",
        walking: "",
        hiking: "",
        yoga: "",
        strength: "",
        default: ""
    };

    // fetch workouts on page load
    useEffect(() => {
        if (!userId) {
            window.location.href = "/login";
            return;
        }
        fetchProfileAndWorkouts();
    }, []);

    const fetchProfileAndWorkouts = async () => {
        // fetch profile
        try {
            const pRes = await fetch(`${API_URL}/api/users/${userId}`);
            if (pRes.ok) {
                const pData = await pRes.json();
                setProfile(pData);
                setProfileForm({
                    age: pData.age ?? "",
                    sex: pData.sex ?? "",
                    weight: pData.weight ?? "",
                    height: pData.height ?? ""
                });

                // if profile incomplete, show modal to collect info
                if (pData.age == null || pData.weight == null || pData.height == null || !pData.sex) {
                    setShowProfileModal(true);
                }
            } else {
                console.error("Failed to fetch profile");
            }
        } catch (e) {
            console.error(e);
        }

        // fetch workouts for this user
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}/workouts`);
            if (res.ok) {
                const data = await res.json();
                setWorkouts(data);
            } else {
                console.error("Failed to fetch workouts");
            }
        } catch (e) {
            console.error(e);
        }
    };

    // runs when user types in form fields and updates form state
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // profile modal change
    const handleProfileChange = (e) => {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    };

    // submit profile modal
    const submitProfile = async (e) => {
        e.preventDefault();

        const payload = {
            age: profileForm.age === "" ? null : Number(profileForm.age),
            sex: profileForm.sex || null,
            weight: profileForm.weight === "" ? null : Number(profileForm.weight),
            height: profileForm.height === "" ? null : Number(profileForm.height)
        };

        try {
            const res = await fetch(`${API_URL}/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const updated = await res.json();
                setProfile(updated);
                setShowProfileModal(false);
            } else {
                const err = await res.json();
                alert(err.error || "Profile update failed");
            }
        } catch (err) {
            alert("Network error");
        }
    };

    // add new workout to backend
    const handleSubmit = async (e) => {
        e.preventDefault();

        // ensure profile exists and is complete
        if (!profile || profile.age == null || profile.weight == null || profile.height == null || !profile.sex) {
            setShowProfileModal(true);
            return;
        }

        // map form.workout_type -> name if needed
        const payload = {
            name: form.name || form.workout_type || "",
            duration: Number(form.duration),
            user_id: Number(userId)
        };

        // basic client validation
        if (!payload.name || !payload.duration) {
            alert("Name and duration required");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/workouts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Failed to add workout");
                return;
            }
            await fetchProfileAndWorkouts();
            setForm({ name: "", duration: "", user_id: userId });
        } catch (err) {
            console.error(err);
            alert("Failed to add workout");
        }
    };

    // delete workout from backend
    const handleDelete = async (id) => {
        await fetch(`${API_URL}/api/workouts/${id}`, { method: "DELETE" });
        fetchProfileAndWorkouts();
    };

    const iconFor = (name) => {
        if (!name) return ICONS.default;
        const key = name.toLowerCase();
        if (key.includes('run')) return ICONS.running;
        if (key.includes('cycle') || key.includes('bike')) return ICONS.cycling;
        if (key.includes('swim')) return ICONS.swimming;
        if (key.includes('walk')) return ICONS.walking;
        if (key.includes('hike')) return ICONS.hiking;
        if (key.includes('yoga')) return ICONS.yoga;
        if (key.includes('lift') || key.includes('strength') || key.includes('weight')) return ICONS.strength;
        return ICONS.default;
    };

    const fmt = (iso) => {
        try {
            const d = new Date(iso);
            return d.toLocaleString();
        } catch (e) {
            return iso;
        }
    }

    return (
        <div className="workouts-wrapper">
            <div className="workouts-container">
                <h1>Workouts</h1>

                {/* Profile modal */}
                {showProfileModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Complete Profile</h2>
                            <form onSubmit={submitProfile}>
                                <div>
                                    <label>Age</label>
                                    <input name="age" type="number" value={profileForm.age} onChange={handleProfileChange} required />
                                </div>
                                <div>
                                    <label>Sex</label>
                                    <input name="sex" type="text" list="sex-type" value={profileForm.sex} onChange={handleProfileChange} required />
                                    <datalist id="sex-type">
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </datalist>
                                </div>
                                <div>
                                    <label>Weight (kg)</label>
                                    <input name="weight" type="number" step="0.1" value={profileForm.weight} onChange={handleProfileChange} required />
                                </div>
                                <div>
                                    <label>Height (cm)</label>
                                    <input name="height" type="number" step="0.1" value={profileForm.height} onChange={handleProfileChange} required />
                                </div>
                                <button type="submit">Save</button>
                                <button type="button" onClick={() => setShowProfileModal(false)}>Cancel</button>
                            </form>
                        </div>
                    </div>
                )}

                <div className="workout-form">
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="name"
                            list="workout-types"
                            placeholder="Workout Type"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                        <datalist id="workout-types">
                            <option value="Running">Running</option>
                            <option value="Cycling">Cycling</option>
                            <option value="Swimming">Swimming</option>
                        </datalist>

                        <input
                            type="number"
                            name="duration"
                            placeholder="Duration (minutes)"
                            value={form.duration}
                            onChange={handleChange}
                            required
                        />
                        <button type="submit">Add Workout</button>
                    </form>
                </div>

                <h2>Recent Workouts</h2>
                <ul className="workout-list">
                    {workouts.map((workout) => (
                        <li key={workout.id} className="workout-item">
                            <span className="workout-icon">{iconFor(workout.name)}</span>
                            <div className="workout-info">
                                <div className="workout-name">{workout.name} - {workout.duration} mins</div>
                                <div className="workout-meta">{workout.calories ? `${workout.calories} kcal` : ''} {workout.timestamp ? `· ${fmt(workout.timestamp)}` : ''}</div>
                            </div>
                            <button className="workout-delete-btn" onClick={() => handleDelete(workout.id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Workouts;