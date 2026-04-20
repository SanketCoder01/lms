const supabase = require("../config/db");

// Get Review Stats (Counts for tabs)
exports.getReviewStats = async (req, res) => {
    try {
        // Multi-tenant: build queries with company_id filter
        const projectQ = supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const unitQ = supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'under_maintenance');
        const ownerQ = supabase.from('parties').select('*', { count: 'exact', head: true }).eq('is_owner', true).eq('status', 'inactive');
        const tenantQ = supabase.from('parties').select('*', { count: 'exact', head: true }).eq('is_tenant', true).eq('status', 'inactive');
        const leaseQ = supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'draft');

        if (req.companyId) {
            projectQ.eq('company_id', req.companyId);
            unitQ.eq('company_id', req.companyId);
            ownerQ.eq('company_id', req.companyId);
            tenantQ.eq('company_id', req.companyId);
            leaseQ.eq('company_id', req.companyId);
        }

        const [
            { count: projectsCount },
            { count: unitsCount },
            { count: ownersCount },
            { count: tenantsCount },
            { count: leasesCount }
        ] = await Promise.all([projectQ, unitQ, ownerQ, tenantQ, leaseQ]);

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
                let query = supabase.from('leases').select(`
                    id, monthly_rent, lease_start, lease_end, created_at, company_id,
                    tenant:parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)
                `).eq('status', 'draft').order('created_at', { ascending: false });

                // Multi-tenant: company users only see their own leases
                if (req.companyId) query = query.eq('company_id', req.companyId);

                const { data, error } = await query;

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
