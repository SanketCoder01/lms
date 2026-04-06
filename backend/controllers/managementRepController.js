const supabase = require("../config/db");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for File Uploads (VERCEL-SAFE)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
exports.upload = upload;

/* ================= EXPORT REPORTS CSV ================= */
exports.exportReports = async (req, res) => {
  try {
    const { project_id, owner_id, tenant_id } = req.query;

    let query = supabase.from('leases').select(`
      lease_start, lease_end, status, monthly_rent,
      projects(project_name), units(unit_number),
      tenant:parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)
    `).order('created_at', { ascending: false });

    if (project_id) query = query.eq('project_id', project_id);
    if (owner_id) query = query.eq('party_owner_id', owner_id);
    if (tenant_id) query = query.eq('party_tenant_id', tenant_id);

    const { data, error } = await query;
    if(error) throw error;

    const headers = ['Project Name', 'Unit Number', 'Tenant', 'Monthly Rent', 'Lease Start', 'Lease End', 'Status'];
    const csvRows = data.map(r => {
        const tenantStr = r.tenant?.company_name || `${r.tenant?.first_name || ''} ${r.tenant?.last_name || ''}`.trim() || 'N/A';
        return [
            `"${r.projects?.project_name || 'N/A'}"`,
            `"${r.units?.unit_number || 'N/A'}"`,
            `"${tenantStr}"`,
            r.monthly_rent || 0,
            r.lease_start ? new Date(r.lease_start).toLocaleDateString() : '',
            r.lease_end ? new Date(r.lease_end).toLocaleDateString() : '',
            r.status
        ];
    });

    const csvString = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="reports_export.csv"');
    res.send(csvString);
  } catch (error) {
    console.error("Export CSV error:", error);
    res.status(500).send("Failed to generate CSV");
  }
};

