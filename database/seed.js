/* database/seed.js — Initial data: municipalities + officials
   Run: node database/seed.js  or  npm run seed
*/
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt       = require('bcryptjs');
const { pool, initDB } = require('./db');

const SALT_ROUNDS = 10;

const MUNICIPALITIES = [
  'Αθήνα', 'Πειραιάς', 'Αιγάλεω', 'Νίκαια', 'Περιστέρι',
  'Χαλάνδρι', 'Γλυφάδα', 'Καλλιθέα', 'Ηλιούπολη',
  'Μαρούσι', 'Κηφισιά', 'Παλαιό Φάληρο'
];

const OFFICIALS_RAW = [
  // ── Athens (2 officials) ──────────────────────────────────
  { username: 'official_athens_1',     password: 'Ath3ns@2026!',     municipality: 'Αθήνα',           fullName: 'Γεώργιος Αθηναίος' },
  { username: 'official_athens_2',     password: 'Ath3ns#2026$',     municipality: 'Αθήνα',           fullName: 'Μαρία Παπαδοπούλου' },

  // ── Aigaleo (2 officials) ─────────────────────────────────
  { username: 'official_aigaleo_1',    password: 'Aig@l3o!2026',     municipality: 'Αιγάλεω',         fullName: 'Νίκος Βεντουράτος' },
  { username: 'official_aigaleo_2',    password: 'Aig@l3o#2026$',    municipality: 'Αιγάλεω',         fullName: 'Ελένη Αιγαλεώτη' },

  // ── Piraeus (2 officials) ─────────────────────────────────
  { username: 'official_piraeus_1',    password: 'P1r@3us!2026',     municipality: 'Πειραιάς',        fullName: 'Κώστας Πειραιώτης' },
  { username: 'official_piraeus_2',    password: 'P1r@3us#2026$',    municipality: 'Πειραιάς',        fullName: 'Σοφία Λιμενίου' },

  // ── Nikaia ────────────────────────────────────────────────
  { username: 'official_nikaia',       password: 'N1k@1a!2026',      municipality: 'Νίκαια',          fullName: 'Δημήτρης Νικαιέας' },
  { username: 'official_nikaia_2',     password: 'N1k@1a#2026$',     municipality: 'Νίκαια',          fullName: 'Ευαγγελία Νικαιώτη' },

  // ── Peristeri ─────────────────────────────────────────────
  { username: 'official_peristeri',    password: 'P3r1st3r1!2026',   municipality: 'Περιστέρι',       fullName: 'Αντώνης Περιστεριώτης' },
  { username: 'official_peristeri_2',  password: 'P3r1st3r1#2026$',  municipality: 'Περιστέρι',       fullName: 'Μαίρη Περιστεριώτη' },

  // ── Chalandri ─────────────────────────────────────────────
  { username: 'official_chalandri',    password: 'Ch@l@ndr1!2026',   municipality: 'Χαλάνδρι',        fullName: 'Ιωάννης Χαλανδριώτης' },
  { username: 'official_chalandri_2',  password: 'Ch@l@ndr1#2026$',  municipality: 'Χαλάνδρι',        fullName: 'Σοφία Χαλανδριώτη' },

  // ── Glyfada ───────────────────────────────────────────────
  { username: 'official_glyfada',      password: 'Glyf@d@!2026',     municipality: 'Γλυφάδα',         fullName: 'Χρήστος Παραλιώτης' },
  { username: 'official_glyfada_2',    password: 'Glyf@d@#2026$',    municipality: 'Γλυφάδα',         fullName: 'Αναστασία Παραλιώτη' },

  // ── Kallithea ─────────────────────────────────────────────
  { username: 'official_kallithea',    password: 'K@ll1th3@!2026',   municipality: 'Καλλιθέα',        fullName: 'Βασιλική Καλλιθεάτη' },
  { username: 'official_kallithea_2',  password: 'K@ll1th3@#2026$',  municipality: 'Καλλιθέα',        fullName: 'Γιώργος Καλλιθεάτης' },

  // ── Ilioupoli ─────────────────────────────────────────────
  { username: 'official_ilioupoli',    password: 'Il1up0l1!2026',    municipality: 'Ηλιούπολη',       fullName: 'Παναγιώτης Ηλιουπολίτης' },
  { username: 'official_ilioupoli_2',  password: 'Il1up0l1#2026$',   municipality: 'Ηλιούπολη',       fullName: 'Ελένη Ηλιουπολίτη' },

  // ── Maroussi ──────────────────────────────────────────────
  { username: 'official_maroussi',     password: 'M@r0uss1!2026',    municipality: 'Μαρούσι',         fullName: 'Αλέξανδρος Μαρουσιώτης' },
  { username: 'official_maroussi_2',   password: 'M@r0uss1#2026$',   municipality: 'Μαρούσι',         fullName: 'Δέσποινα Μαρουσιώτη' },

  // ── Kifissia ──────────────────────────────────────────────
  { username: 'official_kifissia',     password: 'K1f1ss1@!2026',    municipality: 'Κηφισιά',         fullName: 'Θεοδώρα Κηφισιώτη' },
  { username: 'official_kifissia_2',   password: 'K1f1ss1@#2026$',   municipality: 'Κηφισιά',         fullName: 'Νίκος Κηφισιώτης' },

  // ── Palaio Faliro ─────────────────────────────────────────
  { username: 'official_palaiofaliro', password: 'P@l@i0F@l!2026',   municipality: 'Παλαιό Φάληρο',  fullName: 'Σταύρος Φαληριώτης' },
  { username: 'official_palaiofaliro_2', password: 'P@l@i0F@l#2026$', municipality: 'Παλαιό Φάληρο',  fullName: 'Μαρία Φαληριώτη' }
];

async function seed() {
  // Create tables if they do not exist
  await initDB();

  // ── 1. Municipalities ────────────────────────────────────
  for (var muni of MUNICIPALITIES) {
    await pool.query('INSERT IGNORE INTO municipalities (name) VALUES (?)', [muni]);
  }
  console.log('✅  Δήμοι: ' + MUNICIPALITIES.length + ' εγγραφές');

  // ── 2. Officials ──────────────────────────────────────────
  var inserted = 0;
  for (var o of OFFICIALS_RAW) {
    var [rows] = await pool.query('SELECT id FROM officials WHERE username = ?', [o.username]);
    if (rows.length === 0) {
      var hashed = bcrypt.hashSync(o.password, SALT_ROUNDS);
      await pool.query(
        'INSERT INTO officials (username, password, full_name, municipality) VALUES (?, ?, ?, ?)',
        [o.username, hashed, o.fullName, o.municipality]
      );
      inserted++;
    }
  }
  console.log('✅  Αρμόδιοι: ' + inserted + ' νέοι / ' + OFFICIALS_RAW.length + ' σύνολο');

  // ── 3. Print credentials ──────────────────────────────────
  console.log('\n📋  Στοιχεία σύνδεσης αρμοδίων:');
  console.log('─'.repeat(65));
  OFFICIALS_RAW.forEach(function (o) {
    console.log('  ' + o.municipality.padEnd(20) + o.username.padEnd(28) + o.password);
  });
  console.log('─'.repeat(65));
  console.log('\n🌿  Seed ολοκληρώθηκε. Τρέξτε: npm start\n');

  await pool.end();
}

seed().catch(function (err) {
  console.error('❌  Seed απέτυχε:', err.message);
  process.exit(1);
});
