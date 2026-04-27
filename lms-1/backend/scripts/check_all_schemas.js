const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function checkSchema() {
    try {
        console.log("--- OWNERS ---");
        const [owners] = await pool.query("DESCRIBE owners");
        console.table(owners.map(col => ({ Field: col.Field, Type: col.Type })));

        console.log("\n--- TENANTS ---");
        const [tenants] = await pool.query("DESCRIBE tenants");
        console.table(tenants.map(col => ({ Field: col.Field, Type: col.Type })));

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkSchema();
