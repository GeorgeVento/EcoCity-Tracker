/* middleware/municipality.guard.js — Αρμόδιος μπορεί να τροποποιεί μόνο αναφορές του δήμου του */
'use strict';

const path = require('path');
const fs   = require('fs');

const REPORTS_FILE = path.join(__dirname, '..', 'data', 'reports.json');

function readReports() {
  try { return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8')); } catch (e) { return []; }
}

/**
 * municipalityGuard — Ελέγχει ότι ο αρμόδιος (req.user) ανήκει στον
 * ίδιο δήμο με την αναφορά που θέλει να τροποποιήσει.
 * Πρέπει να χρησιμοποιείται ΜΕΤΑ το verifyToken.
 * Αν req.user.role !== 'official', αφήνει να περάσει ελεύθερα.
 */
function municipalityGuard(req, res, next) {
  var user = req.user;

  // Μόνο για officials
  if (!user || user.role !== 'official') return next();

  var reportId = req.params.id;
  if (!reportId) return next();

  var reports = readReports();
  var report  = reports.find(function (r) { return r.id === reportId; });

  if (!report) {
    // Αν δεν βρεθεί, αφήνουμε το reports.js να επιστρέψει 404
    return next();
  }

  if (report.municipality !== user.municipality) {
    return res.status(403).json({
      success: false,
      message: 'Δεν έχετε πρόσβαση σε αναφορές άλλου δήμου.'
    });
  }

  next();
}

module.exports = municipalityGuard;
