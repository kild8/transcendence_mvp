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
fastify.register(require("./routes/rooms.route.js"));
fastify.register(require("./routes/friends.route.js"));

const bcrypt = require('bcrypt');

const jwt = require("jsonwebtoken");

const Database = require("better-sqlite3");
const db = new Database("./data/database.sqlite");

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

// Création de la table users
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,         -- NULL for Google OAuth
    avatar TEXT,
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


    // ------------------------------------------------------
    //                      ROUTES API
    // ------------------------------------------------------
    
    // Health check
fastify.get("/api/health", async () => ({ status: "ok" }));

// Helper: extrait et vérifie le token, retourne l'utilisateur (sans password_hash) ou null
async function getUserFromReq(req) {
  try {
    // token from cookie OR Authorization header
    const token = req.cookies?.token || (
      req.headers.authorization ? req.headers.authorization.split(' ')[1] : null
    );
    if (!token) return null;

    // verify (throws si invalide/expiré)
    const payload = jwt.verify(token, JWT_SECRET);

    // récupère l'utilisateur sans le password_hash (sécurité)
    const user = db.prepare(
      `SELECT id, name, email, avatar, created_at
       FROM users WHERE id = ?`
    ).get(payload.id);

    if (!user) return null;
    return user;
  } catch (err) {
    // token invalide/expiré ou autre erreur
    return null;
  }
}

// PreHandler pour protéger routes Fastify
async function authPreHandler(req, reply) {
  const user = await getUserFromReq(req);
  if (!user) {
    return reply.status(401).send({ ok: false, error: 'Unauthorized' });
  }
  // attache user à la requête pour l'utiliser dans le handler
  req.user = user;
}

// expose as decoration so route modules can use it via fastify.authPreHandler
fastify.decorate('authPreHandler', authPreHandler);

// Register (email + password + pseudo)
fastify.post('/api/auth/register', async (req, reply) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return reply.status(400).send({ ok: false, error: 'name, email and password are required' });
    }

    // basic email format validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(String(email).toLowerCase())) {
      return reply.status(400).send({ ok: false, error: 'Invalid email format' });
    }

    if (String(password).length < 8) {
      return reply.status(400).send({ ok: false, error: 'Password must be at least 8 characters' });
    }

    // unique constraints (name/email)
    const existing = db.prepare('SELECT * FROM users WHERE email = ? OR name = ?').get(email, name);
    if (existing) {
      if (existing.email === email) return reply.status(400).send({ ok: false, error: 'Email already in use' });
      return reply.status(400).send({ ok: false, error: 'Name already in use' });
    }

    // hash password
    const hash = await bcrypt.hash(password, 10); // 10 rounds

    // insert
    const info = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, hash);
    const user = db.prepare('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);

    // issue JWT and set HttpOnly cookie
    const payload = { id: user.id, name: user.name, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    reply.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
    return reply.send({ ok: true, user });
  } catch (err) {
    fastify.log.error({ err }, 'register failed');
    return reply.status(500).send({ ok: false, error: 'Server error' });
  }
});

