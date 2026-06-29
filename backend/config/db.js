// ============================================================================
//  Embedded SQLite database (internal / zero-config mode)
//
//  This replaces the old MySQL pool. It exposes the SAME interface the
//  controllers already use:
//
//      const [rows]   = await pool.query("SELECT ...", [params]);   // → rows[]
//      const [result] = await pool.query("INSERT ...", [params]);   // → { insertId, affectedRows }
//
//  so no controller code had to change. The database file lives in
//  backend/data/app.db and its tables are created automatically on first run.
//  An admin account is seeded so you can log in immediately.
// ============================================================================

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

// ── Open (and create) the database file ─────────────────────────────────────
const DATA_DIR = path.join(__dirname, "..", "data");
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(process.env.DB_FILE || path.join(DATA_DIR, "app.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema (idempotent) ──────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT,
    email            TEXT UNIQUE NOT NULL,
    password         TEXT NOT NULL,
    role             TEXT NOT NULL DEFAULT 'user',
    features_enabled TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pages (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    type         TEXT NOT NULL,
    domain       TEXT,
    html_content TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS emails (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id    INTEGER NOT NULL,
    email      TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (page_id, email)
  );

  CREATE TABLE IF NOT EXISTS templates (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    name       TEXT,
    type       TEXT,
    content    TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Keep pages.updated_at fresh on every update (MySQL did this with
  -- ON UPDATE CURRENT_TIMESTAMP; SQLite needs a trigger).
  CREATE TRIGGER IF NOT EXISTS pages_set_updated_at
  AFTER UPDATE ON pages
  BEGIN
    UPDATE pages SET updated_at = datetime('now') WHERE id = NEW.id;
  END;
`);

// ── Lightweight migrations: add columns that may not exist on older DBs ──────
try { db.exec("ALTER TABLE users ADD COLUMN sheet_webhook TEXT"); } catch (e) { /* already exists */ }
try { db.exec("ALTER TABLE pages ADD COLUMN sheet_webhook TEXT"); } catch (e) { /* already exists */ }

// ── Seed an admin account (internal use — change the password after login) ───
const ALL_FEATURES = JSON.stringify({
  cookie_banner: true, age_gate: true, email_newsletter: true,
  ai_generation: true, custom_templates: true, email_export: true, analytics: true
});

function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || "hello@kushalarora.in").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (!existing) {
    db.prepare(
      "INSERT INTO users (name, email, password, role, features_enabled) VALUES (?, ?, ?, 'admin', ?)"
    ).run("Admin", email, bcrypt.hashSync(password, 12), ALL_FEATURES);
    console.log(`👤 Seeded admin login → ${email} / ${password}`);
  }
}
seedAdmin();

// ── mysql2-compatible query adapter ──────────────────────────────────────────
// Controllers call `await pool.query(sql, params)` and destructure the result.
// We translate the few MySQL-isms and return the shape they expect.
function translate(sql) {
  // MySQL "INSERT IGNORE" → SQLite "INSERT OR IGNORE"
  return sql.replace(/INSERT\s+IGNORE\s+INTO/gi, "INSERT OR IGNORE INTO");
}

function isRead(sql) {
  return /^\s*(SELECT|PRAGMA|WITH)\b/i.test(sql);
}

const pool = {
  async query(sql, params = []) {
    const text = translate(sql);
    const stmt = db.prepare(text);
    const args = Array.isArray(params) ? params : [params];
    if (isRead(text)) {
      const rows = stmt.all(...args);
      return [rows, undefined]; // mysql2 returns [rows, fields]
    }
    const info = stmt.run(...args);
    return [{ insertId: Number(info.lastInsertRowid), affectedRows: info.changes }, undefined];
  }
};

// Kept for compatibility with server.js startup check.
async function testConnection() {
  db.prepare("SELECT 1").get();
  console.log("✅ SQLite database ready");
}

module.exports = { pool, db, testConnection };
