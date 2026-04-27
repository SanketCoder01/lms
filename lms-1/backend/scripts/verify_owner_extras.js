
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
        console.log("--- Fetching All Owners ---");
        const ownersRes = await request('GET', '/owners');
        if (ownersRes.data.length === 0) {
            console.log("No owners found. Please create one first.");
            return;
        }
        const ownerId = ownersRes.data[0].id;
        console.log(`Using Owner ID: ${ownerId}`);

        console.log("--- Testing Send Message ---");
        const msgRes = await request('POST', `/owners/${ownerId}/message`, {
            subject: "Test Message",
            message: "This is a test message from verification script."
        });
        console.log("Send Message Result:", msgRes);

        console.log("--- Testing Get Documents ---");
        const docRes = await request('GET', `/owners/${ownerId}/documents`);
        console.log("Get Documents Result (Expect Empty Array if new):", docRes.data);

        console.log("✅ Owner Extras Verification Complete");

    } catch (error) {
        console.error("Verification Error:", error);
    }
}

verify();
