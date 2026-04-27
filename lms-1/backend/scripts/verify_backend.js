
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

// Helper to log steps
const step = (msg) => console.log(`\n[STEP] ${msg}`);
const success = (msg) => console.log(`✅ ${msg}`);
const fail = (msg, err) => {
    console.error(`❌ ${msg}`);
    console.error('Details:', err);
    process.exit(1);
};

// Main verification flow
async function verify() {
    let projectId, unitId, ownerId, tenantId, leaseId;
    const uniqueSuffix = Date.now();

    try {
        // 1. Create Project
        step('Creating Project...');
        const projectRes = await request('POST', '/projects', {
            project_name: `Test Project ${uniqueSuffix}`,
            location: 'Test Location',
            project_type: 'Commercial',
            total_floors: 10,
            status: 'active'
        });
        projectId = projectRes.data.project_id;
        success(`Project Created: ID ${projectId}`);

        // 2. Create Unit
        step('Creating Unit...');
        const unitRes = await request('POST', '/units', {
            project_id: projectId,
            unit_number: `U-${uniqueSuffix}`,
            floor_number: '1',
            chargeable_area: 1000,
            projected_rent: 50000,
            status: 'vacant'
        });
        unitId = unitRes.data.unit_id;
        success(`Unit Created: ID ${unitId}`);

        // 3. Create Owner (with mapped unit)
        step('Creating Owner with Unit Mapping...');
        const ownerRes = await request('POST', '/owners', {
            name: `Test Owner ${uniqueSuffix}`,
            email: `owner${uniqueSuffix}@test.com`,
            phone: '1234567890',
            unit_ids: [unitId]
        });
        success('Owner Created');

        const ownersRes = await request('GET', '/owners');
        const owner = ownersRes.data.find(o => o.email === `owner${uniqueSuffix}@test.com`);
        if (!owner) throw new Error('Owner not found after creation');
        ownerId = owner.id;
        success(`Owner ID Fetched: ${ownerId}`);

        // Verify Owner-Unit Mapping
        const ownerDetailsRes = await request('GET', `/owners/${ownerId}`);
        const mappedUnits = ownerDetailsRes.data.units;
        if (mappedUnits && mappedUnits.some(u => u.id === unitId)) {
            success('Owner-Unit Mapping Verified');
        } else {
            console.log('Mapped Units:', mappedUnits);
            throw new Error('Owner-Unit Mapping Failed');
        }

        // 4. Create Tenant
        step('Creating Tenant...');
        const tenantRes = await request('POST', '/tenants', {
            company_name: `Test Tenant ${uniqueSuffix}`,
            contact_person_name: 'John Doe',
            contact_person_email: `tenant${uniqueSuffix}@test.com`,
            status: 'active'
        });

        const tenantsRes = await request('GET', '/tenants');
        const tenant = tenantsRes.data.find(t => t.company_name === `Test Tenant ${uniqueSuffix}`);
        if (!tenant) throw new Error('Tenant not found after creation');
        tenantId = tenant.id;
        success(`Tenant ID Fetched: ${tenantId}`);

        // 5. Create Lease
        step('Creating Lease...');
        const leaseRes = await request('POST', '/leases', {
            project_id: projectId,
            unit_id: unitId,
            owner_id: ownerId,
            tenant_id: tenantId,
            lease_type: 'Direct lease',
            lease_start: '2024-01-01',
            lease_end: '2025-01-01',
            rent_commencement_date: '2024-02-01',
            monthly_rent: 55000,
            status: 'draft'
        });
        leaseId = leaseRes.data.lease_id;
        success(`Lease Created: ID ${leaseId}`);

        // 6. Verify Dashboard Stats
        step('Verifying Dashboard Stats...');
        const statsRes = await request('GET', '/dashboard/stats');
        const stats = statsRes.data.stats;
        console.log('Dashboard Stats:', stats);
        if (stats.totalProjects > 0 && stats.totalUnits > 0 && stats.totalOwners > 0) {
            success('Dashboard Stats response is valid');
        } else {
            console.warn('Dashboard stats might be zero/incomplete');
        }

    } catch (err) {
        fail('Verification Failed', err);
    }
}

// Wait a bit for server to be ready then run
setTimeout(verify, 1000);
