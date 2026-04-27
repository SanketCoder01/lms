
require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
    try {
        console.log("Altering lease_escalations table...");
        const [rows] = await pool.query("SHOW COLUMNS FROM lease_escalations LIKE 'effective_to'");

        if (rows.length === 0) {
            await pool.query("ALTER TABLE lease_escalations ADD COLUMN effective_to DATE AFTER effective_from");
            console.log("Added effective_to column.");
        } else {
            console.log("Column effective_to already exists.");
        }
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        process.exit();
    }
}

migrate();
