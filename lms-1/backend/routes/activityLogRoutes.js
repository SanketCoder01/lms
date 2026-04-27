const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');

router.get('/activity-logs', activityLogController.getActivityLogs);
router.get('/export', activityLogController.exportActivityLogs);

module.exports = router;
