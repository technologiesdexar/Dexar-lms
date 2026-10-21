const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Payment = require('../models/Payment');
const Assessment = require('../models/Assessment');
const AssessmentSubmission = require('../models/AssessmentSubmission');
const CodingExam = require('../models/CodingExam');
const CodingSubmission = require('../models/CodingSubmission');
const LiveClass = require('../models/LiveClass');
const RecordedClass = require('../models/RecordedClass');
const Doubt = require('../models/Doubt');
const CourseMaterial = require('../models/CourseMaterial');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sendResetPasswordEmail } = require('../utils/emailService');
const { normalizeVideoUrl } = require('../utils/videoNormalizer');

/**
 * Resolves the public frontend URL dynamically.
 * Defaults to https://dexartechnologies.in and never uses localhost.
 */
function getResolvedFrontendUrl(req) {
  if (req && req.body && req.body.frontendUrl && typeof req.body.frontendUrl === 'string') {
    const candidate = req.body.frontendUrl.trim().replace(/\/+$/, '');
    if ((candidate.startsWith('http://') || candidate.startsWith('https://')) && !candidate.includes('localhost') && !candidate.includes('127.0.0.1')) {
      return candidate;
    }
  }

  const origin = req && req.headers ? (req.headers.origin || req.headers.referer) : null;
  if (origin && typeof origin === 'string') {
    try {
      const parsed = new URL(origin);
      if (parsed.protocol.startsWith('http') && !parsed.hostname.includes('localhost') && !parsed.hostname.includes('127.0.0.1')) {
        return parsed.origin;
      }
    } catch (e) {}
  }

  const envUrl = process.env.FRONTEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    if (!clean.includes('localhost') && !clean.includes('127.0.0.1')) {
      return clean;
    }
  }

  return 'https://dexartechnologies.in';
}

// All routes require SuperAdmin role
router.use(verifyToken, requireRole('superadmin'));

// ============================================================================
// 1. SUBJECTS CRUD
// ============================================================================

// Create Subject
router.post('/subjects', async (req, res) => {
  try {
    const { title, code, description } = req.body;
    if (!title || !code) {
      return res.status(400).json({ message: 'Title and subject code are required.' });
    }

    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Subject code already exists.' });
    }

    const subject = new Subject({
      title,
      code: code.toUpperCase(),
      description,
    });
    await subject.save();

    res.status(201).json({ message: 'Subject created successfully!', subject });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create subject.', error: error.message });
  }
});

// List Subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find().populate('trainerId', 'name email');
    res.json({ subjects });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subjects.', error: error.message });
  }
});

// Update Subject
router.put('/subjects/:id', async (req, res) => {
  try {
    const { title, code, description, trainerId } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found.' });
    }

    if (code && code.toUpperCase() !== subject.code) {
      const existing = await Subject.findOne({ code: code.toUpperCase(), _id: { $ne: subject._id } });
      if (existing) {
        return res.status(400).json({ message: 'Subject code already exists.' });
      }
      subject.code = code.toUpperCase();
    }

    if (title !== undefined) subject.title = title;
    if (description !== undefined) subject.description = description;

    if (trainerId !== undefined) {
      // If trainer changed, update trainer record
      if (subject.trainerId && String(subject.trainerId) !== String(trainerId)) {
        await User.findByIdAndUpdate(subject.trainerId, { $unset: { subjectId: 1 } });
      }
      subject.trainerId = trainerId || null;
      if (trainerId) {
        await User.findByIdAndUpdate(trainerId, { subjectId: subject._id });
      }
    }

    await subject.save();
    res.json({ message: 'Subject updated successfully!', subject });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update subject.', error: error.message });
  }
});

// Delete Subject
router.delete('/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found.' });
    }

    // Unassign from trainer and students
    await User.updateMany({ subjectId: req.params.id }, { $unset: { subjectId: 1 } });
    res.json({ message: 'Subject deleted successfully and unassigned from trainers and students.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete subject.', error: error.message });
  }
});

// ============================================================================
// 2. TRAINERS (ADMINS) CRUD
// ============================================================================

