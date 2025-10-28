// server/controllers/messageController.js
import Message from "../models/message.js";

/**
 * Create a new message
 * @param {String} projectId - The project ID
 * @param {String} senderId - The sender's user ID
 * @param {String} content - Message content
 * @returns {Promise<Message>} - The created message with sender populated
 */
export async function createMessage(projectId, senderId, content) {
  const message = new Message({
    project: projectId,
    sender: senderId,
    content: content.trim()
  });

  await message.save();
  
  // Populate sender details for returning to client
  await message.populate('sender', 'name email');
  
  return message;
}

/**
 * Get chat history for a project
 * @param {String} projectId - The project ID
 * @param {Number} limit - Number of messages to retrieve (default: 50)
 * @returns {Promise<Array>} - Array of messages with sender details
 */
export async function getProjectMessages(projectId, limit = 50) {
  const messages = await Message.find({ project: projectId })
    .populate('sender', 'name email')
    .sort({ createdAt: -1 }) // Most recent first
    .limit(limit);
  
  // Reverse to show oldest first (chronological order)
  return messages.reverse();
}

/**
 * Delete a message (optional - for moderation)
 * @param {String} messageId - The message ID
 * @param {String} userId - The user requesting deletion
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteMessage(messageId, userId) {
  const message = await Message.findById(messageId);
  
  if (!message) {
    throw new Error("Message not found");
  }

  // Only allow sender to delete their own message
  if (message.sender.toString() !== userId.toString()) {
    throw new Error("Not authorized to delete this message");
  }

  await Message.findByIdAndDelete(messageId);
  
  return { message: "Message deleted successfully" };
}
