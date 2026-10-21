const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String, default: '' },
});

// Sub-schema for individual coding questions in a multi-question coding exam
const codingQuestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  problemStatement: {
    type: String,
    required: true,
  },
  starterCode: {
    type: String,
    default: '// Write your solution here\nfunction solution(input) {\n  return input;\n}',
  },
  points: {
    type: Number,
    default: 50,
  },
  testCases: [testCaseSchema],
});

const codingExamSchema = new mongoose.Schema({
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
  // Multi-question support: An exam can contain multiple questions
  questions: [codingQuestionSchema],

  // Legacy single-question fields (retained for backwards compatibility with existing exams)
  problemStatement: {
    type: String,
    default: '',
  },
  starterCode: {
    type: String,
    default: '// Write your solution here\nfunction solution(input) {\n  return input;\n}',
  },
  testCases: [testCaseSchema],

  dueDate: {
    type: String,
    default: '2026-10-31',
  },
  totalPoints: {
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
    default: 60,
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

// High-performance indexes for coding exams
codingExamSchema.index({ subjectId: 1, createdAt: -1 });
codingExamSchema.index({ trainerId: 1 });

module.exports = mongoose.model('CodingExam', codingExamSchema);
