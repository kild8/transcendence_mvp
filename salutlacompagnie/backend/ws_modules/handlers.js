// Handlers: room/message routing. Game start/loop/end delegated to gameManager.
const WebSocket = require('ws');
const { getRoom, deleteRoom, rooms, userRoomMap, removeUserFromRoom, ROOM_STATE } = require('../roomStore');
const { createTournament, generateMatches } = require('../tournament.js');
const physics = require('./physics');
const gameManager = require('./gameManager');
const roomUtils = require('./roomUtils');

// --------- ROOM & PRESENCE HELPERS (used by ws.js) ---------
// re-export broadcastRoomUpdate for callers (ws.js expects handlers.broadcastRoomUpdate)
const broadcastRoomUpdate = roomUtils.broadcastRoomUpdate;
const serializeRoom = roomUtils.serializeRoom;

// --------- MESSAGE / ROOM HANDLERS ---------
function handleJoinRoom(ws, data) {
  const { roomId, pseudo } = data;
  const room = getRoom(roomId);
  if (!room) return ws.send(JSON.stringify({ type: 'room-error', message: 'WS.ROOM_NOT_FOUND' }));

  // Si le joueur est déjà dans une autre room
  if (userRoomMap[pseudo] && userRoomMap[pseudo] !== roomId) {
    removeUserFromRoom(pseudo);
  }

  // Vérifie s'il est déjà présent
  const existingParticipant = room.participants.find(p => p.pseudo === pseudo);
  if (existingParticipant) {
    return ws.send(JSON.stringify({ type: 'room-error', message: 'WS.ALREADY_IN_ROOM' }));
  }

  // Reconnexion ?
  if (room.disconnectedPlayer && room.disconnectedPlayer.pseudo === pseudo) {
    const role = room.disconnectedPlayer.role;
    console.log('Reconnect success :', pseudo);

    if (room.players[role]) room.players[role].ws = ws;
    clearTimeout(room.disconnectTimeout);
    room.disconnectTimeout = null;

    let remainingCountdown = null;
    if (room.state === ROOM_STATE.COUNTDOWN) {
      const elapsed = Math.floor((Date.now() - room.countdownStart) / 1000);
      remainingCountdown = Math.max(0, room.countdownSeconds - elapsed);
    }

    room.state = room.prevStateBeforeDisconnect || ROOM_STATE.PLAYING;
    room.prevStateBeforeDisconnect = null;
    room.remainingCountdown = null;
    room.disconnectedPlayer = null;

    room.participants.push({ ws, pseudo });
    userRoomMap[pseudo] = roomId;

    ws.send(JSON.stringify({
      type: 'reconnected',
      role,
      state: {
        ball: room.ball,
        paddles: room.paddles,
        scores: { player1: room.paddles.player1.score, player2: room.paddles.player2.score }
      }, player1: room.players.player1.pseudo, player2: room.players.player2.pseudo,
      countdown: remainingCountdown
    }));

    room.participants.forEach(p => {
      if (p.ws.readyState === WebSocket.OPEN && p.pseudo !== pseudo) {
        p.ws.send(JSON.stringify({ type: 'player-reconnected', pseudo }));
      }
    });

    broadcastRoomUpdate();
    return;
  }

  // Nouvelle connexion
  if (room.participants.length >= room.maxPlayers) {
    return ws.send(JSON.stringify({ type: 'room-error', message: 'WS.ROOM_FULL' }));
  }

  if (!room.host) room.host = pseudo;

  room.participants.push({ ws, pseudo });
  userRoomMap[pseudo] = roomId;

  ws.send(JSON.stringify({ type: 'joined-room', roomId: room.id, roomType: room.type, pseudo, host: room.host }));
  broadcastRoomUpdate();
}

function handleStartGame(ws, data) {
  const room = getRoom(data.roomId);
  if (!room) return;

  const participant = room.participants.find(p => p.ws === ws);
  if (!participant) return;

  if (room.host !== participant.pseudo) {
    ws.send(JSON.stringify({ type: 'room-error', message: 'WS.ONLY_HOST_CAN_START' }));
    return;
  }

  if (room.type === 'tournament') {
    handleStartTournament(ws, data);
  }
  else if (room.type === '1v1') {
    gameManager.start1v1Match(room);
  }
}

