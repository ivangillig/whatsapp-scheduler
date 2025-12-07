const Database = require("better-sqlite3");
const path = require("path");

const dbPath =
  process.env.DB_PATH || path.join(__dirname, "../data/scheduler.db");
let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  // Tabla de mensajes programados
  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_jid TEXT NOT NULL,
      contact_name TEXT,
      message TEXT NOT NULL,
      scheduled_at DATETIME NOT NULL,
      status TEXT DEFAULT 'pending',
      sent_at DATETIME,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de contactos (cache)
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      jid TEXT PRIMARY KEY,
      name TEXT,
      notify TEXT,
      img_url TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Base de datos inicializada correctamente");
  return db;
}

// Funciones para mensajes programados
function createScheduledMessage({
  contactJid,
  contactName,
  message,
  scheduledAt,
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO scheduled_messages (contact_jid, contact_name, message, scheduled_at)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(contactJid, contactName, message, scheduledAt);
  return result.lastInsertRowid;
}

function getScheduledMessages(status = null) {
  const db = getDb();
  if (status) {
    return db
      .prepare(
        "SELECT * FROM scheduled_messages WHERE status = ? ORDER BY scheduled_at ASC"
      )
      .all(status);
  }
  return db
    .prepare("SELECT * FROM scheduled_messages ORDER BY scheduled_at DESC")
    .all();
}

function getPendingMessages() {
  const db = getDb();
  const now = new Date().toISOString();
  return db
    .prepare(
      `
    SELECT * FROM scheduled_messages 
    WHERE status = 'pending' AND scheduled_at <= ?
    ORDER BY scheduled_at ASC
  `
    )
    .all(now);
}

function updateMessageStatus(id, status, errorMessage = null) {
  const db = getDb();
  const sentAt = status === "sent" ? new Date().toISOString() : null;
  db.prepare(
    `
    UPDATE scheduled_messages 
    SET status = ?, sent_at = ?, error_message = ?
    WHERE id = ?
  `
  ).run(status, sentAt, errorMessage, id);
}

function deleteScheduledMessage(id) {
  const db = getDb();
  db.prepare("DELETE FROM scheduled_messages WHERE id = ?").run(id);
}

// Funciones para contactos
function saveContacts(contacts) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO contacts (jid, name, notify, img_url, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const insertMany = db.transaction((contacts) => {
    for (const contact of contacts) {
      stmt.run(contact.jid, contact.name, contact.notify, contact.imgUrl);
    }
  });

  insertMany(contacts);
}

function getContacts() {
  const db = getDb();
  return db.prepare("SELECT * FROM contacts ORDER BY name ASC").all();
}

function deleteContact(jid) {
  const db = getDb();
  db.prepare("DELETE FROM contacts WHERE jid = ?").run(jid);
}

function clearContacts() {
  const db = getDb();
  db.prepare("DELETE FROM contacts").run();
}

module.exports = {
  initDatabase,
  getDb,
  createScheduledMessage,
  getScheduledMessages,
  getPendingMessages,
  updateMessageStatus,
  deleteScheduledMessage,
  saveContacts,
  getContacts,
  deleteContact,
  clearContacts,
};
