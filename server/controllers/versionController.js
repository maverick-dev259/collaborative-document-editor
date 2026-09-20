const DocumentVersion = require('../models/DocumentVersion');
const Document = require('../models/Document');

/**
 * @route   GET /api/documents/:id/versions
 * @desc    Get all versions for a document
 */
const getVersions = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check access
    const isOwner = document.owner.toString() === req.user._id.toString();
    const isCollaborator = document.collaborators.some(
      (c) => c.user.toString() === req.user._id.toString()
    );
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const versions = await DocumentVersion.find({ document: req.params.id })
      .sort({ createdAt: -1 })
      .populate('editedBy', 'name email avatar');

    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch versions' });
  }
};

/**
 * @route   POST /api/documents/:id/versions
 * @desc    Create a version snapshot
 */
const createVersion = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const version = await DocumentVersion.create({
      document: document._id,
      content: document.content,
      title: document.title,
      editedBy: req.user._id,
    });

    const populated = await DocumentVersion.findById(version._id).populate(
      'editedBy',
      'name email avatar'
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create version' });
  }
};

/**
 * @route   POST /api/documents/:id/versions/:versionId/restore
 * @desc    Restore a document to a previous version. Owner/editor only.
 */
const restoreVersion = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isOwner = document.owner.toString() === req.user._id.toString();
    const collaborator = document.collaborators.find(
      (c) => c.user.toString() === req.user._id.toString()
    );
    const isEditor = collaborator && collaborator.permission === 'editor';

    if (!isOwner && !isEditor) {
      return res
        .status(403)
        .json({ message: 'You do not have permission to restore versions' });
    }

    const version = await DocumentVersion.findById(req.params.versionId);
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Save current state as a new version before restoring
    await DocumentVersion.create({
      document: document._id,
      content: document.content,
      title: document.title,
      editedBy: req.user._id,
    });

    // Restore
    document.content = version.content;
    if (version.title) document.title = version.title;
    await document.save();

    const updated = await Document.findById(document._id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore version' });
  }
};

module.exports = { getVersions, createVersion, restoreVersion };
