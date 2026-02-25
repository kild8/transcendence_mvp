import { elFromHTML } from '../utils.js';
import { state } from '../state.js';
import { navigateTo } from '../router.js';
import { runTournament } from '../renderer/render-tournament.js';
import { t } from '../lang/langIndex.js';

export function tournamentContent(): HTMLElement {
  const html = `
    <section>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-medium">
          ${t(state.lang, "Tournament.TITLE", { maxPlayers: state.MAX_TOURNAMENT_PLAYERS })}
        </h2>
        <button id="back" class="small">${t(state.lang, "Tournament.BACK")}</button>
      </div>

      <div id="slots" class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"></div>

      <div class="mt-4 flex gap-3">
        <button id="fill" class="btn">${t(state.lang, "Tournament.BUTTON_FILL")}</button>
        <button id="clear" class="btn">${t(state.lang, "Tournament.BUTTON_CLEAR")}</button>

        <div class="ml-auto flex items-center gap-3">
          <div class="small">
            ${t(state.lang, "Tournament.READY_COUNT")}<strong id="count">0</strong>
          </div>
          <button id="start" class="btn">${t(state.lang, "Tournament.BUTTON_START")}</button>
        </div>
      </div>

      <p class="small mt-3">
        ${t(state.lang, "Tournament.MIN_PLAYERS_ALERT")}
      </p>
    </section>
  `;

  const node = elFromHTML(html);

  const back = node.querySelector('#back') as HTMLButtonElement;
  const slots = node.querySelector('#slots') as HTMLElement;
  const fill = node.querySelector('#fill') as HTMLButtonElement;
  const clear = node.querySelector('#clear') as HTMLButtonElement;
  const countEl = node.querySelector('#count') as HTMLElement;
  const start = node.querySelector('#start') as HTMLButtonElement;


  /* ---------- BACK ---------- */
  back.addEventListener('click', () => {
    state.currentGame?.stop();
    state.currentGame = null;
    navigateTo('home');
  });

  /* ---------- SLOTS ---------- */
  for (let i = 0; i < state.MAX_TOURNAMENT_PLAYERS; i++) {
    const slot = elFromHTML(`
      <div class="p-2 border rounded-lg bg-slate-50">
        <div class="small text-slate-500">Slot ${i + 1}</div>
        <input
          id="player-${i}"
          placeholder="Pseudo #${i + 1}"
          class="w-full mt-2 p-2 rounded-md border"
        />
      </div>
    `);

    slots.appendChild(slot);

    const input = slot.querySelector('input') as HTMLInputElement;
    input.addEventListener('input', updateCount);
  }

  /* ---------- HELPERS ---------- */
  function readPlayers(): string[] {
    return Array.from({ length: state.MAX_TOURNAMENT_PLAYERS })
      .map((_, i) => {
        const input = node.querySelector(
          `#player-${i}`
        ) as HTMLInputElement | null;
        return input?.value.trim() ?? '';
      })
      .filter(v => v.length > 0);
  }

  function updateCount() {
    countEl.textContent = String(readPlayers().length);
  }

  /* ---------- FILL ---------- */
  fill.addEventListener('click', () => {
    const samples = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];

    for (let i = 0; i < state.MAX_TOURNAMENT_PLAYERS; i++) {
      const input = node.querySelector(
        `#player-${i}`
      ) as HTMLInputElement | null;

      if (input) input.value = samples[i] || '';
    }

    updateCount();
  });

  /* ---------- CLEAR ---------- */
  clear.addEventListener('click', () => {
    for (let i = 0; i < state.MAX_TOURNAMENT_PLAYERS; i++) {
      const input = node.querySelector(
        `#player-${i}`
      ) as HTMLInputElement | null;

      if (input) input.value = '';
    }

    updateCount();
  });

  /* ---------- START ---------- */
  start.addEventListener('click', async () => {
    const players = readPlayers();

    if (players.length < 2) {
      alert(t(state.lang, "Tournament.MIN_PLAYERS_START"));
      return;
    }

    state.appState.players = players;
    localStorage.setItem('mvp_players', JSON.stringify(players));

    try {
      await fetch('/api/start-tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players }),
      });
    } catch {}

      runTournament(players, state.WINNING_SCORE);
  });

  updateCount();
  return node;
}
