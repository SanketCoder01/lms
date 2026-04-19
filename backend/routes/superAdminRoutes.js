const express = require('express');
const superAdminAuth = require('../middleware/superAdminAuth');
const {
  login, getDashboardStats,
  getUsers, createUser, updateUser, deleteUser, toggleUserStatus, updateModules,
  getRegistrations, approveRegistration, rejectRegistration,
  getSessions, killSession,
  getAnnouncements, createAnnouncement, toggleAnnouncement, deleteAnnouncement,
} = require('../controllers/superAdminController');

const router = express.Router();

// Public — login only
router.post('/login', login);

// All below require super admin JWT
router.get('/dashboard-stats', superAdminAuth, getDashboardStats);

// Company Users
router.get('/users',                   superAdminAuth, getUsers);
router.post('/users',                  superAdminAuth, createUser);
router.put('/users/:id',               superAdminAuth, updateUser);
router.delete('/users/:id',            superAdminAuth, deleteUser);
router.put('/users/:id/status',        superAdminAuth, toggleUserStatus);
router.put('/users/:id/modules',       superAdminAuth, updateModules);

// Registrations
router.get('/registrations',                    superAdminAuth, getRegistrations);
router.post('/registrations/:id/approve',       superAdminAuth, approveRegistration);
router.post('/registrations/:id/reject',        superAdminAuth, rejectRegistration);

// Live Sessions
router.get('/sessions',          superAdminAuth, getSessions);
router.delete('/sessions/:id',   superAdminAuth, killSession);

// Announcements
router.get('/announcements',           superAdminAuth, getAnnouncements);
router.post('/announcements',          superAdminAuth, createAnnouncement);
router.put('/announcements/:id',       superAdminAuth, toggleAnnouncement);
router.delete('/announcements/:id',    superAdminAuth, deleteAnnouncement);

module.exports = router;
