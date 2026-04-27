
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

function generateRandomEmail() {
    return `log.test.${Math.floor(Math.random() * 10000)}@example.com`;
}

async function verify() {
    try {
        console.log("--- Generating Actions for Logs ---");
        const newUser = {
            first_name: "Log",
            last_name: "Generator",
            email: generateRandomEmail(),
            password: "password123",
            role_name: "User"
        };

        // 1. Create System User (should trigger log)
        const createRes = await request('POST', '/users', newUser);
        const userId = createRes.data.id;
        console.log(`Action: Created User ID ${userId}`);

        // 2. Update User (should trigger log)
        await request('PUT', `/users/${userId}`, {
            first_name: "Log",
            last_name: "Generator Updated",
            email: newUser.email,
            password: "",
            role_name: "User",
            status: "active"
        });
        console.log(`Action: Updated User ID ${userId}`);

        console.log("--- Verifying Logs ---");
        // Give DB a split second to persist
        await new Promise(r => setTimeout(r, 1000));

        const logsRes = await request('GET', '/activity-logs?limit=5');
        const logs = logsRes.data.logs;

        console.log(`Logs Found: ${logs.length}`);

        const createdLog = logs.find(l => l.action === "Created User" && l.details.includes(newUser.email));
        const updatedLog = logs.find(l => l.action === "Updated User" && l.details.includes(userId.toString()));

        if (createdLog) console.log("✅ 'Created User' Log found");
        else console.error("❌ 'Created User' Log NOT found");

        if (updatedLog) console.log("✅ 'Updated User' Log found");
        else console.error("❌ 'Updated User' Log NOT found");

    } catch (e) {
        console.error("Verification Error:", e);
    }
}

verify();
