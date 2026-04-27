const dotenv = require('dotenv');
const result = dotenv.config();

console.log("Dotenv loaded:", result.parsed);
console.log("DB_USER from env:", process.env.DB_USER);
console.log("DB_PASSWORD from env:", process.env.DB_PASSWORD);
console.log("DATABASE_URL from env:", process.env.DATABASE_URL);

if (!process.env.DB_USER) {
    console.error("❌ DB_USER is missing or empty!");
} else {
    console.log("✅ DB_USER is set.");
}
