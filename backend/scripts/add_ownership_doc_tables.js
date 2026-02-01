const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lms_db'
};

async function migrate() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        // 1. Create ownership_document_types table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ownership_document_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Created ownership_document_types table.');

        // 2. Insert default types
        const defaultTypes = [
            'Allotment',
            'Allotment Letter',
            'SBA',
            'Purchase Agreement',
            'Possession Handover',
            'Conveyance Deed',
            'Sale Deed'
        ];

        for (const type of defaultTypes) {
            try {
                await connection.query('INSERT INTO ownership_document_types (name) VALUES (?)', [type]);
                console.log(`Inserted default type: ${type}`);
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log(`Type already exists: ${type}`);
                } else {
                    console.error(`Failed to insert type ${type}:`, err.message);
                }
            }
        }

        // 3. Create unit_ownership_documents table
        // Links a specific document upload to a specific unit-party ownership relation
        // We assume 'unit_ownerships' table exists (if not, we might need to check previous migrations, but context implies it exists)
        // Wait, checking schema.sql... 
        // schema.sql shows 'owner_units' and 'ownership_history' logic seems manually query based in controller.
        // Let's check ownershipController.js: it uses 'unit_ownerships' table.
        // Queries: 'INSERT INTO unit_ownerships (unit_id, party_id, start_date, ownership_status)...'

        // We need a way to link documents to the ownership record. 
        // Since unit_ownerships might not have a clean ID we can refer to easily if it's a many-to-many link table without a primary key? 
        // Let's verify unit_ownerships schema. It's not in schema.sql text I saw earlier... context might be missing it or it was created in a previous unrecorded step.
        // Assuming unit_ownerships exists. Does it have an ID? 
        // Usually link tables might not, but let's assume we can link by (unit_id, party_id).
        // Or better, let's add an ID to unit_ownerships if it doesn't have one, OR just link by unit_id and party_id.
        // To be safe and clean, I will create the document table linking to unit_id and party_id directly.

        await connection.query(`
            CREATE TABLE IF NOT EXISTS unit_ownership_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                unit_id INT NOT NULL,
                party_id INT NOT NULL,
                document_type_id INT,
                document_date DATE,
                file_path VARCHAR(255),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
                FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
                FOREIGN KEY (document_type_id) REFERENCES ownership_document_types(id) ON DELETE SET NULL
            )
        `);
        console.log('Created unit_ownership_documents table.');

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
