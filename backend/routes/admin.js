const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Subject = require('../models/Subject');
const LiveClass = require('../models/LiveClass');
const RecordedClass = require('../models/RecordedClass');
const Assessment = require('../models/Assessment');
const AssessmentSubmission = require('../models/AssessmentSubmission');
const CodingExam = require('../models/CodingExam');
const CodingSubmission = require('../models/CodingSubmission');
const Doubt = require('../models/Doubt');
const CourseMaterial = require('../models/CourseMaterial');
const { verifyToken, requireRole } = require('../middleware/auth');
const { normalizeVideoUrl } = require('../utils/videoNormalizer');

// All routes require Trainer/Admin or SuperAdmin role
router.use(verifyToken, requireRole('admin', 'superadmin'));

// Helper to get trainer's subject (supports superadmin query override)
const getTrainerSubject = async (user, requestedSubjectId) => {
  if (user.role === 'superadmin') {
    if (requestedSubjectId) {
      const s = await Subject.findById(requestedSubjectId);
      if (s) return s;
    }
    if (user.subjectId) {
      const s = await Subject.findById(user.subjectId);
      if (s) return s;
    }
    return await Subject.findOne();
  }
  return await Subject.findOne({ trainerId: user._id });
};

// Trainer Dashboard Info & Enrolled Students
router.get('/dashboard', async (req, res) => {
  try {
    const subject = await getTrainerSubject(req.user, req.query.subjectId);
    if (!subject) {
      return res.json({ subject: null, students: [], liveClassesCount: 0, recordedCount: 0, assessmentCount: 0, codingCount: 0 });
    }

    const students = await User.find({
      role: 'student',
      $or: [{ subjectId: subject._id }, { subjectIds: subject._id }],
    }).select('-password');
    const liveClassesCount = await LiveClass.countDocuments({ subjectId: subject._id });
    const recordedCount = await RecordedClass.countDocuments({ subjectId: subject._id });
    const assessmentCount = await Assessment.countDocuments({ subjectId: subject._id });
    const codingCount = await CodingExam.countDocuments({ subjectId: subject._id });

    res.json({
      subject,
      students,
      stats: {
        totalStudents: students.length,
        liveClassesCount,
        recordedCount,
        assessmentCount,
        codingCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard.', error: error.message });
  }
});

// LIVE CLASSES: Add, List, Update, Delete
router.post('/live-classes', async (req, res) => {
  try {
    const { title, link, date, time, status, description, subjectId } = req.body;
    const subject = await getTrainerSubject(req.user, subjectId);

    if (!subject) {
      return res.status(400).json({ message: 'No subject assigned to this trainer yet.' });
    }

    const liveClass = new LiveClass({
      title,
      subjectId: subject._id,
      trainerId: req.user._id,
      link,
      date,
      time,
      status: status || 'upcoming',
      description,
    });
    await liveClass.save();

    res.status(201).json({ message: 'Live class scheduled successfully!', liveClass });
  } catch (error) {
    res.status(500).json({ message: 'Failed to schedule live class.', error: error.message });
  }
});

router.get('/live-classes', async (req, res) => {
  try {
    const subject = await getTrainerSubject(req.user, req.query.subjectId);
    if (!subject && req.user.role !== 'superadmin') return res.json({ liveClasses: [] });

    const filter = (req.user.role === 'superadmin' && !req.query.subjectId && !subject)
      ? {}
      : { subjectId: subject?._id };

    const liveClasses = await LiveClass.find(filter).sort({ createdAt: -1 });
    res.json({ liveClasses });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch live classes.', error: error.message });
  }
});

router.put('/live-classes/:id', async (req, res) => {
  try {
    const { title, link, date, time, status, description } = req.body;
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({ message: 'Live class session not found.' });
    }

    if (title !== undefined) liveClass.title = title;
    if (link !== undefined) liveClass.link = link;
    if (date !== undefined) liveClass.date = date;
    if (time !== undefined) liveClass.time = time;
    if (status !== undefined) liveClass.status = status;
    if (description !== undefined) liveClass.description = description;

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
      return res.status(404).json({ message: 'Live class session not found.' });
    }
    res.json({ message: 'Live class session deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete live class.', error: error.message });
  }
});

// RECORDED CLASSES & NOTES: Add, List, Update, Delete
router.post('/recorded-classes', async (req, res) => {
  try {
    const { title, videoUrl, notesUrl, description, duration, subjectId } = req.body;
    const subject = await getTrainerSubject(req.user, subjectId);

    if (!subject) {
      return res.status(400).json({ message: 'No subject assigned to this trainer yet.' });
    }

    const recordedClass = new RecordedClass({
      title,
      subjectId: subject._id,
      trainerId: req.user._id,
      videoUrl: normalizeVideoUrl(videoUrl),
      notesUrl,
      description,
      duration: duration || '45 mins',
    });
    await recordedClass.save();

    res.status(201).json({ message: 'Recorded video and notes added successfully!', recordedClass });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add video/notes.', error: error.message });
  }
});

router.get('/recorded-classes', async (req, res) => {
  try {
    const subject = await getTrainerSubject(req.user, req.query.subjectId);
    if (!subject && req.user.role !== 'superadmin') return res.json({ recordedClasses: [] });

    const filter = (req.user.role === 'superadmin' && !req.query.subjectId && !subject)
      ? {}
      : { subjectId: subject?._id };

    const recordedClasses = await RecordedClass.find(filter).sort({ createdAt: -1 });
    res.json({ recordedClasses });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recorded classes.', error: error.message });
  }
});

router.put('/recorded-classes/:id', async (req, res) => {
  try {
    const { title, videoUrl, notesUrl, description, duration } = req.body;
    const recordedClass = await RecordedClass.findById(req.params.id);
    if (!recordedClass) {
      return res.status(404).json({ message: 'Recorded lecture not found.' });
    }

    if (title !== undefined) recordedClass.title = title;
    if (videoUrl !== undefined) recordedClass.videoUrl = normalizeVideoUrl(videoUrl);
    if (notesUrl !== undefined) recordedClass.notesUrl = notesUrl;
    if (description !== undefined) recordedClass.description = description;
    if (duration !== undefined) recordedClass.duration = duration;

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

// Word document analysis and question parser
const mammoth = require('mammoth');

const parseExamText = (text) => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const questions = [];
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect question start: e.g. "1. What is...", "Q1: What is...", "Question 1:"
    const qMatch = line.match(/^(?:Q(?:uestion)?\s*\d+[\.\:\)]|\d+[\.\)])\s*(.+)/i);
    if (qMatch) {
      if (currentQuestion && currentQuestion.questionText && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        questionText: qMatch[1].trim(),
        options: [],
        correctOptionIndex: 0,
        marks: 10,
      };
      continue;
    }

    // Detect Option: e.g. "A) React", "a. React", "(A) React", "1) React"
    const optMatch = line.match(/^[\(\[]?([A-Da-d1-4])[\)\]\.\:]\s*(.+)/);
    if (optMatch && currentQuestion) {
      const optLetter = optMatch[1].toUpperCase();
      const optText = optMatch[2].trim();
      currentQuestion.options.push(optText);
      continue;
    }

    // Detect Answer line: e.g. "Answer: B", "Ans: A", "Correct Answer: C"
    const ansMatch = line.match(/^(?:Answer|Ans|Correct(?:\s*Answer)?)\s*[:\-\=]\s*([A-Da-d1-4])/i);
    if (ansMatch && currentQuestion) {
      const ansChar = ansMatch[1].toUpperCase();
      let ansIndex = 0;
      if (ansChar === 'A' || ansChar === '1') ansIndex = 0;
      else if (ansChar === 'B' || ansChar === '2') ansIndex = 1;
      else if (ansChar === 'C' || ansChar === '3') ansIndex = 2;
      else if (ansChar === 'D' || ansChar === '4') ansIndex = 3;
      currentQuestion.correctOptionIndex = ansIndex;
      continue;
    }

    // If continuation of current question text before options
    if (currentQuestion && currentQuestion.options.length === 0) {
      currentQuestion.questionText += ' ' + line;
    }
  }

  if (currentQuestion && currentQuestion.questionText && currentQuestion.options.length > 0) {
    questions.push(currentQuestion);
  }

  return questions;
};

