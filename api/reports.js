/* api/reports.js — CRUD αναφορών (MySQL) */
'use strict';

const express  = require('express');
const { pool } = require('../database/db');
const { verifyToken, optionalToken } = require('../middleware/auth.middleware');
const municipalityGuard              = require('../middleware/municipality.guard');

const router = express.Router();

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function rowToReport(r) {
  return {
    id:            r.id,
    title:         r.title,
    municipality:  r.municipality,
    category:      r.category,
    severity:      r.severity,
    description:   r.description,
    gpsLat:        r.gps_lat,
    gpsLng:        r.gps_lng,
    photo:         r.photo_path,
    reporterName:  r.reporter_name,
    reporterEmail: r.reporter_email,
    status:        r.status,
    userId:        r.user_id,
    createdAt:     r.created_at,
    updatedAt:     r.updated_at
  };
}

// ── GET /api/reports ─────────────────────────────────────────
router.get('/', optionalToken, async function (req, res) {
  try {
    var { municipality, status, severity, limit } = req.query;
    var where  = [];
    var params = [];

    if (municipality && municipality !== 'all') { where.push('municipality = ?'); params.push(municipality); }
    if (status)   { where.push('status = ?');   params.push(status);   }
    if (severity) { where.push('severity = ?'); params.push(severity); }

    var sql = 'SELECT * FROM reports';
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY created_at DESC';
    if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit, 10)); }

    var [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, reports: rows.map(rowToReport) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── GET /api/reports/:id ─────────────────────────────────────
router.get('/:id', async function (req, res) {
  try {
    var [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Αναφορά δεν βρέθηκε.' });
    res.json({ success: true, report: rowToReport(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── POST /api/reports ────────────────────────────────────────
router.post('/', optionalToken, async function (req, res) {
  try {
    var { title, municipality, category, severity, description,
          gpsLat, gpsLng, photo, reporterName, reporterEmail } = req.body;

    if (!title || !municipality || !category || !severity || !description) {
      return res.status(400).json({ success: false, message: 'Υποχρεωτικά πεδία λείπουν.' });
    }

    var id = req.body.id || genId();

    // Αποφυγή διπλότυπων (localStorage sync)
    var [existing] = await pool.query('SELECT id FROM reports WHERE id = ?', [id]);
    if (existing.length > 0) {
      var [dup] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
      return res.status(201).json({ success: true, report: rowToReport(dup[0]) });
    }

    await pool.query(
      `INSERT INTO reports
         (id, title, municipality, category, severity, description,
          gps_lat, gps_lng, photo_path, reporter_name, reporter_email, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        String(title).trim(),
        String(municipality),
        String(category),
        ['low','medium','critical'].includes(severity) ? severity : 'low',
        String(description).trim(),
        gpsLat        || null,
        gpsLng        || null,
        photo         || null,
        reporterName  ? String(reporterName).trim()  : '',
        reporterEmail ? String(reporterEmail).trim() : '',
        req.user ? req.user.id : null
      ]
    );

    var [saved] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
    res.status(201).json({ success: true, report: rowToReport(saved[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── PUT /api/reports/:id ─────────────────────────────────────
router.put('/:id', verifyToken, municipalityGuard, async function (req, res) {
  try {
    var [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Αναφορά δεν βρέθηκε.' });

    var allowed = ['pending', 'reviewed', 'resolved'];
    if (req.body.status && !allowed.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Μη έγκυρο status.' });
    }

    var newStatus = req.body.status || rows[0].status;
    await pool.query(
      'UPDATE reports SET status = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, req.params.id]
    );

    var [updated] = await pool.query('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    res.json({ success: true, report: rowToReport(updated[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── DELETE /api/reports/:id ──────────────────────────────────
router.delete('/:id', verifyToken, async function (req, res) {
  try {
    var [result] = await pool.query('DELETE FROM reports WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Αναφορά δεν βρέθηκε.' });
    }
    res.json({ success: true, message: 'Αναφορά διαγράφηκε.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

module.exports = router;
