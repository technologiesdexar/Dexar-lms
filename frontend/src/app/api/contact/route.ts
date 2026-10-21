import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const emailUser = process.env.EMAIL_USER || 'technologiesdexar@gmail.com';
    const emailPass = (process.env.EMAIL_PASS || 'refbaubhkvuwrsln').replace(/\s+/g, '');
    const recipient = process.env.CONTACT_RECIPIENT_EMAIL || 'technologiesdexar@gmail.com';
    const fromAddress = process.env.EMAIL_FROM || `"Dexar Technologies" <technologiesdexar@gmail.com>`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Inquiry - Dexar Technologies</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
          .header { background: #0a2540; padding: 28px 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { color: #93c5fd; margin: 6px 0 0 0; font-size: 13px; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; margin-bottom: 20px; border: 1px solid #bfdbfe; }
          .field { margin-bottom: 18px; }
          .field-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
          .field-val { font-size: 15px; color: #0f172a; font-weight: 500; word-break: break-word; }
          .message-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 8px; margin-top: 20px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
          .footer { border-top: 1px solid #e2e8f0; padding: 18px 28px; font-size: 12px; color: #94a3b8; text-align: center; background: #fafafa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Dexar Technologies</h1>
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

    // Send email to admin
    await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      replyTo: email,
      subject: `[Contact Form] ${subject || 'New Inquiry'} from ${name}`,
      html: adminHtml,
    });

    // Send polite confirmation to student
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `We have received your message - Dexar Technologies`,
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
            <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">For urgent support, email us at <a href="mailto:support@dexartechnologies.in" style="color: #2563eb;">support@dexartechnologies.in</a></p>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 12px;">&copy; ${new Date().getFullYear()} Dexar Technologies. All rights reserved.</p>
          </div>
        `,
      });
    } catch (confErr) {
      console.warn('Student confirmation email warning:', confErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Our team will contact you soon',
    });
  } catch (error: any) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send your message. Please try again or reach out directly to support.',
        error: error?.message,
      },
      { status: 500 }
    );
  }
}