// Word Document Analysis Endpoint
router.post('/analyze-docx', async (req, res) => {
  try {
    const { base64Docx, rawText } = req.body;

    let extractedText = rawText || '';

    if (base64Docx) {
      const buffer = Buffer.from(base64Docx, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ message: 'No readable text extracted from document.' });
    }

    const parsedQuestions = parseExamText(extractedText);

    res.json({
      message: 'Word document analyzed successfully!',
      extractedText,
      totalDetected: parsedQuestions.length,
      questions: parsedQuestions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to analyze Word document.', error: error.message });
  }
});

// ASSESSMENTS (Quizzes): Create, List, Update, Delete & Submissions
router.post('/assessments', async (req, res) => {
  try {
    const { title, questions, dueDate, totalMarks, isLockdown, maxViolations, durationMinutes, accessPassword, subjectId } = req.body;
    const subject = await getTrainerSubject(req.user, subjectId);

    if (!subject) {
      return res.status(400).json({ message: 'No subject assigned to this trainer yet.' });
    }

    const assessment = new Assessment({
      title,
      subjectId: subject._id,
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

    res.status(201).json({ message: 'Assessment created successfully!', assessment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create assessment.', error: error.message });
  }
});

router.get('/assessments', async (req, res) => {
  try {
    const subject = await getTrainerSubject(req.user, req.query.subjectId);
    if (!subject && req.user.role !== 'superadmin') return res.json({ assessments: [] });

    const filter = (req.user.role === 'superadmin' && !req.query.subjectId && !subject)
      ? {}
      : { subjectId: subject?._id };

    const assessments = await Assessment.find(filter).sort({ createdAt: -1 });
    res.json({ assessments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assessments.', error: error.message });
  }
});

router.put('/assessments/:id', async (req, res) => {
  try {
    const { title, questions, dueDate, totalMarks, isLockdown, maxViolations, durationMinutes, accessPassword } = req.body;
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found.' });
    }

    if (title !== undefined) assessment.title = title;
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

router.get('/assessments/:id/submissions', async (req, res) => {
  try {
    const submissions = await AssessmentSubmission.find({ assessmentId: req.params.id })
      .populate('studentId', 'name email');
    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch submissions.', error: error.message });
  }
});

router.put('/assessments/submissions/:id', async (req, res) => {
  try {
    const { score, status, violationsCount } = req.body;
    const submission = await AssessmentSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    if (score !== undefined) submission.score = Number(score);
    if (status !== undefined) submission.status = status;
    if (violationsCount !== undefined) submission.violationsCount = Number(violationsCount);

    await submission.save();
    res.json({ message: 'Assessment submission score updated successfully!', submission });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update assessment submission.', error: error.message });
  }
});

// CODING EXAMS: Create, List, Update, Delete & Submissions
router.post('/coding-exams', async (req, res) => {
  try {
    const { title, questions, problemStatement, starterCode, testCases, dueDate, totalPoints, isLockdown, maxViolations, durationMinutes, accessPassword, subjectId } = req.body;
    const subject = await getTrainerSubject(req.user, subjectId);

    if (!subject) {
      return res.status(400).json({ message: 'No subject assigned to this trainer yet.' });
    }

    const hasQuestionsList = Array.isArray(questions) && questions.length > 0;
    const computedPoints = hasQuestionsList
      ? questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0) || totalPoints || 100
      : totalPoints || 100;

    const firstQ = hasQuestionsList ? questions[0] : null;

    const codingExam = new CodingExam({
      title,
      subjectId: subject._id,
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

    res.status(201).json({ message: 'Coding exam created successfully!', codingExam });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create coding exam.', error: error.message });
  }
});

router.get('/coding-exams', async (req, res) => {
  try {
    const subject = await getTrainerSubject(req.user, req.query.subjectId);
    if (!subject && req.user.role !== 'superadmin') return res.json({ codingExams: [] });

    const filter = (req.user.role === 'superadmin' && !req.query.subjectId && !subject)
      ? {}
      : { subjectId: subject?._id };

    const codingExams = await CodingExam.find(filter).sort({ createdAt: -1 });
    res.json({ codingExams });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch coding exams.', error: error.message });
  }
});

router.put('/coding-exams/:id', async (req, res) => {
  try {
    const { title, questions, problemStatement, starterCode, testCases, dueDate, totalPoints, isLockdown, maxViolations, durationMinutes, accessPassword } = req.body;
    const exam = await CodingExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Coding exam not found.' });
    }

    if (title !== undefined) exam.title = title;
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

router.get('/coding-exams/:id/submissions', async (req, res) => {
  try {
    const submissions = await CodingSubmission.find({ examId: req.params.id })
      .populate('studentId', 'name email');
    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch coding submissions.', error: error.message });
  }
});

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
    res.json({ message: 'Coding submission score updated successfully!', submission });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update coding submission.', error: error.message });
  }
});

// ALLOW STUDENT TO REWRITE MCQ ASSESSMENT (Reset Submission)
router.delete('/assessments/submissions/:id', async (req, res) => {
  try {
    const submission = await AssessmentSubmission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found or already reset.' });
    }
    res.json({ message: 'MCQ Assessment submission reset successfully! Student can now rewrite the exam.' });
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
    res.json({ message: 'Student is now allowed to rewrite the MCQ assessment!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to allow MCQ exam retake.', error: error.message });
  }
});

// ALLOW STUDENT TO REWRITE CODING EXAM (Reset Submission)
router.delete('/coding-exams/submissions/:id', async (req, res) => {
  try {
    const submission = await CodingSubmission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found or already reset.' });
    }
    res.json({ message: 'Coding exam submission reset successfully! Student can now rewrite the exam.' });
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
// TRAINER / ADMIN MARKS & SUBMISSIONS OVERSIGHT
// ============================================================================
router.get('/marks', async (req, res) => {
  try {
    const subject = await getTrainerSubject(req.user, req.query.subjectId);

    const assessmentFilter = (req.user.role === 'superadmin' && !req.query.subjectId && !subject)
      ? {}
      : subject
        ? { $or: [{ subjectId: subject._id }, { trainerId: req.user._id }] }
        : { trainerId: req.user._id };

    const codingFilter = (req.user.role === 'superadmin' && !req.query.subjectId && !subject)
      ? {}
      : subject
        ? { $or: [{ subjectId: subject._id }, { trainerId: req.user._id }] }
        : { trainerId: req.user._id };

    const assessments = await Assessment.find(assessmentFilter).select('_id');
    const assessmentIds = assessments.map((a) => a._id);

    const codingExams = await CodingExam.find(codingFilter).select('_id');
    const codingExamIds = codingExams.map((c) => c._id);

    const assessmentSubmissions = await AssessmentSubmission.find({ assessmentId: { $in: assessmentIds } })
      .populate('studentId', 'name email')
      .populate({
        path: 'assessmentId',
        select: 'title totalMarks subjectId isLockdown maxViolations',
        populate: { path: 'subjectId', select: 'title code' },
      })
      .sort({ submittedAt: -1 });

    const codingSubmissions = await CodingSubmission.find({ examId: { $in: codingExamIds } })
      .populate('studentId', 'name email')
      .populate({
        path: 'examId',
        select: 'title totalPoints subjectId isLockdown',
        populate: { path: 'subjectId', select: 'title code' },
      })
      .sort({ submittedAt: -1 });

    res.json({ assessmentSubmissions, codingSubmissions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trainer marks.', error: error.message });
  }
});

// STUDENTS CRUD FOR TRAINER / ADMIN
router.put('/students/:id', async (req, res) => {
  try {
    const { name, email, password, paymentStatus } = req.body;
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (email && email.toLowerCase() !== student.email.toLowerCase()) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: student._id } });
      if (existing) return res.status(400).json({ message: 'Email already registered.' });
      student.email = email.toLowerCase();
    }

    if (name) student.name = name;
    if (password && password.trim()) {
      student.password = await bcrypt.hash(password.trim(), 10);
    }
    if (paymentStatus) student.paymentStatus = paymentStatus;

    await student.save();
    res.json({ message: 'Student updated successfully!', student });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update student.', error: error.message });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Delete or unassign student
    await User.findByIdAndDelete(req.params.id);
    await AssessmentSubmission.deleteMany({ studentId: req.params.id });
    await CodingSubmission.deleteMany({ studentId: req.params.id });

    res.json({ message: 'Student removed successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete student.', error: error.message });
  }
});

// ============================================================================
// DOUBTS CHAT & STUDENT Q&A (ADMIN & SUPERADMIN)
// ============================================================================

// Get all doubts (supports subjectId, status, and search query filters)
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

// Reply to a student doubt
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
      userName: req.user.name || (req.user.role === 'superadmin' ? 'Super Administrator' : 'Trainer / Instructor'),
      userRole: req.user.role,
      message: message.trim(),
      createdAt: new Date(),
    });

    // Default status to 'Answered' when replied, or use provided status
    doubt.status = status || 'Answered';
    doubt.updatedAt = new Date();

    await doubt.save();
    res.json({ message: 'Reply sent successfully!', doubt });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reply to doubt.', error: error.message });
  }
});

// Update doubt status (Pending, Answered, Resolved)
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

// Delete a doubt
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
// COURSE MATERIALS & GOOGLE DRIVE LIBRARY (ADMIN & SUPERADMIN)
// ============================================================================

// Get all course materials (supports optional subjectId filter)
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

// Add a new course material (PDF or DOC from Google Drive)
router.post('/course-materials', async (req, res) => {
  try {
    const { title, driveUrl, fileFormat, subjectId, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Material title is required.' });
    }

    if (!driveUrl || !driveUrl.trim()) {
      return res.status(400).json({ message: 'Google Drive link is required.' });
    }

    // Auto-detect format if not explicitly provided
    let format = (fileFormat || 'pdf').toLowerCase().trim();
    if (!['pdf', 'doc', 'docx', 'ppt', 'other'].includes(format)) {
      const lowerUrl = driveUrl.toLowerCase();
      if (lowerUrl.includes('.doc') || lowerUrl.includes('docs.google.com/document')) {
        format = 'docx';
      } else {
        format = 'pdf';
      }
    }

    // Resolve subject if provided
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
      uploadedByName: req.user.name || 'Instructor',
    });

    await material.save();
    await material.populate('subjectId', 'title code');

    res.status(201).json({ message: 'Course material added successfully!', material });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create course material.', error: error.message });
  }
});

// Update a course material
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

// Delete a course material
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
