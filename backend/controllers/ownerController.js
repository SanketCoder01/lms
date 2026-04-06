const supabase = require('../config/db');

exports.getOwnerDetails = async (req, res) => {
    const ownerId = req.params.id;
    try {
        const { data: owner, error } = await supabase.from('owners').select('*').eq('id', ownerId).single();
        if (error || !owner) return res.status(404).json({ message: "Owner not found" });

        const { data: ownerUnits } = await supabase.from('owner_units').select('unit_id').eq('owner_id', ownerId);
        const unitIds = (ownerUnits || []).map(ou => ou.unit_id);
        
        let units = [];
        if (unitIds.length > 0) {
            const { data: uData } = await supabase.from('units').select('*').in('id', unitIds);
            units = uData || [];
        }

        res.json({ owner, units });
    } catch (err) {
        console.error("GET OWNER DETAILS ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getOwners = async (req, res) => {
    try {
        const { search, location } = req.query;

        let query = supabase.from('owners').select(`
            id, name, email, phone, gst_number, total_owned_area, kyc_status, created_at, address,
            owner_documents(document_path)
        `).order('created_at', { ascending: false });

        if (location && location !== 'All') {
            query = query.ilike('address', `%${location}%`);
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data: rows, error } = await query;
        if (error) throw error;

        const formattedRows = rows.map(r => {
            const docPaths = Array.isArray(r.owner_documents) ? r.owner_documents : [];
            const latestDoc = docPaths.length > 0 ? docPaths[docPaths.length - 1].document_path : null;
            return {
                ...r,
                document_path: latestDoc
            };
        });

        res.json(formattedRows);
    } catch (err) {
        console.error("GET OWNERS ERROR:", err);
        res.status(500).json({ message: "Failed to fetch owners", error: err.message });
    }
};

exports.getOwnerLocations = async (req, res) => {
    try {
        const { data, error } = await supabase.from('owners').select('address').not('address', 'is', null);
        if (error) throw error;
        const locations = [...new Set(data.map(d => d.address).filter(a => a.trim() !== ''))].sort();
        res.json(locations);
    } catch (err) {
        console.error("GET OWNER LOCATIONS ERROR:", err);
        res.status(500).json({ message: "Failed to fetch locations" });
    }
};

exports.exportOwners = async (req, res) => {
    try {
        const { data: rows, error } = await supabase.from('owners').select(`
            id, name, email, phone, representative_name, gst_number, total_owned_area, address, kyc_status, created_at
        `).order('created_at', { ascending: false });

        if (error) throw error;

        const fields = ['id', 'name', 'email', 'phone', 'representative_name', 'gst_number', 'total_owned_area', 'address', 'kyc_status', 'created_at'];
        const csvRows = [fields.join(',')];

        for (const row of rows) {
            const values = fields.map(field => {
                const val = row[field];
                if (val === null || val === undefined) return '';
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            });
            csvRows.push(values.join(','));
        }

        res.header('Content-Type', 'text/csv');
        res.attachment('kyc_report.csv');
        return res.send(csvRows.join('\n'));
    } catch (err) {
        console.error("EXPORT OWNERS ERROR:", err);
        res.status(500).json({ message: "Failed to export owners" });
    }
};

exports.getOwnerById = exports.getOwnerDetails; // Alias already fixed

exports.createOwner = async (req, res) => {
    try {
        const {
            name, email, phone, alternative_contact, representative_name,
            representative_phone, representative_email, address, unit_ids
        } = req.body;

        let totalOwnedArea = 0;
        if (unit_ids && unit_ids.length > 0) {
            const { data: units } = await supabase.from('units').select('chargeable_area').in('id', unit_ids);
            if (units) {
                totalOwnedArea = units.reduce((sum, u) => sum + Number(u.chargeable_area || 0), 0);
            }
        }

        const { data: owner, error: oError } = await supabase.from('owners').insert({
            name, email, phone, alternative_contact, representative_name,
            representative_phone, representative_email, address, total_owned_area: totalOwnedArea,
            kyc_status: "pending"
        }).select('id').single();

        if (oError) throw oError;
        const ownerId = owner.id;

        if (unit_ids && unit_ids.length > 0) {
            const ownerUnits = unit_ids.map(u => ({ owner_id: ownerId, unit_id: u }));
            await supabase.from('owner_units').insert(ownerUnits);
            await supabase.from('units').update({ status: 'occupied' }).in('id', unit_ids);
        }

        res.json({ message: "Owner created successfully" });
    } catch (err) {
        console.error("CREATE OWNER ERROR:", err);
        res.status(500).json({ message: "Failed to add owner: " + err.message });
    }
};

exports.updateOwner = async (req, res) => {
    try {
        const ownerId = req.params.id;
        const updates = req.body;
        
        const allowedFields = ['name', 'email', 'phone', 'representative_name', 'representative_phone', 'representative_email', 'address', 'gst_number', 'kyc_status'];
        const updateData = {};
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updateData[key] = value;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No valid fields to update" });
        }

        const { error } = await supabase.from('owners').update(updateData).eq('id', ownerId);
        if (error) throw error;

        res.json({ message: "Owner updated successfully" });
    } catch (err) {
        console.error("UPDATE OWNER ERROR:", err);
        res.status(500).json({ message: "Failed to update owner" });
    }
};

exports.deleteOwner = async (req, res) => {
    try {
        const ownerId = req.params.id;
        
        const { data: myUnits } = await supabase.from('owner_units').select('unit_id').eq('owner_id', ownerId);
        if (myUnits && myUnits.length > 0) {
            const unitIds = myUnits.map(u => u.unit_id);
            await supabase.from('units').update({ status: 'vacant' }).in('id', unitIds);
        }
        
        // Supabase has ON DELETE CASCADE for owner_units and owner_documents and owner_messages!
        // But for leases we might need to manually set owner_id to null if the table exists
        // Wait, leases schema: party_owner_id INT REFERENCES parties(id) => Doesn't reference legacy `owners`
        // But let's handle just in case 'owner_id' column exists
        // (It doesn't in supabase_schema.sql, but we can bypass)
        
        const { error } = await supabase.from('owners').delete().eq('id', ownerId);
        if (error) throw error;

        res.json({ message: "Owner deleted successfully" });
    } catch (err) {
        console.error("DELETE OWNER ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.addUnitsToOwner = async (req, res) => {
    try {
        const { unit_ids } = req.body;
        const ownerId = req.params.id;

        if (!unit_ids || unit_ids.length === 0) return res.status(400).json({ message: "No units selected" });

        const ownerUnits = unit_ids.map(u => ({ owner_id: ownerId, unit_id: u }));
        await supabase.from('owner_units').insert(ownerUnits);
        await supabase.from('units').update({ status: 'occupied' }).in('id', unit_ids);

        res.json({ message: "Units added successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to add units" });
    }
};

exports.removeUnitFromOwner = async (req, res) => {
    try {
        const { id, unitId } = req.params;
        await supabase.from('owner_units').delete().eq('owner_id', id).eq('unit_id', unitId);
        await supabase.from('units').update({ status: 'vacant' }).eq('id', unitId);
        res.json({ message: "Unit removed successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to remove unit" });
    }
};

exports.getKycStats = async (req, res) => {
    try {
        const [{ count: total }, { count: pending }, { count: verified }, { count: rejected }] = await Promise.all([
            supabase.from('owners').select('*', { count: 'exact', head: true }),
            supabase.from('owners').select('*', { count: 'exact', head: true }).or('kyc_status.eq.pending,kyc_status.is.null'),
            supabase.from('owners').select('*', { count: 'exact', head: true }).eq('kyc_status', 'verified'),
            supabase.from('owners').select('*', { count: 'exact', head: true }).eq('kyc_status', 'rejected')
        ]);

        res.json({ total, pending, verified, rejected });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch KYC stats" });
    }
};

exports.getOwnerDocuments = async (req, res) => {
    try {
        const { data, error } = await supabase.from('owner_documents').select('*').eq('owner_id', req.params.id).order('uploaded_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: "Failed to get documents" });
    }
};

exports.uploadDocument = async (req, res) => {
    try {
        const ownerId = req.params.id;
        const { document_type } = req.body;
        const filePath = req.file ? req.file.path : null;

        if (!filePath) return res.status(400).json({ message: "No file uploaded" });

        const { error } = await supabase.from('owner_documents').insert({
            owner_id: ownerId, document_type: document_type || "General", document_path: filePath
        });
        if (error) throw error;

        res.json({ message: "Document uploaded successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to upload document" });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const ownerId = req.params.id;
        const { subject, message } = req.body;

        const { error } = await supabase.from('owner_messages').insert({
            owner_id: ownerId, subject: subject || "No Subject", message
        });
        if (error) throw error;

        res.json({ message: "Message sent successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to send message" });
    }
};