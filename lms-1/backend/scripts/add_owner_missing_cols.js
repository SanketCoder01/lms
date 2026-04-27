require('dotenv').config();
const mysql = require('mysql2/promise');

const updateSchema = async () => {
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

        const columns = [
            "ADD COLUMN alternative_contact VARCHAR(50)",
            "ADD COLUMN total_owned_area DECIMAL(10,2) DEFAULT 0.00",
            "ADD COLUMN gst_number VARCHAR(100)"
        ];

        for (const col of columns) {
            try {
                await connection.query(`ALTER TABLE owners ${col}`);
                console.log(`✅ Executed: ${col}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ Column already exists: ${col}`);
                } else {
                    console.error(`❌ Error executing ${col}:`, err.message);
                }
            }
        }

    } catch (err) {
        console.error("Fatal Error:", err);
    } finally {
        if (connection) await connection.end();
    }
};

updateSchema();
