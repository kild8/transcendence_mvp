const Database = require('better-sqlite3');
const db = new Database('./data/database.sqlite');
const jwt = require('jsonwebtoken');

module.exports = async function friendsRoutes(fastify, opts) {
  // getOnlineUserIds is exported from ws.js and attached to server via require cycle
  const { getOnlineUserIds } = require('../ws');

  // Envoyer une demande d'ami
  fastify.post('/api/friends/request', { preHandler: fastify.authPreHandler || opts.authPreHandler }, async (req, reply) => {
    try {
      const userId = req.user.id;
      const { friend_id } = req.body || {};
      const friendId = Number(friend_id);
      if (!friend_id || Number.isNaN(friendId) || friendId === userId) {
        return reply.status(400).send({ ok: false, error: 'Invalid friend_id' });
      }

      const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(friendId);
      if (!userExists) return reply.status(404).send({ ok: false, error: 'User not found' });

      // check existing in either direction
      const existing = db.prepare(`
        SELECT * FROM friends
        WHERE (requester_id = ? AND addressee_id = ?)
           OR (requester_id = ? AND addressee_id = ?)
      `).get(userId, friendId, friendId, userId);

      if (existing) {
        if (existing.status === 'pending') return reply.status(400).send({ ok: false, error: 'Request already pending' });
        if (existing.status === 'accepted') return reply.status(400).send({ ok: false, error: 'Already friends' });
        // if rejected, update to pending
        db.prepare('UPDATE friends SET requester_id = ?, addressee_id = ?, status = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(userId, friendId, 'pending', existing.id);
        return reply.send({ ok: true });
      }

      // check inverse pending -> auto-accept
      const inverse = db.prepare('SELECT * FROM friends WHERE requester_id = ? AND addressee_id = ?').get(friendId, userId);
      if (inverse && inverse.status === 'pending') {
        db.prepare('UPDATE friends SET status = ? WHERE id = ?').run('accepted', inverse.id);
        return reply.send({ ok: true, autoAccepted: true });
      }

      db.prepare('INSERT INTO friends (requester_id, addressee_id, status) VALUES (?, ?, ?)').run(userId, friendId, 'pending');
      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error(err, 'friend request failed');
      return reply.status(500).send({ ok: false, error: 'Server error' });
    }
  });

  // Lister demandes entrantes
  fastify.get('/api/friends/requests', { preHandler: fastify.authPreHandler || opts.authPreHandler }, async (req, reply) => {
    const userId = req.user.id;
    const rows = db.prepare(`
      SELECT f.id, f.requester_id, u.name AS requester_name, u.email AS requester_email, f.created_at
      FROM friends f JOIN users u ON u.id = f.requester_id
      WHERE f.addressee_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `).all(userId);
    return { ok: true, requests: rows };
  });

  // Repondre a une demande (accept / reject)
  fastify.post('/api/friends/respond', { preHandler: fastify.authPreHandler || opts.authPreHandler }, async (req, reply) => {
    try {
      const userId = req.user.id;
      const { request_id, action } = req.body || {};
      if (!request_id || !['accept', 'reject'].includes(action)) return reply.status(400).send({ ok: false, error: 'Invalid input' });

      const row = db.prepare('SELECT * FROM friends WHERE id = ? AND addressee_id = ?').get(request_id, userId);
      if (!row) return reply.status(404).send({ ok: false, error: 'Request not found' });

      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      db.prepare('UPDATE friends SET status = ? WHERE id = ?').run(newStatus, request_id);

      // optional: notify requester via websocket presence
      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error(err, 'respond friend failed');
      return reply.status(500).send({ ok: false, error: 'Server error' });
    }
  });

  // Supprimer un ami
  fastify.post('/api/friends/remove', { preHandler: fastify.authPreHandler || opts.authPreHandler }, async (req, reply) => {
    try {
      const userId = req.user.id;
      const { friend_id } = req.body || {};
      const friendId = Number(friend_id);
      if (!friend_id) return reply.status(400).send({ ok: false, error: 'friend_id required' });

      db.prepare(`
        DELETE FROM friends
        WHERE (requester_id = ? AND addressee_id = ?)
           OR (requester_id = ? AND addressee_id = ?)
      `).run(userId, friendId, friendId, userId);

      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error(err, 'remove friend failed');
      return reply.status(500).send({ ok: false, error: 'Server error' });
    }
  });

  // Lister amis acceptés (avec online flag)
  fastify.get('/api/friends', { preHandler: fastify.authPreHandler || opts.authPreHandler }, async (req, reply) => {
    try {
      const userId = req.user.id;
      const rows = db.prepare(`
        SELECT u.id, u.name, u.email, u.avatar, f.created_at
        FROM friends f
        JOIN users u ON ( (f.requester_id = ? AND f.addressee_id = u.id) OR (f.addressee_id = ? AND f.requester_id = u.id) )
        WHERE f.status = 'accepted'
      `).all(userId, userId);

      const onlineIds = new Set(getOnlineUserIds());
      const enriched = rows.map(r => ({ ...r, online: onlineIds.has(r.id) }));
      return reply.send({ ok: true, friends: enriched });
    } catch (err) {
      fastify.log.error(err, 'list friends failed');
      return reply.status(500).send({ ok: false, error: 'Server error' });
    }
  });
};
