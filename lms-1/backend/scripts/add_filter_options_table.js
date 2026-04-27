require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../config/db');

async function run() {
  try {
    const conn = await db.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS filter_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        option_value VARCHAR(255) NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_option (category, option_value)
      )
    `);
    
    // Seed initial data
    const seedQuery = `INSERT IGNORE INTO filter_options (category, option_value) VALUES ?`;
    const seedData = [
      ['project_type', 'RETAIL/SHOP'],
      ['project_type', 'Commercial'],
      ['project_type', 'Industrial'],
      ['project_type', 'Mixed Use'],
      ['unit_condition', 'fully_fitted'],
      ['unit_condition', 'semi_fitted'],
      ['unit_condition', 'bare_shell'],
      ['plc', 'front_facing'],
      ['plc', 'corner'],
      ['plc', 'park_facing'],
      ['plc', 'road_facing'],
      ['lease_status', 'draft'],
      ['lease_status', 'approved'],
      ['lease_status', 'active'],
      ['lease_status', 'expired'],
      ['lease_status', 'terminated']
    ];
    
    await conn.query(seedQuery, [seedData]);
    console.log('Filter Options table created and seeded');
    conn.release();
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
  process.exit();
}
run();
