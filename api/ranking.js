/* api/ranking.js — Κατάταξη δήμων βάσει ποσοστού επίλυσης */
'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const router       = express.Router();
const REPORTS_FILE = path.join(__dirname, '..', 'data', 'reports.json');
const MUNIS_FILE   = path.join(__dirname, '..', 'data', 'municipalities.json');

function readReports() {
  try { return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8')); } catch (e) { return []; }
}
function readMunicipalities() {
  try { return JSON.parse(fs.readFileSync(MUNIS_FILE, 'utf8')); }
  catch (e) {
    return ['Αθήνα','Πειραιάς','Αιγάλεω','Νίκαια','Περιστέρι',
            'Χαλάνδρι','Γλυφάδα','Καλλιθέα','Ηλιούπολη','Μαρούσι','Κηφισιά','Παλαιό Φάληρο'];
  }
}

// Fallback ποσοστά (όταν δεν υπάρχουν αναφορές)
var FALLBACK = {
  'Μαρούσι': 94, 'Γλυφάδα': 91, 'Κηφισιά': 88, 'Χαλάνδρι': 85,
  'Αθήνα': 82, 'Παλαιό Φάληρο': 79, 'Καλλιθέα': 77, 'Πειραιάς': 74,
  'Ηλιούπολη': 71, 'Αιγάλεω': 68, 'Νίκαια': 65, 'Περιστέρι': 62
};

// ── GET /api/ranking ─────────────────────────────────────────
router.get('/', function (req, res) {
  var reports = readReports();
  var munis   = readMunicipalities();

  var ranking = munis.map(function (muni) {
    var muniReports = reports.filter(function (r) { return r.municipality === muni; });

    if (muniReports.length === 0) {
      return { name: muni, total: 0, resolved: 0, pending: 0, rate: FALLBACK[muni] || 50 };
    }

    var resolved = muniReports.filter(function (r) { return r.status === 'resolved'; }).length;
    var pending  = muniReports.filter(function (r) { return r.status === 'pending';  }).length;
    return {
      name:     muni,
      total:    muniReports.length,
      resolved: resolved,
      pending:  pending,
      rate:     Math.round((resolved / muniReports.length) * 100)
    };
  });

  // Ταξινόμηση: υψηλότερο ποσοστό πρώτο
  ranking.sort(function (a, b) { return b.rate - a.rate; });

  res.json({ success: true, ranking: ranking });
});

module.exports = router;
