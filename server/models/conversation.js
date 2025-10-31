// server/models/conversation.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: ['global', 'dm'],
        message: '{VALUE} is not a valid conversation type',
      },
      required: [true, 'Conversation type is required'],
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Conversation name cannot exceed 100 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validation: DM conversations must have exactly 2 participants
conversationSchema.pre('validate', function (next) {
  if (this.type === 'dm' && this.participants.length !== 2) {
    next(new Error('DM conversations must have exactly 2 participants'));
  } else {
    next();
  }
});

// Compound index for efficiently finding conversations by participants
conversationSchema.index({ participants: 1, type: 1 });

// Index for finding all conversations of a specific type
conversationSchema.index({ type: 1, createdAt: -1 });

// Method to check if a user is a participant
conversationSchema.methods.hasParticipant = function (userId) {
  return this.participants.some((p) => p.toString() === userId.toString());
};

export default mongoose.model('Conversation', conversationSchema);