// Login (email or name + password)
fastify.post('/api/auth/login', async (req, reply) => {
  try {
    const { identifier, password } = req.body || {}; // identifier = email OR name

    if (!identifier || !password) {
      return reply.status(400).send({ ok: false, error: 'identifier and password are required' });
    }

    let user = null;
    if (identifier.includes('@')) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(identifier);
    } else {
      user = db.prepare('SELECT * FROM users WHERE name = ?').get(identifier);
    }

    if (!user || !user.password_hash) {
      // user not found or has no local password (e.g., registered via Google)
      return reply.status(401).send({ ok: false, error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return reply.status(401).send({ ok: false, error: 'Invalid credentials' });

    const publicUser = db.prepare('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?').get(user.id);
    const payload = { id: publicUser.id, name: publicUser.name, email: publicUser.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    reply.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
    return reply.send({ ok: true, user: publicUser });
  } catch (err) {
    fastify.log.error({ err }, 'login failed');
    return reply.status(500).send({ ok: false, error: 'Server error' });
  }
});


//route for Google
fastify.get('/api/auth/google', async (req, reply) => {
	const redirectUri = `${FRONTEND_BASE}/api/auth/google/callback`;
	const scope = encodeURIComponent('openid email profile');
	const authUrl = `https://accounts.google.com/o/oauth2/v2/auth`
	+ `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}`
	+ `&redirect_uri=${encodeURIComponent(redirectUri)}`
	+ `&response_type=code`
	+ `&scope=${scope}`
	+ `&access_type=offline`
	+ `&prompt=select_account`;
	return reply.redirect(authUrl);
});
    
// Callback Google
fastify.get('/api/auth/google/callback', async (req, reply) => {
	try {
    	const code = req.query.code;
		if (!code) return reply.redirect(`${FRONTEND_BASE}/#login?error=no_code`);

		const redirectUri = `${FRONTEND_BASE}/api/auth/google/callback`;

		// échange le code contre tokens
		const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: GOOGLE_CLIENT_ID,
			client_secret: GOOGLE_CLIENT_SECRET,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code'
		  })
    	});
		const tokenJson = await tokenRes.json();
		if (!tokenJson.access_token) {
			fastify.log.warn({ tokenJson }, 'no access_token');
			return reply.redirect(`${FRONTEND_BASE}/#login?error=token`);
		}

		// récupérer les infos utilisateur
		const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
		headers: { Authorization: `Bearer ${tokenJson.access_token}` }
		});
		const profile = await profileRes.json();
		const email = profile.email;
		const name = profile.name || (profile.email ? profile.email.split('@')[0] : 'Unknown');

		// upsert user en base (par email)
		let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
		if (!user) {
			db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(name, email);
			user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    	} else {
      		if (user.name !== name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, user.id);
		}
		// créer JWT
		const payload = { id: user.id, name: user.name, email: user.email };
		const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

		// mettre cookie HttpOnly (ne pas exposer au JS)
		// en production ajouter "Secure; Domain=..." si besoin
		reply.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
		return reply.redirect(`${FRONTEND_BASE}/#home`);
	} catch (err) {
		fastify.log.error({ err }, 'google callback failed');
		return reply.redirect(`${FRONTEND_BASE}/#login?error=server`);
	}
});

// route for the front to know if user is log
fastify.get('/api/me', async (req, reply) => {
  const user = await getUserFromReq(req);
  if (!user) return { ok: false };
  return { ok: true, user };
});


