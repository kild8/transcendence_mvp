const { deleteRoom, rooms, removeUserFromRoom, ROOM_STATE } = require('../roomStore');
const { generateMatches, getNextMatch, recordMatchWinner } = require('../tournament.js');
const { resetRoomBall, step } = require('./physics');
const { getFastifyInstance } = require('./ws_config');
const { broadcastRoomUpdate } = require('./roomUtils');
const TICK_MS = 1000 / 60; // default tick, physics.step uses TICK_RATE conceptually

function start1v1Match(room) {
  if (room.participants.length < 2) return;

  room.state = ROOM_STATE.COUNTDOWN;
  const [player1, player2] = room.participants;

  room.players.player1 = player1;
  room.players.player2 = player2;

  room.paddles = {
    player1: { position: { x: 50, y: 200}, width: 10, height: 100, speed: 9, score: 0 },
    player2: { position: { x : 740, y: 200 }, width: 10, height: 100, speed: 9, score: 0}
  };
  room.lastInputs = { player1: null, player2: null };
  room.ball = { position: { x: 400, y: 240 }, velocity: { x: 5, y: 3}, size: 10, initialVelocity: { x: 5, y: 3 } };
  room.obstacles = {
    top: { position: { x: 400, y: 0 }, size: 20, pointingUp: false },
    bottom: { position: { x: 400, y: 480 - 20 }, size: 20, pointingUp: true }
  };

  [player1, player2].forEach(p => {
    if (p.ws.readyState === 1) {
      const role = p === player1 ? 'player1' : 'player2';
      p.ws.send(JSON.stringify({ type: 'start-game', roomId: room.id, role, player1: room.players.player1.pseudo, player2: room.players.player2.pseudo }));
    }
  });
  room.countdownSeconds = 10;
  room.countdownStart = Date.now();
  room.prevStateBeforeDisconnect = null;
  room.remainingCountdown = null;
  room.disconnectedPlayer = null;
  startGameLoop(room);
}

function startGameLoop(room) {
  if (room.tickId) return;
  room.tickId = setInterval(async () => {
    // paused/waiting/game over behaviour
    if ([ROOM_STATE.WAITING, ROOM_STATE.GAME_OVER, ROOM_STATE.PAUSED].includes(room.state)) {
      ['player1', 'player2'].forEach(role => {
        const p = room.players[role];
        if (p?.ws?.readyState === 1) {
          p.ws.send(JSON.stringify({
            type: 'state',
            countdown: room.state === ROOM_STATE.COUNTDOWN ? Math.max(0, room.remainingCountdown ?? room.countdownSeconds) : 0,
            state: { ball: room.ball, paddles: room.paddles, scores: { player1: room.paddles.player1.score, player2: room.paddles.player2.score } },
            message: room.state === ROOM_STATE.PAUSED && room.disconnectedPlayer ? { key: 'WS.PLAYER_DISCONNECTED_WAITING', params:{ pseudo: room.disconnectedPlayer.pseudo } } : undefined
          }));
        }
      });
      return;
    }

    // countdown
    if (room.state === ROOM_STATE.COUNTDOWN) {
      const elapsed = (Date.now() - (room.countdownStart || Date.now())) / 1000;
      const remaining = Math.max(0, room.countdownSeconds - Math.floor(elapsed));
      room.remainingCountdown = remaining;

      if (remaining <= 0) {
        room.state = ROOM_STATE.PLAYING;
        room.remainingCountdown = null;
      }

      ['player1', 'player2'].forEach(role => {
        const p = room.players[role];
        if (p?.ws.readyState === 1) {
          p.ws.send(JSON.stringify({ type: 'state', countdown: remaining, state: { ball: room.ball, paddles: room.paddles, scores: { player1: room.paddles.player1.score, player2: room.paddles.player2.score } } }));
        }
      });
      return;
    }

    // Running game: let physics.step advance and check for winner
    const res = step(room);
    if (res?.winnerRole) {
      await setGameOver(room, res.winnerRole);
      return;
    }

    // broadcast state to players
    ['player1', 'player2'].forEach(role => {
      const p = room.players[role];
      if (p?.ws.readyState === 1) {
        p.ws.send(JSON.stringify({ type: 'state', state: { ball: room.ball, paddles: room.paddles, scores: { player1: room.paddles.player1.score, player2: room.paddles.player2.score } } }));
      }
    });

  }, TICK_MS);
}

