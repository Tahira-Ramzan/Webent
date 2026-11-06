'use strict';
/**
 * SQLite persistence for Webent inquiries and admin sessions.
 * The database file lives outside the public web root (./data) and is never served.
 */
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'webent.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS inquiries (
    id            TEXT PRIMARY KEY,
    reference     TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    phone         TEXT NOT NULL,
    service_id    TEXT NOT NULL,
    service_name  TEXT NOT NULL,
    service_price INTEGER NOT NULL,
    currency      TEXT NOT NULL,
    requirements  TEXT NOT NULL,
    submitted_at  TEXT NOT NULL,
    ip_hash       TEXT,
    user_agent    TEXT,
    email_status  TEXT NOT NULL DEFAULT 'not_attempted'
  );

  CREATE INDEX IF NOT EXISTS idx_inquiries_submitted_at ON inquiries (submitted_at DESC);
  CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries (email);

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rate_events (
    key        TEXT NOT NULL,
    at         INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_rate_key ON rate_events (key, at);
`);

function makeReference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `WB-${stamp}${rand}`;
}

const insertInquiryStmt = db.prepare(`
  INSERT INTO inquiries
    (id, reference, name, email, phone, service_id, service_name, service_price, currency,
     requirements, submitted_at, ip_hash, user_agent, email_status)
  VALUES
    (@id, @reference, @name, @email, @phone, @service_id, @service_name, @service_price, @currency,
     @requirements, @submitted_at, @ip_hash, @user_agent, @email_status)
`);

function createInquiry(data) {
  const row = {
    id: crypto.randomUUID(),
    reference: makeReference(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    service_id: data.serviceId,
    service_name: data.serviceName,
    service_price: data.servicePrice,
    currency: data.currency,
    requirements: data.requirements,
    submitted_at: new Date().toISOString(),
    ip_hash: data.ipHash || null,
    user_agent: data.userAgent || null,
    email_status: 'not_attempted',
  };
  insertInquiryStmt.run(row);
  return { id: row.id, reference: row.reference, submittedAt: row.submitted_at };
}

function setEmailStatus(id, status) {
  db.prepare('UPDATE inquiries SET email_status = ? WHERE id = ?').run(status, id);
}

/** Duplicate guard: same email + same service inside the cooldown window. */
function findRecentDuplicate(email, serviceId, withinMs) {
  const since = new Date(Date.now() - withinMs).toISOString();
  return db
    .prepare(
      `SELECT reference FROM inquiries
       WHERE email = ? AND service_id = ? AND submitted_at >= ?
       ORDER BY submitted_at DESC LIMIT 1`
    )
    .get(email, serviceId, since);
}

function listInquiries(limit = 500) {
  return db
    .prepare(
      `SELECT reference, name, email, phone, service_name, service_price, currency,
              requirements, submitted_at, email_status
       FROM inquiries ORDER BY submitted_at DESC LIMIT ?`
    )
    .all(limit);
}

function countInquiries() {
  return db.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n;
}

/* ---------- sliding-window rate limiting ---------- */

function rateHit(key, windowMs) {
  const now = Date.now();
  const since = now - windowMs;
  db.prepare('DELETE FROM rate_events WHERE at < ?').run(now - 24 * 60 * 60 * 1000);
  const row = db
    .prepare('SELECT COUNT(*) AS n FROM rate_events WHERE key = ? AND at >= ?')
    .get(key, since);
  db.prepare('INSERT INTO rate_events (key, at) VALUES (?, ?)').run(key, now);
  return row.n;
}

/* ---------- admin sessions ---------- */

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function createSession(ttlMs) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + ttlMs);
  db.prepare(
    'INSERT INTO admin_sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)'
  ).run(hashToken(token), now.toISOString(), expires.toISOString());
  return { token, expiresAt: expires };
}

function getSession(token) {
  if (!token) return null;
  const row = db
    .prepare('SELECT * FROM admin_sessions WHERE token_hash = ?')
    .get(hashToken(token));
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(row.token_hash);
    return null;
  }
  return row;
}

function destroySession(token) {
  if (!token) return;
  db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(hashToken(token));
}

function destroyExpiredSessions() {
  db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(new Date().toISOString());
}

module.exports = {
  createInquiry,
  findRecentDuplicate,
  listInquiries,
  countInquiries,
  setEmailStatus,
  rateHit,
  createSession,
  getSession,
  destroySession,
  destroyExpiredSessions,
};
