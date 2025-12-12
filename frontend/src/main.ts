/**
 * Frontend SPA (Vanilla TS + Tailwind)
 * Build: tsc -> dist/main.js ; tailwindcss -> dist/style.css
 */

// référence au jeu courant — utilisée pour s'assurer qu'on arrête l'instance active
let currentGame: any = null;

/* ---------- Types & state ---------- */
type Page = 'home' | 'versus' | 'tournament' | 'add-user' | 'list-users' | 'profile';
const MAX_TOURNAMENT_PLAYERS = 8;
const app = document.getElementById('app')!;

const appState = { players: [] as string[] };

const WINNING_SCORE = 2;

/* ---------- Helpers ---------- */
function elFromHTML(html: string): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild as HTMLElement;
}
function navigateTo(page: Page) { window.location.hash = `#${page}`; }
function getHashPage(): Page { const h = (window.location.hash || '#home').replace('#','') as Page; if (h !== 'home' && h !== 'versus' && h !== 'tournament' && h !== 'add-user' && h !== 'list-users' && h !== 'profile') return 'home'; return h; }

/* ---------- Renderers ---------- */
function renderVictory(winner: string, loser: string, score: string, leftName?: string, rightName?: string) {
  // assure stop instance active
  if (currentGame && typeof currentGame.stop === 'function') {
    try { currentGame.stop(); } catch(e) { console.warn('failed to stop currentGame', e); }
    currentGame = null;
  }

  app.innerHTML = '';
  const html = `
    <div class="card text-center py-10">
      <h2 class="text-2xl font-semibold mb-4">Victoire</h2>
      <p class="text-lg mb-4"><strong>${winner}</strong> a gagné contre <strong>${loser}</strong> ! </p>
      <div class="flex justify-center gap-4 mt-4">
        <button id="replay" class="btn">Rejouer</button>
        <button id="back" class="btn">Retour au menu</button>
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
      if (currentGame && typeof currentGame.stop === 'function') {
        try { currentGame.stop(); } catch(e) { console.warn(e); }
        currentGame = null;
      }

      // recreate canvas view and new game with same players
      const canvasHtml = `
        <div>
          <button id="back-to-menu" class="small mb-3">← Retour au menu</button>
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
        alert('Le jeu n\'a pas été chargé (Game.js manquant).');
        return;
      }

      // instantiate and keep reference
      currentGame = new GameClassLocal('pong-canvas', leftName || winner, rightName || loser, WINNING_SCORE, (w: string, l: string, s: string) => {
        // stop current and re-render victory when match ends
        if (currentGame && typeof currentGame.stop === 'function') {
          try { currentGame.stop(); } catch(e) { console.warn(e); }
          currentGame = null;
        }
        renderVictory(w, l, s, leftName, rightName);
      });

      // attach back button to stop and go home
      const backToMenu = document.getElementById('back-to-menu');
      if (backToMenu) {
        backToMenu.addEventListener('click', () => {
          if (currentGame && typeof currentGame.stop === 'function') {
            try { currentGame.stop(); } catch(e) { console.warn(e); }
            currentGame = null;
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
      if (currentGame && typeof currentGame.stop === 'function') {
        try { currentGame.stop(); } catch(e) { console.warn(e); }
        currentGame = null;
      }
      navigateTo('home');
      render(getHashPage());
    });
  }
}

function render(page: Page) {
  app.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'card';
  container.appendChild(header());
  const main = document.createElement('main');
  main.className = 'mt-6';
  if (page === 'home') main.appendChild(homeContent());
  if (page === 'versus') main.appendChild(versusContent());
  if (page === 'tournament') main.appendChild(tournamentContent());
  if (page === 'add-user') main.appendChild(addUserContent());
  if (page === 'list-users') main.appendChild(listUsersContent());
  if (page === 'profile') main.appendChild(profileContent());
  container.appendChild(main);
  const footer = elFromHTML(`<footer class="mt-6 small text-center">Petit MVP • Vanilla TS + Tailwind</footer>`);
  container.appendChild(footer);
  app.appendChild(container);
}