// Create Admin (Trainer) with Subject
router.post('/trainers', async (req, res) => {
  try {
    const { name, email, password, subjectId } = req.body;

    if (!name || !email || !password || !subjectId) {
      return res.status(400).json({ message: 'Name, email, password, and subject are required for Trainer.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(400).json({ message: 'Invalid subject selected.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const trainer = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      subjectId,
    });
    await trainer.save();

    // Assign trainer to subject
    subject.trainerId = trainer._id;
    await subject.save();

    res.status(201).json({ message: 'Admin Trainer created successfully!', trainer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create trainer.', error: error.message });
  }
});

// List Trainers with Student Counts & Enrolled Students
router.get('/trainers', async (req, res) => {
  try {
    const trainers = await User.find({ role: 'admin' }).populate('subjectId');
    const trainersWithStudents = await Promise.all(
      trainers.map(async (trainer) => {
        let students = [];
        if (trainer.subjectId) {
          students = await User.find({
            role: 'student',
            $or: [
              { subjectId: trainer.subjectId._id },
              { subjectIds: trainer.subjectId._id },
            ],
          }).select('name email paymentStatus planType startDate endDate amount accessGrantedByAdmin paymentRequested accessRequested accessRequestNote paymentRequestedAt accessRequestedAt');
        }
        return {
          ...trainer.toObject(),
          studentsCount: students.length,
          students,
        };
      })
    );
    res.json({ trainers: trainersWithStudents });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trainers.', error: error.message });
  }
});

// Update Trainer
router.put('/trainers/:id', async (req, res) => {
  try {
    const { name, email, password, subjectId } = req.body;
    const trainer = await User.findById(req.params.id);
    if (!trainer || trainer.role !== 'admin') {
      return res.status(404).json({ message: 'Admin Trainer not found.' });
    }

    if (email && email.toLowerCase() !== trainer.email.toLowerCase()) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: trainer._id } });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered.' });
      }
      trainer.email = email.toLowerCase();
    }

    if (name) trainer.name = name;
    if (password && password.trim()) {
      trainer.password = await bcrypt.hash(password.trim(), 10);
    }

    if (subjectId !== undefined) {
      if (trainer.subjectId && String(trainer.subjectId) !== String(subjectId)) {
        await Subject.findByIdAndUpdate(trainer.subjectId, { $unset: { trainerId: 1 } });
      }
      trainer.subjectId = subjectId || null;
      if (subjectId) {
        await Subject.findByIdAndUpdate(subjectId, { trainerId: trainer._id });
      }
    }

    await trainer.save();
    res.json({ message: 'Admin Trainer updated successfully!', trainer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update trainer.', error: error.message });
  }
});

// Delete Trainer
router.delete('/trainers/:id', async (req, res) => {
  try {
    const trainer = await User.findById(req.params.id);
    if (!trainer || trainer.role !== 'admin') {
      return res.status(404).json({ message: 'Admin Trainer not found.' });
    }

    await Subject.updateMany({ trainerId: trainer._id }, { $unset: { trainerId: 1 } });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Admin Trainer deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete trainer.', error: error.message });
  }
});

// ============================================================================
// 3. STUDENTS CRUD
// ============================================================================

