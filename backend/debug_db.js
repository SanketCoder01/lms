require('dotenv').config();
const pool = require('./config/db');

(async () => {
    try {
        console.log("Attempting to connect...");
        const connection = await pool.getConnection();
        console.log("✅ Connected!");

        console.log("\n--- TABLES ---");
        const [tables] = await connection.query("SHOW TABLES");
        console.log(tables);

        console.log("\n--- USERS SCHEMA ---");
        try {
            const [columns] = await connection.query("DESCRIBE users");
            console.log(columns);
        } catch (e) {
            console.error("❌ Could not describe users table:", e.message);
        }

        console.log("\n--- TEST QUERY ---");
        try {
            const [rows] = await connection.query("SELECT * FROM users LIMIT 1");
            console.log("User Row Sample:", rows);
        } catch (e) {
            console.error("❌ Query failed:", e.message);
        }

        connection.release();
        process.exit(0);
    } catch (err) {
        console.error("❌ FATAL ERROR:", err);
        process.exit(1);
    }
})();
