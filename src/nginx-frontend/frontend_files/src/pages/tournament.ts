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
        <button id="back" class="text-sm text-[#9ca3af]">${t(state.lang, "Tournament.BACK")}</button>
      </div>

      <div id="slots" class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"></div>

      <div class="mt-4 flex gap-3">
  <button id="fill" class="py-[0.6rem] px-[1rem] rounded-[10px] font-bold border border-[#333333] bg-[#000000] text-[#ffffff] transition-all duration-200 ease-linear hover:bg-[#ffffff] hover:text-[#000000] hover:-translate-y-[1px]">${t(state.lang, "Tournament.BUTTON_FILL")}</button>
  <button id="clear" class="py-[0.6rem] px-[1rem] rounded-[10px] font-bold border border-[#333333] bg-[#000000] text-[#ffffff] transition-all duration-200 ease-linear hover:bg-[#ffffff] hover:text-[#000000] hover:-translate-y-[1px]">${t(state.lang, "Tournament.BUTTON_CLEAR")}</button>

        <div class="ml-auto flex items-center gap-3">
          <div class="text-sm text-[#9ca3af]">
            ${t(state.lang, "Tournament.READY_COUNT")}<strong id="count">0</strong>
          </div>
          <button id="start" class="py-[0.6rem] px-[1rem] rounded-[10px] font-bold border border-[#333333] bg-[#000000] text-[#ffffff] transition-all duration-200 ease-linear hover:bg-[#ffffff] hover:text-[#000000] hover:-translate-y-[1px]">${t(state.lang, "Tournament.BUTTON_START")}</button>
        </div>
      </div>

      <p class="text-sm text-[#9ca3af] mt-3">
        ${t(state.lang, "Tournament.MIN_PLAYERS_ALERT")}
      </p>
    </section>
  `;

  const node = elFromHTML(html) as HTMLElement;

  const back = node.querySelector('#back') as HTMLButtonElement | null;
  const slots = node.querySelector('#slots') as HTMLDivElement | null;
  const fill = node.querySelector('#fill') as HTMLButtonElement | null;
  const clear = node.querySelector('#clear') as HTMLButtonElement | null;
  const countEl = node.querySelector('#count') as HTMLElement | null;
  const start = node.querySelector('#start') as HTMLButtonElement | null;


  /* ---------- BACK ---------- */
  back?.addEventListener('click', () => {
    state.currentGame?.stop?.();
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
          class="w-full mt-2 p-2 rounded-md border text-black"
        />
      </div>
    `);

    if (slots) slots.appendChild(slot);

    const input = slot.querySelector('input') as HTMLInputElement | null;
    if (input) input.addEventListener('input', updateCount);
  }

  /* ---------- HELPERS ---------- */
  function readPlayers(): string[] {
    return Array.from({ length: state.MAX_TOURNAMENT_PLAYERS })
      .map((_, i) => {
        const input = node.querySelector(`#player-${i}`) as HTMLInputElement | null;
        return input && input.value ? input.value.trim() : '';
      })
      .filter(v => v.length > 0);
  }

  function updateCount() {
    if (countEl) countEl.textContent = String(readPlayers().length);
  }

  /* ---------- FILL ---------- */
  fill?.addEventListener('click', () => {
    const samples = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];

    for (let i = 0; i < state.MAX_TOURNAMENT_PLAYERS; i++) {
      const input = node.querySelector(`#player-${i}`) as HTMLInputElement | null;
      if (input) input.value = samples[i] || '';
    }

    updateCount();
  });

  /* ---------- CLEAR ---------- */
  clear?.addEventListener('click', () => {
    for (let i = 0; i < state.MAX_TOURNAMENT_PLAYERS; i++) {
      const input = node.querySelector(`#player-${i}`) as HTMLInputElement | null;
      if (input) input.value = '';
    }

    updateCount();
  });

  /* ---------- START ---------- */
  start?.addEventListener('click', async () => {
    const players = readPlayers();

    if (players.length < 2) {
      alert(t(state.lang, "Tournament.MIN_PLAYERS_START"));
      return;
    }

    // Prevent duplicate player names (same rule as local duel)
    const lower = players.map(p => p.toLowerCase());
    const hasDup = lower.some((p, i) => lower.indexOf(p) !== i);
    if (hasDup) {
      alert(t(state.lang, "Versus.ERROR_PSEUDOS"));
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
