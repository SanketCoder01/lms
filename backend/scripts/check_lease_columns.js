const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

const checkColumns = async () => {
    try {
        const [rows] = await pool.query("SHOW COLUMNS FROM leases");
        console.log("Leases Columns:", rows.map(r => r.Field));
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkColumns();
