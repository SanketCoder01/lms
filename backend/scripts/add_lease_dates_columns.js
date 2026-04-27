const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function addColumns() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        const columns = [
            "ADD COLUMN fitout_period_start DATE NULL",
            "ADD COLUMN notice_vacation_date DATE NULL",
            "ADD COLUMN opening_date DATE NULL",
            "ADD COLUMN rent_free_start_date DATE NULL",
            "ADD COLUMN rent_free_end_date DATE NULL",
            "ADD COLUMN loi_date DATE NULL",
            "ADD COLUMN agreement_date DATE NULL",
            "ADD COLUMN deposit_payment_date DATE NULL",
            "ADD COLUMN registration_date DATE NULL"
        ];

        for (const col of columns) {
            try {
                await connection.query(`ALTER TABLE leases ${col}`);
                console.log(`Executed: ${col}`);
            } catch (err) {
                // Ignore "Column already exists" errors (Error 1060)
                if (err.errno === 1060) {
                    console.log(`Skipped (Exists): ${col}`);
                } else {
                    console.error(`Error adding column: ${col}`, err.message);
                }
            }
        }

        console.log('Schema update complete.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

addColumns();
