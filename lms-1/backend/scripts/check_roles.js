
const pool = require('../config/db');

async function check() {
    try {
        const [rows] = await pool.query("SELECT * FROM roles");
        console.log("Roles Count:", rows.length);
        console.log("Roles:", rows.map(r => r.role_name).join(", "));
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
