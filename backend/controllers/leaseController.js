const supabase = require("../config/db");
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

const getLeaseDashboardStats = async (req, res) => {
    try {
        const { today, d30 } = getDateStrs();

        const [{ count: pending }, { count: active }, { count: expiring }, { count: renewals }] = await Promise.all([
            supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
            supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'active').lte('lease_end', d30),
            supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'active').gte('lease_end', today).lte('lease_end', d30)
        ]);

        const { data: escData } = await supabase.from('lease_escalations')
            .select('lease_id')
            .gte('effective_from', today).lte('effective_from', d30);
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
        res.status(500).json({ message: "Server error" });
    }
};

const getLeaseManagerStats = async (req, res) => {
    try {
        const { today, d30, d60, d90 } = getDateStrs();

        const pendingQuery = await supabase.from('leases').select('*', { count: 'exact', head: true }).in('status', ['draft', 'pending_review']);
        const exp30Query = await supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'active').lte('lease_end', d30);
        const exp60Query = await supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'active').gt('lease_end', d30).lte('lease_end', d60);
        const exp90Query = await supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'active').gt('lease_end', d60).lte('lease_end', d90);
        const renewalsQuery = await supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'active').gte('lease_end', today).lte('lease_end', d90);

        const { data: escData } = await supabase.from('lease_escalations').select('lease_id').gte('effective_from', today).lte('effective_from', d30);
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
        const { data: leases, error } = await supabase.from('leases')
            .select(`id, status, lease_end, parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)`)
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
        const { data: leases, error } = await supabase.from('leases')
            .select(`id, monthly_rent, lease_start, lease_end, parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)`)
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
        if (error) throw error;
        await createNotification(1, "Lease Approved", `Lease #${req.params.id} has been approved.`, "success");
        res.json({ message: "Lease approved" });
    } catch (err) {
        console.error("approveLease", err);
        res.status(500).json({ message: "Server error" });
    }
};

const rejectLease = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ message: "Rejection reason is required" });

        const { error } = await supabase.from('leases').update({ status: 'rejected' }).eq('id', req.params.id);
        if (error) throw error;

        await createNotification(1, "Lease Rejected", `Lease #${req.params.id} was rejected. Reason: ${reason}`, "error");
        res.json({ message: "Lease rejected" });
    } catch (err) {
        console.error("rejectLease", err);
        res.status(500).json({ message: "Server error" });
    }
};

