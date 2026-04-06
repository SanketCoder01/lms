/**
 * authController.js — Real Authentication via Supabase Auth
 * ----------------------------------------------------------
 * login   : Signs in user with Supabase Auth (email + password)
 * register: Creates a new Supabase Auth user + inserts profile row in users table
 * logout  : Signs out the user
 * me      : Returns current user info from token
 */

const supabase = require('../config/db');

// ─── REGISTER ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, role = 'Admin', phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm email
      user_metadata: {
        first_name,
        last_name,
        role,
        phone,
      },
    });

    if (authError) {
      return res.status(400).json({ success: false, message: authError.message });
    }

    // Insert profile row in public.users table
    const { error: profileError } = await supabase.from('users').insert({
      id: parseInt(Date.now().toString().slice(-8)), // Temp ID (schema uses SERIAL)
      email,
      first_name: first_name || '',
      last_name: last_name || '',
      phone: phone || '',
      password_hash: 'SUPABASE_AUTH', // Not stored — Supabase manages passwords
      status: 'active',
    });

    if (profileError) {
      console.warn('Profile insert warning:', profileError.message);
      // Non-fatal — user was still created in auth
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
      },
    });

  } catch (error) {
    console.error('REGISTER ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ success: false, message: error.message });
    }

    const supabaseUser = data.user;
    const session = data.session;

    // Get role from user_metadata or users table
    const userRole = role ||
      supabaseUser.user_metadata?.role ||
      supabaseUser.app_metadata?.role ||
      'Admin';

    const user = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      first_name: supabaseUser.user_metadata?.first_name || email.split('@')[0],
      last_name: supabaseUser.user_metadata?.last_name || '',
      role: userRole,
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: session.access_token,
      refresh_token: session.refresh_token,
      user,
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    await supabase.auth.signOut();
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ME (get current user from token) ────────────────────────────────────────
const me = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        role: user.user_metadata?.role || 'Admin',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { login, register, logout, me };
