const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function runMigration() {
    try {
        console.log('Starting migration: Adding block_tower to units table...');

        // Check if column exists
        const [columns] = await pool.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'units' 
            AND COLUMN_NAME = 'block_tower'
        `);

        if (columns.length > 0) {
            console.log('Column block_tower already exists. Skipping...');
        } else {
            await pool.execute(`
                ALTER TABLE units 
                ADD COLUMN block_tower VARCHAR(50) DEFAULT NULL AFTER floor_number
            `);
            console.log('Successfully added block_tower column.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
