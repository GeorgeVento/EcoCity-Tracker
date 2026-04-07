/* api/auth.js — Αυθεντικοποίηση πολιτών και αρμοδίων (JWT + MySQL + email) */
'use strict';

const express  = require('express');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const { pool } = require('../database/db');
const { sendVerificationEmail, sendResetEmail } = require('./mailer');
const { verifyToken, optionalToken } = require('../middleware/auth.middleware');

const router = express.Router();

const JWT_SECRET  = process.env.JWT_SECRET  || 'EcoCitySecretKey2026_SAEK';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// ── POST /api/auth/citizen/login ─────────────────────────────
router.post('/citizen/login', async function (req, res) {
  try {
    var username = (req.body.username || '').trim();
    var password = req.body.password  || '';

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username και κωδικός υποχρεωτικά.' });
    }

    var [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0 || !bcrypt.compareSync(password, rows[0].password)) {
      return res.status(401).json({ success: false, message: 'Λάθος username ή κωδικός.' });
    }

    var user = rows[0];
    res.json({
      success: true,
      user: {
        id:               user.id,
        fullName:         user.full_name,
        username:         user.username,
        email:            user.email,
        homeMunicipality: user.home_municipality,
        isVerified:       !!user.is_verified
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── POST /api/auth/citizen/register ─────────────────────────
router.post('/citizen/register', async function (req, res) {
  try {
    var fullName         = (req.body.fullName         || '').trim();
    var username         = (req.body.username         || '').trim();
    var email            = (req.body.email            || '').trim().toLowerCase();
    var password         = req.body.password          || '';
    var homeMunicipality = (req.body.homeMunicipality || '').trim();

    if (!fullName || !username || !email || !password || !homeMunicipality) {
      return res.status(400).json({ success: false, message: 'Όλα τα πεδία υποχρεωτικά.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Μη έγκυρο email.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ success: false, message: 'Το username πρέπει να έχει τουλάχιστον 3 χαρακτήρες.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.' });
    }

    var [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ success: false, message: 'Υπάρχει ήδη λογαριασμός με αυτό το email.' });
    }

    var [existingUsername] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsername.length > 0) {
      return res.status(409).json({ success: false, message: 'Το username είναι ήδη κατειλημμένο.' });
    }

    // Hash password
    var hashedPassword = bcrypt.hashSync(password, 10);

    // Δημιουργία token επιβεβαίωσης (λήγει σε 24 ώρες)
    var token      = crypto.randomBytes(32).toString('hex');
    var expiresAt  = new Date(Date.now() + 24 * 60 * 60 * 1000);

    var [result] = await pool.query(
      'INSERT INTO users (full_name, username, email, password, home_municipality, verification_token, token_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fullName, username, email, hashedPassword, homeMunicipality, token, expiresAt]
    );

    // Στολή email (αν αποτύχει, η εγγραφή ΔΕΝ ακυρώνεται)
    try {
      await sendVerificationEmail(email, fullName, token);
    } catch (mailErr) {
      console.error('⚠️  Αποτυχία αποστολής email:', mailErr.message);
    }

    res.status(201).json({
      success: true,
      emailSent: true,
      user: {
        id:               result.insertId,
        fullName:         fullName,
        username:         username,
        email:            email,
        homeMunicipality: homeMunicipality,
        isVerified:       false
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── GET /api/auth/verify-email?token=xxx ─────────────────────
router.get('/verify-email', async function (req, res) {
  try {
    var token = req.query.token || '';
    if (!token) return res.status(400).json({ success: false, message: 'Token λείπει.' });

    var [rows] = await pool.query(
      'SELECT * FROM users WHERE verification_token = ?', [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Άκυρος ή ληγμένος σύνδεσμος.' });
    }

    var user = rows[0];
    if (user.is_verified) {
      return res.json({ success: true, alreadyVerified: true, message: 'Το email είναι ήδη επιβεβαιωμένο.' });
    }

    if (new Date() > new Date(user.token_expires_at)) {
      return res.status(410).json({ success: false, message: 'Ο σύνδεσμος επιβεβαίωσης έχει λήξει.' });
    }

    await pool.query(
      'UPDATE users SET is_verified = 1, verification_token = NULL, token_expires_at = NULL WHERE id = ?',
      [user.id]
    );

    res.json({ success: true, message: 'Το email επιβεβαιώθηκε επιτυχώς!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── POST /api/auth/official/login ────────────────────────────
router.post('/official/login', async function (req, res) {
  try {
    var username = (req.body.username || '').trim();
    var password = req.body.password  || '';

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username και κωδικός υποχρεωτικά.' });
    }

    var [rows] = await pool.query(
      'SELECT * FROM officials WHERE username = ? AND is_active = 1', [username]
    );
    if (rows.length === 0 || !bcrypt.compareSync(password, rows[0].password)) {
      return res.status(401).json({ success: false, message: 'Λάθος username ή κωδικός.' });
    }

    var official = rows[0];
    var token = jwt.sign(
      { id: official.id, username: official.username, municipality: official.municipality, role: 'official' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success:  true,
      token:    token,
      official: { id: official.id, fullName: official.full_name, municipality: official.municipality, username: official.username }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── PUT /api/auth/citizen/update ───────────────────────────
router.put('/citizen/update', optionalToken, async function (req, res) {
  try {
    // For citizens, we don't have JWT, so we assume the request comes from the client with proper data
    // In a real app, you'd use session cookies or other auth
    var userId = req.body.userId || (req.user ? req.user.id : null);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Χρειάζεται userId.' });
    }
    var fullName         = (req.body.fullName         || '').trim();
    var username         = (req.body.username         || '').trim();
    var homeMunicipality = (req.body.homeMunicipality || '').trim();

    if (!fullName || !username) {
      return res.status(400).json({ success: false, message: 'Όνομα και username υποχρεωτικά.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ success: false, message: 'Το username πρέπει να έχει τουλάχιστον 3 χαρακτήρες.' });
    }

    // Check if username is taken by another user
    var [existing] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Το username είναι ήδη κατειλημμένο.' });
    }

    // Get current user data
    var [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Χρήστης δεν βρέθηκε.' });
    }
    var currentUser = userRows[0];

    // Update full_name and username directly
    await pool.query(
      'UPDATE users SET full_name = ?, username = ? WHERE id = ?',
      [fullName, username, userId]
    );

    var updatedHomeMunicipality = currentUser.home_municipality;

    // If homeMunicipality is provided and different, create a change request
    if (homeMunicipality && homeMunicipality !== currentUser.home_municipality) {
      // Check if there's already a pending request
      var [pending] = await pool.query(
        'SELECT id FROM municipality_change_requests WHERE user_id = ? AND status = "pending"',
        [userId]
      );
      if (pending.length > 0) {
        return res.status(409).json({ success: false, message: 'Υπάρχει ήδη εκκρεμής αίτηση αλλαγής δήμου.' });
      }

      // Create change request
      await pool.query(
        'INSERT INTO municipality_change_requests (user_id, old_municipality, new_municipality) VALUES (?, ?, ?)',
        [userId, currentUser.home_municipality, homeMunicipality]
      );

      // Do not update home_municipality yet
    } else {
      updatedHomeMunicipality = homeMunicipality || currentUser.home_municipality;
    }

    res.json({
      success: true,
      user: {
        id: userId,
        fullName: fullName,
        username: username,
        email: currentUser.email,
        homeMunicipality: updatedHomeMunicipality,
        isVerified: currentUser.is_verified
      },
      message: homeMunicipality && homeMunicipality !== currentUser.home_municipality ? 'Η αίτηση αλλαγής δήμου υποβλήθηκε για έγκριση.' : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── GET /api/auth/municipality-change-requests ──────────────
router.get('/municipality-change-requests', optionalToken, async function (req, res) {
  try {
    var userId = req.query.userId;
    var where = [];
    var params = [];

    if (req.user && req.user.role === 'official') {
      // Officials see all pending requests
      where.push('status = ?');
      params.push('pending');
    } else {
      // Citizens see their own requests
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Χρειάζεται userId.' });
      }
      where.push('user_id = ?');
      params.push(userId);
    }

    var sql = 'SELECT r.*, u.full_name, u.username, u.email FROM municipality_change_requests r JOIN users u ON r.user_id = u.id';
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY r.requested_at DESC';

    var [rows] = await pool.query(sql, params);

    res.json({
      success: true,
      requests: rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userFullName: row.full_name,
        userUsername: row.username,
        userEmail: row.email,
        oldMunicipality: row.old_municipality,
        newMunicipality: row.new_municipality,
        status: row.status,
        requestedAt: row.requested_at,
        reviewedAt: row.reviewed_at
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── PUT /api/auth/municipality-change-requests/:id ──────────
router.put('/municipality-change-requests/:id', optionalToken, async function (req, res) {
  try {
    // Only officials can approve/reject
    if (!req.user || req.user.role !== 'official') {
      return res.status(403).json({ success: false, message: 'Μόνο αρμόδιοι μπορούν να εγκρίνουν αιτήσεις.' });
    }

    var requestId = req.params.id;
    var action = req.body.action; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Μη έγκυρη ενέργεια.' });
    }

    var [rows] = await pool.query('SELECT * FROM municipality_change_requests WHERE id = ?', [requestId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Αίτηση δεν βρέθηκε.' });
    }

    var request = rows[0];
    if (request.status !== 'pending') {
      return res.status(409).json({ success: false, message: 'Η αίτηση δεν είναι εκκρεμής.' });
    }

    var newStatus = action === 'approve' ? 'approved' : 'rejected';

    await pool.query(
      'UPDATE municipality_change_requests SET status = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?',
      [newStatus, req.user.id, requestId]
    );

    if (action === 'approve') {
      // Update user's home_municipality
      await pool.query(
        'UPDATE users SET home_municipality = ? WHERE id = ?',
        [request.new_municipality, request.user_id]
      );
    }

    res.json({
      success: true,
      message: action === 'approve' ? 'Η αίτηση εγκρίθηκε.' : 'Η αίτηση απορρίφθηκε.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── POST /api/auth/citizen/forgot-password ──────────────────
router.post('/citizen/forgot-password', async function (req, res) {
  try {
    var email = (req.body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Μη έγκυρο email.' });
    }

    var [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Δεν βρέθηκε λογαριασμός με αυτό το email.' });
    }

    var user = rows[0];

    // Δημιουργία reset token (λήγει σε 1 ώρα)
    var token     = crypto.randomBytes(32).toString('hex');
    var expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_expires_at = ? WHERE id = ?',
      [token, expiresAt, user.id]
    );

    // Στολή email
    try {
      await sendResetEmail(email, user.full_name, token);
    } catch (mailErr) {
      console.error('⚠️  Αποτυχία αποστολής reset email:', mailErr.message);
      return res.status(500).json({ success: false, message: 'Αποτυχία αποστολής email.' });
    }

    res.json({ success: true, message: 'Email επαναφοράς στάλθηκε.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── POST /api/auth/citizen/reset-password ───────────────────
router.post('/citizen/reset-password', async function (req, res) {
  try {
    var token    = req.body.token    || '';
    var password = req.body.password || '';

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token και κωδικός υποχρεωτικά.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.' });
    }

    var [rows] = await pool.query('SELECT * FROM users WHERE reset_token = ?', [token]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Άκυρος ή ληγμένος σύνδεσμος.' });
    }

    var user = rows[0];
    if (new Date() > new Date(user.reset_expires_at)) {
      return res.status(410).json({ success: false, message: 'Ο σύνδεσμος επαναφοράς έχει λήξει.' });
    }

    // Hash new password
    var hashedPassword = bcrypt.hashSync(password, 10);

    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: 'Ο κωδικός επαναφέρθηκε επιτυχώς.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

module.exports = router;
