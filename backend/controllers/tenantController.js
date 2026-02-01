const pool = require('../config/db');
const { createNotification } = require('../utils/notificationHelper');

exports.createTenant = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const {
            company_name,
            brand_name,           // New
            legal_entity_type,    // New
            company_registration_number,
            industry,
            tax_id,
            id_type,              // New
            website,
            contact_person_name,
            contact_person_email,
            contact_person_phone,
            street_address,
            city,
            state,
            zip_code,
            country,
            kyc_status,
            status,
            units,
            unit_ids,
            subtenants
        } = req.body;

        // Validate required field
        if (!company_name) {
            return res.status(400).json({ message: 'Company name is required' });
        }

        await connection.beginTransaction();

        // Use unit_ids if provided, otherwise use units
        const rawUnitIds = unit_ids || units || [];
        // FILTER: Ensure only valid numbers/strings are used, remove objects/nulls
        const unitIds = (Array.isArray(rawUnitIds) ? rawUnitIds : [])
            .map(id => (typeof id === 'object' ? id.id : id)) // Handle if {id: 1} is passed
            .filter(id => id && !isNaN(id));

        const tenantValues = [
            company_name,
            brand_name || null,
            legal_entity_type || null,
            company_registration_number || null,
            industry || null,
            tax_id || null,
            id_type || null,
            website || null,
            contact_person_name || null,
            contact_person_email || null,
            contact_person_phone || null,
            street_address || null,
            city || null,
            state || null,
            zip_code || null,
            country || null,
            kyc_status || 'pending',
            status || 'active'
        ];

        // 1️⃣ Insert tenant
        const [tenantResult] = await connection.query(
            `INSERT INTO tenants 
            (company_name, brand_name, legal_entity_type, registration_no, industry, tax_id, id_type, website,
             contact_person_name, contact_person_email, contact_person_phone,
             address, city, state, zip_code, country, kyc_status, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            tenantValues
        );

        const tenantId = tenantResult.insertId;

        // 2️⃣ Assign units
        if (unitIds.length > 0) {
            for (let unitId of unitIds) {
                // Validate unit exists
                const [validUnit] = await connection.query("SELECT id FROM units WHERE id = ?", [unitId]);
                if (validUnit.length === 0) {
                    console.warn(`Skipping invalid unit ID: ${unitId}`);
                    continue;
                }

                // Check if unit is already assigned to THIS tenant (idempotency)
                // Note: If unit is assigned to ANOTHER tenant, we might want to block or overwrite. 
                // Current logic: just insert if not already linked to this tenant.
                const [existing] = await connection.query(
                    `SELECT * FROM tenant_units WHERE tenant_id = ? AND unit_id = ?`,
                    [tenantId, unitId]
                );

                if (existing.length === 0) {
                    await connection.query(
                        `INSERT INTO tenant_units (tenant_id, unit_id)
                         VALUES (?, ?)`,
                        [tenantId, unitId]
                    );

                    await connection.query(
                        `UPDATE units SET status = 'occupied' WHERE id = ?`,
                        [unitId]
                    );
                }
            }
        }

        // 3️⃣ Insert subtenants
        if (Array.isArray(subtenants) && subtenants.length > 0) {
            for (let sub of subtenants) {
                // Skip if no company name provided
                if (!sub.company_name || typeof sub.company_name !== 'string' || sub.company_name.trim() === '') {
                    console.warn("Skipping subtenant with invalid/missing company_name");
                    continue;
                }

                await connection.query(
                    `INSERT INTO sub_tenants
                    (tenant_id, company_name, registration_no,
                     allotted_area, contact_person,
                     email, phone)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        tenantId,
                        sub.company_name,
                        sub.registration_number || null,
                        sub.allotted_area_sqft || null,
                        sub.contact_person_name || null,
                        sub.contact_person_email || null,
                        sub.contact_person_phone || null
                    ]
                );
            }
        }

        await connection.commit();

        // Notify Admin
        await createNotification(1, "New Tenant Registered", `Tenant ${company_name} has been successfully registered.`, "success");

        res.status(201).json({
            message: 'Tenant created successfully',
            tenant_id: tenantId
        });

    } catch (err) {
        await connection.rollback();
        console.error('CREATE TENANT ERROR:', err);
        console.error('SQL Message:', err.sqlMessage);
        res.status(500).json({
            message: 'Failed to create tenant: ' + err.message,
            error: err.message
        });
    } finally {
        connection.release();
    }
};

