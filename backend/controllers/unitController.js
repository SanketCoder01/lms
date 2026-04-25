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
    const { projectId, search, status, excludeSold } = req.query;

    let query = applyScopes(supabase
      .from('units')
      .select(`
        id, unit_number, block_tower, floor_number, chargeable_area, status, project_id,
        projected_rent, unit_category, unit_zoning_type,
        projects!inner ( project_name ),
        unit_ownerships (
          id, ownership_status, share_percentage,
          parties ( id, first_name, last_name, company_name, party_type )
        )
      `), req)
      .order('id', { ascending: false });

    if (projectId && projectId !== 'All') {
      query = query.eq('project_id', parseInt(projectId));
    }
    if (status && status !== 'All') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`unit_number.ilike.%${search}%`);
    }
    if (excludeSold === 'true') {
      // Exclude units with active ownership — handled client-side
    }

    const { data, error } = await query;
    if (error) throw error;

    // Map data with owner name
    const mapped = (data || []).map(u => {
      const activeOwnerships = (u.unit_ownerships || []).filter(o => o.ownership_status === 'Active');
      const totalShare = activeOwnerships.reduce((sum, o) => sum + Number(o.share_percentage || 100), 0);
      
      const ownerParty = activeOwnerships[0]?.parties;
      const ownerName = ownerParty
        ? (ownerParty.company_name || `${ownerParty.first_name || ''} ${ownerParty.last_name || ''}`.trim() || 'N/A')
        : 'N/A';
      
      // Determine ownership grouping based on party_type
      const partyType = ownerParty?.party_type || '';
      let ownershipGrouping = 'Developer Units'; // Default for unsold
      if (activeOwnerships.length > 0) {
        if (partyType === 'Group Company' || partyType === 'Group' || partyType === 'Related Party') {
          ownershipGrouping = 'Group Companies';
        } else if (partyType === 'Owner' || partyType === 'Investor' || partyType === 'External') {
          ownershipGrouping = 'Other Investors';
        } else {
          // If has ownership but party_type doesn't match above, check if it's developer
          ownershipGrouping = 'Other Investors';
        }
      }

      const isFull = totalShare >= 100 || u.status === 'Sold';

      return {
        id:            u.id,
        unit_number:   u.unit_number,
        block_tower:   u.block_tower,
        floor_number:  u.floor_number,
        building:      u.projects?.project_name || 'N/A',
        chargeable_area: u.chargeable_area,
        status:        u.status,
        project_id:    u.project_id,
        owner_name:    ownerName,
        total_share:   totalShare,
        is_full:       isFull,
        projected_rent: u.projected_rent,
        unit_category: u.unit_category,
        unit_zoning_type: u.unit_zoning_type,
        ownership_grouping: ownershipGrouping
      };
    });

    res.json({ data: mapped });
  } catch (err) {
    console.error('Fetch units error:', err);
    res.status(500).json({ message: 'Failed to fetch units', error: err.message });
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
      project_id:   data.projects?.id,
      unit_image:   data.unit_images?.[0]?.image_path || null,
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
      project_id:    parseInt(project_id),
      unit_number,
      floor_number:  floor_number  || null,
      block_tower:   block_tower   || null,
      chargeable_area: chargeable_area ? parseFloat(chargeable_area) : null,
      carpet_area:   carpet_area   ? parseFloat(carpet_area) : null,
      covered_area:  covered_area  ? parseFloat(covered_area) : null,
      builtup_area:  builtup_area  ? parseFloat(builtup_area) : null,
      unit_condition: unit_condition || 'bare_shell',
      plc:           plc           || null,
      unit_category: unit_category || null,
      unit_zoning_type: unit_zoning_type || null,
      projected_rent: projected_rent ? parseFloat(projected_rent) : null,
      status:        'vacant',
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
        floor_number:  floor_number || null,
        block_tower:   block_tower  || null,
        chargeable_area: chargeable_area ? parseFloat(chargeable_area) : null,
        carpet_area:   carpet_area  ? parseFloat(carpet_area) : null,
        unit_condition: unit_condition || 'bare_shell',
        plc:           plc || null,
        unit_category: unit_category || null,
        unit_zoning_type: unit_zoning_type || null,
        projected_rent: projected_rent ? parseFloat(projected_rent) : null,
        status:        status || 'vacant',
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
    const { project_id } = req.query;
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
    const { project_id, block_id } = req.query;
    let query = supabase.from('project_floors').select('*').order('sort_order');
    if (project_id) query = query.eq('project_id', project_id);
    if (block_id)   query = query.eq('block_id', block_id);
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
    const { data, error } = await supabase
      .from('project_floors')
      .insert({
        project_id: parseInt(project_id),
        block_id:   block_id ? parseInt(block_id) : null,
        floor_name,
        units_count: units_count || 0,
        sort_order:  sort_order || 0,
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
    const { error } = await supabase.from('project_floors').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Floor deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getUnits, getUnitById, createUnit, updateUnit, deleteUnit,
  getProjectBlocks, addProjectBlock, updateProjectBlock, deleteProjectBlock,
  getProjectFloors, addProjectFloor, updateProjectFloor, deleteProjectFloor,
};
