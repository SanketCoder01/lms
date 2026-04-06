const express = require("express");
const router = express.Router();
const leaseController = require("../controllers/leaseController");
const upload = require("../middleware/uploadMiddleware");

// Stats & Dashboard
router.get("/stats", leaseController.getLeaseDashboardStats);
router.get("/manager-stats", leaseController.getLeaseManagerStats);
router.get("/pending", leaseController.getPendingLeases);
router.get("/expiring", leaseController.getExpiringLeases);
router.get("/notifications", leaseController.getLeaseNotifications);
router.put("/approve/:id", leaseController.approveLease);
router.put("/reject/:id", leaseController.rejectLease);
router.post("/reminders/send", leaseController.sendLeaseReminder);
router.put("/notifications/read-all", leaseController.markAllNotificationsRead);
router.delete("/notifications", leaseController.deleteAllNotifications);

// Issue 70: Export CSV (must be before /:id)
router.get("/export/csv", leaseController.exportLeases);

// CRUD
router.get("/", leaseController.getAllLeases);
router.post("/", upload.fields([
    { name: 'loi_document', maxCount: 1 },
    { name: 'agreement_document', maxCount: 1 },
    { name: 'registration_document', maxCount: 1 }
]), leaseController.createLease);
router.get("/:id", leaseController.getLeaseById);
router.put("/:id", upload.fields([
    { name: 'loi_document', maxCount: 1 },
    { name: 'agreement_document', maxCount: 1 },
    { name: 'registration_document', maxCount: 1 }
]), leaseController.updateLease);

// Issue 38: Get main lessee for sub-lease (unit-based)
router.get("/unit/:unitId/main-lessee", leaseController.getMainLesseeForUnit);

// Issue 69: Effective rent as on date
router.get("/:id/effective-rent", leaseController.getEffectiveRent);

// DANGER ZONE
router.delete("/wipe-all-data-danger", leaseController.wipeAllData);

module.exports = router;
