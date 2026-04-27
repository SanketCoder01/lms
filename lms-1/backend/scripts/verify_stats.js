const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../config/db');

async function checkStats() {
    try {
        console.log("Checking dashboard stats...");

        const [projects] = await pool.execute("SELECT COUNT(*) as count FROM projects WHERE status = 'active'");
        console.log(`Active Projects: ${projects[0].count}`);

        const [units] = await pool.execute("SELECT COUNT(*) as count FROM units");
        console.log(`Total Units: ${units[0].count}`);

        const [leases] = await pool.execute("SELECT COUNT(*) as count FROM leases WHERE status = 'active'");
        console.log(`Active Leases: ${leases[0].count}`);

        if (projects[0].count === 0) {
            console.log("\n⚠️ No active projects found! Animation will start at 0 and stay at 0.");
            console.log("Adding a dummy project for visualization...");
            await pool.execute("INSERT INTO projects (project_name, status, type, location) VALUES ('Demo Project', 'active', 'Residential', 'City Center')");
            console.log("✅ Added 'Demo Project'. Refresh dashboard to see count rise to 1.");
        } else {
            console.log("\n✅ Data exists. Animation should be visible.");
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

checkStats();