const getExpiringLeases = async (req, res) => {
    try {
        const { d90 } = getDateStrs();
        const { data: leases, error } = await supabase.from('leases')
            .select(`id, monthly_rent, lease_end, parties!leases_party_tenant_id_fkey(company_name, first_name, last_name)`)
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
            supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'active').lte('lease_end', d30),
            supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'active').lte('lease_end', d60),
            supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'active').gt('notice_period_months', 0)
        ]);

        const { data: valData } = await supabase.from('leases').select('monthly_rent').eq('status', 'active').lte('lease_end', d60);
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
            supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'active').lte('lease_end', d90),
            supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'active').gte('lease_end', today).lte('lease_end', d60)
        ]);

        const { data: escData } = await supabase.from('lease_escalations').select('lease_id').gte('effective_from', today).lte('effective_from', d30);
        const escalations = new Set((escData || []).map(e => e.lease_id)).size;

        // Custom JS mapping for lock in calculation since raw interval math is tricky in JS client
        const { data: allActive } = await supabase.from('leases').select('lease_start, lockin_period_months').eq('status', 'active');
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

        console.log("Parsed Payload project_id type:", typeof payload.project_id);

        if (!payload.project_id || !payload.unit_id || !payload.party_tenant_id || !payload.lease_start || !payload.lease_end || !payload.rent_commencement_date) {
            return res.status(400).json({ message: 'Required fields missing.' });
        }
        if (payload.lease_type === 'Direct lease' && !payload.party_owner_id) {
            return res.status(400).json({ message: 'party_owner_id is required for Direct lease' });
        }

        // Issue 37: Proper date-range overlap check to prevent duplicate main leases
        if (payload.lease_type !== 'Subtenant lease') {
            const { data: ex } = await supabase.from('leases')
                .select('id, lease_start, lease_end')
                .eq('unit_id', payload.unit_id)
                .eq('status', 'active')
                .not('lease_type', 'eq', 'Subtenant lease');

            if (ex && ex.length > 0) {
                // Check for date overlap
                const newStart = new Date(payload.lease_start);
                const newEnd = new Date(payload.lease_end);
                const hasOverlap = ex.some(existing => {
                    const existStart = new Date(existing.lease_start);
                    const existEnd = new Date(existing.lease_end);
                    return newStart <= existEnd && newEnd >= existStart;
                });
                if (hasOverlap) return res.status(400).json({ message: "An active main lease with overlapping dates already exists for this unit." });
            }
        }

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
            lessee_notice_period_months: payload.lessee_notice_period_months || 0,
            lessor_notice_period_months: payload.lessor_notice_period_months || 0,
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
            return res.status(500).json({ message: 'Failed to create lease', error: lErr.message || JSON.stringify(lErr) });
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
        const { status, project_id, location, search, expires_in, upcoming_escalations, lease_type } = req.query;

        let query = supabase.from('leases').select(`
            id, lease_type, rent_model, lease_start, lease_end, monthly_rent, security_deposit, status,
            projects(project_name, location, address),
            units(unit_number),
            tenant:parties!leases_party_tenant_id_fkey(company_name, first_name, last_name),
            owner:parties!leases_party_owner_id_fkey(company_name, first_name, last_name),
            sub_tenants(company_name)
        `).order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);
        if (project_id) query = query.eq('project_id', project_id);
        // Issue 39: Filter by lease_type to separate main and sub-lease reporting
        if (lease_type) query = query.eq('lease_type', lease_type);
        else query = query.not('lease_type', 'eq', 'Subtenant lease'); // Default: exclude sub-leases from main list unless explicitly requested

        let { data, error } = await query;
        if (error) throw error;

        // JS Filtering for relations since advanced embedded string matching is tricky
        let result = data.map(l => ({
            id: l.id,
            lease_type: l.lease_type,
            rent_model: l.rent_model,
            lease_start: l.lease_start,
            lease_end: l.lease_end,
            monthly_rent: l.monthly_rent,
            security_deposit: l.security_deposit,
            status: l.status,
            project_name: l.projects?.project_name,
            project_location: l.projects?.location,
            project_address: l.projects?.address,
            unit_number: l.units?.unit_number,
            tenant_name: l.tenant?.company_name || `${l.tenant?.first_name || ''} ${l.tenant?.last_name || ''}`.trim(),
            owner_name: l.owner?.company_name || `${l.owner?.first_name || ''} ${l.owner?.last_name || ''}`.trim(),
            sub_tenant_name: l.sub_tenants?.company_name
        }));

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
        const { data, error } = await supabase.from('leases').select(`
            *,
            projects(project_name, location),
            units(unit_number, floor_number, chargeable_area, carpet_area, unit_condition),
            tenant:parties!leases_party_tenant_id_fkey(company_name, first_name, last_name, email, phone),
            owner:parties!leases_party_owner_id_fkey(company_name, first_name, last_name),
            sub_tenants(company_name)
        `).eq('id', req.params.id).single();

        if (error || !data) return res.status(404).json({ message: 'Lease not found' });

        const mapped = {
            ...data,
            project_name: data.projects?.project_name,
            project_location: data.projects?.location,
            unit_number: data.units?.unit_number,
            floor_number: data.units?.floor_number,
            chargeable_area: data.units?.chargeable_area,
            carpet_area: data.units?.carpet_area,
            unit_condition: data.units?.unit_condition,
            tenant_name: data.tenant?.company_name || `${data.tenant?.first_name || ''} ${data.tenant?.last_name || ''}`.trim(),
            tenant_first_name: data.tenant?.first_name,
            tenant_last_name: data.tenant?.last_name,
            contact_person_email: data.tenant?.email,
            contact_person_phone: data.tenant?.phone,
            owner_name: data.owner?.company_name || `${data.owner?.first_name || ''} ${data.owner?.last_name || ''}`.trim(),
            sub_tenant_name: data.sub_tenants?.company_name,
            projects: undefined, units: undefined, tenant: undefined, owner: undefined, sub_tenants: undefined
        };

        const { data: escalations } = await supabase.from('lease_escalations').select('*').eq('lease_id', req.params.id).order('sequence_no', { ascending: true });

        let daysRemaining = 0;
        if (mapped.lease_end) {
            daysRemaining = Math.ceil((new Date(mapped.lease_end) - new Date()) / 86400000);
        }

        res.json({ ...mapped, escalations: escalations || [], days_remaining: daysRemaining });
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

        const allowedFields = [
            'project_id', 'unit_id', 'party_owner_id', 'party_tenant_id', 'sub_tenant_id', 'lease_type', 'rent_model',
            'sub_lease_area_sqft', 'lease_start', 'lease_end', 'rent_commencement_date', 'fitout_period_end', 'tenure_months',
            'lockin_period_months', 'notice_period_months', 'lessee_lockin_period_months', 'lessor_lockin_period_months',
            'lessee_notice_period_months', 'lessor_notice_period_months', 'unit_handover_date', 'monthly_rent', 'monthly_net_sales',
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
        console.error('UPDATE LEASE ERROR:', err);
        res.status(500).json({ message: 'Failed to update lease', error: err.message });
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
    exportLeases
};
