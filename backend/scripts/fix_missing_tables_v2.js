const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');
const fs = require('fs');

async function createTables() {
    try {
        const connection = await pool.getConnection();

        // 1. Create documents table
        console.log("Creating documents table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                entity_type ENUM('project', 'unit', 'tenant', 'lease') NOT NULL,
                entity_id INT,
                document_type VARCHAR(50),
                file_path VARCHAR(255) NOT NULL,
                uploaded_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Create unit_images table
        console.log("Creating unit_images table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS unit_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                unit_id INT NOT NULL,
                image_path VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
            )
        `);

        // 3. Ensure uploads directory exists
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
            console.log("Created uploads directory at", uploadDir);
        } else {
            console.log("Uploads directory exists.");
        }

        console.log("Tables created successfully.");
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error("Error creating tables:", err);
        process.exit(1);
    }
}

createTables();
