/* api/export.js — Export αναφορών σε CSV (MySQL) */
'use strict';

const express  = require('express');
const { pool } = require('../database/db');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

function csvEscape(val) {
  return '"' + String(val == null ? '' : val).replace(/"/g, '""') + '"';
}

// ── GET /api/export ──────────────────────────────────────────
router.get('/', verifyToken, async function (req, res) {
  try {
    var { municipality, status } = req.query;
    var where  = [];
    var params = [];

    if (municipality && municipality !== 'all') { where.push('municipality = ?'); params.push(municipality); }
    if (status && status !== 'all')             { where.push('status = ?');       params.push(status); }

    var sql = 'SELECT * FROM reports';
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY created_at DESC';

    var [reports] = await pool.query(sql, params);

    if (reports.length === 0) {
      return res.status(404).json({ success: false, message: 'Δεν βρέθηκαν αναφορές για export.' });
    }

    var headers = ['ID','Τίτλος','Δήμος','Κατηγορία','Σοβαρότητα','Κατάσταση','Ημερομηνία','Περιγραφή','Όνομα','Email','GPS Lat','GPS Lng'];

    var rows = reports.map(function (r) {
      var dt = r.created_at ? new Date(r.created_at).toLocaleDateString('el-GR') : '';
      return [
        r.id, r.title, r.municipality, r.category, r.severity, r.status,
        dt, r.description, r.reporter_name, r.reporter_email, r.gps_lat, r.gps_lng
      ].map(csvEscape).join(',');
    });

    var csv      = '\uFEFF' + headers.map(csvEscape).join(',') + '\r\n' + rows.join('\r\n');
    var filename = 'ecocity_export_' + new Date().toISOString().slice(0, 10) + '.csv';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

module.exports = router;
