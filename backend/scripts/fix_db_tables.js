const db = require('../config/db');

(async () => {
    try {
        console.log("Starting Schema Fix...");
        const connection = await db.getConnection();

        // 1. unit_ownerships
        await connection.query(`
            CREATE TABLE IF NOT EXISTS unit_ownerships (
                id INT AUTO_INCREMENT PRIMARY KEY,
                unit_id INT NOT NULL,
                party_id INT NOT NULL,
                ownership_status ENUM('Active', 'Inactive', 'Sold') DEFAULT 'Active',
                start_date DATE,
                end_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                KEY unit_idx (unit_id),
                KEY party_idx (party_id)
            )
        `);
        console.log("Checked/Created unit_ownerships");

        // 2. lease_escalations
        await connection.query(`
            CREATE TABLE IF NOT EXISTS lease_escalations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lease_id INT NOT NULL,
                sequence_no INT,
                effective_from DATE,
                effective_to DATE,
                increase_type ENUM('Percentage', 'Fixed Amount') DEFAULT 'Percentage',
                value DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                KEY lease_idx (lease_id)
            )
        `);
        console.log("Checked/Created lease_escalations");

        // 3. Check leases column 'monthly_rent'
        const [leaseCols] = await connection.query("SHOW COLUMNS FROM leases LIKE 'monthly_rent'");
        if (leaseCols.length === 0) {
            console.log("Adding monthly_rent to leases...");
            await connection.query("ALTER TABLE leases ADD COLUMN monthly_rent DECIMAL(15,2) DEFAULT 0");
        } else {
            console.log("leases.monthly_rent exists");
        }

        connection.release();
        console.log("Schema Fix Complete.");
        process.exit(0);
    } catch (err) {
        console.error("Schema Fix Failed:", err);
        process.exit(1);
    }
})();
