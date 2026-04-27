const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload'); // Import upload middleware

const {
    getOwners,
    getOwnerLocations, // Expose new function
    getOwnerById,
    createOwner,
    updateOwner,
    deleteOwner,
    addUnitsToOwner,
    removeUnitFromOwner,
    exportOwners,
    getKycStats,
    getOwnerDocuments,
    uploadDocument,
    sendMessage
} = require('../controllers/ownerController');

router.get('/export', exportOwners);
router.get('/stats', getKycStats);
router.get('/locations', getOwnerLocations); // New Route
router.get('/', getOwners);
router.get('/:id', getOwnerById);
router.post('/', createOwner);
router.put('/:id', updateOwner);
router.delete('/:id', deleteOwner);

router.post('/:id/units', addUnitsToOwner);
router.delete('/:id/units/:unitId', removeUnitFromOwner);

router.get('/:id/documents', getOwnerDocuments);
router.post('/:id/documents', upload.single('file'), uploadDocument);
router.post('/:id/message', sendMessage);

module.exports = router;
