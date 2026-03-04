const db = require('../db_init');
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pump = promisify(pipeline);

module.exports = async function usersRoutes(fastify, opts) {
  // ensure authPreHandler is available
  if (!fastify.authPreHandler) {
    const { authPreHandler } = require('../auth_utils');
    fastify.decorate('authPreHandler', authPreHandler);
  }

  // local wrapper for sync better-sqlite3 queries
  function dbQueryWrap(query, mode = 'get', params = []) {
    try {
      const stmt = db.prepare(query);
      if (mode === 'get') return stmt.get(...(params || []));
      if (mode === 'all') return stmt.all(...(params || []));
      if (mode === 'run') return stmt.run(...(params || []));
      throw new Error(`Unsupported dbQueryWrap mode: ${mode}`);
    } catch (err) {
      try { if (fastify && fastify.log) fastify.log.error({ err, query, params }, 'dbQueryWrap error'); } catch (e) {}
      throw err;
    }
  }


fastify.get("/api/user/:name", async (req, reply) => {
  const name = req.params.name;
  const user = db.prepare("SELECT * FROM users WHERE name = ?").get(name);
  if (!user)
    return { ok: false, error: "Server.USER_NOT_FOUND" };
  return { ok: true, user };
});

  // Update user (name / language)
  fastify.patch('/api/user/me', { preHandler: fastify.authPreHandler }, async (req, reply) => {
    req.log.debug('Route Healthy');
    try {
      const user = req.user;
      const { name, language } = req.body || {};

      if (name !== undefined) {
        if (!name || String(name).trim().length === 0) {
          req.log.debug('Name required');
          return reply.status(400).send({ ok: false, error: 'Name required' });
        }

	const nameStr = String(name).trim();
      const nameRe = /^[a-zA-Z0-9 ]{1,20}$/;

      if (!nameStr || !nameRe.test(nameStr)) {
        return reply.status(400).send({ ok: false, error: 'Server.INVALID_NAME' });
      }

        const existing = dbQueryWrap('SELECT id FROM users WHERE name = ? AND id != ?', 'get', [name, user.id]);
        if (existing) {
          return reply.status(400).send({ ok: false, error: "Server.NAME_ALREADY_IN_USE" });
        }
        dbQueryWrap('UPDATE users SET name = ? WHERE id = ?', 'run', [name, user.id]);
      }

      if (language !== undefined) {
        const allowed = ['en', 'fr', 'de'];
        if (!allowed.includes(language)) {
          return reply.status(400).send({ ok: false, error: "Profile.LANG_SAVE_ERROR" });
        }
        dbQueryWrap('UPDATE users SET language = ? WHERE id = ?', 'run', [language, user.id]);
      }

      const updated = dbQueryWrap('SELECT id, name, email, avatar, language, created_at FROM users WHERE id = ?', 'get', [user.id]);
      return reply.send({ ok: true, user: updated });
    } catch (err) {
      return reply.status(500).send({ ok: false, error: "Server.SERVER_ERROR" });
    }
  });

  // Upload avatar (multipart)
  fastify.post('/api/upload-avatar', { preHandler: fastify.authPreHandler }, async (req, reply) => {
    try {
      const userId = req.user.id;
      const parts = req.parts();
      let filePart = null;
      const tmpName = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const tmpPath = path.join(__dirname, '..', 'uploads', tmpName);

      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'avatar') {
          filePart = part;
          await pump(part.file, fs.createWriteStream(tmpPath));
        }
      }

      if (!filePart) {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        return reply.status(400).send({ ok: false, error: 'Server.AVATAR_MISSING' });
      }

      const user = db.prepare('SELECT avatar FROM users WHERE id = ?').get(userId);
      if (!user) {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        return reply.status(404).send({ ok: false, error: 'Server.USER_NOT_FOUND' });
      }

      const safeFilename = `${userId}_${Date.now()}_${filePart.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const finalPath = path.join(__dirname, '..', 'uploads', safeFilename);
      fs.renameSync(tmpPath, finalPath);

      if (user.avatar) {
        try {
          const oldPath = path.join(__dirname, '..', 'uploads', user.avatar);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (e) { fastify.log.warn({ err: e }, 'failed to remove old avatar'); }
      }

      db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(safeFilename, userId);

      return reply.send({ ok: true, avatar: safeFilename, url: `/api/uploads/${safeFilename}` });
    } catch (err) {
      fastify.log.error({ err }, 'upload-avatar failed');
      return reply.status(500).send({ ok: false, error: 'Server.UPLOAD_ERROR' });
    }
  });

  // Serve uploads statically
  fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, '..', 'uploads'),
    prefix: '/api/uploads/',
    decorateReply: false
  });

  // Get matches for current user
  fastify.get('/api/matches/me', { preHandler: fastify.authPreHandler }, async (req, reply) => {
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
  });
};
