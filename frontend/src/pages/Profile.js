import React, { useState, useEffect } from 'react';
import { Scale, Ruler, Calendar, Activity, X, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 

function Profile() {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const userId = localStorage.getItem("user_id");
    const navigate = useNavigate();
    
    // State Management
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState(""); 
    const [showPassword, setShowPassword] = useState(false); 
    const [formData, setFormData] = useState({ date_of_birth: '', sex: '', weight: '', height: '' });
    const [error, setError] = useState("");

    // Fetch User Data
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
                })
                .catch(err => console.error("Failed to load profile", err));
        }
    }, [userId, API_URL]);

    // Handle Profile Updates
    const handleUpdate = async (e) => {
        e.preventDefault();
        setError("");

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
            setUser({...user, ...formData});
            setIsModalOpen(false);
        } else {
            const errorData = await res.json();
            setError(errorData.error || "Update failed");
        }
    };

    // Secured Delete Account Logic
    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setError("");

        if (!confirmPassword) {
            setError("Please enter your password to confirm deletion.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: confirmPassword }) 
            });
            
            if (res.ok) {
                localStorage.clear();
                navigate('/register');
            } else {
                const data = await res.json();
                setError(data.error || "Incorrect password. Deletion failed.");
            }
        } catch (err) {
            setError("Server error during deletion.");
        }
    };

    if (!user) return <div className="loading">Loading profile...</div>;

    return (
        <div className="profile-container">
            <div className="profile-card">
                {/* Header Section */}
                <div className="profile-header">
                    <div className="profile-title">
                        <h1>My Profile</h1>
                        <p>{user.username} • {user.email}</p>
                    </div>
                    <button className="edit-btn" onClick={() => setIsModalOpen(true)}>Edit Profile</button>
                </div>

                {/* Scannable Stats Grid */}
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

                {/* Danger Zone */}
                <div className="danger-zone" style={{marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px'}}>
                    <button 
                        className="delete-account-btn-styled" 
                        onClick={() => {
                            setIsDeleteModalOpen(true);
                            setError("");
                            setConfirmPassword("");
                        }}
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Edit Profile Modal */}
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
                            {error && <p className="auth-error" style={{color: 'red'}}>{error}</p>}
                            <button type="submit" className="edit-btn">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Password-Verified Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content delete-modal">
                        <div className="modal-header-danger" style={{textAlign: 'center', marginBottom: '15px'}}>
                            <AlertTriangle color="#ff4d4d" size={40} />
                            <h2>Verify Identity</h2>
                        </div>
                        <p style={{textAlign: 'center', marginBottom: '20px'}}>This action is permanent. Please enter your password to confirm deletion.</p>
                        
                        <form onSubmit={handleDeleteAccount} className="modal-form">
                            <div className="password-input-wrapper" style={{position: 'relative', width: '100%'}}>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Enter your password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="confirm-password-input"
                                    style={{width: '100%', padding: '12px', marginBottom: '10px'}}
                                />
                                <div 
                                    className="show-password-toggle" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{position: 'absolute', right: '10px', top: '12px', cursor: 'pointer'}}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </div>
                            </div>
                            
                            {error && <p className="auth-error" style={{color: 'red', textAlign: 'center'}}>{error}</p>}
                            
                            <div className="modal-actions" style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                                <button type="button" className="cancel-btn" onClick={() => setIsDeleteModalOpen(false)} style={{flex: 1, padding: '10px'}}>Cancel</button>
                                <button type="submit" className="confirm-delete-btn-blue" style={{flex: 1, padding: '10px', backgroundColor: '#0066ff', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold'}}>Confirm Delete</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;