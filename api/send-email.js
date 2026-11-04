const nodemailer = require('nodemailer');

/**
 * Serverless API handler to send emails directly from rokeabyrk@gmail.com
 * Supports Vercel serverless runtime and local environments.
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { to, subject, html, text, gmailAppPassword } = body;

    if (!to) {
      return res.status(400).json({ success: false, error: 'Recipient email ("to") is required.' });
    }

    // Determine the Google App Password: from request body, environment variable, or fallback
    const appPassword = (
      gmailAppPassword ||
      process.env.GMAIL_APP_PASSWORD ||
      process.env.ROKEA_GMAIL_PASS ||
      ''
    ).replace(/\s+/g, ''); // strip any spaces like 'abcd efgh ijkl mnop' -> 'abcdefghijklmnop'

    if (!appPassword) {
      return res.status(400).json({
        success: false,
        error: 'GMAIL_APP_PASSWORD_REQUIRED',
        message: 'Google 16-character App Password is required to send from rokeabyrk@gmail.com. Please set it in Admin Settings or .env (GMAIL_APP_PASSWORD).'
      });
    }

    const senderEmail = 'rokeabyrk@gmail.com';

    // Configure official Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: senderEmail,
        pass: appPassword
      }
    });

    const mailOptions = {
      from: `"ROKEA by RK" <${senderEmail}>`,
      to: to,
      replyTo: senderEmail,
      subject: subject || '✨ Exclusive Handcrafted Pieces Saved in Your Shopping Bag - ROKEA by RK',
      text: text || '',
      html: html || undefined
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Successfully sent email from ${senderEmail} to ${to}:`, info.messageId);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      from: senderEmail,
      to: to
    });
  } catch (err) {
    console.error('[SMTP] Send mail error:', err);
    return res.status(500).json({
      success: false,
      error: err.code || 'SEND_ERROR',
      message: err.message || 'Failed to dispatch email via Gmail SMTP.'
    });
  }
};
