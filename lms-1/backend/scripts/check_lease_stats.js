const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Load env vars from backend/.env
const pool = require('../config/db');

const checkLeases = async () => {
    try {
        const [rows] = await pool.query(`
            SELECT id, status, created_at, updated_at, 
            DATE(updated_at) as date_updated, 
            CURDATE() as db_curdate,
            NOW() as db_now
            FROM leases 
            ORDER BY updated_at DESC 
            LIMIT 5
        `);
        console.log("Recent Leases:", rows);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkLeases();
