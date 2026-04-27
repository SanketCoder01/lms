const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function checkSchema() {
    try {
        console.log("--- DOCUMENT REPO ---");
        try {
            const [docs] = await pool.query("DESCRIBE document_repository");
            console.table(docs.map(col => ({ Field: col.Field, Type: col.Type })));
        } catch (e) { console.log("document_repository table missing"); }

        console.log("\n--- UNIT IMAGES ---");
        try {
            const [imgs] = await pool.query("DESCRIBE unit_images");
            console.table(imgs.map(col => ({ Field: col.Field, Type: col.Type })));
        } catch (e) { console.log("unit_images table missing"); }

        console.log("\n--- REPORTS (Virtual check) ---");
        // Reports are likely dynamic, so just checking if a 'reports' table exists if the controller uses one
        try {
            const [reps] = await pool.query("DESCRIBE reports");
            console.table(reps.map(col => ({ Field: col.Field, Type: col.Type })));
        } catch (e) { console.log("reports table missing (might be intended if generated on fly)"); }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkSchema();