/* ================= GET REP REPORTS ================= */
exports.getRepReports = async (req, res) => {
  try {
    const { project_id, owner_id, tenant_id, search, page = 1, limit = 10 } = req.query;

    let query = supabase.from('leases').select(`
      id, lease_type, lease_start, status, created_at,
      projects(project_name, project_image),
      tenant:parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)
    `).order('created_at', { ascending: false });

    if (project_id) query = query.eq('project_id', project_id);
    if (owner_id) query = query.eq('party_owner_id', owner_id);
    if (tenant_id) query = query.eq('party_tenant_id', tenant_id);

    const { data: reports, error } = await query;
    if(error) throw error;

    let formatted = reports.map(r => ({
      id: `L-${r.id}`,
      name: `${r.projects?.project_name || 'N/A'} - ${r.tenant?.company_name || String(r.tenant?.first_name || '') + ' ' + String(r.tenant?.last_name || '')}`.trim() || 'No Tenant',
      image: r.projects?.project_image 
        ? (r.projects.project_image.startsWith('http') ? r.projects.project_image : `/uploads/${r.projects.project_image}`)
        : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=50&h=50&fit=crop',
      date: r.lease_start ? new Date(r.lease_start).toLocaleDateString('en-GB') : 'N/A',
      type: r.lease_type,
      status: r.status,
      project_name: r.projects?.project_name,
      tenant_name: r.tenant?.company_name || `${r.tenant?.first_name || ''} ${r.tenant?.last_name || ''}`.trim()
    }));

    if (search) {
      const s = search.toLowerCase();
      formatted = formatted.filter(f => 
        (f.project_name && f.project_name.toLowerCase().includes(s)) ||
        (f.tenant_name && f.tenant_name.toLowerCase().includes(s))
      );
    }

    const startIdx = (parseInt(page) - 1) * parseInt(limit);
    const paginated = formatted.slice(startIdx, startIdx + parseInt(limit));

    res.json({
      data: paginated,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: formatted.length,
        totalPages: Math.ceil(formatted.length / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get reports error:", error);
    res.json({ data: [], pagination: {} });
  }
};

/* ================= GET MANAGEMENT REP DASHBOARD STATS ================= */
exports.getRepDashboardStats = async (req, res) => {
  try {
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? "+" : ""}${Math.round(change)}%`;
    };

    const getChangeType = (current, previous) => {
      if (current > previous) return "positive";
      if (current < previous) return "negative";
      return "neutral";
    };

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const prevDateStr = oneMonthAgo.toISOString();

    const todayStr = new Date().toISOString().split('T')[0];
    const d60 = new Date(new Date().getTime() + 60 * 86400000).toISOString().split('T')[0];
    const d90 = new Date(new Date().getTime() + 90 * 86400000).toISOString().split('T')[0];

    const [
      { count: projectsCurrent }, { count: projectsPrev },
      { count: unitsCurrent }, { count: unitsPrev },
      { count: ownersCurrent }, { count: ownersPrev },
      { count: tenantsCurrent }, { count: tenantsPrev },
      { count: leasesCurrent }, { count: leasesPrev },
      { data: activeLeasesData },
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }).lt('created_at', prevDateStr),
      
      supabase.from('units').select('*', { count: 'exact', head: true }),
      supabase.from('units').select('*', { count: 'exact', head: true }).lt('created_at', prevDateStr),
      
      supabase.from('owners').select('*', { count: 'exact', head: true }),
      supabase.from('owners').select('*', { count: 'exact', head: true }).lt('created_at', prevDateStr),
      
      supabase.from('tenants').select('*', { count: 'exact', head: true }),
      supabase.from('tenants').select('*', { count: 'exact', head: true }).lt('created_at', prevDateStr),
      
      supabase.from('leases').select('*', { count: 'exact', head: true }),
      supabase.from('leases').select('*', { count: 'exact', head: true }).lt('created_at', prevDateStr),
      
      supabase.from('leases').select(`
        id, lease_end, monthly_rent, status, created_at,
        units(unit_number),
        tenant:parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)
      `).eq('status', 'active')
    ]);

    const totalRevenue = activeLeasesData.reduce((sum, l) => sum + (Number(l.monthly_rent) || 0), 0);
    const prevRevenue = activeLeasesData.filter(l => new Date(l.created_at) < oneMonthAgo)
                                       .reduce((sum, l) => sum + (Number(l.monthly_rent) || 0), 0);

    let renewals = [];
    let expiries = [];

    const todayTime = new Date(todayStr).getTime();
    const d60Time = new Date(d60).getTime();
    const d90Time = new Date(d90).getTime();

    activeLeasesData.forEach(l => {
        if (!l.lease_end) return;
        const endTime = new Date(l.lease_end).getTime();
        if (endTime >= todayTime && endTime <= d90Time) {
            const daysRemaining = Math.ceil((endTime - todayTime) / 86400000);
            const tenantFormat = l.tenant?.company_name || `${l.tenant?.first_name || ''} ${l.tenant?.last_name || ''}`.trim();
            const item = {
                id: l.id,
                leaseId: l.id,
                unit: `Unit ${l.units?.unit_number || 'N/A'}`,
                tenant: tenantFormat,
                date: l.lease_end,
                daysRemaining
            };
            renewals.push(item);
            if (endTime <= d60Time) expiries.push(item);
        }
    });

    renewals.sort((a,b) => a.daysRemaining - b.daysRemaining).splice(3);
    expiries.sort((a,b) => a.daysRemaining - b.daysRemaining).splice(3);

    const { data: escData } = await supabase.from('lease_escalations').select(`
        effective_from, increase_type, value, leases(units(unit_number))
    `).gte('effective_from', todayStr).lte('effective_from', d90).order('effective_from').limit(3);

    const mappedEscData = (escData || []).map(e => ({
        effective_from: e.effective_from,
        increase_type: e.increase_type,
        value: e.value,
        unit_number: `Unit ${e.leases?.units?.unit_number || 'N/A'}`
    }));

    const stats = {
        totalProjects: projectsCurrent || 0,
        prevProjects: projectsPrev || 0,
        totalUnits: unitsCurrent || 0,
        prevUnits: unitsPrev || 0,
        totalOwners: ownersCurrent || 0,
        prevOwners: ownersPrev || 0,
        totalTenants: tenantsCurrent || 0,
        prevTenants: tenantsPrev || 0,
        totalLeases: leasesCurrent || 0,
        prevLeases: leasesPrev || 0
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const revenueTrends = [];
    for (let i = 0; i < 12; i++) {
        const monthIndex = (currentMonth + i + 1) % 12;
        revenueTrends.push({ month: months[monthIndex], revenue: Math.round(totalRevenue * (0.8 + Math.random() * 0.4)) });
    }

    res.json({
      metrics: {
        totalProjects: { value: stats.totalProjects, change: `${calculateChange(stats.totalProjects, stats.prevProjects)} vs last month`, type: getChangeType(stats.totalProjects, stats.prevProjects) },
        totalUnits: { value: stats.totalUnits, change: `${calculateChange(stats.totalUnits, stats.prevUnits)} vs last month`, type: getChangeType(stats.totalUnits, stats.prevUnits) },
        totalOwners: { value: stats.totalOwners, change: `${calculateChange(stats.totalOwners, stats.prevOwners)} vs last month`, type: "neutral" },
        totalTenants: { value: stats.totalTenants, change: `${calculateChange(stats.totalTenants, stats.prevTenants)} vs last month`, type: getChangeType(stats.totalTenants, stats.prevTenants) },
        totalLeases: { value: stats.totalLeases, change: `${calculateChange(stats.totalLeases, stats.prevLeases)} vs last month`, type: getChangeType(stats.totalLeases, stats.prevLeases) },
        totalRevenue: { value: totalRevenue > 0 ? `₹${(totalRevenue / 1000000).toFixed(1)}M` : "₹0.0M", change: `${calculateChange(totalRevenue, prevRevenue)} YTD`, type: getChangeType(totalRevenue, prevRevenue) }
      },
      upcomingRenewals: renewals.map(r => ({ ...r, badge: `${r.daysRemaining} Days`, badgeType: r.daysRemaining < 30 ? 'warning' : 'success' })),
      upcomingExpiries: expiries.map(e => ({ ...e, badge: e.daysRemaining < 30 ? 'HIGH RISK' : e.daysRemaining < 60 ? 'MEDIUM' : 'LOW', badgeType: e.daysRemaining < 30 ? 'danger' : e.daysRemaining < 60 ? 'warning' : 'success' })),
      rentEscalations: mappedEscData,
      revenueTrends,
      areaStats: { occupied: { area: 245000, avgRentPerSqft: 57.20 }, vacant: { area: 42000, avgRentPerSqft: 53.82 } }
    });

  } catch (error) {
    console.error("Rep dashboard stats error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET NOTIFICATIONS ================= */
exports.getRepNotifications = async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;

    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });

    if (type && type !== 'All') {
      query = query.eq('type', type.toLowerCase().replace(' ', '_'));
    }

    const { data: notifications, error } = await query;
    if(error) throw error;

    const startIdx = (parseInt(page) - 1) * parseInt(limit);
    const paginated = notifications.slice(startIdx, startIdx + parseInt(limit));

    res.json({
      data: paginated.map(notif => {
        let category = 'All';
        if(notif.type === 'lease_alert') category = 'Lease alerts';
        if(notif.type === 'escalation') category = 'Escalations';
        if(notif.type === 'expiry') category = 'Expiries';
        if(notif.type === 'system') category = 'System alerts';

        return {
          id: notif.id,
          text: notif.message || 'Manage your alerts and updates for lease operations.',
          read: notif.is_read === true,
          type: notif.type,
          category,
          createdAt: notif.created_at
        };
      }),
      pagination: {
        page: parseInt(page), limit: parseInt(limit), total: notifications.length, totalPages: Math.ceil(notifications.length / parseInt(limit))
      }
    });

  } catch (error) {
    res.json({ data: [], pagination: {} });
  }
};

/* ================= GET DOCUMENTS ================= */
exports.getDocuments = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    
    let query = supabase.from('documents').select(`
        *, projects(project_name, project_image), users(first_name, last_name)
    `).order('created_at', { ascending: false });

    if (category) query = query.eq('document_type', category);

    const { data: documents, error } = await query;
    if(error) throw error;

    const startIdx = (parseInt(page) - 1) * parseInt(limit);
    const paginated = documents.slice(startIdx, startIdx + parseInt(limit));

    res.json({
      data: paginated.map(doc => ({
        id: `D-${doc.id}`,
        projectName: (doc.entity_type === 'project') ? (doc.projects?.project_name || 'N/A') : 'N/A',
        image: doc.file_path 
          ? (doc.file_path.startsWith('http') ? doc.file_path : `/uploads/${doc.file_path}`)
          : (doc.projects?.project_image 
              ? (doc.projects.project_image.startsWith('http') ? doc.projects.project_image : `/uploads/${doc.projects.project_image}`)
              : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=50&h=50&fit=crop'),
        date: doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US') : 'N/A',
        uploadedBy: (doc.users?.first_name ? `${doc.users.first_name} ${doc.users.last_name || ''}`.trim() : 'Unknown User'),
        category: doc.document_type || 'General'
      })),
      pagination: {
        page: parseInt(page), limit: parseInt(limit), total: documents.length, totalPages: Math.ceil(documents.length / parseInt(limit))
      }
    });

  } catch (error) {
    res.json({ data: [], pagination: {} });
  }
};

/* ================= GLOBAL SEARCH ================= */
exports.searchData = async (req, res) => {
  try {
    const { project_name, owner_name, tenant_name, unit_number, status } = req.query;

    const [ { data: pRows }, { data: oRows }, { data: tRows }, { data: uRows } ] = await Promise.all([
        supabase.from('projects').select('id, project_name, status')
           .ilike('project_name', project_name ? `%${project_name}%` : '%')
           .ilike('status', status ? `%${status}%` : '%'),
        supabase.from('parties').select('id, first_name, last_name, company_name').eq('is_owner', true)
           .or(owner_name ? `first_name.ilike.%${owner_name}%,last_name.ilike.%${owner_name}%,company_name.ilike.%${owner_name}%` : `id.gt.0`),
        supabase.from('parties').select('id, first_name, last_name, company_name').eq('is_tenant', true)
           .or(tenant_name ? `first_name.ilike.%${tenant_name}%,last_name.ilike.%${tenant_name}%,company_name.ilike.%${tenant_name}%` : `id.gt.0`),
        supabase.from('units').select('id, unit_number, status')
           .ilike('unit_number', unit_number ? `%${unit_number}%` : '%')
    ]);

    const results = [];
    (pRows||[]).forEach(r => results.push({ id: r.id, name: r.project_name, category: 'Project', status: r.status, project_name: r.project_name, id_label: `#P-${r.id}` }));
    (oRows||[]).forEach(r => results.push({ id: r.id, name: r.company_name || `${r.first_name} ${r.last_name}`.trim(), category: 'Owner', status: 'Active', project_name: 'N/A', id_label: `#O-${r.id}` }));
    (tRows||[]).forEach(r => results.push({ id: r.id, name: r.company_name || `${r.first_name} ${r.last_name}`.trim(), category: 'Tenant', status: 'Active', project_name: 'N/A', id_label: `#T-${r.id}` }));
    (uRows||[]).forEach(r => results.push({ id: r.id, name: r.unit_number, category: 'Unit', status: r.status, project_name: 'N/A', id_label: `#U-${r.id}` }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
};

/* ================= UPLOAD DOCUMENT (SUPABASE) ================= */
exports.uploadDocument = async (req, res) => {
  try {
    const { project_id, category, uploaded_by } = req.body;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileExt = path.extname(req.file.originalname).slice(1) || 'pdf';
    const fileName = `documents/doc_${Date.now()}.${fileExt}`;

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('lms-storage')
        .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
        });

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: publicUrlData } = supabase.storage
        .from('lms-storage')
        .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // 3. Save to Database
    const { data, error } = await supabase.from('documents').insert({
        entity_type: 'project', 
        entity_id: project_id || null, 
        document_type: category || 'General', 
        file_path: publicUrl, 
        uploaded_by: uploaded_by || null
    }).select('id').single();

    if (error) throw error;
    res.json({ message: "Document uploaded successfully", id: data.id, url: publicUrl });
  } catch (error) {
    console.error("Document Upload failed:", error);
    res.status(500).json({ error: "Failed to upload document: " + error.message });
  }
};
