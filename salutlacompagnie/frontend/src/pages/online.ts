import { elFromHTML } from "../utils.js";
import { navigateTo } from "../router.js";
import { PongGameLan } from "../GameLan.js";
import { t } from "../lang/langIndex.js";
import { state } from '../state.js';

export function onlineContent(): HTMLElement {

  const html = `
    <section>
      <div class="flex justify-between items-center">
      <button id="back" class="small">${t(state.lang, "Online.BACK")}</button>
      </div>
      
      <div id="online-lobby">
      <h2 class="text-xl font-medium">${t(state.lang, "Online.TITLE")}</h2>
        <div class="mt-4 flex gap-2">
          <button id="create-1v1" class="btn">${t(state.lang, "Online.CREATE_1V1")}</button>
          <button id="create-tournament" class="btn">${t(state.lang, "Online.CREATE_TOURNAMENT")}</button>
        </div>

        <div class="mt-6">
          <h3 class="font-medium mb-2">${t(state.lang, "Online.AVAILABLE_ROOMS")}</h3>
          <ul id="online" class="space-y-2"></ul>
        </div>
      </div>

      <div id="game-container" class="mt-6"></div>
    </section>
  `;

  const node = elFromHTML(html);

  const list = node.querySelector("#online") as HTMLUListElement;
  const create1v1Btn = node.querySelector("#create-1v1") as HTMLButtonElement;
  const createTournamentBtn = node.querySelector("#create-tournament") as HTMLButtonElement;
  const backBtn = node.querySelector("#back") as HTMLButtonElement;
  const gameContainer = node.querySelector("#game-container") as HTMLDivElement;
  const lobbyWrapper = node.querySelector("#online-lobby") as HTMLDivElement;

  function showGame() {
    lobbyWrapper.style.display = "none";
    gameContainer.style.display = "block";
  }


  let currentGame: PongGameLan | null = null;
  let pseudo: string | null = null;
  const initPseudo = async () => {
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (data.ok && data.user?.name) {
        pseudo = data.user.name;
      }
    } catch (err) {
      console.error("cannot fetch pseudo", err);
      alert(t(state.lang, "Online.ERROR_PSEUDO_FETCH"));
    }
  };
  initPseudo();
  //--------- Websocket Lobby pour voir les rooms en direct
  //--------- Reste ouvert tant que la page rooms est ouverte
  const lobbyWs = new WebSocket(`ws://${window.location.hostname}:3000`);
  // store on global state so logout can close it if needed
  try { (window as any).state = (window as any).state || {}; } catch (e) {}
  (window as any).state = (window as any).state || {};
  try { (state as any).appState.lobbyWs = lobbyWs; } catch (e) {}
  lobbyWs.onopen = () => {
    lobbyWs.send(JSON.stringify({ type: "register-socket", role: "lobby"}));
  };
  lobbyWs.onmessage = (e) => {
    const data = JSON.parse(e.data);
    console.log("LOBBY WS: ", data);
    if (data.type === "rooms-update") {
      renderRooms(data.roomsData);
    }
  };

  //--------- Refresh et liste l'etat des rooms ----------
  const renderRooms = (rooms: any[]) => {
    list.innerHTML = "";

    rooms.forEach((r: any) => {
      const li = document.createElement("li");
      li.className = "flex flex-col border p-2 rounded";

      li.innerHTML = `
        <div class ="flex justify-between items-center">
        <span>${r.host ?? "Room"} ${r.type.toUpperCase()} (${r.players}/${r.maxPlayers})</span>
        <button>${t(state.lang, "Online.JOIN")}</button>
        </div>
        <div class="text-sm mt-1">${t(state.lang, "Online.PLAYERS_IN_ROOM", { players: r.participants.join(", ")})}</div>
        `;

      li.querySelector("button")!.onclick = () => joinRoom(r.id);
      list.appendChild(li);
    });
  };


  // ----------- CREATE ROOM ----------
  const createRoom = async (type: "1v1" | "tournament") => {
    console.log("le pseudo est:", pseudo);
    if (!pseudo) return alert(t(state.lang, "Online.ERROR_PSEUDO_FETCH"));
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, host: pseudo }),
      });
      const room = await res.json();
      if (!room?.id) return alert(t(state.lang, "Online.ERROR_CREATE_ROOM"));

      joinRoom(room.id);
    }
    catch (err) {
      console.error("Erreur create room:", err);
    }
  };

  create1v1Btn.onclick = () => createRoom("1v1");
  createTournamentBtn.onclick = () => createRoom("tournament");

  // ---------- JOIN ROOM ----------
  function joinRoom(roomId: string) {
    if (!pseudo) return alert(t(state.lang, "Online.ERROR_PSEUDO_FETCH"));
    
    sessionStorage.setItem("pseudo", pseudo);
    const ws = new WebSocket(`ws://${window.location.hostname}:3000`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "register-socket", role: "game" }));
      ws.send(JSON.stringify({ type: "join-room", roomId, pseudo }));
    }
    // --- LOG TOURNOI ---
    const tournamentLog = document.createElement("div");
    tournamentLog.className = "mt-4 space-y-1 text-sm";
    gameContainer.innerHTML = "";
    gameContainer.appendChild(tournamentLog);

    const startBtn = document.createElement("button");
    startBtn.textContent = t(state.lang, "RenderTournament.START_MATCH");
    startBtn.className = "btn mt-2";
    startBtn.style.display = "none";
    gameContainer.appendChild(startBtn);

    // --- PRE-CREATE CANVAS ---
    const canvas = document.createElement("canvas");
    canvas.id = "pong-canvas";
    canvas.width = 800;
    canvas.height = 480;
    canvas.style.background = "#000";
    gameContainer.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#fff";
      ctx.font = "20px monospace";
      ctx.fillText(t(state.lang, "Online.WAITING_FOR_HOST"), 250, 240);
    }
    startBtn.onclick = () => {
      console.log("Start tournament clicked");
      ws.send(JSON.stringify({ type: "start-game", roomId }));
      startBtn.style.display = "none";
      startBtn.disabled = true;
    };
    const updateStartButtonVisibilty = (host: string | null) => {
      if (pseudo === host) {
        startBtn.style.display = "inline-block";
        startBtn.disabled = false;
      } else {
        startBtn.style.display = "none";
      }
    };
    const stateMessage = document.createElement("div");
    stateMessage.id = "state-message";
    stateMessage.className = "mt-2 text-white text-lg";
    gameContainer.appendChild(stateMessage);

    ws.onmessage = (e) => {
  const data = JSON.parse(e.data);

  switch (data.type) {

    case "start-game":
      currentGame?.onGameOver?.();
      currentGame = new PongGameLan("pong-canvas", data.role, ws, data.player1, data.player2);
      showGame();
      break;

    case "state":
      // Met à jour le jeu avec l'état reçu
      currentGame?.update(data.state, data.countdown);

    case "player-disconnected":
      if (data.pseudo !== undefined)
      stateMessage.textContent = t(state.lang, "Online.PLAYER_DISCONNECTED", {pseudo: data.pseudo, timeout: data.timeout});
      break;

    case "player-reconnected":
      stateMessage.textContent = t(state.lang, "Online.PLAYER_RECONNECTED", {pseudo: data.pseudo});
      setTimeout(() => { stateMessage.textContent = ""; }, 2000);
      break;

    case "reconnected":
      // Si le joueur était déconnecté, on initialise/recharge le jeu
      if (!currentGame) {
        currentGame = new PongGameLan("pong-canvas", data.role, ws, data.player1, data.player2, data.countdown ?? 0);
        showGame();
      }

      // Met à jour l'état de la partie
      if (data.state) currentGame.update(data.state, data.countdown ?? 0);
      break;

    case "gameOver":
      currentGame?.onGameOver?.();
      showMatchEndScreen(data.winner, data.loser);
      break;

    case "tournament-next-match":
      tournamentLog.innerHTML += `<p style="font-size: 1.5em;">${t(state.lang, "Online.NEXT_MATCH", { p1: data.p1, p2: data.p2 })}</p>`;
      break;

    case "tournament-end":
      showVictoryScreen(data.winner);
      break;

    case "room-error":
      alert(data.message);
      break;

    case "joined-room":
    case "host-update":
      updateStartButtonVisibilty(data.host);
      break;

    case "rooms-players-update":
      tournamentLog.innerHTML = `<p>${t(state.lang, "Online.PLAYERS_IN_ROOM", { players: data.players.join(", ")})}</p>`;
      break;

    case "tournament-start":
      tournamentLog.innerHTML += `<p class="font-medium">${t(state.lang, "Online.TOURNAMENT_STARTED", { players: data.players.join(", ")})}</p>`;
      startBtn.style.display = "none";
      break;
  }
};

    backBtn.onclick = () => {
      currentGame?.onGameOver?.();
      try { lobbyWs.close(); } catch (e) {}
      try { delete (state as any).appState.lobbyWs; } catch (e) {}
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      navigateTo("home");
    };

    // ensure lobby ws closed on unload
    window.addEventListener('beforeunload', () => { try { lobbyWs.close(); } catch (e) {} });
  };

  return node;
}

