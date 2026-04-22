/**
 * controllers/projectUserController.js
 * Manages project-specific users with granular permissions.
 * Admin/Super-Admin can assign users to specific projects with view, edit, delete rights.
 */

const bcrypt = require('bcryptjs');
const supabase = require('../config/db');

// Get all project users for a company
const getProjectUsers = async (req, res) => {
  try {
    const { company_id } = req.params;
    
    if (!company_id) {
      return res.status(400).json({ success: false, message: 'company_id required' });
    }

    const { data, error } = await supabase
      .from('project_users')
      .select(`
        id,
        company_id,
        project_id,
        email,
        permissions,
        status,
        created_at,
        updated_at,
        projects!project_users_project_id_fkey(project_name, location)
      `)
      .eq('company_id', company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return res.json({ success: true, projectUsers: data || [] });
  } catch (err) {
    console.error('[getProjectUsers]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get project users for a specific project
const getProjectUsersByProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    
    const { data, error } = await supabase
      .from('project_users')
      .select('id, email, permissions, status, created_at')
      .eq('project_id', project_id)
      .eq('status', 'active');

    if (error) throw error;
    return res.json({ success: true, projectUsers: data || [] });
  } catch (err) {
    console.error('[getProjectUsersByProject]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Create a new project user
const createProjectUser = async (req, res) => {
  try {
    const { company_id, project_id, email, password, permissions } = req.body;

    // Validate required fields
    if (!company_id || !project_id || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'company_id, project_id, email and password are required',
      });
    }

    // Check if email already exists in company_users (admin)
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

    // Check if email already exists in project_users
    const { data: existingProjectUser } = await supabase
      .from('project_users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingProjectUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already assigned to another project.',
      });
    }

    // Verify project exists and belongs to the company
    const { data: project } = await supabase
      .from('projects')
      .select('id, project_name')
      .eq('id', project_id)
      .eq('company_id', company_id)
      .single();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or does not belong to this company.',
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Default permissions
    const defaultPerms = { view: true, edit: false, delete: false };
    const finalPerms = permissions || defaultPerms;

    const insertData = {
      company_id,
      project_id,
      email,
      password_hash,
      permissions: finalPerms,
      status: 'active',
    };

    const { data, error } = await supabase
      .from('project_users')
      .insert(insertData)
      .select(`
        id,
        company_id,
        project_id,
        email,
        permissions,
        status,
        created_at,
        projects!project_users_project_id_fkey(project_name)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'A user is already assigned to this project with this email.',
        });
      }
      throw error;
    }

    return res.status(201).json({
      success: true,
      projectUser: data,
      message: `User assigned to project "${project.project_name}" successfully`,
    });
  } catch (err) {
    console.error('[createProjectUser]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Update project user permissions
const updateProjectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, password, status, first_name, last_name, project_id } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (permissions !== undefined) updates.permissions = permissions;
    if (status !== undefined) updates.status = status;
    if (password) updates.password_hash = await bcrypt.hash(password, 12);
    if (project_id !== undefined) updates.project_id = project_id;

    const { data, error } = await supabase
      .from('project_users')
      .update(updates)
      .eq('id', id)
      .select(`
        id,
        company_id,
        project_id,
        email,
        permissions,
        status,
        updated_at,
        projects!project_users_project_id_fkey(project_name)
      `)
      .single();

    if (error) throw error;
    
    return res.json({
      success: true,
      projectUser: data,
      message: 'Project user updated successfully',
    });
  } catch (err) {
    console.error('[updateProjectUser]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Delete project user
const deleteProjectUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('project_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return res.json({ success: true, message: 'Project user removed successfully' });
  } catch (err) {
    console.error('[deleteProjectUser]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all projects with their assigned users (for admin view)
const getProjectsWithUsers = async (req, res) => {
  try {
    const { company_id } = req.params;

    // Get all projects for the company
    let projectsQuery = supabase
      .from('projects')
      .select('id, project_name, location, status')
      .eq('company_id', company_id)
      .order('project_name');

    const { data: projects, error: projError } = await projectsQuery;
    if (projError) throw projError;

    // Get all project users for this company
    const { data: projectUsers, error: puError } = await supabase
      .from('project_users')
      .select('id, project_id, email, permissions, status')
      .eq('company_id', company_id);

    if (puError) throw puError;

    // Group users by project
    const projectUsersMap = {};
    (projectUsers || []).forEach(pu => {
      if (!projectUsersMap[pu.project_id]) {
        projectUsersMap[pu.project_id] = [];
      }
      projectUsersMap[pu.project_id].push(pu);
    });

    // Combine data
    const projectsWithUsers = (projects || []).map(p => ({
      ...p,
      assigned_users: projectUsersMap[p.id] || [],
    }));

    return res.json({ success: true, projects: projectsWithUsers });
  } catch (err) {
    console.error('[getProjectsWithUsers]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Batch assign users to projects
const batchAssignProjects = async (req, res) => {
  try {
    const { company_id, assignments } = req.body;
    // assignments = [{ project_id, email, password, permissions }, ...]

    if (!company_id || !assignments || !Array.isArray(assignments)) {
      return res.status(400).json({
        success: false,
        message: 'company_id and assignments array are required',
      });
    }

    const results = [];
    const errors = [];

    for (const assignment of assignments) {
      const { project_id, email, password, permissions } = assignment;

      try {
        // Check if user already exists for this project
        const { data: existing } = await supabase
          .from('project_users')
          .select('id')
          .eq('project_id', project_id)
          .eq('email', email)
          .single();

        if (existing) {
          // Update existing
          const updates = { permissions, updated_at: new Date().toISOString() };
          if (password) updates.password_hash = await bcrypt.hash(password, 12);

          await supabase
            .from('project_users')
            .update(updates)
            .eq('id', existing.id);
          
          results.push({ email, project_id, action: 'updated' });
        } else {
          // Create new
          const password_hash = await bcrypt.hash(password, 12);
          
          await supabase
            .from('project_users')
            .insert({
              company_id,
              project_id,
              email,
              password_hash,
              permissions: permissions || { view: true, edit: false, delete: false },
            });
          
          results.push({ email, project_id, action: 'created' });
        }
      } catch (err) {
        errors.push({ email, project_id, error: err.message });
      }
    }

    return res.json({
      success: true,
      results,
      errors,
      message: `Processed ${results.length} assignments with ${errors.length} errors`,
    });
  } catch (err) {
    console.error('[batchAssignProjects]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all projects for a company (for super-admin assignment)
const getCompanyProjects = async (req, res) => {
  try {
    const { company_id } = req.params;
    
    if (!company_id) {
      return res.status(400).json({ success: false, message: 'company_id required' });
    }

    const { data, error } = await supabase
      .from('projects')
      .select('id, project_name, location, status')
      .eq('company_id', company_id)
      .order('project_name', { ascending: true });

    if (error) throw error;
    
    return res.json({ success: true, projects: data || [] });
  } catch (err) {
    console.error('[getCompanyProjects]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all project users (for role management page)
const getAllProjectUsers = async (req, res) => {
  try {
    const company_id = req.companyId;
    
    if (!company_id) {
      return res.status(400).json({ success: false, message: 'company_id required' });
    }

    const { data, error } = await supabase
      .from('project_users')
      .select(`
        id,
        company_id,
        project_id,
        email,
        permissions,
        status,
        created_at,
        updated_at,
        projects!project_users_project_id_fkey(project_name, location)
      `)
      .eq('company_id', company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Format the response
    const formattedUsers = (data || []).map(u => ({
      id: u.id,
      email: u.email,
      project_id: u.project_id,
      project_name: u.projects?.project_name || 'Unknown',
      permissions: u.permissions || { view: true, edit: false, delete: false },
      status: u.status || 'active'
    }));
    
    return res.json({ success: true, projectUsers: formattedUsers });
  } catch (err) {
    console.error('[getAllProjectUsers]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProjectUsers,
  getProjectUsersByProject,
  getAllProjectUsers,
  createProjectUser,
  updateProjectUser,
  deleteProjectUser,
  batchAssignProjects,
  getCompanyProjects,
  getProjectsWithUsers,
};
