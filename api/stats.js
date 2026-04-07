/* api/stats.js — Στατιστικά & αριθμός πολιτών (MySQL) */
'use strict';

const express  = require('express');
const { pool } = require('../database/db');

const router = express.Router();

// ── GET /api/stats ───────────────────────────────────────────
router.get('/', async function (req, res) {
  try {
    var muni   = req.query.municipality;
    var filter = (muni && muni !== 'all') ? 'WHERE municipality = ?' : '';
    var params = (muni && muni !== 'all') ? [muni] : [];

    var [[totRow]]  = await pool.query('SELECT COUNT(*) AS n FROM reports ' + filter, params);
    var [[resRow]]  = await pool.query("SELECT COUNT(*) AS n FROM reports " + (filter ? filter + ' AND' : 'WHERE') + " status = 'resolved'", params);
    var [[revRow]]  = await pool.query("SELECT COUNT(*) AS n FROM reports " + (filter ? filter + ' AND' : 'WHERE') + " status = 'reviewed'", params);
    var [[penRow]]  = await pool.query("SELECT COUNT(*) AS n FROM reports " + (filter ? filter + ' AND' : 'WHERE') + " status = 'pending'",  params);
    var [[criRow]]  = await pool.query("SELECT COUNT(*) AS n FROM reports " + (filter ? filter + ' AND' : 'WHERE') + " severity = 'critical'", params);

    var total    = totRow.n;
    var resolved = resRow.n;
    var rate     = total > 0 ? Math.round((resolved / total) * 100) : 0;

    var [catRows]  = await pool.query('SELECT category, COUNT(*) AS n FROM reports ' + filter + ' GROUP BY category', params);
    var [muniRows] = await pool.query('SELECT municipality, COUNT(*) AS n FROM reports ' + filter + ' GROUP BY municipality', params);
    var [reports]  = await pool.query('SELECT * FROM reports ' + filter + ' ORDER BY created_at DESC', params);

    var byCategory = {};
    catRows.forEach(function (r) { byCategory[r.category] = r.n; });

    var byMunicipality = {};
    muniRows.forEach(function (r) { byMunicipality[r.municipality] = r.n; });

    res.json({
      success: true,
      total: total, resolved: resolved, reviewed: revRow.n, pending: penRow.n,
      critical: criRow.n, resolutionRate: rate,
      byCategory: byCategory,
      byMunicipality: byMunicipality,
      reports: reports
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

// ── GET /api/stats/citizens ──────────────────────────────────
router.get('/citizens', async function (req, res) {
  try {
    var muni   = req.query.municipality;
    var filter = (muni && muni !== 'all') ? 'WHERE home_municipality = ?' : '';
    var params = (muni && muni !== 'all') ? [muni] : [];

    var [[row]] = await pool.query('SELECT COUNT(*) AS n FROM users ' + filter, params);
    res.json({ success: true, count: row.n });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

module.exports = router;
