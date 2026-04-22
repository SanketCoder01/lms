/**
 * routes/projectUserRoutes.js
 * Routes for managing project-specific users
 */

const express = require('express');
const router = express.Router();
const projectUserController = require('../controllers/projectUserController');
const companyAuth = require('../middleware/companyAuth');

// Get all project users for a company (admin only)
router.get('/company/:company_id', companyAuth, projectUserController.getProjectUsers);

// Get all project users (for role management)
router.get('/all', companyAuth, projectUserController.getAllProjectUsers);

// Get users for a specific project
router.get('/project/:project_id', companyAuth, projectUserController.getProjectUsersByProject);

// Get all projects with their assigned users (for admin view)
router.get('/company/:company_id/projects-with-users', companyAuth, projectUserController.getProjectsWithUsers);

// Create a new project user
router.post('/', companyAuth, projectUserController.createProjectUser);

// Batch assign users to projects
router.post('/batch-assign', companyAuth, projectUserController.batchAssignProjects);

// Update project user permissions
router.put('/:id', companyAuth, projectUserController.updateProjectUser);

// Delete project user
router.delete('/:id', companyAuth, projectUserController.deleteProjectUser);

module.exports = router;
