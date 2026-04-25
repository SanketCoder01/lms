import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './leaseManagerNew.css';

const LeaseNavBar = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    // Read company name dynamically from session
    const companyName = (() => {
      try {
        const u = JSON.parse(sessionStorage.getItem('user') || '{}');
        return u.company_name || 'Cusec Consulting LLP';
      } catch { return 'Cusec Consulting LLP'; }
    })();

    // Helper to check active state
    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <nav className="lease-navbar">
            <div className="lease-nav-container">
                {/* Brand */}
                <div className="lease-nav-brand">
                    <div className="logo-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </div>
                    <span className="brand-name">{companyName}</span>
                </div>

                {/* Links */}
                <div className={`lease-nav-links ${isOpen ? 'open' : ''}`}>
                    <Link to="/lease/dashboard" className={`nav-link ${isActive('/lease/dashboard') ? 'active' : ''}`}>
                        Dashboard
                    </Link>
                    <Link to="/lease/reviews" className={`nav-link ${isActive('/lease/reviews') ? 'active' : ''}`}>
                        Leases
                    </Link>
                    <Link to="/lease/tracking" className={`nav-link ${isActive('/lease/tracking') ? 'active' : ''}`}>
                        Lease Tracking
                    </Link>
                    <Link to="/lease/reports" className={`nav-link ${isActive('/lease/reports') ? 'active' : ''}`}>
                        Report
                    </Link>
                    <Link to="/lease/reminders" className={`nav-link ${isActive('/lease/reminders') ? 'active' : ''}`}>
                        Reminders
                    </Link>
                </div>

                {/* Right Side (Search + Profile) */}
                <div className="lease-nav-actions">
                    <div className="search-bar">
                        <input type="text" placeholder="Search system..." />
                        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    {/* Notification Bell */}
                    {/* Notification Bell */}
                    <Link to="/lease/notifications" className="icon-btn" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        <span className="notification-dot"></span>
                    </Link>
                    {/* User Avatar */}
                    <div className="user-avatar">
                        <div className="avatar-circle">M</div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
                        ☰
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default LeaseNavBar;
