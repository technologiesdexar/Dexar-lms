const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { verifyToken } = require('../middleware/auth');
const { sendResetPasswordEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'dexar_lms_super_secret_jwt_key_2026';

/**
 * Resolves the public frontend URL dynamically.
 * Guaranteed to never return localhost in reset email links.
 * Defaults to https://dexartechnologies.in
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

// Public Student Signup is DISABLED (Credentials created exclusively by Super Admin)
router.post('/signup', async (req, res) => {
  return res.status(403).json({
    message: 'Public registration is disabled. Student accounts and credentials are created exclusively by the Super Administrator.',
  });
});

// Universal Login for Student, Admin Trainer, and SuperAdmin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database is currently connecting to MongoDB Atlas. Please wait 5 seconds and retry.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate('subjectId')
      .populate('subjectIds');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User does not exist.' });
    }

    // CHECK FIRST-TIME LOGIN: Student created without password or password not set yet
    if (user.role === 'student' && user.isPasswordSet === false) {
      return res.status(200).json({
        firstTimeSetup: true,
        name: user.name,
        email: user.email,
        message: 'Welcome to Dexar LMS! Please create your password below to activate your student account.',
      });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'Password not set. Please use "Forgot password" or click the link sent to your email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subjectId: user.subjectId,
        subjectIds: user.subjectIds || (user.subjectId ? [user.subjectId] : []),
        planType: user.planType,
        startDate: user.planType === 'course_wise' ? null : user.startDate,
        endDate: user.planType === 'course_wise' ? null : user.endDate,
        amount: user.amount,
        paymentStatus: user.paymentStatus,
        accessGrantedByAdmin: Boolean(user.accessGrantedByAdmin),
        paymentRequested: Boolean(user.paymentRequested),
        accessRequested: Boolean(user.accessRequested),
        accessRequestNote: user.accessRequestNote || '',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

// First-Time Student In-Place Password Setup
router.post('/first-time-set-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and new password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('subjectId');
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    if (user.isPasswordSet === true) {
      return res.status(400).json({ message: 'Password has already been set for this account. Please sign in directly.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.isPasswordSet = true;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Password set successfully! Welcome to Dexar LMS.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subjectId: user.subjectId,
        planType: user.planType,
        startDate: user.planType === 'course_wise' ? null : user.startDate,
        endDate: user.planType === 'course_wise' ? null : user.endDate,
        amount: user.amount,
        paymentStatus: user.paymentStatus,
        accessGrantedByAdmin: Boolean(user.accessGrantedByAdmin),
        paymentRequested: Boolean(user.paymentRequested),
        accessRequested: Boolean(user.accessRequested),
        accessRequestNote: user.accessRequestNote || '',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to set password.', error: error.message });
  }
});

// Forgot Password – Generate token and send link to email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your registered email address.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 1. Dynamic database lookup: Find ANY registered user (student, trainer/admin, superadmin)
    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } },
      ],
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User does not exist. Please check your email address or contact your administrator.',
      });
    }

    // 2. Generate secure reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 1 hour expiry for standard password reset; 7 days if first time
    const expiryDuration = user.isPasswordSet === false ? 7 * 24 * 3600 * 1000 : 3600 * 1000;
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + expiryDuration);
    await user.save();

    const isFirstTime = user.isPasswordSet === false;
    const frontendBaseUrl = getResolvedFrontendUrl(req);
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}${isFirstTime ? '&firstTime=true' : ''}`;

    // 3. Dispatch setup / reset email dynamically to user's registered email
    const emailResult = await sendResetPasswordEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      isFirstTime,
    });

    if (!emailResult.success) {
      console.error(`[FORGOT PASSWORD DISPATCH ERROR] Failed to send email to ${user.email}:`, emailResult.error);
      return res.status(500).json({
        success: false,
        message: `Could not send reset email to ${user.email}. Please verify your email or try again later.`,
        fallbackUrl: process.env.NODE_ENV === 'development' ? emailResult.fallbackUrl : undefined,
      });
    }

    res.json({
      success: true,
      message: isFirstTime
        ? `Account setup link has been sent to ${user.email}! Please check your email inbox to set your password.`
        : `Password reset link has been sent to ${user.email}! Please check your inbox and spam folder.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process password reset request.', error: error.message });
  }
});

// Verify Reset Password Token
router.get('/verify-reset-token', async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({ valid: false, message: 'Token and email parameters are required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');
    const cleanEmail = String(email).toLowerCase().trim();
    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } },
      ],
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        valid: false,
        message: 'Password reset link is invalid or has expired. Please request a new link.',
      });
    }

    res.json({
      valid: true,
      email: user.email,
      name: user.name,
      isFirstTime: user.isPasswordSet === false,
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Verification error.', error: error.message });
  }
});

// Set / Reset Password with Token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({ message: 'Token, email, and new password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');
    const cleanEmail = String(email).toLowerCase().trim();
    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } },
      ],
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Password reset link is invalid or has expired. Please request a new reset link.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.isPasswordSet = true;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Auto-generate session token so user is seamlessly logged in
    const jwtToken = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Password set successfully! Logging you in...',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subjectId: user.subjectId,
        subjectIds: user.subjectIds || (user.subjectId ? [user.subjectId] : []),
        planType: user.planType,
        startDate: user.planType === 'course_wise' ? null : user.startDate,
        endDate: user.planType === 'course_wise' ? null : user.endDate,
        amount: user.amount,
        paymentStatus: user.paymentStatus,
        accessGrantedByAdmin: Boolean(user.accessGrantedByAdmin),
        paymentRequested: Boolean(user.paymentRequested),
        accessRequested: Boolean(user.accessRequested),
        accessRequestNote: user.accessRequestNote || '',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password.', error: error.message });
  }
});

// Get Current Logged-in User Profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('subjectId')
      .populate('subjectIds');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user.', error: error.message });
  }
});

module.exports = router;