async function setGameOver(room, winnerRole) {
  if (room.state === ROOM_STATE.GAME_OVER) return;
  room.state = ROOM_STATE.GAME_OVER;

  const loserRole = winnerRole === 'player1' ? 'player2' : 'player1';
  const winner = room.lastGameResult?.winner || room.players[winnerRole]?.pseudo || null;
  const loser = room.lastGameResult?.loser || room.players[loserRole]?.pseudo || 'abandon';

  room.participants.forEach(player => {
    if (player?.ws.readyState === 1) {
      const payload = { winner, loser, score: { player1: room.paddles.player1.score, player2: room.paddles.player2.score } };
      if (room.type === '1v1') {
        player.ws.send(JSON.stringify(Object.assign({ type: 'end1v1' }, payload)));
      } else {
        player.ws.send(JSON.stringify(Object.assign({ type: 'gameOver' }, payload)));
      }
    }
  });

  if (room.tickId) { clearInterval(room.tickId); room.tickId = null; }

  room.prevStateBeforeDisconnect = null;
  room.remainingCountdown = null;
  room.disconnectedPlayer = null;
  room.lastGameResult = null;

  async function saveMatchToDB({ player1, player2, score1, score2 }) {
    const body = { player1, player2, score_player1: score1, score_player2: score2 };
    try {
      const fastify = getFastifyInstance();
      if (fastify && typeof fastify.inject === 'function') {
        const res = await fastify.inject({ method: 'POST', url: '/api/matches/ws', headers: { 'Content-Type': 'application/json', 'X-WS-SECRET': process.env.WS_SECRET || 'dev_ws_secret' }, payload: JSON.stringify(body) });
        console.log('MATCH SAVE STATUS:', res.statusCode, res.body);
        return;
      }

      const url = new URL(process.env.BACKEND_URL || 'http://localhost:3000/api/matches/ws');
      const isHttps = url.protocol === 'https:';
      const lib = isHttps ? require('https') : require('http');

      const opts = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + (url.search || ''),
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify(body)), 'X-WS-SECRET': process.env.WS_SECRET || 'dev_ws_secret' }
      };

      await new Promise((resolve, reject) => {
        const req = lib.request(opts, (res) => { let data = ''; res.on('data', (chunk) => data += chunk); res.on('end', () => { console.log('MATCH SAVE STATUS:', res.statusCode, data); resolve(); }); });
        req.on('error', reject);
        req.write(JSON.stringify(body));
        req.end();
      });
    } catch (err) {
      console.error('Failed to save match:', err);
    }
  }

  if (!room.players.player1 || !room.players.player2) {
    console.warn('Match not saved: missing player');
    return;
  }

  await saveMatchToDB({ player1: room.players.player1.pseudo, player2: room.players.player2.pseudo, score1: room.paddles.player1.score, score2: room.paddles.player2.score });

  if (room.type !== 'tournament') {
    deleteRoom(room.id);
    broadcastRoomUpdate();
  } else {
    if (room.disconnectedPlayer) { removeUserFromRoom(room.disconnectedPlayer.pseudo); }
    recordMatchWinner(room.tournament, winner);
    // start next tournament match flow
    startNextTournamentMatch(room);
  }
}

function startNextTournamentMatch(room) {
  const tournament = room.tournament;
  if (!tournament) return;

  if (tournament.waitingForHost) {
    console.log('startNextTournamentMatch: waiting for host confirmation, aborting start');
    return;
  }

  let match = getNextMatch(tournament);
  if (!match) {
    if (tournament.nextRound.length === 1) {
      room.state = ROOM_STATE.TOURNAMENT_OVER;
      const winner = tournament.nextRound[0];
      room.participants.forEach(p => { if (p.ws.readyState === 1) p.ws.send(JSON.stringify({ type: 'tournament-end', winner })); });
      tournament.inProgress = false;
      return;
    } else if (tournament.nextRound.length > 1) {
      tournament.players = [...tournament.nextRound];
      tournament.nextRound = [];
      generateMatches(tournament);
      tournament.round = (tournament.round || 1) + 1;
      const matchesOverview = tournament.matches.map(m => ({ p1: m.p1, p2: m.p2 }));
      const byes = tournament.nextRound && tournament.nextRound.length ? [...tournament.nextRound] : [];
      room.participants.forEach(p => { if (p.ws.readyState === 1) p.ws.send(JSON.stringify({ type: 'tournament-round', round: tournament.round, roundPlayers: tournament.players, matches: matchesOverview, byes, host: room.host })); });
      tournament.waitingForHost = true;
      return;
    } else {
      tournament.inProgress = false;
      return;
    }
  }

  const { p1, p2 } = match;
  if (!p2) {
    tournament.nextRound.push(p1);
    startNextTournamentMatch(room);
    return;
  }

  room.players.player1 = room.participants.find(p => p.pseudo === p1);
  room.players.player2 = room.participants.find(p => p.pseudo === p2);

  room.paddles.player1.score = 0;
  room.paddles.player2.score = 0;
  room.lastInputs.player1 = null;
  room.lastInputs.player2 = null;
  resetRoomBall(room);

  room.participants.forEach(player => {
    if (player.ws.readyState === 1) {
      player.ws.send(JSON.stringify({ type: 'tournament-next-match', p1, p2 }));
    }
    if (player.pseudo === p1 || player.pseudo === p2) {
      const role = player.pseudo === p1 ? 'player1' : 'player2';
      player.ws.send(JSON.stringify({ type: 'start-game', roomId: room.id, role, player1: p1, player2: p2 }));
    }
  });

  room.state = ROOM_STATE.COUNTDOWN;
  room.countdownSeconds = 10;
  room.countdownStart = Date.now();
  room.prevStateBeforeDisconnect = null;
  room.remainingCountdown = null;
  room.disconnectedPlayer = null;

  startGameLoop(room);
}

module.exports = { startGameLoop, start1v1Match, setGameOver, startNextTournamentMatch };
