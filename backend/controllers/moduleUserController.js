/**
 * controllers/moduleUserController.js
 * Manages per-company per-module sub-users (assigned by Super Admin).
 * ONE user per module per company — enforced by DB UNIQUE constraint.
 */

const bcrypt   = require('bcryptjs');
const supabase = require('../config/db');

// ── All features per module (used for default permissions seeding) ────────────
const genericFeatures = ['view', 'edit', 'delete'];

const MODULE_FEATURES = {
  dashboard: genericFeatures,
  masters: genericFeatures,
  leases: genericFeatures,
  ownership: genericFeatures,
  projects: genericFeatures,
};

// ── GET module users for a company ──────────────────────────────────────────
const getModuleUsers = async (req, res) => {
  try {
    const { company_id } = req.params;
    if (!company_id) return res.status(400).json({ success: false, message: 'company_id required' });

    const { data, error } = await supabase
      .from('module_users')
      .select('id, company_id, module_name, email, permissions, status, created_at, updated_at')
      .eq('company_id', company_id)
      .order('module_name');

    if (error) throw error;
    return res.json({ success: true, moduleUsers: data || [] });
  } catch (err) {
    console.error('[getModuleUsers]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── CREATE module user ───────────────────────────────────────────────────────
const createModuleUser = async (req, res) => {
  try {
    const { company_id, module_name, email, password, permissions } = req.body;

    if (!company_id || !module_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'company_id, module_name, email and password are required',
      });
    }

    const module = module_name.toLowerCase();
    if (!MODULE_FEATURES[module]) {
      return res.status(400).json({ success: false, message: `Unknown module: ${module}` });
    }

    // Check email not already in company_users
    const { data: existingCompanyUser } = await supabase
      .from('company_users')
      .select('id')
      .eq('email', email)
      .single();
    if (existingCompanyUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already a company admin. Use a different email.',
      });
    }

    // Check email not already in module_users
    const { data: existingModuleUser } = await supabase
      .from('module_users')
      .select('id')
      .eq('email', email)
      .single();
    if (existingModuleUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already assigned to another module.',
      });
    }

    // Build permissions (use provided or default all-false with view only)
    const features = MODULE_FEATURES[module];
    const defaultPerms = {};
    features.forEach(f => { defaultPerms[f] = false; });
    defaultPerms['view'] = true;

    const finalPerms = permissions || defaultPerms;

    const password_hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('module_users')
      .insert({ company_id, module_name: module, email, password_hash, permissions: finalPerms })
      .select('id, company_id, module_name, email, permissions, status, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique violation — module already has a user
        return res.status(409).json({
          success: false,
          message: `The ${module} module already has an assigned user for this company.`,
        });
      }
      throw error;
    }

    return res.status(201).json({ success: true, moduleUser: data, message: 'Module user created successfully' });
  } catch (err) {
    console.error('[createModuleUser]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE module user (permissions and/or password) ────────────────────────
const updateModuleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, password, status } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (permissions !== undefined) updates.permissions = permissions;
    if (status !== undefined) updates.status = status;
    if (password) updates.password_hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('module_users')
      .update(updates)
      .eq('id', id)
      .select('id, company_id, module_name, email, permissions, status, updated_at')
      .single();

    if (error) throw error;
    return res.json({ success: true, moduleUser: data, message: 'Module user updated successfully' });
  } catch (err) {
    console.error('[updateModuleUser]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE module user ───────────────────────────────────────────────────────
const deleteModuleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('module_users').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true, message: 'Module user removed successfully' });
  } catch (err) {
    console.error('[deleteModuleUser]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET features list per module (for Super Admin UI) ─────────────────────
const getModuleFeatures = async (req, res) => {
  return res.json({ success: true, features: MODULE_FEATURES });
};

// ── Company Auth Methods (for Role Management) ──────────────────────────────
const getMyModuleUsers = async (req, res) => {
  req.params.company_id = req.user?.company_id || req.companyId; 
  return getModuleUsers(req, res);
};

const createMyModuleUser = async (req, res) => {
  req.body.company_id = req.user?.company_id || req.companyId;
  return createModuleUser(req, res);
};

// Expose these below
module.exports = {
  getModuleUsers,
  createModuleUser,
  updateModuleUser,
  deleteModuleUser,
  getModuleFeatures,
  MODULE_FEATURES,
  getMyModuleUsers,
  createMyModuleUser,
};
