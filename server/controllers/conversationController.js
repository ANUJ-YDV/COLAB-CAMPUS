// server/controllers/conversationController.js
import Conversation from '../models/conversation.js';
import Message from '../models/message.js';

/**
 * Create a new conversation (global or DM)
 * POST /api/conversations
 */
export const createConversation = async (req, res) => {
  try {
    const { type, participants, name } = req.body;

    // Validation
    if (!type || !['global', 'dm'].includes(type)) {
      return res.status(400).json({ error: "Invalid conversation type. Must be 'global' or 'dm'" });
    }

    // For DM, ensure participants are provided
    if (type === 'dm' && (!participants || participants.length < 2)) {
      return res.status(400).json({ error: 'DM conversations require at least 2 participants' });
    }

    // For global chat, participants can be empty or include initial members
    const conversationData = {
      type,
      participants: participants || [],
      name,
    };

    const conversation = await Conversation.create(conversationData);

    // Populate participants before sending response
    await conversation.populate('participants', 'username email');

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

/**
 * Get all conversations for the logged-in user
 * GET /api/conversations
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all conversations where user is a participant OR global conversations
    const conversations = await Conversation.find({
      $or: [{ participants: userId }, { type: 'global' }],
    })
      .populate('participants', 'username email')
      .sort({ updatedAt: -1 }); // Most recently updated first

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

/**
 * Get messages for a specific conversation
 * GET /api/conversations/:conversationId/messages
 */
export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 50;

    // Verify conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user has access to this conversation
    if (conversation.type === 'dm' && !conversation.hasParticipant(userId)) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    // Fetch messages
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

/**
 * Find or create a DM conversation between users
 * POST /api/conversations/dm
 */
export const findOrCreateDM = async (req, res) => {
  try {
    const { participantIds } = req.body;
    const currentUserId = req.user._id;

    // Ensure current user is included
    const allParticipants = [...new Set([currentUserId.toString(), ...participantIds])];

    if (allParticipants.length < 2) {
      return res.status(400).json({ error: 'At least 2 participants required for DM' });
    }

    // Find existing DM with these exact participants
    const existingConversation = await Conversation.findOne({
      type: 'dm',
      participants: { $all: allParticipants, $size: allParticipants.length },
    }).populate('participants', 'username email');

    if (existingConversation) {
      return res.json(existingConversation);
    }

    // Create new DM conversation
    const newConversation = await Conversation.create({
      type: 'dm',
      participants: allParticipants,
    });

    await newConversation.populate('participants', 'username email');

    res.status(201).json(newConversation);
  } catch (error) {
    console.error('Error finding/creating DM:', error);
    res.status(500).json({ error: 'Failed to find or create DM' });
  }
};

/**
 * Get a specific conversation by ID
 * GET /api/conversations/:conversationId
 */
export const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId).populate(
      'participants',
      'username email'
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check access
    if (conversation.type === 'dm' && !conversation.hasParticipant(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

/**
 * Delete a conversation (only if user is participant)
 * DELETE /api/conversations/:conversationId
 */
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Only allow deletion if user is a participant
    if (!conversation.hasParticipant(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete all messages in this conversation
    await Message.deleteMany({ conversation: conversationId });

    // Delete the conversation
    await conversation.deleteOne();

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};
