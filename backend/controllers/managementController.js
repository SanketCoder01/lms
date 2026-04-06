const supabase = require("../config/db");

/* ================= DASHBOARD STATS ================= */
exports.getDashboardStats = async (req, res) => {
    try {
        const [projects, units, owners, tenants, leases] = await Promise.all([
            supabase.from('projects').select('*', { count: 'exact', head: true }),
            supabase.from('units').select('*', { count: 'exact', head: true }),
            supabase.from('owners').select('*', { count: 'exact', head: true }),
            supabase.from('tenants').select('*', { count: 'exact', head: true }),
            supabase.from('leases').select('*', { count: 'exact', head: true })
        ]);

        res.json({
            totalProjects: projects.count || 0,
            totalUnits: units.count || 0,
            totalOwners: owners.count || 0,
            totalTenants: tenants.count || 0,
            totalLeases: leases.count || 0,
            totalRevenue: "₹0", // Placeholder until Financials module is ready
        });
    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
};

/* ================= REPORTS ================= */
exports.getReports = async (req, res) => {
    try {
        const { project_id, owner_id, tenant_id, search } = req.query;

        let query = supabase.from('leases').select(`
            id, lease_start, lease_type, status,
            projects(project_name),
            tenant:parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)
        `).order('created_at', { ascending: false });

        if (project_id) query = query.eq('project_id', project_id);
        if (owner_id) query = query.eq('party_owner_id', owner_id);
        if (tenant_id) query = query.eq('party_tenant_id', tenant_id);

        const { data, error } = await query;
        if(error) throw error;

        let formatted = data.map(r => ({
            id: r.id,
            name: `${r.projects?.project_name || 'N/A'} - ${r.tenant?.company_name || String(r.tenant?.first_name || '') + ' ' + String(r.tenant?.last_name || '')}`.trim(),
            date: new Date(r.lease_start).toLocaleDateString(),
            type: r.lease_type,
            status: r.status,
            project_name: r.projects?.project_name,
            tenant_name: r.tenant?.company_name || String(r.tenant?.first_name || '') + ' ' + String(r.tenant?.last_name || '')
        }));

        if (search) {
            const s = search.toLowerCase();
            formatted = formatted.filter(f => 
                (f.project_name && f.project_name.toLowerCase().includes(s)) ||
                (f.tenant_name && f.tenant_name.toLowerCase().includes(s))
            );
        }

        res.json(formatted);
    } catch (err) {
        console.error("Get Reports Error:", err);
        res.status(500).json({ message: "Failed to fetch reports" });
    }
};

/* ================= DOCUMENTS ================= */
exports.getDocuments = async (req, res) => {
    try {
        // Fallback for documents since schema might be owner_documents, tenant_documents etc. 
        // Assuming there is a generic documents table if this legacy API exists
        const { data: docs, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
        
        let formatted = [];
        if (!error && docs) {
            formatted = docs.map(d => ({
                id: d.id,
                projectName: d.project_name || "Unknown",
                date: d.created_at,
                uploadedBy: d.uploaded_by || "Admin",
                category: d.category
            }));
        }
        res.json(formatted);
    } catch (err) {
        console.error("Get Docs Error:", err);
        res.status(500).json({ message: "Failed to fetch documents" });
    }
};

/* ================= NOTIFICATIONS ================= */
exports.getNotifications = async (req, res) => {
    try {
        const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if(error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error("Get Notifications Error:", err);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

/* ================= SEARCH ================= */
exports.searchData = async (req, res) => {
    res.json([]);
};

/* ================= PROFILE ================= */
exports.getProfile = async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('first_name, last_name, email, phone, job_title, location').eq('id', 1).single();
        if (data) {
            res.json({
                firstName: data.first_name,
                lastName: data.last_name,
                email: data.email,
                phone: data.phone,
                jobTitle: data.job_title,
                location: data.location
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (err) {
        console.error("Get Profile Error:", err);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};

exports.updateProfile = async (req, res) => {
    const { firstName, lastName, phone, jobTitle, location } = req.body;
    try {
        const { error } = await supabase.from('users').update({
            first_name: firstName, last_name: lastName, phone, job_title: jobTitle, location
        }).eq('id', 1);

        if(error) throw error;
        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ message: "Failed to update profile" });
    }
};
