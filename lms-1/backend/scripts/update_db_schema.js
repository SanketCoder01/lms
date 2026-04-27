
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

async function updateSchema() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const schema = `
            CREATE TABLE IF NOT EXISTS owner_units (
              id INT AUTO_INCREMENT PRIMARY KEY,
              owner_id INT NOT NULL,
              unit_id INT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
              FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
              UNIQUE KEY unique_owner_unit (owner_id, unit_id)
            );
        `;

        await connection.query(schema);
        console.log('Schema updated: owner_units table created.');

    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        if (connection) await connection.end();
    }
}

updateSchema();
