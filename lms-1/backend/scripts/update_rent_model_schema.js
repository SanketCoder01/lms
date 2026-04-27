const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Load env vars from backend/.env
const pool = require('../config/db');

const updateSchema = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to DB.");

        try {
            console.log("Modifying leases table: rent_model to VARCHAR(50)...");
            await connection.query("ALTER TABLE leases MODIFY COLUMN rent_model VARCHAR(50) NOT NULL DEFAULT 'Fixed'");
            console.log("Successfully updated rent_model column.");
        } catch (e) {
            console.error("Error updating schema:", e);
        } finally {
            connection.release();
            process.exit();
        }
    } catch (e) {
        console.error("Connection error:", e);
        process.exit(1);
    }
};

updateSchema();
