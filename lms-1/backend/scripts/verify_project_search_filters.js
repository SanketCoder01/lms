
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
        const testName = `SearchTest_${unique}`;
        const testLocation = `Loc_${unique}`;
        const testType = 'Residential';

        console.log("Creating Project...");
        const createRes = await request('POST', '/projects', {
            project_name: testName,
            location: testLocation,
            project_type: testType,
            total_floors: 5,
            description: "Test Description"
        });
        const projectId = createRes.data.id;
        console.log(`Created Project ID: ${projectId}`);

        console.log("--- Testing Search ---");
        const searchRes = await request('GET', `/projects?search=${testName}`);
        if (searchRes.data.some(p => p.id === projectId)) {
            console.log("✅ Search by Name: SUCCESS");
        } else {
            console.error("❌ Search by Name: FAILED");
        }

        console.log("--- Testing Filter Location ---");
        const locRes = await request('GET', `/projects?location=${testLocation}`);
        if (locRes.data.some(p => p.id === projectId)) {
            console.log("✅ Filter by Location: SUCCESS");
        } else {
            console.error("❌ Filter by Location: FAILED");
        }

        console.log("--- Testing Filter Type ---");
        const typeRes = await request('GET', `/projects?type=${testType}`);
        if (typeRes.data.some(p => p.id === projectId)) {
            console.log("✅ Filter by Type: SUCCESS");
        } else {
            console.error("❌ Filter by Type: FAILED"); // Note: might fail if pagination not handled but getProjects returns all currently
        }

    } catch (error) {
        console.error("Verification Error:", error);
    }
}

verify();
