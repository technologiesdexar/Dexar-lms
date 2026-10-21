const mongoose = require('mongoose');

const assessmentSubmissionSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [{ type: Number }], // Array of selected option indices
  score: {
    type: Number,
    required: true,
  },
  totalMarks: {
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

// Critical index: fast lookup when 500 students check their attempt status
assessmentSubmissionSchema.index({ studentId: 1, assessmentId: 1 });
assessmentSubmissionSchema.index({ assessmentId: 1 });

module.exports = mongoose.model('AssessmentSubmission', assessmentSubmissionSchema);
