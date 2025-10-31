// server/models/file.js
import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
      unique: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    folderPath: {
      type: String,
      default: '',
      trim: true,
    },
    isArchive: {
      type: Boolean,
      default: false,
    },
    archiveType: {
      type: String,
      enum: ['zip'],
      default: null,
    },
    originalFolderName: {
      type: String,
      default: '',
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster file lookups by project
fileSchema.index({ projectId: 1, createdAt: -1 });

const File = mongoose.model('File', fileSchema);

export default File;
