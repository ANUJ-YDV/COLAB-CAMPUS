// server/models/message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true, // Index for faster queries by project
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true, // Index for faster queries by conversation
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message sender is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      minlength: [1, 'Message cannot be empty'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Validation: Message must belong to either a project OR a conversation (not both, not neither)
messageSchema.pre('validate', function (next) {
  if ((!this.project && !this.conversation) || (this.project && this.conversation)) {
    next(new Error('Message must belong to either a project or a conversation, but not both'));
  } else {
    next();
  }
});

// Index for efficient querying of messages by project
messageSchema.index({ project: 1, createdAt: -1 });

// Index for efficient querying of messages by conversation
messageSchema.index({ conversation: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
