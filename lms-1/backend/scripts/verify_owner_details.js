
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
        console.log("--- Fetching All Owners to get an ID ---");
        const ownersRes = await request('GET', '/owners');

        if (ownersRes.data.length === 0) {
            console.log("No owners found. Creating one...");
            const createRes = await request('POST', '/owners', {
                name: "Debug Owner",
                email: "debug@test.com",
                phone: "9998887776"
            });
            console.log("Created owner, fetching list again.");
            // fetch again
        }

        const ownersRes2 = await request('GET', '/owners');
        const firstOwner = ownersRes2.data[0];
        console.log(`Testing with Owner ID: ${firstOwner.id}`);

        console.log("--- Fetching Owner Details ---");
        const detailRes = await request('GET', `/owners/${firstOwner.id}`);

        console.log("Response Status:", detailRes.status);
        console.log("Response Data Structure Keys:", Object.keys(detailRes.data));

        if (detailRes.data.owner) {
            console.log("✅ data.owner exists");
            console.log("Owner Name:", detailRes.data.owner.name);
        } else {
            console.error("❌ data.owner is MISSING");
            console.log("Full Response:", JSON.stringify(detailRes.data, null, 2));
        }

    } catch (error) {
        console.error("Verification Error:", error);
    }
}

verify();
