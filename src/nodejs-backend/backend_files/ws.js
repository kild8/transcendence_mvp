const WebSocket = require("ws");
const { getRoom, deleteRoom, rooms, userRoomMap, removeUserFromRoom, ROOM_STATE } = require("./roomStore");
const {
  createTournament,
  generateMatches,
  getNextMatch,
  recordMatchWinner
} = require("./tournament.js");
const fetch = require("node-fetch");

const {  totalEndedGames, gamesInProgress, exitedGamesCounter, gamesDuration} = require("./metrics.js");

const WINNING_SCORE = 5;
const TICK_RATE = 30;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;
let wss;
const jwt = require('jsonwebtoken');
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

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: "/ws" });
  console.log("WebSocket server initialized");

  wss.on("connection", (ws, req) => {
    console.log("Un joueur s'est connecté");
    // try to identify user from cookie JWT for presence
    try {
      const cookies = parseCookies(req.headers.cookie || '');
      const token = cookies.token;
      if (token) {
        const payload = jwt.verify(token, JWT_SECRET);
        const userId = Number(payload.id);
        ws._userId = userId;
        // increment presence count
        const prev = presenceCounts.get(userId) || 0;
        presenceCounts.set(userId, prev + 1);
        // broadcast presence to all clients
        const pmsg = JSON.stringify({ type: 'presence', userId, online: true });
        if (wss && wss.clients) {
          wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(pmsg); });
        }
      }
    } catch (e) {
      // invalid token => ignore presence for this ws
    }

    broadcastRoomUpdate();
    ws.socketRole = "default";

    ws.on("message", (msg) => {
      let data;
      try { data = JSON.parse(msg.toString()); } catch { return; }

      if (data.type === "register-socket") {
        ws.socketRole = data.role;
        return;
      }
      if (data.type === "join-room"){
        handleJoinRoom(ws, data) 
      }
      if (data.type === "start-game") {
        handleStartGame(ws, data);
      }
      if (data.type === "input" || data.type === "input-up"){
        handlePlayerInput(ws, data);
      }
    });

    ws.on("close", () => {
      // handle presence decrement
      try {
        const userId = ws._userId;
        if (userId) {
          const prev = presenceCounts.get(userId) || 0;
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
      handleDisconnect(ws);
    });
  });

  return wss;
}

// --------- HANDLERS ---------
function handleJoinRoom(ws, data) {
  const { roomId, pseudo } = data;
  const room = getRoom(roomId);
  if (!room) return ws.send(JSON.stringify({ type: "room-error", message: "Room introuvable" }));

  // Si le joueur est déjà dans une autre room
  if (userRoomMap[pseudo] && userRoomMap[pseudo] !== roomId) {
    removeUserFromRoom(pseudo);
  }

  // Vérifie s'il est déjà présent
  const existingParticipant = room.participants.find(p => p.pseudo === pseudo);
  if (existingParticipant) {
    return ws.send(JSON.stringify({ type: "room-error", message: "Tu es déjà dans cette room" }));
  }

  // Reconnexion ?
  if (room.disconnectedPlayer && room.disconnectedPlayer.pseudo === pseudo) {
    const role = room.disconnectedPlayer.role;
    console.log("Reconnexion réussie :", pseudo);

    // Mettre à jour uniquement le WS du joueur existant
    if (room.players[role]) room.players[role].ws = ws;

    clearTimeout(room.disconnectTimeout);
    room.disconnectTimeout = null;

    // Rétablir le countdown si nécessaire
    let remainingCountdown = null;
    if (room.state === ROOM_STATE.COUNTDOWN) {
      const elapsed = Math.floor((Date.now() - room.countdownStart) / 1000);
      remainingCountdown = Math.max(0, room.countdownSeconds - elapsed);
    }
    // Restaurer l'état précédent
    room.state = room.prevStateBeforeDisconnect || ROOM_STATE.PLAYING;
    room.prevStateBeforeDisconnect = null;
    room.remainingCountdown = null;
    room.disconnectedPlayer = null;

    // Ajoute le WS aux participants s'il n'est pas déjà là
    room.participants.push({ ws, pseudo });
    userRoomMap[pseudo] = roomId;

    // Notifier le joueur reconnecté avec l'état actuel
    ws.send(JSON.stringify({
        type: "reconnected",
        role,
        state: {
          ball: room.ball,
          paddles: room.paddles,
          scores: {
            player1: room.paddles.player1.score,
            player2: room.paddles.player2.score
          },
        }, player1: room.players.player1.pseudo, player2: room.players.player2.pseudo,
        countdown: remainingCountdown
      }));

    // Notifier les autres joueurs
    room.participants.forEach(p => {
      if (p.ws.readyState === WebSocket.OPEN && p.pseudo !== pseudo) {
        p.ws.send(JSON.stringify({
          type: "player-reconnected",
          pseudo
        }));
      }
    });

    broadcastRoomUpdate();
    return;
  }

  // Nouvelle connexion
  if (room.participants.length >= room.maxPlayers) {
    return ws.send(JSON.stringify({ type: "room-error", message: "Room pleine" }));
  }

  if (!room.host) room.host = pseudo;

  room.participants.push({ ws, pseudo });
  userRoomMap[pseudo] = roomId;

  ws.send(JSON.stringify({ type: "joined-room", roomId: room.id, roomType: room.type, pseudo, host: room.host }));
  broadcastRoomUpdate();
}

