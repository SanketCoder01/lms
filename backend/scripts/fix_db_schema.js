const pool = require('../config/db');

const fixSchema = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to DB. Fixing schema...");

        try {
            // 1. Re-create DOCUMENTS table to match Controller expectations
            console.log("Dropping old documents table...");
            await connection.query("DROP TABLE IF EXISTS documents");

            console.log("Creating new documents table...");
            await connection.query(`
        CREATE TABLE documents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          entity_type ENUM('project', 'unit', 'tenant', 'owner') NOT NULL DEFAULT 'project',
          entity_id INT,
          document_type VARCHAR(100),
          file_path VARCHAR(255) NOT NULL,
          uploaded_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            console.log("Documents table created.");

            // 2. Check leases table columns to be sure
            const [columns] = await connection.query("SHOW COLUMNS FROM leases");
            const columnNames = columns.map(c => c.Field);
            console.log("Leases table columns:", columnNames.join(', '));

            // If lease_start/lease_end exists vs term_start/term_end
            // I'll update the controller to match the DB, assuming DB (schema.sql) is the truth.
            // schema.sql says: lease_start, lease_end.

        } catch (e) {
            console.error("Schema fix error:", e);
        } finally {
            connection.release();
            process.exit();
        }
    } catch (e) {
        console.error("Connection error:", e);
        process.exit(1);
    }
};

fixSchema();
