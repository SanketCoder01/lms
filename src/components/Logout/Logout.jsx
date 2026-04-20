import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Logout.css';

const Logout = () => {
    const navigate = useNavigate();

    const handleCancel = () => {
        navigate(-1); // Go back to previous page on cancel
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Use sessionStorage for per-tab session isolation
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('company_token');
        sessionStorage.removeItem('company_user');
        sessionStorage.removeItem('company_session_id');
        navigate('/login');
    };

    return (
        <div className="logout-page">
            <div className="logout-card">
                <button className="close-button" onClick={handleCancel}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="icon-container">
                    <svg className="logout-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </div>

                <h2>Confirm Logout</h2>

                <p>
                    You are about to leave the administration panel. Any unsaved changes may be lost. Are you sure you want to proceed?
                </p>

                <div className="logout-actions">
                    <button className="btn-cancel" onClick={handleCancel}>
                        No, Cancel
                    </button>
                    <button className="btn-logout" onClick={handleLogout}>
                        Yes, Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Logout;
