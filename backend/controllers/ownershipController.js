const supabase = require('../config/db');

// Assign parties as owners to a unit (Joint Owners)
exports.getAllOwnerships = async (req, res) => {
    try {
        const { search } = req.query;
        let query = supabase.from('unit_ownerships')
            .select('*, units!inner(unit_number, company_id, project_id, projects(project_name)), parties(first_name, last_name, company_name)')
            .eq('ownership_status', 'Active')
            .order('created_at', { ascending: false });

        // Project Segregation
        if (req.isRestrictedToProjects) {
            const allowedIds = (req.projectsAccess || []).map(p => p.project_id);
            if (allowedIds.length > 0) {
                query = query.in('units.project_id', allowedIds);
            } else {
                query = query.eq('units.project_id', -1); // Force empty
            }
        }

        const { data, error } = await query;
        if (error) throw error;

        // Multi-tenant: filter by company_id through units table
        let filtered = data || [];
        if (req.companyId) {
            filtered = filtered.filter(row => row.units?.company_id === req.companyId);
        }
        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter(row =>
                (row.parties?.first_name?.toLowerCase() || '').includes(s) ||
                (row.parties?.last_name?.toLowerCase() || '').includes(s) ||
                (row.parties?.company_name?.toLowerCase() || '').includes(s) ||
                (row.units?.unit_number?.toLowerCase() || '').includes(s) ||
                (row.units?.projects?.project_name?.toLowerCase() || '').includes(s)
            );
        }

        res.json(filtered);
    } catch (err) {
        console.error("getAllOwnerships Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Assign parties as owners to a unit (Joint Owners)
exports.assignOwner = async (req, res) => {
    const { unit_id, owners, start_date } = req.body; // owners: [{party_id, share_percentage}]

    if (!Array.isArray(owners) || owners.length === 0 || owners.length > 4) {
        return res.status(400).json({ message: 'Must provide 1 to 4 joint owners.' });
    }

    const totalShare = owners.reduce((sum, o) => sum + Number(o.share_percentage || 0), 0);
    if (Math.abs(totalShare - 100) > 0.01) {
        return res.status(400).json({ message: 'Total share percentage must be exactly 100%.' });
    }

    try {
        const assignDate = start_date || new Date().toISOString();

        // Multi-tenant: silently hide units from other companies
        if (req.companyId) {
            const { data: unitCheck } = await supabase.from('units')
                .select('company_id').eq('id', unit_id).single();
            if (!unitCheck || unitCheck.company_id !== req.companyId) {
                return res.status(404).json({ message: 'Unit not found' });
            }
        }

        // Check if any of these parties is already an active owner
        const partyIds = owners.map(o => o.party_id);
        const { data: existing, error: eErr } = await supabase.from('unit_ownerships')
            .select('party_id').eq('unit_id', unit_id).eq('ownership_status', 'Active').in('party_id', partyIds);

        if (eErr) throw eErr;

        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'One or more parties is already an active owner.' });
        }

        const inserts = owners.map(o => ({
            unit_id,
            party_id: o.party_id,
            start_date: assignDate,
            ownership_status: 'Active',
            share_percentage: o.share_percentage
        }));

        const { error: iErr } = await supabase.from('unit_ownerships').insert(inserts);
        if (iErr) throw iErr;

        res.status(201).json({ message: 'Owners assigned successfully' });
    } catch (err) {
        console.error("assignOwner Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Remove an owner (mark as Inactive/Sold)
exports.removeOwner = async (req, res) => {
    const { unit_id, party_id, end_date, status } = req.body; // status can be 'Inactive' or 'Sold'

    try {
        // Multi-tenant: silently hide units from other companies
        if (req.companyId) {
            const { data: unitCheck } = await supabase.from('units')
                .select('company_id').eq('id', unit_id).single();
            if (!unitCheck || unitCheck.company_id !== req.companyId) {
                return res.status(404).json({ message: 'Unit not found' });
            }
        }

        const endDate = end_date || new Date().toISOString();
        const { error } = await supabase.from('unit_ownerships')
            .update({ ownership_status: status || 'Inactive', end_date: endDate })
            .eq('unit_id', unit_id)
            .eq('party_id', party_id)
            .eq('ownership_status', 'Active');

        if (error) throw error;

        res.json({ message: 'Owner removed/updated successfully' });
    } catch (err) {
        console.error("removeOwner Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Get owners for a unit
exports.getOwnersByUnit = async (req, res) => {
    try {
        const { data, error } = await supabase.from('unit_ownerships')
            .select('*, parties(first_name, last_name, company_name, type)')
            .eq('unit_id', req.params.unitId)
            .order('ownership_status', { ascending: true })
            .order('start_date', { ascending: false });

        if (error) throw error;

        const formatted = data.map(d => ({
            ...d,
            first_name: d.parties?.first_name,
            last_name: d.parties?.last_name,
            company_name: d.parties?.company_name,
            type: d.parties?.type
        }));

        res.json(formatted);
    } catch (err) {
        console.error("getOwnersByUnit Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Get units owned by a party
exports.getUnitsByParty = async (req, res) => {
    try {
        const { data, error } = await supabase.from('unit_ownerships')
            .select('*, units(unit_number, project_id, projects(project_name))')
            .eq('party_id', req.params.partyId);

        if (error) throw error;

        const formatted = data.map(d => ({
            ...d,
            unit_number: d.units?.unit_number,
            project_name: d.units?.projects?.project_name
        }));

        res.json(formatted);
    } catch (err) {
        console.error("getUnitsByParty Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Upload an ownership document
exports.uploadOwnershipDocument = async (req, res) => {
    try {
        const { unit_id, party_id, document_type_id, document_date } = req.body;

        // Validate required fields
        if (!unit_id || !party_id) {
            return res.status(400).json({ message: 'Unit ID and Party ID are required' });
        }

        // Multi-tenant: silently hide units from other companies
        if (req.companyId) {
            const { data: unitCheck } = await supabase.from('units')
                .select('company_id').eq('id', parseInt(unit_id)).single();
            if (!unitCheck || unitCheck.company_id !== req.companyId) {
                return res.status(404).json({ message: 'Unit not found' });
            }
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'No file uploaded. Please select a file.' });
        }

        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `ownership/unit_${unit_id}_party_${party_id}_${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('lms-storage')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (uploadError) {
            console.error("Supabase storage upload error:", uploadError);
            return res.status(500).json({ message: 'Failed to upload file to storage', error: uploadError.message });
        }

        // Get Public URL
        const { data: publicUrlData } = supabase.storage
            .from('lms-storage')
            .getPublicUrl(fileName);

        const filePath = publicUrlData.publicUrl;

        // Validate document_type_id exists if provided
        let validDocTypeId = document_type_id ? parseInt(document_type_id) : null;
        console.log('Upload - unit_id:', unit_id, 'party_id:', party_id, 'document_type_id:', document_type_id, 'validDocTypeId:', validDocTypeId);

        // Check if document of same type already exists for this unit+party
        let existingDocQuery = supabase.from('unit_ownership_documents')
            .select('id')
            .eq('unit_id', parseInt(unit_id))
            .eq('party_id', parseInt(party_id));

        if (validDocTypeId) {
            existingDocQuery = existingDocQuery.eq('document_type_id', validDocTypeId);
        } else {
            existingDocQuery = existingDocQuery.is('document_type_id', null);
        }

        const { data: existingDocs, error: existingError } = await existingDocQuery;
        const existingDoc = existingDocs && existingDocs.length > 0 ? existingDocs[0] : null;

        if (existingError && existingError.code !== 'PGRST116') {
            console.warn('Error checking existing doc:', existingError);
        }

        let error;
        if (existingDoc) {
            // Update existing document record with new file and date
            const { error: updateError } = await supabase.from('unit_ownership_documents')
                .update({
                    document_date: document_date || null,
                    file_path: filePath
                })
                .eq('id', existingDoc.id);
            error = updateError;
        } else {
            // Insert new document record
            const { error: insertError } = await supabase.from('unit_ownership_documents').insert({
                unit_id: parseInt(unit_id),
                party_id: parseInt(party_id),
                document_type_id: validDocTypeId,
                document_date: document_date || null,
                file_path: filePath
            });
            error = insertError;
        }

        if (error) {
            console.error("Database error:", error);
            return res.status(500).json({ message: 'Failed to save document record', error: error.message, details: error.details });
        }

        console.log('Document saved successfully:', { file_path: filePath, updated: !!existingDoc, document_date });
        res.status(201).json({ message: 'Document uploaded successfully', file_path: filePath, updated: !!existingDoc });
    } catch (err) {
        console.error("uploadOwnershipDocument Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Get documents for an ownership association
exports.getOwnershipDocuments = async (req, res) => {
    try {
        const { unitId, partyId } = req.params;

        // Multi-tenant: silently hide units from other companies
        if (req.companyId && unitId) {
            const { data: unitCheck } = await supabase.from('units')
                .select('company_id').eq('id', unitId).single();
            if (!unitCheck || unitCheck.company_id !== req.companyId) {
                return res.json([]); // Return empty array silently
            }
        }

        let query = supabase.from('unit_ownership_documents')
            .select('id, unit_id, party_id, document_type_id, document_date, file_path, created_at, ownership_document_types(name)')
            .order('created_at', { ascending: false });

        if (unitId) query = query.eq('unit_id', unitId);
        if (partyId) query = query.eq('party_id', partyId);

        const { data, error } = await query;
        if (error) throw error;

        const formatted = data.map(d => ({
            id: d.id,
            unit_id: d.unit_id,
            party_id: d.party_id,
            document_type_id: d.document_type_id,
            document_date: d.document_date,
            file_path: d.file_path,
            created_at: d.created_at,
            document_type_name: d.ownership_document_types?.name
        }));

        res.json(formatted);
    } catch (err) {
        console.error("getOwnershipDocuments Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Get all document types
exports.getDocumentTypes = async (req, res) => {
    try {
        const { data, error } = await supabase.from('ownership_document_types')
            .select('*').eq('is_active', true).order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("getDocumentTypes Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Add a new document type
exports.addDocumentType = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Document type name is required' });

        const { data, error } = await supabase.from('ownership_document_types').insert({ name }).select('*').single();
        if (error) throw error;

        res.status(201).json(data);
    } catch (err) {
        console.error("addDocumentType Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
