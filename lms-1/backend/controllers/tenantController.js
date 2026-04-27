const supabase = require('../config/db');
const { createNotification } = require('../utils/notificationHelper');

exports.createTenant = async (req, res) => {
    try {
        const {
            company_name, brand_name, legal_entity_type, company_registration_number,
            industry, tax_id, id_type, website, contact_person_name, contact_person_email,
            contact_person_phone, street_address, city, state, zip_code, country,
            kyc_status, status, units, unit_ids, subtenants
        } = req.body;

        if (!company_name) {
            return res.status(400).json({ message: 'Company name is required' });
        }

        // 1. Insert Tenant
        const insertPayload = {
            company_name, brand_name, legal_entity_type, registration_no: company_registration_number,
            industry, tax_id, id_type, website, contact_person_name, contact_person_email,
            contact_person_phone, address: street_address, city, state, zip_code, country,
            kyc_status: kyc_status || 'pending', status: status || 'active'
        };
        // Multi-tenant: stamp company_id on new tenants
        if (req.companyId) insertPayload.company_id = req.companyId;

        const { data: tenant, error: tenantError } = await supabase.from('tenants').insert(insertPayload).select('id').single();

        if (tenantError) throw tenantError;
        const tenantId = tenant.id;

        // 2. Assign Units
        const rawUnitIds = unit_ids || units || [];
        let validUnitIds = (Array.isArray(rawUnitIds) ? rawUnitIds : [])
            .map(id => (typeof id === 'object' ? id.id : id))
            .filter(id => id && !isNaN(id));

        if (validUnitIds.length > 0) {
            // Multi-tenant: silently filter out units from other companies
            if (req.companyId) {
                const { data: unitCheck } = await supabase.from('units')
                    .select('company_id, id').in('id', validUnitIds);
                validUnitIds = (unitCheck || []).filter(u => u.company_id === req.companyId).map(u => u.id);
            }
            const tenantUnitsInserts = validUnitIds.map(unitId => ({ tenant_id: tenantId, unit_id: unitId }));
            const { error: tuError } = await supabase.from('tenant_units').insert(tenantUnitsInserts);
            if (tuError) console.error("TU Insert Error:", tuError);

            const { error: uError } = await supabase.from('units').update({ status: 'occupied' }).in('id', validUnitIds);
            if (uError) console.error("Unit Update Error:", uError);
        }

        // 3. Subtenants
        if (Array.isArray(subtenants) && subtenants.length > 0) {
            const validSubT = subtenants.filter(s => s.company_name && typeof s.company_name === 'string');
            if (validSubT.length > 0) {
                const subInserts = validSubT.map(s => ({
                    tenant_id: tenantId, company_name: s.company_name, registration_no: s.registration_number,
                    allotted_area: s.allotted_area_sqft, contact_person: s.contact_person_name,
                    email: s.contact_person_email, phone: s.contact_person_phone
                }));
                await supabase.from('sub_tenants').insert(subInserts);
            }
        }

        // Notify Admin
        await createNotification(1, "New Tenant Registered", `Tenant ${company_name} has been successfully registered.`, "success");

        res.status(201).json({ message: 'Tenant created successfully', tenant_id: tenantId });
    } catch (err) {
        console.error('CREATE TENANT ERROR:', err);
        res.status(500).json({ message: 'Failed to create tenant', error: err.message });
    }
};

