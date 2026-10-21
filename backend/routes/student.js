const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const vm = require('vm');
const Razorpay = require('razorpay');
const User = require('../models/User');
const Subject = require('../models/Subject');
const LiveClass = require('../models/LiveClass');
const RecordedClass = require('../models/RecordedClass');
const Assessment = require('../models/Assessment');
const AssessmentSubmission = require('../models/AssessmentSubmission');
const CodingExam = require('../models/CodingExam');
const CodingSubmission = require('../models/CodingSubmission');
const Payment = require('../models/Payment');
const Doubt = require('../models/Doubt');
const CourseMaterial = require('../models/CourseMaterial');
const { verifyToken, requireRole } = require('../middleware/auth');

const path = require('path');
const dotenv = require('dotenv');

// Helper to ensure freshest Razorpay credentials from backend/.env are always loaded
function getRazorpayConfig() {
  try {
    dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
  } catch (e) {
    // fallback if path resolution fails
    dotenv.config({ override: true });
  }
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  return { keyId, keySecret };
}

// All routes require Student role
router.use(verifyToken, requireRole('student'));

// Helper to extract all enrolled course IDs for a student
function getStudentCourseIds(user) {
  const ids = [];
  if (user && Array.isArray(user.subjectIds) && user.subjectIds.length > 0) {
    user.subjectIds.forEach((id) => {
      const idStr = (id && id._id ? id._id : id).toString();
      if (!ids.includes(idStr)) ids.push(idStr);
    });
  }
  if (user && user.subjectId) {
    const idStr = (user.subjectId._id ? user.subjectId._id : user.subjectId).toString();
    if (!ids.includes(idStr)) ids.push(idStr);
  }
  return ids;
}

// Student Dashboard Summary & Subscription details
router.get('/dashboard', async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'subjectId',
        populate: { path: 'trainerId', select: 'name email' },
      })
      .populate({
        path: 'subjectIds',
        populate: { path: 'trainerId', select: 'name email' },
      });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Deduplicate enrolled courses
    const courseMap = new Map();
    if (Array.isArray(student.subjectIds)) {
      student.subjectIds.forEach((s) => {
        if (s && s._id) courseMap.set(s._id.toString(), s);
      });
    }
    if (student.subjectId && student.subjectId._id && !courseMap.has(student.subjectId._id.toString())) {
      courseMap.set(student.subjectId._id.toString(), student.subjectId);
    }
    const enrolledCourses = Array.from(courseMap.values());

    // Days remaining calculation & permanent access for course_wise
    const isCourseWise = student.planType === 'course_wise';
    let daysRemaining = null;
    let isExpired = false;

    if (isCourseWise) {
      daysRemaining = null;
      isExpired = false;
    } else {
      const now = new Date();
      const end = student.endDate ? new Date(student.endDate) : now;
      const diffTime = Math.max(0, end - now);
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isExpired = daysRemaining <= 0;
    }

    const payments = await Payment.find({ studentId: student._id }).sort({ paidAt: -1 });

    res.json({
      student,
      enrolledCourses,
      subscription: {
        planType: student.planType,
        startDate: isCourseWise ? null : student.startDate,
        endDate: isCourseWise ? null : student.endDate,
        daysRemaining: isCourseWise ? null : daysRemaining,
        amount: student.amount,
        paymentStatus: student.paymentStatus,
        accessGrantedByAdmin: student.accessGrantedByAdmin || false,
        paymentRequested: student.paymentRequested || false,
        paymentRequestedAt: student.paymentRequestedAt || null,
        accessRequested: student.accessRequested || false,
        accessRequestedAt: student.accessRequestedAt || null,
        accessRequestNote: student.accessRequestNote || '',
        isExpired: isCourseWise ? false : isExpired,
        isPermanent: isCourseWise,
      },
      recentPayments: payments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student dashboard.', error: error.message });
  }
});

