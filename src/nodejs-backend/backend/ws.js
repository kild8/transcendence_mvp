const WebSocket = require("ws");
const { getRoom, deleteRoom, rooms } = require("./roomStore");
const {
  createTournament,
  generateMatches,
  getNextMatch,
  recordMatchWinner
} = require("./tournament.js");

const WINNING_SCORE = 5;
const TICK_RATE = 30;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;
let wss;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: "/ws" });
  console.log("WebSocket server initialized");

  wss.on("connection", (ws) => {
    console.log("Un joueur s'est connecté");
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

    ws.on("close", () => handleDisconnect(ws));
  });

  return wss;
}

// --------- HANDLERS ---------
function handleJoinRoom(ws, data) {
  const { roomId, pseudo } = data;
  const room = getRoom(roomId);
  if (!room) return ws.send(JSON.stringify({ type: "room-error", message: "Room introuvable" }));

  if (room.participants.find(p => p.ws === ws)) return;
  if (room.participants.length >= room.maxPlayers) return ws.send(JSON.stringify({ type: "room-error", message: "Room pleine" }));
  if (!room.host) {
    room.host = pseudo;
    console.log("room host is: ", room.host);
  }
  room.participants.push({ ws, pseudo });
  console.log("Player joined room:", pseudo, "Room participants are now", room.participants.map(p => p.pseudo));
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

  const [player1, player2] = room.participants;

  room.players.player1 = player1;
  room.players.player2 = player2;

  room.paddles = {
    player1: { position: { x: 50, y: 200}, width: 10, height: 100, speed: 8, score: 0 },
    player2: { position: { x : 740, y: 200 }, width: 10, height: 100, speed: 8, score: 0}
  };
  room.lastInputs = { player1: null, player2: null };
  room.ball = { position: { x: 400, y: 240 }, velocity: { x: 6, y: 4}, size: 10 };
  room.gameOver = false;

  [player1, player2].forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) {
      const role = p === player1 ? "player1" : "player2";
      p.ws.send(JSON.stringify({ type: "start-game", roomId: room.id, role}));
    }
  });

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
  const role = room.players.player1?.ws === ws ? "player1" : room.players.player2?.ws === ws ? "player2" : null;
  if (!role) return;
  room.lastInputs[role] = data.type === "input" ? data.key : null;
}

function handleDisconnect(ws) {
  if (ws.socketRole === "lobby") return;
  Object.values(rooms).forEach(room => {
    const participantIndex = room.participants.findIndex(p => p.ws === ws);
    if (participantIndex === -1) return;

    const disconnectedPlayer = room.participants[participantIndex];
    room.participants.splice(participantIndex, 1);

    if (room.host === disconnectedPlayer.pseudo) {
      room.host = room.participants.length > 0 ? room.participants[0].pseudo : null;
    }

    room.participants.forEach(p => {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify({
          type: "host-update",
          host: room.host
        }));
      }
    });

    let disconnectedRole = null;
    if (room.players.player1?.ws === ws) disconnectedRole = "player1";
    if (room.players.player2?.ws === ws) disconnectedRole = "player2";
    if (disconnectedRole) {
      const winnerRole = disconnectedRole === "player1" ? "player2" : "player1";
      room.players[disconnectedRole] = null;
      if (room.tickId && room.players[winnerRole]) {
        console.log("Victoire par abandon :", winnerRole);
        setGameOver(room, winnerRole);
      }
    }
     
    if (room.participants.length === 0) {
      console.log("Room vide, suppression :", room.id);
      deleteRoom(room.id);
    }
    broadcastRoomUpdate();
  });

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
      // Tournoi terminé
      const winner = tournament.nextRound[0];
      room.participants.forEach(p => {
        if (p.ws.readyState === WebSocket.OPEN)
          p.ws.send(JSON.stringify({ type: "tournament-end", winner }));
      });
      tournament.inProgress = false;
      return;
    } else if (tournament.nextRound.length > 1) {
      // Nouveau tour
      tournament.players = [...tournament.nextRound];
      tournament.nextRound = [];
      generateMatches(tournament);
      match = getNextMatch(tournament); // récupère le premier match du nouveau tour
    } else {
      tournament.inProgress = false;
      return;
    }
  }

  if (!match) return; // sécurité

  const { p1, p2 } = match;

  if (!p2) {
    tournament.nextRound.push(p1);
    startNextTournamentMatch(room);
    return;
  }

  console.log("Démarrage du match :", p1, "vs", p2);

  // Assigner les joueurs
  room.players.player1 = room.participants.find(p => p.pseudo === p1);
  room.players.player2 = room.participants.find(p => p.pseudo === p2);

  // Reset scores et inputs
  room.paddles.player1.score = 0;
  room.paddles.player2.score = 0;
  room.lastInputs.player1 = null;
  room.lastInputs.player2 = null;
  room.gameOver = false;
  resetRoomBall(room);

  // Notifier les joueurs du match et du start-game
  [p1, p2].forEach(pseudo => {
    const player = room.participants.find(p => p.pseudo === pseudo);
    if (player?.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({ type: "tournament-next-match", p1, p2 }));
      const role = player === room.players.player1 ? "player1" : "player2";
      player.ws.send(JSON.stringify({ type: "start-game", roomId: room.id, role }));
    }
  });

  startGameLoop(room); // lance le jeu
}

