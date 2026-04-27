const pool = require('../config/db');

const checkTables = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to DB.");

        try {
            const [rows] = await connection.query("SHOW TABLES LIKE 'lease_escalations'");
            if (rows.length === 0) {
                console.log("❌ Table 'lease_escalations' DOES NOT exist.");

                // Create it
                console.log("Creating 'lease_escalations' table...");
                await connection.query(`
          CREATE TABLE IF NOT EXISTS lease_escalations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            lease_id INT NOT NULL,
            sequence_no INT,
            effective_from DATE,
            increase_type ENUM('Percentage', 'Fixed Amount') DEFAULT 'Percentage',
            value DECIMAL(12, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE
          )
        `);
                console.log("✅ Table 'lease_escalations' created.");
            } else {
                console.log("✅ Table 'lease_escalations' exists.");
            }

            // Also check if dashboard stats query works now
            // Mocking the query from dashboardController
            console.log("Testing Escalations Query...");
            const [escalations] = await connection.query(`
        SELECT re.effective_from as effective_date 
        FROM lease_escalations re
        LEFT JOIN leases l ON re.lease_id = l.id
        LIMIT 1
      `);
            console.log("Escalations Query ran successfully.");

        } catch (e) {
            console.error("Error during check/creation:", e);
        } finally {
            connection.release();
            process.exit();
        }
    } catch (e) {
        console.error("Connection failed:", e);
        process.exit(1);
    }
};

checkTables();