function handleStartGame(ws, data) {
  const room = getRoom(data.roomId);
  if (!room) return;

  const participant = room.participants.find(p => p.ws === ws);
  if (!participant) return;

  if (room.host !== participant.pseudo) {
    ws.send(JSON.stringify({ type: "room-error", message: "Seul le créateur de la room peut lancer la partie."}));
    return;
  }

  if (room.type === "tournament") {
    handleStartTournament(ws, data);
  }
  else if (room.type === "1v1") {
    start1v1Match(room);
  }
}

function start1v1Match(room) {
  if (room.participants.length < 2) return;

  room.state = ROOM_STATE.COUNTDOWN;
  const [player1, player2] = room.participants;

  room.players.player1 = player1;
  room.players.player2 = player2;

  room.paddles = {
    player1: { position: { x: 50, y: 200}, width: 10, height: 100, speed: 8, score: 0 },
    player2: { position: { x : 740, y: 200 }, width: 10, height: 100, speed: 8, score: 0}
  };
  room.lastInputs = { player1: null, player2: null };
  room.ball = { position: { x: 400, y: 240 }, velocity: { x: 6, y: 4}, size: 10 };

  [player1, player2].forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) {
      const role = p === player1 ? "player1" : "player2";
      p.ws.send(JSON.stringify({ type: "start-game", roomId: room.id, role, player1: room.players.player1.pseudo, player2: room.players.player2.pseudo }));
    }
  });
  room.countdownSeconds = 10;
  room.countdownStart = Date.now();
  room.prevStateBeforeDisconnect = null;
  room.remainingCountdown = null;
  room.disconnectedPlayer = null;
  startGameLoop(room);
}

function handleStartTournament(ws, data) {
  const roomId = data.roomId;
  const room = getRoom(roomId);
  if (!room || room.type !== "tournament") return;

  // Bloquer si le tournoi a déjà commencé
  if (room.tournament && room.tournament.started) {
    ws.send(JSON.stringify({ type: "room-error", message: "Le tournoi est déjà en cours" }));
    return;
  }

  const pseudos = room.participants.map(p => p.pseudo);
  if (pseudos.length < 2) {
    ws.send(JSON.stringify({ type: "room-error", message: "Il faut au moins 2 joueurs pour démarrer le tournoi" }));
    return;
  }

  // Crée le tournoi si nécessaire
  if (room.tournament.players.length === 0) {
    const host = pseudos[0]; // premier joueur comme host
    console.log("Creating tournament with pseudos: ", pseudos);
    room.tournament = createTournament(host, pseudos);
    console.log("Tournament created:", room.tournament);
    generateMatches(room.tournament);
  }

  room.tournament.started = true;

  // Notifie tous les joueurs
  room.participants.forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify({ type: "tournament-start", players: pseudos }));
    }
  });

  // Initialise paddles si ce n'est pas déjà fait
  if (!room.paddles) room.paddles = {};
  if (!room.paddles.player1) room.paddles.player1 = { position: { x: 50, y: 200 }, width: 10, height: 100, speed: 8, score: 0 };
  if (!room.paddles.player2) room.paddles.player2 = { position: { x: 740, y: 200 }, width: 10, height: 100, speed: 8, score: 0 };
  if (!room.lastInputs) room.lastInputs = { player1: null, player2: null };
  if (!room.ball) room.ball = { position: { x: 400, y: 240 }, velocity: { x: 6, y: 4 }, size: 10 };

  // Lance le premier match
  startNextTournamentMatch(room);
}

