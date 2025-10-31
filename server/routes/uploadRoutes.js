import express from 'express';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import archiver from 'archiver';
import dotenv from 'dotenv';
import { protect } from '../middleware/authmiddleware.js';
import File from '../models/file.js';
import Project from '../models/project.js';
import Task from '../models/task.js';

dotenv.config();

const router = express.Router();

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const sanitizePath = (input = '') =>
  input
    .replace(/\\+/g, '/')
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, '_'))
    .join('/');

const sanitizeFileName = (input = '') => input.replace(/[^a-zA-Z0-9._-]/g, '_');

const ensureProjectMembership = async (user, projectId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = project.owner.toString() === user._id.toString();
  const isMember = project.members.some(
    (memberId) => memberId.toString() === user._id.toString()
  );

  if (!isOwner && !isMember) {
    const error = new Error('Access denied. You are not a member of this project.');
    error.statusCode = 403;
    throw error;
  }

  return { project, isOwner };
};

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * GET /api/upload/presign
 * Generate a pre-signed URL for direct S3 upload
 *
 * Query params:
 * - fileName: Name of the file to upload
 * - fileType: MIME type of the file
 *
 * Returns:
 * - uploadUrl: Pre-signed URL valid for 60 seconds
 * - key: S3 object key for tracking
 */
router.get('/presign', protect, async (req, res) => {
  try {
    const { fileName, fileType, fileSize, projectId, folderPath = '' } = req.query;

    // Validation
    if (!fileName || !fileType || !fileSize || !projectId) {
      return res.status(400).json({
        error: 'Missing required parameters: projectId, fileName, fileType, fileSize',
      });
    }

    const parsedSize = Number(fileSize);
    if (Number.isNaN(parsedSize)) {
      return res.status(400).json({ error: 'Invalid fileSize parameter' });
    }

    if (parsedSize > MAX_FILE_SIZE_BYTES) {
      return res.status(413).json({
        error: `File exceeds maximum size of ${MAX_FILE_SIZE_MB} MB`,
      });
    }

    const { project } = await ensureProjectMembership(req.user, projectId);

    // Generate unique key with timestamp
    const timestamp = Date.now();
    const sanitizedPath = sanitizePath(folderPath);
    const pathPrefix = sanitizedPath ? `${sanitizedPath}/` : '';
    const projectPrefix = `projects/${project._id.toString()}/`;
    const key = `${projectPrefix}${pathPrefix}${timestamp}-${fileName}`;

    // Create S3 PUT command
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    // Generate presigned URL (valid for 60 seconds)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    console.log(`✅ Generated presigned URL for: ${fileName}`);

    res.json({
      uploadUrl,
      key,
      maxSize: MAX_FILE_SIZE_BYTES,
      expiresIn: 60,
    });
  } catch (err) {
    console.error('❌ Presigned URL Error:', err);
    res.status(err.statusCode || 500).json({
      error: err.statusCode === 403 || err.statusCode === 404 ? err.message : 'Failed to generate presigned URL',
      details: err.message,
    });
  }
});

/**
 * POST /api/upload/confirm
 * (Optional) Confirm successful upload and store metadata
 *
 * Body:
 * - key: S3 object key
 * - fileName: Original file name
 * - fileSize: File size in bytes
 * - fileType: MIME type
 */
