const axios = require('axios');

async function checkBackend() {
    try {
        const response = await axios.get('http://localhost:5000/api/health');
        console.log('Backend status:', response.data);
    } catch (error) {
        console.error('Backend check failed:', error.message);
    }
}

checkBackend();