// 1. Razorpay: Create Order (Using SuperAdmin Allocated Student Price)
router.post('/razorpay/create-order', async (req, res) => {
  try {
    const student = await User.findById(req.user._id).populate('subjectId');
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const { keyId, keySecret } = getRazorpayConfig();

    // Check if valid live/test Razorpay keys are configured
    if (!keyId || !keySecret || keyId.startsWith('rzp_test_dexar') || keyId.includes('placeholder')) {
      return res.status(400).json({
        message: 'Razorpay API keys (Key ID & Key Secret) are not yet configured in backend/.env. Please configure your live Razorpay Key ID and Secret in backend/.env, or contact the Super Admin for manual access.',
        requiresConfig: true,
      });
    }

    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

    // Use strictly the price allocated to this student by the Super Admin
    const allocatedAmount = (student.amount !== undefined && student.amount !== null && !isNaN(Number(student.amount)) && Number(student.amount) > 0)
      ? Number(student.amount)
      : (student.planType === 'course_wise' ? 1499 : 499);

    const amountInPaise = Math.round(allocatedAmount * 100);
    const receipt = `rcpt_${student._id.toString().slice(-6)}_${Date.now().toString().slice(-6)}`;

    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        studentId: student._id.toString(),
        studentEmail: student.email,
        studentName: student.name,
        courseTitle: student.subjectId?.title || 'Dexar Learning Course',
        planType: student.planType || 'monthly',
        allocatedFee: String(allocatedAmount),
      },
    });

    console.log(`[RAZORPAY ORDER CREATED] Mode: ${keyId.startsWith('rzp_live') ? 'LIVE' : 'TEST'} | Order: ${order.id} | Allocated Price: ₹${allocatedAmount} for ${student.email}`);

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      isLiveMode: keyId.startsWith('rzp_live'),
      planType: student.planType || 'monthly',
      amountInRupees: allocatedAmount,
      courseTitle: student.subjectId?.title || 'Enrolled Course',
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({
      message: `Failed to create Razorpay order: ${error.error?.description || error.message || 'Razorpay service error'}. If this persists, please contact the Super Admin to grant manual access.`,
      error: error.message,
    });
  }
});

// 2. Razorpay: Verify Payment Signature & Activate Subscription
router.post('/razorpay/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType, paymentMethod } = req.body;
    const student = await User.findById(req.user._id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const { keySecret } = getRazorpayConfig();
    if (!keySecret || keySecret === 'dexar_razorpay_secret_key') {
      return res.status(400).json({ message: 'Razorpay Secret Key not configured in backend/.env.' });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay verification parameters.' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
    }

    const effectivePlan = student.planType || planType || 'monthly';
    const allocatedAmount = (student.amount !== undefined && student.amount !== null && !isNaN(Number(student.amount)) && Number(student.amount) > 0)
      ? Number(student.amount)
      : (effectivePlan === 'course_wise' ? 1499 : 499);

    student.paymentStatus = 'paid';
    student.planType = effectivePlan;
    student.amount = allocatedAmount;
    student.accessGrantedByAdmin = false;
    student.paymentRequested = false;
    student.accessRequested = false;

    const now = new Date();
    if (effectivePlan === 'course_wise') {
      // Course-wise pack has no start or end date — permanent lifetime portal access
      student.startDate = null;
      student.endDate = null;
    } else {
      // Monthly pack: exactly 30 days validity from time of payment
      const end = new Date(now);
      end.setDate(end.getDate() + 30);
      student.startDate = now;
      student.endDate = end;
    }
    await student.save();

    const payment = new Payment({
      studentId: student._id,
      amount: allocatedAmount,
      planType: effectivePlan,
      status: 'completed',
      paymentMethod: paymentMethod || 'Razorpay (Cards / UPI / NetBanking)',
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paidAt: now,
    });
    await payment.save();

    res.json({
      message: 'Razorpay payment verified! Subscription activated successfully.',
      student,
      payment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment verification failed.', error: error.message });
  }
});

// 3. Student requests manual access from Super Admin (e.g. if Razorpay is not working or payment issue)
router.post('/request-admin-access', async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    student.accessRequested = true;
    student.accessRequestedAt = new Date();
    student.accessRequestNote = req.body.note || 'Student reported issue with Razorpay payment.';
    await student.save();

    res.json({
      message: 'Your access request has been sent to the Super Admin! The Super Admin can now approve and unlock your portal.',
      student,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit access request.', error: error.message });
  }
});

// Process / Direct Payment (for backward compatibility and offline manual renewals)
router.post('/pay', async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const effectivePlan = req.body.planType || student.planType || 'monthly';
    const amount = effectivePlan === 'course_wise' ? 1499 : 499;

    student.paymentStatus = 'paid';
    student.planType = effectivePlan;
    student.amount = amount;

    const now = new Date();
    if (effectivePlan === 'course_wise') {
      // Course-wise pack has no start or end date — permanent lifetime portal access
      student.startDate = null;
      student.endDate = null;
    } else {
      const end = new Date();
      end.setDate(end.getDate() + 30);
      student.startDate = now;
      student.endDate = end;
    }
    await student.save();

    const payment = new Payment({
      studentId: student._id,
      amount,
      planType: effectivePlan,
      status: 'completed',
      paymentMethod: req.body.paymentMethod || 'Razorpay UPI / Cards',
      transactionId: req.body.transactionId || ('TXN-' + Math.floor(100000 + Math.random() * 900000)),
      paidAt: now,
    });
    await payment.save();

    res.json({ message: 'Payment successful! Subscription activated.', student, payment });
  } catch (error) {
    res.status(500).json({ message: 'Payment failed.', error: error.message });
  }
});

