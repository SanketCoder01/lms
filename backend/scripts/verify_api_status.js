const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function verifyEndpoints() {
    console.log("Checking API Endpoints...");

    const endpoints = [
        { name: 'Tenants', url: `${BASE_URL}/tenants` },
        { name: 'Owners', url: `${BASE_URL}/owners` },
        { name: 'Users', url: `${BASE_URL}/users` },
        { name: 'Projects', url: `${BASE_URL}/projects` },
        { name: 'Units', url: `${BASE_URL}/units` },

        // Stats endpoints
        { name: 'KYC Stats', url: `${BASE_URL}/owners/stats` },
    ];

    for (const ep of endpoints) {
        try {
            const res = await axios.get(ep.url);
            console.log(`✅ ${ep.name}: OK (Status ${res.status}) - Records: ${Array.isArray(res.data) ? res.data.length : 'Object'}`);
        } catch (err) {
            console.error(`❌ ${ep.name}: FAILED - ${err.message}`);
            if (err.response) {
                console.error(`   Status: ${err.response.status}`);
                console.error(`   Data:`, err.response.data);
            }
        }
    }
}

verifyEndpoints();
