/* api/reports.js — CRUD αναφορών */
'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { verifyToken, optionalToken } = require('../middleware/auth.middleware');
const municipalityGuard              = require('../middleware/municipality.guard');

const router       = express.Router();
const REPORTS_FILE = path.join(__dirname, '..', 'data', 'reports.json');

// ── Helpers ──────────────────────────────────────────────────
function readReports() {
  try { return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8')); }
  catch (e) { return []; }
}
function writeReports(reports) {
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf8');
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// ── GET /api/reports ─────────────────────────────────────────
// Query params: ?municipality=Αθήνα &status=pending &severity=critical
router.get('/', optionalToken, function (req, res) {
  var reports = readReports();
  var { municipality, status, severity, limit } = req.query;

  if (municipality && municipality !== 'all') {
    reports = reports.filter(function (r) { return r.municipality === municipality; });
  }
  if (status)   reports = reports.filter(function (r) { return r.status   === status;   });
  if (severity) reports = reports.filter(function (r) { return r.severity === severity; });

  // Sort: newest first
  reports.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

  if (limit) reports = reports.slice(0, parseInt(limit, 10));

  res.json({ success: true, count: reports.length, reports: reports });
});

// ── GET /api/reports/:id ─────────────────────────────────────
router.get('/:id', function (req, res) {
  var reports = readReports();
  var report  = reports.find(function (r) { return r.id === req.params.id; });
  if (!report) return res.status(404).json({ success: false, message: 'Αναφορά δεν βρέθηκε.' });
  res.json({ success: true, report: report });
});

// ── POST /api/reports ────────────────────────────────────────
router.post('/', optionalToken, function (req, res) {
  var { title, municipality, category, severity, description, gpsLat, gpsLng,
        photo, reporterName, reporterEmail } = req.body;

  if (!title || !municipality || !category || !severity || !description) {
    return res.status(400).json({ success: false, message: 'Υποχρεωτικά πεδία λείπουν.' });
  }

  var report = {
    id:            req.body.id || genId(),
    title:         String(title).trim(),
    municipality:  String(municipality),
    category:      String(category),
    severity:      ['low','medium','critical'].includes(severity) ? severity : 'low',
    description:   String(description).trim(),
    gpsLat:        gpsLat   || null,
    gpsLng:        gpsLng   || null,
    photo:         photo    || null,
    reporterName:  reporterName  ? String(reporterName).trim()  : '',
    reporterEmail: reporterEmail ? String(reporterEmail).trim() : '',
    status:        'pending',
    createdAt:     new Date().toISOString(),
    userId:        req.user ? req.user.id : null
  };

  var reports = readReports();
  // Αποφυγή διπλότυπων αν η ίδια αναφορά έχει ήδη αποθηκευτεί (από localStorage sync)
  if (!reports.find(function (r) { return r.id === report.id; })) {
    reports.unshift(report);
    writeReports(reports);
  }

  res.status(201).json({ success: true, report: report });
});

// ── PUT /api/reports/:id ─────────────────────────────────────
// Ενημέρωση status (μόνο αρμόδιοι)
router.put('/:id', verifyToken, municipalityGuard, function (req, res) {
  var reports = readReports();
  var idx     = reports.findIndex(function (r) { return r.id === req.params.id; });

  if (idx < 0) return res.status(404).json({ success: false, message: 'Αναφορά δεν βρέθηκε.' });

  var allowed = ['pending', 'reviewed', 'resolved'];
  if (req.body.status && !allowed.includes(req.body.status)) {
    return res.status(400).json({ success: false, message: 'Μη έγκυρο status.' });
  }

  if (req.body.status) reports[idx].status = req.body.status;
  reports[idx].updatedAt = new Date().toISOString();
  writeReports(reports);

  res.json({ success: true, report: reports[idx] });
});

// ── DELETE /api/reports/:id ──────────────────────────────────
router.delete('/:id', verifyToken, function (req, res) {
  var reports = readReports();
  var newList = reports.filter(function (r) { return r.id !== req.params.id; });
  if (newList.length === reports.length) {
    return res.status(404).json({ success: false, message: 'Αναφορά δεν βρέθηκε.' });
  }
  writeReports(newList);
  res.json({ success: true, message: 'Αναφορά διαγράφηκε.' });
});

module.exports = router;
