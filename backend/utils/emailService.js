const nodemailer = require('nodemailer');

// Create email transporter from environment variables with reliable fallback
function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
  const user = (process.env.EMAIL_USER || 'technologiesdexar@gmail.com').trim();
  const pass = (process.env.EMAIL_PASS || 'refbaubhkvuwrsln').replace(/\s+/g, '');
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  if (user && pass) {
    if (host) {
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 7000,
      });
    }

    // Default to Gmail service if user is provided without custom host
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 7000,
    });
  }

  return null;
}

// HTTPS Email Relay Helper:
// Used when running on Render or environments where outbound SMTP ports (25/465/587) are firewalled.
// Dispatches over standard HTTPS (port 443) to the Vercel serverless endpoint.
async function dispatchViaHttpRelay({ to, name, resetUrl, isFirstTime, subject, text, html }) {
  const frontendUrl = (process.env.FRONTEND_URL || 'https://dexartechnologies.in').replace(/\/+$/, '');
  const relayEndpoint = `${frontendUrl}/api/send-email`;
  const internalSecret = process.env.INTERNAL_EMAIL_SECRET || process.env.JWT_SECRET || 'dexar_lms_super_secret_jwt_key_2026';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(relayEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret,
      },
      body: JSON.stringify({
        to,
        name,
        resetUrl,
        isFirstTime,
        subject,
        text,
        html,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      console.log(`[HTTP EMAIL RELAY SUCCESS] Sent to ${to} via Vercel endpoint:`, data);
      return { success: true, messageId: data.messageId || 'http-relay-sent' };
    } else {
      const errText = await res.text();
      console.warn(`[HTTP EMAIL RELAY WARNING] Vercel relay returned ${res.status}:`, errText);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[HTTP EMAIL RELAY NOTICE] Could not reach ${relayEndpoint}:`, err.message);
  }
  return null;
}

/**
 * Send Password Setup / Reset Email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.resetUrl - Full URL to set/reset password
 * @param {boolean} options.isFirstTime - Whether this is a first-time activation
 */
async function sendResetPasswordEmail({ to, name, resetUrl, isFirstTime = false }) {
  const transporter = createTransporter();
  const recipientName = name || 'Student';
  const subject = isFirstTime
    ? `Dexar LMS: Account Setup & Activation for ${recipientName}`
    : `Dexar LMS: Password Reset Request for ${recipientName}`;

  const title = isFirstTime ? 'Dexar Learning Management System' : 'Dexar LMS — Password Reset';
  const subtitle = isFirstTime
    ? `Welcome to Dexar LMS, ${recipientName}! Your student access account has been created. Click the button below to set your password and access your dashboard.`
    : `Hello ${recipientName}, you recently requested to reset your password for your Dexar LMS account. Click the button below to safely create a new password.`;

  const buttonText = isFirstTime ? 'Activate My Account' : 'Reset My Password';
  const expiryNote = isFirstTime
    ? 'This activation link is valid for 7 days.'
    : 'This secure password reset link is valid for 1 hour.';

  // 1. Plaintext Alternative (Crucial for passing SpamAssassin and Gmail filters)
  const text = `Hello ${recipientName},

${subtitle}

Please visit the secure portal link below:
${resetUrl}

${expiryNote}

If you did not request this, you can safely ignore this email. Your current account credentials remain safe.

---
Dexar LMS Platform
Dexar Technologies
Website: https://dexartechnologies.in
Support: technologiesdexar@gmail.com
`;


  // 2. High Deliverability Responsive HTML Email (Mobile Bulletproof)
  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="format-detection" content="telephone=no" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${subject}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    a { color: #2563eb; text-decoration: underline; -webkit-text-size-adjust: none; }
    .btn-link { display: block !important; width: 100% !important; box-sizing: border-box !important; text-decoration: none !important; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { width: 100% !important; padding: 12px 6px !important; }
      .email-card { width: 100% !important; border-radius: 8px !important; }
      .email-content { padding: 24px 18px !important; }
      .mobile-btn-container { width: 100% !important; max-width: 100% !important; }
      .mobile-tap-btn { width: 100% !important; padding: 16px 20px !important; font-size: 16px !important; display: block !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 20px 8px; background-color: #f1f5f9; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" align="center" class="email-wrapper">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-card" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0a2540; padding: 28px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Dexar LMS</h1>
              <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 13px;">Learning Management & Skills Platform</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td class="email-content" style="padding: 32px 28px;">
              <h2 style="font-size: 18px; font-weight: 600; color: #0a2540; margin: 0 0 16px 0;">Hello ${recipientName},</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
                ${subtitle}
              </p>
              
              <!-- BULLETPROOF MOBILE ACTION BUTTON -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" class="mobile-btn-container" style="margin: 24px auto; width: 100%; max-width: 320px;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius: 10px; background-color: #2563eb; padding: 0;">
                    <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" class="mobile-tap-btn btn-link" style="display: block; width: 100%; box-sizing: border-box; padding: 16px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff !important; text-decoration: none; border-radius: 10px; background-color: #2563eb; text-align: center; line-height: 1.2; -webkit-text-size-adjust: none;">
                      ${buttonText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 24px 0 16px 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                <strong>Security note:</strong> ${expiryNote} If you did not make this request, you can safely ignore this email; your account security remains intact.
              </p>

              <!-- MOBILE TAP-FRIENDLY DIRECT LINK BOX -->
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-top: 20px; font-size: 13px; color: #334155;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #0a2540;">
                  Direct Link (Tap below if button does not open):
                </p>
                <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; font-size: 13px; font-weight: 600; text-decoration: underline; word-break: break-all; display: block; padding: 10px 12px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; line-height: 1.4;">
                  ${resetUrl}
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; line-height: 1.5; color: #64748b;">
              <p style="margin: 0 0 6px 0;">This is an automated transactional security message from Dexar LMS.</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Dexar Technologies. All rights reserved. &bull; <a href="https://dexartechnologies.in" target="_blank" rel="noopener noreferrer" style="color: #64748b; text-decoration: none;">dexartechnologies.in</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;



  const isCloudOrRender = Boolean(process.env.RENDER || process.env.VERCEL || process.env.NODE_ENV === 'production');

  // 1. If deployed on Render or cloud platform where SMTP is blocked, prioritize HTTPS relay to Vercel
  if (isCloudOrRender) {
    const relayResult = await dispatchViaHttpRelay({
      to,
      name: recipientName,
      resetUrl,
      isFirstTime,
      subject,
      text,
      html,
    });
    if (relayResult && relayResult.success) {
      return relayResult;
    }
  }

  // 2. Direct SMTP attempt (with 5s socket timeout)
  if (transporter) {
    try {
      const companyEmail = (process.env.COMPANY_EMAIL || 'technologiesdexar@gmail.com').trim();
      const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : 'technologiesdexar@gmail.com';
      const from = process.env.EMAIL_FROM || `"Dexar LMS" <${companyEmail}>`;
      const replyTo = process.env.EMAIL_REPLY_TO || `"Dexar LMS Support" <${companyEmail}>`;
      const cleanTo = (to || '').trim().toLowerCase();

      const info = await transporter.sendMail({
        from,
        sender: emailUser,
        replyTo,
        to: cleanTo,
        subject,
        text,
        html,
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
      });
      console.log(`[EMAIL DISPATCH SUCCESS] Sent to: ${cleanTo} | MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[EMAIL DISPATCH ERROR]', error.message);

      // If SMTP failed (e.g. firewalled), attempt relay as fallback if not already tried
      if (!isCloudOrRender) {
        const fallbackRelay = await dispatchViaHttpRelay({
          to,
          name: recipientName,
          resetUrl,
          isFirstTime,
          subject,
          text,
          html,
        });
        if (fallbackRelay && fallbackRelay.success) {
          return fallbackRelay;
        }
      }

      console.log(`\n========================================================`);
      console.log(`📧 [FALLBACK DEV EMAIL DISPATCH]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Link: ${resetUrl}`);
      console.log(`========================================================\n`);
      return { success: false, error: error.message, fallbackUrl: resetUrl };
    }
  } else {
    // If no transporter, try HTTP relay before simulator
    const relayResult = await dispatchViaHttpRelay({
      to,
      name: recipientName,
      resetUrl,
      isFirstTime,
      subject,
      text,
      html,
    });
    if (relayResult && relayResult.success) {
      return relayResult;
    }

    console.log(`\n========================================================`);
    console.log(`📧 [DEV EMAIL SIMULATOR] (No EMAIL_USER/EMAIL_PASS configured)`);
    console.log(`To: ${to}`);
    console.log(`Name: ${name}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reset / Setup Link:`);
    console.log(`👉 ${resetUrl}`);
    console.log(`========================================================\n`);
    return { success: true, simulated: true, resetUrl };
  }
}

