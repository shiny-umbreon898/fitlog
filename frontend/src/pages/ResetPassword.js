import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';

function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ password: '', confirm: '' });
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');

        const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!regex.test(form.password)) {
            setError("Must be 8+ chars with a number, uppercase and lowercase.");
            return;
        }

        if (form.password !== form.confirm) {
            setError("Passwords do not match!");
            return;
        }

        const res = await fetch(`http://localhost:5000/api/users/reset-password/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: form.password })
        });

        if (res.ok) {
            alert("Password updated! Please login.");
            navigate('/login');
        } else {
            setError("This link is invalid or has expired.");
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-card" style={{maxWidth: '400px', margin: '0 auto'}}>
                <h3 style={{marginTop: 0}}>Create New Password</h3>
                <form onSubmit={handleReset} className="modal-form">
                    <input type={showPass ? "text" : "password"} placeholder="New Password" onChange={(e)=>setForm({...form, password: e.target.value})} required />
                    <input type={showPass ? "text" : "password"} placeholder="Confirm Password" onChange={(e)=>setForm({...form, confirm: e.target.value})} required />
                    
                    <label style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <input type="checkbox" style={{width: 'auto'}} onChange={() => setShowPass(!showPass)} /> Show Passwords
                    </label>

                    {error && <p className="error-msg">{error}</p>}
                    <button type="submit" className="edit-btn">Update Password</button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;