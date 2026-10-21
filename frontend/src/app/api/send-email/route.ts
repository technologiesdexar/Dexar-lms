import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      to,
      name,
      resetUrl,
      isFirstTime = false,
      subject: customSubject,
      text: customText,
      html: customHtml,
      type = 'reset-password',
    } = body;

    // Optional secret verification
    const internalSecret = req.headers.get('x-internal-secret');
    const validSecret =
      process.env.INTERNAL_EMAIL_SECRET ||
      process.env.JWT_SECRET ||
      'dexar_lms_super_secret_jwt_key_2026';

    // Allow requests with correct secret or requests originating from same application
    const referer = req.headers.get('referer') || '';
    const origin = req.headers.get('origin') || '';
    const isFromApp =
      referer.includes('dexartechnologies.in') ||
      referer.includes('vercel.app') ||
      referer.includes('dexar') ||
      origin.includes('dexartechnologies.in') ||
      origin.includes('vercel.app') ||
      origin.includes('localhost');

    if (internalSecret && internalSecret !== validSecret && !isFromApp) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid recipient email address is required.' },
        { status: 400 }
      );
    }

    const emailUser = (process.env.EMAIL_USER || 'technologiesdexar@gmail.com').trim();
    const emailPass = (process.env.EMAIL_PASS || 'refbaubhkvuwrsln').replace(/\s+/g, '');
    const companyEmail = (process.env.COMPANY_EMAIL || 'technologiesdexar@gmail.com').trim();
    const fromAddress = process.env.EMAIL_FROM || `"Dexar LMS" <${companyEmail}>`;
    const replyTo = process.env.EMAIL_REPLY_TO || `"Dexar LMS Support" <${companyEmail}>`;
    const cleanTo = to.trim().toLowerCase();
    const recipientName = name || 'Student';

    // Configure Nodemailer on Port 465 (Direct SSL/TLS wrapper, fully open and fast on Vercel)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    let subject = customSubject;
    let text = customText;
    let html = customHtml;

    if (!html && resetUrl) {
      subject = isFirstTime
        ? `Dexar LMS: Account Setup & Activation for ${recipientName}`
        : `Dexar LMS: Password Reset Request for ${recipientName}`;

      const subtitle = isFirstTime
        ? `Welcome to Dexar LMS, ${recipientName}! Your student access account has been created. Click the button below to set your password and access your dashboard.`
        : `Hello ${recipientName}, you recently requested to reset your password for your Dexar LMS account. Click the button below to safely create a new password.`;

      const buttonText = isFirstTime ? 'Activate My Account' : 'Reset My Password';
      const expiryNote = isFirstTime
        ? 'This activation link is valid for 7 days.'
        : 'This secure password reset link is valid for 1 hour.';

      text = `Hello ${recipientName},\n\n${subtitle}\n\nPlease visit the secure portal link below:\n${resetUrl}\n\n${expiryNote}\n\nIf you did not request this, you can safely ignore this email.\n\n---\nDexar LMS Platform\nhttps://dexartechnologies.in\nSupport: technologiesdexar@gmail.com\n`;

      html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 20px 8px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="max-width: 580px; margin: 0 auto;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);">
          <tr>
            <td style="background-color: #0a2540; padding: 28px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Dexar LMS</h1>
              <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 13px;">Learning Management & Skills Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="font-size: 18px; font-weight: 600; color: #0a2540; margin: 0 0 16px 0;">Hello ${recipientName},</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
                ${subtitle}
              </p>
              
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 24px auto; width: 100%; max-width: 320px;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius: 10px; background-color: #2563eb;">
                    <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; padding: 16px 24px; font-family: sans-serif; font-size: 16px; font-weight: 700; color: #ffffff !important; text-decoration: none; border-radius: 10px; background-color: #2563eb; text-align: center;">
                      ${buttonText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 24px 0 16px 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                <strong>Security note:</strong> ${expiryNote} If you did not make this request, you can safely ignore this email; your account security remains intact.
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-top: 20px; font-size: 13px; color: #334155;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #0a2540;">
                  Direct Link (Tap below if button does not open):
                </p>
                <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; font-size: 13px; font-weight: 600; text-decoration: underline; word-break: break-all; display: block; padding: 10px 12px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
                  ${resetUrl}
                </a>
              </div>
            </td>
          </tr>
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
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      sender: emailUser,
      replyTo,
      to: cleanTo,
      subject: subject || 'Dexar LMS Notification',
      text: text || '',
      html: html || `<p>${text || 'Dexar LMS notification'}</p>`,
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      },
    });

    console.log(`[VERCEL SEND-EMAIL SUCCESS] Sent to: ${cleanTo} | MsgId: ${info.messageId}`);
    return NextResponse.json({
      success: true,
      message: 'Email dispatched successfully!',
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('[VERCEL SEND-EMAIL ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to dispatch email.',
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
