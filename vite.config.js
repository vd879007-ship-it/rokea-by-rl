import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodemailer from 'nodemailer';

function gmailDevPlugin() {
  return {
    name: 'gmail-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use('/api/send-email', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.statusCode = 200;
          return res.end();
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
        }

        let bodyRaw = '';
        req.on('data', chunk => { bodyRaw += chunk; });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          try {
            const body = bodyRaw ? JSON.parse(bodyRaw) : {};
            const { to, subject, html, text, gmailAppPassword } = body;

            if (!to) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ success: false, error: 'Recipient email required' }));
            }

            const appPassword = (
              gmailAppPassword ||
              process.env.GMAIL_APP_PASSWORD ||
              process.env.ROKEA_GMAIL_PASS ||
              ''
            ).replace(/\s+/g, '');

            if (!appPassword) {
              res.statusCode = 400;
              return res.end(JSON.stringify({
                success: false,
                error: 'GMAIL_APP_PASSWORD_REQUIRED',
                message: 'Gmail App Password is required to send from rokeabyrk@gmail.com.'
              }));
            }

            const senderEmail = 'rokeabyrk@gmail.com';
            const transporter = nodemailer.createTransport({
              host: 'smtp.gmail.com',
              port: 465,
              secure: true,
              auth: {
                user: senderEmail,
                pass: appPassword
              }
            });

            const info = await transporter.sendMail({
              from: `"ROKEA by RK" <${senderEmail}>`,
              to,
              replyTo: senderEmail,
              subject: subject || '✨ Exclusive Handcrafted Pieces - ROKEA by RK',
              text: text || '',
              html: html || undefined
            });

            res.statusCode = 200;
            return res.end(JSON.stringify({
              success: true,
              messageId: info.messageId,
              from: senderEmail,
              to
            }));
          } catch (err) {
            console.error('[Vite Gmail Dev Plugin] SMTP Error:', err);
            res.statusCode = 500;
            return res.end(JSON.stringify({
              success: false,
              error: err.code || 'SEND_ERROR',
              message: err.message
            }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), gmailDevPlugin()],
  define: {
    'process.env': {
      FIREBASE_API_KEY: JSON.stringify("AIzaSyBQcdDPRCNgF7yfAJpqdH2EFriGKTdvMKA"),
      FIREBASE_AUTH_DOMAIN: JSON.stringify("rokeya-3ccaa.firebaseapp.com"),
      FIREBASE_PROJECT_ID: JSON.stringify("rokeya-3ccaa"),
      FIREBASE_STORAGE_BUCKET: JSON.stringify("rokeya-3ccaa.firebasestorage.app"),
      FIREBASE_MESSAGING_SENDER_ID: JSON.stringify("474801043436"),
      FIREBASE_APP_ID: JSON.stringify("1:474801043436:web:e12c0bf29704e4319072c9"),
      FIREBASE_MEASUREMENT_ID: JSON.stringify("G-H1GBK81D1Z"),
      RAZORPAY_KEY_ID: JSON.stringify("rzp_live_SEMSm8iPbUKAu9"),
      ADMIN_EMAIL: JSON.stringify("admin"),
      ADMIN_PASSWORD: JSON.stringify("rokea@2025")
    }
  },
  server: {
    port: 3000,
    open: false
  }
});
