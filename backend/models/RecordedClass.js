const mongoose = require('mongoose');

const recordedClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  notesUrl: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  duration: {
    type: String,
    default: '45 mins',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// High-performance indexes for student library requests
recordedClassSchema.index({ subjectId: 1, createdAt: -1 });
recordedClassSchema.index({ trainerId: 1 });

module.exports = mongoose.model('RecordedClass', recordedClassSchema);