// for logout
fastify.post('/api/auth/logout', async (req, reply) => {
  reply.header('Set-Cookie', `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
  return { ok: true };
});

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

// PUT /api/user/me  -> change the authenticated user's name
fastify.put('/api/user/me', { preHandler: authPreHandler }, async (req, reply) => {
  try {
    const user = req.user; // authPreHandler attache user public (id, name, email...)
    const { name } = req.body || {};
    if (!name || String(name).trim().length === 0) return reply.status(400).send({ ok: false, error: 'Name required' });

    // check uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE name = ? AND id != ?').get(name, user.id);
    if (existing) return reply.status(400).send({ ok: false, error: 'Name already in use' });

    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, user.id);

    // respond with updated public user
    const updated = db.prepare('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?').get(user.id);
    return reply.send({ ok: true, user: updated });
  } catch (err) {
    fastify.log.error(err, 'update user failed');
    return reply.status(500).send({ ok: false, error: 'Server error' });
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

// Upload avatar (SÉCURISÉ – JWT only)
fastify.post("/api/upload-avatar",
{ preHandler: authPreHandler },
  async (req, reply) => {
    try {
      const userId = req.user.id; // 🔐 vient du JWT, PAS du client
      const parts = req.parts();

      let filePart = null;

      // temporary file
      const tmpName = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const tmpPath = path.join(uploadsDir, tmpName);

      // iterate multipart parts
      for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "avatar") {
          filePart = part;
          await pump(part.file, fs.createWriteStream(tmpPath));
        }
        // on ignore tous les autres fields
      }

      if (!filePart) {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        return reply.status(400).send({ ok: false, error: "Avatar manquant" });
      }

      // récupérer l'utilisateur depuis la DB (sécurité)
      const user = db.prepare(
        "SELECT avatar FROM users WHERE id = ?"
      ).get(userId);

      if (!user) {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        return reply.status(404).send({ ok: false, error: "User not found" });
      }

      // filename final sécurisé
      const safeFilename = `${userId}_${Date.now()}_${filePart.filename.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      )}`;
      const finalPath = path.join(uploadsDir, safeFilename);

      // move tmp → final
      fs.renameSync(tmpPath, finalPath);

      // supprimer ancien avatar si existant
      if (user.avatar) {
        try {
          const oldPath = path.join(uploadsDir, user.avatar);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (e) {
          fastify.log.warn({ err: e }, "failed to remove old avatar");
        }
      }

      // update DB
      db.prepare(
        "UPDATE users SET avatar = ? WHERE id = ?"
      ).run(safeFilename, userId);

      return reply.send({
        ok: true,
        avatar: safeFilename,
        url: `/api/uploads/${safeFilename}`
      });
    } catch (err) {
      fastify.log.error({ err }, "upload-avatar failed");
      return reply.status(500).send({
        ok: false,
        error: "Erreur serveur lors de l'upload"
      });
    }
  }
);

// Récupérer avatar statique
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "uploads"),
  prefix: "/api/uploads/",
  decorateReply: false
});


// ----------- MATCH-HISTORY -----------
fastify.post('/api/matches',{ preHandler: authPreHandler },
  async (req, reply) => {
    const {
      player1_id,
      player2_id,
      score_player1,
      score_player2
    } = req.body || {};

    if (!player1_id || !player2_id) {
      return reply.status(400).send({ error: 'Invalid match data' });
    }

    const winner_id =
      score_player1 > score_player2 ? player1_id : player2_id;

    db.prepare(`
      INSERT INTO matches (
        player1_id,
        player2_id,
        score_player1,
        score_player2,
        winner_id
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      player1_id,
      player2_id,
      score_player1,
      score_player2,
      winner_id
    );

    return { ok: true };
  }
);


fastify.get('/api/matches/me',{ preHandler: authPreHandler },
  async (req, reply) => {
    const userId = req.user.id;

    const matches = db.prepare(`
      SELECT
        m.id,
        m.score_player1,
        m.score_player2,
        m.created_at,
        u1.name AS player1_name,
        u2.name AS player2_name,
        uw.name AS winner_name
      FROM matches m
      JOIN users u1 ON u1.id = m.player1_id
      JOIN users u2 ON u2.id = m.player2_id
      JOIN users uw ON uw.id = m.winner_id
      WHERE m.player1_id = ? OR m.player2_id = ?
      ORDER BY m.created_at DESC
    `).all(userId, userId);

    return { ok: true, matches };
  }
);

fastify.post('/api/matches/ws', async (req, reply) => {
  const secret = req.headers['x-ws-secret'];

  if (secret !== WS_SECRET) {
    return reply.status(401).send({ error: 'Unauthorized WS' });
  }

  const {
    player1,
    player2,
    score_player1,
    score_player2
  } = req.body || {};

  if (!player1 || !player2) {
    return reply.status(400).send({ error: 'Invalid match data' });
  }

  const p1 = db.prepare('SELECT id FROM users WHERE name = ?').get(player1);
  const p2 = db.prepare('SELECT id FROM users WHERE name = ?').get(player2);

  if (!p1 || !p2) {
    return reply.status(404).send({ error: 'User not found' });
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
    initWebSocket(fastify.server);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
