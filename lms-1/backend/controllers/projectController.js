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

    // ── Enforce project_limit set by Super Admin ──────────────────────────────
    if (req.companyId) {
      const { data: companyData } = await supabase
        .from('company_users')
        .select('project_limit')
        .eq('id', Number(req.companyId))
        .single();

      const limit = companyData?.project_limit || null;
      if (limit !== null) {
        const { count: currentCount } = await supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', Number(req.companyId))
          .eq('status', 'active');

        if ((currentCount || 0) >= limit) {
          return res.status(409).json({
            success: false,
            message: `Project limit reached. Your plan allows a maximum of ${limit} project(s). You currently have ${currentCount}. Please contact your administrator to increase the limit.`,
          });
        }
      }
    }

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
    // PRIVACY: Never serve data without a valid company session
    if (req.isUnauthenticated) return res.json({ data: [] });

    const { search, location, type, status } = req.query;

    let query = supabase.from('projects').select('*');

    // Multi-tenant: company users only see their own data
    if (req.companyId) query = query.eq('company_id', req.companyId);

    // Project-specific users only see their assigned projects
    if (req.isRestrictedToProjects) {
      const allowedIds = (req.projectsAccess || []).map(p => p.project_id);
      if (allowedIds.length > 0) query = query.in('id', allowedIds);
      else query = query.eq('id', -1);
    }

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

    // ── Unit counts: scoped by project_id of COMPANY'S projects ─────────────────
    // Privacy: `projectIds` only contains IDs of THIS company's projects (filtered
    // above by company_id on the projects table). Counting units by project_id
    // gives the same result as getProjectById (which shows 102 correctly) because
    // it doesn't rely on company_id being stamped on every unit row.
    const projectIds = filteredProjects.map(p => p.id);
    const unitCounts = {};
    const occupiedCounts = {};
    const floorCounts = {};

    if (projectIds.length > 0) {
      // Units — count by project_id only (privacy guaranteed by project ownership above)
      const { data: units } = await supabase
        .from('units')
        .select('project_id, status')
        .in('project_id', projectIds);

      (units || []).forEach(u => {
        unitCounts[u.project_id] = (unitCounts[u.project_id] || 0) + 1;
        const s = (u.status || '').toLowerCase();
        if (s === 'leased' || s === 'occupied' || s === 'sold') {
          occupiedCounts[u.project_id] = (occupiedCounts[u.project_id] || 0) + 1;
        }
      });

      // Floor counts from project_floors
      const { data: floorRows } = await supabase
        .from('project_floors')
        .select('project_id')
        .in('project_id', projectIds);
      (floorRows || []).forEach(f => {
        floorCounts[f.project_id] = (floorCounts[f.project_id] || 0) + 1;
      });
    }

    const projectsWithCounts = filteredProjects.map(p => ({
      ...p,
      total_units: unitCounts[p.id] || 0,
      occupied_units: occupiedCounts[p.id] || 0,
      actual_floor_count: floorCounts[p.id] !== undefined ? floorCounts[p.id] : (p.total_floors || 0)
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

    // 3. Fetch actual floors from project_floors table
    const { data: projectFloors } = await supabase
      .from('project_floors')
      .select('id, floor_name')
      .eq('project_id', id)
      .order('sort_order', { ascending: true });
    const actualFloorCount = projectFloors ? projectFloors.length : 0;

    // 4. Fetch active ownerships
    const { data: ownerships } = unitIds.length > 0
      ? await supabase.from('unit_ownerships').select('unit_id, party_id').in('unit_id', unitIds).eq('ownership_status', 'Active')
      : { data: [] };

    // 5. Fetch all leases for this project (any status) for tenant list
    const { data: leases } = await supabase.from('leases').select('party_tenant_id, status').eq('project_id', id);

    // Calculate aggregations — standardized to match dashboard (leased|occupied|sold)
    const activeOwnershipUnitIds = new Set((ownerships || []).map(o => o.unit_id));

    let occupiedCount = 0;
    let vacantCount = 0;
    let totalArea = 0;
    let leasedArea = 0;

    (units || []).forEach(u => {
      const s = (u.status || '').toLowerCase();
      const isLeased = s === 'leased' || s === 'occupied' || s === 'sold';
      if (isLeased) { occupiedCount++; leasedArea += parseFloat(u.chargeable_area || 0); }
      if (s === 'vacant' || s === 'available') { vacantCount++; }
      totalArea += parseFloat(u.chargeable_area || 0);
    });

    const enrichedProject = {
      ...project,
      // Use actual floor count from project_floors table; fall back to manual entry
      actual_total_floors: actualFloorCount > 0 ? actualFloorCount : (project.total_floors || 0),
      total_floors: actualFloorCount > 0 ? actualFloorCount : (project.total_floors || 0),
      floor_names: (projectFloors || []).map(f => f.floor_name),
      total_units_count: units ? units.length : 0,
      units_sold: activeOwnershipUnitIds.size,
      occupied_units: occupiedCount,
      vacant_units: vacantCount,
      total_area: totalArea,
      leased_area: leasedArea
    };

    // Tenants and Owners lists — use all leases (any status) so tenant names always show
    const tenantIds = [...new Set((leases || []).map(l => l.party_tenant_id).filter(Boolean))];
    const ownerIds = [...new Set((ownerships || []).map(o => o.party_id).filter(Boolean))];

    let tenantsRows = [];
    if (tenantIds.length > 0) {
      const { data: tenants } = await supabase.from('parties').select('id, company_name, first_name, last_name, email, phone, brand_name, status').in('id', tenantIds);
      tenantsRows = (tenants || []).map(t => ({
        id: t.id,
        company_name: t.company_name || `${t.first_name || ''} ${t.last_name || ''}`.trim(),
        contact_person_name: t.company_name ? `${t.first_name || ''} ${t.last_name || ''}`.trim() : null,
        contact_person_email: t.email || null,
        contact_person_phone: t.phone || null,
        brand_name: t.brand_name || null,
        status: t.status || 'active'
      }));
    }

    // Also fetch tenants from the tenants table assigned to this project's units
    try {
      const { data: tuRows } = await supabase
        .from('tenant_units')
        .select('tenant_id')
        .in('unit_id', unitIds);

      const tenantTableIds = [...new Set((tuRows || []).map(r => r.tenant_id))];
      if (tenantTableIds.length > 0) {
        const { data: tenantTableRows } = await supabase
          .from('tenants')
          .select('id, company_name, contact_person_name, contact_person_email, contact_person_phone, status')
          .in('id', tenantTableIds);

        (tenantTableRows || []).forEach(t => {
          // Avoid duplicates by id
          const alreadyExists = tenantsRows.some(r => r.id === t.id);
          if (!alreadyExists) {
            tenantsRows.push({
              id: t.id,
              company_name: t.company_name,
              contact_person_name: t.contact_person_name || null,
              contact_person_email: t.contact_person_email || null,
              contact_person_phone: t.contact_person_phone || null,
              status: t.status || 'active'
            });
          }
        });
      }
    } catch (e) {
      // tenant_units join is optional
      console.warn('[getProjectById] tenant_units fetch failed:', e.message);
    }

    let ownersRows = [];
    if (ownerIds.length > 0) {
      const { data: owners } = await supabase.from('parties').select('id, first_name, last_name, company_name, email, phone, legal_entity_type, type').in('id', ownerIds);
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

    // Project-specific users can only update their assigned project
    if (req.isProjectUser) {
      if (String(req.projectId) !== String(id)) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      // Check edit permission
      if (!req.permissions?.edit) {
        return res.status(403).json({ message: 'You do not have permission to edit this project' });
      }
    }

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

    // Project-specific users can only delete their assigned project
    if (req.isProjectUser) {
      if (String(req.projectId) !== String(id)) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      // Check delete permission
      if (!req.permissions?.delete) {
        return res.status(403).json({ message: 'You do not have permission to delete this project' });
      }
    }

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
    const excludeAssigned = req.query.excludeAssigned === 'true';

    // PRIVACY: Never serve data without a valid company session
    if (req.isUnauthenticated) return res.json({ data: [] });

    console.log(`[getUnitsByProject] project=${id}, excludeAssigned=${excludeAssigned}`);

    // PRIVACY: Verify this project belongs to the requesting company before returning its units
    if (req.companyId) {
      const { data: projectCheck } = await supabase.from('projects')
        .select('company_id').eq('id', id).single();
      if (!projectCheck || projectCheck.company_id !== req.companyId) {
        return res.json({ data: [] }); // silently return empty — don't reveal existence
      }
    }

    // Step 1: Fetch units by project_id only.
    // Privacy: the project ownership check above (lines 462-468) already ensures
    // this project belongs to req.companyId. No need to also filter by company_id
    // on the units table — that would incorrectly exclude units missing the stamp.
    const unitQuery = supabase.from('units').select('*').eq('project_id', id).order('unit_number', { ascending: true });

    const { data: units, error } = await unitQuery;
    if (error) throw error;

    const unitIds = (units || []).map(u => u.id);

    // Step 2: Fetch unit_ownerships separately for these units
    const ownershipMap = {};
    if (unitIds.length > 0) {
      const { data: ownershipsData } = await supabase
        .from('unit_ownerships')
        .select('unit_id, ownership_status, share_percentage, party_id')
        .in('unit_id', unitIds);

      (ownershipsData || []).forEach(o => {
        if (!ownershipMap[o.unit_id]) ownershipMap[o.unit_id] = [];
        ownershipMap[o.unit_id].push(o);
      });
    }

    console.log(`[getUnitsByProject] Fetched ${units?.length || 0} units`);

    // Process units to add ownership summary
    let processedData = (units || []).map(unit => {
      const activeOwnerships = (ownershipMap[unit.id] || []).filter(o => o.ownership_status === 'Active');
      const totalShare = activeOwnerships.reduce((sum, o) => sum + Number(o.share_percentage || 0), 0);
      const hasActiveOwnership = activeOwnerships.length > 0;

      if (hasActiveOwnership) {
        console.log(`[getUnitsByProject] Unit ${unit.unit_number} has_ownership=true, totalShare=${totalShare}`);
      }

      return {
        ...unit,
        has_ownership: hasActiveOwnership,
        total_share: totalShare,
        is_full: totalShare >= 100 || unit.status === 'Sold'
      };
    });

    // If excludeAssigned is true, filter out units with active ownership
    if (excludeAssigned) {
      const beforeCount = processedData.length;
      processedData = processedData.filter(u => !u.has_ownership && !u.is_full);
      console.log(`[getUnitsByProject] Filtered: ${beforeCount} → ${processedData.length} units`);
    }

    res.json({ data: processedData });
  } catch (error) {
    console.error("Get units by project error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET PROJECT QUOTA ================= */
const getProjectQuota = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.json({ success: true, project_limit: null, current_count: 0, remaining: null });
    }

    const { data: company } = await supabase
      .from('company_users')
      .select('project_limit')
      .eq('id', Number(req.companyId))
      .single();

    const limit = company?.project_limit || null;

    const { count } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', Number(req.companyId))
      .eq('status', 'active');

    return res.json({
      success: true,
      project_limit: limit,
      current_count: count || 0,
      remaining: limit !== null ? Math.max(0, limit - (count || 0)) : null,
    });
  } catch (error) {
    console.error('getProjectQuota error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectDashboardStats,
  getProjectQuota,
  getUnitsByProject,
  getProjectLocations,
  upload
};

