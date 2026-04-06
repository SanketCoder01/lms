import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'Admin',
  });

  // If already logged in, redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const role = session.user.user_metadata?.role || 'Admin';
        redirectByRole(role);
      }
    });
  }, []); // eslint-disable-line

  const redirectByRole = (role) => {
    if (role === 'Lease Manager') return navigate('/lease-manager/dashboard');
    if (role === 'Management Rep') return navigate('/management/dashboard');
    if (role === 'Data Entry') return navigate('/data-entry/dashboard');
    return navigate('/admin/dashboard');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      const user = data.user;
      const role = user.user_metadata?.role || formData.role || 'Admin';

      // Persist user info for the app
      localStorage.setItem('token', data.session.access_token);
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || user.email.split('@')[0],
        last_name: user.user_metadata?.last_name || '',
        role,
      }));

      redirectByRole(role);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ─── REGISTER ──────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
          },
        },
      });

      if (authError) throw authError;

      if (data.user && !data.session) {
        // Email confirmation required
        setError('✅ Registration successful! Check your email to confirm your account.');
        setMode('login');
      } else if (data.session) {
        // Auto-confirmed
        localStorage.setItem('token', data.session.access_token);
        localStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          role: formData.role,
        }));
        redirectByRole(formData.role);
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─── FORGOT PASSWORD ────────────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        { redirectTo: `${window.location.origin}/login` }
      );
      if (resetError) throw resetError;
      setError('✅ Password reset link sent! Check your email.');
      setTimeout(() => setMode('login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = mode === 'register'
    ? handleRegister
    : mode === 'forgot'
      ? handleForgotPassword
      : handleLogin;

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
            <h2>
              {mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome Back'}
            </h2>
            <p>
              {mode === 'register'
                ? 'Fill in the details to create your account.'
                : mode === 'forgot'
                  ? "We'll send a password reset link to your email."
                  : 'Please enter your details to log in.'}
            </p>
          </div>

          {error && (
            <div className={`error-message ${error.startsWith('✅') ? 'success' : 'error'}`}>
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={submitHandler}>

            {/* Name fields (register only) */}
            {mode === 'register' && (
              <div className="name-row">
                <div className="form-group">
                  <label>First Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </span>
                    <input type="text" name="first_name" placeholder="First Name"
                      value={formData.first_name} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </span>
                    <input type="text" name="last_name" placeholder="Last Name"
                      value={formData.last_name} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </span>
                <input type="email" name="email" placeholder="Enter your email"
                  value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            {/* Password (not for forgot) */}
            {mode !== 'forgot' && (
              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <input type={showPassword ? 'text' : 'password'} name="password"
                    placeholder="Enter your password" value={formData.password}
                    onChange={handleChange} required={mode !== 'forgot'} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword
                      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Role selector (login + register) */}
            {mode !== 'forgot' && (
              <div className="form-group">
                <label>Role</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </span>
                  <select name="role" value={formData.role} onChange={handleChange} className="role-select">
                    <option value="Admin">Admin</option>
                    <option value="Data Entry">Data Entry</option>
                    <option value="Lease Manager">Lease Manager</option>
                    <option value="Management Rep">Management Representative</option>
                  </select>
                  <span className="select-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </div>
              </div>
            )}

            {/* Forgot password link */}
            {mode === 'login' && (
              <div className="form-actions">
                <label className="remember-me">
                  <input type="checkbox" /> Remember me
                </label>
                <button type="button" className="forgot-password" onClick={() => setMode('forgot')}>
                  Forgot Password?
                </button>
              </div>
            )}

            <button type="submit" className="login-button" disabled={loading}>
              {loading
                ? 'Please wait...'
                : mode === 'register'
                  ? 'Create Account'
                  : mode === 'forgot'
                    ? 'Send Reset Link'
                    : 'Login'}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              )}
            </button>
          </form>

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
