require('dotenv').config();
const pool = require('./config/db');

(async () => {
    try {
        console.log("Checking roles...");
        const conn = await pool.getConnection();
        const [rows] = await conn.query("DESCRIBE roles");
        console.log("Schema:", rows);
        const [data] = await conn.query("SELECT * FROM roles");
        console.log("Data:", data);
        conn.release();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