// GET Live Classes allocated to Student's subject(s)
router.get('/live-classes', async (req, res) => {
  try {
    const allowedSubIds = getStudentCourseIds(req.user);
    if (allowedSubIds.length === 0) return res.json({ liveClasses: [] });

    let filter = { subjectId: { $in: allowedSubIds } };
    if (req.query.subjectId && allowedSubIds.includes(String(req.query.subjectId))) {
      filter = { subjectId: req.query.subjectId };
    }

    const liveClasses = await LiveClass.find(filter)
      .populate('subjectId', 'title code')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ liveClasses });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch live classes.', error: error.message });
  }
});

// GET Recorded Classes (Videos & Notes) allocated to Student's subject(s)
router.get('/recorded-classes', async (req, res) => {
  try {
    const allowedSubIds = getStudentCourseIds(req.user);
    if (allowedSubIds.length === 0) return res.json({ recordedClasses: [] });

    let filter = { subjectId: { $in: allowedSubIds } };
    if (req.query.subjectId && allowedSubIds.includes(String(req.query.subjectId))) {
      filter = { subjectId: req.query.subjectId };
    }

    const recordedClasses = await RecordedClass.find(filter)
      .populate('subjectId', 'title code')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ recordedClasses });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recorded classes.', error: error.message });
  }
});

// GET Assessments allocated to Student's subject(s)
router.get('/assessments', async (req, res) => {
  try {
    const allowedSubIds = getStudentCourseIds(req.user);
    if (allowedSubIds.length === 0) return res.json({ assessments: [] });

    let filter = { subjectId: { $in: allowedSubIds } };
    if (req.query.subjectId && allowedSubIds.includes(String(req.query.subjectId))) {
      filter = { subjectId: req.query.subjectId };
    }

    const assessments = await Assessment.find(filter)
      .populate('subjectId', 'title code')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch existing submissions for this student
    const submissions = await AssessmentSubmission.find({ studentId: req.user._id });
    const submissionMap = {};
    submissions.forEach((sub) => {
      submissionMap[sub.assessmentId.toString()] = sub;
    });

    const result = assessments.map((ast) => {
      const sub = submissionMap[ast._id.toString()];
      const astObj = typeof ast.toObject === 'function' ? ast.toObject() : ast;
      return {
        ...astObj,
        mySubmission: sub || null,
      };
    });

    res.json({ assessments: result });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assessments.', error: error.message });
  }
});

// SUBMIT Assessment Answers
router.post('/assessments/:id/submit', async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found.' });

    const { answers, violationsCount, status } = req.body; // Array of selected indices
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array required.' });
    }

    let score = 0;
    assessment.questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && Number(answers[idx]) === q.correctOptionIndex) {
        score += q.marks || 10;
      }
    });

    // Save or update submission
    let submission = await AssessmentSubmission.findOne({
      assessmentId: assessment._id,
      studentId: req.user._id,
    });

    if (submission) {
      submission.answers = answers;
      submission.score = score;
      submission.violationsCount = violationsCount || 0;
      submission.status = status || 'completed';
      submission.submittedAt = new Date();
    } else {
      submission = new AssessmentSubmission({
        assessmentId: assessment._id,
        studentId: req.user._id,
        answers,
        score,
        totalMarks: assessment.totalMarks,
        violationsCount: violationsCount || 0,
        status: status || 'completed',
      });
    }

    await submission.save();

    res.json({ message: 'Assessment submitted successfully!', score, totalMarks: assessment.totalMarks, submission });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit assessment.', error: error.message });
  }
});

