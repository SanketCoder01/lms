const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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

        console.log('Altering unit_condition to VARCHAR(100)...');
        await connection.execute(`
            ALTER TABLE units 
            MODIFY COLUMN unit_condition VARCHAR(100) NULL DEFAULT 'bare_shell'
        `);
        console.log('unit_condition altered successfully.');

        console.log('Altering plc to VARCHAR(100)...');
        await connection.execute(`
            ALTER TABLE units 
            MODIFY COLUMN plc VARCHAR(100) NULL
        `);
        console.log('plc altered successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
