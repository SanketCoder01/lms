require("dotenv").config();
const pool = require("./config/db");

async function seedRoles() {
    try {
        const roles = ["Super Admin", "Admin", "User", "Manager", "Lease Manager"];
        for (const role of roles) {
            const [exists] = await pool.query("SELECT id FROM roles WHERE role_name = ?", [role]);
            if (exists.length === 0) {
                await pool.query("INSERT INTO roles (role_name) VALUES (?)", [role]);
                console.log(`Created role: ${role}`);
            }
        }
        console.log("Roles seeded.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedRoles();
