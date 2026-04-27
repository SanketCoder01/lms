require('dotenv').config({ path: '../.env' }); // Ensure env vars are loaded from backend root
const pool = require('../config/db');

async function fixSchema() {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to database...");

        try {
            // 1. Create documents table if not exists
            console.log("Checking/Creating documents table...");
            await connection.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          project_id INT,
          category VARCHAR(100) DEFAULT 'General',
          file_path VARCHAR(255) NOT NULL,
          uploaded_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
          FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
            console.log("✅ Documents table checked/created.");

            // 2. Check if leases table has lease_id, if not, we can't add it easily with data, 
            // but we will rely on changing the code to use 'id' instead.

        } catch (err) {
            console.error("Schema fix failed:", err);
        } finally {
            connection.release();
            process.exit();
        }
    } catch (err) {
        console.error("Connection failed:", err);
        process.exit(1);
    }
}

fixSchema();
