
const pool = require('../config/db');

async function migrate() {
    try {
        console.log("Checking lease_escalations table...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS lease_escalations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lease_id INT NOT NULL,
                sequence_no INT,
                effective_from DATE NOT NULL,
                effective_to DATE,
                increase_type VARCHAR(50) DEFAULT 'Percentage',
                value DECIMAL(10, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE
            )
        `);

        console.log("lease_escalations table ensured.");
        process.exit();
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

migrate();
