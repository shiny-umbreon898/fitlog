import { useEffect, useMemo, useState } from "react";
import "../App.css";

function Meals() {
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const userId = localStorage.getItem("user_id");
    const [meals, setMeals] = useState([]);
    const [dailyTarget, setDailyTarget] = useState(2200);
    const [query, setQuery] = useState("");
    const [range, setRange] = useState("7d");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [page, setPage] = useState(1);
    const pageSize = 6;
    const [isLoading, setIsLoading] = useState(false);
    const [editingMealId, setEditingMealId] = useState(null);
    const [form, setForm] = useState({
        name: "",
        category: "Other",
        calories: "",
        user_id: userId,
    });

    useEffect(() => {
        if (!userId) {
            window.location.href = "/login";
            return;
        }
        fetchMeals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const fetchMeals = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}/meals`);
            if (res.ok) {
                const data = await res.json();
                setMeals(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleQuickAdd = (name, calories) => {
        setForm((current) => ({ ...current, name, calories: String(calories) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: form.name.trim(),
            description: form.category,
            calories: Number(form.calories),
            user_id: Number(userId),
        };

        if (!payload.name) {
            alert("Meal name is required");
            return;
        }
        if (!Number.isFinite(payload.calories) || payload.calories <= 0) {
            alert("Calories must be greater than 0");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/meals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                alert("Failed to add meal");
                return;
            }

            setForm({ name: "", category: "Other", calories: "", user_id: userId });
            fetchMeals();
        } catch (error) {
            console.error(error);
            alert("Failed to add meal");
        }
    };

    const filteredMeals = useMemo(() => {
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

        return meals
            .filter((meal) => isInRange(meal.timestamp))
            .filter((meal) => meal.name.toLowerCase().includes(query.trim().toLowerCase()));
    }, [meals, query, range, customStartDate, customEndDate]);

    useEffect(() => {
        setPage(1);
    }, [query, range, sortBy, customStartDate, customEndDate]);

    const todayCalories = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return meals.reduce((sum, meal) => {
            const mealDate = new Date(meal.timestamp).toISOString().slice(0, 10);
            return sum + (mealDate === today ? Number(meal.calories || 0) : 0);
        }, 0);
    }, [meals]);

    const stats = useMemo(() => {
        const totalCalories = filteredMeals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0);
        const averageCalories = filteredMeals.length ? Math.round(totalCalories / filteredMeals.length) : 0;
        const topMeal = filteredMeals.reduce((best, meal) => {
            if (!best || Number(meal.calories || 0) > Number(best.calories || 0)) {
                return meal;
            }
            return best;
        }, null);

        return {
            totalMeals: filteredMeals.length,
            totalCalories,
            averageCalories,
            topMeal,
        };
    }, [filteredMeals]);

    const categoryBreakdown = useMemo(() => {
        const counts = {};
        filteredMeals.forEach((meal) => {
            const category = meal.description || "Other";
            counts[category] = (counts[category] || 0) + 1;
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }, [filteredMeals]);

    const weeklyTrend = useMemo(() => {
        const points = [];
        for (let offset = 6; offset >= 0; offset -= 1) {
            const day = new Date();
            day.setHours(0, 0, 0, 0);
            day.setDate(day.getDate() - offset);
            const key = day.toISOString().slice(0, 10);
            const calories = meals.reduce((sum, meal) => {
                const mealDate = new Date(meal.timestamp).toISOString().slice(0, 10);
                return sum + (mealDate === key ? Number(meal.calories || 0) : 0);
            }, 0);
            points.push({ label: day.toLocaleDateString(undefined, { weekday: "short" }), calories });
        }
        return points;
    }, [meals]);

    const maxTrend = Math.max(1, ...weeklyTrend.map((point) => point.calories));

    const weeklyGoalStreak = useMemo(() => {
        const results = [];
        for (let offset = 6; offset >= 0; offset -= 1) {
            const day = new Date();
            day.setHours(0, 0, 0, 0);
            day.setDate(day.getDate() - offset);
            const key = day.toISOString().slice(0, 10);
            const calories = meals.reduce((sum, meal) => {
                const mealDate = new Date(meal.timestamp).toISOString().slice(0, 10);
                return sum + (mealDate === key ? Number(meal.calories || 0) : 0);
            }, 0);
            results.push({
                date: key,
                hit: calories >= Number(dailyTarget || 0),
            });
        }
        const daysHit = results.filter((item) => item.hit).length;
        let consecutive = 0;
        for (let i = results.length - 1; i >= 0; i -= 1) {
            if (results[i].hit) consecutive += 1;
            else break;
        }
        return { daysHit, consecutive };
    }, [meals, dailyTarget]);

    const sortedMeals = useMemo(() => {
        const list = [...filteredMeals];
        switch (sortBy) {
            case "oldest":
                list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case "calories_high":
                list.sort((a, b) => Number(b.calories || 0) - Number(a.calories || 0));
                break;
            case "calories_low":
                list.sort((a, b) => Number(a.calories || 0) - Number(b.calories || 0));
                break;
            default:
                list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        return list;
    }, [filteredMeals, sortBy]);

    const totalPages = Math.max(1, Math.ceil(sortedMeals.length / pageSize));
    const paginatedMeals = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedMeals.slice(start, start + pageSize);
    }, [page, sortedMeals]);
    const pageNumbers = useMemo(() => {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }, [totalPages]);

    const progressPercent = Math.min(100, Math.round((todayCalories / Math.max(1, Number(dailyTarget))) * 100));

    const fmt = (iso) => {
        try {
            const date = new Date(iso);
            return date.toLocaleString();
        } catch (error) {
            return iso;
        }
    };

    const startEdit = (meal) => {
        setEditingMealId(meal.id);
        setForm({
            name: meal.name,
            category: meal.description || "Other",
            calories: String(meal.calories),
            user_id: userId,
        });
    };

    const cancelEdit = () => {
        setEditingMealId(null);
        setForm({
            name: "",
            category: "Other",
            calories: "",
            user_id: userId,
        });
    };

    const saveEdit = async (mealId) => {
        const payload = {
            name: form.name.trim(),
            description: form.category,
            calories: Number(form.calories),
        };
        if (!payload.name || !Number.isFinite(payload.calories) || payload.calories <= 0) {
            alert("Please provide a valid meal name and calories");
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/meals/${mealId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                alert("Failed to update meal");
                return;
            }
            cancelEdit();
            fetchMeals();
        } catch (error) {
            console.error(error);
            alert("Failed to update meal");
        }
    };

    const removeMeal = async (mealId) => {
        if (!window.confirm("Delete this meal?")) return;
        try {
            const res = await fetch(`${API_URL}/api/meals/${mealId}`, { method: "DELETE" });
            if (!res.ok) {
                alert("Failed to delete meal");
                return;
            }
            fetchMeals();
        } catch (error) {
            console.error(error);
            alert("Failed to delete meal");
        }
    };

    const exportMealsCsv = () => {
        const headers = ["Name", "Category", "Calories", "Timestamp"];
        const rows = sortedMeals.map((meal) => [
            meal.name,
            meal.description || "Other",
            meal.calories,
            meal.timestamp,
        ]);
        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `meals-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="meals-wrapper">
            <div className="meals-container pro">
                <div className="meals-hero">
                    <h1>Nutrition Tracker</h1>
                    <p>Track meals, monitor calories, and keep your nutrition goals on pace.</p>
                </div>

                <div className="meals-stats-grid">
                    <div className="meals-stat-card">
                        <span>Meals ({range})</span>
                        <strong>{stats.totalMeals}</strong>
                    </div>
                    <div className="meals-stat-card">
                        <span>Total calories</span>
                        <strong>{stats.totalCalories} kcal</strong>
                    </div>
                    <div className="meals-stat-card">
                        <span>Avg / meal</span>
                        <strong>{stats.averageCalories} kcal</strong>
                    </div>
                    <div className="meals-stat-card">
                        <span>Highest calorie meal</span>
                        <strong>{stats.topMeal ? `${stats.topMeal.name} (${stats.topMeal.calories} kcal)` : "--"}</strong>
                    </div>
                </div>

                <div className="meal-form pro">
                    <h2>Add Meal</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="name"
                            placeholder="Meal name"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="number"
                            name="calories"
                            placeholder="Calories"
                            value={form.calories}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                        <select name="category" value={form.category} onChange={handleChange}>
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Snack">Snack</option>
                            <option value="Other">Other</option>
                        </select>
                        <button type="submit">Add Meal</button>
                    </form>
                    <div className="quick-add-row">
                        <span>Quick add:</span>
                        <button type="button" onClick={() => handleQuickAdd("Greek Yogurt Bowl", 320)}>Yogurt Bowl</button>
                        <button type="button" onClick={() => handleQuickAdd("Chicken Salad", 450)}>Chicken Salad</button>
                        <button type="button" onClick={() => handleQuickAdd("Protein Smoothie", 280)}>Smoothie</button>
                    </div>
                </div>

                <div className="meals-controls">
                    <input
                        type="text"
                        placeholder="Search meals..."
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
                        <h3>7-Day Calories Trend</h3>
                        <div className="trend-bars">
                            {weeklyTrend.map((point) => (
                                <div key={point.label} className="trend-bar-item">
                                    <div className="trend-bar-track">
                                        <div
                                            className="trend-bar-fill"
                                            style={{ height: `${Math.round((point.calories / maxTrend) * 100)}%` }}
                                        />
                                    </div>
                                    <div className="trend-bar-label">{point.label}</div>
                                    <div className="trend-bar-value">{point.calories}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="analytics-card">
                        <h3>Top Meal Types</h3>
                        <ul className="type-breakdown">
                            {categoryBreakdown.map(([category, count]) => (
                                <li key={category}>
                                    <span>{category}</span>
                                    <strong>{count}</strong>
                                </li>
                            ))}
                            {categoryBreakdown.length === 0 && <li className="meal-empty-state">No meal types yet.</li>}
                        </ul>
                    </div>
                </div>

                <div className="goal-card">
                    <div>
                        <h3>Daily calorie goal</h3>
                        <p>{todayCalories} / {dailyTarget} kcal today</p>
                        <p className="goal-streak-copy">
                            Weekly streak: {weeklyGoalStreak.daysHit}/7 days hit target
                            {weeklyGoalStreak.consecutive > 0 ? ` (${weeklyGoalStreak.consecutive} day run)` : ""}
                        </p>
                    </div>
                    <input
                        type="number"
                        min="500"
                        value={dailyTarget}
                        onChange={(e) => setDailyTarget(Number(e.target.value) || 0)}
                    />
                    <div className="goal-progress-track">
                        <div className="goal-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>

                <h2>Meal Timeline</h2>
                {isLoading ? <div className="loading">Loading meals...</div> : (
                    <>
                        <div className="timeline-toolbar">
                            <label>
                                Sort by
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="calories_high">Highest calories</option>
                                    <option value="calories_low">Lowest calories</option>
                                </select>
                            </label>
                            <span className="timeline-count">
                                Showing {sortedMeals.length === 0 ? 0 : (page - 1) * pageSize + 1}-
                                {Math.min(page * pageSize, sortedMeals.length)} of {sortedMeals.length}
                            </span>
                            <button type="button" className="export-btn" onClick={exportMealsCsv}>Export CSV</button>
                        </div>
                        <ul className="meal-list pro">
                        {paginatedMeals.map((meal) => (
                            <li key={meal.id} className="meal-item pro">
                                {editingMealId === meal.id ? (
                                    <div className="meal-edit-row">
                                        <input type="text" name="name" value={form.name} onChange={handleChange} />
                                        <input type="number" name="calories" value={form.calories} onChange={handleChange} />
                                        <select name="category" value={form.category} onChange={handleChange}>
                                            <option value="Breakfast">Breakfast</option>
                                            <option value="Lunch">Lunch</option>
                                            <option value="Dinner">Dinner</option>
                                            <option value="Snack">Snack</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <button type="button" onClick={() => saveEdit(meal.id)}>Save</button>
                                        <button type="button" onClick={cancelEdit}>Cancel</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="meal-info">
                                            <div className="meal-name">{meal.name}</div>
                                            <div className="meal-meta">
                                                {meal.description || "Other"} - {fmt(meal.timestamp)}
                                            </div>
                                        </div>
                                        <div className="meal-row-actions">
                                            <div className="meal-calorie-pill">{meal.calories} kcal</div>
                                            <button type="button" className="meal-row-btn" onClick={() => startEdit(meal)}>Edit</button>
                                            <button type="button" className="meal-row-btn danger" onClick={() => removeMeal(meal.id)}>Delete</button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                        {sortedMeals.length === 0 && <li className="meal-empty-state">No meals found for this filter.</li>}
                        </ul>
                        {sortedMeals.length > 0 && (
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
                    </>
                )}
            </div>
        </div>
    );
}

export default Meals;
