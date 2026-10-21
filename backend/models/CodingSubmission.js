const mongoose = require('mongoose');

const questionResultSchema = new mongoose.Schema({
  questionIndex: { type: Number, default: 0 },
  questionTitle: { type: String, default: '' },
  code: { type: String, default: '' },
  passedTests: { type: Number, default: 0 },
  totalTests: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  maxPoints: { type: Number, default: 0 },
});

const codingSubmissionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingExam',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  code: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: 'javascript',
  },
  questionResults: [questionResultSchema],
  passedTests: {
    type: Number,
    required: true,
  },
  totalTests: {
    type: Number,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  violationsCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['completed', 'auto_submitted_violation', 'timed_out'],
    default: 'completed',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

// Fast lookup for coding challenge submissions
codingSubmissionSchema.index({ studentId: 1, examId: 1 });
codingSubmissionSchema.index({ examId: 1 });

module.exports = mongoose.model('CodingSubmission', codingSubmissionSchema);
