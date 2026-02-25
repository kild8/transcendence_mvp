import { elFromHTML } from '../utils.js';
import { state } from '../state.js';
import { navigateTo } from '../router.js';
import { renderVictory } from '../renderer/render-victory.js';
import { t } from '../lang/langIndex.js';
export function versusContent(): HTMLElement {
  const html = `
    <section>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-medium">${t(state.lang, "Versus.TITLE")}</h2>
        <button id="back" class="small">${t(state.lang, "Versus.BACK")}</button>
      </div>
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label class="flex flex-col">
          <span class="small">${t(state.lang, "Versus.PLAYER1")}</span>
          <input id="p1" placeholder="${t(state.lang, "Versus.PLAYER1_PLACEHOLDER")}" class="mt-1 p-3 rounded-lg border" />
        </label>
        <label class="flex flex-col">
          <span class="small">${t(state.lang, "Versus.PLAYER2")}</span>
          <input id="p2" placeholder="${t(state.lang, "Versus.PLAYER2_PLACEHOLDER")}" class="mt-1 p-3 rounded-lg border" />
        </label>
      </div>
      <div class="mt-4 flex gap-3">
        <button id="rand" class="btn">${t(state.lang, "Versus.BUTTON_RANDOM")}</button>
        <button id="start" class="btn">${t(state.lang, "Versus.BUTTON_START")}</button>
      </div>
    </section>
  `;

  const node = elFromHTML(html);
  const back = node.querySelector('#back') as HTMLButtonElement;
  const p1 = node.querySelector('#p1') as HTMLInputElement;
  const p2 = node.querySelector('#p2') as HTMLInputElement;
  const rand = node.querySelector('#rand') as HTMLButtonElement;
  const start = node.querySelector('#start') as HTMLButtonElement;

  back.addEventListener('click', () => {
    if (state.currentGame?.stop) state.currentGame.stop();
    state.currentGame = null;
    navigateTo('home');
  });

  rand.addEventListener('click', () => {
    const samples = ['Alice','Bob','Charlie','Denis','Eve','Fox'];
    let a = samples[Math.floor(Math.random()*samples.length)];
    let b = samples[Math.floor(Math.random()*samples.length)];
    while (b === a) b = samples[Math.floor(Math.random()*samples.length)];
    p1.value = a;
    p2.value = b;
  });

  start.addEventListener('click', async () => {
    const a = p1.value.trim();
    const b = p2.value.trim();
    if (!a || !b || a === b) { alert(t(state.lang, "Versus.ERROR_PSEUDOS")); return; }

    state.appState.players = [a,b];
    localStorage.setItem('mvp_players', JSON.stringify(state.appState.players));

    const canvasHtml = `
      <div>
        <button id="back-to-menu" class="small mb-3">${t(state.lang, "Versus.BACK_TO_MENU")}</button>
        <canvas id="pong-canvas" width="800" height="480" style="display:block;margin:0 auto;border:1px solid #111;"></canvas>
      </div>
    `;
    const app = document.getElementById('app')!;
    app.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.innerHTML = canvasHtml;
    app.appendChild(wrapper);

    const GameClass = (window as any).PongGame;
    if (!GameClass) { alert(t(state.lang, "Versus.NOT_LOADED")); return; }

    state.currentGame = new GameClass('pong-canvas', a, b, state.WINNING_SCORE,
      (winner: string, loser: string, score: string) => renderVictory(winner, loser, score, a, b)
    );

    const backBtn = document.getElementById('back-to-menu');
    backBtn?.addEventListener('click', () => {
      state.currentGame?.stop();
      state.currentGame = null;
      navigateTo('home');
    });
  });

  return node;
}
