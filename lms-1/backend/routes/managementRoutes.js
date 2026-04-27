const express = require("express");
const router = express.Router();
const controller = require("../controllers/managementRepController");

router.get("/dashboard", controller.getRepDashboardStats); // updated to match controller
router.get("/reports/export", controller.exportReports); // Export CSV
router.get("/reports", controller.getRepReports); // updated
router.get("/documents", controller.getDocuments);
router.post("/documents", controller.upload.single('file'), controller.uploadDocument); // Upload Doc
router.get("/notifications", controller.getRepNotifications); // updated
router.get("/search", controller.searchData);
// router.get("/profile", controller.getProfile); // profile not in RepController yet, omitted for now
// router.put("/profile", controller.updateProfile);

module.exports = router;
