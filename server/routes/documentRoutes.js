// server/routes/documentRoutes.js
import express from 'express';
import Document from '../models/document.js';
import Project from '../models/project.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

// @route   GET /api/documents/:projectId
// @desc    Get document for a project
// @access  Private (project members only)
router.get('/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get or create document
    let document = await Document.findOne({ projectId }).populate('lastEditedBy', 'name email');

    if (!document) {
      document = await Document.create({
        projectId,
        title: `${project.name} - Notes`,
        content: '',
        lastEditedBy: req.user._id,
      });
    }

    res.json({
      success: true,
      document: {
        id: document._id,
        projectId: document.projectId,
        title: document.title,
        content: document.content,
        version: document.version,
        lastEditedBy: document.lastEditedBy,
        lastUpdated: document.lastUpdated,
        createdAt: document.createdAt,
      },
    });
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   PUT /api/documents/:projectId
// @desc    Update document content
// @access  Private (project members only)
router.put('/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content, title } = req.body;

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update document
    const document = await Document.findOneAndUpdate(
      { projectId },
      {
        content: content || '',
        title: title || 'Untitled Document',
        lastEditedBy: req.user._id,
        lastUpdated: new Date(),
        $inc: { version: 1 },
      },
      {
        upsert: true,
        new: true,
      }
    ).populate('lastEditedBy', 'name email');

    res.json({
      success: true,
      message: 'Document updated successfully',
      document: {
        id: document._id,
        projectId: document.projectId,
        title: document.title,
        content: document.content,
        version: document.version,
        lastEditedBy: document.lastEditedBy,
        lastUpdated: document.lastUpdated,
      },
    });
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   DELETE /api/documents/:projectId
// @desc    Delete document for a project
// @access  Private (project owner only)
router.delete('/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project ownership
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can delete documents' });
    }

    // Delete document
    const document = await Document.findOneAndDelete({ projectId });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
