/* api/stats.js — Στατιστικά & αριθμός πολιτών */
'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const router       = express.Router();
const REPORTS_FILE = path.join(__dirname, '..', 'data', 'reports.json');
const USERS_FILE   = path.join(__dirname, '..', 'data', 'users.json');

function readReports() {
  try { return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8')); } catch (e) { return []; }
}
function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) { return []; }
}

// ── GET /api/stats ───────────────────────────────────────────
// Query: ?municipality=Αθήνα
router.get('/', function (req, res) {
  var reports = readReports();
  var { municipality } = req.query;

  if (municipality && municipality !== 'all') {
    reports = reports.filter(function (r) { return r.municipality === municipality; });
  }

  var total    = reports.length;
  var resolved = reports.filter(function (r) { return r.status === 'resolved'; }).length;
  var reviewed = reports.filter(function (r) { return r.status === 'reviewed'; }).length;
  var pending  = reports.filter(function (r) { return r.status === 'pending';  }).length;
  var critical = reports.filter(function (r) { return r.severity === 'critical'; }).length;
  var rate     = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Ανά κατηγορία
  var byCategory = {};
  reports.forEach(function (r) {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
  });

  // Ανά δήμο
  var byMunicipality = {};
  reports.forEach(function (r) {
    byMunicipality[r.municipality] = (byMunicipality[r.municipality] || 0) + 1;
  });

  res.json({
    success: true,
    total: total, resolved: resolved, reviewed: reviewed, pending: pending,
    critical: critical, resolutionRate: rate,
    byCategory: byCategory,
    byMunicipality: byMunicipality,
    reports: reports  // για Chart.js frontend
  });
});

// ── GET /api/stats/citizens ──────────────────────────────────
// Αριθμός πολιτών ανά δήμο (χρησιμοποιείται από official dashboard)
router.get('/citizens', function (req, res) {
  var users = readUsers();
  var { municipality } = req.query;

  var citizens = users.filter(function (u) { return u.role === 'citizen'; });
  if (municipality && municipality !== 'all') {
    citizens = citizens.filter(function (u) { return u.homeMunicipality === municipality; });
  }

  res.json({ success: true, count: citizens.length });
});

module.exports = router;
