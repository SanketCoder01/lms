const supabase = require("../config/db");

/* ================= GET LOGS ================= */
const getActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { module, location, search, startDate, endDate } = req.query;

    let query = supabase.from('activity_logs').select(`
        id, action, module, details, created_at, ip_address, user_id,
        users!left(first_name, last_name, profile_image, location, roles(role_name))
    `, { count: 'exact' });

    if (module && module !== 'All Modules') query = query.eq('module', module);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    // Supabase can't natively ilike deeply nested foreign tables purely through the main table in a simple way while keeping outer join,
    // unless using inner join (`!inner`). Let's fetch and filter in JS if search/location are present to avoid dropping rows.
    
    // We will do a full fetch if there's text search because filtering outer joined nested tables in PostgREST is difficult.
    // If no search/location, use pagination natively.
    if (!search && (!location || location === 'All Locations')) {
        query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });
        const { data, count, error } = await query;
        if (error) throw error;
        
        const formatted = data.map(l => ({
            id: l.id, action: l.action, module: l.module, details: l.details, 
            created_at: l.created_at, ip_address: l.ip_address,
            first_name: l.users?.first_name, last_name: l.users?.last_name, profile_image: l.users?.profile_image,
            location: l.users?.location, role_name: l.users?.roles?.role_name
        }));
        
        return res.json({ logs: formatted, total: count || 0, page, limit });
    }

    // Manual JS filtering fallback for complex relational text search
    const { data: allData, error: allErr } = await query.order('created_at', { ascending: false });
    if(allErr) throw allErr;

    let filtered = allData.map(l => ({
        id: l.id, action: l.action, module: l.module, details: l.details, created_at: l.created_at, ip_address: l.ip_address,
        first_name: l.users?.first_name, last_name: l.users?.last_name, profile_image: l.users?.profile_image,
        location: l.users?.location, role_name: l.users?.roles?.role_name
    }));

    if (location && location !== 'All Locations') {
        filtered = filtered.filter(f => f.location === location);
    }
    
    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(f => 
            (f.action && f.action.toLowerCase().includes(s)) ||
            (f.details && f.details.toLowerCase().includes(s)) ||
            (f.first_name && f.first_name.toLowerCase().includes(s)) ||
            (f.last_name && f.last_name.toLowerCase().includes(s))
        );
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    res.json({ logs: paginated, total, page, limit });

  } catch (error) {
    console.error("Get logs error:", error);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};

/* ================= EXPORT LOGS ================= */
const exportActivityLogs = async (req, res) => {
  try {
    const { module, location, search, startDate, endDate } = req.query;

    let query = supabase.from('activity_logs').select(`
        id, action, module, details, created_at,
        users!left(first_name, last_name, location, roles(role_name))
    `).order('created_at', { ascending: false });

    if (module && module !== 'All Modules') query = query.eq('module', module);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error } = await query;
    if(error) throw error;

    let filtered = data.map(l => ({
        id: l.id, action: l.action, module: l.module, details: l.details, created_at: l.created_at,
        first_name: l.users?.first_name, last_name: l.users?.last_name,
        user_name: `${l.users?.first_name || ''} ${l.users?.last_name || ''}`.trim(),
        location: l.users?.location, role_name: l.users?.roles?.role_name
    }));

    if (location && location !== 'All Locations') {
        filtered = filtered.filter(f => f.location === location);
    }
    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(f => 
            (f.action && f.action.toLowerCase().includes(s)) ||
            (f.details && f.details.toLowerCase().includes(s)) ||
            (f.first_name && f.first_name.toLowerCase().includes(s)) ||
            (f.last_name && f.last_name.toLowerCase().includes(s))
        );
    }

    const csvHeaders = "ID,Date,User,Role,Action,Module,Details\n";
    const csvRows = filtered.map(row => {
      const date = new Date(row.created_at).toLocaleString().replace(/,/g, '');
      const details = row.details ? row.details.replace(/[\r\n,]/g, ' ') : '';
      const action = row.action ? row.action.replace(/,/g, ' ') : '';
      return `${row.id},"${date}","${row.user_name || 'System'}","${row.role_name || 'N/A'}","${action}","${row.module}","${details}"`;
    }).join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment("activity_logs.csv");
    res.send(csvHeaders + csvRows);

  } catch (error) {
    console.error("Export logs error:", error);
    res.status(500).json({ message: "Failed to export logs" });
  }
};

module.exports = { getActivityLogs, exportActivityLogs };
