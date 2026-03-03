const Database = require("better-sqlite3");
const path = require('path');

// Use __dirname to build an absolute path to the database file so
// the module works regardless of the current working directory.
const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new Database(dbPath);

// Création de la table users
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,         -- NULL for Google OAuth
    avatar TEXT,
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','fr','de')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();


db.prepare(`
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    score_player1 INTEGER NOT NULL,
    score_player2 INTEGER NOT NULL,
    winner_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
  )
`).run();

// Table friends: relations entre utilisateurs
db.prepare(`
  CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    addressee_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending','accepted','rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (requester_id, addressee_id),
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (addressee_id) REFERENCES users(id)
  )
`).run();

// Indexes pour accélérer les requêtes
db.prepare('CREATE INDEX IF NOT EXISTS idx_friends_requester ON friends(requester_id)').run();
db.prepare('CREATE INDEX IF NOT EXISTS idx_friends_addressee ON friends(addressee_id)').run();

// Export the database instance so other modules can require it and reuse
// the same connection / file.
module.exports = db;