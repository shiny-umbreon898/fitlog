import React, { useState } from 'react';
import '../App.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await fetch('http://localhost:5000/api/users/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        setMessage("A password reset link has been sent to your email address.");
    };

    return (
        <div className="profile-container">
            <div className="profile-card" style={{maxWidth: '400px', margin: '0 auto'}}>
                <h3 style={{marginTop: 0}}>Reset Password</h3>
                <form onSubmit={handleSubmit} className="modal-form">
                    <p style={{fontSize: '14px', color: '#6b7280'}}>Enter your email and we will send a reset link to your terminal window.</p>
                    <input type="email" placeholder="Email address" onChange={(e) => setEmail(e.target.value)} required />
                    <button type="submit" className="edit-btn">Send Link</button>
                    {message && <p className="success-msg">{message}</p>}
                </form>
            </div>
        </div>
    );
}

export default ForgotPassword;