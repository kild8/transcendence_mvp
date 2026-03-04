// This file describes setup and execution of the websockets and delegates
// grouped logic to modules to improve visibility and maintainability.

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { setFastifyInstance, setWss } = require('./ws_modules/ws_config');
const handlers = require('./ws_modules/handlers');
const {playersConnected} = require("./metrics.js");

const JWT_SECRET = process.env.JWT_SECRET;


// presence tracking: Map<userId, countOfConnections>
const presenceCounts = new Map();

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').map(s => s.trim()).reduce((acc, kv) => {
    const [k, ...rest] = kv.split('=');
    acc[k] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function getOnlineUserIds() {
  return Array.from(presenceCounts.keys()).map(k => Number(k));
}

function initWebSocket(serverOrFastify) {
  // support being passed either the fastify instance or the raw http.Server
  let wss;
  if (serverOrFastify && typeof serverOrFastify.inject === 'function') {
    setFastifyInstance(serverOrFastify);
    wss = new WebSocket.Server({ server: serverOrFastify.server });
  } else {
    wss = new WebSocket.Server({ server: serverOrFastify });
  }
  setWss(wss);
  console.log('WebSocket server initialized');

  wss.on('connection', (ws, req) => {
    console.log('a player has connected');
    // try to identify user from cookie JWT for presence
    try {
      const cookies = parseCookies(req.headers.cookie || '');
      const token = cookies.token;
      if (token) {
        const payload = jwt.verify(token, JWT_SECRET);
        const userId = Number(payload.id);
        ws._userId = userId;
        const prev = presenceCounts.get(userId) || 0;
        presenceCounts.set(userId, prev + 1);
		playersConnected.inc();
        const pmsg = JSON.stringify({ type: 'presence', userId, online: true });
        if (wss && wss.clients) {
          wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(pmsg); });
        }
      }
    } catch (e) {
      // invalid token => ignore presence for this ws
    }

    handlers.broadcastRoomUpdate();
    ws.socketRole = 'default';

    ws.on('message', (msg) => {
      let data;
      try { data = JSON.parse(msg.toString()); } catch { return; }

      if (data.type === 'register-socket') { ws.socketRole = data.role; return; }
      if (data.type === 'join-room') { handlers.handleJoinRoom(ws, data); return; }
      if (data.type === 'start-game') { handlers.handleStartGame(ws, data); return; }
      if (data.type === 'start-tournament-round') { handlers.handleStartTournamentRound(ws, data); return; }
      if (data.type === 'input' || data.type === 'input-up') { handlers.handlePlayerInput(ws, data); return; }
    });

    ws.on('close', () => {
      // handle presence decrement
      try {
        const userId = ws._userId;
        if (userId) {
          const prev = presenceCounts.get(userId) || 0;
		  playersConnected.dec();
          if (prev <= 1) {
            presenceCounts.delete(userId);
            const pmsg = JSON.stringify({ type: 'presence', userId, online: false });
            if (wss && wss.clients) {
              wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(pmsg); });
            }
          } else {
            presenceCounts.set(userId, prev - 1);
          }
        }
      } catch (e) {}
      handlers.handleDisconnect(ws);
    });
  });

  return wss;
}

module.exports = { initWebSocket, getOnlineUserIds };