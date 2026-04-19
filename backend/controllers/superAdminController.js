/**
 * controllers/superAdminController.js
 * Handles all Super Admin panel operations:
 *   - Login (static credentials)
 *   - Company user CRUD
 *   - Self-registration approvals
 *   - Live session monitoring + kill sessions
 *   - Announcements
 */

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const supabase = require('../config/db');

const SUPER_ADMIN_EMAIL    = 'sanketg367@gmail.com';
const SUPER_ADMIN_PASSWORD = 'sanket@99';
const SUPER_ADMIN_SECRET   = process.env.SUPER_ADMIN_SECRET || 'SUPER_ADMIN_STATIC_SECRET_2024';
const COMPANY_JWT_SECRET   = process.env.COMPANY_JWT_SECRET || 'COMPANY_USER_JWT_SECRET_2024';

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' });

  if (email !== SUPER_ADMIN_EMAIL || password !== SUPER_ADMIN_PASSWORD)
    return res.status(401).json({ success: false, message: 'Invalid super admin credentials' });

  const token = jwt.sign(
    { role: 'super_admin', email: SUPER_ADMIN_EMAIL },
    SUPER_ADMIN_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({ success: true, token, message: 'Super admin login successful' });
};

// ─── GET DASHBOARD STATS ──────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [{ count: totalUsers }, { count: pendingApprovals }, { count: activeSessions }, { count: announcements }] =
      await Promise.all([
        supabase.from('company_users').select('*', { count: 'exact', head: true }),
        supabase.from('company_registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('user_sessions').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);

    return res.json({
      success: true,
      stats: {
        totalCompanies: totalUsers || 0,
        pendingApprovals: pendingApprovals || 0,
        activeNow: activeSessions || 0,
        activeAnnouncements: announcements || 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── COMPANY USERS — LIST ────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('company_users')
      .select('id, company_name, email, phone, address, role, status, modules_access, created_by, last_login, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, users: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── COMPANY USERS — CREATE ──────────────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { company_name, email, phone, address, role, password, modules_access } = req.body;

    if (!company_name || !email || !password)
      return res.status(400).json({ success: false, message: 'Company name, email and password are required' });

    // Check duplicate
    const { data: existing } = await supabase.from('company_users').select('id').eq('email', email).single();
    if (existing)
      return res.status(409).json({ success: false, message: 'A user with this email already exists' });

    const password_hash = await bcrypt.hash(password, 12);

    const defaultModules = {
      dashboard: true, projects: true, units: true, leases: true,
      parties: true, reports: true, notifications: true, settings: false,
    };

    const { data, error } = await supabase
      .from('company_users')
      .insert({
        company_name, email, phone, address,
        role: role || 'user',
        password_hash,
        status: 'active',
        modules_access: modules_access || defaultModules,
        created_by: 'super_admin',
      })
      .select()
      .single();

    if (error) throw error;
    const { password_hash: _, ...safeUser } = data;
    return res.status(201).json({ success: true, user: safeUser, message: 'Company user created successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── COMPANY USERS — UPDATE ──────────────────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, email, phone, address, role, password, status } = req.body;

    const updates = { company_name, email, phone, address, role, status, updated_at: new Date().toISOString() };
    if (password) updates.password_hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('company_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const { password_hash: _, ...safeUser } = data;
    return res.json({ success: true, user: safeUser, message: 'User updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── COMPANY USERS — DELETE ──────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('company_users').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── COMPANY USERS — TOGGLE STATUS ───────────────────────────────────────────
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'suspended'

    const { data, error } = await supabase
      .from('company_users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, email, status')
      .single();

    if (error) throw error;
    // Kill active sessions if suspending
    if (status === 'suspended') {
      await supabase.from('user_sessions').update({ is_active: false }).eq('company_user_id', id);
    }
    return res.json({ success: true, user: data, message: `User ${status === 'suspended' ? 'suspended' : 'activated'} successfully` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── COMPANY USERS — UPDATE MODULE ACCESS ────────────────────────────────────
const updateModules = async (req, res) => {
  try {
    const { id } = req.params;
    const { modules_access } = req.body;

    const { data, error } = await supabase
      .from('company_users')
      .update({ modules_access, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, email, modules_access')
      .single();

    if (error) throw error;
    return res.json({ success: true, user: data, message: 'Module access updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── REGISTRATIONS — LIST (pending/all) ──────────────────────────────────────
const getRegistrations = async (req, res) => {
  try {
    const { status } = req.query; // optional filter
    let query = supabase.from('company_registrations')
      .select('id, company_name, email, phone, address, role, proof_document, status, rejection_note, created_at, approved_at, approved_by')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, registrations: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── REGISTRATIONS — APPROVE ─────────────────────────────────────────────────
const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: reg, error: regError } = await supabase
      .from('company_registrations')
      .select('*')
      .eq('id', id)
      .single();

    if (regError || !reg)
      return res.status(404).json({ success: false, message: 'Registration not found' });

    if (reg.status !== 'pending')
      return res.status(400).json({ success: false, message: `Registration is already ${reg.status}` });

    // Check for duplicate in company_users
    const { data: existing } = await supabase.from('company_users').select('id').eq('email', reg.email).single();
    if (existing)
      return res.status(409).json({ success: false, message: 'A user with this email already exists' });

    const defaultModules = {
      dashboard: true, projects: true, units: true, leases: true,
      parties: true, reports: true, notifications: true, settings: false,
    };

    // Create company user
    const { data: newUser, error: createError } = await supabase
      .from('company_users')
      .insert({
        company_name: reg.company_name, email: reg.email, phone: reg.phone,
        address: reg.address, role: reg.role, password_hash: reg.password_hash,
        status: 'active', modules_access: defaultModules, created_by: 'self_registered',
      })
      .select()
      .single();

    if (createError) throw createError;

    // Mark registration as approved
    await supabase.from('company_registrations').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: 'super_admin',
    }).eq('id', id);

    return res.json({ success: true, user: newUser, message: 'Registration approved. Company user can now login.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── REGISTRATIONS — REJECT ──────────────────────────────────────────────────
const rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_note } = req.body;

    const { error } = await supabase
      .from('company_registrations')
      .update({ status: 'rejected', rejection_note: rejection_note || 'Rejected by admin' })
      .eq('id', id);

    if (error) throw error;
    return res.json({ success: true, message: 'Registration rejected' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LIVE SESSIONS — LIST ────────────────────────────────────────────────────
const getSessions = async (req, res) => {
  try {
    // Auto-expire sessions not seen in last 15 minutes
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .lt('last_seen', new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('is_active', true)
      .order('logged_in_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, sessions: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LIVE SESSIONS — KILL (force logout) ─────────────────────────────────────
const killSession = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get session info before killing
    const { data: session, error: fetchError } = await supabase
      .from('user_sessions')
      .select('id, company_user_id, email, company_name')
      .eq('id', id)
      .single();
    
    if (fetchError || !session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    // Mark session as killed (not just inactive)
    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false, 
        killed_at: new Date().toISOString(),
        killed_by: 'admin'
      })
      .eq('id', id);
    
    if (error) throw error;
    
    // Insert notification for the affected user
    await supabase
      .from('session_kill_notifications')
      .insert({
        company_user_id: session.company_user_id,
        session_id: id,
        message: 'Your session has been terminated by an administrator.',
        created_at: new Date().toISOString()
      })
      .then(() => console.log('Session kill notification inserted for user:', session.company_user_id))
      .catch(err => console.error('Failed to insert kill notification:', err));
    
    return res.json({ 
      success: true, 
      message: 'Session terminated',
      session: { id, email: session.email, company_name: session.company_name }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ANNOUNCEMENTS — LIST ─────────────────────────────────────────────────────
const getAnnouncements = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Handle missing table gracefully
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.json({ success: true, announcements: [] });
      }
      throw error;
    }
    return res.json({ success: true, announcements: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ANNOUNCEMENTS — CREATE ───────────────────────────────────────────────────
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, expires_at } = req.body;
    if (!title || !message)
      return res.status(400).json({ success: false, message: 'Title and message are required' });

    const { data, error } = await supabase
      .from('announcements')
      .insert({ title, message, type: type || 'info', is_active: true, expires_at })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, announcement: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ANNOUNCEMENTS — TOGGLE ───────────────────────────────────────────────────
const toggleAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const { data, error } = await supabase
      .from('announcements').update({ is_active }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, announcement: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ANNOUNCEMENTS — DELETE ───────────────────────────────────────────────────
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  login,
  getDashboardStats,
  getUsers, createUser, updateUser, deleteUser, toggleUserStatus, updateModules,
  getRegistrations, approveRegistration, rejectRegistration,
  getSessions, killSession,
  getAnnouncements, createAnnouncement, toggleAnnouncement, deleteAnnouncement,
};
