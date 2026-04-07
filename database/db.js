/* database/db.js — MySQL connection pool & δημιουργία πινάκων */
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || '127.0.0.1',
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || 'root',
  database:           process.env.DB_NAME     || 'ecocity',
  waitForConnections: true,
  connectionLimit:    10,
  charset:            'utf8mb4'
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS municipalities (
      id   INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      full_name           VARCHAR(200) NOT NULL,
      email               VARCHAR(200) UNIQUE NOT NULL,
      home_municipality   VARCHAR(100) NOT NULL,
      is_verified         TINYINT(1)   DEFAULT 0,
      verification_token  VARCHAR(100),
      token_expires_at    DATETIME,
      registered_at       DATETIME     DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // Ασφαλής προσθήκη στηλών αν η users υπάρχει ήδη χωρίς αυτές
  var newCols = [
    "ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0",
    "ALTER TABLE users ADD COLUMN verification_token VARCHAR(100)",
    "ALTER TABLE users ADD COLUMN token_expires_at DATETIME"
  ];
  for (var sql of newCols) {
    try { await pool.query(sql); } catch (e) { /* στήλη υπάρχει ήδη */ }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS officials (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      username     VARCHAR(100) UNIQUE NOT NULL,
      password     VARCHAR(255) NOT NULL,
      full_name    VARCHAR(200) NOT NULL,
      municipality VARCHAR(100) NOT NULL,
      is_active    TINYINT(1)   DEFAULT 1,
      created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id             VARCHAR(50)  PRIMARY KEY,
      title          VARCHAR(300) NOT NULL,
      municipality   VARCHAR(100) NOT NULL,
      category       VARCHAR(100) NOT NULL,
      severity       ENUM('low','medium','critical') NOT NULL DEFAULT 'low',
      description    TEXT         NOT NULL,
      gps_lat        VARCHAR(50),
      gps_lng        VARCHAR(50),
      photo_path     MEDIUMTEXT,
      reporter_name  VARCHAR(200) DEFAULT '',
      reporter_email VARCHAR(200) DEFAULT '',
      status         ENUM('pending','reviewed','resolved') NOT NULL DEFAULT 'pending',
      user_id        INT,
      created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
      updated_at     DATETIME,
      INDEX idx_municipality (municipality),
      INDEX idx_status       (status),
      INDEX idx_created      (created_at)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  console.log('✅  Πίνακες MySQL έτοιμοι.');
}

module.exports = { pool, initDB };
