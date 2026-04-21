/* api/municipality-request.js — Αιτήματα εγγραφής νέων δήμων */
'use strict';

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { sendMunicipalityRequest } = require('./mailer');

const router = express.Router();

// ── Upload directory ─────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'municipality-requests');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: function (_req, file, cb) {
    var ext  = path.extname(file.originalname);
    var base = Date.now() + '-' + Math.random().toString(36).slice(2);
    cb(null, base + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: function (_req, file, cb) {
    var allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    var ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Επιτρέπονται μόνο PDF, DOC, DOCX, JPG, PNG αρχεία.'));
    }
  }
});

// ── POST /api/municipality-request ───────────────────────────
router.post('/', upload.single('document'), async function (req, res) {
  try {
    var fullName     = (req.body.fullName     || '').trim().slice(0, 200);
    var municipality = (req.body.municipality || '').trim().slice(0, 200);
    var position     = (req.body.position     || '').trim().slice(0, 200);
    var email        = (req.body.email        || '').trim().slice(0, 200);
    var phone        = (req.body.phone        || '').trim().slice(0, 50);
    var message      = (req.body.message      || '').trim().slice(0, 2000);

    if (!fullName || !municipality || !email) {
      return res.status(400).json({ error: 'Λείπουν υποχρεωτικά πεδία (Όνομα, Δήμος, Email).' });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Μη έγκυρη διεύθυνση email.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Απαιτείται επισύναψη επίσημου εγγράφου.' });
    }

    await sendMunicipalityRequest({
      fullName,
      municipality,
      position,
      email,
      phone,
      message,
      documentPath: req.file.path,
      originalName: req.file.originalname
    });

    res.json({ ok: true });

  } catch (err) {
    console.error('Municipality request error:', err);
    res.status(500).json({ error: 'Σφάλμα αποστολής. Δοκιμάστε ξανά.' });
  }
});

module.exports = router;
