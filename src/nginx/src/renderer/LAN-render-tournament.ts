import { app, render } from "./renderer.js";
import { state } from "../state.js";
import { elFromHTML } from "../utils.js";
import { navigateTo, getHashPage } from "../router.js";
import { renderVictory } from "../renderer/render-victory.js";
import { shuffle } from "../utils.js";

export function playMatchLAN(p1: string, p2: string, ws: WebSocket, playerRole: "player1" | "player2"): Promise<string> {
  return new Promise((resolve) => {
    app.innerHTML = '';
    const canvasHtml = `
      <div>
        <div class="mb-2 text-center small">Match : <strong>${p1}</strong> vs <strong>${p2}</strong></div>
        <canvas id="pong-canvas" width="800" height="480" style="display:block;margin:0 auto;border:1px solid #111;"></canvas>
      </div>
    `;
    const wrap = document.createElement('div');
    wrap.className = 'card';
    wrap.innerHTML = canvasHtml;
    app.appendChild(wrap);

    const GameClass = (window as any).PongGame;
    if (!GameClass) {
      alert('Game.js manquant.');
      resolve(p1);
      return;
    }

    // Stop any previous game
    if (state.currentGame?.stop) state.currentGame.stop();
    state.currentGame = null;

    // Create game instance with WS
    state.currentGame = new GameClass('pong-canvas', p1, p2, state.WINNING_SCORE, null, { ws, playerRole });

    // Listen for gameOver event from server
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "gameOver") {
        // stop local game
        if (state.currentGame?.stop) state.currentGame.stop();
        state.currentGame = null;

        renderVictory(data.winner, data.loser, data.score, p1, p2);
        resolve(data.winner);
      } else if (data.type === "input") {
        state.currentGame?.moveRemotePaddle(data.key, true);
      } else if (data.type === "input-up") {
        state.currentGame?.moveRemotePaddle(data.key, false);
      }
    };

    // Handle back button
    const backBtn = document.getElementById('back-to-menu');
    backBtn?.addEventListener('click', () => {
      state.currentGame?.stop();
      state.currentGame = null;
      ws.close();
      navigateTo('home');
      render(getHashPage());
    });
  });
}

export async function runTournamentLAN(initialPlayers: string[], ws: WebSocket, playerRole: "player1" | "player2") {
  if (!initialPlayers || initialPlayers.length < 2) {
    alert('Il faut au moins 2 joueurs pour un tournoi.');
    return;
  }

  let roundPlayers = shuffle(initialPlayers);
  let round = 1;
  let tournamentAbort = false;

  while (roundPlayers.length > 1) {
    app.innerHTML = '';
    const headerEl = elFromHTML(`
      <div class="card flex items-center justify-between">
        <h3 class="text-lg font-medium">Tour ${round} — ${roundPlayers.length} joueurs</h3>
        <button id="abort-tournament" class="btn small">← Retour</button>
      </div>
    `);
    app.appendChild(headerEl);

    const abortBtn = document.getElementById('abort-tournament');
    abortBtn?.addEventListener('click', () => {
      tournamentAbort = true;
      if (state.currentGame?.stop) state.currentGame.stop();
      state.currentGame = null;
      navigateTo('home');
      render(getHashPage());
    });

    const nextRound: string[] = [];
    for (let i = 0; i < roundPlayers.length; i += 2) {
      if (tournamentAbort) break;

      const p1 = roundPlayers[i];
      const p2 = roundPlayers[i + 1];

      if (!p2) {
        nextRound.push(p1);
        const info = elFromHTML(`<div class="card small mt-2">${p1} avance automatiquement (odd player)</div>`);
        app.appendChild(info);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      // Play match via LAN
      const winner = await playMatchLAN(p1, p2, ws, playerRole);
      if (tournamentAbort) break;
      nextRound.push(winner);
    }

    if (tournamentAbort) return;

    roundPlayers = shuffle(nextRound);
    round++;
    await new Promise((r) => setTimeout(r, 500));
  }

  const champion = roundPlayers[0];
  app.innerHTML = '';
  const champHtml = `
    <div class="card text-center">
      <h2 class="text-2xl font-semibold mb-4">Champion du tournoi</h2>
      <p class="text-lg mb-4"><strong>${champion}</strong> a gagné le tournoi !</p>
      <div class="flex justify-center gap-4 mt-4">
        <button id="to-home" class="btn">Retour au menu</button>
      </div>
    </div>
  `;
  app.appendChild(elFromHTML(champHtml));
  document.getElementById('to-home')?.addEventListener('click', () => {
    navigateTo('home');
    render(getHashPage());
  });
}

