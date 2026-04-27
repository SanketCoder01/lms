const pool = require('../config/db');

async function splitBrandCategories() {
    try {
        const ownerCategories = [
            "Own Unit",
            "Group Company Unit"
        ];
        const tenantCategories = [
            "Anchor",
            "F&B",
            "Inline Stores"
        ];

        console.log("Adding Owner/Tenant Brand Categories to filter_options table...");

        // Insert Owner categories
        for (const option of ownerCategories) {
            const [rows] = await pool.query(`SELECT * FROM filter_options WHERE category = 'brand_category_owner' AND option_value = ?`, [option]);
            if (rows.length === 0) {
                await pool.query(`INSERT INTO filter_options (category, option_value) VALUES (?, ?)`, ['brand_category_owner', option]);
                console.log(`Added Owner Category: ${option}`);
            }
        }

        // Insert Tenant categories
        for (const option of tenantCategories) {
            const [rows] = await pool.query(`SELECT * FROM filter_options WHERE category = 'brand_category_tenant' AND option_value = ?`, [option]);
            if (rows.length === 0) {
                await pool.query(`INSERT INTO filter_options (category, option_value) VALUES (?, ?)`, ['brand_category_tenant', option]);
                console.log(`Added Tenant Category: ${option}`);
            }
        }

        // Cleanup the old general 'brand_category' items if we want, or just leave them.
        console.log("Seed complete.");
    } catch (err) {
        console.error("Error seeding brand categories:", err);
    } finally {
        process.exit(0);
    }
}

splitBrandCategories();