// GET Coding Exams allocated to Student's subject(s)
router.get('/coding-exams', async (req, res) => {
  try {
    const allowedSubIds = getStudentCourseIds(req.user);
    if (allowedSubIds.length === 0) return res.json({ codingExams: [] });

    let filter = { subjectId: { $in: allowedSubIds } };
    if (req.query.subjectId && allowedSubIds.includes(String(req.query.subjectId))) {
      filter = { subjectId: req.query.subjectId };
    }

    const codingExams = await CodingExam.find(filter)
      .populate('subjectId', 'title code')
      .sort({ createdAt: -1 })
      .lean();

    const submissions = await CodingSubmission.find({ studentId: req.user._id });
    const submissionMap = {};
    submissions.forEach((sub) => {
      submissionMap[sub.examId.toString()] = sub;
    });

    const cleanDefaultStub = 'function solution(input) {\n  // Write your logic here\n  \n}';

    const result = codingExams.map((exam) => {
      const sub = submissionMap[exam._id.toString()];
      const examObj = typeof exam.toObject === 'function' ? exam.toObject() : { ...exam };

      // Ensure starterCode never leaks the answer
      if (examObj.starterCode && (examObj.starterCode.includes('.reverse().join') || examObj.starterCode.includes('return input.split') || examObj.starterCode.includes('return input;'))) {
        examObj.starterCode = cleanDefaultStub;
      }

      if (examObj.questions && Array.isArray(examObj.questions)) {
        examObj.questions = examObj.questions.map((q) => {
          let qCode = q.starterCode || cleanDefaultStub;
          if (qCode.includes('.reverse().join') || qCode.includes('return input.split') || qCode.includes('return input;')) {
            qCode = cleanDefaultStub;
          }
          return {
            ...q,
            starterCode: qCode,
          };
        });
      }

      return {
        ...examObj,
        mySubmission: sub || null,
      };
    });

    res.json({ codingExams: result });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch coding exams.', error: error.message });
  }
});

// =========================================================================
// MULTI-LANGUAGE CODE COMPILER & TEST CASE EVALUATION ENGINE
// Supports: JavaScript (ES6), Python 3, C++ (GCC), Java 17
// =========================================================================

async function executeInJudge0(sourceCode, languageId, stdin, timeoutSec = 10) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSec * 1000);
  try {
    const res = await fetch('https://ce.judge0.com/submissions?wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin !== undefined && stdin !== null ? String(stdin) : '',
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { error: `Compiler service returned status ${res.status}` };
    }
    const data = await res.json();
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      return { error: 'Time Limit Exceeded: Execution took longer than 10 seconds.' };
    }
    return { error: err.message };
  }
}

function executeJavaScriptLocal(code, rawInput, timeoutMs = 4000) {
  let logs = [];
  const standardKeys = new Set([
    'console', 'input', 'parseInt', 'parseFloat', 'Math', 'Date',
    'JSON', 'Array', 'String', 'Number', 'Boolean', 'RegExp', 'Object',
    'Map', 'Set', 'BigInt', 'Symbol', 'Infinity', 'NaN', 'undefined', '__dexar_run'
  ]);

  const sandbox = {
    console: {
      log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      error: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      warn: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      info: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
    },
    input: rawInput,
    parseInt,
    parseFloat,
    Math,
    Date,
    JSON,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Object,
    Map,
    Set,
    BigInt,
  };

  const context = vm.createContext(sandbox);

  try {
    // 1. Run the user's script in the sandbox
    const userScript = new vm.Script(code);
    const evalResult = userScript.runInContext(context, { timeout: timeoutMs });

    // 2. Discover user's solution function if one was defined
    let fn = null;
    if (typeof sandbox.solution === 'function') {
      fn = sandbox.solution;
    } else if (typeof sandbox.solve === 'function') {
      fn = sandbox.solve;
    } else if (typeof sandbox.twoSum === 'function') {
      fn = sandbox.twoSum;
    } else if (typeof evalResult === 'function') {
      fn = evalResult;
    } else {
      // Find any function declared by user
      for (const key of Object.keys(sandbox)) {
        if (!standardKeys.has(key) && typeof sandbox[key] === 'function') {
          fn = sandbox[key];
          break;
        }
      }
    }

    // 3. If a function was found, call it with arguments
    if (fn) {
      let args = [];
      let lines = [];
      if (rawInput !== undefined && rawInput !== null) {
        const strIn = String(rawInput).trim();
        lines = strIn.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 1) {
          args = lines.map(line => {
            try {
              return JSON.parse(line);
            } catch {
              if (!isNaN(Number(line)) && line !== '') {
                return Number(line);
              }
              return line;
            }
          });
        } else {
          try {
            args = JSON.parse('[' + strIn + ']');
          } catch (e) {
            try {
              args = [JSON.parse(strIn)];
            } catch (e2) {
              args = [strIn];
            }
          }
        }
      }

      sandbox.__dexar_run = () => {
        try {
          return fn(...args);
        } catch (firstErr) {
          if (lines.length > 1) {
            try {
              return fn(String(rawInput).trim());
            } catch {}
          }
          throw firstErr;
        }
      };
      const runnerScript = new vm.Script('__dexar_run()');
      const res = runnerScript.runInContext(context, { timeout: timeoutMs });

      if (res !== undefined && res !== null) {
        return { output: typeof res === 'object' ? JSON.stringify(res) : String(res).trim(), error: null };
      }
    } else if (evalResult !== undefined && evalResult !== null && evalResult !== '') {
      return { output: typeof evalResult === 'object' ? JSON.stringify(evalResult) : String(evalResult).trim(), error: null };
    }

    if (logs.length > 0) {
      return { output: logs.join('\n').trim(), error: null };
    }

    return { output: '', error: null };
  } catch (err) {
    const isTimeout = err.message && (err.message.includes('timed out') || err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT');
    return {
      output: isTimeout ? 'Time Limit Exceeded (TLE): Code took longer than 4.0s to execute.' : '',
      error: isTimeout ? 'Time Limit Exceeded' : err.message,
    };
  }
}

