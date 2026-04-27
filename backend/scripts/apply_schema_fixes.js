require('dotenv').config();
const mysql = require('mysql2/promise');

const applyFixes = async () => {
    let connection;
    try {
        console.log("Connecting to database...");
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'lms_db'
        });
        console.log("Connected.");

        // 1. Add kyc_status to owners
        try {
            console.log("Adding kyc_status to owners...");
            await connection.query(`
                ALTER TABLE owners 
                ADD COLUMN kyc_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending'
            `);
            console.log("✅ Added kyc_status to owners.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ kyc_status already exists in owners.");
            } else {
                console.error("❌ Error adding kyc_status to owners:", err.message);
            }
        }

        // 2. Add kyc_status to tenants
        try {
            console.log("Adding kyc_status to tenants...");
            await connection.query(`
                ALTER TABLE tenants 
                ADD COLUMN kyc_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending'
            `);
            console.log("✅ Added kyc_status to tenants.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ kyc_status already exists in tenants.");
            } else {
                console.error("❌ Error adding kyc_status to tenants:", err.message);
            }
        }

    } catch (err) {
        console.error("Fatal Error:", err);
    } finally {
        if (connection) await connection.end();
    }
};

applyFixes();
