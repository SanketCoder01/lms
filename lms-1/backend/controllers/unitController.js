/**
 * unitController.js — All operations via Supabase table API
 */

const supabase = require('../config/db');
const { handleDbError } = require('../utils/errorHandler');

const applyScopes = (query, req) => {
  let q = query;
  if (req.companyId) q = q.eq('company_id', req.companyId);
  if (req.isRestrictedToProjects) {
    const allowedIds = (req.projectsAccess || []).map(p => p.project_id);
    if (allowedIds.length > 0) q = q.in('project_id', allowedIds);
    else q = q.eq('project_id', -1);
  }
  return q;
};

/* ═══════════════════════════════════════════════════════════
 * GET UNITS (with owner name via unit_ownerships + parties)
 * ══════════════════════════════════════════════════════════ */
const getUnits = async (req, res) => {
  try {
    // PRIVACY: Never serve data without a valid company session
    if (req.isUnauthenticated) return res.json({ data: [] });

    const { projectId, search, status, excludeSold, ownership, limit: limitParam } = req.query;
    const fetchLimit = Math.min(parseInt(limitParam || '5000', 10), 5000);

    // ── Privacy: scope to company's projects, not company_id on units ───────────
    // Units may not always have company_id stamped. Instead we:
    //   1. Get all project IDs belonging to req.companyId (secure)
    //   2. Fetch units whose project_id is IN that list
    // This matches getProjectById behaviour and returns the correct count (102, not 41).
    let allowedProjectIds = null; // null = unrestricted (no company scope)

    if (req.companyId) {
      let projQ = supabase.from('projects').select('id').eq('company_id', req.companyId);

      // Further restrict for module/project users
      if (req.isRestrictedToProjects) {
        const restrictedIds = (req.projectsAccess || []).map(p => p.project_id);
        if (restrictedIds.length > 0) projQ = projQ.in('id', restrictedIds);
        else return res.json({ data: [] }); // no access
      }

      // If a specific project is requested, intersect with company's projects
      if (projectId && projectId !== 'All') {
        projQ = projQ.eq('id', parseInt(projectId));
      }

      const { data: compProjRows, error: projErr } = await projQ;
      if (projErr) throw projErr;
      allowedProjectIds = (compProjRows || []).map(p => p.id);
      if (allowedProjectIds.length === 0) return res.json({ data: [] });
    }

    // Build the units query
    let query = supabase
      .from('units')
      .select(`
        id, unit_number, block_tower, floor_number, chargeable_area, status, project_id,
        projected_rent, unit_category, unit_zoning_type,
        projects ( project_name )
      `)
      .order('id', { ascending: false })
      .limit(fetchLimit);

    if (allowedProjectIds !== null) {
      // Scoped to company's projects
      query = query.in('project_id', allowedProjectIds);
    } else if (projectId && projectId !== 'All') {
      // No company scope but specific project requested
      query = query.eq('project_id', parseInt(projectId));
    }

    if (status && status !== 'All') query = query.eq('status', status);
    if (search) query = query.or(`unit_number.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    const unitIds = (data || []).map(u => u.id);

    // Step 2: Separately fetch ALL unit_ownerships for these unit IDs
    // NOTE: .limit(10000) is critical — Supabase/PostgREST defaults to 1000 rows max,
    // silently dropping records when there are many units or joint ownerships.
    const ownershipMap = {}; // unit_id → [ownership records]
    if (unitIds.length > 0) {
      const { data: ownershipData, error: ownershipErr } = await supabase
        .from('unit_ownerships')
        .select('id, unit_id, party_id, ownership_status, share_percentage')
        .in('unit_id', unitIds)
        .limit(10000); // prevent PostgREST 1000-row cap from silently dropping records

      if (ownershipErr) {
        console.error('[units] Error fetching unit_ownerships:', ownershipErr);
      } else {
        (ownershipData || []).forEach(o => {
          if (!ownershipMap[o.unit_id]) ownershipMap[o.unit_id] = [];
          ownershipMap[o.unit_id].push(o);
        });
      }
    }

    // Step 3: Collect all active party_ids and fetch party details separately
    const allPartyIds = new Set();
    Object.values(ownershipMap).forEach(ownerships => {
      ownerships.filter(o => o.ownership_status === 'Active').forEach(o => {
        if (o.party_id) allPartyIds.add(o.party_id);
      });
    });

    const partyMap = {}; // party_id → party record
    if (allPartyIds.size > 0) {
      console.log(`[units] Fetching ${allPartyIds.size} parties for ownership lookup`);
      const { data: partyData, error: partyErr } = await supabase
        .from('parties')
        .select('id, first_name, last_name, company_name, owner_group')
        .in('id', Array.from(allPartyIds))
        .limit(5000); // prevent PostgREST row cap from dropping parties

      if (partyErr) {
        console.error('[units] Error fetching parties:', partyErr);
      } else {
        (partyData || []).forEach(p => {
          partyMap[p.id] = p;
          console.log(`[units] Party ${p.id}: company="${p.company_name}" owner_group="${p.owner_group}"`);
        });
      }
      console.log(`[units] Fetched ${Object.keys(partyMap).length} parties for ${unitIds.length} units`);
    }

    // Step 4: Fetch active leases for tenant info
    let leasesMap = {};
    if (unitIds.length > 0) {
      const { data: leaseData } = await supabase
        .from('leases')
        .select(`id, unit_id, party_tenant_id, status,
          tenant:parties!leases_party_tenant_id_fkey(id, company_name, brand_name, first_name, last_name)
        `)
        .in('unit_id', unitIds)
        .in('status', ['active', 'approved', 'executed', 'registered', 'occupied']);
      (leaseData || []).forEach(l => {
        if (!leasesMap[l.unit_id]) leasesMap[l.unit_id] = l;
      });
    }

    // Step 5: Map units with ownership and tenant info
    const mapped = (data || []).map(u => {
      const allOwnerships = ownershipMap[u.id] || [];
      const activeOwnerships = allOwnerships.filter(o => o.ownership_status === 'Active');
      const totalShare = activeOwnerships.reduce((sum, o) => sum + Number(o.share_percentage || 0), 0);

      const ownerParty = activeOwnerships.length > 0 ? partyMap[activeOwnerships[0].party_id] : null;
      const ownerName = ownerParty
        ? (ownerParty.company_name || `${ownerParty.first_name || ''} ${ownerParty.last_name || ''}`.trim() || 'N/A')
        : 'N/A';

      // Determine ownership grouping from owner_group
      const ownerGroup = (ownerParty?.owner_group || '').trim();
      const ownerGroupLower = ownerGroup.toLowerCase();
      let ownershipGrouping = 'Unsold';

      if (activeOwnerships.length > 0) {
        console.log(`[units] ${u.unit_number}: HAS OWNER, owner_group="${ownerGroup}"`);
        if (ownerGroupLower.includes('developer')) {
          ownershipGrouping = 'Developer Units';
          console.log(`[units] ${u.unit_number} → Developer Units`);
        } else if (ownerGroupLower.includes('close')) {
          ownershipGrouping = 'Close Group';
          console.log(`[units] ${u.unit_number} → Close Group`);
        } else if (ownerGroupLower.includes('external') || ownerGroupLower.includes('investor')) {
          ownershipGrouping = 'External Investors';
          console.log(`[units] ${u.unit_number} → External Investors`);
        } else {
          // Unit HAS an active owner but owner_group is empty or not in the 3 known groups.
          // Use 'Other Assigned' so it's never silently lost in 'Unsold'.
          ownershipGrouping = ownerGroup || 'Other Assigned';
          console.log(`[units] ${u.unit_number} → Other Assigned (owner_group not matched: "${ownerGroup}")`);
        }
      } else {
        console.log(`[units] ${u.unit_number}: NO OWNER → Unsold`);
      }

      const isFull = totalShare >= 100 || (activeOwnerships.length > 0 && totalShare > 0) || u.status === 'Sold';
      const hasOwnership = activeOwnerships.length > 0;

      const activeLease = leasesMap[u.id];
      const tenantParty = activeLease?.tenant;
      const tenantName = tenantParty
        ? (tenantParty.company_name || `${tenantParty.first_name || ''} ${tenantParty.last_name || ''}`.trim() || null)
        : null;
      const brandName = tenantParty?.brand_name || tenantParty?.company_name || null;

      return {
        id: u.id,
        unit_number: u.unit_number,
        block_tower: u.block_tower,
        floor_number: u.floor_number,
        building: u.projects?.project_name || 'N/A',
        chargeable_area: u.chargeable_area,
        status: u.status,
        project_id: u.project_id,
        owner_name: ownerName,
        tenant_name: tenantName,
        brand_name: brandName,
        total_share: totalShare,
        is_full: isFull,
        has_ownership: hasOwnership,
        projected_rent: u.projected_rent,
        unit_category: u.unit_category,
        unit_zoning_type: u.unit_zoning_type,
        unit_condition: u.unit_condition,
        plc: u.plc,
        ownership_grouping: ownershipGrouping
      };
    });

    // Filter by ownership grouping if requested
    let filteredMapped = mapped;
    if (ownership && ownership !== 'All') {
      filteredMapped = mapped.filter(u => u.ownership_grouping === ownership);
    }

    res.json({ data: filteredMapped });
  } catch (err) {
    console.error('Fetch units error:', err);
    res.status(500).json({ message: 'Failed to fetch units', error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
 * GET UNITS COUNT — lightweight, no row data (exact count)
 * ══════════════════════════════════════════════════════════ */
const getUnitsCount = async (req, res) => {
  try {
    if (req.isUnauthenticated) return res.json({ count: 0 });

    const { projectId } = req.query;

    if (req.companyId) {
      // Get all project IDs that belong to this company
      let projectsQuery = supabase.from('projects').select('id').eq('company_id', req.companyId);
      if (projectId && projectId !== 'All') {
        projectsQuery = projectsQuery.eq('id', parseInt(projectId));
      }
      // Further restrict to allowed projects for module/project users
      if (req.isRestrictedToProjects) {
        const restrictedIds = (req.projectsAccess || []).map(p => p.project_id);
        if (restrictedIds.length > 0) projectsQuery = projectsQuery.in('id', restrictedIds);
        else return res.json({ count: 0 });
      }

      const { data: companyProjects, error: projErr } = await projectsQuery;
      if (projErr) throw projErr;

      const projectIds = (companyProjects || []).map(p => p.id);
      if (projectIds.length === 0) return res.json({ count: 0 });

      // Count units by project_id only (same as getProjectById — catches all units
      // regardless of whether company_id was stamped on the unit row)
      const { count, error: countErr } = await supabase
        .from('units')
        .select('id', { count: 'exact', head: true })
        .in('project_id', projectIds);

      if (countErr) throw countErr;
      return res.json({ count: count || 0 });
    }

    // No company scope — fall back to applyScopes
    const { count, error } = await applyScopes(
      supabase.from('units').select('id', { count: 'exact', head: true }), req
    );
    if (error) throw error;
    res.json({ count: count || 0 });

  } catch (err) {
    console.error('Count units error:', err);
    res.status(500).json({ count: 0, error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
 * GET UNIT BY ID
 * ══════════════════════════════════════════════════════════ */
const getUnitById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await applyScopes(supabase
      .from('units')
      .select(`
        *,
        projects ( project_name, id ),
        unit_images ( image_path )
      `), req)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Unit not found' });

    if (!data) return res.status(404).json({ message: 'Unit not found' });

    res.json({
      ...data,
      project_name: data.projects?.project_name,
      project_id: data.projects?.id,
      unit_image: data.unit_images?.[0]?.image_path || null,
    });
  } catch (err) {
    console.error('Fetch unit by ID error:', err);
    res.status(500).json({ message: 'Failed to fetch unit', error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
 * CREATE UNIT
 * ══════════════════════════════════════════════════════════ */
const createUnit = async (req, res) => {
  try {
    const {
      project_id, unit_number, floor_number, block_tower,
      chargeable_area, carpet_area, covered_area, builtup_area,
      unit_condition, plc, unit_category, unit_zoning_type, projected_rent
    } = req.body;

    if (!project_id || !unit_number) {
      return res.status(400).json({ message: 'project_id and unit_number are required' });
    }

    // Enforce unit limit (max 1200 units per company)
    if (req.companyId) {
      const { count: unitCount } = await supabase
        .from('units')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', req.companyId);

      if ((unitCount || 0) >= 1200) {
        return res.status(409).json({
          success: false,
          message: `Unit limit reached. Your plan allows a maximum of 1200 units. You currently have ${unitCount}. Please contact your administrator to increase the limit.`,
        });
      }
    }

    // Project-specific users can only add units to their assigned project
    if (req.isProjectUser) {
      if (String(req.projectId) !== String(project_id)) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      // Check edit permission (adding units requires edit permission)
      if (!req.permissions?.edit) {
        return res.status(403).json({ message: 'You do not have permission to add units' });
      }
    }

    const insertPayload = {
      project_id: parseInt(project_id),
      unit_number,
      floor_number: floor_number || null,
      block_tower: block_tower || null,
      chargeable_area: chargeable_area ? parseFloat(chargeable_area) : null,
      carpet_area: carpet_area ? parseFloat(carpet_area) : null,
      covered_area: covered_area ? parseFloat(covered_area) : null,
      builtup_area: builtup_area ? parseFloat(builtup_area) : null,
      unit_condition: unit_condition || 'bare_shell',
      plc: plc || null,
      unit_category: unit_category || null,
      unit_zoning_type: unit_zoning_type || null,
      projected_rent: projected_rent ? parseFloat(projected_rent) : null,
      status: 'vacant',
    };
    // Multi-tenant: stamp company_id on new units
    if (req.companyId) insertPayload.company_id = req.companyId;

    const { data, error } = await supabase
      .from('units')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    // Update project total area
    const { data: unitAreas } = await supabase
      .from('units')
      .select('chargeable_area')
      .eq('project_id', project_id);

    const totalArea = (unitAreas || []).reduce((sum, u) => sum + (parseFloat(u.chargeable_area) || 0), 0);
    await supabase.from('projects').update({ total_project_area: totalArea }).eq('id', project_id);

    // Handle Image Uploads
    if (req.files && req.files.length > 0) {
      const imageInserts = [];
      for (const file of req.files) {
        if (file.buffer) {
          const fileExt = file.originalname.split('.').pop();
          const fileName = `units/unit_${data.id}_${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('lms-storage')
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
              upsert: true
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('lms-storage')
              .getPublicUrl(fileName);
            imageInserts.push({ unit_id: data.id, image_path: publicUrlData.publicUrl });
          }
        }
      }
      if (imageInserts.length > 0) {
        await supabase.from('unit_images').insert(imageInserts);
      }
    }

    res.status(201).json({ success: true, message: 'Unit created successfully', unit_id: data.id });
  } catch (err) {
    console.error('Create unit error:', err);
    res.status(500).json({ success: false, message: 'Failed to create unit', error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
 * UPDATE UNIT
 * ══════════════════════════════════════════════════════════ */
const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;

    // Project-specific users can only update units in their assigned project
    if (req.isProjectUser) {
      const { data: unitCheck } = await supabase.from('units')
        .select('project_id').eq('id', id).single();
      if (!unitCheck || String(unitCheck.project_id) !== String(req.projectId)) {
        return res.status(403).json({ message: 'You do not have access to this unit' });
      }
      // Check edit permission
      if (!req.permissions?.edit) {
        return res.status(403).json({ message: 'You do not have permission to edit units' });
      }
    }

    // Multi-tenant: silently hide units from other companies
    if (req.companyId) {
      const { data: unitCheck } = await supabase.from('units')
        .select('company_id').eq('id', id).single();
      if (!unitCheck || unitCheck.company_id !== req.companyId) {
        return res.status(404).json({ message: 'Unit not found' });
      }
    }

    const {
      unit_number, floor_number, block_tower, chargeable_area, carpet_area,
      unit_condition, plc, unit_category, unit_zoning_type, projected_rent, status
    } = req.body;

    const { error } = await supabase
      .from('units')
      .update({
        unit_number,
        floor_number: floor_number || null,
        block_tower: block_tower || null,
        chargeable_area: chargeable_area ? parseFloat(chargeable_area) : null,
        carpet_area: carpet_area ? parseFloat(carpet_area) : null,
        unit_condition: unit_condition || 'bare_shell',
        plc: plc || null,
        unit_category: unit_category || null,
        unit_zoning_type: unit_zoning_type || null,
        projected_rent: projected_rent ? parseFloat(projected_rent) : null,
        status: status || 'vacant',
      })
      .eq('id', id);

    if (error) throw error;

    // Handle Image Uploads for update
    if (req.files && req.files.length > 0) {
      const imageInserts = [];
      for (const file of req.files) {
        if (file.buffer) {
          const fileExt = file.originalname.split('.').pop();
          const fileName = `units/unit_${id}_${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('lms-storage')
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
              upsert: true
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('lms-storage')
              .getPublicUrl(fileName);
            imageInserts.push({ unit_id: id, image_path: publicUrlData.publicUrl });
          }
        }
      }
      if (imageInserts.length > 0) {
        await supabase.from('unit_images').insert(imageInserts);
      }
    }

    res.json({ message: 'Unit updated successfully' });
  } catch (err) {
    console.error('Update unit error:', err);
    res.status(500).json({ message: 'Failed to update unit', error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
 * DELETE UNIT
 * ══════════════════════════════════════════════════════════ */
const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    // Project-specific users can only delete units in their assigned project
    if (req.isProjectUser) {
      const { data: unitCheck } = await supabase.from('units')
        .select('project_id').eq('id', id).single();
      if (!unitCheck || String(unitCheck.project_id) !== String(req.projectId)) {
        return res.status(403).json({ message: 'You do not have access to this unit' });
      }
      // Check delete permission
      if (!req.permissions?.delete) {
        return res.status(403).json({ message: 'You do not have permission to delete units' });
      }
    }

    // Multi-tenant: silently hide units from other companies
    if (req.companyId) {
      const { data: unitCheck } = await supabase.from('units')
        .select('company_id').eq('id', id).single();
      if (!unitCheck || unitCheck.company_id !== req.companyId) {
        return res.status(404).json({ message: 'Unit not found' });
      }
    }

    const { data: unit } = await supabase.from('units').select('project_id').eq('id', id).single();

    const { error } = await supabase.from('units').delete().eq('id', id);
    if (error) throw error;

    if (unit) {
      const { data: unitAreas } = await supabase.from('units').select('chargeable_area').eq('project_id', unit.project_id);
      const totalArea = (unitAreas || []).reduce((sum, u) => sum + (parseFloat(u.chargeable_area) || 0), 0);
      await supabase.from('projects').update({ total_project_area: totalArea }).eq('id', unit.project_id);
    }

    res.json({ message: 'Unit deleted successfully' });
  } catch (err) {
    console.error('Delete unit error:', err);
    res.status(500).json({ message: 'Failed to delete unit', error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
 * PROJECT STRUCTURE — BLOCKS
 * ══════════════════════════════════════════════════════════ */
const getProjectBlocks = async (req, res) => {
  try {
    // PRIVACY: Never serve data without a valid company session
    if (req.isUnauthenticated) return res.json({ data: [] });

    const { project_id } = req.query;

    // PRIVACY: Verify project belongs to this company
    if (project_id && req.companyId) {
      const { data: projCheck } = await supabase.from('projects')
        .select('company_id').eq('id', project_id).single();
      if (!projCheck || projCheck.company_id !== req.companyId) {
        return res.json({ data: [] });
      }
    }

    let query = supabase.from('project_blocks').select('*, project_floors(*)').order('sort_order');
    if (project_id) query = query.eq('project_id', project_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addProjectBlock = async (req, res) => {
  try {
    const { project_id, block_name, description, sort_order } = req.body;
    if (!project_id || !block_name) {
      return res.status(400).json({ message: 'project_id and block_name are required' });
    }
    // PRIVACY: Verify project belongs to this company before adding
    if (req.companyId) {
      const { data: projCheck } = await supabase.from('projects')
        .select('company_id').eq('id', project_id).single();
      if (!projCheck || projCheck.company_id !== req.companyId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    const { data, error } = await supabase
      .from('project_blocks')
      .insert({ project_id: parseInt(project_id), block_name, description, sort_order: sort_order || 0 })
      .select().single();
    if (error) {
      if (error.code === '23505') return res.status(400).json({ message: 'Block name already exists in this project' });
      throw error;
    }
    res.status(201).json({ message: 'Block added', data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProjectBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { block_name, description, sort_order } = req.body;
    // PRIVACY: Verify block belongs to this company via its project
    if (req.companyId) {
      const { data: blockCheck } = await supabase.from('project_blocks')
        .select('project_id').eq('id', id).single();
      if (blockCheck) {
        const { data: projCheck } = await supabase.from('projects')
          .select('company_id').eq('id', blockCheck.project_id).single();
        if (!projCheck || projCheck.company_id !== req.companyId) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }
    const { error } = await supabase.from('project_blocks').update({ block_name, description, sort_order }).eq('id', id);
    if (error) throw error;
    res.json({ message: 'Block updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteProjectBlock = async (req, res) => {
  try {
    const { id } = req.params;
    // PRIVACY: Verify block belongs to this company via its project
    if (req.companyId) {
      const { data: blockCheck } = await supabase.from('project_blocks')
        .select('project_id').eq('id', id).single();
      if (blockCheck) {
        const { data: projCheck } = await supabase.from('projects')
          .select('company_id').eq('id', blockCheck.project_id).single();
        if (!projCheck || projCheck.company_id !== req.companyId) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }
    const { error } = await supabase.from('project_blocks').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Block deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
 * PROJECT STRUCTURE — FLOORS
 * ══════════════════════════════════════════════════════════ */
const getProjectFloors = async (req, res) => {
  try {
    // PRIVACY: Never serve data without a valid company session
    if (req.isUnauthenticated) return res.json({ data: [] });

    const { project_id, block_id } = req.query;

    // PRIVACY: Verify project belongs to this company
    if (project_id && req.companyId) {
      const { data: projCheck } = await supabase.from('projects')
        .select('company_id').eq('id', project_id).single();
      if (!projCheck || projCheck.company_id !== req.companyId) {
        return res.json({ data: [] });
      }
    }

    let query = supabase.from('project_floors').select('*').order('sort_order');
    if (project_id) query = query.eq('project_id', project_id);
    if (block_id) query = query.eq('block_id', block_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addProjectFloor = async (req, res) => {
  try {
    const { project_id, block_id, floor_name, units_count, sort_order } = req.body;
    if (!project_id || !floor_name) {
      return res.status(400).json({ message: 'project_id and floor_name are required' });
    }
    // PRIVACY: Verify project belongs to this company before adding
    if (req.companyId) {
      const { data: projCheck } = await supabase.from('projects')
        .select('company_id').eq('id', project_id).single();
      if (!projCheck || projCheck.company_id !== req.companyId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    const { data, error } = await supabase
      .from('project_floors')
      .insert({
        project_id: parseInt(project_id),
        block_id: block_id ? parseInt(block_id) : null,
        floor_name,
        units_count: units_count || 0,
        sort_order: sort_order || 0,
      })
      .select().single();
    if (error) throw error;
    res.status(201).json({ message: 'Floor added', data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProjectFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const { floor_name, units_count, sort_order } = req.body;
    // PRIVACY: Verify floor belongs to this company via its project
    if (req.companyId) {
      const { data: floorCheck } = await supabase.from('project_floors')
        .select('project_id').eq('id', id).single();
      if (floorCheck) {
        const { data: projCheck } = await supabase.from('projects')
          .select('company_id').eq('id', floorCheck.project_id).single();
        if (!projCheck || projCheck.company_id !== req.companyId) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }
    const { error } = await supabase.from('project_floors').update({ floor_name, units_count, sort_order }).eq('id', id);
    if (error) throw error;
    res.json({ message: 'Floor updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteProjectFloor = async (req, res) => {
  try {
    const { id } = req.params;
    // PRIVACY: Verify floor belongs to this company via its project
    if (req.companyId) {
      const { data: floorCheck } = await supabase.from('project_floors')
        .select('project_id').eq('id', id).single();
      if (floorCheck) {
        const { data: projCheck } = await supabase.from('projects')
          .select('company_id').eq('id', floorCheck.project_id).single();
        if (!projCheck || projCheck.company_id !== req.companyId) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }
    const { error } = await supabase.from('project_floors').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Floor deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getUnits, getUnitsCount, getUnitById, createUnit, updateUnit, deleteUnit,
  getProjectBlocks, addProjectBlock, updateProjectBlock, deleteProjectBlock,
  getProjectFloors, addProjectFloor, updateProjectFloor, deleteProjectFloor,
};
