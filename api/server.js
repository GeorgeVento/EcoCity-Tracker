/* api/server.js — Express server: static files + API routes */
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const { initDB } = require('../database/db');

const authRoutes                = require('./auth');
const reportsRoutes             = require('./reports');
const statsRoutes               = require('./stats');
const rankingRoutes             = require('./ranking');
const exportRoutes              = require('./export');
const notificationsRoutes       = require('./notifications');
const interestsRoutes           = require('./interests');
const municipalityRequestRoutes = require('./municipality-request');
const adminRoutes               = require('./admin');

const app  = express();
const PORT = process.env.PORT || 3000;

const ROOT    = path.join(__dirname, '..');
const UPLOADS = path.join(ROOT, 'uploads');

if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

// ── Security headers ─────────────────────────────────────────
app.use(function (req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── Block access to server-side files ────────────────────────
// Prevents exposure of .env, source code, package.json, etc.
app.use(function (req, res, next) {
  var p = req.path;

  // Block dotfiles (.env, .gitignore, etc.)
  if (p.match(/\/\./)) return res.status(403).end();

  // Block server-side directories
  var serverDirs = ['/api/', '/database/', '/middleware/', '/node_modules/', '/data/'];
  if (serverDirs.some(function (d) { return p.startsWith(d); })) return res.status(403).end();

  // Block config/lock files at root
  if (p.match(/^\/(package(?:-lock)?\.json|Procfile|\.env\.example|README\.md)$/)) return res.status(403).end();

  // Block private upload subdirectories
  if (p.startsWith('/uploads/municipality-requests')) return res.status(403).end();

  next();
});

// ── Body parsers ─────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static files (public only) ────────────────────────────────
app.use(express.static(ROOT, { dotfiles: 'deny' }));
app.use('/uploads', express.static(UPLOADS, { dotfiles: 'deny' }));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',                 authRoutes);
app.use('/api/reports',              reportsRoutes);
app.use('/api/stats',                statsRoutes);
app.use('/api/ranking',              rankingRoutes);
app.use('/api/export',               exportRoutes);
app.use('/api/notifications',        notificationsRoutes);
app.use('/api/interests',            interestsRoutes);
app.use('/api/municipality-request', municipalityRequestRoutes);
app.use('/api/admin',                adminRoutes);

app.get('/api/health', function (_req, res) {
  res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() });
});

app.use('/api/*', function (_req, res) {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// ── SPA fallback ──────────────────────────────────────────────
app.get('*', function (_req, res) {
  res.sendFile(path.join(ROOT, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────
initDB().then(function () {
  app.listen(PORT, function () {
    console.log('🌿 EcoCity Tracker  →  http://localhost:' + PORT);
    console.log('   API             →  http://localhost:' + PORT + '/api');
  });
}).catch(function (err) {
  console.error('❌  MySQL connection failed:', err.message);
  process.exit(1);
});

module.exports = app;
