// server/models/document.js
import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Untitled Document',
      trim: true,
      maxlength: [200, 'Document title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      default: '',
      maxlength: [100000, 'Document content cannot exceed 100,000 characters'],
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    version: {
      type: Number,
      default: 0,
      min: [0, 'Version cannot be negative'],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Update lastUpdated on save
documentSchema.pre('save', function (next) {
  this.lastUpdated = Date.now();
  next();
});

export default mongoose.model('Document', documentSchema);
