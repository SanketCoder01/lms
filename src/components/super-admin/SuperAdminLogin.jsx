import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './superAdmin.css';

const _raw = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API = _raw.endsWith('/api') ? _raw.slice(0, -4) : _raw;


const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('sa_token');
    if (token) navigate('/super-admin/dashboard');
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/super-admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      sessionStorage.setItem('sa_token', data.token);
      navigate('/super-admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sa-login-root">
      {/* Animated background orbs */}
      <div className="sa-bg-orb orb1" />
      <div className="sa-bg-orb orb2" />
      <div className="sa-bg-orb orb3" />

      <div className="sa-login-card">
        {/* Left panel */}
        <div className="sa-login-left">
          <div className="sa-shield-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1>Super Admin</h1>
          <p>Secure management console for controlling company access, monitoring live activity, and managing the platform.</p>

          <div className="sa-feature-list">
            {[
              { icon: '🏢', label: 'Company Credential Management' },
              { icon: '👁️', label: 'Live Activity Monitoring' },
              { icon: '🔐', label: 'Module-Level Access Control' },
              { icon: '📋', label: 'Approval Workflow' },
              { icon: '📢', label: 'System Announcements' },
            ].map((f, i) => (
              <div key={i} className="sa-feature-item">
                <span className="sa-feature-icon">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="sa-login-right">
          <div className="sa-login-header">
            <div className="sa-avatar">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h2>Admin Access</h2>
            <p>Sign in with your super admin credentials</p>
          </div>

          {error && <div className="sa-error-box">{error}</div>}

          <form onSubmit={handleLogin} className="sa-login-form">
            <div className="sa-field">
              <label>Email Address</label>
              <div className="sa-input-wrap">
                <span className="sa-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input
                  type="email"
                  id="sa-email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="sa-field">
              <label>Password</label>
              <div className="sa-input-wrap">
                <span className="sa-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  id="sa-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="sa-eye-btn" onClick={() => setShowPwd(p => !p)}>
                  {showPwd
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" className="sa-login-btn" disabled={loading} id="sa-login-submit">
              {loading ? (
                <><span className="sa-spinner" />Authenticating...</>
              ) : (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>Access Admin Panel</>
              )}
            </button>
          </form>

          <p className="sa-secure-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Restricted access — authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