router.post('/confirm', async (req, res) => {
  try {
    const { key, fileName, fileSize } = req.body;

    // Here you can:
    // 1. Save file metadata to your database
    // 2. Associate file with a project/task/user
    // 3. Generate a CDN URL
    // 4. Send notifications

    console.log(`📦 File upload confirmed: ${fileName} (${fileSize} bytes)`);

    res.json({
      success: true,
      message: 'Upload confirmed',
      fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  } catch (err) {
    console.error('❌ Upload confirmation error:', err);
    res.status(500).json({
      error: 'Failed to confirm upload',
      details: err.message,
    });
  }
});

// Save file metadata to database
router.post('/save-metadata', protect, async (req, res) => {
  try {
    const {
      projectId,
      fileName,
      fileType,
      fileSize,
      s3Key,
      folderPath = '',
      isArchive = false,
      archiveType = null,
      originalFolderName = '',
    } = req.body;

    if (!projectId || !fileName || !fileType || !fileSize || !s3Key) {
      return res.status(400).json({
        error: 'Missing required metadata fields',
      });
    }

    const parsedSize = Number(fileSize);
    if (Number.isNaN(parsedSize)) {
      return res.status(400).json({ error: 'Invalid fileSize' });
    }

    if (parsedSize > MAX_FILE_SIZE_BYTES) {
      return res.status(413).json({
        error: `File exceeds maximum size of ${MAX_FILE_SIZE_MB} MB`,
      });
    }

    await ensureProjectMembership(req.user, projectId);

    const file = await File.create({
      fileName,
      fileType,
      fileSize: parsedSize,
      s3Key,
      projectId,
      folderPath: sanitizePath(folderPath),
      isArchive,
      archiveType,
      originalFolderName,
      uploadedBy: req.user._id,
    });

    console.log(`✅ File metadata saved: ${fileName}`);

    res.json({ success: true, file });
  } catch (err) {
    console.error('❌ Save metadata error:', err);
    res.status(err.statusCode || 500).json({
      error: err.statusCode === 403 || err.statusCode === 404 ? err.message : 'Failed to save file metadata',
      details: err.message,
    });
  }
});

// Get all files for a project
router.get('/files/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;

    await ensureProjectMembership(req.user, projectId);

    const files = await File.find({ projectId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ files });
  } catch (err) {
    console.error('❌ Get files error:', err);
    res.status(err.statusCode || 500).json({
      error: err.statusCode === 403 || err.statusCode === 404 ? err.message : 'Failed to retrieve files',
      details: err.message,
    });
  }
});

// Generate download URL for a file
router.get('/download/:fileId', protect, async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    await ensureProjectMembership(req.user, file.projectId);

    // Generate presigned download URL
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key,
    });

    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes

    // Increment download count
    file.downloadCount += 1;
    await file.save();

    res.json({ downloadUrl, fileName: file.fileName });
  } catch (err) {
    console.error('❌ Generate download URL error:', err);
    res.status(err.statusCode || 500).json({
      error: err.statusCode === 403 || err.statusCode === 404 ? err.message : 'Failed to generate download URL',
      details: err.message,
    });
  }
});

// Delete a file
router.delete('/files/:fileId', protect, async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { isOwner } = await ensureProjectMembership(req.user, file.projectId);

    // Check if user is the uploader or project owner
    if (!isOwner && file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the uploader or project owner can delete this file' });
    }

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key,
    });

    await s3.send(command);

    // Delete from database
    await file.deleteOne();

    console.log(`✅ File deleted: ${file.fileName}`);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    console.error('❌ Delete file error:', err);
    res.status(err.statusCode || 500).json({
      error: err.statusCode === 403 || err.statusCode === 404 ? err.message : 'Failed to delete file',
      details: err.message,
    });
  }
});

// Export entire project (files + metadata) as ZIP
router.get('/export/project/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;

    console.log(`📦 Export requested | project=${projectId} | user=${req.user?.email}`);

    const { project } = await ensureProjectMembership(req.user, projectId);

    const files = await File.find({ projectId }).lean();
    const tasks = await Task.find({ project: projectId }).lean();

    const safeProjectName = sanitizeFileName(project.name || 'project');
    const filename = `${safeProjectName}-export-${Date.now()}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    const exportMetadata = {
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
      fileCount: files.length,
      taskCount: tasks.length,
    };

    archive.append(JSON.stringify(exportMetadata, null, 2), {
      name: 'metadata/project-info.json',
    });

    archive.append(JSON.stringify(tasks, null, 2), {
      name: 'metadata/tasks.json',
    });

    for (const file of files) {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.s3Key,
      });

      const response = await s3.send(command);
      const stream = response.Body;

      if (!stream) {
        continue;
      }

      const parts = ['files'];
      if (file.folderPath) {
        parts.push(file.folderPath);
      }
      parts.push(file.fileName);

      archive.append(stream, {
        name: parts.join('/'),
        date: file.createdAt || new Date(),
      });
    }

    await archive.finalize();
    console.log(`✅ Project export completed | project=${projectId}`);
  } catch (err) {
    console.error('❌ Project export error:', err);

    if (!res.headersSent) {
      res.status(err.statusCode || 500).json({
        error: err.statusCode === 403 || err.statusCode === 404 ? err.message : 'Failed to export project',
        details: err.message,
      });
    } else {
      res.end();
    }
  }
});

export default router;
