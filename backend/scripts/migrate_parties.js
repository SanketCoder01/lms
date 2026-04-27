require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../config/db');

const migrate = async () => {
    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        console.log("Starting migration...");

        const ownerMap = new Map(); // old_id -> new_party_id
        const tenantMap = new Map(); // old_id -> new_party_id

        // 1. Migrate Owners
        const [owners] = await connection.query("SELECT * FROM owners");
        console.log(`Migrating ${owners.length} owners...`);

        for (const owner of owners) {
            const nameParts = owner.name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';
            const type = owner.company_name ? 'Company' : 'Individual';

            const [res] = await connection.query(`
                INSERT INTO parties 
                (type, company_name, first_name, last_name, email, phone, identification_number, address_line1, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                type, owner.company_name, firstName, lastName, owner.email, owner.phone, owner.tax_id, owner.address, owner.created_at
            ]);

            ownerMap.set(owner.id, res.insertId);
        }

        // 2. Migrate Owner Units -> Unit Ownerships
        const [ownerUnits] = await connection.query("SELECT * FROM owner_units");

        for (const ou of ownerUnits) {
            const newPartyId = ownerMap.get(ou.owner_id);
            if (newPartyId) {
                await connection.query(`
                    INSERT INTO unit_ownerships (unit_id, party_id, ownership_status, start_date)
                    VALUES (?, ?, 'Active', ?)
                `, [ou.unit_id, newPartyId, ou.assigned_at]);
            }
        }

        // 3. Migrate Tenants
        const [tenants] = await connection.query("SELECT * FROM tenants");
        console.log(`Migrating ${tenants.length} tenants...`);

        for (const tenant of tenants) {
            const contactName = tenant.contact_person_name ? tenant.contact_person_name.split(' ') : [''];
            const firstName = contactName[0];
            const lastName = contactName.slice(1).join(' ') || '';

            const [res] = await connection.query(`
                INSERT INTO parties 
                (type, company_name, first_name, last_name, email, phone, identification_number, address_line1, city, state, postal_code, country, created_at)
                VALUES ('Company', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                tenant.company_name, firstName, lastName,
                tenant.contact_person_email, tenant.contact_person_phone,
                tenant.tax_id, tenant.address, tenant.city, tenant.state, tenant.zip_code, tenant.country,
                tenant.created_at
            ]);

            tenantMap.set(tenant.id, res.insertId);
        }

        // 4. Update Leases
        // First add columns (if they don't exist)
        try {
            await connection.query("ALTER TABLE leases ADD COLUMN party_owner_id INT, ADD COLUMN party_tenant_id INT");
        } catch (e) {
            console.log("Lease columns might already exist.");
        }

        const [leases] = await connection.query("SELECT * FROM leases");
        for (const lease of leases) {
            const newOwnerId = lease.owner_id ? ownerMap.get(lease.owner_id) : null;
            const newTenantId = lease.tenant_id ? tenantMap.get(lease.tenant_id) : null;

            if (newOwnerId || newTenantId) {
                await connection.query(
                    "UPDATE leases SET party_owner_id = ?, party_tenant_id = ? WHERE id = ?",
                    [newOwnerId, newTenantId, lease.id]
                );
            }
        }

        // 5. Update Documents
        // Need to update ENUM first
        console.log("Updating documents table...");
        await connection.query("ALTER TABLE documents MODIFY COLUMN entity_type ENUM('project', 'unit', 'tenant', 'owner', 'party') NOT NULL");

        // Update Owner docs
        for (const [oldId, newId] of ownerMap) {
            await connection.query("UPDATE documents SET entity_type='party', entity_id=? WHERE entity_type='owner' AND entity_id=?", [newId, oldId]);
        }
        // Update Tenant docs
        for (const [oldId, newId] of tenantMap) {
            await connection.query("UPDATE documents SET entity_type='party', entity_id=? WHERE entity_type='tenant' AND entity_id=?", [newId, oldId]);
        }

        await connection.commit();
        console.log("Migration successful!");
        process.exit();

    } catch (e) {
        await connection.rollback();
        console.error("Migration failed:", e);
        process.exit(1);
    }
};

migrate();
