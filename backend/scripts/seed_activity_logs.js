require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const pool = require("../config/db");

const seedActivityLogs = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to database...");

        const dummyLogs = [
            {
                user_id: 1, // Assuming admin user exists with ID 1
                action: "User Login",
                module: "Auth",
                details: "User logged in successfully.",
                ip_address: "192.168.1.1"
            },
            {
                user_id: 1,
                action: "Project Created",
                module: "Projects",
                details: "Created new project 'Sunrise Heights'.",
                ip_address: "192.168.1.1"
            },
            {
                user_id: 1,
                action: "Lease Approved",
                module: "Leases",
                details: "Approved lease for Unit 101 at Sunrise Heights.",
                ip_address: "192.168.1.1"
            },
            {
                user_id: 1,
                action: "Tenant Updated",
                module: "Tenants",
                details: "Updated contact details for 'TechCorp Inc'.",
                ip_address: "192.168.1.1"
            },
            {
                user_id: 1,
                action: "Report Exported",
                module: "Reports",
                details: "Exported financial report for Q1 2026.",
                ip_address: "192.168.1.1"
            },
            {
                user_id: 1,
                action: "Settings Changed",
                module: "Settings",
                details: "Updated system theme color.",
                ip_address: "192.168.1.1"
            }
        ];

        console.log("Inserting dummy logs...");

        for (const log of dummyLogs) {
            await connection.query(
                `INSERT INTO activity_logs (user_id, action, module, details, ip_address) VALUES (?, ?, ?, ?, ?)`,
                [log.user_id, log.action, log.module, log.details, log.ip_address]
            );
        }

        console.log("✅ Dummy activity logs inserted successfully!");
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding activity logs:", error);
        process.exit(1);
    }
};

seedActivityLogs();
