import { useEffect, useState } from "react";

function Workouts() {

    // store workouts
    const [workouts, setWorkouts] = useState([]);

    // store from user input for new workout
    const [form, setForm] = useState({
        name: "",
        duration: "",
        calories: "",
        user_id: 1 // TODO replace with logged in user's id

    });

    // fetch workouts on page load
    useEffect(() => { 
        fetchWorkouts();
    }, []);


    // get from backend
    const fetchWorkouts = async () => {
        const response = await fetch("/api/workouts");
        const data = await response.json();
        setWorkouts(data);
    };

    // runs when user types in form fields and updates form state
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };


    // add new workout to backend
    const handleSubmit = async (e) => {
        e.calories.preventDefault();  // prevent page refresh

        await fetch("/api/workouts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        fetchWorkouts(); // refresh workouts list

        // clear form
        setForm({
            name: "",
            duration: "",
            calories: "",
            user_id: 1
        });

    };

    // delete workout from backend
    const handleDelete = async (id) => {
        await fetch(`/api/workouts/${id}`, {
            method: "DELETE",
        });
        fetchWorkouts(); // refresh workouts list
    };



    return (
        <div>
            <h1>Workouts</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="Workout Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />
                <input
                    type="number"
                    name="duration"
                    placeholder="Duration (minutes)"
                    value={form.duration}
                    onChange={handleChange}
                    required
                />
                <input
                    type="number"
                    name="calories"
                    placeholder="Calories Burned"
                    value={form.calories}
                    onChange={handleChange}
                    required
                />
                <button type="submit">Add Workout</button>
            </form>

            <ul>
                {workouts.map((workout) => (
                    <li key={workout.id}>
                        {workout.name} - {workout.duration} mins - {workout.calories} calories
                        <button onClick={() => handleDelete(workout.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );

}

    export default Workouts;