const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function checkSchema() {
    try {
        console.log('Checking table schemas...');
        const [unitsCols] = await pool.execute('DESCRIBE units');
        console.log('UNITS Table:', unitsCols.map(c => `${c.Field} (${c.Type})`).join(', '));

        const [imagesCols] = await pool.execute('DESCRIBE unit_images');
        console.log('UNIT_IMAGES Table:', imagesCols.map(c => `${c.Field} (${c.Type})`).join(', '));

        process.exit(0);
    } catch (error) {
        console.error('Schema check failed:', error);
        process.exit(1);
    }
}

checkSchema();
