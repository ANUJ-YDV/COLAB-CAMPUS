// server/routes/projectRoutes.js
import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMemberToProject,
  removeMemberFromProject,
  getUserProjects,
} from '../controllers/projectController.js';
import { protect, checkProjectOwnership } from '../middleware/authmiddleware.js';
// checkProjectMembership is available but not currently used in routes

const router = express.Router();

// RESTful routes
router
  .route('/')
  .get(protect, getProjects) // Get all projects for authenticated user
  .post(protect, createProject); // Create new project

router
  .route('/:id')
  .get(protect, getProjectById) // Get single project (membership required)
  .put(protect, updateProject) // Update project (owner only)
  .delete(protect, deleteProject); // Delete project (owner only)

// Member management routes
router.post('/:id/members', protect, addMemberToProject); // Add member (owner only)
router.delete('/:id/members/:userId', protect, removeMemberFromProject); // Remove member (owner only)

export default router;
