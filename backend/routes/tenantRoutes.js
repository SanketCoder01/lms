const express = require('express');
const router = express.Router();

const {
    createTenant,
    getAllTenants,
    getTenantById,
    updateTenant,
    getTenantLocations
} = require('../controllers/tenantController');

// TEMP: no auth so frontend works
router.get('/', getAllTenants);
router.get('/locations', getTenantLocations);
router.post('/', createTenant);
router.get('/:id', getTenantById);
router.put('/:id', updateTenant);

module.exports = router;
