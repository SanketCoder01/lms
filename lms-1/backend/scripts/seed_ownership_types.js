const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' }); // Adjust path if needed

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'lms_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const types = [
    'Allotment Letter',
    'SBA',
    'Purchase Agreement',
    'Possession Handover',
    'Conveyance Deed',
    'Sale Deed'
];

async function seedTypes() {
    try {
        console.log('Checking and seeding document types...');
        const [existing] = await pool.query('SELECT name FROM ownership_document_types');
        const existingNames = existing.map(e => e.name);

        for (const type of types) {
            if (!existingNames.includes(type)) {
                await pool.query('INSERT INTO ownership_document_types (name) VALUES (?)', [type]);
                console.log(`Added: ${type}`);
            } else {
                console.log(`Exists: ${type}`);
            }
        }
        console.log('Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding types:', err);
        process.exit(1);
    }
}

seedTypes();
