/* api/server.js — Express server: static files + API routes */
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');

const authRoutes          = require('./auth');
const reportsRoutes       = require('./reports');
const statsRoutes         = require('./stats');
const rankingRoutes       = require('./ranking');
const exportRoutes        = require('./export');
const notificationsRoutes = require('./notifications');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Directories ──────────────────────────────────────────────
const ROOT       = path.join(__dirname, '..');
const UPLOADS    = path.join(ROOT, 'uploads');
const DATA_DIR   = path.join(ROOT, 'data');

[UPLOADS, DATA_DIR].forEach(function (dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static files ─────────────────────────────────────────────
app.use(express.static(ROOT));
app.use('/uploads', express.static(UPLOADS));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/reports',       reportsRoutes);
app.use('/api/stats',         statsRoutes);
app.use('/api/ranking',       rankingRoutes);
app.use('/api/export',        exportRoutes);
app.use('/api/notifications', notificationsRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', function (req, res) {
  res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() });
});

// ── 404 για αγνώστα /api/* ───────────────────────────────────
app.use('/api/*', function (req, res) {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// ── Fallback: serve index.html (SPA) ─────────────────────────
app.get('*', function (req, res) {
  res.sendFile(path.join(ROOT, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, function () {
  console.log('\u{1F33F} EcoCity Tracker  →  http://localhost:' + PORT);
  console.log('   API base         →  http://localhost:' + PORT + '/api');
});

module.exports = app;
