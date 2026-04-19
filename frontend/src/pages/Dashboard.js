import { useEffect, useState } from 'react';
import '../App.css'; // Import CSS from parent directory

function Dashboard() {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const userId = localStorage.getItem('user_id');

  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    if (!userId) return;
    fetchSummary();
    // eslint-disable-next-line
  }, [userId, period]);

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/summary?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!userId) return <div className="page-wrapper"><p className="loading">Please log in to see your dashboard.</p></div>;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-card">
        <h1>Dashboard</h1>
        <div className="button-group">
          <button 
            className={period === 'daily' ? 'active' : 'inactive'} 
            onClick={() => setPeriod('daily')}>
            Daily
          </button>
          <button 
            className={period === 'weekly' ? 'active' : 'inactive'} 
            onClick={() => setPeriod('weekly')}>
            Weekly
          </button>
        </div>

        {!summary && <div className="loading">Loading summary...</div>}

        {summary && summary.period === 'daily' && (
          <div>
            <h2>Today ({summary.date})</h2>
            <div className="summary-cards">
              <div className="summary-card workout">
                <h3>Workouts</h3>
                <div className="value">{summary.workouts_count}</div>
                <p>Calories burned: {summary.total_workout_calories} kcal</p>
              </div>
              <div className="summary-card meal">
                <h3>Meals</h3>
                <div className="value">{summary.meals_count}</div>
                <p>Calories consumed: {summary.total_meal_calories} kcal</p>
              </div>
            </div>

            <h3>Hourly breakdown</h3>
            <div className="breakdown-grid hourly">
              {summary.hourly_breakdown.map(h => (
                <div key={h.hour} className="breakdown-item">
                  <div className="breakdown-item-label">{h.hour}:00</div>
                  <div className="breakdown-item-value">{h.workout_calories} kcal</div>
                  <div className="breakdown-item-secondary">{h.meal_calories} kcal</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary && summary.period === 'weekly' && (
          <div>
            <h2>Week: {summary.start_date} - {summary.end_date}</h2>
            <div className="summary-cards">
              <div className="summary-card workout">
                <h3>Total Workout Calories</h3>
                <div className="value">{summary.total_workout_calories} kcal</div>
              </div>
              <div className="summary-card meal">
                <h3>Total Meal Calories</h3>
                <div className="value">{summary.total_meal_calories} kcal</div>
              </div>
            </div>

            <h3>Daily breakdown</h3>
            <div className="breakdown-grid weekly">
              {summary.day_breakdown.map(d => (
                <div key={d.date} className="breakdown-item">
                  <div className="breakdown-item-label">{d.date}</div>
                  <div className="breakdown-item-value">{d.workout_calories} kcal</div>
                  <div className="breakdown-item-secondary">{d.meal_calories} kcal</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;