
const pool = require('../config/db');

async function check() {
    try {
        const [rows] = await pool.query("SHOW TABLES LIKE 'lease_escalations'");
        console.log("Table exists:", rows.length > 0);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
