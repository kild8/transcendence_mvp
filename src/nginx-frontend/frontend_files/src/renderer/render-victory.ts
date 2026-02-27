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
    <div class="bg-[#111111] rounded-[12px] border border-[#ffffff] shadow-[0_0_8px_#ffffff] p-10 text-center">
      <h2 class="text-2xl font-semibold mb-4">${t(state.lang, "RenderVictory.TITLE")}</h2>
      <p class="text-lg mb-4"><strong>${winner}</strong> ${t(state.lang, "RenderVictory.WON_AGAINST")} <strong>${loser}</strong> ! </p>
      <div class="flex justify-center gap-4 mt-4">
        <button id="replay" class="py-[0.6rem] px-[1rem] rounded-[10px] font-bold border border-[#333333] bg-[#000000] text-[#ffffff] transition-all duration-200 ease-linear hover:bg-[#ffffff] hover:text-[#000000] hover:-translate-y-[1px]">${t(state.lang, "RenderVictory.REPLAY")}</button>
        <button id="back" class="py-[0.6rem] px-[1rem] rounded-[10px] font-bold border border-[#333333] bg-[#000000] text-[#ffffff] transition-all duration-200 ease-linear hover:bg-[#ffffff] hover:text-[#000000] hover:-translate-y-[1px]">${t(state.lang, "Versus.BACK_TO_MENU")}</button>
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
          <button id="back-to-menu" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff] mb-3 transition-all duration-200 hover:bg-[#ffffff] hover:text-[#000000]">${t(state.lang, "Versus.BACK_TO_MENU")}</button>
          <canvas id="pong-canvas" width="800" height="480" style="display:block;margin:0 auto;border:1px solid #111;"></canvas>
        </div>
      `;
      app.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'card';
      wrap.innerHTML = canvasHtml;
      app.appendChild(wrap);

  const GameClassLocal = window.PongGame;
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