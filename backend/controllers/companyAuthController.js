/**
 * controllers/companyAuthController.js
 * Handles company user login, registration, session heartbeat, and logout.
 * Company users are stored in company_users table (NOT Supabase Auth).
 */

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const supabase = require('../config/db');

const COMPANY_JWT_SECRET = process.env.COMPANY_JWT_SECRET || 'COMPANY_USER_JWT_SECRET_2024';

// ─── COMPANY LOGIN ───────────────────────────────────────────────────────────
const companyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    // 1. Check if email is in company_users (full company admin)
    const { data: user, error } = await supabase
      .from('company_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      // ── 1a. Try module_users (sub-user assigned by super admin) ──────────────
      const { data: moduleUser, error: muErr } = await supabase
        .from('module_users')
        .select('*, company_users!module_users_company_id_fkey(company_name)')
        .eq('email', email)
        .single();

      if (!muErr && moduleUser) {
        // Check status
        if (moduleUser.status === 'suspended')
          return res.status(403).json({ success: false, message: 'Your module account has been suspended.', code: 'SUSPENDED' });

        const isValid = await bcrypt.compare(password, moduleUser.password_hash);
        if (!isValid)
          return res.status(401).json({ success: false, message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' });

        const companyName = moduleUser.company_users?.company_name || '';

        const token = jwt.sign(
          {
            id: moduleUser.id,
            email: moduleUser.email,
            company_id: moduleUser.company_id,
            company_name: companyName,
            type: 'module_user',
            module_name: moduleUser.module_name,
            permissions: moduleUser.permissions,
          },
          COMPANY_JWT_SECRET,
          { expiresIn: '8h' }
        );

        return res.json({
          success: true,
          token,
          session_id: null,
          user: {
            id: moduleUser.id,
            email: moduleUser.email,
            company_id: moduleUser.company_id,
            company_name: companyName,
            type: 'module_user',
            module_name: moduleUser.module_name,
            permissions: moduleUser.permissions,
            status: moduleUser.status,
          },
          message: 'Login successful',
        });
      }

      // ── 1b. Check pending/rejected registrations ──────────────────────────
      const { data: pending } = await supabase
        .from('company_registrations')
        .select('status')
        .eq('email', email)
        .single();

      if (pending && pending.status === 'pending')
        return res.status(403).json({ success: false, message: 'Your account is pending admin approval. Please wait.', code: 'PENDING_APPROVAL' });

      if (pending && pending.status === 'rejected')
        return res.status(403).json({ success: false, message: 'Your registration has been rejected. Contact administrator.', code: 'REJECTED' });

      return res.status(401).json({ success: false, message: 'Invalid email or password. Contact your administrator.', code: 'INVALID_CREDENTIALS' });
    }

    // 2. Check status
    if (user.status === 'suspended')
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact administrator.', code: 'SUSPENDED' });

    // 3. Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid)
      return res.status(401).json({ success: false, message: 'Invalid email or password. Contact your administrator.', code: 'INVALID_CREDENTIALS' });

    // 4. Update last_login
    await supabase.from('company_users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    // 5. Create session record for live activity
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    const { data: session } = await supabase
      .from('user_sessions')
      .insert({
        company_user_id: user.id,
        email: user.email,
        company_name: user.company_name,
        ip_address: ip,
        user_agent: userAgent,
        is_active: true,
      })
      .select()
      .single();

    // 6. Issue JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        company_id: user.id,        // company_id = the user's own id (isolation key)
        company_name: user.company_name,
        role: user.role,
        session_id: session?.id,
        modules_access: user.modules_access,
        type: 'company_user',
      },
      COMPANY_JWT_SECRET,
      { expiresIn: '8h' }
    );

    const { password_hash: _, ...safeUser } = user;
    return res.json({
      success: true,
      token,
      session_id: session?.id,
      user: { ...safeUser, company_id: user.id },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('COMPANY LOGIN ERROR:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── COMPANY REGISTRATION (self-register) ────────────────────────────────────
const companyRegister = async (req, res) => {
  try {
    const { company_name, email, phone, address, role, password } = req.body;

    if (!company_name || !email || !password)
      return res.status(400).json({ success: false, message: 'Company name, email and password are required' });

    // Password match validation is done on frontend - no need to check here

    // Check if already registered or already a user
    const { data: existingReg } = await supabase.from('company_registrations').select('id, status').eq('email', email).single();
    if (existingReg)
      return res.status(409).json({ success: false, message: `Email already submitted for registration (status: ${existingReg.status})` });

    const { data: existingUser } = await supabase.from('company_users').select('id').eq('email', email).single();
    if (existingUser)
      return res.status(409).json({ success: false, message: 'This email is already registered. Please login.' });

    const password_hash = await bcrypt.hash(password, 12);

    // Get proof document path if uploaded
    const proof_document = req.file ? `/uploads/${req.file.filename}` : null;

    const { data, error } = await supabase
      .from('company_registrations')
      .insert({
        company_name, email, phone, address,
        role: role || 'user',
        password_hash,
        proof_document,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! An administrator will review and approve your account.',
      registration_id: data.id,
    });
  } catch (err) {
    console.error('COMPANY REGISTER ERROR:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SESSION HEARTBEAT (called every 30s from frontend) ──────────────────────
const sessionHeartbeat = async (req, res) => {
  try {
    const { session_id, current_page } = req.body;
    if (!session_id) return res.status(400).json({ success: false, message: 'session_id required' });

    // Check if session was killed by admin
    const { data: session } = await supabase
      .from('user_sessions')
      .select('is_active')
      .eq('id', session_id)
      .single();

    if (!session || !session.is_active)
      return res.status(401).json({ success: false, message: 'Session terminated by administrator', code: 'SESSION_KILLED' });

    // Update last_seen
    await supabase.from('user_sessions').update({
      last_seen: new Date().toISOString(),
      current_page: current_page || '/',
    }).eq('id', session_id);

    return res.json({ success: true, active: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── COMPANY LOGOUT ──────────────────────────────────────────────────────────
const companyLogout = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (session_id)
      await supabase.from('user_sessions').update({ is_active: false }).eq('id', session_id);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// __ GET ACTIVE ANNOUNCEMENTS (for company users) _______________
const getActiveAnnouncements = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, message, type, created_at, expires_at')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });

    // Handle missing table or other errors gracefully
    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.json({ success: true, announcements: [] });
      }
      console.error('[getActiveAnnouncements]', error);
      return res.json({ success: true, announcements: [] });
    }
    
    return res.json({ success: true, announcements: data || [] });
  } catch (err) {
    console.error('[getActiveAnnouncements] catch:', err);
    return res.json({ success: true, announcements: [] });
  }
};

// ─── GET ME (Live profile) ───────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, COMPANY_JWT_SECRET);
    const userId = decoded.id;

    const { data: user, error } = await supabase
      .from('company_users')
      .select('id, first_name, last_name, company_name, email, phone, role, status, profile_image, modules_access, created_at, last_login')
      .eq('id', userId)
      .single();

    if (error || !user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.json({ success: true, user });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    console.error("getMe error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { companyLogin, companyRegister, sessionHeartbeat, companyLogout, getActiveAnnouncements, getMe };
