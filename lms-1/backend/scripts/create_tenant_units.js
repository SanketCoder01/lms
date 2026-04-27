const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tenant_units (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                unit_id INT NOT NULL,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
            )
        `);
        console.log("✅ Created tenant_units table");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error creating table:", err);
        process.exit(1);
    }
}

createTable();
