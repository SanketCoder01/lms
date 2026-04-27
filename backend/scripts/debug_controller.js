const dashboardController = require('../controllers/dashboardController');

// Mock Req and Res
const req = {};
const res = {
    json: (data) => console.log("Success:", JSON.stringify(data, null, 2)),
    status: (code) => {
        console.log("Status:", code);
        return {
            json: (err) => console.error("Error Response:", err)
        };
    }
};

const run = async () => {
    console.log("Running getDashboardStats...");
    try {
        await dashboardController.getDashboardStats(req, res);
    } catch (e) {
        console.error("Unhandle Exception:", e);
    }
};

run();
