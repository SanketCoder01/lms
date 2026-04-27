
const http = require('http');

const PORT = 5000;

function request(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/api' + path,
            method: 'GET',
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
        req.end();
    });
}

async function verify() {
    try {
        console.log("--- Verifying Dashboard Stats ---");
        const res = await request('/dashboard/stats');

        console.log("Status Code:", res.status);
        if (res.status !== 200) {
            console.error("❌ Failed to fetch stats", res.data);
            return;
        }

        const stats = res.data.stats;
        console.log("Stats Received:", stats);

        if (stats.totalProjects > 0 || stats.totalUnits > 0) {
            console.log("✅ Stats are populated!");
        } else {
            console.log("⚠️ Stats are 0. (This might be correct if DB is empty, but verify if you expected data)");
        }

        // Check aliases
        if (res.data.upcomingRenewals && res.data.upcomingRenewals.length > 0) {
            const ren = res.data.upcomingRenewals[0];
            if (ren.lease_end_date) console.log("✅ Lease renewal alias `lease_end_date` is correct.");
            else console.error("❌ Lease renewal alias missing `lease_end_date`");
        }

    } catch (e) {
        console.error("Verification Error:", e);
    }
}

verify();
