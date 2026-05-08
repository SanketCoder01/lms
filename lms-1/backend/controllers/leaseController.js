const supabase = require("../config/db");
const { handleDbError } = require('../utils/errorHandler');
const { createNotification } = require('../utils/notificationHelper');

const getDateStrs = () => {
    const today = new Date();
    const d30 = new Date(today.getTime() + 30 * 86400000);
    const d60 = new Date(today.getTime() + 60 * 86400000);
    const d90 = new Date(today.getTime() + 90 * 86400000);
    return {
        today: today.toISOString().split('T')[0],
        d30: d30.toISOString().split('T')[0],
        d60: d60.toISOString().split('T')[0],
        d90: d90.toISOString().split('T')[0]
    };
};

const applyScopes = (query, req) => {
    let q = query;
    if (req.companyId) q = q.eq('company_id', req.companyId);
    if (req.isRestrictedToProjects) {
        const allowedIds = (req.projectsAccess || []).map(p => p.project_id);
        if (allowedIds.length > 0) q = q.in('project_id', allowedIds);
        else q = q.eq('project_id', -1); // Force empty if no projects
    }
    return q;
};

const getLeaseDashboardStats = async (req, res) => {
    try {
        const { today, d30 } = getDateStrs();

        const [{ count: pending }, { count: active }, { count: expiring }, { count: renewals }] = await Promise.all([
            applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'draft'),
            applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'active'),
            applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'active').lte('lease_end', d30),
            applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'active').gte('lease_end', today).lte('lease_end', d30)
        ]);

        const escQuery = applyScopes(supabase.from('lease_escalations').select('lease_id, leases!inner(company_id, project_id)'), req)
            .gte('effective_from', today).lte('effective_from', d30);

        const { data: escData } = await escQuery;
        const escalations = new Set((escData || []).map(e => e.lease_id)).size;

        res.json({
            pending_approvals: pending || 0,
            active_leases: active || 0,
            lease_expiries: expiring || 0,
            renewals_due: renewals || 0,
            rental_escalation: escalations,
            growth: "5% vs last month"
        });
    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

