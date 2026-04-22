/* api/notifications.js — Count pending reports for badge (MySQL) */
'use strict';

const express  = require('express');
const { pool } = require('../database/db');
const { optionalToken } = require('../middleware/auth.middleware');

const router = express.Router();

// ── GET /api/notifications ───────────────────────────────────
router.get('/', optionalToken, async function (req, res) {
  try {
    var filter = '';
    var params = [];

    if (req.user && req.user.municipality) {
      filter = 'AND municipality = ?';
      params = [req.user.municipality];
    }

    var [[pen]] = await pool.query(
      "SELECT COUNT(*) AS n FROM reports WHERE status = 'pending' " + filter, params);
    var [[cri]] = await pool.query(
      "SELECT COUNT(*) AS n FROM reports WHERE severity = 'critical' AND status != 'resolved' " + filter, params);
    var [[opn]] = await pool.query(
      "SELECT COUNT(*) AS n FROM reports WHERE status != 'resolved' " + filter, params);

    res.json({
      success:       true,
      pendingCount:  pen.n,
      criticalCount: cri.n,
      totalOpen:     opn.n,
      timestamp:     new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
});

module.exports = router;
