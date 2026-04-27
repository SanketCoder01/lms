const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../config/db');

async function inspect() {
    try {
        const tables = [{ t: 'sub_tenants' }];
        console.log("Checking sub_tenants table...");

        for (const t of tables) {
            const tableName = Object.values(t)[0];
            const [columns] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
            console.log(`\nTable: ${tableName}`);
            columns.forEach(c => console.log(` - ${c.Field} (${c.Type})`));
        }
        process.exit(0);
    } catch (err) {
        console.error("DB Error:", err.message);
        process.exit(1);
    }
}

inspect();
