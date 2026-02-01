const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

console.log('DEBUG: DB_USER:', process.env.DB_USER);
console.log('DEBUG: DB_HOST:', process.env.DB_HOST);
console.log('DEBUG: DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Unset');

async function runMigration() {
    try {
        console.log('Starting migration: Adding calculation_type to projects table...');

        // Check if column exists
        const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'projects' 
      AND COLUMN_NAME = 'calculation_type'
    `);

        if (columns.length > 0) {
            console.log('Column calculation_type already exists. Skipping...');
        } else {
            await pool.execute(`
        ALTER TABLE projects 
        ADD COLUMN calculation_type ENUM('Super Area', 'Covered Area', 'Carpet Area') DEFAULT 'Super Area' AFTER project_type
      `);
            console.log('Successfully added calculation_type column.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