/**
 * Send Contact Form Inquiry Email to Admin and confirmation to user
 * @param {Object} options
 * @param {string} options.name
 * @param {string} options.email
 * @param {string} options.phone
 * @param {string} options.subject
 * @param {string} options.message
 */
async function sendContactInquiryEmail({ name, email, phone, subject, message }) {
  const transporter = createTransporter();
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL || 'technologiesdexar@gmail.com';
  const from = process.env.EMAIL_FROM || '"Dexar Technologies" <technologiesdexar@gmail.com>';

  const adminEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Inquiry - Dexar</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: #0a2540; padding: 28px 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { color: #93c5fd; margin: 6px 0 0 0; font-size: 13px; }
        .content { padding: 32px 28px; }
        .badge { display: inline-block; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; margin-bottom: 20px; border: 1px solid #bfdbfe; }
        .field { margin-bottom: 18px; }
        .field-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px; }
        .field-val { font-size: 15px; color: #0f172a; font-weight: 500; word-break: break-word; }
        .message-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 8px; margin-top: 20px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
        .footer { border-top: 1px solid #e2e8f0; padding: 18px 28px; font-size: 12px; color: #94a3b8; text-align: center; background: #fafafa; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Dexar Contact Form</h1>
          <p>New Student / Course Inquiry Received</p>
        </div>
        <div class="content">
          <div class="badge">New Contact Message</div>
          <div class="field">
            <div class="field-label">Sender Name</div>
            <div class="field-val">${name}</div>
          </div>
          <div class="field">
            <div class="field-label">Email Address</div>
            <div class="field-val"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></div>
          </div>
          <div class="field">
            <div class="field-label">Phone Number</div>
            <div class="field-val">${phone || 'Not provided'}</div>
          </div>
          <div class="field">
            <div class="field-label">Subject / Inquiry Type</div>
            <div class="field-val"><strong>${subject || 'General Inquiry'}</strong></div>
          </div>
          <div class="field">
            <div class="field-label">Message</div>
            <div class="message-box">${message}</div>
          </div>
        </div>
        <div class="footer">
          Received via Dexar Website Contact Page &bull; ${new Date().toLocaleString()}
        </div>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      // 1. Send inquiry to admin
      const adminInfo = await transporter.sendMail({
        from,
        to: recipient,
        replyTo: email,
        subject: `[Contact Form] ${subject || 'New Inquiry'} from ${name}`,
        html: adminEmailHtml,
      });
      console.log(`[CONTACT EMAIL SENT TO ADMIN] To: ${recipient} | MsgId: ${adminInfo.messageId}`);

      // 2. Send polite confirmation to student
      try {
        await transporter.sendMail({
          from,
          to: email,
          subject: `We have received your message - Dexar`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
              <h2 style="color: #0a2540;">Thank you for contacting Dexar, ${name}!</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                We have received your message regarding <strong>${subject || 'your inquiry'}</strong>.
                Our team will contact you soon.
              </p>
              <div style="background: #f8fafc; border-left: 3px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 13px; color: #64748b;">Your message:</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #1e293b; white-space: pre-wrap;">${message}</p>
              </div>
              <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">For support, contact us at <a href="mailto:support@dexartechnologies.in" style="color: #2563eb;">support@dexartechnologies.in</a></p>
              <p style="font-size: 13px; color: #94a3b8; margin-top: 12px;">&copy; ${new Date().getFullYear()} Dexar. All rights reserved.</p>
            </div>
          `,
        });
      } catch (confirmErr) {
        console.warn('[CONTACT USER CONFIRMATION NON-FATAL ERROR]', confirmErr.message);
      }

      return { success: true, messageId: adminInfo.messageId };
    } catch (err) {
      console.error('[CONTACT EMAIL ERROR]', err);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`\n========================================================`);
    console.log(`📧 [DEV EMAIL SIMULATOR] Contact Form Inquiry`);
    console.log(`To: ${recipient}`);
    console.log(`From: ${name} <${email}>`);
    console.log(`Phone: ${phone}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log(`========================================================\n`);
    return { success: true, simulated: true };
  }
}

module.exports = {
  sendResetPasswordEmail,
  sendContactInquiryEmail,
};
