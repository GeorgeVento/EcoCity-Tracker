/* api/auth.js — Αυθεντικοποίηση πολιτών και αρμοδίων (JWT) */
'use strict';

const express = require('express');
const jwt     = require('jsonwebtoken');
const path    = require('path');
const fs      = require('fs');

const router = express.Router();

const JWT_SECRET  = process.env.JWT_SECRET  || 'EcoCitySecretKey2026_SAEK';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// ── Αρμόδιοι ανά δήμο (αποθηκεύονται εδώ, ΟΧΙ στη βάση) ────
// Σε production: χρησιμοποιήστε bcrypt για hashing κωδικών.
const OFFICIALS = [
  { id:  1, username: 'official_aigaleo',      password: 'Aig@l3o!2026',     municipality: 'Αιγάλεω',          fullName: 'Αρμόδιος Αιγάλεω' },
  { id:  2, username: 'official_athens',       password: 'Ath3ns@2026!',      municipality: 'Αθήνα',             fullName: 'Αρμόδιος Αθήνας' },
  { id:  3, username: 'official_piraeus',      password: 'P1r@3us!2026',      municipality: 'Πειραιάς',          fullName: 'Αρμόδιος Πειραιά' },
  { id:  4, username: 'official_nikaia',       password: 'N1k@1a!2026',       municipality: 'Νίκαια',            fullName: 'Αρμόδιος Νίκαιας' },
  { id:  5, username: 'official_peristeri',    password: 'P3r1st3r1!2026',    municipality: 'Περιστέρι',         fullName: 'Αρμόδιος Περιστερίου' },
  { id:  6, username: 'official_chalandri',    password: 'Ch@l@ndr1!2026',    municipality: 'Χαλάνδρι',          fullName: 'Αρμόδιος Χαλανδρίου' },
  { id:  7, username: 'official_glyfada',      password: 'Glyf@d@!2026',      municipality: 'Γλυφάδα',           fullName: 'Αρμόδιος Γλυφάδας' },
  { id:  8, username: 'official_kallithea',    password: 'K@ll1th3@!2026',    municipality: 'Καλλιθέα',          fullName: 'Αρμόδιος Καλλιθέας' },
  { id:  9, username: 'official_ilioupoli',    password: 'Il1up0l1!2026',     municipality: 'Ηλιούπολη',         fullName: 'Αρμόδιος Ηλιούπολης' },
  { id: 10, username: 'official_maroussi',     password: 'M@r0uss1!2026',     municipality: 'Μαρούσι',           fullName: 'Αρμόδιος Μαρουσίου' },
  { id: 11, username: 'official_kifissia',     password: 'K1f1ss1@!2026',     municipality: 'Κηφισιά',           fullName: 'Αρμόδιος Κηφισιάς' },
  { id: 12, username: 'official_palaiofaliro', password: 'P@l@i0F@l!2026',    municipality: 'Παλαιό Φάληρο',    fullName: 'Αρμόδιος Παλαιού Φαλήρου' }
];

// ── Helpers ──────────────────────────────────────────────────
function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
  catch (e) { return []; }
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// ── POST /api/auth/citizen/login ─────────────────────────────
router.post('/citizen/login', function (req, res) {
  var email = (req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ success: false, message: 'Email υποχρεωτικό.' });

  var users = readUsers();
  var user  = users.find(function (u) { return u.email === email && u.role === 'citizen'; });

  if (!user) return res.status(401).json({ success: false, message: 'Δεν βρέθηκε λογαριασμός.' });

  res.json({ success: true, user: { fullName: user.fullName, email: user.email, homeMunicipality: user.homeMunicipality } });
});

// ── POST /api/auth/citizen/register ─────────────────────────
router.post('/citizen/register', function (req, res) {
  var fullName         = (req.body.fullName        || '').trim();
  var email            = (req.body.email           || '').trim().toLowerCase();
  var homeMunicipality = (req.body.homeMunicipality|| '').trim();

  if (!fullName || !email || !homeMunicipality) {
    return res.status(400).json({ success: false, message: 'Όλα τα πεδία υποχρεωτικά.' });
  }
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return res.status(400).json({ success: false, message: 'Μη έγκυρο email.' });
  }

  var users = readUsers();
  if (users.find(function (u) { return u.email === email; })) {
    return res.status(409).json({ success: false, message: 'Υπάρχει ήδη λογαριασμός με αυτό το email.' });
  }

  var newUser = {
    id:               Date.now(),
    role:             'citizen',
    fullName:         fullName,
    email:            email,
    homeMunicipality: homeMunicipality,
    registeredAt:     new Date().toISOString()
  };
  users.push(newUser);
  writeUsers(users);

  res.status(201).json({ success: true, user: { fullName: newUser.fullName, email: newUser.email, homeMunicipality: newUser.homeMunicipality } });
});

// ── POST /api/auth/official/login ────────────────────────────
router.post('/official/login', function (req, res) {
  var username = (req.body.username || '').trim();
  var password = req.body.password || '';

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username και κωδικός υποχρεωτικά.' });
  }

  var official = OFFICIALS.find(function (o) {
    return o.username === username && o.password === password;
  });

  if (!official) {
    return res.status(401).json({ success: false, message: 'Λάθος username ή κωδικός.' });
  }

  var token = jwt.sign(
    { id: official.id, username: official.username, municipality: official.municipality, role: 'official' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.json({
    success: true,
    token: token,
    official: { id: official.id, fullName: official.fullName, municipality: official.municipality, username: official.username }
  });
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
