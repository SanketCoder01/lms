const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function runMigration() {
    try {
        console.log('Starting migration: modifying calculation_type column...');

        // Verify connection
        const [rows] = await pool.execute('SELECT 1');
        console.log('Database connected.');

        // Alter the table
        await pool.execute(`
            ALTER TABLE projects 
            MODIFY COLUMN calculation_type VARCHAR(255) DEFAULT 'Super Area'
        `);

        console.log('Successfully modified calculation_type to VARCHAR(255).');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
