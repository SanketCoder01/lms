require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../config/db');

async function run() {
  try {
    console.log('Running migration...');
    const conn = await db.getConnection();
    
    // update projects calculation_type
    try {
      await conn.query("ALTER TABLE projects MODIFY COLUMN calculation_type VARCHAR(50) DEFAULT 'Chargeable Area'");
      console.log('projects table calculation_type updated to VARCHAR.');
    } catch(e) { console.error('Error on projects:', e.message); }
    
    // rename super_area in units table
    try {
      await conn.query("ALTER TABLE units RENAME COLUMN super_area TO chargeable_area");
      console.log('units table super_area renamed to chargeable_area.');
    } catch(e) { console.error('Error on units (maybe already renamed):', e.message); }
    
    conn.release();
  } catch(e) { console.error('Overall Error:', e.message); }
  process.exit();
}
run();
