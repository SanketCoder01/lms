require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initDB() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        const dbName = process.env.DB_NAME || 'lms_db';
        console.log(`Creating database ${dbName} if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await connection.query(`USE \`${dbName}\`;`);

        const schemaPath = path.join(__dirname, '../schema.sql');
        console.log(`Reading schema from ${schemaPath}...`);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema script...');
        await connection.query(schemaSql);

        console.log('✅ Database initialized successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Initialization failed:', err);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

initDB();
