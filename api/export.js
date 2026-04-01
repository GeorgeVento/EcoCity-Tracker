/* api/export.js — Export αναφορών σε CSV */
'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { verifyToken } = require('../middleware/auth.middleware');

const router       = express.Router();
const REPORTS_FILE = path.join(__dirname, '..', 'data', 'reports.json');

function readReports() {
  try { return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8')); } catch (e) { return []; }
}

function csvEscape(val) {
  return '"' + String(val == null ? '' : val).replace(/"/g, '""') + '"';
}

// ── GET /api/export ──────────────────────────────────────────
// Query: ?municipality=Αθήνα &status=pending &format=csv
// Απαιτεί JWT αρμοδίου
router.get('/', verifyToken, function (req, res) {
  var reports = readReports();
  var { municipality, status } = req.query;

  if (municipality && municipality !== 'all') {
    reports = reports.filter(function (r) { return r.municipality === municipality; });
  }
  if (status && status !== 'all') {
    reports = reports.filter(function (r) { return r.status === status; });
  }

  if (reports.length === 0) {
    return res.status(404).json({ success: false, message: 'Δεν βρέθηκαν αναφορές για export.' });
  }

  var headers = ['ID','Τίτλος','Δήμος','Κατηγορία','Σοβαρότητα','Κατάσταση','Ημερομηνία','Περιγραφή','Όνομα','Email','GPS Lat','GPS Lng'];

  var rows = reports.map(function (r) {
    var dt = r.createdAt ? new Date(r.createdAt).toLocaleDateString('el-GR') : '';
    return [
      r.id, r.title, r.municipality, r.category, r.severity, r.status,
      dt, r.description, r.reporterName, r.reporterEmail, r.gpsLat, r.gpsLng
    ].map(csvEscape).join(',');
  });

  var csv = '\uFEFF' + headers.map(csvEscape).join(',') + '\r\n' + rows.join('\r\n');

  var filename = 'ecocity_export_' + new Date().toISOString().slice(0,10) + '.csv';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
  res.send(csv);
});

module.exports = router;