function normalizeOutput(val) {
  if (val === undefined || val === null) return '';
  return String(val).trim().replace(/\r\n/g, '\n');
}

function areOutputsEqual(actual, expected) {
  const cleanActual = normalizeOutput(actual);
  const cleanExpected = normalizeOutput(expected);

  if (cleanActual === cleanExpected) return true;
  if (cleanActual.toLowerCase() === cleanExpected.toLowerCase()) return true;

  // JSON comparison
  try {
    const aJson = JSON.stringify(JSON.parse(cleanActual));
    const eJson = JSON.stringify(JSON.parse(cleanExpected));
    if (aJson === eJson || aJson.toLowerCase() === eJson.toLowerCase()) return true;
  } catch (e) {}

  // Numeric comparison (e.g., 10.0 vs 10)
  if (!isNaN(Number(cleanActual)) && !isNaN(Number(cleanExpected)) && cleanActual !== '' && cleanExpected !== '') {
    if (Number(cleanActual) === Number(cleanExpected)) return true;
  }

  return false;
}

async function evaluateTestCase(code, rawInput, expectedOutput, language = 'javascript') {
  let actualOutput = '';
  let runError = null;
  const cleanLang = (language || 'javascript').toLowerCase();

  try {
    if (cleanLang === 'javascript' || cleanLang === 'js') {
      const res = executeJavaScriptLocal(code, rawInput);
      if (res.error) {
        runError = res.error;
        actualOutput = 'Runtime Error: ' + res.error;
      } else {
        actualOutput = res.output;
      }
    } else if (cleanLang === 'python' || cleanLang === 'py') {
      const harness = `
import sys, json

${code}

if __name__ == '__main__' or True:
    try:
        raw_in = sys.stdin.read().strip()
        if 'solution' in globals() and callable(globals()['solution']):
            lines = [l.strip() for l in raw_in.splitlines() if l.strip()]
            parsed_args = []
            if len(lines) > 1:
                for line in lines:
                    try:
                        parsed_args.append(json.loads(line))
                    except Exception:
                        parsed_args.append(line)
            else:
                try:
                    parsed_args = json.loads('[' + raw_in + ']')
                except Exception:
                    try:
                        parsed_args = [json.loads(raw_in)]
                    except Exception:
                        parsed_args = [raw_in]
            try:
                res = globals()['solution'](*parsed_args)
            except Exception:
                try:
                    res = globals()['solution'](raw_in)
                except Exception:
                    res = globals()['solution'](*parsed_args)
            if res is not None:
                if isinstance(res, bool):
                    print(str(res).lower())
                elif isinstance(res, (dict, list)):
                    print(json.dumps(res))
                else:
                    print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()
`;
      const res = await executeInJudge0(harness, 71, rawInput);
      if (res.compile_output && res.compile_output.trim()) {
        runError = res.compile_output.trim();
        actualOutput = 'Compile Error: ' + runError;
      } else if (res.stderr && res.stderr.trim()) {
        runError = res.stderr.trim();
        actualOutput = 'Runtime Error: ' + runError;
      } else if (res.stdout !== null && res.stdout !== undefined) {
        actualOutput = res.stdout.trim();
      } else if (res.status && res.status.description && res.status.description !== 'Accepted') {
        runError = res.status.description;
        actualOutput = res.status.description;
      } else {
        actualOutput = '';
      }
    } else if (cleanLang === 'cpp' || cleanLang === 'c++') {
      let cppCode = code;
      if (!cppCode.includes('main(')) {
        cppCode += `
#include <iostream>
#include <string>
using namespace std;
int main() {
    string in;
    if (cin >> in) {
        cout << solution(in);
    }
    return 0;
}
`;
      }
      const res = await executeInJudge0(cppCode, 54, rawInput);
      if (res.compile_output && res.compile_output.trim()) {
        runError = res.compile_output.trim();
        actualOutput = 'Compile Error: ' + runError;
      } else if (res.stderr && res.stderr.trim()) {
        runError = res.stderr.trim();
        actualOutput = 'Runtime Error: ' + runError;
      } else if (res.stdout !== null && res.stdout !== undefined) {
        actualOutput = res.stdout.trim();
      } else {
        actualOutput = res.status?.description || '';
      }
    } else if (cleanLang === 'java') {
      let javaCode = code;
      if (!javaCode.includes('public class Main') && javaCode.includes('public class ')) {
        javaCode = javaCode.replace(/public\s+class\s+[A-Za-z0-9_]+/, 'public class Main');
      } else if (!javaCode.includes('class Main')) {
        javaCode = `import java.util.*;\npublic class Main {\n${javaCode}\n}`;
      }
      if (!javaCode.includes('main(')) {
        javaCode = javaCode.replace(/}\s*$/, `
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    if (sc.hasNext()) {
      System.out.print(solution(sc.next()));
    }
  }
}`);
      }
      const res = await executeInJudge0(javaCode, 62, rawInput);
      if (res.compile_output && res.compile_output.trim()) {
        runError = res.compile_output.trim();
        actualOutput = 'Compile Error: ' + runError;
      } else if (res.stderr && res.stderr.trim()) {
        runError = res.stderr.trim();
        actualOutput = 'Runtime Error: ' + runError;
      } else if (res.stdout !== null && res.stdout !== undefined) {
        actualOutput = res.stdout.trim();
      } else {
        actualOutput = res.status?.description || '';
      }
    } else {
      const res = executeJavaScriptLocal(code, rawInput);
      actualOutput = res.error ? 'Runtime Error: ' + res.error : res.output;
      if (res.error) runError = res.error;
    }
  } catch (err) {
    runError = err.message;
    actualOutput = 'Runtime Error: ' + err.message;
  }

  const isPassed = !runError && areOutputsEqual(actualOutput, expectedOutput);
  return { actualOutput: actualOutput || '(No output produced)', isPassed };
}

