import { useCallback, useEffect, useMemo, useState } from "react";
import "../App.css";

import { FaPersonRunning, FaBicycle, FaPersonSwimming, FaPersonWalking, FaPersonHiking, FaDumbbell, FaQuestion } from "react-icons/fa6";
import { GiLotus } from "react-icons/gi";

function Workouts() {
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const userId = localStorage.getItem("user_id");

    const [workouts, setWorkouts] = useState([]);
    const [form, setForm] = useState({
        name: "",
        duration: "",
        user_id: userId,
    });

    const [profile, setProfile] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({ date_of_birth: "", sex: "", weight: "", height: "" });
    const [profileError, setProfileError] = useState("");
    const [dailyBurnTarget, setDailyBurnTarget] = useState(500);
    const [range, setRange] = useState("7d");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [page, setPage] = useState(1);
    const [editingWorkoutId, setEditingWorkoutId] = useState(null);
    const [editForm, setEditForm] = useState({ name: "", duration: "" });
    const [workoutStreak, setWorkoutStreak] = useState({
        current_streak_days: 0,
        longest_streak_days: 0,
        active_today: false,
        last_workout_date: null,
    });
    const pageSize = 6;

    const ICONS = {
        running: <FaPersonRunning />,
        cycling: <FaBicycle />,
        swimming: <FaPersonSwimming />,
        walking: <FaPersonWalking />,
        hiking: <FaPersonHiking />,
        yoga: <GiLotus />,
        strength: <FaDumbbell />,
        default: <FaQuestion />,
    };

    const fetchProfileAndWorkouts = useCallback(async () => {
        try {
            const pRes = await fetch(`${API_URL}/api/users/${userId}`);
            if (pRes.ok) {
                const pData = await pRes.json();
                setProfile(pData);
                setProfileForm({
                    date_of_birth: pData.date_of_birth || "",
                    sex: pData.sex ?? "",
                    weight: pData.weight ?? "",
                    height: pData.height ?? "",
                });

                if (!pData.date_of_birth || pData.weight == null || pData.height == null || !pData.sex) {
                    setShowProfileModal(true);
                }
            } else {
                console.error("Failed to fetch profile");
            }
        } catch (e) {
            console.error(e);
        }

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

        try {
            const streakRes = await fetch(`${API_URL}/api/users/${userId}/workouts/streak`);
            if (streakRes.ok) {
                const streakData = await streakRes.json();
                setWorkoutStreak(streakData);
            }
        } catch (e) {
            console.error(e);
        }
    }, [API_URL, userId]);

    useEffect(() => {
        if (!userId) {
            window.location.href = "/login";
            return;
        }
        fetchProfileAndWorkouts();
    }, [fetchProfileAndWorkouts, userId]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleProfileChange = (e) => {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    };

    const validateProfile = (p) => {
        if (!p.date_of_birth) return "Date of birth is required";
        
        const today = new Date();
        const birthDate = new Date(p.date_of_birth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 16) return "You must be at least 16 years old to use this app";
        if (!p.sex) return "Sex is required";
        if (!['male', 'female', 'm', 'f'].includes(p.sex.toLowerCase())) return "Sex must be Male or Female";
        
        const weight = Number(p.weight);
        const height = Number(p.height);
        if (!Number.isFinite(weight) || weight < 20 || weight > 500) return "Weight must be between 20kg and 500kg";
        if (!Number.isFinite(height) || height < 50 || height > 300) return "Height must be between 50cm and 300cm";
        return null;
    };

    const submitProfile = async (e) => {
        e.preventDefault();
        setProfileError("");

        const validationError = validateProfile(profileForm);
        if (validationError) {
            setProfileError(validationError);
            return;
        }

        const payload = {
            date_of_birth: profileForm.date_of_birth,
            sex: profileForm.sex || null,
            weight: profileForm.weight === "" ? null : Number(profileForm.weight),
            height: profileForm.height === "" ? null : Number(profileForm.height),
        };

        try {
            const res = await fetch(`${API_URL}/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const updated = await res.json();
                setProfile(updated);
                setShowProfileModal(false);
            } else {
                const err = await res.json();
                setProfileError(err.error || "Profile update failed");
            }
        } catch (err) {
            setProfileError("Network error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!profile || !profile.date_of_birth || profile.weight == null || profile.height == null || !profile.sex) {
            setShowProfileModal(true);
            return;
        }

        const name = (form.name || form.workout_type || "").toString().trim();
        const duration = Number(form.duration);
        if (!name) {
            alert("Workout name required");
            return;
        }
        if (!Number.isFinite(duration) || duration <= 0 || duration > 1440) {
            alert("Duration must be 1-1440 minutes");
            return;
        }

        const payload = { name, duration, user_id: Number(userId) };

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

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this workout?")) return;
        await fetch(`${API_URL}/api/workouts/${id}`, { method: "DELETE" });
        fetchProfileAndWorkouts();
    };

    const startEdit = (workout) => {
        setEditingWorkoutId(workout.id);
        setEditForm({ name: workout.name, duration: String(workout.duration) });
    };

    const cancelEdit = () => {
        setEditingWorkoutId(null);
        setEditForm({ name: "", duration: "" });
    };

    const saveEdit = async (workoutId) => {
        const payload = {
            name: editForm.name.trim(),
            duration: Number(editForm.duration),
        };
        if (!payload.name || !Number.isFinite(payload.duration) || payload.duration <= 0 || payload.duration > 1440) {
            alert("Provide valid workout name and duration (1-1440)");
            return;
        }
        const res = await fetch(`${API_URL}/api/workouts/${workoutId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            alert("Failed to update workout");
            return;
        }
        cancelEdit();
        fetchProfileAndWorkouts();
    };

    const filteredWorkouts = useMemo(() => {
        const isInRange = (timestamp) => {
            if (range === "all") return true;
            if (range === "custom") {
                if (!customStartDate || !customEndDate) return true;
                const start = new Date(`${customStartDate}T00:00:00`);
                const end = new Date(`${customEndDate}T23:59:59`);
                const current = new Date(timestamp);
                return current >= start && current <= end;
            }
            const days = range === "30d" ? 30 : 7;
            const cutoff = new Date();
            cutoff.setHours(0, 0, 0, 0);
            cutoff.setDate(cutoff.getDate() - (days - 1));
            return new Date(timestamp) >= cutoff;
        };
        return workouts
            .filter((workout) => isInRange(workout.timestamp))
            .filter((workout) => workout.name.toLowerCase().includes(query.trim().toLowerCase()));
    }, [workouts, range, query, customStartDate, customEndDate]);

    const stats = useMemo(() => {
        const totalSessions = filteredWorkouts.length;
        const totalCalories = filteredWorkouts.reduce((sum, w) => sum + Number(w.calories || 0), 0);
        const avgDuration = totalSessions
            ? Math.round(filteredWorkouts.reduce((sum, w) => sum + Number(w.duration || 0), 0) / totalSessions)
            : 0;
        const topWorkout = filteredWorkouts.reduce((best, w) => {
            if (!best || Number(w.calories || 0) > Number(best.calories || 0)) return w;
            return best;
        }, null);
        return { totalSessions, totalCalories: Math.round(totalCalories), avgDuration, topWorkout };
    }, [filteredWorkouts]);

    const weeklyTrend = useMemo(() => {
        const points = [];
        for (let offset = 6; offset >= 0; offset -= 1) {
            const day = new Date();
            day.setHours(0, 0, 0, 0);
            day.setDate(day.getDate() - offset);
            const key = day.toISOString().slice(0, 10);
            const calories = workouts.reduce((sum, w) => {
                const workoutDate = new Date(w.timestamp).toISOString().slice(0, 10);
                return sum + (workoutDate === key ? Number(w.calories || 0) : 0);
            }, 0);
            points.push({ label: day.toLocaleDateString(undefined, { weekday: "short" }), calories });
        }
        return points;
    }, [workouts]);

    const weeklyGoalStreak = useMemo(() => {
        const results = [];
        for (let offset = 6; offset >= 0; offset -= 1) {
            const day = new Date();
            day.setHours(0, 0, 0, 0);
            day.setDate(day.getDate() - offset);
            const key = day.toISOString().slice(0, 10);
            const calories = workouts.reduce((sum, w) => {
                const workoutDate = new Date(w.timestamp).toISOString().slice(0, 10);
                return sum + (workoutDate === key ? Number(w.calories || 0) : 0);
            }, 0);
            results.push({ hit: calories >= Number(dailyBurnTarget || 0) });
        }
        const daysHit = results.filter((item) => item.hit).length;
        let consecutive = 0;
        for (let i = results.length - 1; i >= 0; i -= 1) {
            if (results[i].hit) consecutive += 1;
            else break;
        }
        return { daysHit, consecutive };
    }, [workouts, dailyBurnTarget]);

    const maxTrend = Math.max(1, ...weeklyTrend.map((point) => point.calories));

    const sortedWorkouts = useMemo(() => {
        const list = [...filteredWorkouts];
        switch (sortBy) {
            case "oldest":
                list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case "calories_high":
                list.sort((a, b) => Number(b.calories || 0) - Number(a.calories || 0));
                break;
            case "duration_high":
                list.sort((a, b) => Number(b.duration || 0) - Number(a.duration || 0));
                break;
            default:
                list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        return list;
    }, [filteredWorkouts, sortBy]);

    useEffect(() => {
        setPage(1);
    }, [range, query, sortBy, customStartDate, customEndDate]);

    const totalPages = Math.max(1, Math.ceil(sortedWorkouts.length / pageSize));
    const paginatedWorkouts = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedWorkouts.slice(start, start + pageSize);
    }, [sortedWorkouts, page]);
    const pageNumbers = useMemo(() => {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }, [totalPages]);

    const exportWorkoutsCsv = () => {
        const headers = ["Workout", "Duration (min)", "Calories", "Timestamp"];
        const rows = sortedWorkouts.map((w) => [w.name, w.duration, w.calories, w.timestamp]);
        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `workouts-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const iconFor = (name) => {
        if (!name) return ICONS.default;
        const key = name.toLowerCase();

        if (key.includes("run")) return ICONS.running;
        if (key.includes("cycle") || key.includes("bike")) return ICONS.cycling;
        if (key.includes("swim")) return ICONS.swimming;
        if (key.includes("walk")) return ICONS.walking;
        if (key.includes("hike")) return ICONS.hiking;
        if (key.includes("yoga")) return ICONS.yoga;
        if (key.includes("lift") || key.includes("strength") || key.includes("weight")) return ICONS.strength;

        return ICONS.default;
    };

    const fmt = (iso) => {
        try {
            const d = new Date(iso);
            return d.toLocaleString();
        } catch (e) {
            return iso;
        }
    };

    return (
        <div className="workouts-wrapper">
            <div className="workouts-container pro">
                <div className="workouts-hero">
                    <h1>Workout Performance</h1>
                    <p>Log sessions, track burn trends, and stay consistent with your weekly burn streak.</p>
                </div>

                <div className="workouts-stats-grid">
                    <div className="workouts-stat-card"><span>Sessions ({range})</span><strong>{stats.totalSessions}</strong></div>
                    <div className="workouts-stat-card"><span>Total calories</span><strong>{stats.totalCalories} kcal</strong></div>
                    <div className="workouts-stat-card"><span>Avg duration</span><strong>{stats.avgDuration} min</strong></div>
                    <div className="workouts-stat-card"><span>Top workout</span><strong>{stats.topWorkout ? `${stats.topWorkout.name} (${Math.round(stats.topWorkout.calories || 0)} kcal)` : "--"}</strong></div>
                    <div className="workouts-stat-card">
                        <span>Workout streak</span>
                        <strong>{workoutStreak.current_streak_days} day{workoutStreak.current_streak_days === 1 ? "" : "s"}</strong>
                        <span>Best: {workoutStreak.longest_streak_days} day{workoutStreak.longest_streak_days === 1 ? "" : "s"}</span>
                    </div>
                </div>

                {showProfileModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Complete Profile</h2>
                            <form onSubmit={submitProfile}>
                                <div>
                                    <label>Date of Birth</label>
                                    <input 
                                        type="date" 
                                        name="date_of_birth"
                                        value={profileForm.date_of_birth} 
                                        onChange={handleProfileChange} 
                                        required 
                                        max={new Date().toISOString().split('T')[0]}
                                    />
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
                                    <input name="weight" type="number" step="0.1" value={profileForm.weight} onChange={handleProfileChange} required min="20" max="500" />
                                </div>
                                <div>
                                    <label>Height (cm)</label>
                                    <input name="height" type="number" step="0.1" value={profileForm.height} onChange={handleProfileChange} required min="50" max="300" />
                                </div>
                                {profileError && <p style={{ color: "#d32f2f" }}>{profileError}</p>}
                                <button type="submit">Save</button>
                                <button type="button" onClick={() => setShowProfileModal(false)}>Cancel</button>
                            </form>
                        </div>
                    </div>
                )}

                <div className="workout-form pro">
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
                            min="1"
                            max="1440"
                        />
                        <button type="submit">Add Workout</button>
                    </form>
                </div>

                <div className="meals-controls">
                    <input
                        type="text"
                        placeholder="Search workouts..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="range-buttons">
                        <button type="button" className={range === "7d" ? "active" : ""} onClick={() => setRange("7d")}>7 days</button>
                        <button type="button" className={range === "30d" ? "active" : ""} onClick={() => setRange("30d")}>30 days</button>
                        <button type="button" className={range === "custom" ? "active" : ""} onClick={() => setRange("custom")}>Custom</button>
                        <button type="button" className={range === "all" ? "active" : ""} onClick={() => setRange("all")}>All</button>
                    </div>
                </div>
                {range === "custom" && (
                    <div className="custom-range-row">
                        <label>
                            Start
                            <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
                        </label>
                        <label>
                            End
                            <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
                        </label>
                    </div>
                )}

                <div className="meals-analytics-grid">
                    <div className="analytics-card">
                        <h3>7-Day Burn Trend</h3>
                        <div className="trend-bars">
                            {weeklyTrend.map((point) => (
                                <div key={point.label} className="trend-bar-item">
                                    <div className="trend-bar-track">
                                        <div className="trend-bar-fill workout" style={{ height: `${Math.round((point.calories / maxTrend) * 100)}%` }} />
                                    </div>
                                    <div className="trend-bar-label">{point.label}</div>
                                    <div className="trend-bar-value">{Math.round(point.calories)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="analytics-card">
                        <h3>Burn Goal Streak</h3>
                        <div className="workout-goal-card">
                            <p>Target per day</p>
                            <input type="number" min="100" value={dailyBurnTarget} onChange={(e) => setDailyBurnTarget(Number(e.target.value) || 0)} />
                            <p>{weeklyGoalStreak.daysHit}/7 days hit target</p>
                            <p>{weeklyGoalStreak.consecutive} day current run</p>
                        </div>
                    </div>
                </div>

                <h2>Workout Timeline</h2>
                <div className="timeline-toolbar">
                    <label>
                        Sort by
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="calories_high">Highest calories</option>
                            <option value="duration_high">Longest duration</option>
                        </select>
                    </label>
                    <span className="timeline-count">
                        Showing {sortedWorkouts.length === 0 ? 0 : (page - 1) * pageSize + 1}-
                        {Math.min(page * pageSize, sortedWorkouts.length)} of {sortedWorkouts.length}
                    </span>
                    <button type="button" className="export-btn" onClick={exportWorkoutsCsv}>Export CSV</button>
                </div>

                <ul className="workout-list pro">
                    {paginatedWorkouts.map((workout) => (
                        <li key={workout.id} className="workout-item">
                            {editingWorkoutId === workout.id ? (
                                <div className="meal-edit-row">
                                    <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                                    <input type="number" value={editForm.duration} onChange={(e) => setEditForm((f) => ({ ...f, duration: e.target.value }))} />
                                    <div />
                                    <button type="button" onClick={() => saveEdit(workout.id)}>Save</button>
                                    <button type="button" onClick={cancelEdit}>Cancel</button>
                                </div>
                            ) : (
                                <>
                                    <span className="workout-icon">{iconFor(workout.name)}</span>
                                    <div className="workout-info">
                                        <div className="workout-name">{workout.name} - {workout.duration} mins</div>
                                        <div className="workout-meta">{workout.calories ? `${workout.calories} kcal,` : ""} {workout.timestamp ? `${fmt(workout.timestamp)}` : ""}</div>
                                    </div>
                                    <div className="meal-row-actions">
                                        <button className="workout-delete-btn" type="button" onClick={() => startEdit(workout)}>Edit</button>
                                        <button className="meal-row-btn danger" type="button" onClick={() => handleDelete(workout.id)}>Delete</button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                    {sortedWorkouts.length === 0 && <li className="meal-empty-state">No workouts found for this filter.</li>}
                </ul>
                {sortedWorkouts.length > 0 && (
                    <div className="timeline-pagination">
                        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
                        <span>Page {page} / {totalPages}</span>
                        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                    </div>
                )}
                {totalPages > 1 && (
                    <div className="page-numbers-row">
                        {pageNumbers.map((pageNo) => (
                            <button
                                key={pageNo}
                                type="button"
                                className={`page-number-btn ${pageNo === page ? "active" : ""}`}
                                onClick={() => setPage(pageNo)}
                            >
                                {pageNo}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Workouts;