// Create Student & Allocate Subject(s) & Set Subscription Plan & Custom Amount
// SuperAdmin is NOT required to set password - student sets their own upon first login
router.post('/students', async (req, res) => {
  try {
    const { name, email, password, subjectId, subjectIds, planType, startDate, endDate, amount, paymentStatus } = req.body;

    let allocatedSubjectIds = [];
    if (Array.isArray(subjectIds) && subjectIds.length > 0) {
      allocatedSubjectIds = subjectIds.filter(Boolean);
    } else if (subjectId) {
      allocatedSubjectIds = [subjectId];
    }

    if (!name || !email || allocatedSubjectIds.length === 0) {
      return res.status(400).json({ message: 'Name, email, and at least one course/subject are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    let isPasswordSet = false;
    let hashedPassword = '';
    let rawToken = null;
    let resetPasswordToken = null;
    let resetPasswordExpires = null;

    if (password && password.trim().length >= 6) {
      hashedPassword = await bcrypt.hash(password.trim(), 10);
      isPasswordSet = true;
    } else {
      // Student will set their own password
      hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      isPasswordSet = false;
      rawToken = crypto.randomBytes(32).toString('hex');
      resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      resetPasswordExpires = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days
    }

    let start = null;
    let end = null;

    if (planType === 'course_wise') {
      // Course-wise pack has no start or end date — permanent lifetime portal access
      start = null;
      end = null;
    } else {
      // Monthly pack is always 30 days
      start = new Date();
      end = new Date(start);
      end.setDate(end.getDate() + 30);
    }

    const customAmount = amount ? Number(amount) : (planType === 'monthly' ? 499 : 1499);

    const isPending = paymentStatus === 'pending';
    const student = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isPasswordSet,
      resetPasswordToken,
      resetPasswordExpires,
      role: 'student',
      subjectId: allocatedSubjectIds[0],
      subjectIds: allocatedSubjectIds,
      planType: planType || 'monthly',
      startDate: start,
      endDate: end,
      amount: customAmount,
      paymentStatus: isPending ? 'pending' : 'paid',
      accessGrantedByAdmin: false,
      paymentRequested: isPending,
      paymentRequestedAt: isPending ? new Date() : null,
    });

    await student.save();

    // Create Initial Payment Record
    const payment = new Payment({
      studentId: student._id,
      amount: customAmount,
      planType: student.planType,
      status: student.paymentStatus === 'paid' ? 'completed' : 'pending',
      transactionId: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
    });
    await payment.save();

    if (!isPasswordSet && rawToken) {
      const frontendBaseUrl = getResolvedFrontendUrl(req);
      const setupUrl = `${frontendBaseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(student.email)}&firstTime=true`;
      await sendResetPasswordEmail({
        to: student.email,
        name: student.name,
        resetUrl: setupUrl,
        isFirstTime: true,
      });
    }

    const populatedStudent = await User.findById(student._id).populate('subjectId').populate('subjectIds');

    res.status(201).json({
      message: isPasswordSet
        ? 'Student created and allocated successfully with predefined password!'
        : 'Student created successfully! They can set their password upon first login.',
      student: populatedStudent,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create student.', error: error.message });
  }
});

// List All Students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).populate('subjectId').populate('subjectIds');
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch students.', error: error.message });
  }
});

// Update Student
router.put('/students/:id', async (req, res) => {
  try {
    const { name, email, password, subjectId, subjectIds, planType, startDate, endDate, amount, paymentStatus } = req.body;
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (email && email.toLowerCase() !== student.email.toLowerCase()) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: student._id } });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered.' });
      }
      student.email = email.toLowerCase();
    }

    if (name) student.name = name;
    if (password && password.trim()) {
      student.password = await bcrypt.hash(password.trim(), 10);
    }
    if (subjectIds !== undefined) {
      const ids = Array.isArray(subjectIds)
        ? subjectIds.filter(Boolean).map((id) => (id._id || id).toString())
        : (subjectIds ? [(subjectIds._id || subjectIds).toString()] : []);
      student.subjectIds = ids;
      student.subjectId = ids.length > 0 ? ids[0] : null;
    } else if (subjectId !== undefined) {
      const singleId = (subjectId?._id || subjectId)?.toString() || null;
      student.subjectId = singleId;
      student.subjectIds = singleId ? [singleId] : [];
    }
    if (planType !== undefined) {
      student.planType = planType;
      if (planType === 'monthly') {
        // Monthly pack: exactly 30 days from startDate or now
        const start = student.startDate ? new Date(student.startDate) : new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + 30);
        student.startDate = start;
        student.endDate = end;
      }
    }
    if (planType === 'course_wise' || (!planType && student.planType === 'course_wise')) {
      // Course-wise pack has no start or end date — permanent lifetime portal access
      student.startDate = null;
      student.endDate = null;
    }
    if (amount !== undefined) student.amount = Number(amount);
    if (paymentStatus !== undefined) {
      student.paymentStatus = paymentStatus;
      if (paymentStatus === 'pending') {
        student.accessGrantedByAdmin = false;
        student.paymentRequested = true;
        student.paymentRequestedAt = new Date();
      } else if (paymentStatus === 'paid') {
        student.paymentRequested = false;
      }
    }

    await student.save();
    const populatedStudent = await User.findById(student._id).populate('subjectId').populate('subjectIds');
    res.json({ message: 'Student credentials updated successfully!', student: populatedStudent });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update student.', error: error.message });
  }
});

// Super Admin asks/requests student to make payment (locks student portal access)
router.put('/students/:id/request-payment', async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (req.body && req.body.amount !== undefined && req.body.amount !== null && !isNaN(Number(req.body.amount)) && Number(req.body.amount) > 0) {
      student.amount = Number(req.body.amount);
    }

    student.paymentStatus = 'pending';
    student.paymentRequested = true;
    student.paymentRequestedAt = new Date();
    student.accessGrantedByAdmin = false;
    await student.save();

    const populatedStudent = await User.findById(student._id).populate('subjectId');
    res.json({
      message: `Payment of ₹${student.amount} requested from ${student.name}. Portal access has been locked pending Razorpay payment.`,
      student: populatedStudent,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to request payment.', error: error.message });
  }
});

