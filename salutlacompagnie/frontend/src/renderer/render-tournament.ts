import { shuffle, elFromHTML } from "../utils.js";
import { app, render } from "./renderer.js";
import { navigateTo, getHashPage } from "../router.js";
import { state } from "../state.js";
import { t } from "../lang/langIndex.js";

// joue un match entre p1 et p2, retourne une Promise qui résout sur le nom du gagnant
function playMatch(p1: string, p2: string, winningScore = state.WINNING_SCORE): Promise<string> {
  return new Promise((resolve) => {
    // clear area and render canvas
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

    const GameClassLocal = (window as any).PongGame;
    if (!GameClassLocal) {
      alert(t(state.lang, "RenderTournament.GAME_MISSING"));
      resolve(p1); // fallback
      return;
    }

    // stop any previous instance
    if (state.currentGame && typeof state.currentGame.stop === 'function') {
      try { state.currentGame.stop(); } catch(e) { console.warn(e); }
      state.currentGame = null;
    }

    // create game with onGameOver callback
    state.currentGame = new GameClassLocal('pong-canvas', p1, p2, winningScore, (winner: string, loser: string) => {
      // ensure stop and resolve winner
      if (state.currentGame && typeof state.currentGame.stop === 'function') {
        try { state.currentGame.stop(); } catch(e) { console.warn(e); }
        state.currentGame = null;
      }
      resolve(winner);
    });
  });
}
export async function runTournament(initialPlayers: string[], winningScore = state.WINNING_SCORE) {
  if (!initialPlayers || initialPlayers.length < 2) {
    alert(t(state.lang, "RenderTournament.MIN_PLAYERS_ALERT"));
    return;
  }

  let roundPlayers = shuffle(initialPlayers);
  let round = 1;
  let tournamentAbort = false;

  while (roundPlayers.length > 1) {
    // display round header & abort button
    app.innerHTML = '';
    const headerEl = elFromHTML(`
      <div class="card flex items-center justify-between">
        <h3 class="text-lg font-medium">${t(state.lang, "RenderTournament.ROUND_HEADER", { round, players: roundPlayers.length })}</h3>
        <button id="abort-tournament" class="btn small">${t(state.lang, "RenderTournament.BACK")}</button>
      </div>
    `);
    app.appendChild(headerEl);

    // abort handler
    const abortBtn = document.getElementById('abort-tournament');
    if (abortBtn) {
      abortBtn.addEventListener('click', () => {
        tournamentAbort = true;
        // stop current game (if any)
        if (state.currentGame && typeof state.currentGame.stop === 'function') {
          try { state.currentGame.stop(); } catch (e) { console.warn(e); }
          state.currentGame = null;
        }
        navigateTo('home');
        render(getHashPage());
      });
    }

    const nextRound: string[] = [];
    for (let i = 0; i < roundPlayers.length; i += 2) {
      if (tournamentAbort) break; // exit early if aborted

      const p1 = roundPlayers[i];
      const p2 = roundPlayers[i + 1];

      if (!p2) {
        // odd player -> passe directement
        nextRound.push(p1);
        const info = elFromHTML(`<div class="card small mt-2">${t(state.lang, "RenderTournament.ODD_PLAYER_ADVANCE", { player: p1 })}</div>`);
        app.appendChild(info);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      app.innerHTML = '';
      const preMatch = elFromHTML(`
        <div class="card text-center py-10">
          <h2 class="text-2xl font-semibold mb-3">${t(state.lang, "RenderTournament.NEXT_MATCH")}</h2>
          <p class="text-lg mb-6"><strong>${p1}</strong> VS <strong>${p2}</strong></p>
          <button id="start-next" class="btn">
            ${t(state.lang, "RenderTournament.START_MATCH")}
          </button>
          <button id="abort-prematch" class="btn small">${t(state.lang, "RenderTournament.BACK_PREMATCH")}</button>
        </div>
      `);
      app.appendChild(preMatch);

      preMatch.querySelector('#abort-prematch')?.addEventListener('click', () => {
        tournamentAbort = true;
        if (state.currentGame && typeof state.currentGame.stop === 'function') {
          try { state.currentGame.stop(); } catch (e) { console.warn(e); }
          state.currentGame = null;
        }
        navigateTo('home');
        render(getHashPage());
      });

      await new Promise<void>((resolve) => {
        const btn = document.getElementById('start-next')!;
        btn.addEventListener('click', () => resolve());
      });

      // play the match (await)
      const winner = await playMatch(p1, p2, winningScore);

      if (tournamentAbort) break; // check after match too

      app.innerHTML = '';
      const victoryScreen = elFromHTML(`
        <div class="card text-center py-10">
          <h2 class="text-2xl font-semibold mb-3">${t(state.lang, "RenderTournament.VICTORY")}<strong>${winner}</strong> !</h2>
          <p class="text-lg mb-6">(${p1} vs ${p2})</p>
          <button id="next-match" class="btn">
            ${t(state.lang, "RenderTournament.NEXT_MATCH_BTN")};
          </button>
        </div>
      `);

      app.appendChild(victoryScreen);
      
      await new Promise<void>((resolve) => {
        const nextBtn = document.getElementById('next-match')!;
        nextBtn.addEventListener('click', () => resolve());
      });

      // append winner to nextRound
      nextRound.push(winner);
    }

    if (tournamentAbort) return; // stop the tournament run

    // shuffle next round for fun (optional)
    roundPlayers = shuffle(nextRound);
    round++;
    // brief pause
    await new Promise((r) => setTimeout(r, 500));
  }

  // final winner
  const champion = roundPlayers[0];
  // show champion screen
  app.innerHTML = '';
  const champHtml = `
    <div class="card text-center">
      <h2 class="text-2xl font-semibold mb-4">${t(state.lang, "RenderTournament.CHAMPION_TITLE")}</h2>
      <p class="text-lg mb-4"><strong>${champion}</strong> ${t(state.lang, "RenderTournament.CHAMPION_MSG")}</p>
      <div class="flex justify-center gap-4 mt-4">
        <button id="to-home" class="btn">${t(state.lang, "RenderTournament.TO_HOME")}</button>
      </div>
    </div>
  `;
  app.appendChild(elFromHTML(champHtml));
  const toHomeBtn = document.getElementById('to-home');
  if (toHomeBtn) {
    toHomeBtn.addEventListener('click', () => {
      if (state.currentGame && typeof state.currentGame.stop === 'function') { try { state.currentGame.stop(); } catch(e){}}
      navigateTo('home');
      render(getHashPage());
    });
  }
}