/* middleware/auth.middleware.js — JWT token verification */
'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'EcoCitySecretKey2026_SAEK';

/**
 * verifyToken — Mandatory JWT check.
 * Returns 401 if the token is missing or invalid.
 * Sets req.user = decoded payload if valid.
 */
function verifyToken(req, res, next) {
  var auth = req.headers.authorization || '';

  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Απαιτείται αυθεντικοποίηση.' });
  }

  var token = auth.slice(7);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    var msg = err.name === 'TokenExpiredError'
      ? 'Το session έχει λήξει. Συνδέσου ξανά.'
      : 'Μη έγκυρο token.';
    return res.status(401).json({ success: false, message: msg });
  }
}

/**
 * optionalToken — Optional JWT check.
 * Does not return an error if the token is absent. Useful for public
 * endpoints where we want to know whether the user is logged in.
 */
function optionalToken(req, res, next) {
  var auth = req.headers.authorization || '';

  if (auth.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    } catch (e) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

module.exports = { verifyToken, optionalToken };