// Super Admin allows student access (unblocks student portal when payment is pending or Razorpay is unavailable)
router.put('/students/:id/grant-access', async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found.' });
    }

    student.paymentStatus = 'paid';
    student.accessGrantedByAdmin = true;
    student.accessRequested = false;
    student.paymentRequested = false;

    // Extend subscription validity: 30 days for monthly pack; permanent (no end date) for course-wise
    const now = new Date();
    if (student.planType === 'course_wise') {
      student.startDate = null;
      student.endDate = null;
    } else {
      let end = new Date(now);
      end.setDate(end.getDate() + 30);
      student.startDate = now;
      student.endDate = end;
    }
    await student.save();

    // Log this grant in the Payment collection so revenue/audit logs reflect it
    const payment = new Payment({
      studentId: student._id,
      amount: student.amount || (student.planType === 'course_wise' ? 1499 : 499),
      planType: student.planType || 'monthly',
      status: 'completed',
      paymentMethod: 'Manual Access Granted by Super Admin',
      transactionId: `SUPERADMIN-GRANT-${Date.now().toString().slice(-6)}`,
      paidAt: now,
    });
    await payment.save();

    const populatedStudent = await User.findById(student._id).populate('subjectId');
    res.json({
      message: `Access successfully granted to ${student.name}! Student can now use the portal.`,
      student: populatedStudent,
      payment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to grant access.', error: error.message });
  }
});

// Delete Student
router.delete('/students/:id', async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found.' });
    }

    await User.findByIdAndDelete(req.params.id);
    await Payment.deleteMany({ studentId: req.params.id });
    await AssessmentSubmission.deleteMany({ studentId: req.params.id });
    await CodingSubmission.deleteMany({ studentId: req.params.id });

    res.json({ message: 'Student and all associated records deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete student.', error: error.message });
  }
});

// ============================================================================
// 4. TRANSACTIONS CRUD
// ============================================================================

// View All Transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Payment.find()
      .populate('studentId', 'name email planType amount paymentStatus')
      .sort({ paidAt: -1 });

    const totalRevenue = transactions
      .filter((t) => t.status === 'completed')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    res.json({ transactions, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions.', error: error.message });
  }
});

// Update Transaction
router.put('/transactions/:id', async (req, res) => {
  try {
    const { amount, planType, status, paymentMethod, transactionId } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    if (amount !== undefined) payment.amount = Number(amount);
    if (planType !== undefined) payment.planType = planType;
    if (status !== undefined) payment.status = status;
    if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
    if (transactionId !== undefined) payment.transactionId = transactionId;

    await payment.save();
    res.json({ message: 'Transaction updated successfully!', payment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update transaction.', error: error.message });
  }
});

// Delete Transaction
router.delete('/transactions/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }
    res.json({ message: 'Transaction deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete transaction.', error: error.message });
  }
});

// ============================================================================
// 5. MARKS & SUBMISSIONS OVERSIGHT & UPDATES
// ============================================================================

// View Marks & Submissions Oversight
router.get('/marks', async (req, res) => {
  try {
    const assessmentSubmissions = await AssessmentSubmission.find()
      .populate('studentId', 'name email')
      .populate({
        path: 'assessmentId',
        select: 'title totalMarks subjectId isLockdown maxViolations',
        populate: { path: 'subjectId', select: 'title code' },
      })
      .sort({ submittedAt: -1 });

    const codingSubmissions = await CodingSubmission.find()
      .populate('studentId', 'name email')
      .populate({
        path: 'examId',
        select: 'title totalPoints subjectId isLockdown',
        populate: { path: 'subjectId', select: 'title code' },
      })
      .sort({ submittedAt: -1 });

    res.json({ assessmentSubmissions, codingSubmissions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch marks.', error: error.message });
  }
});

// Update MCQ Assessment Submission Score
router.put('/assessments/submissions/:id', async (req, res) => {
  try {
    const { score, status, violationsCount } = req.body;
    const submission = await AssessmentSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Assessment submission not found.' });
    }

    if (score !== undefined) submission.score = Number(score);
    if (status !== undefined) submission.status = status;
    if (violationsCount !== undefined) submission.violationsCount = Number(violationsCount);

    await submission.save();
    res.json({ message: 'Submission marks updated successfully!', submission });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update submission marks.', error: error.message });
  }
});

// Update Coding Submission Score
router.put('/coding-exams/submissions/:id', async (req, res) => {
  try {
    const { score, passedTests, status } = req.body;
    const submission = await CodingSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Coding submission not found.' });
    }

    if (score !== undefined) submission.score = Number(score);
    if (passedTests !== undefined) submission.passedTests = Number(passedTests);
    if (status !== undefined) submission.status = status;

    await submission.save();
    res.json({ message: 'Coding marks updated successfully!', submission });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update coding marks.', error: error.message });
  }
});

