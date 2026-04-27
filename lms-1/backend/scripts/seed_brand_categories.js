const pool = require('../config/db');

async function seedBrandCategories() {
    try {
        const categories = [
            "own unit",
            "Group Company Unit",
            "Anchor",
            "F&B",
            "Inline Sotres"
        ];

        console.log("Adding Brand Categories to filter_options table...");

        for (const option of categories) {
            const [rows] = await pool.query(`SELECT * FROM filter_options WHERE category = 'brand_category' AND option_value = ?`, [option]);
            if (rows.length === 0) {
                await pool.query(`INSERT INTO filter_options (category, option_value) VALUES (?, ?)`, ['brand_category', option]);
                console.log(`Added Brand Category: ${option}`);
            }
        }

        console.log("Seed complete.");
    } catch (err) {
        console.error("Error seeding brand categories:", err);
    } finally {
        process.exit(0);
    }
}

seedBrandCategories();
