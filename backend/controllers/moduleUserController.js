/**
 * controllers/moduleUserController.js
 *
 * Two strategies for multi-module storage:
 *
 *  Strategy A (preferred) — DB has UNIQUE(email, module_name, company_id):
 *    One row per module per email. Normal multi-row approach.
 *
 *  Strategy B (fallback) — DB still has old UNIQUE(email):
 *    Cannot have two rows for same email. Instead, all module data is merged
 *    into a single row's `permissions` field under the key `_modules`:
 *      permissions._modules = [
 *        { module_name: 'leases',  permissions: { view, edit, delete } },
 *        { module_name: 'masters', permissions: { view, edit, delete } },
 *      ]
 *    The login code reads `_modules` to build `modules_access`.
 *
 * getModuleUsers "expands" _modules rows into virtual per-module entries so
 * the frontend Role Management UI sees one row per module as expected.
 */

const bcrypt = require('bcryptjs');
const supabase = require('../config/db');

const genericFeatures = ['view', 'edit', 'delete'];

const MODULE_FEATURES = {
  dashboard: genericFeatures,
  masters: genericFeatures,
  leases: genericFeatures,
  ownership: genericFeatures,
  projects: genericFeatures,
};

// ── helpers ──────────────────────────────────────────────────────────────────
function defaultPerms(module) {
  const p = {};
  (MODULE_FEATURES[module] || genericFeatures).forEach(f => { p[f] = false; });
  p.view = true;
  return p;
}

/** Strip internal keys from a permissions object before exposing it */
function cleanPerms(perms) {
  if (!perms) return {};
  const { _modules, ...rest } = perms;
  return rest;
}

