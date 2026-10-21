const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
    default: '',
  },
  isPasswordSet: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'student'],
    default: 'student',
  },
  // Assigned Subject ID for Admin/Trainer or Student
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null,
  },
  // Multiple Assigned Subjects (Courses) for Students
  subjectIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  }],
  // Subscription Plan details (for students created by SuperAdmin or signed up)
  planType: {
    type: String,
    enum: ['monthly', 'course_wise'],
    default: 'monthly',
  },
  startDate: {
    type: Date,
    default: function () {
      if (this.planType === 'course_wise') return null;
      return new Date();
    },
  },
  endDate: {
    type: Date,
    default: function () {
      if (this.planType === 'course_wise') return null;
      // Default 30 days from now for monthly plan
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d;
    },
  },
  amount: {
    type: Number,
    default: 499,
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending'],
    default: 'paid',
  },
  accessGrantedByAdmin: {
    type: Boolean,
    default: false,
  },
  paymentRequested: {
    type: Boolean,
    default: false,
  },
  paymentRequestedAt: {
    type: Date,
    default: null,
  },
  accessRequested: {
    type: Boolean,
    default: false,
  },
  accessRequestedAt: {
    type: Date,
    default: null,
  },
  accessRequestNote: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure course_wise students have null startDate and endDate (permanent access)
userSchema.pre('save', function (next) {
  if (this.planType === 'course_wise') {
    this.startDate = null;
    this.endDate = null;
  }
  next();
});

// High-performance indexes for 500+ concurrent students & trainers
userSchema.index({ role: 1, subjectId: 1 });
userSchema.index({ subjectId: 1 });
userSchema.index({ subjectIds: 1 });
userSchema.index({ resetPasswordToken: 1 });

module.exports = mongoose.model('User', userSchema);
