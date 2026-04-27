const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function updateSchema() {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to database...");

        console.log("Creating unit_images table if missing...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS unit_images (
              id INT AUTO_INCREMENT PRIMARY KEY,
              unit_id INT NOT NULL,
              image_path VARCHAR(255) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
            )
        `);

        console.log("Creating tenant_units table if missing...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tenant_units (
              id INT AUTO_INCREMENT PRIMARY KEY,
              tenant_id INT NOT NULL,
              unit_id INT NOT NULL,
              assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
              FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
            )
        `);

        console.log("Schema update complete!");
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error("Failed to update schema:", err);
        process.exit(1);
    }
}

updateSchema();
