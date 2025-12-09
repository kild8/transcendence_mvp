const Fastify = require("fastify");
const fastify = Fastify({ logger: true });
fastify.register(require("@fastify/cors"), { origin: true });
fastify.register(require("@fastify/formbody"));

const Database = require("better-sqlite3");
const db = new Database("./data/database.sqlite");

// Création de la table users si elle n'existe pas
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`).run();

// --- Routes ---

// Health check
fastify.get("/api/health", async (req, reply) => {
  return { status: "ok" };
});

// Start tournament
let lastPlayers = [];
fastify.post("/api/start-tournament", async (req, reply) => {
  const { players } = req.body || {};
  if (!Array.isArray(players) || players.length < 2) {
    return reply.status(400).send({ error: "Invalid players array (min 2)" });
  }
  lastPlayers = players;
  return { ok: true, players: lastPlayers };
});

// Get last players
fastify.get("/api/players", async (req, reply) => {
  return { players: lastPlayers };
});

// Ajouter un utilisateur
fastify.get("/api/add-user", async (req, reply) => {
  const { name } = req.body || {};
  if (!name) {
    return reply.status(400).send({ error: "Name is required" });
  }
  db.prepare("INSERT INTO users (name) VALUES (?)").run(name);
  return { ok: true, name };
});

// Lister les utilisateurs
fastify.get("/api/users", async (req, reply) => {
  const users = db.prepare("SELECT * FROM users").all();
  return users;
});

// Ajouter un utilisateur via URL
fastify.get("/add/:name", async (req, reply) => {
  const name = req.params.name;
  db.prepare("INSERT INTO users (name) VALUES (?)").run(name);
  return { ok: true, name };
});

// Lister tous les utilisateurs
fastify.get("/users", async (req, reply) => {
  const users = db.prepare("SELECT * FROM users").all();
  return users;
});

// --- Start server ---
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