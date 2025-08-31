const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const config = require('./config');

const dbPath = config.databaseUrl;
let db;

function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, function (err, rows) {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, function (err, row) {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function initDb() {
  await new Promise((resolve) => {
    db = new sqlite3.Database(dbPath, resolve);
  });

  await run(`PRAGMA foreign_keys = ON;`);

  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    is_validated INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'client',
    balance_cents INTEGER NOT NULL DEFAULT 0,
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    newsletter_optin INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`);

  await run(`CREATE TABLE IF NOT EXISTS franchise_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    siret TEXT NOT NULL,
    tva TEXT NOT NULL,
    phone TEXT,
    pdf_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en_attente',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);

  // Best-effort migrations for existing DBs
  try { await run('ALTER TABLE users ADD COLUMN phone TEXT'); } catch (e) {}
  try { await run('ALTER TABLE users ADD COLUMN is_validated INTEGER NOT NULL DEFAULT 0'); } catch (e) {}
  try { await run("ALTER TABLE franchise_applications ADD COLUMN phone TEXT"); } catch (e) {}
  try { await run("ALTER TABLE franchise_applications ADD COLUMN status TEXT NOT NULL DEFAULT 'en_attente'"); } catch (e) {}
  try { await run("ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'"); } catch (e) {}
  try { await run("ALTER TABLE orders ADD COLUMN ready_at TEXT"); } catch (e) {}
  try { await run("ALTER TABLE orders ADD COLUMN completed_at TEXT"); } catch (e) {}
  // Supprimer pending_at si présent (si SQLite le permet); sinon sans gravité
  try { await run("ALTER TABLE orders DROP COLUMN pending_at"); } catch (e) {}

  // Backfill ready_at/completed_at pour anciennes commandes sans timestamps
  try {
    const pad = (n) => String(n).padStart(2, '0');
    const fmtLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const rows = await all(`SELECT id, created_at, items_json, status, ready_at, completed_at FROM orders WHERE ready_at IS NULL OR ready_at = ''`);
    for (const r of rows) {
      let items = [];
      try { items = JSON.parse(r.items_json || '[]'); } catch (_) { items = []; }
      const totalQty = Array.isArray(items) ? items.reduce((s, it) => s + (Number(it.qty)||0), 0) : 0;
      const prepMinutes = Math.max(5, Math.min(30, 5 + (2 * totalQty)));
      const pickupMinutes = 10;
      const base = new Date(r.created_at);
      const readyDate = new Date(base.getTime() + prepMinutes * 60000);
      const completedDate = new Date(readyDate.getTime() + pickupMinutes * 60000);
      await run('UPDATE orders SET ready_at = ? WHERE id = ?', [fmtLocal(readyDate), r.id]);
      if (String(r.status) === 'completed' && !r.completed_at) {
        await run('UPDATE orders SET completed_at = ? WHERE id = ?', [fmtLocal(completedDate), r.id]);
      }
    }
    // Corriger les enregistrements avec un ready_at antérieur au created_at
    const negs = await all(`SELECT id, created_at, items_json, status FROM orders WHERE ready_at IS NOT NULL AND julianday(ready_at) < julianday(created_at)`);
    for (const r of negs) {
      let items = [];
      try { items = JSON.parse(r.items_json || '[]'); } catch (_) { items = []; }
      const totalQty = Array.isArray(items) ? items.reduce((s, it) => s + (Number(it.qty)||0), 0) : 0;
      const prepMinutes = Math.max(5, Math.min(30, 5 + (2 * totalQty)));
      const pickupMinutes = 10;
      const base = new Date(r.created_at);
      const readyDate = new Date(base.getTime() + prepMinutes * 60000);
      const completedDate = new Date(readyDate.getTime() + pickupMinutes * 60000);
      await run('UPDATE orders SET ready_at = ?, completed_at = CASE WHEN status = "completed" THEN ? ELSE completed_at END WHERE id = ?', [fmtLocal(readyDate), fmtLocal(completedDate), r.id]);
    }
  } catch (e) { /* noop */ }

  await run(`CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    lat REAL,
    lng REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`);

  await run(`CREATE TABLE IF NOT EXISTS trucks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    franchisee_user_id INTEGER,
    address TEXT,
    lat REAL,
    lng REAL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(franchisee_user_id) REFERENCES users(id) ON DELETE SET NULL
  );`);

  await run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    truck_id INTEGER,
    items_json TEXT NOT NULL,
    total_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending|ready|completed
    used_reward INTEGER NOT NULL DEFAULT 0,
    loyalty_points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    ready_at TEXT,
    completed_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(truck_id) REFERENCES trucks(id) ON DELETE SET NULL
  );`);

  // Incidents camions (pannes/entretiens/réparations)
  await run(`CREATE TABLE IF NOT EXISTS truck_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    truck_id INTEGER NOT NULL,
    reporter_user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- panne|entretien|reparation
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open', -- open|in_progress|resolved
    priority TEXT NOT NULL DEFAULT 'moyenne', -- basse|moyenne|haute|critique
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    resolved_at TEXT,
    FOREIGN KEY(truck_id) REFERENCES trucks(id) ON DELETE CASCADE,
    FOREIGN KEY(reporter_user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);

  // Newsletters
  await run(`CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    scheduled_at TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- draft|scheduled|sent|canceled
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`);

  await run(`CREATE TABLE IF NOT EXISTS newsletter_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL, -- sent|failed
    error_text TEXT,
    sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(campaign_id) REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);

  await run(`CREATE TABLE IF NOT EXISTS payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    iban TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);

  await run(`CREATE TABLE IF NOT EXISTS loyalty_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    points_per_spend_unit INTEGER NOT NULL DEFAULT 10,
    spend_unit_euro INTEGER NOT NULL DEFAULT 10,
    reward_threshold_points INTEGER NOT NULL DEFAULT 100,
    reward_free_menus INTEGER NOT NULL DEFAULT 1
  );`);

  // Ensure single row exists
  await run(`INSERT OR IGNORE INTO loyalty_config (id) VALUES (1);`);

  // Reviews (avis clients)
  await run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);
}

async function seedAdminAndWarehouses() {
  const admin = await get('SELECT * FROM users WHERE email = ?', [config.adminEmail]);
  const hash = await bcrypt.hash(config.adminPassword, 10);
  if (!admin) {
    await run('INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?)', [
      config.adminEmail,
      hash,
      'ADMIN',
      'Admin',
      'OP'
    ]);
  } else {
    // Assurer que le compte OP correspond au .env et a le bon rôle + mot de passe
    await run('UPDATE users SET role = ?, password_hash = ? WHERE id = ?', ['ADMIN', hash, admin.id]);
  }

  const whs = await all('SELECT * FROM warehouses');
  if (whs.length === 0) {
    const defaults = [
      { name: 'Entrepôt Nord-Ouest', lat: 48.90, lng: 2.25, address: 'IDF NW' },
      { name: 'Entrepôt Nord-Est', lat: 48.90, lng: 2.45, address: 'IDF NE' },
      { name: 'Entrepôt Sud-Ouest', lat: 48.80, lng: 2.25, address: 'IDF SW' },
      { name: 'Entrepôt Sud-Est', lat: 48.80, lng: 2.45, address: 'IDF SE' },
    ];
    for (const w of defaults) {
      await run('INSERT INTO warehouses (name, address, lat, lng) VALUES (?, ?, ?, ?)', [w.name, w.address, w.lat, w.lng]);
    }
  }
}

module.exports = { initDb, seedAdminAndWarehouses, db, run, all, get };