// shuffle Fisher-Yates
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// joue un match entre p1 et p2, retourne une Promise qui résout sur le nom du gagnant
function playMatch(p1: string, p2: string, winningScore = WINNING_SCORE): Promise<string> {
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
      alert('Game.js manquant.');
      resolve(p1); // fallback
      return;
    }

    // stop any previous instance
    if (currentGame && typeof currentGame.stop === 'function') {
      try { currentGame.stop(); } catch(e) { console.warn(e); }
      currentGame = null;
    }

    // create game with onGameOver callback
    currentGame = new GameClassLocal('pong-canvas', p1, p2, winningScore, (winner: string, loser: string) => {
      // ensure stop and resolve winner
      if (currentGame && typeof currentGame.stop === 'function') {
        try { currentGame.stop(); } catch(e) { console.warn(e); }
        currentGame = null;
      }
      resolve(winner);
    });
  });
}

/// runner principal du tournoi (async)
async function runTournament(initialPlayers: string[], winningScore = WINNING_SCORE) {
  if (!initialPlayers || initialPlayers.length < 2) {
    alert('Il faut au moins 2 joueurs pour un tournoi.');
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
        <h3 class="text-lg font-medium">Tour ${round} — ${roundPlayers.length} joueurs</h3>
        <button id="abort-tournament" class="btn small">← Retour</button>
      </div>
    `);
    app.appendChild(headerEl);

    // abort handler
    const abortBtn = document.getElementById('abort-tournament');
    if (abortBtn) {
      abortBtn.addEventListener('click', () => {
        tournamentAbort = true;
        // stop current game (if any)
        if (currentGame && typeof currentGame.stop === 'function') {
          try { currentGame.stop(); } catch (e) { console.warn(e); }
          currentGame = null;
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
        const info = elFromHTML(`<div class="card small mt-2">${p1} avance automatiquement (odd player)</div>`);
        app.appendChild(info);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      app.innerHTML = '';
      const preMatch = elFromHTML(`
        <div class="card text-center py-10">
          <h2 class="text-2xl font-semibold mb-3">Prochain match</h2>
          <p class="text-lg mb-6"><strong>${p1}</strong> VS <strong>${p2}</strong></p>
          <button id="start-next" class="btn">
            Commencer le match
          </button>
          <button id="abort-prematch" class="btn small"> Retour</button>
        </div>
      `);
      app.appendChild(preMatch);

      preMatch.querySelector('#abort-prematch')?.addEventListener('click', () => {
        tournamentAbort = true;
        if (currentGame && typeof currentGame.stop === 'function') {
          try { currentGame.stop(); } catch (e) { console.warn(e); }
          currentGame = null;
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
          <h2 class="text-2xl font-semibold mb-3">Victoire de <strong>${winner}</strong> !</h2>
          <p class="text-lg mb-6">(${p1} vs ${p2})</p>
          <button id="next-match" class="btn">
            Match suivant
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
      <h2 class="text-2xl font-semibold mb-4">Champion du tournoi</h2>
      <p class="text-lg mb-4"><strong>${champion}</strong> a gagné le tournoi !</p>
      <div class="flex justify-center gap-4 mt-4">
        <button id="to-home" class="btn">Retour au menu</button>
      </div>
    </div>
  `;
  app.appendChild(elFromHTML(champHtml));
  const toHomeBtn = document.getElementById('to-home');
  if (toHomeBtn) {
    toHomeBtn.addEventListener('click', () => {
      if (currentGame && typeof currentGame.stop === 'function') { try { currentGame.stop(); } catch(e){}}
      navigateTo('home');
      render(getHashPage());
    });
  }
}

function header(): HTMLElement {
  const html = `
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">MVP — Mode de jeu</h1>
        <p class="small mt-1">Choisis un mode puis sélectionne les pseudos.</p>
      </div>
      <div class="small">Critère en haut</div>
    </header>
  `;
  return elFromHTML(html);
}

/* Home */
function homeContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-6 items-center">
      <div class="w-full flex flex-col sm:flex-row gap-4">
        <button id="btn-versus" class="btn">Versus local</button>
        <button id="btn-tournament" class="btn">Tournois</button>
        <button id="btn-profile" class="btn">Profil utilisateur</button>
      </div>
      <div class="w-full flex flex-col sm:flex-row gap-4">
        <button id="btn-add-user" class="btn">Ajouter un utilisateur</button>
        <button id="btn-list-users" class="btn">Lister les utilisateurs</button>
      </div>
      <div class="w-full text-center small">Sélectionne un mode pour commencer.</div>
    </section>
  `;
  const node = elFromHTML(html);
  node.querySelector('#btn-versus')!.addEventListener('click', () => navigateTo('versus'));
  node.querySelector('#btn-tournament')!.addEventListener('click', () => navigateTo('tournament'));
  node.querySelector('#btn-add-user')!.addEventListener('click', () => navigateTo('add-user'));
  node.querySelector('#btn-list-users')!.addEventListener('click', () => navigateTo('list-users'));
  node.querySelector('#btn-profile')!.addEventListener('click', () => navigateTo('profile'));
  return node;
}


/* fetch + user management */
function addUserContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-4 items-center">
      <input id="input-name" placeholder="Nom de l'utilisateur" class="border p-2 rounded" />
      <input id="input-email" placeholder="Email" class="border p-2 rounded" />
      <button id="btn-submit" class="btn">Ajouter</button>
      <button id="btn-back" class="btn small">← Retour</button>
      <div id="msg" class="mt-2 small text-green-700"></div>
    </section>
  `;
  const node = elFromHTML(html);
  const inputName = node.querySelector('#input-name') as HTMLInputElement;
  const inputEmail = node.querySelector('#input-email') as HTMLInputElement;
  const msg = node.querySelector('#msg') as HTMLElement;

  node.querySelector('#btn-submit')!.addEventListener('click', async () => {
    const name = inputName.value.trim();
    const email = inputEmail.value.trim();
    if (!name || !email) {
      msg.textContent = "Le nom et email ne peuvent pas être vide.";
      return;
    }
    try {
      const res = await fetch('/api/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();
      if (data.ok) {
        msg.textContent = `Utilisateur ajouté : ${data.user.name} (${data.user.email})`;
        inputName.value = '';
        inputEmail.value = '';
      } else {
        msg.textContent = `Erreur : ${data.error || 'unknown'}`;
      }
    } catch(e) {
      msg.textContent = `Erreur réseau : ${e}`;
    }
  });

  node.querySelector('#btn-back')!.addEventListener('click', () => navigateTo('home'));
  return node;
}

function profileContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-4 items-center">
      <input id="input-search-user" placeholder="Nom de l'utilisateur" class="border p-2 rounded" />
      <div class="flex gap-2">
        <button id="btn-search" class="btn">Rechercher</button>
        <button id="btn-back" class="btn small">← Retour</button>
      </div>

      <div id="profile-view" class="mt-6 hidden text-center">
        <img id="profile-avatar" class="w-24 h-24 rounded-full border mx-auto mb-4" />
        <p id="profile-name" class="text-lg font-semibold"></p>
        <p id="profile-email" class="small"></p>
        <p id="profile-date" class="small text-gray-600"></p>
      </div>
    </section>
  `;

  const node = elFromHTML(html);
  const input = node.querySelector('#input-search-user') as HTMLInputElement;
  const view = node.querySelector('#profile-view') as HTMLElement;
  const avatarEl = node.querySelector('#profile-avatar') as HTMLImageElement;
  const nameEl = node.querySelector('#profile-name') as HTMLElement;
  const emailEl = node.querySelector('#profile-email') as HTMLElement;
  const dateEl = node.querySelector('#profile-date') as HTMLElement;

  node.querySelector('#btn-back')!.addEventListener('click', () => navigateTo('home'));

  // fallback onerror -> default avatar
  avatarEl.onerror = () => {
    avatarEl.src = '/default-avatar.png';
  };

  node.querySelector('#btn-search')!.addEventListener('click', async () => {
    const name = input.value.trim();
    if (!name) return alert("Entre un nom.");

    // hide view while loading / reset
    view.classList.add('hidden');
    avatarEl.src = ''; // remove any previous src so browser doesn't try to load wrong url
    nameEl.textContent = '';
    emailEl.textContent = '';
    dateEl.textContent = '';

    const res = await fetch(`/api/user/${encodeURIComponent(name)}`);
    if (!res.ok) {
      alert("Utilisateur introuvable.");
      return;
    }
    const data = await res.json();
    if (!data.ok) {
      alert(data.error || "Utilisateur introuvable.");
      return;
    }

    const user = data.user;

    // user.avatar should be the filename saved by the backend; if backend for any reason has full path, take basename:
    const avatarFilename = user.avatar ? user.avatar.split('/').pop() : null;
    // utiliser /api/uploads/ pour s'aligner sur le backend + nginx proxy des /api/
    avatarEl.src = avatarFilename ? `/api/uploads/${avatarFilename}` : '/default-avatar.png';

    nameEl.textContent = user.name;
    emailEl.textContent = user.email || '';
    dateEl.textContent = user.created_at ? "Ajouté le : " + user.created_at : '';

    view.classList.remove('hidden');
  });

  return node;
}

function listUsersContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-2 items-center">
      <button id="btn-back" class="btn small">← Retour</button>
      <ul id="users-list" class="mt-2 border p-2 rounded w-64"></ul>
    </section>
  `;
  const node = elFromHTML(html);
  const ul = node.querySelector('#users-list') as HTMLUListElement;

  node.querySelector('#btn-back')!.addEventListener('click', () => navigateTo('home'));

  // Fetch users depuis l'API
  (async () => {
    try {
      const res = await fetch('/api/users');
      const users = await res.json();
      ul.innerHTML = users.map((u: any) => `<li>${u.id} — ${u.name}</li>`).join('');
    } catch(e) {
      ul.innerHTML = `<li>Erreur lors de la récupération : ${e}</li>`;
    }
  })();

  return node;
}



