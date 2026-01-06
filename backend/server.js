const Fastify = require("fastify");
const fastify = Fastify({ logger: true });
const { initWebSocket } = require("./ws");
fastify.register(require("@fastify/cookie"));
fastify.register(require("@fastify/cors"), { origin: true });
fastify.register(require("@fastify/formbody"));
fastify.register(require("@fastify/multipart"), {
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

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
    
    ///WEBSOCKETS
    const wss = initWebSocket(fastify.server);
    fastify.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
      console.log(`Server listening on ${address}`);
    });

    // ------------------------------------------------------
    //                      ROUTES API
    // ------------------------------------------------------
    
    // Health check
fastify.get("/api/health", async () => ({ status: "ok" }));

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
  try {
    const token = req.cookies?.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    if (!token) return { ok: false };

    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
    if (!user) return { ok: false };
    return { ok: true, user };
  } catch (err) {
    return { ok: false };
  }
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
