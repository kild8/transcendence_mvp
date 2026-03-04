//Ce fichier orchestre les different call API tout au long du backend



const Fastify = require("fastify");
const fastify = Fastify({ logger: true });
const { initWebSocket, getOnlineUserIds } = require("./ws");
fastify.register(require("@fastify/cookie"));
fastify.register(require("@fastify/cors"), { origin: true });
fastify.register(require("@fastify/formbody"));
fastify.register(require("@fastify/multipart"), {
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});
// register auth plugin first so it can decorate fastify (authPreHandler)
fastify.register(require('./routes/auth.route.js'));
fastify.register(require("./routes/rooms.route.js"));
fastify.register(require("./routes/friends.route.js"));
fastify.register(require('./routes/user.route.js'));

const bcrypt = require('bcrypt');

const jwt = require("jsonwebtoken");

const db = require("./db_init");

const path = require("path");
const fs = require("fs");

const { pipeline } = require("stream");
const { promisify } = require("util");
const pump = promisify(pipeline);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_prod';
const FRONTEND_BASE = process.env.FRONTEND_BASE || 'http://localhost:8080';
const WS_SECRET = process.env.WS_SECRET || 'dev_ws_secret';
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

//AIKO
// Helper wrapper for sync better-sqlite3 queries used across handlers
function dbQueryWrap(query, mode = 'get', params = []) {
  try {
    const stmt = db.prepare(query);
    if (mode === 'get') return stmt.get(...(params || []));
    if (mode === 'all') return stmt.all(...(params || []));
    if (mode === 'run') return stmt.run(...(params || []));
    throw new Error(`Unsupported dbQueryWrap mode: ${mode}`);
  } catch (err) {
    // fastify might not be in scope when this module is required very early,
    // guard logging if available
    try { if (fastify && fastify.log) fastify.log.error({ err, query, params }, 'dbQueryWrap error'); } catch (e) {}
    throw err;
  }
}

    // ------------------------------------------------------
    //                      ROUTES API
    // ------------------------------------------------------
    
    // Health check
fastify.get("/api/health", async () => ({ status: "ok" }));

//Match history

fastify.post('/api/matches/ws', async (req, reply) => {
  const secret = req.headers['x-ws-secret'];

  if (secret !== WS_SECRET) {
    return reply.status(401).send({ error: 'Server.UNAUTHORIZED_WS' });
  }

  const {
    player1,
    player2,
    score_player1,
    score_player2
  } = req.body || {};

  if (!player1 || !player2) {
    return reply.status(400).send({ error: 'Server.INVALID_MATCH_DATA' });
  }

  const p1 = db.prepare('SELECT id FROM users WHERE name = ?').get(player1);
  const p2 = db.prepare('SELECT id FROM users WHERE name = ?').get(player2);

  if (!p1 || !p2) {
    return reply.status(404).send({ error: 'Server.USER_NOT_FOUND' });
  }

  const winner_id = score_player1 > score_player2 ? p1.id : p2.id;

  db.prepare(`
    INSERT INTO matches (
      player1_id,
      player2_id,
      score_player1,
      score_player2,
      winner_id
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      p1.id,
      p2.id,
      score_player1,
      score_player2,
      winner_id
    );

    return { ok: true };
});

// ------------------------------------------------------
//                   START SERVER
// ------------------------------------------------------
const start = async () => {
  try {
  await fastify.listen({ port: 3000, host: "0.0.0.0" });
  fastify.log.info("Backend listening on 3000");
  // pass fastify instance so ws can use fastify.inject to make internal requests
  initWebSocket(fastify);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