/* Versus */
function versusContent(): HTMLElement {
  const html = `
    <section>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-medium">Versus (2 joueurs)</h2>
        <button id="back" class="small">← Retour</button>
      </div>
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label class="flex flex-col">
          <span class="small">Joueur 1</span>
          <input id="p1" placeholder="Pseudo du joueur 1" class="mt-1 p-3 rounded-lg border" />
        </label>
        <label class="flex flex-col">
          <span class="small">Joueur 2</span>
          <input id="p2" placeholder="Pseudo du joueur 2" class="mt-1 p-3 rounded-lg border" />
        </label>
      </div>
      <div class="mt-4 flex gap-3">
        <button id="rand" class="btn">Remplir aléatoire</button>
        <button id="start" class="btn">Démarrer</button>
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
    if (currentGame && typeof currentGame.stop === 'function') {
      try { currentGame.stop(); } catch(e) { console.warn(e); }
      currentGame = null;
    }
    navigateTo('home');
  });
  rand.addEventListener('click', () => {
    const samples = ['Alice','Bob','Charlie','Denis','Eve','Fox'];
    const a = samples[Math.floor(Math.random()*samples.length)];
    let b = samples[Math.floor(Math.random()*samples.length)];
    while (b === a) b = samples[Math.floor(Math.random()*samples.length)];
    p1.value = a; p2.value = b;
  });

  start.addEventListener('click', async () => {
    const a = p1.value.trim(); const b = p2.value.trim();
    if (!a || !b || a === b) { alert('Les pseudos doivent être différents et non vides'); return; }
    appState.players = [a,b];
    localStorage.setItem('mvp_players', JSON.stringify(appState.players));
    try {
      await fetch('/api/start-tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: appState.players })
      });
    } catch(e) { console.warn('API call failed', e); }

    // Replace UI by the Pong canvas
    const canvasHtml = `
      <div>
        <button id="back-to-menu" class="small mb-3">← Retour au menu</button>
        <canvas id="pong-canvas" width="800" height="480" style="display:block;margin:0 auto;border:1px solid #111;"></canvas>
      </div>
    `;
    // render canvas view
    app.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.innerHTML = canvasHtml;
    app.appendChild(wrapper);

    // instantiate the game, pass players and onGameOver callback
    const GameClass = (window as any).PongGame;
    if (!GameClass) {
      alert('Le jeu n\'a pas été chargé (Game.js manquant).');
      return;
    }

    // create game and pass callback (use WINNING_SCORE)
    currentGame = new GameClass('pong-canvas', a, b, WINNING_SCORE, (winner: string, loser: string, score: string) => {
      // assure-toi que l'instance est bien stoppée (Game.stop devrait déjà l'avoir fait, mais on double)
      if (currentGame && typeof currentGame.stop === 'function') {
        try { currentGame.stop(); } catch(e) { console.warn('stop failed', e); }
      }
      // clear reference (we'll recreate on replay)
      currentGame = null;

      // render the victory screen
      renderVictory(winner, loser, score, a, b);
    });

    // attach back button to stop and go home
    const backBtn = document.getElementById('back-to-menu');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (currentGame && typeof currentGame.stop === 'function') {
          try { currentGame.stop(); } catch(e) { console.warn(e); }
          currentGame = null;
        }
        navigateTo('home');
        render(getHashPage());
      });
    }
  });

  return node;
}

/* Tournament */
function tournamentContent(): HTMLElement {
  const html = `
    <section>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-medium">Tournoi (max ${MAX_TOURNAMENT_PLAYERS} joueurs)</h2>
        <button id="back" class="small">← Retour</button>
      </div>
      <div id="slots" class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"></div>
      <div class="mt-4 flex gap-3">
        <button id="fill" class="btn">Remplir exemples</button>
        <button id="clear" class="btn">Effacer</button>
        <div class="ml-auto flex items-center gap-3">
          <div class="small">Joueurs prêts: <strong id="count">0</strong></div>
          <button id="start" class="btn">Démarrer</button>
        </div>
      </div>
      <p class="small mt-3">Il faut au moins 2 joueurs pour lancer un tournoi.</p>
    </section>
  `;
  const node = elFromHTML(html);
  const back = node.querySelector('#back') as HTMLButtonElement;
  const slots = node.querySelector('#slots') as HTMLElement;
  const fill = node.querySelector('#fill') as HTMLButtonElement;
  const clear = node.querySelector('#clear') as HTMLButtonElement;
  const countEl = node.querySelector('#count') as HTMLElement;
  const start = node.querySelector('#start') as HTMLButtonElement;

  back.addEventListener('click', () => {
    if (currentGame && typeof currentGame.stop === 'function') {
      try { currentGame.stop(); } catch(e) { console.warn(e); }
      currentGame = null;
    }
    navigateTo('home');
  });

  for (let i = 0; i < MAX_TOURNAMENT_PLAYERS; i++) {
    const slot = elFromHTML(`
      <div class="p-2 border rounded-lg bg-slate-50">
        <div class="small text-slate-500">Slot ${i+1}</div>
        <input id="player-${i}" placeholder="Pseudo #${i+1}" class="w-full mt-2 p-2 rounded-md border" />
      </div>
    `);
    slots.appendChild(slot);
    const input = slot.querySelector('input') as HTMLInputElement;
    input.addEventListener('input', updateCount);
  }

  function readPlayers(): string[] {
    const arr: string[] = [];
    for (let i = 0; i < MAX_TOURNAMENT_PLAYERS; i++) {
      const el = document.getElementById(`player-${i}`) as HTMLInputElement | null;
      if (!el) continue;
      const v = el.value.trim();
      if (v.length > 0) arr.push(v);
    }
    return arr;
  }

  function updateCount() {
    const players = readPlayers();
    countEl.textContent = String(players.length);
  }

  fill.addEventListener('click', () => {
    const samples = ['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot','Golf','Hotel'];
    for (let i = 0; i < MAX_TOURNAMENT_PLAYERS; i++) {
      const el = document.getElementById(`player-${i}`) as HTMLInputElement | null;
      if (el) el.value = samples[i] || '';
    }
    updateCount();
  });

  clear.addEventListener('click', () => {
    for (let i = 0; i < MAX_TOURNAMENT_PLAYERS; i++) {
      const el = document.getElementById(`player-${i}`) as HTMLInputElement | null;
      if (el) el.value = '';
    }
    updateCount();
  });

  start.addEventListener('click', async () => {
    const players = readPlayers();
    if (players.length < 2) { alert('Il faut au moins 2 joueurs'); return; }
    appState.players = players;
    localStorage.setItem('mvp_players', JSON.stringify(players));
    try {
      await fetch('/api/start-tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players })
      });
    } catch(e) { console.warn('API call failed', e); }

    // lancer le tournoi avec WINNING_SCORE
    runTournament(players, WINNING_SCORE);
  });

  updateCount();
  return node;
}

/* Init routing */
window.addEventListener('hashchange', () => render(getHashPage()));
render(getHashPage());