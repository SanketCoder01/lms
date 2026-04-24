/**
 * controllers/superAdminController.js
 * Handles all Super Admin panel operations:
 *   - Login (static credentials)
 *   - Company user CRUD
 *   - Self-registration approvals
 *   - Live session monitoring + kill sessions
 *   - Announcements
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

const SUPER_ADMIN_EMAIL = 'sanketg367@gmail.com';
const SUPER_ADMIN_PASSWORD = 'sanket@99';
const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || 'SUPER_ADMIN_STATIC_SECRET_2024';
const COMPANY_JWT_SECRET = process.env.COMPANY_JWT_SECRET || 'COMPANY_USER_JWT_SECRET_2024';

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

// ─── COMPANY USERS — DELETE ──────────────────────────────────────────────────// --- COMPANY USERS - DELETE (with all related data)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Get company_user details before deletion
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('id, email')
      .eq('id', id)
      .single();

    if (!companyUser) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Delete all related data for this company
    // Order matters due to foreign key constraints

    // 1. Kill all active sessions for this company user
    await supabase.from('user_sessions').delete().eq('company_user_id', id);

    // 2. Delete unit ownership documents for this company's units
    const { data: companyUnits } = await supabase.from('units').select('id').eq('company_id', id);
    if (companyUnits && companyUnits.length > 0) {
      const unitIds = companyUnits.map(u => u.id);
      // Delete documents linked to these units
      await supabase.from('unit_ownership_documents').delete().in('unit_id', unitIds);
      // Delete unit ownerships
      await supabase.from('unit_ownerships').delete().in('unit_id', unitIds);
      // Delete unit images
      await supabase.from('unit_images').delete().in('unit_id', unitIds);
    }

    // 3. Delete lease escalations for this company's leases
    const { data: companyLeases } = await supabase.from('leases').select('id').eq('company_id', id);
    if (companyLeases && companyLeases.length > 0) {
      const leaseIds = companyLeases.map(l => l.id);
      await supabase.from('lease_escalations').delete().in('lease_id', leaseIds);
    }

    // 4. Delete leases for this company
    await supabase.from('leases').delete().eq('company_id', id);

    // 5. Delete units for this company
    await supabase.from('units').delete().eq('company_id', id);

    // 6. Delete project blocks and floors for this company's projects
    const { data: companyProjects } = await supabase.from('projects').select('id').eq('company_id', id);
    if (companyProjects && companyProjects.length > 0) {
      const projectIds = companyProjects.map(p => p.id);
      await supabase.from('project_floors').delete().in('project_id', projectIds);
      await supabase.from('project_blocks').delete().in('project_id', projectIds);
    }

    // 7. Delete projects for this company
    await supabase.from('projects').delete().eq('company_id', id);

    // 8. Delete parties for this company
    await supabase.from('parties').delete().eq('company_id', id);

    // 9. Delete filter options for this company
    await supabase.from('filter_options').delete().eq('company_id', id);

    // 10. Delete activity logs for this company
    await supabase.from('activity_logs').delete().eq('company_id', id);

    // 11. Delete notifications for this company
    await supabase.from('notifications').delete().eq('company_id', id);

    // 12. Delete owners for this company
    const { data: companyOwners } = await supabase.from('owners').select('id').eq('company_id', id);
    if (companyOwners && companyOwners.length > 0) {
      const ownerIds = companyOwners.map(o => o.id);
      await supabase.from('owner_documents').delete().in('owner_id', ownerIds);
      await supabase.from('owner_units').delete().in('owner_id', ownerIds);
    }
    await supabase.from('owners').delete().eq('company_id', id);

    // 13. Delete tenants for this company
    const { data: companyTenants } = await supabase.from('tenants').select('id').eq('company_id', id);
    if (companyTenants && companyTenants.length > 0) {
      const tenantIds = companyTenants.map(t => t.id);
      await supabase.from('tenant_units').delete().in('tenant_id', tenantIds);
    }
    await supabase.from('tenants').delete().eq('company_id', id);

    // 14. Finally, delete the company user record
    const { error } = await supabase.from('company_users').delete().eq('id', id);
    if (error) throw error;

    return res.json({ success: true, message: 'Company and all related data deleted successfully' });
  } catch (err) {
    console.error('Delete company error:', err);
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
    console.log('[killSession] Attempting to kill session:', id);

    // Get session info before killing
    const { data: session, error: fetchError } = await supabase
      .from('user_sessions')
      .select('id, company_user_id, email, company_name')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('[killSession] Fetch error:', fetchError);
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Try to update with killed_at and killed_by columns
    // If those columns don't exist, just set is_active to false
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({
        is_active: false,
        killed_at: new Date().toISOString(),
        killed_by: 'admin'
      })
      .eq('id', id);

    if (updateError) {
      console.error('[killSession] Update with killed_at failed, trying basic update:', updateError);
      // Fallback: just set is_active to false
      const { error: fallbackError } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', id);

      if (fallbackError) {
        console.error('[killSession] Fallback update also failed:', fallbackError);
        throw fallbackError;
      }
    }

    // Try to insert notification (non-critical, don't fail if this errors)
    try {
      await supabase
        .from('session_kill_notifications')
        .insert({
          company_user_id: session.company_user_id,
          session_id: parseInt(id),
          message: 'Your session has been terminated by an administrator.',
          created_at: new Date().toISOString()
        });
      console.log('[killSession] Notification inserted for user:', session.company_user_id);
    } catch (notifErr) {
      console.warn('[killSession] Could not insert notification (non-critical):', notifErr.message);
    }

    console.log('[killSession] Session terminated successfully:', id);
    return res.json({
      success: true,
      message: 'Session terminated',
      session: { id, email: session.email, company_name: session.company_name }
    });
  } catch (err) {
    console.error('[killSession] Unexpected error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
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

// --- MODULE USERS - GET BY COMPANY
const getModuleUsers = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { data, error } = await supabase
      .from('module_users')
      .select('*')
      .eq('company_id', companyId);
    if (error) throw error;
    return res.json({ success: true, moduleUsers: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- MODULE USERS - CREATE
const createModuleUser = async (req, res) => {
  try {
    const { company_id, module_name, email, password, permissions } = req.body;

    // Validate required fields
    if (!company_id || !module_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Company, module, email, and password are required' });
    }

    // Check if module already has a user assigned for this company
    const { data: existing } = await supabase
      .from('module_users')
      .select('id')
      .eq('company_id', company_id)
      .eq('module_name', module_name)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, message: 'A user is already assigned to this module for this company' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(password, 10);

    // Create module user
    const { data, error } = await supabase
      .from('module_users')
      .insert({
        company_id,
        module_name,
        email,
        password_hash,
        permissions: permissions || {},
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, moduleUser: data, message: 'Module user created successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- MODULE USERS - UPDATE
const updateModuleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, password } = req.body;

    const updateData = {
      permissions: permissions || {},
      updated_at: new Date().toISOString()
    };

    // Update password if provided
    if (password) {
      const bcrypt = require('bcryptjs');
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from('module_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, moduleUser: data, message: 'Module user updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- MODULE USERS - DELETE
const deleteModuleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('module_users').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true, message: 'Module user deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SUPER ADMIN — GET COMPANY PROJECT LIMIT ─────────────────────────────────
const getCompanyProjectLimit = async (req, res) => {
  try {
    const { company_id } = req.params;
    if (!company_id) return res.status(400).json({ success: false, message: 'company_id required' });

    const { data: company } = await supabase
      .from('company_users')
      .select('id, company_name, project_limit')
      .eq('id', company_id)
      .single();

    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const { count } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', Number(company_id))
      .eq('status', 'active');

    return res.json({
      success: true,
      project_limit: company.project_limit || null,
      current_count: count || 0,
      remaining: company.project_limit ? Math.max(0, company.project_limit - (count || 0)) : null,
    });
  } catch (err) {
    console.error('[getCompanyProjectLimit]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SUPER ADMIN — CREATE PROJECT FOR COMPANY ────────────────────────────────
const createCompanyProject = async (req, res) => {
  try {
    const {
      company_id, project_name, location, address, project_type,
      calculation_type, total_floors, total_project_area, description,
      project_limit   // NEW: max projects allowed for this company (1-12)
    } = req.body;

    if (!company_id || !project_name) {
      return res.status(400).json({ success: false, message: 'company_id and project_name are required' });
    }

    // Verify company exists
    const { data: company } = await supabase
      .from('company_users')
      .select('id, company_name, project_limit')
      .eq('id', company_id)
      .single();

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Determine effective limit (use new value if provided, else existing)
    const effectiveLimit = project_limit ? parseInt(project_limit) : (company.project_limit || null);

    // Count existing active projects for this company
    const { count: currentCount } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', Number(company_id))
      .eq('status', 'active');

    // Enforce the limit
    if (effectiveLimit !== null && (currentCount || 0) >= effectiveLimit) {
      return res.status(409).json({
        success: false,
        message: `Project limit reached. This company can have at most ${effectiveLimit} project(s). Currently has ${currentCount}.`,
      });
    }

    // If a new limit is provided, save it to company_users
    if (project_limit) {
      await supabase
        .from('company_users')
        .update({ project_limit: parseInt(project_limit) })
        .eq('id', Number(company_id));
    }

    let imageUrl = null;
    if (req.file && req.file.buffer) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `projects/sa_project_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lms-storage')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('lms-storage').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        company_id: Number(company_id),
        project_name,
        location: location || null,
        address: address || null,
        project_type: project_type || null,
        calculation_type: calculation_type || 'Chargeable Area',
        total_floors: total_floors ? parseInt(total_floors) : 0,
        total_project_area: total_project_area ? parseFloat(total_project_area) : 0,
        description: description || null,
        project_image: imageUrl,
        status: 'active',
      })
      .select('id, company_id, project_name, location, project_type, total_floors, status, created_at')
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      project: data,
      project_limit: effectiveLimit,
      current_count: (currentCount || 0) + 1,
      message: `Project "${project_name}" created for ${company.company_name}`,
    });
  } catch (err) {
    console.error('[createCompanyProject]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ─── SUPER ADMIN — UPDATE COMPANY QUOTA ONLY (no project creation) ────────────
const updateCompanyQuota = async (req, res) => {
  try {
    const { company_id, project_limit } = req.body;

    if (!company_id) {
      return res.status(400).json({ success: false, message: 'company_id is required' });
    }

    // Validate limit value
    const newLimit = project_limit === null || project_limit === '' ? null : parseInt(project_limit);
    if (newLimit !== null && (isNaN(newLimit) || newLimit < 1 || newLimit > 50)) {
      return res.status(400).json({ success: false, message: 'project_limit must be between 1 and 50, or null to remove the limit.' });
    }

    // Verify company exists
    const { data: company } = await supabase
      .from('company_users')
      .select('id, company_name')
      .eq('id', company_id)
      .single();

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Update the limit
    const { error } = await supabase
      .from('company_users')
      .update({ project_limit: newLimit })
      .eq('id', Number(company_id));

    if (error) throw error;

    // Return updated quota info
    const { count: currentCount } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', Number(company_id))
      .eq('status', 'active');

    return res.json({
      success: true,
      message: newLimit
        ? `Quota for ${company.company_name} set to ${newLimit} project(s).`
        : `Quota removed — ${company.company_name} now has unlimited projects.`,
      project_limit: newLimit,
      current_count: currentCount || 0,
      remaining: newLimit !== null ? Math.max(0, newLimit - (currentCount || 0)) : null,
    });
  } catch (err) {
    console.error('[updateCompanyQuota]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ─── SUPER ADMIN — DELETE COMPANY PROJECT ─────────────────────────────────────
const deleteCompanyProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Project id is required.' });

    // Verify project exists and get its name + company
    const { data: project } = await supabase
      .from('projects')
      .select('id, project_name, company_id')
      .eq('id', id)
      .single();

    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    // 1. Remove project_users assigned to this project
    await supabase.from('project_users').delete().eq('project_id', id);

    // 2. Remove leases linked to this project
    await supabase.from('leases').delete().eq('project_id', id);

    // 3. Remove units (and their images)
    const { data: units } = await supabase.from('units').select('id').eq('project_id', id);
    if (units && units.length > 0) {
      const unitIds = units.map(u => u.id);
      await supabase.from('unit_images').delete().in('unit_id', unitIds);
      await supabase.from('unit_ownerships').delete().in('unit_id', unitIds);
      await supabase.from('units').delete().eq('project_id', id);
    }

    // 4. Delete the project itself
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;

    return res.json({
      success: true,
      message: `Project "${project.project_name}" has been deleted.`,
      deleted_project_id: Number(id),
    });
  } catch (err) {
    console.error('[deleteCompanyProject]', err);
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
  getModuleUsers, createModuleUser, updateModuleUser, deleteModuleUser,
  createCompanyProject, getCompanyProjectLimit, updateCompanyQuota, deleteCompanyProject,
};



