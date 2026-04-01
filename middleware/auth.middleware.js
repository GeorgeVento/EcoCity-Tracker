/* middleware/auth.middleware.js — Επαλήθευση JWT token */
'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'EcoCitySecretKey2026_SAEK';

/**
 * verifyToken — Υποχρεωτικός έλεγχος JWT.
 * Αν το token λείπει ή είναι άκυρο, επιστρέφει 401.
 * Αν είναι έγκυρο, βάζει req.user = decoded payload.
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
 * optionalToken — Προαιρετικός έλεγχος JWT.
 * Δεν επιστρέφει σφάλμα αν λείπει. Χρήσιμο για public endpoints
 * που θέλουμε να γνωρίζουμε αν ο χρήστης είναι συνδεδεμένος.
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
