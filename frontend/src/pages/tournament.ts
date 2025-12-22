import { elFromHTML } from '../utils.js';
import { state } from '../state.js';
import { navigateTo } from '../router.js';
import { runTournament } from '../renderer/render-tournament.js';
import { runTournamentLAN } from '../renderer/LAN-render-tournament.js';

export function tournamentContent(): HTMLElement {
  const html = `
    <section>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-medium">
          Tournoi (max ${state.MAX_TOURNAMENT_PLAYERS} joueurs)
        </h2>
        <button id="back" class="small">← Retour</button>
      </div>

      <div id="slots" class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"></div>

      <div class="mt-4 flex gap-3">
        <button id="fill" class="btn">Remplir exemples</button>
        <button id="clear" class="btn">Effacer</button>

        <div class="ml-auto flex items-center gap-3">
          <div class="small">
            Joueurs prêts: <strong id="count">0</strong>
          </div>
          <button id="start" class="btn">Démarrer</button>
          <button id="lan-mode" class="btn">LAN</button>
        </div>
      </div>

      <p class="small mt-3">
        Il faut au moins 2 joueurs pour lancer un tournoi.
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
  const lanBtn = node.querySelector('#lan-mode') as HTMLButtonElement;

  /* ---------- LAN ---------- */
  if (lanBtn) {
    lanBtn.addEventListener('click', () => {
      if (state.appState.ws) {
        state.appState.ws.close();
        state.appState.ws = null;
        state.appState.mode = 'LOCAL';
        state.appState.playerRole = null;
      }
      state.appState.mode = 'LAN';
      lanBtn.disabled = true;

      const ws = new WebSocket('ws://localhost:3000');
      ws.onopen = () => console.log('Connecté au serveur LAN');
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'assign') {
          state.appState.playerRole = data.player;
          console.log("Vous êtes :", data.player);
        }
      };

      ws.onclose = () => {
        console.log('Connexion LAN fermée');
        state.appState.mode = 'LOCAL';
        state.appState.playerRole = null;
        state.appState.ws = null;
        lanBtn.disabled = false;
      };
      
      state.appState.ws = ws;
      alert('Mode LAN activé.');
    });
  }

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
      alert('Il faut au moins 2 joueurs');
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

    if (state.appState.mode === 'LAN') {
      if (!state.appState.ws || !state.appState.playerRole) {
        alert('Pas de connexion LAN active !');
        return;
      }
      runTournamentLAN(players, state.appState.ws, state.appState.playerRole);
    } else {
      runTournament(players, state.WINNING_SCORE);
    }
  });

  updateCount();
  return node;
}