function setGameOver(room, winnerRole) {
  if (room.gameOver) return;
  room.gameOver = true;

  const loserRole = winnerRole === "player1" ? "player2" : "player1";
  const winner = room.players[winnerRole]?.pseudo || null;
  const loser = room.players[loserRole]?.pseudo || null;

  ["player1", "player2"].forEach(role => {
    const p = room.players[role];
    if (p?.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify({
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

  if (room.type !== "tournament") {
    deleteRoom(room.id);
  } else {
    recordMatchWinner(room.tournament, winner);
    setTimeout(() => startNextTournamentMatch(room), 1000);
  }
}

// --------- GAME LOOP ---------
function startGameLoop(room) {
  if (room.tickId) return;
  room.tickId = setInterval(() => {
    if (room.gameOver) return;
    ["player1", "player2"].forEach(role => {
      const input = room.lastInputs[role];
      const paddle = room.paddles[role];
      if (!paddle) return;
      if (input === "ArrowUp") paddle.position.y = Math.max(paddle.position.y - paddle.speed, 0);
      if (input === "ArrowDown") paddle.position.y = Math.min(paddle.position.y + paddle.speed, CANVAS_HEIGHT - paddle.height);
    });

    const ball = room.ball;
    ball.position.x += ball.velocity.x;
    ball.position.y += ball.velocity.y;

    if (ball.position.y <= 0 || ball.position.y >= CANVAS_HEIGHT - ball.size) ball.velocity.y *= -1;

    ["player1","player2"].forEach(role => {
      const p = room.paddles[role];
      if (ball.position.x <= p.position.x + p.width &&
          ball.position.x + ball.size >= p.position.x &&
          ball.position.y + ball.size >= p.position.y &&
          ball.position.y <= p.position.y + p.height) ball.velocity.x *= -1;
    });

    if (ball.position.x > CANVAS_WIDTH) { room.paddles.player1.score++; if(room.paddles.player1.score >= WINNING_SCORE) setGameOver(room,"player1"); resetRoomBall(room);}
    if (ball.position.x < 0) { room.paddles.player2.score++; if(room.paddles.player2.score >= WINNING_SCORE) setGameOver(room,"player2"); resetRoomBall(room);}

    ["player1","player2"].forEach(role => {
      const p = room.players[role];
      if(p?.ws.readyState===WebSocket.OPEN) p.ws.send(JSON.stringify({ type:"state", state:{ball:room.ball,paddles:room.paddles,scores:{player1:room.paddles.player1.score,player2:room.paddles.player2.score}}}));
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

module.exports = { initWebSocket };
