const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

(async () => {
    try {
        console.log("Adding new fields to units and leases...");
        const connection = await db.getConnection();

        const queries = [
            "ALTER TABLE units ADD COLUMN unit_category VARCHAR(100);",
            "ALTER TABLE units ADD COLUMN unit_zoning_type VARCHAR(100);",
            "ALTER TABLE leases ADD COLUMN premium_on_lease DECIMAL(10,2) DEFAULT 0;",
            "ALTER TABLE leases ADD COLUMN monthly_net_sales DECIMAL(15,2) DEFAULT 0;"
        ];

        for (const q of queries) {
            try {
                await connection.query(q);
                console.log("Executed:", q);
            } catch (e) {
                console.log("Skip:", e.message);
            }
        }

        connection.release();
        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
