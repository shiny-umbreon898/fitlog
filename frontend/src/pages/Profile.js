import React, { useState, useEffect } from 'react';
import { Scale, Ruler, Calendar, Activity, X } from 'lucide-react';
import '../App.css'; 

function Profile() {
    const userId = localStorage.getItem("user_id");
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ age: '', sex: '', weight: '', height: '' });

    useEffect(() => {
        if (userId) {
            fetch(`http://localhost:5000/api/users/${userId}`)
                .then(res => res.json())
                .then(data => {
                    setUser(data);
                    setFormData({ age: data.age||'', sex: data.sex||'', weight: data.weight||'', height: data.height||'' });
                });
        }
    }, [userId]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            setUser({...user, ...formData});
            setIsModalOpen(false);
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
                            <input type="number" placeholder="Age" value={formData.age} onChange={(e)=>setFormData({...formData, age: e.target.value})}/>
                            <select value={formData.sex} onChange={(e)=>setFormData({...formData, sex: e.target.value})}>
                                <option value="">Select Gender</option>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                            <input type="number" placeholder="Weight (kg)" value={formData.weight} onChange={(e)=>setFormData({...formData, weight: e.target.value})}/>
                            <input type="number" placeholder="Height (cm)" value={formData.height} onChange={(e)=>setFormData({...formData, height: e.target.value})}/>
                            <button type="submit" className="edit-btn">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;