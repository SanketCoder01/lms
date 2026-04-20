import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./RepSidebar.css";

function RepSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleNavClick = (route) => {
    // Use sessionStorage for per-tab session isolation
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (route === '/management/dashboard' && user.role === 'lease_manager') {
      navigate('/lease/dashboard');
    } else {
      navigate(route);
    }
    setIsOpen(false);
  };

  // Helper to determine active state
  const isActive = (routeKey) => {
    if (routeKey === 'dashboard' && (path.includes('/management/dashboard') || path.includes('/lease/dashboard'))) return true;
    if (routeKey === 'reports' && path.includes('/management/reports')) return true;
    if (routeKey === 'doc-repo' && path.includes('/doc-repo')) return true;
    if (routeKey === 'tracker' && path.includes('/management/lease-tracker')) return true;
    if (routeKey === 'review-center' && path.includes('/management/review-center')) return true;
    if (routeKey === 'notification' && path.includes('/management/notifications')) return true;
    if (routeKey === 'search' && path.includes('/management/search')) return true;
    if (routeKey === 'settings' && path.includes('/settings')) return true;
    return false;
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      <div className="mobile-toggle" onClick={toggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo / Company Name */}
        <div className="sidebar-header">
          <div className="logo-area">
            <div className="logo-icon-container">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" /><path d="M17 21v-8.5a2.5 2.5 0 0 0-5 0V21" /></svg>
            </div>
            <span className="logo-text">Cusec Consulting</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="sidebar-menu">
          <div
            className={`menu-item ${isActive('dashboard') ? 'active' : ''}`}
            onClick={() => handleNavClick('/management/dashboard')}
          >
            <span className="menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </span>
            Dashboard
          </div>

          <div
            className={`menu-item ${isActive('reports') ? 'active' : ''}`}
            onClick={() => handleNavClick('/management/reports')}
          >
            <span className="menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </span>
            Reports
          </div>

          <div
            className={`menu-item ${isActive('doc-repo') ? 'active' : ''}`}
            onClick={() => handleNavClick('/doc-repo')}
          >
            <span className="menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </span>
            Documents
          </div>

          <div
            className={`menu-item ${isActive('review-center') ? 'active' : ''}`}
            onClick={() => handleNavClick('/management/review-center')}
          >
            <span className="menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            </span>
            Review Center
          </div>

          <div
            className={`menu-item ${isActive('tracker') ? 'active' : ''}`}
            onClick={() => handleNavClick('/management/lease-tracker')}
          >
            <span className="menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </span>
            Lease Tracker
          </div>

          <div
            className={`menu-item ${isActive('notification') ? 'active' : ''}`}
            onClick={() => handleNavClick('/management/notifications')}
          >
            <span className="menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </span>
            Notifications
          </div>

          <div
            className={`menu-item ${isActive('settings') ? 'active' : ''}`}
            onClick={() => handleNavClick('/management/settings')}
          >
            <span className="menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </span>
            Settings
          </div>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="nav-item logout" onClick={() => navigate('/logout')}>
            <span className="icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </span>
            Log Out
          </div>
        </div>
      </div >
    </>
  );
}

export default RepSidebar;