// Reset / Allow Retake
router.delete('/assessments/submissions/:id', async (req, res) => {
  try {
    const submission = await AssessmentSubmission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found or already reset.' });
    }
    res.json({ message: 'Assessment submission reset successfully by Super Admin! Student can now rewrite the exam.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset assessment submission.', error: error.message });
  }
});

router.post('/assessments/allow-retake', async (req, res) => {
  try {
    const { assessmentId, studentId, submissionId } = req.body;
    if (submissionId) {
      await AssessmentSubmission.findByIdAndDelete(submissionId);
    } else if (assessmentId && studentId) {
      await AssessmentSubmission.deleteMany({ assessmentId, studentId });
    } else {
      return res.status(400).json({ message: 'submissionId or (assessmentId and studentId) required.' });
    }
    res.json({ message: 'Student is now allowed to rewrite the assessment!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to allow assessment retake.', error: error.message });
  }
});

router.delete('/coding-exams/submissions/:id', async (req, res) => {
  try {
    const submission = await CodingSubmission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found or already reset.' });
    }
    res.json({ message: 'Coding exam submission reset successfully by Super Admin! Student can now rewrite the exam.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset coding submission.', error: error.message });
  }
});

router.post('/coding-exams/allow-retake', async (req, res) => {
  try {
    const { examId, studentId, submissionId } = req.body;
    if (submissionId) {
      await CodingSubmission.findByIdAndDelete(submissionId);
    } else if (examId && studentId) {
      await CodingSubmission.deleteMany({ examId, studentId });
    } else {
      return res.status(400).json({ message: 'submissionId or (examId and studentId) required.' });
    }
    res.json({ message: 'Student is now allowed to rewrite the coding exam!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to allow coding exam retake.', error: error.message });
  }
});

// ============================================================================
// 6. ASSESSMENTS (MCQ) & CODING EXAMS CRUD (SUPER ADMIN)
// ============================================================================

// List All Platform Assessments
router.get('/assessments', async (req, res) => {
  try {
    const assessments = await Assessment.find()
      .populate('subjectId', 'title code')
      .populate('trainerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ assessments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assessments.', error: error.message });
  }
});

// Create Assessment Directly
router.post('/assessments', async (req, res) => {
  try {
    const { title, subjectId, questions, dueDate, totalMarks, isLockdown, maxViolations, durationMinutes, accessPassword } = req.body;

    if (!title || !subjectId) {
      return res.status(400).json({ message: 'Title and subject are required.' });
    }

    const assessment = new Assessment({
      title,
      subjectId,
      trainerId: req.user._id,
      questions: questions || [],
      dueDate: dueDate || '2026-10-31',
      totalMarks: totalMarks || 100,
      isLockdown: isLockdown !== false,
      maxViolations: maxViolations || 3,
      durationMinutes: durationMinutes || 45,
      accessPassword: accessPassword || 'DEXAR2026',
    });
    await assessment.save();

    res.status(201).json({ message: 'Assessment created successfully by Super Admin!', assessment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create assessment.', error: error.message });
  }
});

// Update Assessment
router.put('/assessments/:id', async (req, res) => {
  try {
    const { title, subjectId, questions, dueDate, totalMarks, isLockdown, maxViolations, durationMinutes, accessPassword } = req.body;
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found.' });
    }

    if (title !== undefined) assessment.title = title;
    if (subjectId !== undefined) assessment.subjectId = subjectId;
    if (questions !== undefined) assessment.questions = questions;
    if (dueDate !== undefined) assessment.dueDate = dueDate;
    if (totalMarks !== undefined) assessment.totalMarks = totalMarks;
    if (isLockdown !== undefined) assessment.isLockdown = isLockdown;
    if (maxViolations !== undefined) assessment.maxViolations = maxViolations;
    if (durationMinutes !== undefined) assessment.durationMinutes = durationMinutes;
    if (accessPassword !== undefined) assessment.accessPassword = accessPassword;

    await assessment.save();
    res.json({ message: 'Assessment updated successfully!', assessment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update assessment.', error: error.message });
  }
});

// Delete Assessment
router.delete('/assessments/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found.' });
    }
    await AssessmentSubmission.deleteMany({ assessmentId: req.params.id });
    res.json({ message: 'Assessment and all associated submissions deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete assessment.', error: error.message });
  }
});

