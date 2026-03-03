const db = require('./db_init');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_prod';

async function getUserFromReq(req) {
  try {
    const token = req.cookies?.token || (
      req.headers.authorization ? req.headers.authorization.split(' ')[1] : null
    );
    if (!token) return null;
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(
      `SELECT id, name, email, avatar, language, created_at FROM users WHERE id = ?`
    ).get(payload.id);
    if (!user) return null;
    return user;
  } catch (err) {
    return null;
  }
}

async function authPreHandler(req, reply) {
  const user = await getUserFromReq(req);
  if (!user) return reply.status(401).send({ ok: false, error: 'Server.UNAUTHORIZED' });
  req.user = user;
}

module.exports = { getUserFromReq, authPreHandler };
