/* api/server.js — Express server: static files + API routes */
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express        = require('express');
const cors           = require('cors');
const path           = require('path');
const fs             = require('fs');
const { initDB }     = require('../database/db');

const authRoutes          = require('./auth');
const reportsRoutes       = require('./reports');
const statsRoutes         = require('./stats');
const rankingRoutes       = require('./ranking');
const exportRoutes        = require('./export');
const notificationsRoutes = require('./notifications');

const app  = express();
const PORT = process.env.PORT || 3000;

const ROOT    = path.join(__dirname, '..');
const UPLOADS = path.join(ROOT, 'uploads');

if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

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

app.get('/api/health', function (_req, res) {
  res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() });
});

app.use('/api/*', function (_req, res) {
  res.status(404).json({ error: 'Endpoint not found.' });
});

app.get('*', function (_req, res) {
  res.sendFile(path.join(ROOT, 'index.html'));
});

// ── Start (μετά σύνδεση στη MySQL) ───────────────────────────
initDB().then(function () {
  app.listen(PORT, function () {
    console.log('🌿 EcoCity Tracker  →  http://localhost:' + PORT);
    console.log('   API base         →  http://localhost:' + PORT + '/api');
  });
}).catch(function (err) {
  console.error('❌  Αδυναμία σύνδεσης στη MySQL:', err.message);
  console.error('   Βεβαιώσου ότι το MAMP τρέχει και η βάση "ecocity" υπάρχει.');
  process.exit(1);
});

module.exports = app;