// List All Platform Coding Exams
router.get('/coding-exams', async (req, res) => {
  try {
    const codingExams = await CodingExam.find()
      .populate('subjectId', 'title code')
      .populate('trainerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ codingExams });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch coding exams.', error: error.message });
  }
});

// Create Coding Exam Directly
router.post('/coding-exams', async (req, res) => {
  try {
    const { title, subjectId, questions, problemStatement, starterCode, testCases, dueDate, totalPoints, isLockdown, maxViolations, durationMinutes, accessPassword } = req.body;

    const hasQuestionsList = Array.isArray(questions) && questions.length > 0;
    if (!title || !subjectId || (!problemStatement && !hasQuestionsList)) {
      return res.status(400).json({ message: 'Title, subject, and at least one coding question are required.' });
    }

    const computedPoints = hasQuestionsList
      ? questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0) || totalPoints || 100
      : totalPoints || 100;

    const firstQ = hasQuestionsList ? questions[0] : null;

    const codingExam = new CodingExam({
      title,
      subjectId,
      trainerId: req.user._id,
      questions: hasQuestionsList ? questions : [],
      problemStatement: firstQ?.problemStatement || problemStatement || '',
      starterCode: firstQ?.starterCode || starterCode || '// Write solution here\nfunction solution(input) {\n  return input;\n}',
      testCases: firstQ?.testCases || testCases || [],
      dueDate: dueDate || '2026-10-31',
      totalPoints: computedPoints,
      isLockdown: isLockdown !== false,
      maxViolations: maxViolations || 3,
      durationMinutes: durationMinutes || 60,
      accessPassword: accessPassword || 'DEXAR2026',
    });
    await codingExam.save();

    res.status(201).json({ message: 'Coding exam created successfully by Super Admin!', codingExam });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create coding exam.', error: error.message });
  }
});

// Update Coding Exam
router.put('/coding-exams/:id', async (req, res) => {
  try {
    const { title, subjectId, questions, problemStatement, starterCode, testCases, dueDate, totalPoints, isLockdown, maxViolations, durationMinutes, accessPassword } = req.body;
    const exam = await CodingExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Coding exam not found.' });
    }

    if (title !== undefined) exam.title = title;
    if (subjectId !== undefined) exam.subjectId = subjectId;
    if (questions !== undefined && Array.isArray(questions)) {
      exam.questions = questions;
      if (questions.length > 0) {
        exam.problemStatement = questions[0].problemStatement || exam.problemStatement;
        exam.starterCode = questions[0].starterCode || exam.starterCode;
        exam.testCases = questions[0].testCases || exam.testCases;
      }
    }
    if (problemStatement !== undefined) exam.problemStatement = problemStatement;
    if (starterCode !== undefined) exam.starterCode = starterCode;
    if (testCases !== undefined) exam.testCases = testCases;
    if (dueDate !== undefined) exam.dueDate = dueDate;
    if (totalPoints !== undefined) exam.totalPoints = totalPoints;
    if (isLockdown !== undefined) exam.isLockdown = isLockdown;
    if (maxViolations !== undefined) exam.maxViolations = maxViolations;
    if (durationMinutes !== undefined) exam.durationMinutes = durationMinutes;
    if (accessPassword !== undefined) exam.accessPassword = accessPassword;

    await exam.save();
    res.json({ message: 'Coding exam updated successfully!', exam });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update coding exam.', error: error.message });
  }
});

// Delete Coding Exam
router.delete('/coding-exams/:id', async (req, res) => {
  try {
    const exam = await CodingExam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Coding exam not found.' });
    }
    await CodingSubmission.deleteMany({ examId: req.params.id });
    res.json({ message: 'Coding exam and all associated submissions deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete coding exam.', error: error.message });
  }
});

