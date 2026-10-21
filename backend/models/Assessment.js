const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  marks: { type: Number, default: 10 },
});

const assessmentSchema = new mongoose.Schema({
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
  questions: [questionSchema],
  dueDate: {
    type: String,
    default: '2026-10-31',
  },
  totalMarks: {
    type: Number,
    default: 100,
  },
  isLockdown: {
    type: Boolean,
    default: true,
  },
  maxViolations: {
    type: Number,
    default: 3,
  },
  durationMinutes: {
    type: Number,
    default: 45,
  },
  accessPassword: {
    type: String,
    default: 'DEXAR2026',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// High-performance indexes for assessment portal
assessmentSchema.index({ subjectId: 1, createdAt: -1 });
assessmentSchema.index({ trainerId: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
