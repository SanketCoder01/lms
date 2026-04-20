import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './superAdmin.css';

// Derive base API URL (no trailing /api)
const _raw = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const SA_API = _raw.endsWith('/api') ? _raw.slice(0, -4) : _raw;

export const saFetch = async (url, options = {}) => {
  const token = sessionStorage.getItem('sa_token');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text.slice(0, 120)}`);
  }
  return res.json();
};

const navItems = [
  { path: '/super-admin/dashboard',     label: 'Dashboard',     icon: '📊' },
  { path: '/super-admin/users',         label: 'Companies',     icon: '🏢' },
  { path: '/super-admin/approvals',     label: 'Approvals',     icon: '✅', badge: true },
  { path: '/super-admin/module-users',  label: 'Module Access', icon: '🔐' },
  { path: '/super-admin/live-activity', label: 'Live Activity', icon: '👁️', live: true },
  { path: '/super-admin/announcements', label: 'Announcements', icon: '📢' },
];

const SuperAdminLayout = ({ children, title, subtitle, pendingCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dark / Light mode — persisted in localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('sa_theme') === 'dark';
  });

  useEffect(() => {
    // Only apply theme to the super-admin wrapper, not the whole page
    const wrapper = document.getElementById('sa-root');
    if (wrapper) {
      wrapper.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }
    localStorage.setItem('sa_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Guard: redirect to /admin login if no SA token
  useEffect(() => {
    const token = sessionStorage.getItem('sa_token');
    if (!token) navigate('/admin');
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('sa_token');
    navigate('/admin');
  };

  return (
    <div id="sa-root" className="sa-layout" data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* Mobile sidebar overlay */}
      <div 
        className={`sa-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={`sa-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sa-sidebar-brand">
          <div className="sa-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="sa-brand-text">
            <h3>Super Admin</h3>
            <p>Management Console</p>
          </div>
        </div>

        <nav className="sa-nav">
          <span className="sa-nav-sep">Main</span>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sa-nav-item${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && pendingCount > 0 && (
                <span className="sa-badge">{pendingCount}</span>
              )}
              {item.live && <span className="sa-live-dot" />}
            </Link>
          ))}
        </nav>

        <div className="sa-sidebar-footer">
          <button
            className="sa-nav-item sa-btn-ghost"
            style={{ width: '100%', border: 'none', fontSize: 14 }}
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile menu toggle */}
      <button 
        className="sa-mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ position: 'fixed', top: '12px', left: '16px', zIndex: 1001 }}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="sa-main">
        {/* Topbar — theme toggle lives here */}
        <div className="sa-topbar">
          <div className="sa-topbar-left">
            <h2>{title || 'Admin Panel'}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="sa-topbar-right">
            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="sa-theme-toggle"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="sa-theme-icon">{isDarkMode ? '☀️' : '🌙'}</span>
              <span className="sa-theme-label">{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>

            <div className="sa-admin-chip">
              <span className="sa-dot" />
              Super Admin
            </div>
          </div>
        </div>

        <div className="sa-page">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