exports.getAllTenants = async (req, res) => {
    try {
        const search = req.query.search || '';
        const projectId = req.query.projectId;

        let query = `
            SELECT 
                t.id,
                t.company_name,
                t.contact_person_phone,
                t.contact_person_email,
                t.status,
                COALESCE(SUM(u.super_area), 0) AS area_occupied,
                GROUP_CONCAT(u.unit_number SEPARATOR ', ') AS occupied_units
            FROM tenants t
            LEFT JOIN tenant_units tu ON t.id = tu.tenant_id
            LEFT JOIN units u ON tu.unit_id = u.id
            WHERE (? = '' OR t.company_name LIKE ? OR t.contact_person_name LIKE ? OR t.contact_person_email LIKE ?)
        `;

        const params = [search, `%${search}%`, `%${search}%`, `%${search}%`];

        if (projectId && projectId !== 'All') {
            query += ` AND u.project_id = ?`;
            params.push(projectId);
        }

        query += ` GROUP BY t.id ORDER BY t.created_at DESC`;

        const [rows] = await pool.query(query, params);

        res.json(rows);
    } catch (err) {
        console.error('GET ALL TENANTS ERROR:', err);
        res.status(500).json({
            message: 'Failed to fetch tenants',
            error: err.message
        });
    }
};