exports.getAllTenants = async (req, res) => {
    try {
        const search = req.query.search ? req.query.search.toLowerCase() : '';
        const projectId = req.query.projectId;

        let query = supabase.from('tenants').select('*').order('created_at', { ascending: false });
        // Multi-tenant: company users only see their own tenants
        if (req.companyId) query = query.eq('company_id', req.companyId);

        let { data: tenants, error } = await query;
        if (error) throw error;

        // Fetch Tenant Units
        const { data: tenantUnits } = await supabase.from('tenant_units').select('tenant_id, unit_id');
        const unitIds = (tenantUnits || []).map(tu => tu.unit_id);

        let units = [];
        if (unitIds.length > 0) {
            let uQuery = supabase.from('units').select('id, project_id, chargeable_area, unit_number').in('id', unitIds);
            if (projectId && projectId !== 'All') uQuery = uQuery.eq('project_id', projectId);
            const { data: uData } = await uQuery;
            units = uData || [];
        }

        // Aggregate mappings
        const finalTenants = tenants.map(t => {
            const myTUs = (tenantUnits || []).filter(tu => tu.tenant_id === t.id).map(tu => tu.unit_id);
            const myUnits = units.filter(u => myTUs.includes(u.id));

            return {
                id: t.id,
                company_name: t.company_name,
                contact_person_phone: t.contact_person_phone,
                contact_person_email: t.contact_person_email,
                status: t.status,
                area_occupied: myUnits.reduce((sum, u) => sum + parseFloat(u.chargeable_area || 0), 0),
                occupied_units: myUnits.map(u => u.unit_number).join(', '),
                projectIds: myUnits.map(u => String(u.project_id)) // to check project filter in JS if needed
            };
        });

        // Apply filters in JS
        const filteredTenants = finalTenants.filter(t => {
            if (projectId && projectId !== 'All' && !t.projectIds.includes(String(projectId)) && t.projectIds.length > 0) {
                // Return true if they have no units but we might want them? 
                // Original SQL implies LEFT JOIN and logic. Let's keep strict if projectId passed.
                return false;
            }
            if (search) {
                return (
                    (t.company_name && t.company_name.toLowerCase().includes(search)) ||
                    (t.contact_person_name && t.contact_person_name.toLowerCase().includes(search)) ||
                    (t.contact_person_email && t.contact_person_email.toLowerCase().includes(search))
                );
            }
            return true;
        });

        res.json(filteredTenants);
    } catch (err) {
        console.error('GET ALL TENANTS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch tenants', error: err.message });
    }
};

exports.getTenantById = async (req, res) => {
    try {
        const tenantId = req.params.id;

        const { data: tenant, error } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
        if (error || !tenant) return res.status(404).json({ message: 'Tenant not found' });

        // Multi-tenant: silently hide tenants from other companies
        if (req.companyId && tenant.company_id && tenant.company_id !== req.companyId) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        const { data: tenantUnits } = await supabase.from('tenant_units').select('unit_id').eq('tenant_id', tenantId);
        const unitIds = (tenantUnits || []).map(tu => tu.unit_id);

        let enrichedUnits = [];
        let totalArea = 0;

        if (unitIds.length > 0) {
            const { data: unitsData } = await supabase.from('units').select('*, projects(project_name)').in('id', unitIds);
            enrichedUnits = (unitsData || []).map(u => ({
                ...u,
                project_name: u.projects ? u.projects.project_name : null
            }));
            totalArea = enrichedUnits.reduce((sum, unit) => sum + (parseFloat(unit.chargeable_area) || 0), 0);
        }

        const { data: subtenants } = await supabase.from('sub_tenants').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: true });

        // Currently no standard mapping for legacy "leases" table joining on "tenant_id" unless it uses party_tenant_id
        const { data: activeLeaseData } = await supabase.from('leases').select('*, projects(project_name, location)').eq('party_tenant_id', tenantId).eq('status', 'Active').order('created_at', { ascending: false }).limit(1);
        const activeLease = (activeLeaseData && activeLeaseData.length > 0) ? {
            ...activeLeaseData[0],
            project_name: activeLeaseData[0].projects ? activeLeaseData[0].projects.project_name : null,
            project_location: activeLeaseData[0].projects ? activeLeaseData[0].projects.location : null
        } : null;

        res.json({
            ...tenant,
            units: enrichedUnits,
            subtenants: subtenants || [],
            active_lease: activeLease,
            area_occupied: totalArea
        });
    } catch (err) {
        console.error('GET TENANT BY ID ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch tenant details', error: err.message });
    }
};

