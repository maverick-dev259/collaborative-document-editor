const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  addCollaborator,
  removeCollaborator,
  getCollaborators,
} = require('../controllers/documentController');

// Document CRUD
router.route('/').get(protect, getDocuments).post(protect, createDocument);
router
  .route('/:id')
  .get(protect, getDocument)
  .put(protect, updateDocument)
  .delete(protect, deleteDocument);

// Sharing
router
  .route('/:id/share')
  .post(protect, addCollaborator);
router
  .route('/:id/share/:userId')
  .delete(protect, removeCollaborator);
router.get('/:id/collaborators', protect, getCollaborators);

module.exports = router;
