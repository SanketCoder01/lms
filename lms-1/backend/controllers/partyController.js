const supabase = require('../config/db');
const { handleDbError } = require('../utils/errorHandler');

// Get all parties
exports.getAllParties = async (req, res) => {
    try {
        let query = supabase.from('parties').select('*').order('created_at', { ascending: false });
        
        // Multi-tenant: company users only see their own parties
        if (req.companyId) query = query.eq('company_id', req.companyId);

        // Project Segregation
        if (req.isRestrictedToProjects) {
            const allowedIds = (req.projectsAccess || []).map(p => p.project_id);
            if (allowedIds.length > 0) {
                // Fetch party IDs from leases in these projects
                const { data: leaseData } = await supabase.from('leases')
                    .select('party_tenant_id, party_owner_id')
                    .in('project_id', allowedIds);
                
                // Fetch party IDs from ownerships in units of these projects
                const { data: ownData } = await supabase.from('unit_ownerships')
                    .select('party_id, units!inner(project_id)')
                    .in('units.project_id', allowedIds);

                const validPartyIds = new Set();
                (leaseData || []).forEach(l => {
                    if (l.party_tenant_id) validPartyIds.add(l.party_tenant_id);
                    if (l.party_owner_id) validPartyIds.add(l.party_owner_id);
                });
                (ownData || []).forEach(o => {
                    if (o.party_id) validPartyIds.add(o.party_id);
                });

                if (validPartyIds.size > 0) {
                    query = query.in('id', Array.from(validPartyIds));
                } else {
                    query = query.eq('id', -1); // Force empty if no related parties found
                }
            } else {
                query = query.eq('id', -1); // Force empty if no projects
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error("getAllParties Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Get single party by ID
exports.getPartyById = async (req, res) => {
    try {
        const { data, error } = await supabase.from('parties').select('*').eq('id', req.params.id).single();
        if (error) {
            if (error.code === 'PGRST116') return res.status(404).json({ message: 'Party not found' });
            throw error;
        }
        // Multi-tenant: silently hide parties from other companies
        if (req.companyId && data.company_id && data.company_id !== req.companyId) {
            return res.status(404).json({ message: 'Party not found' });
        }
        
        // Project Segregation check (strict check for direct party fetch)
        if (req.isRestrictedToProjects) {
            const allowedIds = (req.projectsAccess || []).map(p => p.project_id);
            const [{ data: lData }, { data: oData }] = await Promise.all([
                supabase.from('leases').select('id').in('project_id', allowedIds).or(`party_tenant_id.eq.${data.id},party_owner_id.eq.${data.id}`).limit(1),
                supabase.from('unit_ownerships').select('id, units!inner(project_id)').in('units.project_id', allowedIds).eq('party_id', data.id).limit(1)
            ]);
            if ((!lData || lData.length === 0) && (!oData || oData.length === 0)) {
                return res.status(404).json({ message: 'Party not found' });
            }
        }

        res.json(data);
    } catch (err) {
        console.error("getPartyById Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Create a new party
exports.createParty = async (req, res) => {
    const {
        type, party_type, company_name, brand_name, brand_category, legal_entity_type, title, first_name, last_name,
        email, phone, alt_phone, identification_type, identification_number,
        address_line1, address_line2, city, state, postal_code, country,
        representative_designation, owner_group
    } = req.body;

    try {
        const insertPayload = {
            type: type || 'Individual', party_type: party_type || 'Tenant',
            company_name, brand_name, brand_category, legal_entity_type, title, first_name, last_name,
            email, phone, alt_phone, identification_type, identification_number,
            address_line1, address_line2, city, state, postal_code, country,
            representative_designation, owner_group
        };
        // Multi-tenant: stamp company_id on new parties
        if (req.companyId) insertPayload.company_id = req.companyId;

        const { data, error } = await supabase.from('parties').insert(insertPayload).select('id').single();

        if (error) return res.status(500).json(handleDbError(error));
        
        res.status(201).json({ success: true, id: data.id, ...req.body });
    } catch (err) {
        console.error("createParty Error:", err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// Update a party
exports.updateParty = async (req, res) => {
    const {
        type, party_type, company_name, brand_name, brand_category, legal_entity_type, title, first_name, last_name,
        email, phone, alt_phone, identification_type, identification_number,
        address_line1, address_line2, city, state, postal_code, country,
        representative_designation, owner_group
    } = req.body;

    try {
        // Multi-tenant: silently hide parties from other companies
        if (req.companyId) {
            const { data: partyCheck } = await supabase.from('parties')
                .select('company_id').eq('id', req.params.id).single();
            if (!partyCheck || partyCheck.company_id !== req.companyId) {
                return res.status(404).json({ message: 'Party not found' });
            }
        }

        const { error } = await supabase.from('parties').update({
            type, party_type, company_name, brand_name, brand_category, legal_entity_type, title, first_name, last_name,
            email, phone, alt_phone, identification_type, identification_number,
            address_line1, address_line2, city, state, postal_code, country,
            representative_designation, owner_group
        }).eq('id', req.params.id);

        if (error) return res.status(500).json(handleDbError(error));
        
        res.json({ success: true, message: 'Party updated successfully' });
    } catch (err) {
        console.error("updateParty Error:", err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// Delete a party
exports.deleteParty = async (req, res) => {
    try {
        // Multi-tenant: silently hide parties from other companies
        if (req.companyId) {
            const { data: partyCheck } = await supabase.from('parties')
                .select('company_id').eq('id', req.params.id).single();
            if (!partyCheck || partyCheck.company_id !== req.companyId) {
                return res.status(404).json({ message: 'Party not found' });
            }
        }

        const { error } = await supabase.from('parties').delete().eq('id', req.params.id);
        
        if (error) return res.status(500).json(handleDbError(error));
        
        res.json({ success: true, message: 'Party deleted successfully' });
    } catch (err) {
        console.error("deleteParty Error:", err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};
