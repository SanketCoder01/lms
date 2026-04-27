
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

// Simple test flow
async function verify() {
    try {
        console.log("--- Fetching Leases ---");
        let allLeases = await request('GET', '/leases');
        if (allLeases.data.data) allLeases.data = allLeases.data.data; // Handle debug wrapper
        if (allLeases.data.debug_marker) console.log("✅ Server is FRESH (Debug Marker Found)");
        else console.log("⚠️ Server might be STALE (No Debug Marker)");

        console.log(`Total Leases: ${allLeases.data.length}`);

        if (allLeases.data.length > 0) {
            const sample = allLeases.data[0];
            const leaseId = sample.id;
            const tenantName = sample.tenant_name;
            const status = sample.status;

            console.log(`Testing with Sample Lease ID: ${leaseId}, Tenant: ${tenantName}, Status: ${status}`);

            console.log("--- Search by ID ---");
            const idRes = await request('GET', `/leases?search=${leaseId}`);
            if (idRes.data.some(l => l.id === leaseId)) {
                console.log("✅ Search by ID Matches");
            } else {
                console.error("❌ Search by ID Failed");
                console.log("Response Data:", JSON.stringify(idRes.data, null, 2));
            }

            if (tenantName) {
                console.log("--- Search by Tenant ---");
                const tenantRes = await request('GET', `/leases?search=${tenantName.split(' ')[0]}`); // search partial
                if (tenantRes.data.some(l => l.id === leaseId)) {
                    console.log("✅ Search by Tenant Name Matches");
                } else {
                    console.error("❌ Search by Tenant Name Failed");
                }
            }

            if (status) {
                console.log("--- Filter by Status ---");
                const statusRes = await request('GET', `/leases?status=${status}`);
                if (statusRes.data.every(l => l.status === status)) {
                    console.log("✅ Filter by Status Successful");
                } else {
                    console.error("❌ Filter by Status Failed - Found mixed statuses");
                }
            }

        } else {
            console.log("⚠️ No leases found to test search. Please add a lease first.");
        }

    } catch (err) {
        console.error("Verification Error:", err);
    }
}

verify();
