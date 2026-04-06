const supabase = require('../config/db');
const { handleDbError } = require('../utils/errorHandler');

// Get all parties
exports.getAllParties = async (req, res) => {
    try {
        const { data, error } = await supabase.from('parties').select('*').order('created_at', { ascending: false });
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
        const { data, error } = await supabase.from('parties').insert({
            type: type || 'Individual', party_type: party_type || 'Tenant', 
            company_name, brand_name, brand_category, legal_entity_type, title, first_name, last_name,
            email, phone, alt_phone, identification_type, identification_number,
            address_line1, address_line2, city, state, postal_code, country,
            representative_designation, owner_group
        }).select('id').single();

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
        const { error } = await supabase.from('parties').delete().eq('id', req.params.id);
        
        if (error) return res.status(500).json(handleDbError(error));
        
        res.json({ success: true, message: 'Party deleted successfully' });
    } catch (err) {
        console.error("deleteParty Error:", err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};
