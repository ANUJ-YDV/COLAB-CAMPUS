// server/routes/conversationRoutes.js
import express from 'express';
import {
  createConversation,
  getConversations,
  getConversationMessages,
  findOrCreateDM,
  getConversationById,
  deleteConversation,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/conversations
 * @desc    Create a new conversation (global or DM)
 * @access  Private
 * @body    { type: "global" | "dm", participants: [userId1, userId2, ...], name?: "Optional name" }
 */
router.post('/', createConversation);

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for the logged-in user
 * @access  Private
 */
router.get('/', getConversations);

/**
 * @route   POST /api/conversations/dm
 * @desc    Find or create a DM conversation between users
 * @access  Private
 * @body    { participantIds: [userId1, userId2, ...] }
 */
router.post('/dm', findOrCreateDM);

/**
 * @route   GET /api/conversations/:conversationId
 * @desc    Get a specific conversation by ID
 * @access  Private
 */
router.get('/:conversationId', getConversationById);

/**
 * @route   GET /api/conversations/:conversationId/messages
 * @desc    Get messages for a specific conversation
 * @access  Private
 * @query   limit (optional, default: 50)
 */
router.get('/:conversationId/messages', getConversationMessages);

/**
 * @route   DELETE /api/conversations/:conversationId
 * @desc    Delete a conversation and all its messages
 * @access  Private (must be participant)
 */
router.delete('/:conversationId', deleteConversation);

export default router;
