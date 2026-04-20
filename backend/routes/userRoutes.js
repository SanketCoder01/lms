const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { getMyModuleUsers, createMyModuleUser, updateModuleUser, deleteModuleUser } = require('../controllers/moduleUserController');

// Standard company users
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Module Users (scoped to company)
router.get('/module-users', getMyModuleUsers);
router.post('/module-users', createMyModuleUser);
router.put('/module-users/:id', updateModuleUser);
router.delete('/module-users/:id', deleteModuleUser);

module.exports = router;
