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

      <div class="mt-4">
        <input id="pseudo" placeholder="Votre pseudo" class="p-2 border rounded w-full"/>
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
  const pseudoInput = node.querySelector("#pseudo") as HTMLInputElement;
  const create1v1Btn = node.querySelector("#create-1v1") as HTMLButtonElement;
  const createTournamentBtn = node.querySelector("#create-tournament") as HTMLButtonElement;
  const backBtn = node.querySelector("#back") as HTMLButtonElement;
  const gameContainer = node.querySelector("#game-container") as HTMLDivElement;

  const getPseudo = () => pseudoInput.value.trim();
  let currentGame: PongGameLan | null = null;
  //--------- Websocket Lobby pour voir les rooms en direct
  //--------- Reste ouvert tant que la page rooms est ouverte
  const lobbyWs = new WebSocket(`wss://${window.location.hostname}/ws`);
  lobbyWs.onopen = () => {
    lobbyWs.send(JSON.stringify({ type: "register-socket", role: "lobby"}));
  };
  lobbyWs.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === "rooms-update") {
      renderRooms(data.rooms);
    }
  };

  //--------- Refresh et liste l'etat des rooms ----------
  const renderRooms = (rooms: any[]) => {
    list.innerHTML = "";

    rooms.forEach((r: any) => {
      const li = document.createElement("li");
      li.className = "flex justify-between items-center border p-2 rounded";

      li.innerHTML = ` 
        <span>${r.type.toUpperCase()} (${r.players}/${r.maxPlayers})</span>
        <button class="small">Rejoindre</button>
        `;

      li.querySelector("button")!.onclick = () => joinRoom(r.id);
      list.appendChild(li);
    });
  };


  // ----------- CREATE ROOM ----------
  const createRoom = async (type: "1v1" | "tournament") => {
    const pseudo = getPseudo();
    if (!pseudo) return alert("Entrez un pseudo");

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const room = await res.json();
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
    const pseudo = getPseudo();
    if (!pseudo) return alert("Entrez un pseudo");

    sessionStorage.setItem("pseudo", pseudo);
    const ws = new WebSocket(`wss://${window.location.hostname}/ws`);
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
    startBtn.style.display = "block";
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

    let isHost = false;

    startBtn.onclick = () => {
      console.log("Start tournament clicked");
      ws.send(JSON.stringify({ type: "start-game", roomId }));
      startBtn.disabled = true;
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join-room", roomId, pseudo }));
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      switch (data.type) {
        case "joined-room":
          if (data.pseudo === data.players?.[0]) {
            isHost = true;
            startBtn.style.display = "inline-block";
          }
          break;

        case "rooms-update":
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
          tournamentLog.innerHTML += `<p class="font-bold text-green-600">Tournoi terminé ! Vainqueur : ${data.winner}</p>`;
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
          tournamentLog.innerHTML += `<p class="text-blue-600">${data.winner} a gagné le match contre ${data.loser} !</p>`;
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
