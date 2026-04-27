require("dotenv").config();
const pool = require("./config/db");

async function checkDB() {
    try {
        const [columns] = await pool.query("SHOW COLUMNS FROM users");
        console.log("USERS TABLE COLUMNS:", columns.map(c => c.Field));

        const [users] = await pool.query("SELECT * FROM users");
        console.log("EXISTING USERS:", users);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDB();
