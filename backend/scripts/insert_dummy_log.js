const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function insertDummyLog() {
    try {
        console.log("Connecting to database...");

        // 1. Get a user ID (optional, but good for realism)
        const [users] = await pool.query("SELECT id FROM users LIMIT 1");
        const userId = users.length > 0 ? users[0].id : null;
        console.log("Using User ID:", userId);

        // 2. Insert dummy log
        const action = "Dummy Action";
        const module = "System";
        const details = "This is a dummy activity log entry inserted via script.";
        const ip = "127.0.0.1";

        const [result] = await pool.query(
            "INSERT INTO activity_logs (user_id, action, module, details, ip_address) VALUES (?, ?, ?, ?, ?)",
            [userId, action, module, details, ip]
        );

        console.log("✅ Dummy log inserted successfully!");
        console.log("Insert ID:", result.insertId);

    } catch (err) {
        console.error("❌ Error inserting dummy log:", err);
    } finally {
        await pool.end();
        process.exit();
    }
}

insertDummyLog();
