
const pool = require('./config/db');

async function checkData() {
    try {
        const [notifications] = await pool.query("SELECT * FROM notifications");
        console.log("--- Notifications ---");
        console.log(`Count: ${notifications.length}`);
        console.log(notifications);

        const [leases] = await pool.query(`
            SELECT id, lease_end, status 
            FROM leases 
            WHERE status = 'active' 
            AND lease_end BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
        `);
        console.log("\n--- Active Leases Ending in 90 Days ---");
        console.table(leases);

        const [escalations] = await pool.query(`
            SELECT * FROM lease_escalations 
            WHERE effective_from BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
        `);
        console.log("\n--- Escalations in 90 Days ---");
        console.table(escalations);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

checkData();
