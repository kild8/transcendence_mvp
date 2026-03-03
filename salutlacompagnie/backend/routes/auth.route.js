const db = require('../db_init');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUserFromReq } = require('../auth_utils');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_prod';

const FRONTEND_BASE = process.env.FRONTEND_BASE || 'http://localhost:8080';

module.exports = async function authRoutes(fastify, opts) {
  if (!fastify.authPreHandler) {
    const { authPreHandler } = require('../auth_utils');
    fastify.decorate('authPreHandler', authPreHandler);
  }

  // Register (email + password + pseudo)
  fastify.post('/api/auth/register', async (req, reply) => {
    try {
      // debug: log incoming body to help diagnose client issues (content-type / payload)
      fastify.log.info({ body: req.body }, 'auth.register attempt');
      const { name, email, password } = req.body || {};

      if (!name || !email || !password) {
        const missing = [];
        if (!name) missing.push('name');
        if (!email) missing.push('email');
        if (!password) missing.push('password');
        return reply.status(400).send({ ok: false, error: 'Server.NAME_EMAIL_PASSWORD_REQUIRED', missing });
      }

      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(String(email).toLowerCase())) {
        return reply.status(400).send({ ok: false, error: 'Server.INVALID_EMAIL_FORMAT' });
      }

      if (String(password).length < 8) {
        return reply.status(400).send({ ok: false, error: 'Server.PASSWORD_TOO_SHORT' });
      }

      const existing = db.prepare('SELECT * FROM users WHERE email = ? OR name = ?').get(email, name);
      fastify.log.info({ existing }, 'existing user check');
      if (existing) {
        if (existing.email === email) return reply.status(400).send({ ok: false, error: 'Server.EMAIL_ALREADY_IN_USE' });
        return reply.status(400).send({ ok: false, error: 'Server.NAME_ALREADY_IN_USE' });
      }

  const hash = await bcrypt.hash(password, 10);
  const info = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, hash);
  fastify.log.info({ info }, 'insert result');
  const user = db.prepare('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);

      const payload = { id: user.id, email: user.email };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      reply.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
      return reply.send({ ok: true, user });
    } catch (err) {
      fastify.log.error({ err }, 'register failed');
      return reply.status(500).send({ ok: false, error: 'Server.SERVER_ERROR' });
    }
  });

  // Login (email or name + password)
  fastify.post('/api/auth/login', async (req, reply) => {
    try {
      const { identifier, password } = req.body || {};
      if (!identifier || !password) {
        return reply.status(400).send({ ok: false, error: 'Server.IDENTIFIER_PASSWORD_REQUIRED' });
      }

      let user = null;
      if (String(identifier).includes('@')) {
        user = db.prepare('SELECT * FROM users WHERE email = ?').get(identifier);
      } else {
        user = db.prepare('SELECT * FROM users WHERE name = ?').get(identifier);
      }

      if (!user || !user.password_hash) {
        return reply.status(401).send({ ok: false, error: 'Server.INVALID_CREDENTIALS' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return reply.status(401).send({ ok: false, error: 'Server.INVALID_CREDENTIALS' });

      const publicUser = db.prepare('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?').get(user.id);
      const payload = { id: publicUser.id, email: publicUser.email };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      reply.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
      return reply.send({ ok: true, user: publicUser });
    } catch (err) {
      fastify.log.error({ err }, 'login failed');
      return reply.status(500).send({ ok: false, error: 'Server.SERVER_ERROR' });
    }
  });

  // route for Google (redirect to consent)
  fastify.get('/api/auth/google', async (req, reply) => {
    const redirectUri = `${FRONTEND_BASE}/api/auth/google/callback`;
    const scope = encodeURIComponent('openid email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth`
      + `&redirect_uri=${encodeURIComponent(redirectUri)}`
      + `&response_type=code`
      + `&scope=${scope}`
      + `&access_type=offline`
      + `&prompt=select_account`;
    return reply.redirect(authUrl);
  });

fastify.get('/api/auth/google/callback', async (req, reply) => {
  const code = req.query.code;
  if (!code) return reply.redirect(`${FRONTEND_BASE}/#login?error=no_code`);

  const redirectUri = `${FRONTEND_BASE}/api/auth/google/callback`;

  // 1️⃣ Obtenir le token d'accès
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    fastify.log.warn({ tokenJson }, 'no access_token');
    return reply.redirect(`${FRONTEND_BASE}/#login?error=token`);
  }

  // 2️⃣ Obtenir le profil de l'utilisateur
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` }
  });
  const profile = await profileRes.json();
  const email = profile.email;
  const name = profile.name || (profile.email ? profile.email.split('@')[0] : 'Unknown');

  // 3️⃣ Vérifier si l'utilisateur existe déjà
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    // 🔹 Vérifier si le name existe déjà dans la DB
    const existingName = db.prepare('SELECT * FROM users WHERE name = ?').get(name);
    if (existingName) {
      // Si le pseudo existe, on envoie une réponse claire
      return reply.redirect(`${FRONTEND_BASE}/#login?error=name_taken`);
    }

    // 🔹 Créer le nouvel utilisateur
    try {
      db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(name, email);
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    } catch (err) {
      fastify.log.error({ err }, 'failed to create user');
      return reply.redirect(`${FRONTEND_BASE}/#login?error=server`);
    }
  } else {
    // 🔹 Si l'utilisateur existe mais que le nom a changé, mettre à jour
    if (user.name !== name) {
      try {
        db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, user.id);
        user.name = name; // mettre à jour l'objet user
      } catch (err) {
        fastify.log.error({ err }, 'failed to update name');
        return reply.redirect(`${FRONTEND_BASE}/#login?error=server`);
      }
    }
  }

  // 4️⃣ Créer le JWT avec id + email
  const payload = { id: user.id, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  reply.header(
    'Set-Cookie',
    `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
  );

  return reply.redirect(`${FRONTEND_BASE}/#home`);
});

  // route for the front to know if user is log
  fastify.get('/api/me', async (req, reply) => {
    const user = await getUserFromReq(req);
    if (!user) return { ok: false };
    return { ok: true, user };
  });

  // logout
  fastify.post('/api/auth/logout', async (req, reply) => {
    reply.header('Set-Cookie', `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
    return { ok: true };
  });
};
