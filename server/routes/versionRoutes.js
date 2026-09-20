const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getVersions,
  createVersion,
  restoreVersion,
} = require('../controllers/versionController');

router
  .route('/:id/versions')
  .get(protect, getVersions)
  .post(protect, createVersion);

router.post('/:id/versions/:versionId/restore', protect, restoreVersion);

module.exports = router;
