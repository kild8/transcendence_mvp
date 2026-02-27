import { elFromHTML } from "../utils.js";
import { navigateTo } from "../router.js";
import { PongGameLan } from "../GameLan.js";
import { t } from "../lang/langIndex.js";
import { state } from '../state.js';

export function onlineContent(): HTMLElement {

  const html = `
    <section>
      <div class="flex justify-between items-center mb-4">
        <button id="back" class="text-sm text-slate-400 hover:text-slate-200">${t(state.lang, "Online.BACK")}</button>
      </div>

      <div id="online-lobby">
        <h2 class="text-xl font-medium">${t(state.lang, "Online.TITLE")}</h2>
        <div class="mt-4 flex gap-2">
          <button id="create-1v1" class="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded font-bold">${t(state.lang, "Online.CREATE_1V1")}</button>
          <button id="create-tournament" class="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded font-bold">${t(state.lang, "Online.CREATE_TOURNAMENT")}</button>
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
  let roomWs: WebSocket | null = null;
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
  const lobbyWs = new WebSocket(`wss://${window.location.hostname}:8443/ws`);
  // store on global state so logout can close it if needed
  try { (window as unknown as Record<string, unknown>)['state'] = (window as unknown as Record<string, unknown>)['state'] || {}; } catch (e) {}
  (window as unknown as Record<string, unknown>)['state'] = (window as unknown as Record<string, unknown>)['state'] || {};
  try { state.appState.lobbyWs = lobbyWs; } catch (e) {}
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
  interface RoomSummary { id: string; host?: string; type?: string; players?: number; maxPlayers?: number; participants?: string[] }
  const renderRooms = (rooms: RoomSummary[]) => {
    list.innerHTML = "";

      rooms.forEach((r: any) => {
        const li = document.createElement("li");
        li.className = "flex flex-col border border-slate-700 p-3 rounded bg-slate-900 text-white";

        const isJoined = typeof pseudo === 'string' && r.participants && r.participants.includes(pseudo);

        li.innerHTML = `
            <div class ="flex justify-between items-center">
              <span class="font-medium">${r.host ?? "Room"} ${r.type.toUpperCase()} (${r.players}/${r.maxPlayers})</span>
              ${isJoined ? `<span class="text-sm text-green-400 font-medium">${t(state.lang, "Online.IN_ROOM")}</span>` : `<button class="join-room-btn bg-slate-800 hover:bg-slate-700 text-white py-1 px-3 rounded text-sm font-medium">${t(state.lang, "Online.JOIN")}</button>`}
            </div>
            <div class="text-sm mt-1 text-slate-400">${t(state.lang, "Online.PLAYERS_IN_ROOM", { players: r.participants.join(", ")})}</div>
            `;

      const joinBtn = li.querySelector(".join-room-btn") as HTMLButtonElement | null;
      if (joinBtn) joinBtn.onclick = () => joinRoom(r.id);
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
      if (!res || !room?.id || room.error) return alert(room.error ? t(state.lang, room.error) : t(state.lang, "Online.ERROR_CREATE_ROOM"));

      joinRoom(room.id);
    }
    catch (err) {
      console.error("Erreur create room:", err);
    }
  };

  create1v1Btn.onclick = () => createRoom("1v1");
  createTournamentBtn.onclick = () => createRoom("tournament");

  // Back button: always available, should close sockets / game and go home
  backBtn.onclick = () => {
  try { currentGame?.onGameOver?.(); } catch (e) {}
  try { lobbyWs.close(); } catch (e) {}
  try { state.appState.lobbyWs = null; } catch (e) {}
    try { if (roomWs && roomWs.readyState === WebSocket.OPEN) roomWs.close(); } catch (e) {}
    navigateTo("home");
  };

  // ---------- JOIN ROOM ----------
  function joinRoom(roomId: string) {
    if (!pseudo) return alert(t(state.lang, "Online.ERROR_PSEUDO_FETCH"));
    
    sessionStorage.setItem("pseudo", pseudo);
  const ws = new WebSocket(`wss://${window.location.hostname}:8443/ws`);
  roomWs = ws;
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
  startBtn.className = "mt-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded";
  // make button visible but disabled by default so reloads keep it present
  startBtn.style.display = "inline-block";
  startBtn.disabled = true;
  startBtn.textContent = t(state.lang, "Online.WAITING_FOR_HOST");
  startBtn.classList.add('opacity-60', 'cursor-not-allowed');
    gameContainer.appendChild(startBtn);
  let startTimeout: number | null = null;

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
      // disable while waiting for server confirmation instead of hiding immediately
      startBtn.disabled = true;
      // fallback: re-enable after 7s if no server response
      try { if (startTimeout) clearTimeout(startTimeout); } catch (e) {}
      startTimeout = window.setTimeout(() => { try { startBtn.disabled = false; } catch (e) {} }, 7000);
    };
    const updateStartButtonVisibilty = (host: string | null) => {
      if (pseudo === host) {
        startBtn.style.display = "inline-block";
        startBtn.disabled = false;
        startBtn.textContent = t(state.lang, "RenderTournament.START_MATCH");
        startBtn.setAttribute('aria-disabled', 'false');
        startBtn.classList.remove('opacity-60', 'cursor-not-allowed');
      } else {
        // show a disabled waiting button for non-hosts
        startBtn.style.display = "inline-block";
        startBtn.disabled = true;
        startBtn.textContent = t(state.lang, "Online.WAITING_FOR_HOST");
        startBtn.setAttribute('aria-disabled', 'true');
        // visual hint for disabled state
        startBtn.classList.add('opacity-60', 'cursor-not-allowed');
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
      // clear and hide any round overview/log so it doesn't stay above the canvas
      try { tournamentLog.innerHTML = ""; tournamentLog.style.display = 'none'; } catch (e) {}
      currentGame?.onGameOver?.();
      currentGame = new PongGameLan("pong-canvas", data.role, ws, data.player1, data.player2);
      showGame();
      // server accepted start -> clear fallback timeout
      try { if (startTimeout) { clearTimeout(startTimeout); startTimeout = null; } } catch (e) {}
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
	
	case "end1v1":
	showVictoryScreen(data.winner);
      break;

    case "tournament-next-match":
      tournamentLog.innerHTML += `<p style="font-size: 1.5em;">${t(state.lang, "Online.NEXT_MATCH", { p1: data.p1, p2: data.p2 })}</p>`;
      break;

    case "tournament-round":
      // data: { roundPlayers, matches: [{p1,p2}, ...], byes: [] }
      // Render a round overview similar to local tournament
      tournamentLog.innerHTML = "";
      const matchesListHtml = (data.matches || []).map((m: any) => `<div class="py-1 text-slate-900"><strong>${m.p1}</strong> - <strong>${m.p2}</strong></div>`).join('');
      const byesListHtml = (data.byes && data.byes.length) ? `<div class="mt-3 text-sm text-slate-500">${t(state.lang, "RenderTournament.ODD_PLAYERS", { players: data.byes.join(', ') })}</div>` : '';

      const startButtonHtml = data.host === pseudo
        ? `<button id="confirm-start-round" class="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded">${t(state.lang, "RenderTournament.START_ROUND")}</button>`
        : `<button id="confirm-start-round" disabled class="opacity-60 cursor-not-allowed bg-slate-800 text-white px-4 py-2 rounded">${t(state.lang, "Online.WAITING_FOR_HOST")}</button>`;

      const roundOverviewHtml = `
        <div class="bg-white rounded-lg shadow px-6 py-6 text-center text-slate-900">\n
          <h2 class="text-xl font-semibold mb-3">${t(state.lang, "RenderTournament.ROUND_OVERVIEW", { round: data.round || 1, matches: (data.matches || []).length })}</h2>\n
          <div class="mb-4">${matchesListHtml || t(state.lang, "RenderTournament.NO_MATCHES")}</div>\n
          ${byesListHtml}\n
          <div class="flex justify-center gap-4 mt-4">\n
            ${startButtonHtml}\n
          </div>\n
        </div>`;

      tournamentLog.innerHTML = roundOverviewHtml;
      tournamentLog.style.display = 'block';

      const confirmBtn = document.getElementById('confirm-start-round') as HTMLButtonElement | null;
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          // send message to server to actually start the round
          try { ws.send(JSON.stringify({ type: 'start-tournament-round', roomId })); } catch (e) { console.warn(e); }
        });
      }
      break;

    case "tournament-end":
      showVictoryScreen(data.winner);
      break;

    case "room-error":
      alert(t(state.lang, data.message));
      // if start was attempted, re-enable the button so host can retry
      try { if (startTimeout) { clearTimeout(startTimeout); startTimeout = null; } } catch (e) {}
      try { startBtn.style.display = "inline-block"; startBtn.disabled = false; } catch (e) {}
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

    // (back button handled globally)

    // ensure lobby ws closed on unload
    window.addEventListener('beforeunload', () => { try { lobbyWs.close(); } catch (e) {} });
  };

  return node;
}

