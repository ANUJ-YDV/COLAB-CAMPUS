// server/routes/projectRoutes.js
import express from "express";
import { 
  createProject, 
  getProjects,
  getProjectById,
  updateProject,
  deleteProject, 
  addMemberToProject, 
  removeMemberFromProject,
  getUserProjects 
} from "../controllers/projectController.js";
import { 
  protect, 
  checkProjectMembership, 
  checkProjectOwnership 
} from "../middleware/authmiddleware.js";

const router = express.Router();

// RESTful routes
router.route("/")
  .get(protect, getProjects)           // Get all projects for authenticated user
  .post(protect, createProject);        // Create new project

router.route("/:id")
  .get(protect, getProjectById)        // Get single project (membership required)
  .put(protect, updateProject)          // Update project (owner only)
  .delete(protect, deleteProject);      // Delete project (owner only)

// Member management routes
router.post("/:id/members", protect, addMemberToProject);         // Add member (owner only)
router.delete("/:id/members/:userId", protect, removeMemberFromProject);  // Remove member (owner only)

// Legacy routes (backward compatibility)
router.get("/my-projects", protect, getProjects);
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const projects = await getUserProjects(userId);
    res.status(200).json({ projects });
  } catch (error) {
    console.error("Get user projects error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a project (only owner can delete)
router.delete("/:projectId", protect, checkProjectOwnership, async (req, res) => {
  try {
    const { userId } = req.params;
    const projects = await getUserProjects(userId);
    res.status(200).json({ projects });
  } catch (error) {
    console.error("Get user projects error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;

