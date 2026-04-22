/* api/interests.js — Interest declarations for new municipalities */
'use strict';

const express = require('express');
const router  = express.Router();
const { pool } = require('../database/db');

// POST /api/interests — Register interest
router.post('/', async function (req, res) {
  var name         = (req.body.name         || '').trim().slice(0, 200);
  var municipality = (req.body.municipality || '').trim().slice(0, 200);

  if (!municipality) {
    return res.status(400).json({ error: 'Ο δήμος είναι υποχρεωτικός.' });
  }

  await pool.query(
    'INSERT INTO municipality_interests (name, municipality) VALUES (?, ?)',
    [name, municipality]
  );

  res.json({ ok: true });
});

// GET /api/interests — List (admin / internal use only)
router.get('/', async function (_req, res) {
  var [rows] = await pool.query(
    'SELECT id, name, municipality, submitted_at FROM municipality_interests ORDER BY submitted_at DESC'
  );
  res.json(rows);
});

module.exports = router;
