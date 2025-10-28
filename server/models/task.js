// server/models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["todo", "in-progress", "done"],
    default: "todo"
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  assignedTo: {                    // user assigned to task (nullable)
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  dueDate: {                        // deadline (optional)
    type: Date,
    default: null
  },
  priority: {                       // optional extra field
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

taskSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// index to speed queries by project + status
taskSchema.index({ project: 1, status: 1 });

export default mongoose.model("Task", taskSchema);