// RUN / TEST Coding Exam code against test cases
router.post('/coding-exams/run-test', async (req, res) => {
  try {
    const { code, testCases, language = 'javascript' } = req.body;
    if (!code || !testCases || !Array.isArray(testCases)) {
      return res.status(400).json({ message: 'Code and test cases are required.' });
    }

    const startTime = Date.now();
    let passedCount = 0;
    const testResults = [];

    // Run sequentially to prevent rate limiting, memory pressure & network timeouts
    for (let idx = 0; idx < testCases.length; idx++) {
      const tc = testCases[idx];
      try {
        const { actualOutput, isPassed } = await evaluateTestCase(code, tc.input, tc.output, language);
        if (isPassed) passedCount++;
        testResults.push({
          testCaseIndex: idx + 1,
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput,
          passed: isPassed,
        });
      } catch (tcErr) {
        testResults.push({
          testCaseIndex: idx + 1,
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput: 'Runtime Error: ' + tcErr.message,
          passed: false,
        });
      }
    }

    const runtimeMs = Date.now() - startTime;
    res.json({ passedCount, totalTests: testCases.length, testResults, runtimeMs });
  } catch (error) {
    res.status(200).json({
      passedCount: 0,
      totalTests: req.body?.testCases?.length || 0,
      testResults: (req.body?.testCases || []).map((tc, idx) => ({
        testCaseIndex: idx + 1,
        input: tc.input,
        expectedOutput: tc.output,
        actualOutput: 'Execution Error: ' + error.message,
        passed: false,
      })),
      runtimeMs: 0,
    });
  }
});

