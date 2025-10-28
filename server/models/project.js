// server/models/Project.js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    default: ""
  },
  owner: {                       // creator of the project
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [{                    // members (including owner if you want)
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  tasks: [{                      // list of task IDs (optional convenience)
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task"
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// keep updatedAt current
projectSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for querying projects by member (useful for "My Projects" queries)
projectSchema.index({ members: 1 });

export default mongoose.model("Project", projectSchema);
