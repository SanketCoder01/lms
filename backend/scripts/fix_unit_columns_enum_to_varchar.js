require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'lease_management_system'
        });

        await conn.execute("ALTER TABLE units MODIFY COLUMN unit_condition VARCHAR(100) DEFAULT 'bare_shell'");
        console.log('✅ unit_condition changed to VARCHAR(100)');

        await conn.execute("ALTER TABLE units MODIFY COLUMN plc VARCHAR(100) DEFAULT NULL");
        console.log('✅ plc changed to VARCHAR(100)');

        console.log('🎉 Migration complete!');
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

main();