// SUBMIT Coding Exam Code (Supports both single question and multi-question exams)
router.post('/coding-exams/:id/submit', async (req, res) => {
  try {
    const exam = await CodingExam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Coding exam not found.' });

    const { code, language = 'javascript', violationsCount, status, questionSubmissions } = req.body;

    let overallPassed = 0;
    let overallTotal = 0;
    let finalScore = 0;
    const questionResults = [];

    // Extract questions list (multi-question or fallback to single question)
    const examQuestions = (exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0)
      ? exam.questions
      : [{
          title: exam.title,
          problemStatement: exam.problemStatement || '',
          starterCode: exam.starterCode || '',
          testCases: exam.testCases || [],
          points: exam.totalPoints || 100,
        }];

    if (questionSubmissions && Array.isArray(questionSubmissions) && questionSubmissions.length > 0) {
      for (let qIdx = 0; qIdx < examQuestions.length; qIdx++) {
        const q = examQuestions[qIdx];
        const sub = questionSubmissions.find((s) => s.questionIndex === qIdx) || {};
        const qCode = sub.code !== undefined ? sub.code : (qIdx === 0 ? code : '');
        const tcs = q.testCases || [];
        let qPassed = 0;

        for (const tc of tcs) {
          try {
            const r = await evaluateTestCase(qCode || '', tc.input, tc.output, language);
            if (r.isPassed) qPassed++;
          } catch {
            // treat unhandled case as failed without crashing submission
          }
        }

        const qTotalTests = tcs.length;
        const qMaxPoints = Number(q.points) || Math.round(exam.totalPoints / examQuestions.length) || 50;

        // Requirement 3:
        // If student output and testcase output both match for all test cases, give full marks for this problem.
        // Otherwise, if any testcase fails, give 0 marks.
        const qAllPassed = qTotalTests > 0 && qPassed === qTotalTests;
        const qScore = qAllPassed ? qMaxPoints : 0;

        overallPassed += qPassed;
        overallTotal += qTotalTests;
        finalScore += qScore;

        questionResults.push({
          questionIndex: qIdx,
          questionTitle: q.title || `Problem ${qIdx + 1}`,
          code: qCode || '',
          passedTests: qPassed,
          totalTests: qTotalTests,
          score: qScore,
          maxPoints: qMaxPoints,
        });
      }
    } else {
      // Single code submission
      const tcs = (examQuestions[0]?.testCases?.length ? examQuestions[0].testCases : exam.testCases) || [];
      for (const tc of tcs) {
        try {
          const r = await evaluateTestCase(code || '', tc.input, tc.output, language);
          if (r.isPassed) overallPassed++;
        } catch {
          // treat unhandled case as failed without crashing submission
        }
      }

      const totalTestsCount = tcs.length;
      overallTotal = totalTestsCount;

      // Requirement 3:
      // If student output and testcase output both match for all test cases, give full marks.
      // Otherwise, give 0 marks.
      const isAllPassed = totalTestsCount > 0 && overallPassed === totalTestsCount;
      finalScore = isAllPassed ? (exam.totalPoints || 100) : 0;

      questionResults.push({
        questionIndex: 0,
        questionTitle: exam.title,
        code: code || '',
        passedTests: overallPassed,
        totalTests: totalTestsCount,
        score: finalScore,
        maxPoints: exam.totalPoints || 100,
      });
    }

    // Ensure total score does not exceed exam total points
    finalScore = Math.min(finalScore, exam.totalPoints || 100);

    let submission = await CodingSubmission.findOne({
      examId: exam._id,
      studentId: req.user._id,
    });

    if (submission) {
      submission.code = code || questionResults[0]?.code || '';
      submission.language = language || 'javascript';
      submission.passedTests = overallPassed;
      submission.totalTests = overallTotal || 1;
      submission.score = finalScore;
      submission.questionResults = questionResults;
      submission.violationsCount = violationsCount || 0;
      submission.status = status || 'completed';
      submission.submittedAt = new Date();
    } else {
      submission = new CodingSubmission({
        examId: exam._id,
        studentId: req.user._id,
        code: code || questionResults[0]?.code || '',
        language: language || 'javascript',
        passedTests: overallPassed,
        totalTests: overallTotal || 1,
        score: finalScore,
        questionResults,
        violationsCount: violationsCount || 0,
        status: status || 'completed',
      });
    }

    await submission.save();

    res.json({
      message: 'Coding exam submitted!',
      passedTests: overallPassed,
      totalTests: overallTotal,
      score: finalScore,
      submission,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit coding exam.', error: error.message });
  }
});

// GET Student consolidated Marks & Exam Results
router.get('/marks', async (req, res) => {
  try {
    const assessmentSubmissions = await AssessmentSubmission.find({ studentId: req.user._id })
      .populate('assessmentId', 'title totalMarks dueDate isLockdown')
      .sort({ submittedAt: -1 });

    const codingSubmissions = await CodingSubmission.find({ studentId: req.user._id })
      .populate('examId', 'title totalPoints dueDate isLockdown')
      .sort({ submittedAt: -1 });

    res.json({ assessmentSubmissions, codingSubmissions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student marks.', error: error.message });
  }
});

// ============================================================================
// STUDENT DOUBTS CHAT & MENTOR HELP
// ============================================================================

// Get doubts for the current student (or all doubts for student's enrolled courses)
router.get('/doubts', async (req, res) => {
  try {
    const studentCourseIds = getStudentCourseIds(req.user);
    const { subjectId } = req.query;

    const filter = {
      $or: [
        { studentId: req.user._id },
        ...(subjectId
          ? [{ subjectId }]
          : studentCourseIds.length > 0
          ? [{ subjectId: { $in: studentCourseIds } }]
          : []),
      ],
    };

    const doubts = await Doubt.find(filter)
      .populate('subjectId', 'title code')
      .sort({ createdAt: -1 });

    res.json({ doubts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student doubts.', error: error.message });
  }
});

// Student posts a new doubt
router.post('/doubts', async (req, res) => {
  try {
    const { title, description, subjectId, subjectName } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Doubt question / title is required.' });
    }

    let finalSubjectId = subjectId || null;
    let finalSubjectName = subjectName || 'General Course';

    if (finalSubjectId) {
      const subject = await Subject.findById(finalSubjectId);
      if (subject) {
        finalSubjectName = subject.title;
      }
    } else if (req.user.subjectId) {
      finalSubjectId = req.user.subjectId;
      const subject = await Subject.findById(finalSubjectId);
      if (subject) finalSubjectName = subject.title;
    }

    const doubt = new Doubt({
      studentId: req.user._id,
      studentName: req.user.name || 'Student',
      studentEmail: req.user.email || '',
      subjectId: finalSubjectId,
      subjectName: finalSubjectName,
      title: title.trim(),
      description: description ? description.trim() : '',
      status: 'Pending',
      replies: [
        {
          userId: req.user._id,
          userName: 'Dexar Academic Mentor Bot',
          userRole: 'admin',
          message: 'Your question has been dispatched to your course instructors and trainers. A detailed answer and code breakdown will appear right here shortly.',
          createdAt: new Date(),
        },
      ],
    });

    await doubt.save();
    await doubt.populate('subjectId', 'title code');

    res.status(201).json({ message: 'Doubt submitted successfully!', doubt });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit doubt.', error: error.message });
  }
});

// Student replies to their doubt thread
router.post('/doubts/:id/reply', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found.' });
    }

    doubt.replies.push({
      userId: req.user._id,
      userName: req.user.name || 'Student',
      userRole: 'student',
      message: message.trim(),
      createdAt: new Date(),
    });

    // If previously answered, keep active or mark pending so trainer knows student asked follow-up
    doubt.updatedAt = new Date();
    await doubt.save();

    res.json({ message: 'Follow-up reply sent!', doubt });
  } catch (error) {
    res.status(500).json({ message: 'Failed to post reply.', error: error.message });
  }
});

// ============================================================================
// STUDENT COURSE MATERIALS (GOOGLE DRIVE PDF & DOCS)
// ============================================================================

router.get('/course-materials', async (req, res) => {
  try {
    const studentCourseIds = getStudentCourseIds(req.user);
    const { subjectId } = req.query;

    let filter = {};
    if (subjectId && subjectId !== 'all') {
      filter = {
        $or: [{ subjectId }, { subjectId: null }],
      };
    } else if (studentCourseIds.length > 0) {
      filter = {
        $or: [
          { subjectId: { $in: studentCourseIds } },
          { subjectId: null },
        ],
      };
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

module.exports = router;