function handlePlayerInput(ws, data) {
  const room = Object.values(rooms).find(r => Object.values(r.participants).some(p => p?.ws === ws));
  if (!room) return;
  if (room.state !== ROOM_STATE.PLAYING) return;
  const role = room.players.player1?.ws === ws ? "player1" : room.players.player2?.ws === ws ? "player2" : null;
  if (!role) return;
  room.lastInputs[role] = data.type === "input" ? data.key : null;
}

function handleDisconnect(ws) {
  if (ws.socketRole === "lobby") return;

  Object.values(rooms).forEach(room => {
    const idx = room.participants.findIndex(p => p.ws === ws);
    if (idx === -1) return;

    const disconnectedPlayer = room.participants[idx];
    room.participants.splice(idx, 1);

    // Reassign host si nécessaire
    if (room.host === disconnectedPlayer.pseudo) {
      room.host = room.participants.length > 0 ? room.participants[0].pseudo : null;
      room.participants.forEach(p => {
        if (p.ws.readyState === WebSocket.OPEN) {
          p.ws.send(JSON.stringify({ type: "host-update", host: room.host }));
        }
      });
    }

    let role = null;
    if (room.players.player1?.ws === ws) role = "player1";
    if (room.players.player2?.ws === ws) role = "player2";

    if (role) {
      const winnerRole = role === "player1" ? "player2" : "player1";

      room.prevStateBeforeDisconnect = room.state;
      room.state = ROOM_STATE.PAUSED;

      if (room.prevStateBeforeDisconnect === ROOM_STATE.COUNTDOWN) {
        const elapsed = Math.floor((Date.now() - room.countdownStart) / 1000);
        room.remainingCountdown = Math.max(0, room.countdownSeconds - elapsed);
      }

      room.disconnectedPlayer = {
        pseudo: room.players[role]?.pseudo,
        role
      };

      console.log("Déconnexion pendant la partie: ", room.disconnectedPlayer.pseudo);

      // Notifier les autres joueurs
      room.participants.forEach(p => {
        if (p.ws.readyState === WebSocket.OPEN) {
          p.ws.send(JSON.stringify({
            type: "player-disconnected",
            pseudo: room.disconnectedPlayer.pseudo,
            timeout: 10
          }));
        }
      });

      if (room.disconnectTimeout) clearTimeout(room.disconnectTimeout);

      room.disconnectTimeout = setTimeout(() => {
        if (!room.disconnectedPlayer) return;

        console.log("Timeout dépassé, victoire par abandon");

        room.lastGameResult = {
          winner: room.players[winnerRole]?.pseudo || null,
          loser: room.disconnectedPlayer.pseudo,
          reason: "timeout"
        };
        room.players[role] = null;
        setGameOver(room, winnerRole);
      }, 10_000);
    }

    if (room.participants.length === 0) {
      console.log("Room vide, suppression :", room.id);
      deleteRoom(room.id);
    }

    broadcastRoomUpdate();
  });

  exitedGamesCounter.inc();
  console.log("Un joueur s'est déconnecté");
}

