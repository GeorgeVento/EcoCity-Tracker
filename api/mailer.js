/* api/mailer.js — Αποστολή email με nodemailer */
'use strict';

const nodemailer = require('nodemailer');
const fs         = require('fs');

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

// ── Email αιτήματος εγγραφής νέου Δήμου ──────────────────────
async function sendMunicipalityRequest({ fullName, municipality, position, email, phone, message, documentPath, originalName }) {
  const ADMIN = process.env.ADMIN_EMAIL || 'g.l.ventouratos@gmail.com';

  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-gmail@gmail.com') {
    console.warn('⚠️  SMTP δεν έχει ρυθμιστεί — αίτημα δήμου δεν στάλθηκε. Παραλήπτης θα ήταν: ' + ADMIN);
    return;
  }

  var attachments = [];
  if (documentPath && fs.existsSync(documentPath)) {
    attachments.push({ filename: originalName || 'εγγραφο', path: documentPath });
  }

  await getTransporter().sendMail({
    from:    '"EcoCity Tracker 🌿" <' + process.env.SMTP_USER + '>',
    to:      ADMIN,
    replyTo: email,
    subject: '🏛 Νέο Αίτημα Εγγραφής Δήμου — ' + municipality,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1a6b3c;margin-top:0;">🏛 Αίτημα Εγγραφής Νέου Δήμου</h2>
        <p style="color:#6b7280;margin-bottom:24px;">Νέο αίτημα από υπάλληλο δήμου που επιθυμεί εγγραφή στο EcoCity Tracker.</p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px 0;font-weight:600;color:#374151;width:160px;">Πλήρες Όνομα</td>
            <td style="padding:10px 0;color:#111827;">${fullName}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px 0;font-weight:600;color:#374151;">Δήμος</td>
            <td style="padding:10px 0;color:#111827;">${municipality}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px 0;font-weight:600;color:#374151;">Θέση / Ρόλος</td>
            <td style="padding:10px 0;color:#111827;">${position || '—'}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px 0;font-weight:600;color:#374151;">Email</td>
            <td style="padding:10px 0;"><a href="mailto:${email}" style="color:#1a6b3c;">${email}</a></td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px 0;font-weight:600;color:#374151;">Τηλέφωνο</td>
            <td style="padding:10px 0;color:#111827;">${phone || '—'}</td>
          </tr>
          ${message ? `<tr>
            <td style="padding:10px 0;font-weight:600;color:#374151;vertical-align:top;">Μήνυμα</td>
            <td style="padding:10px 0;color:#111827;">${message.replace(/\n/g,'<br>')}</td>
          </tr>` : ''}
        </table>

        ${attachments.length ? '<p style="color:#1a6b3c;font-weight:600;">📎 Επισυνάπτεται επίσημο έγγραφο (βλ. συνημμένο).</p>' : '<p style="color:#ef4444;">⚠️ Δεν επισυνάφθηκε έγγραφο.</p>'}

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-top:24px;">
          <p style="margin:0;font-size:.9rem;color:#166534;">
            <strong>Επόμενο βήμα:</strong> Απαντήστε απευθείας σε αυτό το email (reply-to: ${email})
            για να δώσετε τους κωδικούς πρόσβασης στον αρμόδιο.
          </p>
        </div>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="color:#9ca3af;font-size:.8rem;margin:0;">
          EcoCity Tracker — ΣΑΕΚ ΑΙΓΑΛΕΩ · Βεντουράτος · Χριστοδούλου · Παπαδάκης
        </p>
      </div>
    `,
    attachments
  });

  console.log('📧  Αίτημα εγγραφής δήμου "' + municipality + '" στάλθηκε στο ' + ADMIN);
}

module.exports = { sendVerificationEmail, sendResetEmail, sendMunicipalityRequest };
