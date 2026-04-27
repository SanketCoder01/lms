const pool = require('../config/db');

async function migrate() {
    try {
        console.log("Starting migration: Add fields to tenants table...");

        // Check if columns exist
        const [columns] = await pool.query(`SHOW COLUMNS FROM tenants LIKE 'brand_name'`);

        if (columns.length === 0) {
            await pool.query(`
                ALTER TABLE tenants
                ADD COLUMN brand_name VARCHAR(255) AFTER company_name,
                ADD COLUMN legal_entity_type VARCHAR(100) AFTER brand_name,
                ADD COLUMN id_type VARCHAR(50) AFTER tax_id
            `);
            console.log("Added brand_name, legal_entity_type, and id_type columns to tenants table.");
        } else {
            console.log("Columns already exist, skipping.");
        }

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