exports.updateTenant = async (req, res) => {
    try {
        const tenantId = req.params.id;
        const {
            subtenants, company_name, brand_name, legal_entity_type, company_registration_number,
            industry, tax_id, id_type, website, contact_person_name, contact_person_email,
            contact_person_phone, street_address, city, state, zip_code, country,
            kyc_status, status
        } = req.body;

        // Multi-tenant: silently hide tenants from other companies
        if (req.companyId) {
            const { data: tenantCheck } = await supabase.from('tenants')
                .select('company_id').eq('id', tenantId).single();
            if (!tenantCheck || tenantCheck.company_id !== req.companyId) {
                return res.status(404).json({ message: 'Tenant not found' });
            }
        }

        const updateData = {};
        if (company_name !== undefined) updateData.company_name = company_name;
        if (brand_name !== undefined) updateData.brand_name = brand_name;
        if (legal_entity_type !== undefined) updateData.legal_entity_type = legal_entity_type;
        if (company_registration_number !== undefined) updateData.registration_no = company_registration_number;
        if (industry !== undefined) updateData.industry = industry;
        if (tax_id !== undefined) updateData.tax_id = tax_id;
        if (id_type !== undefined) updateData.id_type = id_type;
        if (website !== undefined) updateData.website = website;
        if (contact_person_name !== undefined) updateData.contact_person_name = contact_person_name;
        if (contact_person_email !== undefined) updateData.contact_person_email = contact_person_email;
        if (contact_person_phone !== undefined) updateData.contact_person_phone = contact_person_phone;
        if (street_address !== undefined) updateData.address = street_address;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (zip_code !== undefined) updateData.zip_code = zip_code;
        if (country !== undefined) updateData.country = country;
        if (kyc_status !== undefined) updateData.kyc_status = kyc_status;
        if (status !== undefined) updateData.status = status;

        if (Object.keys(updateData).length > 0) {
            const { error: tErr } = await supabase.from('tenants').update(updateData).eq('id', tenantId);
            if (tErr) throw tErr;
        }

        // Handle Subtenants
        if (subtenants !== undefined) {
            await supabase.from('sub_tenants').delete().eq('tenant_id', tenantId);
            if (Array.isArray(subtenants) && subtenants.length > 0) {
                const validSubT = subtenants.filter(s => s.company_name && typeof s.company_name === 'string');
                if (validSubT.length > 0) {
                    const subInserts = validSubT.map(s => ({
                        tenant_id: tenantId, company_name: s.company_name, registration_no: s.registration_number,
                        allotted_area: s.allotted_area_sqft, contact_person: s.contact_person_name,
                        email: s.contact_person_email, phone: s.contact_person_phone
                    }));
                    await supabase.from('sub_tenants').insert(subInserts);
                }
            }
        }

        // Handle Units
        const unitIds = req.body.unit_ids || req.body.units;
        if (unitIds !== undefined) {
            const { data: currTUs } = await supabase.from('tenant_units').select('unit_id').eq('tenant_id', tenantId);
            const currUnitIds = (currTUs || []).map(u => u.unit_id);
            if (currUnitIds.length > 0) {
                await supabase.from('units').update({ status: 'vacant' }).in('id', currUnitIds);
            }
            await supabase.from('tenant_units').delete().eq('tenant_id', tenantId);

            if (Array.isArray(unitIds) && unitIds.length > 0) {
                const validU = unitIds.filter(u => u);
                const tuInserts = validU.map(u => ({ tenant_id: tenantId, unit_id: u }));
                await supabase.from('tenant_units').insert(tuInserts);
                await supabase.from('units').update({ status: 'occupied' }).in('id', validU);
            }
        }

        res.json({ message: 'Tenant updated successfully' });
    } catch (err) {
        console.error('UPDATE TENANT ERROR:', err);
        res.status(500).json({ message: 'Update failed', error: err.message });
    }
};

exports.getTenantLocations = async (req, res) => {
    try {
        const { data, error } = await supabase.from('tenants').select('city').not('city', 'is', null);
        if (error) throw error;
        const locations = [...new Set(data.map(d => d.city).filter(c => c.trim() !== ''))].sort();
        res.json(locations);
    } catch (err) {
        console.error("Fetch locations error:", err);
        res.status(500).json({ message: "Failed to fetch locations" });
    }
};
