const Fastify = require("fastify");
const fastify = Fastify({ logger: true });

fastify.register(require("@fastify/cors"), { origin: true });
fastify.register(require("@fastify/formbody"));
fastify.register(require("@fastify/multipart"));

const Database = require("better-sqlite3");
const db = new Database("./data/database.sqlite");

const path = require("path");
const fs = require("fs");

const { pipeline } = require("stream");
const { promisify } = require("util");
const pump = promisify(pipeline);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Création de la table users
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// ------------------------------------------------------
//                      ROUTES API
// ------------------------------------------------------

// Health check
fastify.get("/api/health", async () => ({ status: "ok" }));

// ----------- TOURNOIS -----------
let lastPlayers = [];

fastify.post("/api/start-tournament", async (req, reply) => {
  const { players } = req.body || {};

  if (!Array.isArray(players) || players.length < 2) {
    return reply.status(400).send({ error: "Invalid players array (min 2)" });
  }

  lastPlayers = players;
  return { ok: true, players: lastPlayers };
});

fastify.get("/api/players", async () => ({ players: lastPlayers }));

// ----------- USERS (REST) -----------

// Ajouter un utilisateur (correct)
fastify.post("/api/add-user", async (req, reply) => {
  const { name, email } = req.body || {};
  if (!name || !email) return reply.status(400).send({ error: "Name and email are required" });
  try {
    db.prepare("INSERT INTO users (name, email) VALUES (?, ?)").run(name, email);
    const user = db.prepare("SELECT * FROM users WHERE name = ?").get(name);
    return { ok: true, user };
  } catch(e) {
    return reply.status(400).send({ error: "User or email already exists" });
  }
});

// Lister les utilisateurs
fastify.get("/api/users", async () => {
  return db.prepare("SELECT * FROM users").all();
});

// Vérifier si user existe
fastify.post("/api/login", async (req, reply) => {
  const { name } = req.body || {};
  if (!name) return reply.status(400).send({ error: "Name is required" });

  const user = db.prepare("SELECT * FROM users WHERE name = ?").get(name);
  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }
  return { ok: true, user };
});

//recuperation d'utilisateur
fastify.get("/api/user/:name", async (req, reply) => {
  const name = req.params.name;
  const user = db.prepare("SELECT * FROM users WHERE name = ?").get(name);

  if (!user) return { ok: false, error: "User not found" };

  return { ok: true, user };
});

// Upload avatar
fastify.post("/api/upload-avatar", async (req, reply) => {
  // req.file() est fourni par @fastify/multipart (assure-toi d'avoir registered)
  const part = await req.file();
  const { userId } = req.body || {};

  if (!userId) return reply.status(400).send({ error: "userId missing" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return reply.status(404).send({ error: "User not found" });

  const uploadDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

  // use a safe filename: userId + timestamp + originalName
  const safeFilename = `${userId}_${Date.now()}_${part.filename.replace(/\s+/g, "_")}`;
  const destPath = path.join(uploadDir, safeFilename);

  // write file
  await pump(part.file, fs.createWriteStream(destPath));

  // store only the filename in DB (not the full path)
  db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(safeFilename, userId);

  // return url too
  return { ok: true, avatar: safeFilename, url: `/api/uploads/${safeFilename}` };
});

// Récupérer avatar statique
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "uploads"),
  prefix: "/api/uploads/",
  decorateReply: false
});

// ------------------------------------------------------
//                   START SERVER
// ------------------------------------------------------
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    fastify.log.info("Backend listening on 3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();



// const Fastify = require("fastify");
// const fastify = Fastify({ logger: true });
// fastify.register(require("@fastify/cors"), { origin: true });
// fastify.register(require("@fastify/formbody"));

// const Database = require("better-sqlite3");
// const db = new Database("./data/database.sqlite");

// // Création de la table users si elle n'existe pas
// db.prepare(`
//   CREATE TABLE IF NOT EXISTS users (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name TEXT NOT NULL
//   )
// `).run();

// // --- Routes ---

// // Health check
// fastify.get("/api/health", async (req, reply) => {
//   return { status: "ok" };
// });

// // Start tournament
// let lastPlayers = [];
// fastify.post("/api/start-tournament", async (req, reply) => {
//   const { players } = req.body || {};
//   if (!Array.isArray(players) || players.length < 2) {
//     return reply.status(400).send({ error: "Invalid players array (min 2)" });
//   }
//   lastPlayers = players;
//   return { ok: true, players: lastPlayers };
// });

// // Get last players
// fastify.get("/api/players", async (req, reply) => {
//   return { players: lastPlayers };
// });

// // Ajouter un utilisateur
// fastify.get("/api/add-user", async (req, reply) => {
//   const { name } = req.body || {};
//   if (!name) {
//     return reply.status(400).send({ error: "Name is required" });
//   }
//   db.prepare("INSERT INTO users (name) VALUES (?)").run(name);
//   return { ok: true, name };
// });

// // Lister les utilisateurs
// fastify.get("/api/users", async (req, reply) => {
//   const users = db.prepare("SELECT * FROM users").all();
//   return users;
// });

// // Ajouter un utilisateur via URL
// fastify.get("/add/:name", async (req, reply) => {
//   const name = req.params.name;
//   db.prepare("INSERT INTO users (name) VALUES (?)").run(name);
//   return { ok: true, name };
// });

// // Lister tous les utilisateurs
// fastify.get("/users", async (req, reply) => {
//   const users = db.prepare("SELECT * FROM users").all();
//   return users;
// });

// // --- Start server ---
// const start = async () => {
//   try {
//     await fastify.listen({ port: 3000, host: "0.0.0.0" });
//     fastify.log.info("Backend listening on 3000");
//   } catch (err) {
//     fastify.log.error(err);
//     process.exit(1);
//   }
// };

// start();