const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Untitled Document',
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: Object, // TipTap JSON content
      default: {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        permission: {
          type: String,
          enum: ['viewer', 'editor'],
          default: 'viewer',
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for search
documentSchema.index({ title: 'text' });
documentSchema.index({ owner: 1, updatedAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
