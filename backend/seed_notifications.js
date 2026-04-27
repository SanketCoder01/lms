const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./config/db');

const notifications = [
    {
        title: 'Urgent: Action Required on Lease L-2024-8811',
        message: 'Financial documentation for TechFlow Systems • Unit 402 is missing a signature. Please re-upload before the lease expires in 48 hours.',
        type: 'urgent'
    },
    {
        title: 'Scheduled Maintenance: Sunday, Oct 27',
        message: 'The Lease Management portal will be offline for routine maintenance from 02:00 AM to 04:00 AM EST. Reports generation may be delayed.',
        type: 'info'
    },
    {
        title: 'Lease Approved: L-2024-8791',
        message: 'Tenant: Heritage Antiques • Suite 128 has been successfully approved by Marcus Reed.',
        type: 'success'
    },
    {
        title: 'New Review Request',
        message: 'Sarah Chen has submitted a new lease application for Urban Studio • Unit 105. Estimated review time: 4.2 hours.',
        type: 'review'
    },
    {
        title: 'Lease Rejected: L-2024-8792',
        message: 'Reason: Incomplete tenant disclosure. Please notify the property manager for Heritage Antiques.',
        type: 'error'
    }
];

const seedNotifications = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to DB, seeding notifications...");

        // Clear existing
        await connection.query("DELETE FROM notifications");

        // Insert new
        for (const n of notifications) {
            // Note: we are storing 'type' in 'title' prefix or just retrieving it heuristically later
            // asking to alter table might be risky if live. 
            // Schema doesn't have 'type'.
            // I will emulate type storage in message or title if needed, or just insert as is.
            // Wait, I can try to ALTER TABLE to add type.
            try {
                await connection.query("ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT 'info'");
                console.log("Added 'type' column to notifications table.");
            } catch (e) {
                // Column likely exists or error
            }

            await connection.query(
                "INSERT INTO notifications (title, message, type, is_read) VALUES (?, ?, ?, ?)",
                [n.title, n.message, n.type, false]
            );
        }

        console.log("✅ Notifications seeded successfully!");
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error("Seed error:", error);
        process.exit(1);
    }
};

seedNotifications();
