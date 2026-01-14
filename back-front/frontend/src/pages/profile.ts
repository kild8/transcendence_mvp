import { elFromHTML } from '../utils.js';
import { navigateTo } from '../router.js';
import { state } from '../state.js'; // si ton projet exporte state (optionnel mais pratique)

/**
 * Profile page — affiche le profil de l'utilisateur connecté,
 * permet de changer le pseudo, uploader un avatar et voir l'historique.
 */
export function profileContent(): HTMLElement {
  let currentUser: { id: number, name: string, email: string, avatar?: string, created_at?: string } | null = null;
  // initialize as empty array to avoid "possibly null" errors
  let matchesCache: any[] = [];

  const html = `
    <section class="mt-6 flex flex-col gap-4 items-center">
      <div id="profile-view" class="mt-6 text-center">
        <img id="profile-avatar" class="w-24 h-24 rounded-full border mx-auto mb-4" src="/default-avatar.png" />
        <div class="flex gap-2 justify-center mb-2">
          <form id="avatar-form" class="flex items-center gap-2" enctype="multipart/form-data">
            <input type="file" id="avatar-input" accept="image/*" class="small" />
            <button type="submit" id="avatar-submit" class="btn small">Changer l’avatar</button>
          </form>
        </div>

        <div class="mb-2">
          <strong id="profile-name" class="text-lg"></strong>
          <button id="edit-name" class="btn small ml-2">Modifier</button>
        </div>

        <div id="edit-name-form" class="hidden mb-2">
          <input id="new-name" class="border p-2 rounded mr-2" placeholder="Nouveau pseudo" />
          <button id="save-name" class="btn small">Sauvegarder</button>
          <button id="cancel-name" class="btn small">Annuler</button>
          <div id="name-msg" class="small text-red-600 mt-1"></div>
        </div>

        <p id="profile-email" class="small"></p>
        <p id="profile-date" class="small text-gray-600"></p>

        <div class="mt-4 small">
          <span id="wins-losses">0 win | 0 lose</span>
        </div>

        <div class="mt-4 flex gap-2 justify-center">
          <button id="btn-history" class="btn small">Afficher l'historique</button>
          <button id="btn-back" class="btn small">← Retour</button>
        </div>

        <div id="history-area" class="mt-4 w-full max-w-2xl hidden">
          <h3 class="text-lg font-medium mb-2">Historique des parties</h3>
          <div id="history-list" class="flex flex-col gap-2 small"></div>
        </div>

        <p id="profile-msg" class="small text-green-700 mt-3"></p>
      </div>
    </section>
  `;

  const node = elFromHTML(html);
  const avatarEl = node.querySelector('#profile-avatar') as HTMLImageElement;
  const avatarForm = node.querySelector('#avatar-form') as HTMLFormElement;
  const avatarInput = node.querySelector('#avatar-input') as HTMLInputElement;
  const avatarSubmit = node.querySelector('#avatar-submit') as HTMLButtonElement;

  const nameEl = node.querySelector('#profile-name') as HTMLElement;
  const emailEl = node.querySelector('#profile-email') as HTMLElement;
  const dateEl = node.querySelector('#profile-date') as HTMLElement;

  const editBtn = node.querySelector('#edit-name') as HTMLButtonElement;
  const editForm = node.querySelector('#edit-name-form') as HTMLElement;
  const newNameInput = node.querySelector('#new-name') as HTMLInputElement;
  const saveNameBtn = node.querySelector('#save-name') as HTMLButtonElement;
  const cancelNameBtn = node.querySelector('#cancel-name') as HTMLButtonElement;
  const nameMsg = node.querySelector('#name-msg') as HTMLElement;

  const winsLossesEl = node.querySelector('#wins-losses') as HTMLElement;
  const btnHistory = node.querySelector('#btn-history') as HTMLButtonElement;
  const historyArea = node.querySelector('#history-area') as HTMLElement;
  const historyList = node.querySelector('#history-list') as HTMLElement;

  const profileMsg = node.querySelector('#profile-msg') as HTMLElement;
  const backBtn = node.querySelector('#btn-back') as HTMLButtonElement;

  backBtn.addEventListener('click', () => navigateTo('home'));
  avatarEl.onerror = () => { avatarEl.src = '/default-avatar.png'; };

  // --- load current user from /api/me (also updates state if available) ---
  async function loadProfile() {
    try {
      const res = await fetch('/api/me', { credentials: 'same-origin' });
      const json = await res.json();
      if (!json.ok) {
        // not logged: redirect to login
        navigateTo('login');
        return;
      }
      currentUser = json.user;

      // guard: ensure currentUser is present before using it
      if (!currentUser) {
        navigateTo('login');
        return;
      }

      // optionally keep global state in sync (guarded)
      if ((state as any)?.appState) {
        (state as any).appState.currentUser = { id: currentUser.id, name: currentUser.name, email: currentUser.email };
      }

      // fill UI (currentUser is guaranteed non-null here)
      nameEl.textContent = currentUser.name;
      emailEl.textContent = currentUser.email || '';
      dateEl.textContent = currentUser.created_at ? `Ajouté le : ${currentUser.created_at}` : '';
      const avatarFilename = currentUser.avatar ? String(currentUser.avatar).split('/').pop() : null;
      avatarEl.src = avatarFilename ? `/api/uploads/${avatarFilename}` : '/default-avatar.png';
      profileMsg.textContent = '';

      // load matches to compute wins/losses, but don't show history yet
      await loadMatchesSummary();
    } catch (err) {
      console.error('loadProfile failed', err);
      profileMsg.textContent = "Erreur réseau — impossible de charger le profil";
    }
  }

  // --- upload avatar (we include userId to keep backend compatibility) ---
  avatarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    profileMsg.textContent = '';
    if (!currentUser) { profileMsg.textContent = 'Utilisateur non chargé'; return; }
    const file = avatarInput.files?.[0];
    if (!file) { profileMsg.textContent = 'Choisis une image'; return; }

    avatarSubmit.disabled = true;
    profileMsg.textContent = 'Upload en cours...';

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', String(currentUser.id)); // backend actuel attend userId

      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });

      if (!res.ok) {
        const t = await res.text();
        console.error('upload failed', res.status, t);
        profileMsg.textContent = 'Erreur lors de l\'upload';
        return;
      }
      const data = await res.json();
      if (!data.ok) {
        profileMsg.textContent = data.error || 'Erreur serveur';
        return;
      }
      const url = data.url ? data.url : `/api/uploads/${data.avatar}`;
      avatarEl.src = `${url}?t=${Date.now()}`;
      profileMsg.textContent = 'Avatar mis à jour ✔️';
      // update state and local currentUser.avatar
      currentUser.avatar = data.avatar;
      if ((state as any)?.appState?.currentUser) (state as any).appState.currentUser.name = currentUser.name;
    } catch (err) {
      console.error('avatar upload error', err);
      profileMsg.textContent = 'Erreur réseau pendant l\'upload';
    } finally {
      avatarSubmit.disabled = false;
    }
  });

  // --- edit name UI ---
  editBtn.addEventListener('click', (e) => {
    e.preventDefault();
    nameMsg.textContent = '';
    newNameInput.value = currentUser ? currentUser.name : '';
    editForm.classList.remove('hidden');
  });
  cancelNameBtn.addEventListener('click', (e) => {
    e.preventDefault();
    editForm.classList.add('hidden');
    nameMsg.textContent = '';
  });

  // Save new name: calls PUT /api/user/me  (see backend snippet plus instructions)
  saveNameBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const newName = newNameInput.value.trim();
    if (!newName) { nameMsg.textContent = 'Le pseudo ne peut pas être vide'; return; }
    saveNameBtn.disabled = true;
    nameMsg.textContent = 'En cours...';

    try {
      const res = await fetch('/api/user/me', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (!res.ok) {
        const t = await res.text();
        console.error('rename failed', res.status, t);
        nameMsg.textContent = 'Erreur lors de la modification';
        return;
      }
      const data = await res.json();
      if (!data.ok) {
        nameMsg.textContent = data.error || 'Erreur serveur';
        return;
      }
      // update UI & state (currentUser exists here)
      if (currentUser) currentUser.name = newName;
      nameEl.textContent = newName;
      if ((state as any)?.appState?.currentUser) (state as any).appState.currentUser.name = newName;
      nameMsg.textContent = 'Pseudo mis à jour ✔️';
      editForm.classList.add('hidden');
    } catch (err) {
      console.error('rename error', err);
      nameMsg.textContent = 'Erreur réseau';
    } finally {
      saveNameBtn.disabled = false;
      setTimeout(() => { nameMsg.textContent = ''; }, 2500);
    }
  });

  // --- matches summary & history ---
  async function loadMatchesSummary() {
    try {
      const res = await fetch('/api/matches/me', { credentials: 'same-origin' });
      if (!res.ok) { winsLossesEl.textContent = '0 win | 0 lose'; return; }
      const json = await res.json();
      if (!json.ok) { winsLossesEl.textContent = '0 win | 0 lose'; return; }
      matchesCache = json.matches || [];

      // compute wins / losses comparing winner_name with current user's name
      const myName = currentUser ? currentUser.name : '';
      let wins = 0;
      for (const m of matchesCache) {
        if (m.winner_name === myName) wins++;
      }
      const losses = (matchesCache.length - wins);
      winsLossesEl.textContent = `${wins} win | ${losses} lose`;
    } catch (err) {
      console.error('loadMatchesSummary failed', err);
      winsLossesEl.textContent = '0 win | 0 lose';
    }
  }

  btnHistory.addEventListener('click', async (e) => {
    e.preventDefault();
    profileMsg.textContent = '';
    historyArea.classList.remove('hidden');
    historyList.innerHTML = '<div class="small">Chargement...</div>';

    try {
      // reuse cache if present
      if (matchesCache.length === 0) await loadMatchesSummary();
      if (!matchesCache || matchesCache.length === 0) {
        historyList.innerHTML = '<div class="small">Aucune partie trouvée.</div>';
        return;
      }
      // render list
      historyList.innerHTML = '';
      for (const m of matchesCache) {
        const item = document.createElement('div');
        item.className = 'p-2 border rounded';
        // safe formatting
        const created = new Date(m.created_at).toLocaleString();
        item.innerHTML = `
          <div class="flex justify-between">
            <div class="small">
              <strong>${escapeHtml(m.player1_name)}</strong> vs <strong>${escapeHtml(m.player2_name)}</strong>
              — ${m.score_player1} : ${m.score_player2}
            </div>
            <div class="small text-gray-600">${escapeHtml(m.winner_name)} • ${escapeHtml(created)}</div>
          </div>
        `;
        historyList.appendChild(item);
      }
    } catch (err) {
      console.error('load history failed', err);
      historyList.innerHTML = '<div class="small text-red-600">Erreur lors du chargement de l\'historique</div>';
    }
  });

  // --- helper ---
  function escapeHtml(s: string) {
    return String(s || '').replace(/&/g, "&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }

  // initial load
  loadProfile();

  return node;
}
