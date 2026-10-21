const mongoose = require('mongoose');

const doubtReplySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    enum: ['student', 'admin', 'superadmin'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const doubtSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  studentEmail: {
    type: String,
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null,
  },
  subjectName: {
    type: String,
    default: 'General Course',
  },
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
  status: {
    type: String,
    enum: ['Pending', 'Answered', 'Resolved'],
    default: 'Pending',
  },
  replies: [doubtReplySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for fast lookups by student, subject, and status
doubtSchema.index({ studentId: 1, createdAt: -1 });
doubtSchema.index({ subjectId: 1, createdAt: -1 });
doubtSchema.index({ status: 1 });
doubtSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Doubt', doubtSchema);
