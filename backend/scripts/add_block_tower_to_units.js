const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function migrate() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        console.log('Checking if block_tower column exists in units table...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'units' AND COLUMN_NAME = 'block_tower'
        `, [dbConfig.database]);

        if (columns.length === 0) {
            console.log('Adding block_tower column...');
            await connection.execute(`
                ALTER TABLE units 
                ADD COLUMN block_tower VARCHAR(50) AFTER floor_number
            `);
            console.log('Column added successfully.');
        } else {
            console.log('Column block_tower already exists.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