exports.getTenantById = async (req, res) => {
    try {
        const tenantId = req.params.id;

        const [tenantRows] = await pool.query(
            `SELECT * FROM tenants WHERE id = ?`,
            [tenantId]
        );

        if (tenantRows.length === 0) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        const tenant = tenantRows[0];

        const [units] = await pool.query(
            `SELECT u.*, p.project_name 
             FROM units u
             JOIN tenant_units tu ON u.id = tu.unit_id
             LEFT JOIN projects p ON u.project_id = p.id
             WHERE tu.tenant_id = ?`,
            [tenantId]
        );

        const [subtenants] = await pool.query(
            `SELECT * FROM sub_tenants WHERE tenant_id = ? ORDER BY created_at ASC`,
            [tenantId]
        );

        // Fetch Active Lease
        const [leaseRows] = await pool.query(
            `SELECT l.*, p.project_name, p.location as project_location
             FROM leases l
             LEFT JOIN projects p ON l.project_id = p.id
             WHERE l.tenant_id = ? AND l.status = 'Active'
             ORDER BY l.created_at DESC LIMIT 1`,
            [tenantId]
        );
        const activeLease = leaseRows.length > 0 ? leaseRows[0] : null;

        // Calculate total area occupied
        const totalArea = units.reduce((sum, unit) => {
            return sum + (parseFloat(unit.super_area) || 0);
        }, 0);

        // Return tenant with nested data for frontend compatibility
        res.json({
            ...tenant,
            units: units || [],
            subtenants: subtenants || [],
            active_lease: activeLease,
            area_occupied: totalArea
        });

    } catch (err) {
        console.error('GET TENANT BY ID ERROR:', err);
        res.status(500).json({
            message: 'Failed to fetch tenant details',
            error: err.message
        });
    }
};
exports.updateTenant = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const tenantId = req.params.id;
        const {
            subtenants,
            company_name,
            brand_name,
            legal_entity_type,
            company_registration_number,
            industry,
            tax_id,
            id_type,
            website,
            contact_person_name,
            contact_person_email,
            contact_person_phone,
            street_address,
            city,
            state,
            zip_code,
            country,
            kyc_status,
            status
        } = req.body;

        await connection.beginTransaction();

        console.log("--------------- UPDATE TENANT DEBUG ---------------");
        console.log("Tenant ID:", tenantId);
        console.log("Request Body:", JSON.stringify(req.body, null, 2));

        // Check if tenant exists
        const [existing] = await connection.query(
            `SELECT id FROM tenants WHERE id = ?`,
            [tenantId]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Tenant not found' });
        }

        // Build update query with only provided fields
        const updateFields = [];
        const updateValues = [];

        if (company_name !== undefined) {
            updateFields.push('company_name = ?');
            updateValues.push(company_name);
        }
        if (brand_name !== undefined) {
            updateFields.push('brand_name = ?');
            updateValues.push(brand_name);
        }
        if (legal_entity_type !== undefined) {
            updateFields.push('legal_entity_type = ?');
            updateValues.push(legal_entity_type);
        }
        if (company_registration_number !== undefined) {
            updateFields.push('registration_no = ?');
            updateValues.push(company_registration_number);
        }
        if (industry !== undefined) {
            updateFields.push('industry = ?');
            updateValues.push(industry);
        }
        if (tax_id !== undefined) {
            updateFields.push('tax_id = ?');
            updateValues.push(tax_id);
        }
        if (id_type !== undefined) {
            updateFields.push('id_type = ?');
            updateValues.push(id_type);
        }
        if (website !== undefined) {
            updateFields.push('website = ?');
            updateValues.push(website);
        }
        if (contact_person_name !== undefined) {
            updateFields.push('contact_person_name = ?');
            updateValues.push(contact_person_name);
        }
        if (contact_person_email !== undefined) {
            updateFields.push('contact_person_email = ?');
            updateValues.push(contact_person_email);
        }
        if (contact_person_phone !== undefined) {
            updateFields.push('contact_person_phone = ?');
            updateValues.push(contact_person_phone);
        }
        if (street_address !== undefined) {
            updateFields.push('address = ?');
            updateValues.push(street_address);
        }
        if (city !== undefined) {
            updateFields.push('city = ?');
            updateValues.push(city);
        }
        if (state !== undefined) {
            updateFields.push('state = ?');
            updateValues.push(state);
        }
        if (zip_code !== undefined) {
            updateFields.push('zip_code = ?');
            updateValues.push(zip_code);
        }
        if (country !== undefined) {
            updateFields.push('country = ?');
            updateValues.push(country);
        }
        if (kyc_status !== undefined) {
            updateFields.push('kyc_status = ?');
            updateValues.push(kyc_status);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }

        // Update tenant if there are fields to update
        if (updateFields.length > 0) {
            updateValues.push(tenantId);
            console.log("Executing Query Fields:", updateFields); // DEBUG
            await connection.query(
                `UPDATE tenants SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );
        }

        // Handle subtenants - remove old and insert new
        if (subtenants !== undefined) {
            // Remove old subtenants
            await connection.query(
                `DELETE FROM sub_tenants WHERE tenant_id = ?`,
                [tenantId]
            );

            // Insert new subtenants
            if (Array.isArray(subtenants) && subtenants.length > 0) {
                for (let st of subtenants) {
                    if (!st.company_name || st.company_name.trim() === '') {
                        continue;
                    }

                    await connection.query(
                        `INSERT INTO sub_tenants
                        (tenant_id, company_name, registration_no,
                         allotted_area, contact_person,
                         email, phone)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            tenantId,
                            st.company_name,
                            st.registration_number || null,
                            st.allotted_area_sqft || null,
                            st.contact_person_name || null,
                            st.contact_person_email || null,
                            st.contact_person_phone || null
                        ]
                    );
                }
            }
        }

        // Handle Unit Updates
        const unitIds = req.body.unit_ids || req.body.units;
        if (unitIds !== undefined) {
            // 1. Get currently assigned units to release them
            const [currentUnits] = await connection.query(
                `SELECT unit_id FROM tenant_units WHERE tenant_id = ?`,
                [tenantId]
            );

            // 2. Set current units to vacant
            if (currentUnits.length > 0) {
                const currentUnitIds = currentUnits.map(u => u.unit_id);
                await connection.query(
                    `UPDATE units SET status = 'vacant' WHERE id IN (?)`,
                    [currentUnitIds]
                );
            }

            // 3. Remove current assignments
            await connection.query(
                `DELETE FROM tenant_units WHERE tenant_id = ?`,
                [tenantId]
            );

            // 4. Assign new units
            if (Array.isArray(unitIds) && unitIds.length > 0) {
                for (let unitId of unitIds) {
                    if (!unitId) continue;

                    // Validate unit exists
                    const [validUnit] = await connection.query("SELECT id FROM units WHERE id = ?", [unitId]);
                    if (validUnit.length === 0) continue;

                    // Insert assignment
                    await connection.query(
                        `INSERT INTO tenant_units (tenant_id, unit_id) VALUES (?, ?)`,
                        [tenantId, unitId]
                    );

                    // Update unit status
                    await connection.query(
                        `UPDATE units SET status = 'occupied' WHERE id = ?`,
                        [unitId]
                    );
                }
            }
        }

        await connection.commit();
        res.json({ message: 'Tenant updated successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('UPDATE TENANT ERROR:', err);
        res.status(500).json({
            message: 'Update failed',
            error: err.message
        });
    } finally {
        connection.release();
    }
};

exports.getTenantLocations = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT DISTINCT city FROM tenants WHERE city IS NOT NULL AND city != '' ORDER BY city");
        const locations = rows.map(row => row.city);
        res.json(locations);
    } catch (err) {
        console.error("Fetch locations error:", err);
        res.status(500).json({ message: "Failed to fetch locations" });
    }
};

