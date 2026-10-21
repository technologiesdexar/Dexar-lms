const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null,
  },
  driveUrl: {
    type: String,
    required: true,
    trim: true,
  },
  fileFormat: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'ppt', 'other'],
    default: 'pdf',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadedByName: {
    type: String,
    default: 'Instructor',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for fast lookups
courseMaterialSchema.index({ subjectId: 1, createdAt: -1 });
courseMaterialSchema.index({ uploadedBy: 1 });
courseMaterialSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
