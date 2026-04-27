const pool = require('../config/db');

async function check() {
    try {
        const [rows] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
            FROM information_schema.columns 
            WHERE table_schema = 'saifghl' 
              AND table_name = 'parties' 
              AND COLUMN_NAME = 'brand_category'
        `);
        console.log("SCHEMA:", rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
check();
