require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lms_db',
};

async function fixSchema() {
    let connection;
    try {
        console.log("Connecting...");
        connection = await mysql.createConnection(dbConfig);

        console.log("Checking columns...");
        const [cols] = await connection.query("DESCRIBE activity_logs");
        const colNames = cols.map(c => c.Field);

        if (!colNames.includes('details')) {
            console.log("Adding 'details' column...");
            await connection.query("ALTER TABLE activity_logs ADD COLUMN details TEXT");
        } else {
            console.log("'details' already exists.");
        }

        if (!colNames.includes('ip_address')) {
            console.log("Adding 'ip_address' column...");
            await connection.query("ALTER TABLE activity_logs ADD COLUMN ip_address VARCHAR(45)");
        } else {
            console.log("'ip_address' already exists.");
        }

        console.log("Schema update complete.");

    } catch (e) {
        console.error("Schema update failed:", e);
    } finally {
        if (connection) await connection.end();
    }
}

fixSchema();
