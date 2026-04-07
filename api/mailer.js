/* api/mailer.js — Αποστολή email με nodemailer */
'use strict';

const nodemailer = require('nodemailer');

var transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

// ── Email επιβεβαίωσης εγγραφής ──────────────────────────────
async function sendVerificationEmail(email, fullName, token) {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-gmail@gmail.com') {
    console.warn('⚠️  SMTP δεν έχει ρυθμιστεί — email δεν στάλθηκε στο ' + email);
    return;
  }

  var appUrl    = process.env.APP_URL || 'http://localhost:3000';
  var verifyUrl = appUrl + '/html/verify-email.html?token=' + token;

  await getTransporter().sendMail({
    from:    '"EcoCity Tracker 🌿" <' + process.env.SMTP_USER + '>',
    to:      email,
    subject: 'Επιβεβαίωση Email — EcoCity Tracker',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1a6b3c;margin-top:0;">🌿 EcoCity Tracker</h2>
        <p>Γεια σου, <strong>${fullName}</strong>!</p>
        <p>Καλωσόρισες στην πλατφόρμα αναφορών πολιτών. Πάτα το κουμπί παρακάτω για να επιβεβαιώσεις το email σου:</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${verifyUrl}"
             style="background:#1a6b3c;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:1rem;">
            Επιβεβαίωση Email
          </a>
        </div>
        <p style="color:#6b7280;font-size:.875rem;">
          Ο σύνδεσμος λήγει σε 24 ώρες.<br>
          Αν δεν έκανες εγγραφή, αγνόησε αυτό το email.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="color:#9ca3af;font-size:.8rem;margin:0;">
          EcoCity Tracker — ΣΑΕΚ ΑΙΓΑΛΕΩ · Βεντουράτος · Χριστοδούλου · Παπαδάκης
        </p>
      </div>
    `
  });

  console.log('📧  Email επιβεβαίωσης στάλθηκε στο ' + email);
}

// ── Email επαναφοράς κωδικού ──────────────────────────────
async function sendResetEmail(email, fullName, token) {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-gmail@gmail.com') {
    console.warn('⚠️  SMTP δεν έχει ρυθμιστεί — email δεν στάλθηκε στο ' + email);
    return;
  }

  var appUrl  = process.env.APP_URL || 'http://localhost:3000';
  var resetUrl = appUrl + '/html/reset-password.html?token=' + token;

  await getTransporter().sendMail({
    from:    '"EcoCity Tracker 🌿" <' + process.env.SMTP_USER + '>',
    to:      email,
    subject: 'Επαναφορά Κωδικού — EcoCity Tracker',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1a6b3c;margin-top:0;">🌿 EcoCity Tracker</h2>
        <p>Γεια σου, <strong>${fullName}</strong>!</p>
        <p>Λάβαμε αίτηση επαναφοράς κωδικού. Πάτα το κουμπί παρακάτω για να ορίσεις νέο κωδικό:</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetUrl}"
             style="background:#1a6b3c;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:1rem;">
            Επαναφορά Κωδικού
          </a>
        </div>
        <p style="color:#6b7280;font-size:.875rem;">
          Ο σύνδεσμος λήγει σε 1 ώρα.<br>
          Αν δεν ζήτησες επαναφορά, αγνόησε αυτό το email.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="color:#9ca3af;font-size:.8rem;margin:0;">
          EcoCity Tracker — ΣΑΕΚ ΑΙΓΑΛΕΩ · Βεντουράτος · Χριστοδούλου · Παπαδάκης
        </p>
      </div>
    `
  });

  console.log('📧  Email επαναφοράς στάλθηκε στο ' + email);
}

module.exports = { sendVerificationEmail, sendResetEmail };
