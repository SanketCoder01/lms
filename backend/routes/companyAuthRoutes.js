const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { companyLogin, companyRegister, sessionHeartbeat, companyLogout, getActiveAnnouncements, getMe } = require('../controllers/companyAuthController');

const router = express.Router();

// Multer for proof document upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `proof_${Date.now()}_${file.originalname.replace(/\s/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

router.post('/login',     companyLogin);
router.post('/register',  upload.single('proof_document'), companyRegister);
router.post('/heartbeat', sessionHeartbeat);
router.post('/logout',    companyLogout);
router.get('/announcements', getActiveAnnouncements);
router.get('/me', getMe);

module.exports = router;
