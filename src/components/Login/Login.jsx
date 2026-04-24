import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

// Use the company-auth backend, NOT Supabase Auth directly for company users
const getApiBase = () => {
  const url = process.env.REACT_APP_API_URL || '/api';
  return url.endsWith('/api') ? url : `${url}/api`;
};
const API = getApiBase();

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Register form state — company fields
  const [regData, setRegData] = useState({
    company_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [proofFile, setProofFile] = useState(null);

  // ── Always show login page — clear any stale session on load ──────────────────────
  useEffect(() => {
    // Clear stored tokens so the login page always shows fresh.
    // sessionStorage is per-tab — this only clears THIS tab's session.
    sessionStorage.removeItem('company_token');
    sessionStorage.removeItem('company_user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('company_session_id');
    sessionStorage.removeItem('permissions');
    sessionStorage.removeItem('module_name');
    sessionStorage.removeItem('is_module_user');
  }, []); // eslint-disable-line

  // ─── COMPANY USER LOGIN ─────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/company-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.code === 'PENDING_APPROVAL') {
          setError('⏳ Your account is pending admin approval. Please try again after approval.');
        } else if (data.code === 'SUSPENDED') {
          setError('🚫 Your account has been suspended. Please contact your administrator.');
        } else if (data.code === 'REJECTED') {
          setError('❌ Your registration was rejected. Please contact your administrator.');
        } else {
          setError(data.message || 'Invalid email or password.');
        }
        return;
      }

      // Store company user session in sessionStorage (per-tab isolation)
      sessionStorage.setItem('company_token', data.token);
      sessionStorage.setItem('token', data.token); // also set as 'token' for API interceptor
      sessionStorage.setItem('company_id', data.user.company_id || data.company_id || '');
      sessionStorage.setItem('company_user', JSON.stringify({
        ...data.user,
        session_id: data.session_id,
      }));
      sessionStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        first_name: data.user.company_name || data.user.email,
        last_name: '',
        role: data.user.role || 'Admin',
        company_name: data.user.company_name,
        phone: data.user.phone,
        address: data.user.address,
        modules_access: data.user.modules_access,
        type: data.user.type,
        module_name: data.user.module_name,
      }));
      sessionStorage.setItem('company_session_id', data.session_id || '');

      // ── Module user: store permissions + ALL assigned modules ──────────────
      const isModuleUser = data.user.type === 'module_user';
      const isProjectUser = data.user.type === 'project_user';
      sessionStorage.setItem('is_module_user', isModuleUser ? '1' : '0');
      sessionStorage.setItem('module_name', data.user.module_name || '');
      sessionStorage.setItem('permissions', JSON.stringify(data.user.permissions || {}));

      // Store ALL assigned modules array — always set when available
      const modulesAccess = data.user.modules_access;
      if ((isModuleUser || isProjectUser) && Array.isArray(modulesAccess) && modulesAccess.length > 0) {
        sessionStorage.setItem('modules_access', JSON.stringify(modulesAccess));
        console.log('[Login] modules_access stored:', modulesAccess.map(m => m.module_name));
      } else if (isModuleUser && data.user.module_name) {
        // Fallback: build single-entry array from primary module
        const fallback = [{
          module_name: data.user.module_name,
          permissions: data.user.permissions || { view: true, edit: false, delete: false },
        }];
        sessionStorage.setItem('modules_access', JSON.stringify(fallback));
        console.log('[Login] modules_access fallback:', data.user.module_name);
      } else {
        sessionStorage.removeItem('modules_access');
      }

      // Store project assignments — for both module_user with projects AND project_user
      const projectsAccess = data.user.projects_access;
      if (Array.isArray(projectsAccess) && projectsAccess.length > 0) {
        sessionStorage.setItem('projects_access', JSON.stringify(projectsAccess));
        console.log('[Login] projects_access stored:', projectsAccess.map(p => p.project_name));
      } else {
        sessionStorage.removeItem('projects_access');
      }

      // ── Project user: store project-specific info
      if (isProjectUser) {
        sessionStorage.setItem('is_project_user', '1');
        sessionStorage.setItem('project_id', data.user.project_id || '');
        sessionStorage.setItem('project_name', data.user.project_name || '');
        sessionStorage.setItem('project_permissions', JSON.stringify(data.user.permissions || {}));
      } else {
        sessionStorage.setItem('is_project_user', '0');
      }

      const MODULE_ROUTES = {
        dashboard: '/admin/dashboard',
        masters: '/admin/filter-options',
        leases: '/admin/leases',
        ownership: '/admin/ownership-mapping',
        projects: '/admin/projects',
      };

      if (isProjectUser && !(Array.isArray(modulesAccess) && modulesAccess.length > 0)) {
        // Pure project user — go directly to projects
        navigate('/admin/projects');
      } else if (isModuleUser || (isProjectUser && Array.isArray(modulesAccess) && modulesAccess.length > 0)) {
        // Navigate to the first assigned module (from full list or primary)
        const firstModule = (Array.isArray(modulesAccess) && modulesAccess.length > 0)
          ? modulesAccess[0].module_name
          : data.user.module_name;
        navigate(MODULE_ROUTES[firstModule] || '/admin/projects');
      } else {
        navigate('/admin/dashboard');
      }


    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── COMPANY REGISTRATION ───────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (regData.password !== regData.confirm_password) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (regData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const body = new FormData();
      body.append('company_name', regData.company_name);
      body.append('email', regData.email);
      body.append('phone', regData.phone);
      body.append('password', regData.password);
      if (proofFile) body.append('proof_document', proofFile);

      const res = await fetch(`${API}/company-auth/register`, {
        method: 'POST',
        body,
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Registration failed. Please try again.');
        return;
      }

      // Success — show pending message
      setMode('pending');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── PENDING MESSAGE PAGE ────────────────────────────────────────────────────
  if (mode === 'pending') {
    return (
      <div className="login-page">
        <div className="login-container" style={{ maxWidth: 560 }}>
          <div className="login-right" style={{ padding: '60px 48px', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
            <h2 style={{ marginBottom: 12, color: '#1a56db' }}>Registration Submitted!</h2>
            <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: 24 }}>
              Your request has been sent to the administrator for approval.<br />
              <strong>Please try to login after 24 hours.</strong><br />
              You will be notified once your account is approved.
            </p>
            <button
              className="login-button"
              onClick={() => setMode('login')}
              style={{ maxWidth: 220, margin: '0 auto' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">

        {/* Left Side */}
        <div className="login-left">
          <div className="brand-logo">
            <div className="logo-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <span>Cusec Consulting LLP</span>
          </div>

          <div className="hero-image-container">
            <div className="hero-image-placeholder"></div>
          </div>

          <div className="hero-text">
            <h2>Manage Properties with ease</h2>
            <p>Streamline your workflow and keep track of all your lease agreements in one place.</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="login-right">
          <div className="login-header">
            <h2>{mode === 'register' ? 'Create Account' : 'Welcome Back'}</h2>
            <p>
              {mode === 'register'
                ? 'Fill in your company details to request access.'
                : 'Please enter your credentials to log in.'}
            </p>
          </div>

          {error && (
            <div className={`error-message ${error.startsWith('✅') || error.startsWith('⏳') ? 'success' : 'error'}`}>
              {error}
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </span>
                  <input
                    type="email" placeholder="Enter your email"
                    value={loginData.email} required
                    onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                    value={loginData.password} required
                    onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword
                      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    }
                  </button>
                </div>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
                {!loading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>}
              </button>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === 'register' && (
            <form className="login-form" onSubmit={handleRegister}>
              <div className="form-group">
                <label>Company Name *</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                  </span>
                  <input type="text" placeholder="Your company name"
                    value={regData.company_name} required
                    onChange={e => setRegData({ ...regData, company_name: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </span>
                  <input type="email" placeholder="company@example.com"
                    value={regData.email} required
                    onChange={e => setRegData({ ...regData, email: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.6-.6a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </span>
                  <input type="tel" placeholder="+91 XXXXX XXXXX"
                    value={regData.phone} required
                    onChange={e => setRegData({ ...regData, phone: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Proof Document <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <div className="input-wrapper" style={{ padding: '4px 12px' }}>
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  </span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    style={{ border: 'none', background: 'transparent', flex: 1, fontSize: 13 }}
                    onChange={e => setProofFile(e.target.files[0])} />
                </div>
              </div>

              <div className="form-group">
                <label>Password *</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Choose a password (min 6 chars)"
                    value={regData.password} required
                    onChange={e => setRegData({ ...regData, password: e.target.value })} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword
                      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    }
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter your password"
                    value={regData.confirm_password} required
                    onChange={e => setRegData({ ...regData, confirm_password: e.target.value })} />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword
                      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    }
                  </button>
                </div>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Submitting...' : 'Create Account & Request Access'}
                {!loading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>}
              </button>
            </form>
          )}

          <div className="signup-link">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button className="mode-toggle-btn" onClick={() => setMode('register')}>Sign Up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button className="mode-toggle-btn" onClick={() => setMode('login')}>Log In</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
