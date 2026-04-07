/* middleware/municipality.guard.js — Αρμόδιος μπορεί να τροποποιεί μόνο αναφορές του δήμου του */
'use strict';

const { pool } = require('../database/db');

async function municipalityGuard(req, res, next) {
  var user = req.user;

  if (!user || user.role !== 'official') return next();

  var reportId = req.params.id;
  if (!reportId) return next();

  try {
    var [rows] = await pool.query('SELECT municipality FROM reports WHERE id = ?', [reportId]);

    if (rows.length === 0) return next(); // το reports.js θα επιστρέψει 404

    if (rows[0].municipality !== user.municipality) {
      return res.status(403).json({
        success: false,
        message: 'Δεν έχετε πρόσβαση σε αναφορές άλλου δήμου.'
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
  }
}

module.exports = municipalityGuard;
