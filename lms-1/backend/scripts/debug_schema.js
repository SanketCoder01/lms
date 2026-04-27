const db = require('../config/db');

(async () => {
    try {
        console.log("Connected path loaded. Getting connection...");
        const connection = await db.getConnection();
        console.log("Connection acquired.");

        const tables = ['unit_ownerships', 'leases', 'projects', 'units', 'lease_escalations'];
        for (const table of tables) {
            try {
                const [columns] = await connection.query(`SHOW COLUMNS FROM ${table}`);
                console.log(`\n--- ${table} ---`);
                console.log(columns.map(c => `${c.Field} (${c.Type})`).join(', '));
            } catch (err) {
                console.log(`\n--- ${table} ---`);
                console.log("ERROR: " + err.message);
            }
        }

        connection.release();
        process.exit(0);
    } catch (err) {
        console.error("Fatal error:", err);
        process.exit(1);
    }
})();
