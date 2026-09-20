const Document = require('../models/Document');
const User = require('../models/User');

/**
 * @route   POST /api/documents
 * @desc    Create a new document
 */
const createDocument = async (req, res) => {
  try {
    const document = await Document.create({
      title: req.body.title || 'Untitled Document',
      owner: req.user._id,
    });

    const populated = await Document.findById(document._id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create document' });
  }
};

/**
 * @route   GET /api/documents
 * @desc    Get all documents for the current user (owned + shared)
 *          Query params: search, sort, filter (my, shared, trash)
 */
const getDocuments = async (req, res) => {
  try {
    const { search, sort, filter } = req.query;
    let query = {};

    // Base: documents owned by user OR shared with user
    if (filter === 'my') {
      query = { owner: req.user._id, isDeleted: false };
    } else if (filter === 'shared') {
      query = {
        'collaborators.user': req.user._id,
        isDeleted: false,
      };
    } else if (filter === 'trash') {
      query = { owner: req.user._id, isDeleted: true };
    } else {
      // All documents (owned + shared, not deleted)
      query = {
        $or: [
          { owner: req.user._id },
          { 'collaborators.user': req.user._id },
        ],
        isDeleted: false,
      };
    }

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Sort
    let sortOption = { updatedAt: -1 }; // default: recently updated
    if (sort === 'title') sortOption = { title: 1 };
    if (sort === 'created') sortOption = { createdAt: -1 };

    const documents = await Document.find(query)
      .sort(sortOption)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
};

/**
 * @route   GET /api/documents/:id
 * @desc    Get a single document (owner or collaborator only)
 */
const getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check access
    const isOwner = document.owner._id.toString() === req.user._id.toString();
    const isCollaborator = document.collaborators.some(
      (c) => c.user._id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch document' });
  }
};

/**
 * @route   PUT /api/documents/:id
 * @desc    Update document (title, content). Owner or editor only.
 */
const updateDocument = async (req, res) => {
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
        .json({ message: 'You do not have permission to edit this document' });
    }

    if (req.body.title !== undefined) document.title = req.body.title;
    if (req.body.content !== undefined) document.content = req.body.content;

    await document.save();

    const updated = await Document.findById(document._id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update document' });
  }
};

/**
 * @route   DELETE /api/documents/:id
 * @desc    Soft-delete a document. Owner only.
 */
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Only the owner can delete this document' });
    }

    document.isDeleted = true;
    await document.save();

    res.json({ message: 'Document moved to trash' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document' });
  }
};

/**
 * @route   POST /api/documents/:id/share
 * @desc    Add a collaborator. Owner only.
 */
const addCollaborator = async (req, res) => {
  try {
    const { email, permission } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ message: 'Please provide a collaborator email' });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Only the owner can share this document' });
    }

    // Find user by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found with that email' });
    }

    // Can't share with yourself
    if (userToAdd._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: 'You cannot share a document with yourself' });
    }

    // Check if already a collaborator
    const alreadyAdded = document.collaborators.some(
      (c) => c.user.toString() === userToAdd._id.toString()
    );
    if (alreadyAdded) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    document.collaborators.push({
      user: userToAdd._id,
      permission: permission || 'viewer',
    });

    await document.save();

    const updated = await Document.findById(document._id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to share document' });
  }
};

/**
 * @route   DELETE /api/documents/:id/share/:userId
 * @desc    Remove a collaborator. Owner only.
 */
const removeCollaborator = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Only the owner can manage collaborators' });
    }

    document.collaborators = document.collaborators.filter(
      (c) => c.user.toString() !== req.params.userId
    );

    await document.save();

    const updated = await Document.findById(document._id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove collaborator' });
  }
};

/**
 * @route   GET /api/documents/:id/collaborators
 * @desc    Get collaborators for a document
 */
const getCollaborators = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check access
    const isOwner = document.owner._id.toString() === req.user._id.toString();
    const isCollaborator = document.collaborators.some(
      (c) => c.user._id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      owner: document.owner,
      collaborators: document.collaborators,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch collaborators' });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  addCollaborator,
  removeCollaborator,
  getCollaborators,
};
