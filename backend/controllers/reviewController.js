const supabase = require("../config/db");

// Get Review Stats (Counts for tabs)
exports.getReviewStats = async (req, res) => {
    try {
        const [
            { count: projectsCount },
            { count: unitsCount },
            { count: ownersCount },
            { count: tenantsCount },
            { count: leasesCount }
        ] = await Promise.all([
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'under_maintenance'),
            supabase.from('parties').select('*', { count: 'exact', head: true }).eq('is_owner', true).eq('status', 'inactive'),
            supabase.from('parties').select('*', { count: 'exact', head: true }).eq('is_tenant', true).eq('status', 'inactive'),
            supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'draft')
        ]);

        res.json({
            projects: projectsCount || 0,
            units: unitsCount || 0,
            owners: ownersCount || 0,
            tenants: tenantsCount || 0,
            leases: leasesCount || 0
        });
    } catch (err) {
        console.error("Review stats error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get Pending Items by Type
exports.getPendingItems = async (req, res) => {
    try {
        const { type } = req.query;

        switch (type) {
            case 'lease':
                const { data, error } = await supabase.from('leases').select(`
                    id, monthly_rent, lease_start, lease_end, created_at,
                    tenant:parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)
                `).eq('status', 'draft').order('created_at', { ascending: false });

                if (error) throw error;

                const mapped = data.map(l => ({
                    id: l.id,
                    tenant_name: l.tenant?.company_name || `${l.tenant?.first_name || ''} ${l.tenant?.last_name || ''}`.trim(),
                    monthly_rent: l.monthly_rent,
                    lease_start: l.lease_start,
                    lease_end: l.lease_end,
                    created_at: l.created_at
                }));
                return res.json(mapped);
                
            default:
                return res.json([]);
        }
    } catch (err) {
        console.error("Pending items error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
