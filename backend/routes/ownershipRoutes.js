const express = require('express');
const router = express.Router();
const ownershipController = require('../controllers/ownershipController');
const upload = require('../middleware/uploadMiddleware');

// Document Chain Routes - Moved to top
router.get('/document-types', ownershipController.getDocumentTypes);
router.post('/document-types', ownershipController.addDocumentType);
router.get('/documents/:unitId/:partyId', ownershipController.getOwnershipDocuments);
router.post('/documents', upload.single('document'), ownershipController.uploadOwnershipDocument);

router.get('/test', (req, res) => res.json({ message: 'Ownership API working' }));

router.get('/search', ownershipController.getAllOwnerships);
router.post('/assign', ownershipController.assignOwner);
router.post('/remove', ownershipController.removeOwner);
router.get('/unit/:unitId', ownershipController.getOwnersByUnit);
router.get('/party/:partyId', ownershipController.getUnitsByParty);

module.exports = router;
