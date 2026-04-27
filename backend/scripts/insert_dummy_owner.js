const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function insertDummyOwner() {
    try {
        console.log("Checking if owners exist...");
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM owners");
        if (rows[0].count > 0) {
            console.log("Owners already exist. Count:", rows[0].count);
        } else {
            console.log("No owners found. Inserting dummy owner...");
            const dummyOwner = [
                'John Doe', 'john@example.com', '1234567890',
                'Doe Holdings', 'TAX123', 'Pending', new Date()
            ];
            await pool.query(
                `INSERT INTO owners (name, email, phone, company_name, tax_id, kyc_status, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                dummyOwner
            );
            console.log("Dummy owner inserted: John Doe");
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

insertDummyOwner();
