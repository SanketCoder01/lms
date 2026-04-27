const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api/activity';

async function testActivityLogs() {
    try {
        console.log('Testing GET /activity-logs...');
        const res = await axios.get(`${API_URL}/activity-logs`);
        if (res.status === 200 && res.data.logs) {
            console.log(`✅ Success! Retrieved ${res.data.logs.length} logs.`);
            console.log(`Total logs: ${res.data.total}`);
        } else {
            console.error('❌ Failed to retrieve logs or invalid format.');
        }
    } catch (error) {
        console.error('❌ Error fetching logs:', error.message);
    }
}

async function testExport() {
    try {
        console.log('Testing GET /export...');
        const res = await axios.get(`${API_URL}/export`, { responseType: 'stream' });
        if (res.status === 200) {
            console.log('✅ Success! Export endpoint returned 200.');
            // Verify content type
            const contentType = res.headers['content-type'];
            if (contentType && contentType.includes('text/csv')) {
                console.log('✅ Content-Type is text/csv.');
            } else {
                console.warn('⚠️ Content-Type might be incorrect:', contentType);
            }
        } else {
            console.error('❌ Export failed with status:', res.status);
        }
    } catch (error) {
        console.error('❌ Error exporting logs:', error.message);
    }
}

async function run() {
    await testActivityLogs();
    await testExport();
}

run();
