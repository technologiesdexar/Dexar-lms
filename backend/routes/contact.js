const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { sendContactInquiryEmail } = require('../utils/emailService');

// POST /api/contact - Handle Contact Form Submissions
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.',
      });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Save to Database if connected
    let savedContact = null;
    try {
      savedContact = new Contact({
        name: name.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : '',
        subject: subject ? subject.trim() : 'Course Inquiry',
        message: message.trim(),
      });
      await savedContact.save();
    } catch (dbErr) {
      console.warn('[CONTACT DB SAVE NON-FATAL WARNING]', dbErr.message);
    }

    // Send Email to Admin/Owner and Acknowledgement to User
    const emailResult = await sendContactInquiryEmail({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      subject: subject ? subject.trim() : 'Course Inquiry',
      message: message.trim(),
    });

    return res.status(200).json({
      success: true,
      message: 'Our team will contact you soon',
      data: savedContact,
      emailSent: emailResult?.success ?? false,
    });
  } catch (error) {
    console.error('[CONTACT ROUTE ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while sending your message. Please try again.',
      error: error.message,
    });
  }
});

module.exports = router;
