const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
    try {
        const form = new FormData();
        form.append('project_name', 'Test Project');
        form.append('location', 'Test Location');
        form.append('address', 'Test Address');
        form.append('project_type', 'Commercial');
        form.append('total_floors', '10');
        form.append('total_project_area', '5000');
        form.append('description', 'Test Description');

        // Simulating image upload if needed, or leave empty to test without image first
        // form.append('image', fs.createReadStream('some_image.jpg'));

        console.log("Sending request...");
        const res = await axios.post('http://localhost:5003/api/projects', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        console.log("Success:", res.data);
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}

test();