// --------- TOURNAMENT LOGIC ---------
function startNextTournamentMatch(room) {
  const tournament = room.tournament;
  if (!tournament) return;

  console.log("START NEXT MATCH");
  console.log("Players:", tournament.players);
  console.log("Matches:", tournament.matches);

  let match = getNextMatch(tournament);
  console.log("Next match:", match);

  if (!match) {
    if (tournament.nextRound.length === 1) {
      room.state = ROOM_STATE.TOURNAMENT_OVER;
      const winner = tournament.nextRound[0];
      room.participants.forEach(p => {
        if (p.ws.readyState === WebSocket.OPEN)
          p.ws.send(JSON.stringify({ type: "tournament-end", winner }));
      });
      tournament.inProgress = false;
      return;
    } else if (tournament.nextRound.length > 1) {
      tournament.players = [...tournament.nextRound];
      tournament.nextRound = [];
      generateMatches(tournament);
      match = getNextMatch(tournament);
    } else {
      tournament.inProgress = false;
      return;
    }
  }

  if (!match) return;

  const { p1, p2 } = match;

  if (!p2) {
    tournament.nextRound.push(p1);
    startNextTournamentMatch(room);
    return;
  }

  console.log("Démarrage du match :", p1, "vs", p2);

  room.players.player1 = room.participants.find(p => p.pseudo === p1);
  room.players.player2 = room.participants.find(p => p.pseudo === p2);

  room.paddles.player1.score = 0;
  room.paddles.player2.score = 0;
  room.lastInputs.player1 = null;
  room.lastInputs.player2 = null;
  resetRoomBall(room);

  room.participants.forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({ type: "tournament-next-match", p1, p2 }));
    }

    if (player.pseudo === p1 || player.pseudo === p2) {
      const role = player.pseudo === p1 ? "player1" : "player2";
      player.ws.send(JSON.stringify({ type: "start-game", roomId: room.id, role }));
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


async function setGameOver(room, winnerRole) {
  if (room.state === ROOM_STATE.GAME_OVER) return;
  room.state = ROOM_STATE.GAME_OVER;

  gamesInProgress.dec();
  room.timestamps.end = Date.now();
  gamesDuration.observe((room.timestamps.end - room.timestamps.start) / 1000);
  room.timestamps.start = null;
  room.timestamps.end = null;
  totalEndedGames.inc();

  const loserRole = winnerRole === "player1" ? "player2" : "player1";
  const winner =
    room.lastGameResult?.winner ||
    room.players[winnerRole]?.pseudo ||
    null;

  const loser =
    room.lastGameResult?.loser ||
    room.players[loserRole]?.pseudo ||
    "abandon";

  room.participants.forEach(player => {
    if (player?.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({
        type: "gameOver",
        winner,
        loser,
        score: {
          player1: room.paddles.player1.score,
          player2: room.paddles.player2.score
        }
      }));
    }
  });

  if (room.tickId) {
    clearInterval(room.tickId);
    room.tickId = null;
  }

  room.prevStateBeforeDisconnect = null;
  room.remainingCountdown = null;
  room.disconnectedPlayer = null;
  room.lastGameResult = null;

  async function saveMatchToDB({ player1, player2, score1, score2 }) {
    try {
      const res = await fetch("http://localhost:3000/api/matches/ws", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WS-SECRET": process.env.WS_SECRET || "dev_ws_secret"
        },
        body: JSON.stringify({
          player1,
          player2,
          score_player1: score1,
          score_player2: score2
        })
      });
      const text = await res.text();
      console.log("MATCH SAVE STATUS:", res.status, text);
    } catch (err) {
      console.error("Failed to save match:", err);
    }
  }

  if (!room.players.player1 || !room.players.player2) {
    console.warn("Match not saved: missing player");
    return;
  }

  await saveMatchToDB({
    player1: room.players.player1.pseudo,
    player2: room.players.player2.pseudo,
    score1: room.paddles.player1.score,
    score2: room.paddles.player2.score
  });

  if (room.type !== "tournament") {
    deleteRoom(room.id);
  } else {
    if (room.disconnectedPlayer) {
      removeUserFromRoom(room.disconnectedPlayer.pseudo);
    }
    recordMatchWinner(room.tournament, winner);
    startNextTournamentMatch(room);
  }
}


