const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function checkSchema() {
    try {
        console.log("--- LEASES ---");
        const [leases] = await pool.query("DESCRIBE leases");
        console.table(leases.map(col => ({ Field: col.Field, Type: col.Type })));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkSchema();
