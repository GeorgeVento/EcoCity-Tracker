/* api/notifications.js — Μέτρηση εκκρεμών αναφορών για badge */
'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { optionalToken } = require('../middleware/auth.middleware');

const router       = express.Router();
const REPORTS_FILE = path.join(__dirname, '..', 'data', 'reports.json');

function readReports() {
  try { return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8')); } catch (e) { return []; }
}

// ── GET /api/notifications ───────────────────────────────────
// Επιστρέφει τον αριθμό εκκρεμών αναφορών.
// Αν είναι συνδεδεμένος αρμόδιος (JWT), φιλτράρει ανά δήμο.
router.get('/', optionalToken, function (req, res) {
  var reports = readReports();

  if (req.user && req.user.municipality) {
    reports = reports.filter(function (r) { return r.municipality === req.user.municipality; });
  }

  var pendingCount  = reports.filter(function (r) { return r.status === 'pending';  }).length;
  var criticalCount = reports.filter(function (r) { return r.severity === 'critical' && r.status !== 'resolved'; }).length;

  res.json({
    success:       true,
    pendingCount:  pendingCount,
    criticalCount: criticalCount,
    totalOpen:     reports.filter(function (r) { return r.status !== 'resolved'; }).length,
    timestamp:     new Date().toISOString()
  });
});

module.exports = router;
