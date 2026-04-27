const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

(async () => {
    try {
        console.log("Adding share_percentage to unit_ownerships...");
        const connection = await db.getConnection();

        const queries = [
            "ALTER TABLE unit_ownerships ADD COLUMN share_percentage DECIMAL(5,2) DEFAULT 100.00;",
            "DELETE FROM ownership_document_types WHERE name = 'Possession Handover';"
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
