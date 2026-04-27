
const pool = require('../config/db');

async function createTables() {
    try {
        console.log("Creating owner_documents table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS owner_documents (
              id INT AUTO_INCREMENT PRIMARY KEY,
              owner_id INT NOT NULL,
              document_type VARCHAR(100),
              document_path VARCHAR(255),
              status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
              uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
            );
        `);

        console.log("Creating owner_messages table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS owner_messages (
              id INT AUTO_INCREMENT PRIMARY KEY,
              owner_id INT NOT NULL,
              subject VARCHAR(255),
              message TEXT NOT NULL,
              is_read BOOLEAN DEFAULT FALSE,
              sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
            );
        `);

        console.log("✅ Tables created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create tables:", err);
        process.exit(1);
    }
}

createTables();