function showMatchEndScreen(winner: string, loser: string) {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 bg-black/80 flex flex-col justify-center items-center z-50 text-white text-2xl text-center animate-fadeIn";
  overlay.innerHTML = `
    <div class="text-2xl font-medium">${t(state.lang, "Online.MATCH_OVER")}</div>
    <div class="mt-4 text-lg">${t(state.lang, "Game.WIN_ALERT", {winner, loser, score: ''})}</div>
  `;
  document.body.appendChild(overlay);

  setTimeout(() => {
    if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
  }, 3000);
}

export function showVictoryScreen(winner: string) {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 bg-black/85 flex flex-col justify-center items-center z-50 text-white text-center animate-fadeIn";
  overlay.innerHTML = `
    <div class="text-2xl">${t(state.lang, "Online.VICTORY")}</div>
    <div class="text-6xl font-bold mt-4">${winner}</div>
  `;

  // simple confetti pieces (positions rely on inline styles)
  for (let i = 0; i < 30; i++) {
    const piece = document.createElement("div");
    piece.className = "w-2 h-2 rounded-full absolute";
    piece.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${Math.random() * 100}%`;
    overlay.appendChild(piece);
  }

  document.body.appendChild(overlay);

  setTimeout(() => {
    if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
    window.location.reload();
  }, 8000);
}

