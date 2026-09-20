const mongoose = require('mongoose');

const documentVersionSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    content: {
      type: Object, // TipTap JSON snapshot
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

documentVersionSchema.index({ document: 1, createdAt: -1 });

module.exports = mongoose.model('DocumentVersion', documentVersionSchema);
