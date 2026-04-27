
const http = require('http');

const PORT = 5000;

// Helper for HTTP requests
function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ status: res.statusCode, data: parsed });
                    } else {
                        reject({ status: res.statusCode, data: parsed });
                    }
                } catch (e) {
                    reject({ status: res.statusCode, error: 'Invalid JSON response', body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function verify() {
    try {
        const unique = Date.now();
        const name = `Owner_${unique}`;
        const email = `owner${unique}@test.com`;

        console.log("Creating Owner...");
        const createRes = await request('POST', '/owners', {
            name: name,
            email: email,
            phone: '1234567890',
            address: 'Test Address'
        });

        console.log("Owner Created.");

        console.log("--- Testing Search by Name ---");
        const nameRes = await request('GET', `/owners?search=${name}`);
        if (nameRes.data.some(o => o.name === name)) {
            console.log("✅ Search by Name: SUCCESS");
        } else {
            console.error("❌ Search by Name: FAILED");
        }

        console.log("--- Testing Search by Email ---");
        const emailRes = await request('GET', `/owners?search=${email}`);
        if (emailRes.data.some(o => o.email === email)) {
            console.log("✅ Search by Email: SUCCESS");
        } else {
            console.error("❌ Search by Email: FAILED");
        }

    } catch (error) {
        console.error("Verification Error:", error);
    }
}

verify();