function handleStartTournament(ws, data) {
  const roomId = data.roomId;
  const room = getRoom(roomId);
  if (!room || room.type !== 'tournament') return;

  if (room.tournament && room.tournament.started) {
    ws.send(JSON.stringify({ type: 'room-error', message: 'WS.TOURNAMENT_ALREADY_STARTED' }));
    return;
  }

  const pseudos = room.participants.map(p => p.pseudo);
  if (pseudos.length < 2) {
    ws.send(JSON.stringify({ type: 'room-error', message: 'WS.NEED_MIN_2_PLAYERS' }));
    return;
  }

  if (room.tournament.players.length === 0) {
    const host = pseudos[0];
    console.log('Creating tournament with pseudos: ', pseudos);
    room.tournament = createTournament(host, pseudos);
    console.log('Tournament created:', room.tournament);
    generateMatches(room.tournament);
  }

  room.tournament.started = true;

  room.participants.forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify({ type: 'tournament-start', players: pseudos }));
    }
  });

  room.tournament.waitingForHost = true;
  const matchesOverview = room.tournament.matches.map(m => ({ p1: m.p1, p2: m.p2 }));
  const byes = room.tournament.nextRound && room.tournament.nextRound.length ? [...room.tournament.nextRound] : [];
  room.participants.forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify({ type: 'tournament-round', round: room.tournament.round || 1, roundPlayers: room.tournament.players, matches: matchesOverview, byes, host: room.host }));
    }
  });

  if (!room.paddles) room.paddles = {};
  if (!room.paddles.player1) room.paddles.player1 = { position: { x: 50, y: 200 }, width: 10, height: 100, speed: 8, score: 0 };
  if (!room.paddles.player2) room.paddles.player2 = { position: { x: 740, y: 200 }, width: 10, height: 100, speed: 8, score: 0 };
  if (!room.lastInputs) room.lastInputs = { player1: null, player2: null };
  if (!room.ball) room.ball = { position: { x: 400, y: 240 }, velocity: { x: 3, y: 2 }, size: 10, initialVelocity: { x: 3, y: 2 } };
  if (!room.obstacles) room.obstacles = {
    top: { position: { x: physics.CANVAS_WIDTH / 2, y: 0 }, size: 20, pointingUp: false },
    bottom: { position: { x: physics.CANVAS_WIDTH / 2, y: physics.CANVAS_HEIGHT - 20 }, size: 20, pointingUp: true }
  };
}

function handleStartTournamentRound(ws, data) {
  const room = getRoom(data.roomId);
  if (!room || room.type !== 'tournament') return;
  const participant = room.participants.find(p => p.ws === ws);
  if (!participant) return;
  if (room.host !== participant.pseudo) {
    ws.send(JSON.stringify({ type: 'room-error', message: 'WS.ONLY_HOST_CAN_START' }));
    return;
  }

  if (!room.tournament) return;
  room.tournament.waitingForHost = false;
  gameManager.startNextTournamentMatch(room);
}

function handlePlayerInput(ws, data) {
  const room = Object.values(rooms).find(r => Object.values(r.participants).some(p => p?.ws === ws));
  if (!room) return;
  if (room.state !== ROOM_STATE.PLAYING) return;
  const role = room.players.player1?.ws === ws ? 'player1' : room.players.player2?.ws === ws ? 'player2' : null;
  if (!role) return;
  room.lastInputs[role] = data.type === 'input' ? data.key : null;
}

function handleDisconnect(ws) {
  if (ws.socketRole === 'lobby') return;

  Object.values(rooms).forEach(room => {
    const idx = room.participants.findIndex(p => p.ws === ws);
    if (idx === -1) return;

    const disconnectedPlayer = room.participants[idx];
    room.participants.splice(idx, 1);

    if (room.host === disconnectedPlayer.pseudo) {
      room.host = room.participants.length > 0 ? room.participants[0].pseudo : null;
      room.participants.forEach(p => {
        if (p.ws.readyState === WebSocket.OPEN) {
          p.ws.send(JSON.stringify({ type: 'host-update', host: room.host }));
        }
      });
    }

    let role = null;
    if (room.players.player1?.ws === ws) role = 'player1';
    if (room.players.player2?.ws === ws) role = 'player2';

    if (role) {
      const winnerRole = role === 'player1' ? 'player2' : 'player1';

      room.prevStateBeforeDisconnect = room.state;
      room.state = ROOM_STATE.PAUSED;

      if (room.prevStateBeforeDisconnect === ROOM_STATE.COUNTDOWN) {
        const elapsed = Math.floor((Date.now() - room.countdownStart) / 1000);
        room.remainingCountdown = Math.max(0, room.countdownSeconds - elapsed);
      }

      room.disconnectedPlayer = { pseudo: room.players[role]?.pseudo, role };

      console.log('Disconnected during the game: ', room.disconnectedPlayer.pseudo);

      room.participants.forEach(p => {
        if (p.ws.readyState === WebSocket.OPEN) {
          p.ws.send(JSON.stringify({ type: 'player-disconnected', pseudo: room.disconnectedPlayer.pseudo, timeout: 10 }));
        }
      });

      if (room.disconnectTimeout) clearTimeout(room.disconnectTimeout);

      room.disconnectTimeout = setTimeout(() => {
        if (!room.disconnectedPlayer) return;

        console.log('Timeout exceeded, victory by default');

        room.lastGameResult = { winner: room.players[winnerRole]?.pseudo || null, loser: room.disconnectedPlayer.pseudo, reason: 'timeout' };
        room.players[role] = null;
        gameManager.setGameOver(room, winnerRole);
      }, 10_000);
    }

    if (room.participants.length === 0) {
      console.log('Empty room, delete:', room.id);
      deleteRoom(room.id);
    }

    broadcastRoomUpdate();
  });

  console.log('a player has disconnected');
}

module.exports = {
  broadcastRoomUpdate,
  serializeRoom,
  handleJoinRoom,
  handleStartGame,
  handleStartTournament,
  handleStartTournamentRound,
  handlePlayerInput,
  handleDisconnect,
  // backward-compatible delegations to gameManager
  start1v1Match: gameManager.start1v1Match,
  startNextTournamentMatch: gameManager.startNextTournamentMatch,
  setGameOver: gameManager.setGameOver,
  startGameLoop: gameManager.startGameLoop
};
