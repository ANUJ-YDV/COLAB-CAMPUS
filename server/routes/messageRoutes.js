// server/routes/messageRoutes.js
import express from "express";
import { getProjectMessages, deleteMessage } from "../controllers/messageController.js";
import { protect, checkProjectMembership } from "../middleware/authmiddleware.js";

const router = express.Router();

/**
 * GET /api/messages/project/:projectId
 * Get chat history for a project
 * Requires authentication and project membership
 */
router.get("/project/:projectId", protect, checkProjectMembership, async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await getProjectMessages(projectId, limit);

    res.status(200).json({ 
      success: true,
      count: messages.length,
      messages 
    });
  } catch (error) {
    console.error("Get project messages error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/messages/:messageId
 * Delete a message (sender only)
 * Requires authentication
 */
router.delete("/:messageId", protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const result = await deleteMessage(messageId, userId);

    res.status(200).json({ 
      success: true,
      ...result 
    });
  } catch (error) {
    console.error("Delete message error:", error);
    
    if (error.message === "Message not found") {
      return res.status(404).json({ 
        success: false,
        message: error.message 
      });
    }
    
    if (error.message === "Not authorized to delete this message") {
      return res.status(403).json({ 
        success: false,
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

export default router;
