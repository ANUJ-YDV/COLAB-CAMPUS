// server/models/message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    project: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project", 
      required: true,
      index: true // Index for faster queries by project
    },
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    content: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 2000 // Limit message length
    },
  },
  { 
    timestamps: true // Adds createdAt and updatedAt
  }
);

// Index for efficient querying of messages by project
messageSchema.index({ project: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
