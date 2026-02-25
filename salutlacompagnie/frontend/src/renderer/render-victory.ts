import { state } from "../state.js";
import { app, render } from "./renderer.js"
import { elFromHTML } from "../utils.js";
import { navigateTo, getHashPage } from "../router.js";
import { t } from "../lang/langIndex.js";

export function renderVictory(winner: string, loser: string, score: string, leftName?: string, rightName?: string) {
  // assure stop instance active
  if (state.currentGame && typeof state.currentGame.stop === 'function') {
    try { state.currentGame.stop(); } catch(e) { console.warn('failed to stop state.currentGame', e); }
    state.currentGame = null;
  }

  app.innerHTML = '';
  const html = `
    <div class="card text-center py-10">
      <h2 class="text-2xl font-semibold mb-4">${t(state.lang, "RenderVictory.TITLE")}</h2>
      <p class="text-lg mb-4"><strong>${winner}</strong> ${t(state.lang, "Versus.WON_AGAINST")} <strong>${loser}</strong> ! </p>
      <div class="flex justify-center gap-4 mt-4">
        <button id="replay" class="btn">${t(state.lang, "Versus.REPLAY")}</button>
        <button id="back" class="btn">${t(state.lang, "Versus.BACK_MENU")}</button>
      </div>
    </div>
  `;
  const node = elFromHTML(html);
  app.appendChild(node);

  // handlers
  const replayBtn = document.getElementById('replay') as HTMLButtonElement | null;
  const backBtn = document.getElementById('back') as HTMLButtonElement | null;

  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      // Stop any existing game (safety)
      if (state.currentGame && typeof state.currentGame.stop === 'function') {
        try { state.currentGame.stop(); } catch(e) { console.warn(e); }
        state.currentGame = null;
      }

      // recreate canvas view and new game with same players
      const canvasHtml = `
        <div>
          <button id="back-to-menu" class="small mb-3">${t(state.lang, "Versus.BACK_MENU")}</button>
          <canvas id="pong-canvas" width="800" height="480" style="display:block;margin:0 auto;border:1px solid #111;"></canvas>
        </div>
      `;
      app.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'card';
      wrap.innerHTML = canvasHtml;
      app.appendChild(wrap);

      const GameClassLocal = (window as any).PongGame;
      if (!GameClassLocal) {
        alert(t(state.lang, "Versus.GAME_MISSING"));
        return;
      }

      // instantiate and keep reference
      state.currentGame = new GameClassLocal('pong-canvas', leftName || winner, rightName || loser, state.WINNING_SCORE, (w: string, l: string, s: string) => {
        // stop current and re-render victory when match ends
        if (state.currentGame && typeof state.currentGame.stop === 'function') {
          try { state.currentGame.stop(); } catch(e) { console.warn(e); }
          state.currentGame = null;
        }
        renderVictory(w, l, s, leftName, rightName);
      });

      // attach back button to stop and go home
      const backToMenu = document.getElementById('back-to-menu');
      if (backToMenu) {
        backToMenu.addEventListener('click', () => {
          if (state.currentGame && typeof state.currentGame.stop === 'function') {
            try { state.currentGame.stop(); } catch(e) { console.warn(e); }
            state.currentGame = null;
          }
          navigateTo('home');
          render(getHashPage());
        });
      }
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // stop if any
      if (state.currentGame && typeof state.currentGame.stop === 'function') {
        try { state.currentGame.stop(); } catch(e) { console.warn(e); }
        state.currentGame = null;
      }
      navigateTo('home');
      render(getHashPage());
    });
  }
}