// ============================================================================
// 7. LIVE CLASSES & RECORDED CLASSES (SUPER ADMIN)
// ============================================================================

router.get('/live-classes', async (req, res) => {
  try {
    const liveClasses = await LiveClass.find()
      .populate('subjectId', 'title code')
      .populate('trainerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ liveClasses });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch live classes.', error: error.message });
  }
});

router.put('/live-classes/:id', async (req, res) => {
  try {
    const { title, link, date, time, status, description, subjectId } = req.body;
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({ message: 'Live class not found.' });
    }

    if (title !== undefined) liveClass.title = title;
    if (link !== undefined) liveClass.link = link;
    if (date !== undefined) liveClass.date = date;
    if (time !== undefined) liveClass.time = time;
    if (status !== undefined) liveClass.status = status;
    if (description !== undefined) liveClass.description = description;
    if (subjectId !== undefined) liveClass.subjectId = subjectId;

    await liveClass.save();
    res.json({ message: 'Live class session updated successfully!', liveClass });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update live class.', error: error.message });
  }
});

router.delete('/live-classes/:id', async (req, res) => {
  try {
    const liveClass = await LiveClass.findByIdAndDelete(req.params.id);
    if (!liveClass) {
      return res.status(404).json({ message: 'Live class not found.' });
    }
    res.json({ message: 'Live class session deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete live class.', error: error.message });
  }
});

router.get('/recorded-classes', async (req, res) => {
  try {
    const recordedClasses = await RecordedClass.find()
      .populate('subjectId', 'title code')
      .populate('trainerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ recordedClasses });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recorded classes.', error: error.message });
  }
});

router.put('/recorded-classes/:id', async (req, res) => {
  try {
    const { title, videoUrl, notesUrl, description, duration, subjectId } = req.body;
    const recordedClass = await RecordedClass.findById(req.params.id);
    if (!recordedClass) {
      return res.status(404).json({ message: 'Recorded lecture not found.' });
    }

    if (title !== undefined) recordedClass.title = title;
    if (videoUrl !== undefined) recordedClass.videoUrl = normalizeVideoUrl(videoUrl);
    if (notesUrl !== undefined) recordedClass.notesUrl = notesUrl;
    if (description !== undefined) recordedClass.description = description;
    if (duration !== undefined) recordedClass.duration = duration;
    if (subjectId !== undefined) recordedClass.subjectId = subjectId;

    await recordedClass.save();
    res.json({ message: 'Recorded lecture updated successfully!', recordedClass });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update recorded lecture.', error: error.message });
  }
});

router.delete('/recorded-classes/:id', async (req, res) => {
  try {
    const recordedClass = await RecordedClass.findByIdAndDelete(req.params.id);
    if (!recordedClass) {
      return res.status(404).json({ message: 'Recorded lecture not found.' });
    }
    res.json({ message: 'Recorded lecture deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete recorded lecture.', error: error.message });
  }
});

// ============================================================================
// 8. DASHBOARD STATS
// ============================================================================

router.get('/dashboard', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTrainers = await User.countDocuments({ role: 'admin' });
    const totalSubjects = await Subject.countDocuments();
    const payments = await Payment.find({ status: 'completed' });
    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalAssessments = await Assessment.countDocuments();
    const totalCodingExams = await CodingExam.countDocuments();

    res.json({
      stats: {
        totalStudents,
        totalTrainers,
        totalSubjects,
        totalRevenue,
        totalAssessments,
        totalCodingExams,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats.', error: error.message });
  }
});

// ============================================================================
// 9. DOUBTS CHAT & STUDENT Q&A (SUPERADMIN)
// ============================================================================

router.get('/doubts', async (req, res) => {
  try {
    const { subjectId, status, search } = req.query;
    const filter = {};

    if (subjectId && subjectId !== 'all') {
      filter.subjectId = subjectId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { studentName: { $regex: q, $options: 'i' } },
        { studentEmail: { $regex: q, $options: 'i' } },
        { subjectName: { $regex: q, $options: 'i' } },
      ];
    }

    const doubts = await Doubt.find(filter)
      .populate('studentId', 'name email')
      .populate('subjectId', 'title code')
      .sort({ createdAt: -1 });

    const totalCount = await Doubt.countDocuments({});
    const pendingCount = await Doubt.countDocuments({ status: 'Pending' });
    const answeredCount = await Doubt.countDocuments({ status: 'Answered' });
    const resolvedCount = await Doubt.countDocuments({ status: 'Resolved' });

    res.json({
      doubts,
      stats: {
        totalCount,
        pendingCount,
        answeredCount,
        resolvedCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch doubts.', error: error.message });
  }
});

router.post('/doubts/:id/reply', async (req, res) => {
  try {
    const { message, status } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Reply message cannot be empty.' });
    }

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found.' });
    }

    doubt.replies.push({
      userId: req.user._id,
      userName: req.user.name || 'Super Administrator',
      userRole: 'superadmin',
      message: message.trim(),
      createdAt: new Date(),
    });

    doubt.status = status || 'Answered';
    doubt.updatedAt = new Date();

    await doubt.save();
    res.json({ message: 'Reply sent successfully!', doubt });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reply to doubt.', error: error.message });
  }
});

router.patch('/doubts/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Answered', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found.' });
    }

    doubt.status = status;
    doubt.updatedAt = new Date();
    await doubt.save();

    res.json({ message: `Doubt marked as ${status}!`, doubt });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update doubt status.', error: error.message });
  }
});