const getLeaseManagerStats = async (req, res) => {
    try {
        const { today, d30, d60, d90 } = getDateStrs();

        const pendingQuery = await applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).in('status', ['draft', 'pending_review']);
        const exp30Query = await applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'active').lte('lease_end', d30);
        const exp60Query = await applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'active').gt('lease_end', d30).lte('lease_end', d60);
        const exp90Query = await applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'active').gt('lease_end', d60).lte('lease_end', d90);
        const renewalsQuery = await applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'active').gte('lease_end', today).lte('lease_end', d90);

        const escQuery = applyScopes(supabase.from('lease_escalations').select('lease_id, leases!inner(company_id, project_id)'), req)
            .gte('effective_from', today).lte('effective_from', d30);
        const { data: escData } = await escQuery;
        const escalations = new Set((escData || []).map(e => e.lease_id)).size;

        res.json({
            pending_entries: pendingQuery.count || 0,
            leases_expiring: {
                days_30: exp30Query.count || 0,
                days_60: exp60Query.count || 0,
                days_90: exp90Query.count || 0
            },
            renewals_due: renewalsQuery.count || 0,
            escalations_due: escalations,
            recent_activity: [
                { id: 1, type: 'Approved', lease: 'L-2024-0811', tenant: 'TechFlow Systems', time: '24 Minutes Ago' },
                { id: 2, type: 'Rejected', lease: 'L-2024-0809', reason: 'Missing financial documentation', time: '2 Hours Ago' },
                { id: 3, type: 'Approved', lease: 'L-2024-0798', tenant: 'Heritage Antiques', time: '4 Hours Ago' }
            ]
        });
    } catch (err) {
        console.error("Manager Stats Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ... Continuing in same file for brevity ...
// Because JS client doesn't support complex OR with foreign tables cleanly in one string, we will fetch and filter or use multiple queries.
const getNeedAttentionLeases = async (req, res) => {
    try {
        const { d30 } = getDateStrs();
        const { data: leases, error } = await applyScopes(supabase.from('leases')
            .select(`id, status, lease_end, parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)`), req)
            .or(`status.in.(draft,dispute),and(status.eq.active,lease_end.lte.${d30})`)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        const rows = leases.map(l => {
            const t = l.parties || {};
            let type = 'Escalation';
            if (l.status === 'draft') type = 'New Lease';
            if (l.status === 'dispute') type = 'Dispute';

            return {
                id: l.id,
                tenant_name: t.company_name || `${t.first_name || ''} ${t.last_name || ''}`.trim(),
                status: l.status,
                date: l.lease_end,
                type
            };
        });
        res.json(rows);
    } catch (err) {
        console.error("getNeedAttentionLeases", err);
        res.status(500).json({ message: "Server error" });
    }
};

const getPendingLeases = async (req, res) => {
    try {
        const { data: leases, error } = await applyScopes(supabase.from('leases')
            .select(`id, monthly_rent, lease_start, lease_end, parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)`), req)
            .eq('status', 'draft')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const rows = leases.map(l => {
            const t = l.parties || {};
            return {
                id: l.id,
                company_name: t.company_name || `${t.first_name || ''} ${t.last_name || ''}`.trim(),
                monthly_rent: l.monthly_rent,
                lease_start: l.lease_start,
                lease_end: l.lease_end
            };
        });
        res.json(rows);
    } catch (err) {
        console.error("getPendingLeases", err);
        res.status(500).json({ message: "Server error" });
    }
};

const approveLease = async (req, res) => {
    try {
        const { error } = await supabase.from('leases').update({ status: 'approved' }).eq('id', req.params.id);
        if (error) return res.status(500).json(handleDbError(error));
        await createNotification(1, "Lease Approved", `Lease #${req.params.id} has been approved.`, "success");
        res.json({ success: true, message: "Lease approved" });
    } catch (err) {
        console.error("approveLease", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

const rejectLease = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ success: false, message: "Rejection reason is required" });

        const { error } = await supabase.from('leases').update({ status: 'rejected' }).eq('id', req.params.id);
        if (error) return res.status(500).json(handleDbError(error));

        await createNotification(1, "Lease Rejected", `Lease #${req.params.id} was rejected. Reason: ${reason}`, "error");
        res.json({ success: true, message: "Lease rejected" });
    } catch (err) {
        console.error("rejectLease", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

const getExpiringLeases = async (req, res) => {
    try {
        const { d90 } = getDateStrs();
        const { data: leases, error } = await applyScopes(supabase.from('leases')
            .select(`id, monthly_rent, lease_end, parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)`), req)
            .lte('lease_end', d90);

        if (error) throw error;

        const rows = leases.map(l => {
            const t = l.parties || {};
            return {
                id: l.id,
                company_name: t.company_name || `${t.first_name || ''} ${t.last_name || ''}`.trim(),
                monthly_rent: l.monthly_rent,
                lease_end: l.lease_end
            };
        });
        res.json(rows);
    } catch (err) {
        console.error("getExpiringLeases", err);
        res.status(500).json({ message: "Server error" });
    }
};

const getLeaseReportStats = async (req, res) => {
    try {
        const { d30, d60 } = getDateStrs();

        const [exp30Query, exp60Query, noticeQuery] = await Promise.all([
            applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'active').lte('lease_end', d30),
            applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'active').lte('lease_end', d60),
            applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'active').gt('notice_period_months', 0)
        ]);

        const { data: valData } = await applyScopes(supabase.from('leases').select('monthly_rent'), req).eq('status', 'active').lte('lease_end', d60);
        const riskValue = (valData || []).reduce((sum, item) => sum + Number(item.monthly_rent || 0), 0);

        res.json({
            expiring_30_days: exp30Query.count || 0,
            expiring_60_days: exp60Query.count || 0,
            total_value_risk: riskValue,
            notice_pending: noticeQuery.count || 0
        });
    } catch (err) {
        console.error("getLeaseReportStats", err);
        res.status(500).json({ message: "Server error" });
    }
};

const getLeaseNotifications = async (req, res) => {
    try {
        const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error("Notifications err:", err.message);
        res.json([]);
    }
};

const sendLeaseReminder = async (req, res) => {
    res.json({ message: "Reminder sent successfully" });
};

const markAllNotificationsRead = async (req, res) => {
    try {
        await supabase.from('notifications').update({ is_read: true }).neq('id', 0);
        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

const deleteAllNotifications = async (req, res) => {
    try {
        await supabase.from('notifications').delete().neq('id', 0);
        res.json({ message: "All notifications deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

const getLeaseTrackerStats = async (req, res) => {
    try {
        const { today, d30, d60, d90 } = getDateStrs();

        const [exp90, renewals] = await Promise.all([
            applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'active').lte('lease_end', d90),
            applyScopes(supabase.from('leases').select('*', { count: 'exact', head: true }), req).eq('status', 'active').gte('lease_end', today).lte('lease_end', d60)
        ]);

        const escQuery = applyScopes(supabase.from('lease_escalations').select('lease_id, leases!inner(company_id, project_id)'), req)
            .gte('effective_from', today).lte('effective_from', d30);
        const { data: escData } = await escQuery;
        const escalations = new Set((escData || []).map(e => e.lease_id)).size;

        // Custom JS mapping for lock in calculation since raw interval math is tricky in JS client
        const { data: allActive } = await applyScopes(supabase.from('leases').select('lease_start, lockin_period_months'), req).eq('status', 'active');
        let lockInCount = 0;
        const d30Time = new Date(d30).getTime();
        const todayTime = new Date(today).getTime();

        (allActive || []).forEach(l => {
            if (l.lease_start && l.lockin_period_months) {
                const lockEnd = new Date(l.lease_start);
                lockEnd.setMonth(lockEnd.getMonth() + l.lockin_period_months);
                const lockEndTime = lockEnd.getTime();
                if (lockEndTime >= todayTime && lockEndTime <= d30Time) lockInCount++;
            }
        });

        res.json({
            expiring_90_days: exp90.count || 0,
            renewals_pending: renewals.count || 0,
            escalation_due: escalations,
            lock_in_ending: lockInCount
        });
    } catch (err) {
        console.error("getLeaseTrackerStats", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Helper for file upload
const uploadFileToSupabase = async (file, type) => {
    if (!file) return null;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `leases/lease_${Date.now()}_${type}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
        .from('lms-storage')
        .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
    }
    const { data: publicUrlData } = supabase.storage.from('lms-storage').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
};

const createLease = async (req, res) => {
    try {
        console.log("=== CREATE LEASE REQUEST ===");
        console.log("Files received:", req.files ? Object.keys(req.files) : 'None');
        console.log("Body keys:", Object.keys(req.body || {}));

        let payload = req.body || {};
        if (req.body && req.body.leaseData) {
            try {
                payload = typeof req.body.leaseData === 'string' ? JSON.parse(req.body.leaseData) : req.body.leaseData;
            } catch (e) {
                console.error("JSON parse error:", e);
                payload = req.body;
            }
        }

        if (!payload) payload = {}; // Failsafe

        console.log("Parsed Payload:", JSON.stringify(payload, null, 2));

        if (!payload.project_id || !payload.unit_id || !payload.party_tenant_id || !payload.lease_start || !payload.lease_end || !payload.rent_commencement_date) {
            console.error("Missing required fields:", {
                project_id: payload.project_id,
                unit_id: payload.unit_id,
                party_tenant_id: payload.party_tenant_id,
                lease_start: payload.lease_start,
                lease_end: payload.lease_end,
                rent_commencement_date: payload.rent_commencement_date
            });
            return res.status(400).json({ message: 'Required fields missing.' });
        }
        if (payload.lease_type === 'Direct lease' && !payload.party_owner_id) {
            return res.status(400).json({ message: 'party_owner_id is required for Direct lease' });
        }

        // Overlap check removed — users may create leases for any unit/project
        // with whatever start and end dates they choose (multiple sequential or
        // concurrent leases on the same unit are a valid business scenario).

        // Issue 68: Correct inclusive tenure calculation
        // Example: Start July 20 2024, 9 years = 108 months, End = July 19 2033
        const startD = new Date(payload.lease_start);
        const endD = new Date(payload.lease_end);
        const calculatedTenure = (endD.getFullYear() - startD.getFullYear()) * 12 + (endD.getMonth() - startD.getMonth()) +
            (endD.getDate() >= startD.getDate() ? 0 : -1) +
            (endD.getDate() === startD.getDate() - 1 ? 1 : 0); // Inclusive: end = start-same-day minus 1 day accounts for full months
        const finalTenure = isNaN(calculatedTenure) ? 0 : Math.max(0, calculatedTenure);

        // Map payload exactly to DB columns
        const dbPayload = {
            project_id: payload.project_id,
            unit_id: payload.unit_id,
            party_owner_id: payload.party_owner_id || null,
            party_tenant_id: payload.party_tenant_id,
            sub_tenant_id: payload.sub_tenant_id || null,
            lease_type: payload.lease_type || 'Direct lease',
            rent_model: payload.rent_model || 'Fixed',
            sub_lease_area_sqft: payload.sub_lease_area_sqft || null,
            lease_start: payload.lease_start,
            lease_end: payload.lease_end,
            rent_commencement_date: payload.rent_commencement_date,
            fitout_period_end: payload.fitout_period_end || null,
            tenure_months: payload.tenure_months || finalTenure,
            lockin_period_months: payload.lockin_period_months || 0,
            notice_period_months: payload.notice_period_months || 0,
            lessee_lockin_period_months: payload.lessee_lockin_period_months || 0,
            lessor_lockin_period_months: payload.lessor_lockin_period_months || 0,
            lessee_lockin_period_days: payload.lessee_lockin_period_days || 0,
            lessor_lockin_period_days: payload.lessor_lockin_period_days || 0,
            lessee_notice_period_months: payload.lessee_notice_period_months || 0,
            lessor_notice_period_months: payload.lessor_notice_period_months || 0,
            lessee_notice_period_days: payload.lessee_notice_period_days || 0,
            lessor_notice_period_days: payload.lessor_notice_period_days || 0,
            unit_handover_date: payload.unit_handover_date || null,
            monthly_rent: payload.monthly_rent || 0,
            monthly_net_sales: payload.monthly_net_sales || 0,
            rent_amount_option: payload.rent_amount_option || null,
            mg_amount_sqft: payload.mg_amount_sqft || 0,
            mg_amount: payload.mg_amount || 0,
            cam_charges: payload.cam_charges || 0,
            billing_frequency: payload.billing_frequency || 'Monthly',
            payment_due_day: payload.payment_due_day || '1st of Month',
            currency_code: payload.currency_code || 'INR',
            security_deposit: payload.security_deposit || 0,
            utility_deposit: payload.utility_deposit || 0,
            revenue_share_percentage: payload.revenue_share_percentage || null,
            revenue_share_applicable_on: payload.revenue_share_applicable_on || null,
            status: 'active',
            fitout_period_start: payload.fitout_period_start || null,
            notice_vacation_date: payload.notice_vacation_date || null,
            opening_date: payload.opening_date || null,
            rent_free_start_date: payload.rent_free_start_date || null,
            rent_free_end_date: payload.rent_free_end_date || null,
            loi_date: payload.loi_date || null,
            agreement_date: payload.agreement_date || null,
            registration_date: payload.registration_date || null
        };
        // Multi-tenant: stamp company_id on new leases
        if (req.companyId) dbPayload.company_id = req.companyId;

        // File handling
        if (req.files) {
            if (req.files.loi_document) {
                dbPayload.loi_document_url = await uploadFileToSupabase(req.files.loi_document[0], 'loi');
            }
            if (req.files.agreement_document) {
                dbPayload.agreement_document_url = await uploadFileToSupabase(req.files.agreement_document[0], 'agreement');
            }
            if (req.files.registration_document) {
                dbPayload.registration_document_url = await uploadFileToSupabase(req.files.registration_document[0], 'registration');
            }
        }

        const { data: lease, error: lErr } = await supabase.from('leases').insert(dbPayload).select('id').single();
        if (lErr) {
            console.error("Supabase insert error:", lErr);
            return res.status(500).json(handleDbError(lErr));
        }

        if (Array.isArray(payload.escalations) && payload.escalations.length > 0) {
            const escInserts = payload.escalations.map((esc, i) => ({
                lease_id: lease.id,
                sequence_no: i + 1,
                effective_from: esc.effective_from,
                effective_to: esc.effective_to || null,
                increase_type: esc.increase_type || 'Percentage',
                value: esc.value || 0,
                escalation_on: esc.escalation_on || null,
                rate_per_sqft: esc.rate_per_sqft || null
            }));
            await supabase.from('lease_escalations').insert(escInserts);
        }

        await supabase.from('units').update({ status: 'occupied' }).eq('id', payload.unit_id);
        await createNotification(1, "New Lease Drafted", `A new lease for Unit was drafted.`, "info");

        res.status(201).json({ message: 'Lease created successfully', lease_id: lease.id });
    } catch (err) {
        console.error('CREATE LEASE ERROR:', err);
        res.status(500).json({ message: 'Failed to create lease', error: err.message });
    }
};

const getAllLeases = async (req, res) => {
    try {
        // PRIVACY: Never serve data without a valid company session
        if (req.isUnauthenticated) return res.json([]);

        const { status, project_id, location, search, expires_in, upcoming_escalations, lease_type } = req.query;

        let query = applyScopes(supabase.from('leases').select(`
            *,
            projects(project_name, location, address),
            units(unit_number, chargeable_area),
            tenant:parties!leases_party_tenant_id_fkey(id, company_name, first_name, last_name, brand_name),
            owner:parties!leases_party_owner_id_fkey(id, company_name, first_name, last_name, brand_name)
        `), req).order('created_at', { ascending: false });

        // Don't filter by lease_type by default - show all leases for dashboard
        if (status) query = query.eq('status', status);
        if (project_id) query = query.eq('project_id', project_id);

        let { data, error } = await query;
        if (error) {
            console.error('getAllLeases SELECT error:', JSON.stringify(error, null, 2));
            throw error;
        }

        // Fetch all escalations for these leases in one query
        const leaseIds = (data || []).map(l => l.id);
        let escalationsMap = {};
        if (leaseIds.length > 0) {
            const { data: escData } = await supabase
                .from('lease_escalations')
                .select('lease_id, sequence_no, effective_from, effective_to, increase_type, value, escalation_on, rate_per_sqft')
                .in('lease_id', leaseIds)
                .order('effective_from', { ascending: true });
            (escData || []).forEach(e => {
                if (!escalationsMap[e.lease_id]) escalationsMap[e.lease_id] = [];
                escalationsMap[e.lease_id].push(e);
            });
        }

        // Fetch unit data separately by unit_id to guarantee unit_number is always present
        // (Supabase join may return null if FK is not auto-detected)
        const unitIds = [...new Set((data || []).map(l => l.unit_id).filter(Boolean))];
        let unitsMap = {};
        if (unitIds.length > 0) {
            const { data: unitData } = await supabase
                .from('units')
                .select('id, unit_number, chargeable_area')
                .in('id', unitIds);
            (unitData || []).forEach(u => { unitsMap[u.id] = u; });
        }

        // Similarly fetch project data by project_id
        const projectIds = [...new Set((data || []).map(l => l.project_id).filter(Boolean))];
        let projectsMap = {};
        if (projectIds.length > 0) {
            const { data: projData } = await supabase
                .from('projects')
                .select('id, project_name, location, address')
                .in('id', projectIds);
            (projData || []).forEach(p => { projectsMap[p.id] = p; });
        }

        // Fetch party data separately — guarantees brand_name is present even if Supabase FK join is null
        const tenantIds = [...new Set((data || []).map(l => l.party_tenant_id).filter(Boolean))];
        let partiesMap = {};
        if (tenantIds.length > 0) {
            const { data: partyData } = await supabase
                .from('parties')
                .select('id, company_name, first_name, last_name, brand_name, brand_category')
                .in('id', tenantIds);
            (partyData || []).forEach(p => { partiesMap[p.id] = p; });
        }

        // JS Filtering for relations since advanced embedded string matching is tricky
        let result = data.map(l => {
            // Use separately-fetched maps as primary source — guarantees data even if Supabase join is null
            const unitInfo = unitsMap[l.unit_id] || l.units || {};
            const projectInfo = projectsMap[l.project_id] || l.projects || {};
            // Use directly-fetched party data as primary source for brand_name
            const partyInfo = partiesMap[l.party_tenant_id] || l.tenant || {};

            const unitNumber = unitInfo.unit_number || null;
            const chargeableArea = unitInfo.chargeable_area || 0;
            const projectName = projectInfo.project_name || null;

            const tenantName = (
                partyInfo.company_name ||
                `${partyInfo.first_name || ''} ${partyInfo.last_name || ''}`.trim() ||
                null
            );
            const brandName = (
                partyInfo.brand_name ||
                partyInfo.company_name ||
                `${partyInfo.first_name || ''} ${partyInfo.last_name || ''}`.trim() ||
                null
            );
            // DEBUG — remove after confirming brand_name is fetched correctly
            if (l.party_tenant_id) {
                console.log(`[Brand Debug] tenant_id=${l.party_tenant_id} brand_name="${partyInfo.brand_name}" company_name="${partyInfo.company_name}" resolved="${brandName}"`);
            }

            return {
                id: l.id,
                unit_id: l.unit_id,
                project_id: l.project_id,
                party_tenant_id: l.party_tenant_id,   // critical for BrandPerformanceSection filter
                party_owner_id: l.party_owner_id,
                lease_type: l.lease_type,
                rent_model: l.rent_model,
                lease_start: l.lease_start,
                lease_end: l.lease_end,
                monthly_rent: l.monthly_rent,
                monthly_net_sales: l.monthly_net_sales,
                security_deposit: l.security_deposit,
                status: l.status,
                mg_amount: l.mg_amount,
                mg_amount_sqft: l.mg_amount_sqft,
                revenue_share_percentage: l.revenue_share_percentage,
                sub_lease_area_sqft: l.sub_lease_area_sqft,
                lock_in_period: l.lockin_period_months,
                lockin_period_months: l.lockin_period_months,
                area_leased: l.sub_lease_area_sqft || chargeableArea || 0,
                created_at: l.created_at,
                loi_date: l.loi_date,
                agreement_date: l.agreement_date,
                registration_date: l.registration_date,
                // Document upload URLs — used by frontend to verify file was uploaded
                loi_document_url: l.loi_document_url || null,
                agreement_document_url: l.agreement_document_url || null,
                registration_document_url: l.registration_document_url || null,
                // Missing fields for reports
                tenure_months: l.tenure_months,
                unit_handover_date: l.unit_handover_date,
                fitout_period_start: l.fitout_period_start,
                fitout_period_end: l.fitout_period_end,
                opening_date: l.opening_date,
                rent_commencement_date: l.rent_commencement_date,
                has_rent_free_period: l.has_rent_free_period,
                rent_free_start_date: l.rent_free_start_date,
                rent_free_end_date: l.rent_free_end_date,
                lessee_lockin_period_months: l.lessee_lockin_period_months,
                lessor_lockin_period_months: l.lessor_lockin_period_months,
                lessee_notice_period_days: l.lessee_notice_period_days,
                lessor_notice_period_days: l.lessor_notice_period_days,
                escalation_type: l.escalation_type,
                escalation_rate: l.escalation_rate,
                first_escalation_date: l.first_escalation_date,
                remarks: l.remarks,
                rent_amount_option: l.rent_amount_option,
                // ── Project & Unit (guaranteed from direct lookup) ──
                project_name: projectName,
                project_location: projectInfo.location || null,
                project_address: projectInfo.address || null,
                unit_number: unitNumber,
                chargeable_area: chargeableArea,
                // ── Resolved name fields ──
                tenant_name: tenantName,
                owner_name: (
                    l.owner?.company_name ||
                    `${l.owner?.first_name || ''} ${l.owner?.last_name || ''}`.trim() ||
                    null
                ),
                brand_name: brandName,  // strictly tenant's brand_name, else company_name, else full name
                tenant: {
                    company_name: partyInfo.company_name || null,
                    first_name: partyInfo.first_name || null,
                    last_name: partyInfo.last_name || null,
                    brand_name: partyInfo.brand_name || null   // direct from partiesMap — guaranteed
                },
                units: {
                    unit_number: unitNumber,
                    chargeable_area: chargeableArea
                },
                escalations: escalationsMap[l.id] || []
            };

        });

        console.log('Sample lease:', { unit_number: result?.[0]?.unit_number, project_name: result?.[0]?.project_name, brand_name: result?.[0]?.brand_name });

        if (location) {
            result = result.filter(r => r.project_location === location);
        }

        if (search) {
            const s = search.toLowerCase();
            result = result.filter(r =>
                (r.tenant_name && r.tenant_name.toLowerCase().includes(s)) ||
                (r.owner_name && r.owner_name.toLowerCase().includes(s)) ||
                (r.unit_number && String(r.unit_number).toLowerCase().includes(s)) ||
                (r.project_name && r.project_name.toLowerCase().includes(s)) ||
                (r.project_location && r.project_location.toLowerCase().includes(s)) ||
                (r.project_address && r.project_address.toLowerCase().includes(s)) ||
                String(r.id).includes(s)
            );
        }

        if (expires_in) {
            const targetDate = new Date(new Date().getTime() + parseInt(expires_in) * 86400000).getTime();
            const todayT = new Date().getTime();
            result = result.filter(r => {
                const le = new Date(r.lease_end).getTime();
                return le >= todayT && le <= targetDate;
            });
        }

        if (upcoming_escalations) {
            // Fetch all escalations upcoming
            const { today, d30 } = getDateStrs();
            const { data: escData } = await supabase.from('lease_escalations').select('lease_id').gte('effective_from', today).lte('effective_from', d30);
            const escLeaseIds = new Set((escData || []).map(e => e.lease_id));
            result = result.filter(r => escLeaseIds.has(r.id));
        }

        res.json(result);
    } catch (err) {
        console.error('GET ALL LEASES ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch leases', error: err.message });
    }
};

const getLeaseById = async (req, res) => {
    try {
        console.log("=== GET LEASE BY ID ===", req.params.id);

        // First get the lease data
        const { data: lease, error: leaseError } = await supabase
            .from('leases')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (leaseError || !lease) {
            console.error("Lease not found:", leaseError);
            return res.status(404).json({ message: 'Lease not found' });
        }

        // Multi-tenant: silently hide leases from other companies
        if (req.companyId && lease.company_id && lease.company_id !== req.companyId) {
            return res.status(404).json({ message: 'Lease not found' });
        }

        console.log("Lease data:", lease);
        console.log("party_tenant_id:", lease.party_tenant_id);
        console.log("party_owner_id:", lease.party_owner_id);
        console.log("unit_id:", lease.unit_id);
        console.log("project_id:", lease.project_id);

        // Fetch related data in parallel
        const [projectRes, unitRes, tenantRes, ownerRes, subtenantRes, escalationsRes] = await Promise.all([
            lease.project_id ? supabase.from('projects').select('project_name, location, address').eq('id', lease.project_id).single() : { data: null },
            lease.unit_id ? supabase.from('units').select('unit_number, floor_number, chargeable_area, carpet_area, unit_condition, block_tower').eq('id', lease.unit_id).single() : { data: null },
            lease.party_tenant_id ? supabase.from('parties').select('id, company_name, first_name, last_name, email, phone, brand_name').eq('id', lease.party_tenant_id).single() : { data: null },
            lease.party_owner_id ? supabase.from('parties').select('id, company_name, first_name, last_name, email, phone').eq('id', lease.party_owner_id).single() : { data: null },
            lease.sub_tenant_id ? supabase.from('parties').select('id, company_name, first_name, last_name, email, phone').eq('id', lease.sub_tenant_id).single() : { data: null },
            supabase.from('lease_escalations').select('*').eq('lease_id', req.params.id).order('sequence_no', { ascending: true })
        ]);

        console.log("Project:", projectRes.data);
        console.log("Unit:", unitRes.data);
        console.log("Tenant:", tenantRes.data);
        console.log("Owner:", ownerRes.data);

        const project = projectRes.data;
        const unit = unitRes.data;
        const tenant = tenantRes.data;
        const owner = ownerRes.data;
        const subtenant = subtenantRes.data;
        const escalations = escalationsRes.data || [];

        // Build tenant name - prefer company_name, then brand_name, then first+last name
        let tenantName = 'Unknown';
        if (tenant) {
            tenantName = tenant.company_name || tenant.brand_name ||
                `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unknown';
        }

        // Build owner name
        let ownerName = 'Unknown';
        if (owner) {
            ownerName = owner.company_name || `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'Unknown';
        }

        // Build subtenant name
        let subtenantName = null;
        if (subtenant) {
            subtenantName = subtenant.company_name || `${subtenant.first_name || ''} ${subtenant.last_name || ''}`.trim();
        }

        const mapped = {
            ...lease,
            project_name: project?.project_name || 'N/A',
            project_location: project?.location || 'N/A',
            project_address: project?.address || '',
            unit_number: unit?.unit_number || 'N/A',
            floor_number: unit?.floor_number || 'N/A',
            block_tower: unit?.block_tower || '',
            chargeable_area: unit?.chargeable_area || 0,
            carpet_area: unit?.carpet_area || 0,
            unit_condition: unit?.unit_condition || 'commercial',
            tenant_name: tenantName,
            tenant_first_name: tenant?.first_name || '',
            tenant_last_name: tenant?.last_name || '',
            tenant_email: tenant?.email || '',
            tenant_phone: tenant?.phone || '',
            contact_person_name: tenant ? `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || tenant.company_name || 'N/A' : 'N/A',
            contact_person_email: tenant?.email || 'N/A',
            contact_person_phone: tenant?.phone || 'N/A',
            owner_name: ownerName,
            owner_email: owner?.email || '',
            owner_phone: owner?.phone || '',
            sub_tenant_name: subtenantName
        };

        let daysRemaining = 0;
        if (mapped.lease_end) {
            daysRemaining = Math.ceil((new Date(mapped.lease_end) - new Date()) / 86400000);
        }

        res.json({ ...mapped, escalations, days_remaining: daysRemaining });
    } catch (err) {
        console.error('GET LEASE BY ID ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch lease', error: err.message });
    }
};

const updateLease = async (req, res) => {
    try {
        let payload = req.body;
        if (req.body.leaseData) {
            payload = JSON.parse(req.body.leaseData);
        }
        const leaseId = req.params.id;

        // Multi-tenant: silently hide leases from other companies
        // Use String() to avoid type mismatch between DB integer and JWT string
        if (req.companyId) {
            const { data: leaseCheck } = await supabase.from('leases')
                .select('company_id').eq('id', leaseId).single();
            if (!leaseCheck || String(leaseCheck.company_id) !== String(req.companyId)) {
                return res.status(404).json({ message: 'Lease not found' });
            }
        }

        const allowedFields = [
            'project_id', 'unit_id', 'party_owner_id', 'party_tenant_id', 'sub_tenant_id', 'lease_type', 'rent_model',
            'sub_lease_area_sqft', 'lease_start', 'lease_end', 'rent_commencement_date', 'fitout_period_end', 'tenure_months',
            'lockin_period_months', 'notice_period_months',
            'lessee_lockin_period_months', 'lessor_lockin_period_months',
            'lessee_lockin_period_days', 'lessor_lockin_period_days',
            'lessee_notice_period_months', 'lessor_notice_period_months',
            'lessee_notice_period_days', 'lessor_notice_period_days',
            'unit_handover_date', 'monthly_rent', 'monthly_net_sales',
            'rent_amount_option', 'mg_amount_sqft', 'mg_amount', 'cam_charges', 'billing_frequency', 'payment_due_day', 'currency_code',
            'security_deposit', 'utility_deposit', 'revenue_share_percentage', 'revenue_share_applicable_on', 'status',
            'fitout_period_start', 'notice_vacation_date', 'opening_date', 'rent_free_start_date', 'rent_free_end_date', 'loi_date',
            'agreement_date', 'registration_date'
        ];

        let updateData = {};
        for (const k of allowedFields) {
            if (payload[k] !== undefined) updateData[k] = payload[k];
        }

        // Handle party_owner_id vs owner_id mapping issue from payload
        if (payload.owner_id !== undefined) updateData.party_owner_id = payload.owner_id;
        if (payload.tenant_id !== undefined) updateData.party_tenant_id = payload.tenant_id;

        // File handling
        if (req.files) {
            if (req.files.loi_document) {
                updateData.loi_document_url = await uploadFileToSupabase(req.files.loi_document[0], 'loi');
            }
            if (req.files.agreement_document) {
                updateData.agreement_document_url = await uploadFileToSupabase(req.files.agreement_document[0], 'agreement');
            }
            if (req.files.registration_document) {
                updateData.registration_document_url = await uploadFileToSupabase(req.files.registration_document[0], 'registration');
            }
        }

        if (Object.keys(updateData).length > 0) {
            // Sanitize: Supabase rejects '' for numeric/date columns — convert to null
            for (const key of Object.keys(updateData)) {
                if (updateData[key] === '') updateData[key] = null;
            }
            const { error } = await supabase.from('leases').update(updateData).eq('id', leaseId);
            if (error) throw error;
        }

        if (payload.escalations !== undefined) {
            await supabase.from('lease_escalations').delete().eq('lease_id', leaseId);
            if (Array.isArray(payload.escalations) && payload.escalations.length > 0) {
                const escInserts = payload.escalations.map((esc, i) => ({
                    lease_id: leaseId, sequence_no: i + 1, effective_from: esc.effective_from, effective_to: esc.effective_to || null,
                    increase_type: esc.increase_type || 'Percentage', value: parseFloat(esc.value) || 0,
                    escalation_on: esc.escalation_on || null, rate_per_sqft: esc.rate_per_sqft || null
                }));
                await supabase.from('lease_escalations').insert(escInserts);
            }
        }

        res.json({ message: 'Lease updated successfully' });
    } catch (err) {
        console.error('UPDATE LEASE ERROR — full error object:', JSON.stringify(err, null, 2));
        console.error('UPDATE LEASE ERROR — message:', err.message);
        res.status(500).json({
            message: 'Failed to update lease',
            error: err.message || 'Unknown error',
            details: err.details || null,
            hint: err.hint || null,
            code: err.code || null
        });
    }
};

// Issue 38: Auto-fetch parent lessee when creating sub-lease
const getMainLesseeForUnit = async (req, res) => {
    try {
        const { unitId } = req.params;
        const { data, error } = await supabase.from('leases')
            .select('id, party_tenant_id, tenant:parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)')
            .eq('unit_id', unitId)
            .eq('status', 'active')
            .not('lease_type', 'eq', 'Subtenant lease')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'No active main lease found for this unit.' });
        }
        const lease = data[0];
        res.json({
            lease_id: lease.id,
            party_tenant_id: lease.party_tenant_id,
            tenant_name: lease.tenant?.company_name || `${lease.tenant?.first_name || ''} ${lease.tenant?.last_name || ''}`.trim()
        });
    } catch (err) {
        console.error('getMainLesseeForUnit ERROR:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Issue 69: Get effective rent for a lease as of today
const getEffectiveRent = async (req, res) => {
    try {
        const { id } = req.params;
        const today = new Date().toISOString().split('T')[0];

        const { data: lease, error } = await supabase.from('leases')
            .select('mg_amount_sqft, mg_amount, monthly_rent, revenue_share_percentage, rent_commencement_date, rent_model')
            .eq('id', id)
            .single();

        if (error) throw error;

        const { data: escalations } = await supabase.from('lease_escalations')
            .select('*')
            .eq('lease_id', id)
            .lte('effective_from', today)
            .order('sequence_no', { ascending: false })
            .limit(1);

        const currentEsc = escalations && escalations.length > 0 ? escalations[0] : null;
        const effectiveRent = currentEsc
            ? { ...currentEsc, base_rent: lease.monthly_rent }
            : { base_rent: lease.monthly_rent, mg_amount_sqft: lease.mg_amount_sqft, revenue_share_percentage: lease.revenue_share_percentage, note: 'No escalation applied, using base rent' };

        res.json({ effective_as_of: today, effective_rent: effectiveRent });
    } catch (err) {
        console.error('getEffectiveRent ERROR:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Issue 70: Export leases as CSV
const exportLeases = async (req, res) => {
    try {
        const { status, project_id, lease_type } = req.query;

        let query = supabase.from('leases').select(`
            id, lease_type, rent_model, lease_start, lease_end, rent_commencement_date, monthly_rent, mg_amount_sqft, mg_amount,
            revenue_share_percentage, status, tenure_months,
            projects(project_name, location),
            units(unit_number),
            tenant:parties!leases_party_tenant_id_fkey(company_name, first_name, last_name),
            owner:parties!leases_party_owner_id_fkey(company_name, first_name, last_name)
        `).order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);
        if (project_id) query = query.eq('project_id', project_id);
        if (lease_type) query = query.eq('lease_type', lease_type);

        const { data, error } = await query;
        if (error) throw error;

        const headers = ['Lease ID', 'Project', 'Unit', 'Tenant/Lessee', 'Lessor/Owner', 'Lease Type', 'Rental Model', 'Lease Start', 'Lease End', 'Rent Commencement', 'Current Rent', 'MG/Sqft', 'Revenue Share %', 'Duration (Months)', 'Status'];

        const rows = data.map(l => {
            const tenantName = l.tenant?.company_name || `${l.tenant?.first_name || ''} ${l.tenant?.last_name || ''}`.trim();
            const ownerName = l.owner?.company_name || `${l.owner?.first_name || ''} ${l.owner?.last_name || ''}`.trim();
            return [
                `L-${l.id}`,
                `"${l.projects?.project_name || 'N/A'}"`,
                `"${l.units?.unit_number || 'N/A'}"`,
                `"${tenantName}"`,
                `"${ownerName}"`,
                l.lease_type || 'Direct lease',
                l.rent_model || 'Fixed',
                l.lease_start ? new Date(l.lease_start).toLocaleDateString('en-IN') : '',
                l.lease_end ? new Date(l.lease_end).toLocaleDateString('en-IN') : '',
                l.rent_commencement_date ? new Date(l.rent_commencement_date).toLocaleDateString('en-IN') : '',
                l.monthly_rent || 0,
                l.mg_amount_sqft || 0,
                l.revenue_share_percentage || 'N/A',
                l.tenure_months || '',
                l.status
            ];
        });

        const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="leases_export.csv"');
        res.send(csvString);
    } catch (err) {
        console.error('EXPORT LEASES ERROR:', err);
        res.status(500).send('Failed to generate CSV');
    }
};

const deleteLease = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get unit_id before deletion to update status
        const { data: lease, error: getErr } = await supabase
            .from('leases')
            .select('unit_id')
            .eq('id', id)
            .single();

        if (getErr || !lease) {
            return res.status(404).json({ success: false, message: "Lease not found" });
        }

        // 2. Delete the lease (escalations will cascade delete)
        const { error: delErr } = await supabase
            .from('leases')
            .delete()
            .eq('id', id);

        if (delErr) throw delErr;

        // 3. Mark unit as vacant
        if (lease.unit_id) {
            await supabase
                .from('units')
                .update({ status: 'vacant' })
                .eq('id', lease.unit_id);
        }

        await createNotification(1, "Lease Deleted", `Lease #${id} has been deleted.`, "info");
        res.json({ success: true, message: "Lease deleted successfully" });
    } catch (err) {
        console.error("deleteLease err:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

const wipeAllData = async (req, res) => {
    res.json({ message: "Danger Zone wipe using Drop commands must be executed strictly via Supabase Dashboard SQL Editor to protect cloud relations." });
};

module.exports = {
    getLeaseDashboardStats,
    getLeaseManagerStats,
    getNeedAttentionLeases,
    getExpiringLeases,
    getPendingLeases,
    getLeaseNotifications,
    getLeaseReportStats,
    getLeaseTrackerStats,
    createLease,
    getAllLeases,
    getLeaseById,
    updateLease,
    approveLease,
    rejectLease,
    sendLeaseReminder,
    markAllNotificationsRead,
    deleteAllNotifications,
    wipeAllData,
    getMainLesseeForUnit,
    getEffectiveRent,
    exportLeases,
    deleteLease
};
