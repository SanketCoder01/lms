
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
    return `test.user.${Math.floor(Math.random() * 10000)}@example.com`;
}

async function verify() {
    try {
        console.log("--- Creating New User ---");
        const newUser = {
            first_name: "Test",
            last_name: "User",
            email: generateRandomEmail(),
            password: "password123",
            role_name: "User"
        };
        const createRes = await request('POST', '/users', newUser);
        const userId = createRes.data.id;
        console.log(`User Created. ID: ${userId}`);

        console.log("--- Updating User (Change Password & Role) ---");
        await request('PUT', `/users/${userId}`, {
            first_name: "Test",
            last_name: "Updated",
            email: newUser.email,
            password: "newpassword456",
            role_name: "Admin",
            status: "active"
        });
        console.log("Update sent.");

        console.log("--- Verifying Update ---");
        const allUsers = await request('GET', '/users');
        const user = allUsers.data.find(u => u.id === userId);

        console.log(`Name: ${user.first_name} ${user.last_name} (Expected: Test Updated)`);
        console.log(`Role: ${user.role_name} (Expected: Admin)`);

        if (user.last_name === "Updated" && user.role_name === "Admin") {
            console.log("✅ Update Verification SUCCESS");
        } else {
            console.error("❌ Update Verification FAILED");
        }

        console.log("--- Searching User ---");
        const searchRes = await request('GET', `/users?search=${encodeURIComponent(newUser.email)}`);
        if (searchRes.data.some(u => u.id === userId)) {
            console.log("✅ Search Verification SUCCESS");
        } else {
            console.error("❌ Search Verification FAILED");
        }

    } catch (e) {
        console.error("Verification Error:", e);
    }
}

verify();
