const Fastify = require("fastify");
const fastify = Fastify({ logger: true });

fastify.register(require("@fastify/cors"), { origin: true });
fastify.register(require("@fastify/formbody"));
fastify.register(require("@fastify/multipart"), {
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

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

// Upload avatar (robuste)
fastify.post("/api/upload-avatar", async (req, reply) => {
  try {
    const parts = req.parts();

    let filePart = null;
    let userId = null;

    // write file to a temporary path first (so on error we don't leave a partially named file)
    const tmpName = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tmpPath = path.join(uploadsDir, tmpName);

    // iterate parts and handle field/file
    for await (const part of parts) {
      if (part.type === "field") {
        if (part.fieldname === "userId") userId = part.value;
        continue;
      }
      if (part.type === "file" && part.fieldname === "avatar") {
        filePart = part;
        // stream file to temporary path
        await pump(filePart.file, fs.createWriteStream(tmpPath));
        // do NOT break; keep iterating to consume rest of parts (important)
      }
    }

    if (!filePart) {
      // cleanup tmp if exists
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      return reply.status(400).send({ ok: false, error: "Avatar manquant" });
    }
    if (!userId) {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      return reply.status(400).send({ ok: false, error: "userId manquant" });
    }

    // validate user
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user) {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      return reply.status(404).send({ ok: false, error: "User not found" });
    }

    // create safe final filename and move tmp -> final
    const safeFilename = `${userId}_${Date.now()}_${filePart.filename.replace(/\s+/g, "_")}`;
    const finalPath = path.join(uploadsDir, safeFilename);

    // rename (atomic where possible)
    fs.renameSync(tmpPath, finalPath);

    // (optional) remove previous avatar file if exists and is not default
    if (user.avatar) {
      try {
        const old = path.join(uploadsDir, String(user.avatar));
        if (fs.existsSync(old)) fs.unlinkSync(old);
      } catch (e) {
        // ignore
        fastify.log.warn({ err: e }, "failed to remove old avatar");
      }
    }

    // update DB with only the filename
    db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(safeFilename, userId);

    // respond with URL that nginx proxies: /api/uploads/...
    return reply.send({
      ok: true,
      avatar: safeFilename,
      url: `/api/uploads/${safeFilename}`
    });

  } catch (err) {
    fastify.log.error({ err }, "upload-avatar failed");
    return reply.status(500).send({ ok: false, error: "Erreur serveur lors de l'upload" });
  }
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