router.delete('/doubts/:id', async (req, res) => {
  try {
    const doubt = await Doubt.findByIdAndDelete(req.params.id);
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found.' });
    }
    res.json({ message: 'Doubt thread deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete doubt.', error: error.message });
  }
});

// ============================================================================
// 10. COURSE MATERIALS & GOOGLE DRIVE LIBRARY (SUPERADMIN)
// ============================================================================

router.get('/course-materials', async (req, res) => {
  try {
    const { subjectId } = req.query;
    const filter = {};

    if (subjectId && subjectId !== 'all') {
      filter.subjectId = subjectId;
    }

    const materials = await CourseMaterial.find(filter)
      .populate('subjectId', 'title code')
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ materials });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch course materials.', error: error.message });
  }
});

router.post('/course-materials', async (req, res) => {
  try {
    const { title, driveUrl, fileFormat, subjectId, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Material title is required.' });
    }

    if (!driveUrl || !driveUrl.trim()) {
      return res.status(400).json({ message: 'Google Drive link is required.' });
    }

    let format = (fileFormat || 'pdf').toLowerCase().trim();
    if (!['pdf', 'doc', 'docx', 'ppt', 'other'].includes(format)) {
      const lowerUrl = driveUrl.toLowerCase();
      if (lowerUrl.includes('.doc') || lowerUrl.includes('docs.google.com/document')) {
        format = 'docx';
      } else {
        format = 'pdf';
      }
    }

    let validSubjectId = null;
    if (subjectId && subjectId !== 'all') {
      const s = await Subject.findById(subjectId);
      if (s) validSubjectId = s._id;
    }

    const material = new CourseMaterial({
      title: title.trim(),
      driveUrl: driveUrl.trim(),
      fileFormat: format,
      subjectId: validSubjectId,
      description: description ? description.trim() : '',
      uploadedBy: req.user._id,
      uploadedByName: req.user.name || 'Super Administrator',
    });

    await material.save();
    await material.populate('subjectId', 'title code');

    res.status(201).json({ message: 'Course material added successfully!', material });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create course material.', error: error.message });
  }
});

router.put('/course-materials/:id', async (req, res) => {
  try {
    const { title, driveUrl, fileFormat, subjectId, description } = req.body;

    const material = await CourseMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Course material not found.' });
    }

    if (title !== undefined) material.title = title.trim();
    if (driveUrl !== undefined) material.driveUrl = driveUrl.trim();
    if (fileFormat !== undefined) material.fileFormat = fileFormat.toLowerCase().trim();
    if (description !== undefined) material.description = description.trim();
    if (subjectId !== undefined) {
      material.subjectId = subjectId && subjectId !== 'all' ? subjectId : null;
    }

    material.updatedAt = new Date();
    await material.save();
    await material.populate('subjectId', 'title code');

    res.json({ message: 'Course material updated successfully!', material });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update course material.', error: error.message });
  }
});

router.delete('/course-materials/:id', async (req, res) => {
  try {
    const material = await CourseMaterial.findByIdAndDelete(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Course material not found.' });
    }
    res.json({ message: 'Course material deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete course material.', error: error.message });
  }
});

module.exports = router;
