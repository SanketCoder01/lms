
const http = require('http');

const PORT = 5000;

function request(method, path) {
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
        req.on('error', reject);
        req.end();
    });
}

async function verify() {
    try {
        console.log("--- Fetching All Tenants (No Search) ---");
        const all = await request('GET', '/tenants');
        console.log(`Total Tenants: ${all.data.length}`);

        if (all.data.length > 0) {
            const target = all.data[0];
            const name = target.company_name;
            const person = target.contact_person_name; // Should be available in DB

            console.log(`Testing Search for Company: "${name}"`);
            const searchRes = await request('GET', `/tenants?search=${encodeURIComponent(name.split(' ')[0])}`);
            const foundCo = searchRes.data.some(t => t.id === target.id);
            if (foundCo) console.log("✅ Search by Company Name: SUCCESS");
            else console.error("❌ Search by Company Name: FAILED");

            if (person) {
                console.log(`Testing Search for Contact Person: "${person}"`);
                const personRes = await request('GET', `/tenants?search=${encodeURIComponent(person.split(' ')[0])}`);
                const foundPerson = personRes.data.some(t => t.id === target.id);
                if (foundPerson) console.log("✅ Search by Contact Person: SUCCESS");
                else console.error("❌ Search by Contact Person: FAILED");
            } else {
                console.log("⚠️ No contact person name to test search.");
            }
        } else {
            console.log("⚠️ No tenants found to verify.");
        }

    } catch (e) {
        console.error("Verification Error:", e);
    }
}

verify();
