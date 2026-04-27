const pool = require('../config/db');

const checkSchema = async () => {
    try {
        const [rows] = await pool.query("SHOW COLUMNS FROM leases LIKE 'rent_model'");
        console.log("rent_model column definition:", rows);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkSchema();
