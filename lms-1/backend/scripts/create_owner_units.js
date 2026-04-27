
const pool = require('../config/db');

async function createTable() {
    try {
        console.log("Creating owner_units table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS owner_units (
              id INT AUTO_INCREMENT PRIMARY KEY,
              owner_id INT NOT NULL,
              unit_id INT NOT NULL,
              assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
              FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
            );
        `);
        console.log("✅ owner_units table created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create table:", err);
        process.exit(1);
    }
}

createTable();
