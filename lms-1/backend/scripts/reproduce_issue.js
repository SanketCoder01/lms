const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../config/db');

const reproduce = async () => {
    try {
        console.log("Attempting to create owner...");
        const ownerData = {
            name: "Test Owner Full",
            email: "testfull@owner.com",
            phone: "1234567890",
            alternative_contact: "0987654321",
            representative_name: "Rep Name",
            representative_phone: "0987654321",
            representative_email: "rep@owner.com",
            address: "Test Address",
            total_owned_area: 0,
            gst_number: "GST123",
            kyc_status: "pending"
        };

        // Match the columns seen in inspect_db output
        // owners cols: id, name, email, phone, company_name, tax_id, address, created_at, kyc_status
        // Wait, 'representative_name' etc are NOT in the schema output above! 
        // Schema output: name, email, phone, company_name, tax_id, address, created_at, kyc_status

        // But the frontend sends representative_name? Let's check ownerController again.

        await pool.query(
            `INSERT INTO owners 
            (name, email, phone, alternative_contact,
             representative_name, representative_phone, representative_email, address,
             total_owned_area, gst_number, kyc_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ownerData.name, ownerData.email, ownerData.phone, ownerData.alternative_contact,
                ownerData.representative_name, ownerData.representative_phone, ownerData.representative_email, ownerData.address,
                ownerData.total_owned_area, ownerData.gst_number, ownerData.kyc_status
            ]
        );
        console.log("✅ Owner created successfully");

    } catch (err) {
        console.error("❌ Owner Creation Failed:", err.message);
    }

    try {
        console.log("Attempting to create tenant...");
        // tenants cols: id, company_name, registration_no, industry, tax_id, contact_person_name, contact_person_email, contact_person_phone, website, address, city, state, zip_code, country, status, created_at, kyc_status

        const tenantData = {
            company_name: "Test Tenant With Sub",
            registration_no: "123",
            tax_id: "456",
            contact_person_name: "Contact Person",
            contact_person_phone: "1234567890",
            contact_person_email: "contact@test.com",
            website: "test.com",
            address: "Test Address",
            kyc_status: "pending",
            subtenants: [{
                company_name: "Sub Co",
                registration_number: "999",
                allotted_area_sqft: 1000,
                contact_person_name: "Sub Guy",
                contact_person_email: "sub@guy.com",
                contact_person_phone: "5555555"
            }]
        };

        // Match controller logic (Lines 105+)
        // Insert main tenant first (which we simulate via raw query), then we typically would loop subtenants.
        // But here I'll manually insert subtenant to verifying schema matching ONLY if I were testing the controller.
        // Since I'm testing "reproduce", I should test the raw query for subtenants too to ensure it works.

        const [res] = await pool.query(
            `INSERT INTO tenants (company_name, registration_no, tax_id, contact_person_name, contact_person_phone, contact_person_email, website, address, kyc_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [tenantData.company_name, tenantData.registration_no, tenantData.tax_id, tenantData.contact_person_name, tenantData.contact_person_phone, tenantData.contact_person_email, tenantData.website, tenantData.address, tenantData.kyc_status]
        );
        const tenantId = res.insertId;

        // Subtenant Simulation matches fixed controller logic
        if (tenantData.subtenants) {
            for (let sub of tenantData.subtenants) {
                await pool.query(
                    `INSERT INTO sub_tenants
                    (tenant_id, company_name, registration_no,
                     allotted_area, contact_person,
                     email, phone)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        tenantId,
                        sub.company_name,
                        sub.registration_number,
                        sub.allotted_area_sqft,
                        sub.contact_person_name,
                        sub.contact_person_email,
                        sub.contact_person_phone
                    ]
                );
            }
        }
        console.log("✅ Tenant created successfully");

    } catch (err) {
        console.error("❌ Tenant Creation Failed:", err.message);
    }

    process.exit();
};

reproduce();
