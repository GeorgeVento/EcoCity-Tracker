/* api/auth.js — Αυθεντικοποίηση πολιτών και αρμοδίων (JWT + MySQL + email) */
'use strict';

const express  = require('express');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const { pool } = require('../database/db');
const { sendVerificationEmail } = require('./mailer');

const router = express.Router();

const JWT_SECRET  = process.env.JWT_SECRET  || 'EcoCitySecretKey2026_SAEK';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// ── POST /api/auth/citizen/login ─────────────────────────────
router.post('/citizen/login', async function (req, res) {
  try {
    var email = (req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: 'Email υποχρεωτικό.' });

    var [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Δεν βρέθηκε λογαριασμός με αυτό το email.' });
    }

    var user = rows[0];
    res.json({
      success: true,
      user: {
        id:               user.id,
        fullName:         user.full_name,
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
    var email            = (req.body.email            || '').trim().toLowerCase();
    var homeMunicipality = (req.body.homeMunicipality || '').trim();

    if (!fullName || !email || !homeMunicipality) {
      return res.status(400).json({ success: false, message: 'Όλα τα πεδία υποχρεωτικά.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Μη έγκυρο email.' });
    }

    var [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Υπάρχει ήδη λογαριασμός με αυτό το email.' });
    }

    // Δημιουργία token επιβεβαίωσης (λήγει σε 24 ώρες)
    var token      = crypto.randomBytes(32).toString('hex');
    var expiresAt  = new Date(Date.now() + 24 * 60 * 60 * 1000);

    var [result] = await pool.query(
      'INSERT INTO users (full_name, email, home_municipality, verification_token, token_expires_at) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, homeMunicipality, token, expiresAt]
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

// ── GET /api/auth/verify ─────────────────────────────────────
router.get('/verify', function (req, res) {
  var auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ valid: false });
  try {
    var payload = jwt.verify(auth.slice(7), JWT_SECRET);
    res.json({ valid: true, payload: payload });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
});

module.exports = router;