// --------- GAME LOOP ---------
function startGameLoop(room) {
  if (room.tickId) return;
  room.timestamps.start = Date.now();
  gamesInProgress.inc();
  room.tickId = setInterval(() => {

    // --- Si jeu en pause ou terminé ---
    if ([ROOM_STATE.WAITING, ROOM_STATE.GAME_OVER, ROOM_STATE.PAUSED].includes(room.state)) {
      ["player1", "player2"].forEach(role => {
        const p = room.players[role];
        if (p?.ws?.readyState === WebSocket.OPEN) {
          p.ws.send(JSON.stringify({
            type: "state",
            countdown: room.state === ROOM_STATE.COUNTDOWN
              ? Math.max(0, room.remainingCountdown ?? room.countdownSeconds)
              : 0,
            state: {
              ball: room.ball,
              paddles: room.paddles,
              scores: {
                player1: room.paddles.player1.score,
                player2: room.paddles.player2.score
              }
            },
            message: room.state === ROOM_STATE.PAUSED && room.disconnectedPlayer
              ? `En attente de la reconnexion de ${room.disconnectedPlayer.pseudo}`
              : undefined
          }));
        }
      });
      return;
    }

    // --- Countdown ---
    if (room.state === ROOM_STATE.COUNTDOWN) {
      const elapsed = (Date.now() - (room.countdownStart || Date.now())) / 1000;
      const remaining = Math.max(0, room.countdownSeconds - Math.floor(elapsed));
      room.remainingCountdown = remaining;

      if (remaining <= 0) {
        room.state = ROOM_STATE.PLAYING;
        room.remainingCountdown = null;
      }

      ["player1", "player2"].forEach(role => {
        const p = room.players[role];
        if (p?.ws.readyState === WebSocket.OPEN) {
          p.ws.send(JSON.stringify({
            type: "state",
            countdown: remaining,
            state: {
              ball: room.ball,
              paddles: room.paddles,
              scores: {
                player1: room.paddles.player1.score,
                player2: room.paddles.player2.score
              }
            }
          }));
        }
      });
      return;
    }

    // --- Joueurs et paddles ---
    ["player1", "player2"].forEach(role => {
      const input = room.lastInputs[role];
      const paddle = room.paddles[role];
      if (!paddle) return;
      if (input === "ArrowUp") paddle.position.y = Math.max(paddle.position.y - paddle.speed, 0);
      if (input === "ArrowDown") paddle.position.y = Math.min(paddle.position.y + paddle.speed, CANVAS_HEIGHT - paddle.height);
    });

    // --- Ball movement ---
    const ball = room.ball;
    ball.position.x += ball.velocity.x;
    ball.position.y += ball.velocity.y;

    if (ball.position.y <= 0 || ball.position.y >= CANVAS_HEIGHT - ball.size) ball.velocity.y *= -1;

    ["player1", "player2"].forEach(role => {
      const p = room.paddles[role];
      if (
        ball.position.x <= p.position.x + p.width &&
        ball.position.x + ball.size >= p.position.x &&
        ball.position.y + ball.size >= p.position.y &&
        ball.position.y <= p.position.y + p.height
      ) ball.velocity.x *= -1;
    });

    // --- Score & GameOver ---
    if (ball.position.x > CANVAS_WIDTH) {
      room.paddles.player1.score++;
      if (room.paddles.player1.score >= WINNING_SCORE) setGameOver(room, "player1");
      resetRoomBall(room);
    }
    if (ball.position.x < 0) {
      room.paddles.player2.score++;
      if (room.paddles.player2.score >= WINNING_SCORE) setGameOver(room, "player2");
      resetRoomBall(room);
    }

    // --- Broadcast état ---
    ["player1", "player2"].forEach(role => {
      const p = room.players[role];
      if (p?.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify({
          type: "state",
          state: {
            ball: room.ball,
            paddles: room.paddles,
            scores: {
              player1: room.paddles.player1.score,
              player2: room.paddles.player2.score
            }
          }
        }));
      }
    });

  }, 1000 / TICK_RATE);
}

function resetRoomBall(room) {
  room.ball.position = { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2 };
  room.ball.velocity = { x: 6 * (Math.random() > 0.5 ? 1 : -1), y: 4 * (Math.random() > 0.5 ? 1 : -1) };
}

function broadcastRoomUpdate() {
  if (!wss) return;
  const roomsData = Object.values(rooms).map(serializeRoom);
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type : "rooms-update", roomsData }));
    }
  });
}

function serializeRoom(room) {
  return {
    id: room.id,
    type: room.type,
    players: room.participants.length,
    maxPlayers: room.maxPlayers,
    host: room.host,
    participants: room.participants.map(p => p.pseudo),
  };
}

module.exports = { initWebSocket, getOnlineUserIds };
