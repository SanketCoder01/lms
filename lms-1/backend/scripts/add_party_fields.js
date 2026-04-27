require('dotenv').config({ path: '../.env' }); // Load .env from parent directory
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

        // Add brand_name
        try {
            await connection.query(`ALTER TABLE parties ADD COLUMN brand_name VARCHAR(255) NULL AFTER company_name`);
            console.log('Added brand_name column.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('brand_name column already exists.');
            } else {
                throw err;
            }
        }

        // Add legal_entity_type
        try {
            await connection.query(`ALTER TABLE parties ADD COLUMN legal_entity_type VARCHAR(100) NULL AFTER brand_name`);
            console.log('Added legal_entity_type column.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('legal_entity_type column already exists.');
            } else {
                throw err;
            }
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
