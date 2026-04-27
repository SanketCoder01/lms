require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../config/db');

const initPartyMaster = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to DB. Initializing Party Master tables...");

        try {
            // 1. Create parties table
            console.log("Creating parties table...");
            await connection.query(`
                CREATE TABLE IF NOT EXISTS parties (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    type ENUM('Individual', 'Company') NOT NULL DEFAULT 'Individual',
                    company_name VARCHAR(255),
                    title VARCHAR(50),
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    email VARCHAR(255),
                    phone VARCHAR(50),
                    alt_phone VARCHAR(50),
                    identification_type VARCHAR(50),
                    identification_number VARCHAR(100),
                    address_line1 VARCHAR(255),
                    address_line2 VARCHAR(255),
                    city VARCHAR(100),
                    state VARCHAR(100),
                    postal_code VARCHAR(20),
                    country VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log("Parties table created.");

            // 2. Create unit_ownerships table
            console.log("Creating unit_ownerships table...");
            await connection.query(`
                CREATE TABLE IF NOT EXISTS unit_ownerships (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    unit_id INT NOT NULL,
                    party_id INT NOT NULL,
                    ownership_status ENUM('Active', 'Inactive', 'Sold') NOT NULL DEFAULT 'Active',
                    start_date DATE,
                    end_date DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
                    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE
                )
            `);
            console.log("Unit Ownerships table created.");

        } catch (e) {
            console.error("Initialization error:", e);
        } finally {
            connection.release();
            process.exit();
        }
    } catch (e) {
        console.error("Connection error:", e);
        process.exit(1);
    }
};

initPartyMaster();
