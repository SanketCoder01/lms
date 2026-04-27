
const http = require('http');

const PORT = 5000;

function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/api' + path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    reject(e);
                }
            });
        });
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function verify() {
    try {
        console.log("--- Fetching KYC Stats ---");
        const stats = await request('GET', '/owners/stats');
        console.log("Stats:", stats.data);

        console.log("--- Fetching Owners ---");
        const owners = await request('GET', '/owners');
        if (owners.data.length === 0) {
            console.log("No owners."); return;
        }
        const target = owners.data[0];
        console.log(`Target Owner: ${target.name} (ID: ${target.id}, Status: ${target.kyc_status})`);

        console.log("--- Updating KYC Status to 'verified' ---");
        await request('PUT', `/owners/${target.id}`, { kyc_status: 'verified' });

        const check1 = await request('GET', `/owners/${target.id}`);
        console.log(`New Status: ${check1.data.owner.kyc_status}`);
        if (check1.data.owner.kyc_status === 'verified') console.log("✅ Update Verified SUCCESS");
        else console.log("❌ Update Verified FAILED");

        console.log("--- Updating KYC Status to 'rejected' ---");
        await request('PUT', `/owners/${target.id}`, { kyc_status: 'rejected' });

        const check2 = await request('GET', `/owners/${target.id}`);
        console.log(`New Status: ${check2.data.owner.kyc_status}`);
        if (check2.data.owner.kyc_status === 'rejected') console.log("✅ Update Rejected SUCCESS");
        else console.log("❌ Update Rejected FAILED");

    } catch (e) {
        console.error("Verification Error:", e);
    }
}

verify();
