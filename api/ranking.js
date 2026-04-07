/* api/ranking.js — Κατάταξη δήμων βάσει ποσοστού επίλυσης (MySQL) */
'use strict';

const express  = require('express');
const { pool } = require('../database/db');

const router = express.Router();

// ── GET /api/ranking ─────────────────────────────────────────
router.get('/', async function (_req, res) {
  try {
    var [muniRows] = await pool.query('SELECT name FROM municipalities ORDER BY name');
    var munis = muniRows.map(function (r) { return r.name; });

    var [statsRows] = await pool.query(`
      SELECT
        municipality,
        COUNT(*) AS total,
        SUM(status = 'resolved') AS resolved,
        SUM(status = 'pending')  AS pending
      FROM reports
      GROUP BY municipality
    `);

    var statsMap = {};
    statsRows.forEach(function (r) { statsMap[r.municipality] = r; });

    var ranking = munis.map(function (muni) {
      var s = statsMap[muni];
      if (!s || s.total === 0) {
        return { name: muni, total: 0, resolved: 0, pending: 0, rate: 0 };
      }
      return {
        name:     muni,
        total:    s.total,
        resolved: s.resolved,
        pending:  s.pending,
        rate:     Math.round((s.resolved / s.total) * 100)
      };
    });

    ranking.sort(function (a, b) { return b.rate - a.rate; });
    res.json({ success: true, ranking: ranking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

module.exports = router;
