// server/routes/taskRoutes.js
import express from "express";
import { 
  createTask, 
  updateTaskStatus, 
  assignTask, 
  addCommentToTask,
  deleteTask,
  getProjectTasks,
  getUserTasks
} from "../controllers/taskController.js";
import { 
  protect, 
  checkProjectMembership 
} from "../middleware/authmiddleware.js";

const router = express.Router();

// Create a new task (requires authentication and project membership)
router.post("/create", protect, async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, dueDate, priority, status } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: "Title and projectId are required" });
    }

    const task = await createTask({ 
      title, 
      description, 
      projectId, 
      assignedTo, 
      dueDate, 
      priority,
      status
    });
    
    res.status(201).json({ 
      message: "Task created successfully", 
      task 
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all tasks for a project (requires authentication and project membership)
router.get("/project/:projectId", protect, checkProjectMembership, async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await getProjectTasks(projectId);
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error("Get project tasks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get tasks assigned to authenticated user
router.get("/my-tasks", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await getUserTasks(userId);
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error("Get user tasks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get tasks assigned to a user (kept for backward compatibility)
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await getUserTasks(userId);
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error("Get user tasks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update task status (requires authentication)
router.patch("/:taskId/status", protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, projectId } = req.body;

    if (!status || !["todo", "in-progress", "done"].includes(status)) {
      return res.status(400).json({ message: "Valid status is required (todo, in-progress, done)" });
    }

    const task = await updateTaskStatus(taskId, status, projectId);
    
    res.status(200).json({ 
      message: "Task status updated successfully", 
      task 
    });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update task status - Simplified route for drag-and-drop (PUT method)
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, projectId } = req.body;

    if (!status || !["todo", "in-progress", "done"].includes(status)) {
      return res.status(400).json({ message: "Valid status is required (todo, in-progress, done)" });
    }

    const task = await updateTaskStatus(id, status, projectId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    res.status(200).json({ 
      message: "Task updated", 
      task 
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Assign task to user (requires authentication)
router.patch("/:taskId/assign", protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const task = await assignTask(taskId, userId);
    
    res.status(200).json({ 
      message: "Task assigned successfully", 
      task 
    });
  } catch (error) {
    console.error("Assign task error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add comment to task (requires authentication, uses authenticated user as author)
router.post("/:taskId/comments", protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Use authenticated user as comment author
    const authorId = req.user._id;

    const task = await addCommentToTask(taskId, authorId, message);
    
    res.status(200).json({ 
      message: "Comment added successfully", 
      task 
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a task (requires authentication)
router.delete("/:taskId", protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await deleteTask(taskId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
