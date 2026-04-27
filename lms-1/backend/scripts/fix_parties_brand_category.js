const pool = require('../config/db');

async function fixPartiesTable() {
    try {
        console.log("Checking columns in parties table...");
        const [columns] = await pool.query(`SHOW COLUMNS FROM parties`);
        const colNames = columns.map(c => c.Field);
        
        if (!colNames.includes('brand_category')) {
            console.log("Adding brand_category column...");
            await pool.query(`ALTER TABLE parties ADD COLUMN brand_category VARCHAR(100)`);
        } else {
            console.log("brand_category exists. Changing to VARCHAR(100) to ensure it's not strictly ENUM...");
            await pool.query(`ALTER TABLE parties MODIFY COLUMN brand_category VARCHAR(100)`);
        }
        
        console.log("Success! brand_category is correctly configured as dynamic text.");
    } catch (err) {
        console.error("Error fixing parties table:", err);
    } finally {
        process.exit(0);
    }
}
fixPartiesTable();
