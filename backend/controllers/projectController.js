const supabase = require("../config/db");
const { handleDbError } = require('../utils/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createNotification } = require('../utils/notificationHelper');

// Configure multer for file uploads using memory storage for Supabase
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/* ================= ADD PROJECT ================= */
const addProject = async (req, res) => {
  try {
    const {
      project_name, location, address, project_type, calculation_type,
      total_floors, total_project_area, description
    } = req.body;

    let imageUrl = null;
    if (req.file && req.file.buffer) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `projects/project_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lms-storage')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('lms-storage')
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    const floors = total_floors ? parseInt(total_floors) : 0;
    const area = total_project_area ? parseFloat(total_project_area) : 0;

    // Multi-tenant: stamp company_id on new records
    const insertPayload = {
      project_name, location: location || null, address: address || null,
      project_type: project_type || null, calculation_type: calculation_type || 'Chargeable Area',
      total_floors: floors, total_project_area: area, project_image: imageUrl,
      description: description || null, status: 'active'
    };
    if (req.companyId) insertPayload.company_id = req.companyId;

    const { data: result, error } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) return res.status(500).json(handleDbError(error));

    await createNotification(1, "New Project Added", `Project "${project_name}" has been created in ${location}.`, "success");
    res.status(201).json({ success: true, message: "Project Added Successfully", id: result.id });
  } catch (error) {
    console.error("Add project error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET ALL PROJECTS ================= */
const getProjects = async (req, res) => {
  try {
    const { search, location, type, status } = req.query;

    let query = supabase.from('projects').select('*');

    // Multi-tenant: company users only see their own data
    if (req.companyId) query = query.eq('company_id', req.companyId);

    if (location && location !== 'All') query = query.eq('location', location);
    if (type && type !== 'All') query = query.eq('project_type', type);
    if (status && status !== 'All') query = query.eq('status', status);

    const { data: projects, error } = await query;
    if (error) throw error;

    let filteredProjects = projects || [];

    // Client-side search for simplicity if search term provided
    if (search) {
      const s = search.toLowerCase();
      filteredProjects = filteredProjects.filter(p =>
        (p.project_name && p.project_name.toLowerCase().includes(s)) ||
        (p.location && p.location.toLowerCase().includes(s))
      );
    }

    // Fetch units to add total_units properly
    let unitsQ = supabase.from('units').select('project_id');
    if (req.companyId) unitsQ = unitsQ.eq('company_id', req.companyId);
    const { data: units } = await unitsQ;

    const unitCounts = {};
    if (units) {
      units.forEach(u => {
        unitCounts[u.project_id] = (unitCounts[u.project_id] || 0) + 1;
      });
    }

    const projectsWithCounts = filteredProjects.map(p => ({
      ...p,
      total_units: unitCounts[p.id] || 0
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ data: projectsWithCounts });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET PROJECT LOCATIONS ================= */
const getProjectLocations = async (req, res) => {
  try {
    let query = supabase.from('projects').select('location').not('location', 'is', null);
    if (req.companyId) query = query.eq('company_id', req.companyId);

    const { data, error } = await query;
    if (error) throw error;

    const uniqueLocations = [...new Set(data.filter(d => d.location && d.location.trim() !== '').map(d => d.location))].sort();
    res.json(uniqueLocations);
  } catch (error) {
    console.error("Get project locations error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET PROJECT BY ID ================= */
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch Project
    const { data: project, error } = await supabase.from('projects').select('*').eq('id', id).single();
    if (error || !project) return res.status(404).json({ message: "Project not found" });

    // Multi-tenant: silently hide projects from other companies
    if (req.companyId && project.company_id && project.company_id !== req.companyId) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 2. Fetch Units for stats
    const { data: units } = await supabase.from('units').select('id, status, chargeable_area').eq('project_id', id);
    const unitIds = (units || []).map(u => u.id);

    // 3. Fetch active ownerships
    const { data: ownerships } = await supabase.from('unit_ownerships').select('unit_id, party_id').in('unit_id', unitIds).eq('ownership_status', 'Active');

    // 4. Fetch active leases
    const { data: leases } = await supabase.from('leases').select('party_tenant_id').eq('project_id', id).eq('status', 'active');

    // Calculate aggregations (Solves Issue 11)
    const activeOwnershipUnitIds = new Set((ownerships || []).map(o => o.unit_id));

    let occupiedCount = 0;
    let vacantCount = 0;
    let totalArea = 0;
    let leasedArea = 0;

    (units || []).forEach(u => {
      if (u.status === 'occupied') { occupiedCount++; leasedArea += parseFloat(u.chargeable_area || 0); }
      if (u.status === 'vacant') { vacantCount++; }
      totalArea += parseFloat(u.chargeable_area || 0);
    });

    const enrichedProject = {
      ...project,
      actual_total_floors: project.total_floors,
      total_units_count: units ? units.length : 0,
      units_sold: activeOwnershipUnitIds.size,
      occupied_units: occupiedCount,
      vacant_units: vacantCount,
      total_area: totalArea,
      leased_area: leasedArea
    };

    // Tenants and Owners lists
    const tenantIds = [...new Set((leases || []).map(l => l.party_tenant_id))];
    const ownerIds = [...new Set((ownerships || []).map(o => o.party_id))];

    let tenantsRows = [];
    if (tenantIds.length > 0) {
      const { data: tenants } = await supabase.from('parties').select('*').in('id', tenantIds);
      tenantsRows = tenants || [];
    }

    let ownersRows = [];
    if (ownerIds.length > 0) {
      const { data: owners } = await supabase.from('parties').select('*').in('id', ownerIds);
      ownersRows = owners || [];
    }

    res.json({
      data: enrichedProject,
      tenants: tenantsRows,
      owners: ownersRows
    });
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE PROJECT ================= */
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Multi-tenant: silently hide projects from other companies
    if (req.companyId) {
      const { data: projectCheck } = await supabase.from('projects')
        .select('company_id').eq('id', id).single();
      if (!projectCheck || projectCheck.company_id !== req.companyId) {
        return res.status(404).json({ message: 'Project not found' });
      }
    }

    const {
      project_name, location, address, project_type, calculation_type,
      total_floors, total_project_area, description, status
    } = req.body;

    let imageUrl = null;
    if (req.file && req.file.buffer) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `projects/project_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lms-storage')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('lms-storage')
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    const floors = total_floors ? parseInt(total_floors) : 0;
    const area = total_project_area ? parseFloat(total_project_area) : 0;

    const updateData = {
      project_name, location: location || null, address: address || null,
      project_type: project_type || null, calculation_type: calculation_type || 'Chargeable Area',
      total_floors: floors, total_project_area: area, description: description || null,
      status: status || 'active'
    };
    if (imageUrl) updateData.project_image = imageUrl;

    const { error } = await supabase.from('projects').update(updateData).eq('id', id);
    if (error) return res.status(500).json(handleDbError(error));

    res.json({ success: true, message: "Project updated successfully" });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE PROJECT ================= */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Multi-tenant: silently hide projects from other companies
    if (req.companyId) {
      const { data: projectCheck } = await supabase.from('projects')
        .select('company_id').eq('id', id).single();
      if (!projectCheck || projectCheck.company_id !== req.companyId) {
        return res.status(404).json({ message: 'Project not found' });
      }
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        return res.status(400).json({ error: "Cannot delete project. It has associated units or leases. Please delete them first." });
      }
      throw error;
    }
    res.json({ message: "Project Deleted Successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ... keep Dashboard Stats intact for backward compatibility if needed, but it's handled in dashboardRoutes ...

const getProjectDashboardStats = async (req, res) => {
  // Can just redirect to DashboardController generic func or return dummy.
  res.status(200).json({});
};

/* ================= GET UNITS BY PROJECT ================= */
const getUnitsByProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('units').select('*').eq('project_id', id).order('unit_number', { ascending: true });

    if (error) throw error;
    res.json({ data: data || [] });
  } catch (error) {
    console.error("Get units by project error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectDashboardStats,
  getUnitsByProject,
  getProjectLocations,
  upload
};