function showMatchEndScreen(winner: string, loser: string) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "9999";
  overlay.style.color = "white";
  overlay.style.fontSize = "2rem";
  overlay.style.textAlign = "center";
  overlay.style.animation = "fadeIn 0.3s ease-out";

  overlay.innerHTML = `
    <div>${t(state.lang, "Online.MATCH_OVER")}</div>
    <div style="margin-top:1rem;">${t(state.lang, "Game.WIN_ALERT", {winner, loser, score: ''})}</div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
  }, 3000);
}

export function showVictoryScreen(winner: string) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.85)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "9999";
  overlay.style.color = "white";
  overlay.style.fontSize = "2rem";
  overlay.style.textAlign = "center";
  overlay.style.animation = "fadeIn 0.5s ease-out";

  overlay.innerHTML = `
  <div>${t(state.lang, "Online.VICTORY")}</div>
  <div style ="font-size:3rem; margin-top:1rem;">${winner}</div>
  `;

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement("div");
    piece.style.position = "absolute";
    piece.style.width = "10px";
    piece.style.height = "10px";
    piece.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${Math.random() * 100}%`;
    piece.style.animation = `confetti 2s linear infinite`;
    overlay.appendChild(piece);
  }

  document.body.appendChild(overlay);

  setTimeout(() => {
    if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
    navigateTo('home');
  }, 8000);
}

