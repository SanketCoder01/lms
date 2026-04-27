require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    const dbConfig = process.env.DATABASE_URL ? {
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    } : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };

    const connection = await mysql.createConnection(dbConfig);
    
    try {
        console.log("Adding party_type to parties...");
        try { await connection.query("ALTER TABLE parties ADD COLUMN party_type VARCHAR(255);"); } catch(e) {}
        console.log("Migration successful!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.end();
    }
}

migrate();
