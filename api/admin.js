/* api/admin.js — Superadmin API: full CRUD for users, officials, municipalities, reports */
'use strict';

const express  = require('express');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const { pool } = require('../database/db');

const router = express.Router();

const JWT_SECRET  = process.env.JWT_SECRET      || 'EcoCitySecretKey2026_SAEK';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN  || '7d';
const ADMIN_USER  = process.env.ADMIN_USERNAME  || 'superadmin';
const ADMIN_PASS  = process.env.ADMIN_PASSWORD  || 'EcoAdmin@2026!';

// ── Admin auth middleware ─────────────────────────────────────
function adminAuth(req, res, next) {
  var auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  try {
    var decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Superadmin access required.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

// ── POST /api/admin/login ─────────────────────────────────────
router.post('/login', function (req, res) {
  var username = (req.body.username || '').trim();
  var password = req.body.password  || '';

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  var token = jwt.sign({ username: ADMIN_USER, role: 'superadmin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({ success: true, token: token, username: ADMIN_USER });
});

// ── GET /api/admin/stats ──────────────────────────────────────
router.get('/stats', adminAuth, async function (req, res) {
  try {
    var [[users]]   = await pool.query('SELECT COUNT(*) AS n FROM users');
    var [[munis]]   = await pool.query('SELECT COUNT(*) AS n FROM municipalities');
    var [[offs]]    = await pool.query('SELECT COUNT(*) AS n FROM officials WHERE is_active = 1');
    var [[reps]]    = await pool.query('SELECT COUNT(*) AS n FROM reports');
    var [[pending]] = await pool.query("SELECT COUNT(*) AS n FROM reports WHERE status = 'pending'");
    var [[crit]]    = await pool.query("SELECT COUNT(*) AS n FROM reports WHERE severity = 'critical' AND status != 'resolved'");
    res.json({ success: true, users: users.n, municipalities: munis.n, officials: offs.n, reports: reps.n, pending: pending.n, critical: crit.n });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════════
router.get('/users', adminAuth, async function (req, res) {
  try {
    var [rows] = await pool.query(
      'SELECT id, full_name, username, email, home_municipality, is_verified, registered_at FROM users ORDER BY registered_at DESC'
    );
    res.json({ success: true, users: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.post('/users', adminAuth, async function (req, res) {
  try {
    var fullName         = (req.body.fullName         || '').trim();
    var username         = (req.body.username         || '').trim();
    var email            = (req.body.email            || '').trim().toLowerCase();
    var password         = req.body.password          || '';
    var homeMunicipality = (req.body.homeMunicipality || '').trim();
    var isVerified       = req.body.isVerified ? 1 : 0;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, username, email and password are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    var hashedPassword = bcrypt.hashSync(password, 10);
    var [result] = await pool.query(
      'INSERT INTO users (full_name, username, email, password, home_municipality, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
      [fullName, username, email, hashedPassword, homeMunicipality, isVerified]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Username or email already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.put('/users/:id', adminAuth, async function (req, res) {
  try {
    var id               = req.params.id;
    var fullName         = (req.body.fullName         || '').trim();
    var username         = (req.body.username         || '').trim();
    var homeMunicipality = (req.body.homeMunicipality || '').trim();
    var isVerified       = req.body.isVerified ? 1 : 0;

    var sets = ['full_name = ?', 'username = ?', 'home_municipality = ?', 'is_verified = ?'];
    var vals = [fullName, username, homeMunicipality, isVerified];

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }
      sets.push('password = ?');
      vals.push(bcrypt.hashSync(req.body.password, 10));
    }

    vals.push(id);
    var [result] = await pool.query('UPDATE users SET ' + sets.join(', ') + ' WHERE id = ?', vals);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Username or email already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.delete('/users/:id', adminAuth, async function (req, res) {
  try {
    var [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════
// MUNICIPALITIES
// ════════════════════════════════════════════════════════════════
router.get('/municipalities', adminAuth, async function (req, res) {
  try {
    var [rows] = await pool.query(`
      SELECT m.id, m.name,
        (SELECT COUNT(*) FROM reports r WHERE r.municipality = m.name) AS report_count,
        (SELECT COUNT(*) FROM officials o WHERE o.municipality = m.name AND o.is_active = 1) AS official_count
      FROM municipalities m ORDER BY m.name
    `);
    res.json({ success: true, municipalities: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.post('/municipalities', adminAuth, async function (req, res) {
  try {
    var name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Municipality name is required.' });
    var [result] = await pool.query('INSERT INTO municipalities (name) VALUES (?)', [name]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Municipality already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.put('/municipalities/:id', adminAuth, async function (req, res) {
  try {
    var name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Municipality name is required.' });
    var [result] = await pool.query('UPDATE municipalities SET name = ? WHERE id = ?', [name, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Municipality not found.' });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Municipality name already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.delete('/municipalities/:id', adminAuth, async function (req, res) {
  try {
    var [result] = await pool.query('DELETE FROM municipalities WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Municipality not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════
// OFFICIALS
// ════════════════════════════════════════════════════════════════
router.get('/officials', adminAuth, async function (req, res) {
  try {
    var [rows] = await pool.query(
      'SELECT id, username, full_name, municipality, is_active, created_at FROM officials ORDER BY municipality, username'
    );
    res.json({ success: true, officials: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.post('/officials', adminAuth, async function (req, res) {
  try {
    var username     = (req.body.username     || '').trim();
    var fullName     = (req.body.fullName     || '').trim();
    var password     = req.body.password      || '';
    var municipality = (req.body.municipality || '').trim();
    var isActive     = req.body.isActive !== false ? 1 : 0;

    if (!username || !fullName || !password || !municipality) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    var hashedPassword = bcrypt.hashSync(password, 10);
    var [result] = await pool.query(
      'INSERT INTO officials (username, password, full_name, municipality, is_active) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, fullName, municipality, isActive]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Username already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.put('/officials/:id', adminAuth, async function (req, res) {
  try {
    var id           = req.params.id;
    var fullName     = (req.body.fullName     || '').trim();
    var username     = (req.body.username     || '').trim();
    var municipality = (req.body.municipality || '').trim();
    var isActive     = req.body.isActive ? 1 : 0;

    var sets = ['full_name = ?', 'username = ?', 'municipality = ?', 'is_active = ?'];
    var vals = [fullName, username, municipality, isActive];

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }
      sets.push('password = ?');
      vals.push(bcrypt.hashSync(req.body.password, 10));
    }

    vals.push(id);
    var [result] = await pool.query('UPDATE officials SET ' + sets.join(', ') + ' WHERE id = ?', vals);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Official not found.' });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Username already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.delete('/officials/:id', adminAuth, async function (req, res) {
  try {
    var [result] = await pool.query('DELETE FROM officials WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Official not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════
// REPORTS (admin: view all + delete)
// ════════════════════════════════════════════════════════════════
router.get('/reports', adminAuth, async function (req, res) {
  try {
    var { municipality, status } = req.query;
    var where  = [];
    var params = [];

    if (municipality && municipality !== 'all') { where.push('municipality = ?'); params.push(municipality); }
    if (status && status !== 'all')             { where.push('status = ?');       params.push(status); }

    var sql = 'SELECT * FROM reports';
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY created_at DESC';

    var [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, reports: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.put('/reports/:id', adminAuth, async function (req, res) {
  try {
    var newStatus = req.body.status;
    var allowed   = ['pending', 'reviewed', 'resolved'];
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    var [result] = await pool.query(
      'UPDATE reports SET status = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.delete('/reports/:id', adminAuth, async function (req, res) {
  try {
    var [result] = await pool.query('DELETE FROM reports WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
