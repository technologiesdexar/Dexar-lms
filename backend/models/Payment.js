const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  planType: {
    type: String,
    enum: ['monthly', 'course_wise'],
    required: true,
  },
  status: {
    type: String,
    enum: ['completed', 'pending'],
    default: 'completed',
  },
  paymentMethod: {
    type: String,
    default: 'Credit Card / UPI',
  },
  transactionId: {
    type: String,
    required: true,
  },
  razorpayOrderId: {
    type: String,
    default: '',
  },
  razorpayPaymentId: {
    type: String,
    default: '',
  },
  razorpaySignature: {
    type: String,
    default: '',
  },
  paidAt: {
    type: Date,
    default: Date.now,
  },
});

// Fast lookup for student billing history
paymentSchema.index({ studentId: 1, paidAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