// ── GET all module users for a company ───────────────────────────────────────
// Expands _modules rows into individual virtual entries so Role Management
// sees one object per assigned module.
const getModuleUsers = async (req, res) => {
  try {
    const { company_id } = req.params;
    if (!company_id)
      return res.status(400).json({ success: false, message: 'company_id required' });

    const { data, error } = await supabase
      .from('module_users')
      .select('id, company_id, module_name, email, permissions, status, created_at, updated_at')
      .eq('company_id', company_id)
      .order('email')
      .order('module_name');

    if (error) throw error;

    // Expand _modules rows
    const expanded = [];
    for (const row of data || []) {
      const mods = row.permissions?._modules;
      if (Array.isArray(mods) && mods.length > 0) {
        for (const m of mods) {
          expanded.push({
            ...row,
            module_name: m.module_name,
            permissions: m.permissions || defaultPerms(m.module_name),
            _merged_row: true, // flag so delete/update knows to handle sub-module
          });
        }
      } else {
        expanded.push({ ...row, permissions: cleanPerms(row.permissions) });
      }
    }

    return res.json({ success: true, moduleUsers: expanded });
  } catch (err) {
    console.error('[getModuleUsers]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPSERT module user ───────────────────────────────────────────────────────
const createModuleUser = async (req, res) => {
  try {
    const { company_id, module_name, email, password, permissions, status } = req.body;

    if (!company_id || !module_name || !email) {
      return res.status(400).json({ success: false, message: 'company_id, module_name, and email are required' });
    }

    const module = module_name.toLowerCase().trim();
    if (!MODULE_FEATURES[module]) {
      return res.status(400).json({ success: false, message: `Unknown module: ${module}` });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();
    const finalPerms = permissions || defaultPerms(module);

    // Block company admins
    const { data: cAdmin } = await supabase
      .from('company_users')
      .select('id, company_name')
      .eq('email', normalizedEmail)
      .maybeSingle();
    if (cAdmin) {
      return res.status(409).json({ success: false, message: 'This email is already a company admin. Use a different email.' });
    }

    // NOTE: We allow same email to exist in both module_users AND project_users
    // Each table manages its own access type

    // ── Check User Limit (Quota) ──────────────────────────────────────────────
    const companyIdNum = Number(company_id);
    let isNewEmailForCompany = false;
    
    // Check if this email already exists in either module_users or project_users for this company
    const [modCheck, projCheck] = await Promise.all([
      supabase.from('module_users').select('id').eq('company_id', companyIdNum).eq('email', normalizedEmail).limit(1),
      supabase.from('project_users').select('id').eq('company_id', companyIdNum).eq('email', normalizedEmail).limit(1)
    ]);
    
    if ((!modCheck.data || modCheck.data.length === 0) && (!projCheck.data || projCheck.data.length === 0)) {
      isNewEmailForCompany = true;
    }

    if (isNewEmailForCompany) {
      // It's a completely new user email for this company. Check quota.
      const { data: company } = await supabase.from('company_users').select('user_limit').eq('id', companyIdNum).single();
      const limit = company?.user_limit;
      if (limit !== null && limit !== undefined) {
        // Count UNIQUE emails assigned across module_users and project_users
        const [modRes, projRes] = await Promise.all([
          supabase.from('module_users').select('email').eq('company_id', companyIdNum),
          supabase.from('project_users').select('email').eq('company_id', companyIdNum),
        ]);
        const uniqueEmails = new Set();
        if (modRes.data) modRes.data.forEach(u => uniqueEmails.add(u.email.toLowerCase()));
        if (projRes.data) projRes.data.forEach(u => uniqueEmails.add(u.email.toLowerCase()));
        
        if (uniqueEmails.size >= limit) {
          return res.status(403).json({ success: false, message: `Company user limit reached (${limit}). Cannot assign a new user email.` });
        }
      }
    }

    // ── Step 1: Find existing row for same email+module+company ──────────────
    const { data: sameRow } = await supabase
      .from('module_users')
      .select('id, password_hash, permissions')
      .eq('email', normalizedEmail)
      .eq('module_name', module)
      .eq('company_id', companyIdNum)
      .maybeSingle();

    if (sameRow) {
      // UPDATE the existing same-module row
      const updates = {
        permissions: finalPerms,
        status: status || 'active',
        updated_at: now,
      };
      if (password) updates.password_hash = await bcrypt.hash(password, 12);

      const { data, error } = await supabase
        .from('module_users')
        .update(updates)
        .eq('id', sameRow.id)
        .select('id, company_id, module_name, email, permissions, status, updated_at')
        .single();
      if (error) throw error;
      return res.json({ success: true, moduleUser: data, message: 'Module user updated successfully' });
    }

    // ── Step 2: Find any existing row for this email in THIS company ──────────
    const { data: companyRows } = await supabase
      .from('module_users')
      .select('id, module_name, permissions, password_hash, status, company_id')
      .eq('email', normalizedEmail)
      .eq('company_id', companyIdNum);

    const sameCompanyRow = (companyRows || [])[0];

    if (!password) {
      return res.status(400).json({ success: false, message: 'password is required for new module user assignments' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    // If no existing row for this company, try direct INSERT
    if (!sameCompanyRow) {
      const { data, error } = await supabase
        .from('module_users')
        .insert({
          company_id: companyIdNum,
          module_name: module,
          email: normalizedEmail,
          password_hash,
          permissions: finalPerms,
          status: status || 'active',
          created_at: now,
          updated_at: now,
        })
        .select('id, company_id, module_name, email, permissions, status, created_at')
        .single();

      if (!error) {
        return res.status(201).json({ success: true, moduleUser: data, message: 'Module user created successfully' });
      }

      // Log the actual error for debugging
      console.error('[createModuleUser] INSERT error:', JSON.stringify({ code: error.code, message: error.message, details: error.details, hint: error.hint }));

      // Non-unique violation - DB has UNIQUE constraint
      if (error.code === '23505') {
        // The error message usually contains the constraint name
        console.error('[createModuleUser] UNIQUE constraint violation. Full error:', error);
        
        // Check ALL tables that have UNIQUE(email) constraint
        // 1. module_users
        const { data: muRow } = await supabase
          .from('module_users')
          .select('id, module_name, company_id')
          .eq('email', normalizedEmail)
          .maybeSingle();
        
        // 2. project_users
        const { data: puRow } = await supabase
          .from('project_users')
          .select('id, project_id, company_id')
          .eq('email', normalizedEmail)
          .maybeSingle();
        
        // 3. company_users
        const { data: cuRow } = await supabase
          .from('company_users')
          .select('id, company_name')
          .eq('email', normalizedEmail)
          .maybeSingle();
        
        // 4. users table (main users)
        const { data: uRow } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', normalizedEmail)
          .maybeSingle();
        
        console.error('[createModuleUser] Email check results:', {
          module_users: muRow,
          project_users: puRow,
          company_users: cuRow,
          users: uRow
        });
        
        // Determine where the email exists and return appropriate message
        if (muRow) {
          if (Number(muRow.company_id) === companyIdNum) {
            // Same company - merge the new module
            console.log('[createModuleUser] Found in module_users for same company, merging');
            const { data: fullRow } = await supabase
              .from('module_users')
              .select('id, module_name, permissions, password_hash, status, company_id')
              .eq('id', muRow.id)
              .single();
            return await mergeModuleIntoRow(res, fullRow, module, finalPerms, password_hash, status, now);
          } else {
            return res.status(409).json({
              success: false,
              message: 'This email is already assigned to modules in another company. Please use a different email address.',
            });
          }
        }
        
        if (puRow) {
          // Allow same email in project_users if it belongs to the SAME company
          if (Number(puRow.company_id) !== companyIdNum) {
            return res.status(409).json({
              success: false,
              message: 'This email is already assigned to a project in another company. Please use a different email address.',
            });
          }
          // Same company — cross-table coexistence is fine, continue to insert
        }
        
        if (cuRow) {
          return res.status(409).json({
            success: false,
            message: 'This email is already a company admin. Please use a different email address.',
          });
        }
        
        if (uRow) {
          return res.status(409).json({
            success: false,
            message: 'This email is already registered in the main users table. Please use a different email address.',
          });
        }
        
        // Unknown source
        console.error('[createModuleUser] 23505 but email not found in any checked table');
        return res.status(409).json({
          success: false,
          message: `This email is already registered in the system. Please use a different email address. (Error: ${error.message || 'unknown constraint'})`,
        });
      }

      throw error;
    }

    // Existing row for same company - merge new module into it
    return await mergeModuleIntoRow(res, sameCompanyRow, module, finalPerms, password_hash, status, now);

  } catch (err) {
    console.error('[createModuleUser]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Helper: merge a new module assignment into an existing row's _modules JSON
async function mergeModuleIntoRow(res, existingRow, module, finalPerms, password_hash, status, now, company_id, email) {
  const rawPerms = existingRow.permissions || {};

  // Build current _modules list (expand flat format if first merge)
  const currentModules = Array.isArray(rawPerms._modules)
    ? rawPerms._modules
    : [{ module_name: existingRow.module_name, permissions: cleanPerms(rawPerms) }];

  // Remove stale entry for this module (if re-assigning)
  const filtered = currentModules.filter(m => m.module_name !== module);
  // Add new module
  const newModules = [...filtered, { module_name: module, permissions: finalPerms }];

  const mergedPermissions = { _modules: newModules };

  const { data: merged, error: mergeErr } = await supabase
    .from('module_users')
    .update({
      permissions: mergedPermissions,
      password_hash: password_hash || existingRow.password_hash,
      status: status || existingRow.status || 'active',
      updated_at: now,
    })
    .eq('id', existingRow.id)
    .select('id, company_id, module_name, email, permissions, status, updated_at')
    .single();

  if (mergeErr) {
    console.error('[mergeModuleIntoRow]', mergeErr);
    return res.status(500).json({ success: false, message: mergeErr.message });
  }

  return res.status(201).json({
    success: true,
    moduleUser: { ...merged, module_name: module, permissions: finalPerms },
    message: 'Module user created successfully (multi-module merged)',
  });
}

// ── UPDATE module user by ID ─────────────────────────────────────────────────
const updateModuleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, password, status, module_name } = req.body;

    // Fetch existing row first (needed for _modules format)
    const { data: existing } = await supabase
      .from('module_users')
      .select('id, permissions, module_name')
      .eq('id', id)
      .maybeSingle();

    const updates = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (password) updates.password_hash = await bcrypt.hash(password, 12);

    if (existing && Array.isArray(existing.permissions?._modules) && module_name) {
      // _modules format — update only the specific module's permissions
      const mods = existing.permissions._modules.map(m =>
        m.module_name === module_name ? { ...m, permissions: permissions || m.permissions } : m
      );
      updates.permissions = { _modules: mods };
    } else if (permissions !== undefined) {
      updates.permissions = permissions;
    }

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

// DELETE module user by ID
const deleteModuleUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'Module user ID is required' });
    }

    // Delete the row directly
    const { error } = await supabase.from('module_users').delete().eq('id', id);
    
    if (error) {
      console.error('[deleteModuleUser] Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
    
    return res.json({ success: true, message: 'Module user removed successfully' });
  } catch (err) {
    console.error('[deleteModuleUser] Exception:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to delete' });
  }
};

// ── DELETE ALL module rows for an email+company ──────────────────────────────
const deleteModuleUsersByEmail = async (req, res) => {
  try {
    const { company_id, email } = req.body;
    if (!company_id || !email)
      return res.status(400).json({ success: false, message: 'company_id and email required' });

    const { error } = await supabase
      .from('module_users')
      .delete()
      .eq('email', email.toLowerCase().trim())
      .eq('company_id', company_id);

    if (error) throw error;
    return res.json({ success: true, message: 'All module assignments removed for user' });
  } catch (err) {
    console.error('[deleteModuleUsersByEmail]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET feature list per module ───────────────────────────────────────────────
const getModuleFeatures = async (req, res) => {
  return res.json({ success: true, features: MODULE_FEATURES });
};

// ── Company Auth helpers ──────────────────────────────────────────────────────
const getMyModuleUsers = async (req, res) => {
  req.params.company_id = req.user?.company_id || req.companyId;
  return getModuleUsers(req, res);
};

const createMyModuleUser = async (req, res) => {
  req.body.company_id = req.user?.company_id || req.companyId;
  return createModuleUser(req, res);
};

module.exports = {
  getModuleUsers,
  createModuleUser,
  updateModuleUser,
  deleteModuleUser,
  deleteModuleUsersByEmail,
  getModuleFeatures,
  MODULE_FEATURES,
  getMyModuleUsers,
  createMyModuleUser,
};
