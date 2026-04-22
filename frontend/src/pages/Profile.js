import React, { useState, useEffect } from 'react';
import { Scale, Ruler, Calendar, Activity, X } from 'lucide-react';
import '../App.css'; 

function Profile() {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const userId = localStorage.getItem("user_id");
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ date_of_birth: '', sex: '', weight: '', height: '' });
    const [error, setError] = useState("");

    useEffect(() => {
        if (userId) {
            fetch(`${API_URL}/api/users/${userId}`)
                .then(res => res.json())
                .then(data => {
                    setUser(data);
                    setFormData({ 
                        date_of_birth: data.date_of_birth || '', 
                        sex: data.sex || '', 
                        weight: data.weight || '', 
                        height: data.height || '' 
                    });
                });
        }
    }, [userId, API_URL]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError("");

        // Validate date_of_birth if provided
        if (formData.date_of_birth) {
            const today = new Date();
            const birthDate = new Date(formData.date_of_birth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 16) {
                setError("You must be at least 16 years old to use this app");
                return;
            }
        }

        const res = await fetch(`${API_URL}/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            const updatedData = await res.json();
            setUser({...user, ...formData, age: user.age});
            setIsModalOpen(false);
        } else {
            const errorData = await res.json();
            setError(errorData.error || "Update failed");
        }
    };

    if (!user) return <div className="loading">Loading profile...</div>;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-title">
                        <h1>My Profile</h1>
                        <p>{user.username} • {user.email}</p>
                    </div>
                    <button className="edit-btn" onClick={() => setIsModalOpen(true)}>Edit Profile</button>
                </div>

                <div className="stats-grid">
                    <div className="stat-box stat-age">
                        <div className="icon-wrapper"><Calendar size={24} /></div>
                        <div className="stat-info">
                            <div className="label">Age</div>
                            <div className="value">{user.age || '--'}</div>
                        </div>
                    </div>
                    <div className="stat-box stat-gender">
                        <div className="icon-wrapper"><Activity size={24} /></div>
                        <div className="stat-info">
                            <div className="label">Gender</div>
                            <div className="value">{user.sex || '--'}</div>
                        </div>
                    </div>
                    <div className="stat-box stat-weight">
                        <div className="icon-wrapper"><Scale size={24} /></div>
                        <div className="stat-info">
                            <div className="label">Weight</div>
                            <div className="value">{user.weight || '--'} kg</div>
                        </div>
                    </div>
                    <div className="stat-box stat-height">
                        <div className="icon-wrapper"><Ruler size={24} /></div>
                        <div className="stat-info">
                            <div className="label">Height</div>
                            <div className="value">{user.height || '--'} cm</div>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="profile-header">
                            <h2 style={{margin:0}}>Edit Details</h2>
                            <X onClick={() => setIsModalOpen(false)} style={{cursor:'pointer'}}/>
                        </div>
                        <form onSubmit={handleUpdate} className="modal-form">
                            <input 
                                type="date" 
                                placeholder="Date of Birth" 
                                value={formData.date_of_birth} 
                                onChange={(e)=>setFormData({...formData, date_of_birth: e.target.value})}
                                max={new Date().toISOString().split('T')[0]}
                            />
                            <select value={formData.sex} onChange={(e)=>setFormData({...formData, sex: e.target.value})}>
                                <option value="">Select Gender</option>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                            <input 
                                type="number" 
                                placeholder="Weight (kg)" 
                                step="0.1"
                                value={formData.weight} 
                                onChange={(e)=>setFormData({...formData, weight: e.target.value})}
                            />
                            <input 
                                type="number" 
                                placeholder="Height (cm)" 
                                step="0.1"
                                value={formData.height} 
                                onChange={(e)=>setFormData({...formData, height: e.target.value})}
                            />
                            {error && <p className="auth-error" style={{margin: 0}}>{error}</p>}
                            <button type="submit" className="edit-btn">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;