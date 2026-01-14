import { elFromHTML } from "../utils.js";
import { navigateTo } from "../router.js";
import { PongGameLan } from "../GameLan.js";

export function roomsContent(): HTMLElement {

  const html = `
    <section>
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-medium">Rooms en ligne</h2>
        <button id="back" class="small">← Retour</button>
      </div>

      <div class="mt-4 flex gap-2">
        <button id="create-1v1" class="btn">Créer 1v1</button>
        <button id="create-tournament" class="btn">Créer Tournoi</button>
      </div>

      <div class="mt-6">
        <h3 class="font-medium mb-2">Rooms disponibles</h3>
        <ul id="rooms" class="space-y-2"></ul>
      </div>

      <div id="game-container" class="mt-6"></div>
    </section>
  `;

  const node = elFromHTML(html);

  const list = node.querySelector("#rooms") as HTMLUListElement;
  const create1v1Btn = node.querySelector("#create-1v1") as HTMLButtonElement;
  const createTournamentBtn = node.querySelector("#create-tournament") as HTMLButtonElement;
  const backBtn = node.querySelector("#back") as HTMLButtonElement;
  const gameContainer = node.querySelector("#game-container") as HTMLDivElement;

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
      console.error("impossible de récupérer le pseudo", err);
      alert("Impossible de récupérer votre pseudo, veuillez vous reconnecter.");
    }
  };
  initPseudo();
  //--------- Websocket Lobby pour voir les rooms en direct
  //--------- Reste ouvert tant que la page rooms est ouverte
  const lobbyWs = new WebSocket(`ws://${window.location.hostname}:3000`);
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
        <button>Rejoindre</button>
        </div>
        <div class="text-sm mt-1">Joueurs: ${r.participants.join(", ")}</div>
        `;

      li.querySelector("button")!.onclick = () => joinRoom(r.id);
      list.appendChild(li);
    });
  };


  // ----------- CREATE ROOM ----------
  const createRoom = async (type: "1v1" | "tournament") => {
    if (!pseudo) return alert("Pseudo manquant, veuillez vous reconnecter.");

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const room = await res.json();
      if (room?.error === "2_ROOMS") return alert("Impossible de créer 2 rooms en même temps, vous pouvez quitter la page pour supprimer votre room actuelle.");
      if (!room?.id) return alert("Erreur création de room");

      joinRoom(room.id);
    } catch (err) {
      console.error("Erreur create room:", err);
    }
  };

  create1v1Btn.onclick = () => createRoom("1v1");
  createTournamentBtn.onclick = () => createRoom("tournament");

  // ---------- JOIN ROOM ----------
  const joinRoom = (roomId: string) => {
    if (!pseudo) return alert("Pseudo manquant, veuillez vous reconnecter.");

    sessionStorage.setItem("pseudo", pseudo);
    const ws = new WebSocket(`ws://${window.location.hostname}:3000`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "register-socket", role: "game" }));
    }
    // --- LOG TOURNOI ---
    const tournamentLog = document.createElement("div");
    tournamentLog.className = "mt-4 space-y-1 text-sm";
    gameContainer.innerHTML = "";
    gameContainer.appendChild(tournamentLog);

    const startBtn = document.createElement("button");
    startBtn.textContent = "Démarrer";
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
      ctx.fillText("En attente du prochain match...", 250, 240);
    }
    startBtn.onclick = () => {
      console.log("Start tournament clicked");
      ws.send(JSON.stringify({ type: "start-game", roomId }));
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

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join-room", roomId, pseudo }));
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      switch (data.type) {
        case "joined-room":
          updateStartButtonVisibilty(data.host);
          break;

        case "host-update":
          updateStartButtonVisibilty(data.host);
          break;

        case "rooms-players-update":
          tournamentLog.innerHTML = `<p>Joueurs dans la room: ${data.players.join(", ")}</p>`;
          break;

        case "tournament-start":
          tournamentLog.innerHTML += `<p class="font-medium">Tournoi démarré ! Joueurs : ${data.players.join(", ")}</p>`;
          startBtn.style.display = "none";
          break;

        case "tournament-next-match":
          tournamentLog.innerHTML += `<p>Prochain match : ${data.p1} vs ${data.p2}</p>`;
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillText(`Prochain match : ${data.p1} vs ${data.p2}`, 300, 240);
          }
          break;

        case "tournament-end":
          showVictoryScreen(data.winner);
          break;

        case "start-game":
          currentGame?.onGameOver?.();
          currentGame = new PongGameLan("pong-canvas", data.role, ws);
          break;

        case "state":
          currentGame?.update(data.state);
          break;

        case "gameOver":
          currentGame?.onGameOver?.();
          showMatchEndScreen(data.winner, data.loser);
          if (data.loser) tournamentLog.innerHTML += `<p class="text-blue-600">${data.winner} a gagné le match contre ${data.loser} !</p>`;
          else tournamentLog.innerHTML += `<p class="text-blue-600">${data.winner} a gagné !</p>`;
          break;

        case "room-error":
          alert(data.message);
          break;
      }
    };

    backBtn.onclick = () => {
      currentGame?.onGameOver?.();
      lobbyWs.close();
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      navigateTo("home");
    };
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
    <div>Match terminé !</div>
    <div style="margin-top:1rem;">${winner} a battu ${loser}</div>
    <button id="closeMatchEnd" style="margin-top:2rem; padding:0.5rem 1rem; font-size:1rem;">Fermer</button>
  `;

  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector("#closeMatchEnd") as HTMLButtonElement;
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
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
  <div>🏆 Félicitations ! 🏆</div>
  <div style ="font-size:3rem; margin-top:1rem;">${winner}</div>
  <button id="closeVictory" style ="margin-top:2rem; padding:0.5rem 1rem; font-size:1rem;">Fermer</button>
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

  const closeBtn = overlay.querySelector("#closeVictory") as HTMLButtonElement;
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
    navigateTo('home');
  });
}

