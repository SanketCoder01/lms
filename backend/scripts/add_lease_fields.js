require('dotenv').config({ path: __dirname + '/../.env' });
const pool = require('../config/db');

async function addColumnIfNotExists(tableName, columnName, columnDefinition) {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
            [tableName, columnName]
        );
        
        if (rows.length === 0) {
            await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
            console.log(`✅ Added column ${columnName} to ${tableName}`);
        } else {
            console.log(`ℹ️ Column ${columnName} already exists in ${tableName}`);
        }
    } catch (error) {
        console.error(`❌ Error adding ${columnName} to ${tableName}:`, error.message);
    }
}

async function migrate() {
    console.log("Starting Lease Fields migration...");
    
    try {
        console.log("Adding fields to 'leases' table...");
        
        await addColumnIfNotExists('leases', 'lessee_notice_period_months', 'INT DEFAULT 0');
        await addColumnIfNotExists('leases', 'lessor_notice_period_months', 'INT DEFAULT 0');
        await addColumnIfNotExists('leases', 'lessee_lockin_period_months', 'INT DEFAULT 0');
        await addColumnIfNotExists('leases', 'lessor_lockin_period_months', 'INT DEFAULT 0');
        await addColumnIfNotExists('leases', 'unit_handover_date', 'DATE NULL');
        await addColumnIfNotExists('leases', 'rent_amount_option', "ENUM('Option A', 'Option B') NULL");
        await addColumnIfNotExists('leases', 'mg_amount_sqft', 'DECIMAL(15,2) DEFAULT 0.00');
        await addColumnIfNotExists('leases', 'mg_amount', 'DECIMAL(15,2) DEFAULT 0.00');

        console.log("Adding fields to 'lease_escalations' table...");
        await addColumnIfNotExists('lease_escalations', 'escalation_on', "ENUM('mg', 'revenue_share', 'both') NULL");
        await addColumnIfNotExists('lease_escalations', 'rate_per_sqft', 'DECIMAL(10,2) NULL');

        try {
            await pool.query(`ALTER TABLE lease_escalations MODIFY COLUMN effective_to DATE NULL`);
            console.log("✅ Modified effective_to to allow NULL");
        } catch (err) {
             console.log(`Note on effective_to: ${err.message}`);
        }

        try {
            await pool.query(`ALTER TABLE leases MODIFY COLUMN payment_due_day VARCHAR(50)`);
            console.log("✅ Modified payment_due_day to allow strings");
        } catch(err) {
             console.log(`Note on payment_due_day: ${err.message}`);
        }

        console.log("Migration completed successfully.");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit(0);
    }
}

migrate();
