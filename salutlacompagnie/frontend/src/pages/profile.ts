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

        <!-- FRIENDS SECTION -->
        <div id="friends-area" class="mt-6 w-full max-w-2xl">
          <h3 class="text-lg font-medium mb-2">Amis</h3>

          <div class="flex gap-2 items-center mb-3">
            <input id="friend-search" class="border p-2 rounded flex-1" placeholder="Rechercher un utilisateur par pseudo" />
            <button id="friend-search-btn" class="btn small">Rechercher</button>
            <button id="friend-requests-btn" class="btn small">Demandes <span id="requests-badge" class="ml-1 text-sm text-red-600"></span></button>
          </div>

          <div id="friend-search-result" class="mb-3"></div>

          <div id="friend-requests-panel" class="mb-3 hidden">
            <h4 class="font-medium">Demandes entrantes</h4>
            <div id="friend-requests-list" class="flex flex-col gap-2 mt-2"></div>
          </div>

          <div id="friend-list" class="flex flex-col gap-2 max-h-64 overflow-y-auto"></div>
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
        (state as any).appState.currentUser = { id: currentUser.id, name: currentUser.name, email: currentUser.email, avatar: currentUser.avatar };
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
  if ((state as any)?.appState?.currentUser) (state as any).appState.currentUser.avatar = data.avatar;
      // update header avatar if present
      try {
        const hdr = document.getElementById('hdr-avatar') as HTMLImageElement | null;
        if (hdr) hdr.src = `${url}?t=${Date.now()}`;
      } catch (e) {}
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

  // ---------------- FRIENDS LOGIC ----------------
  const friendListEl = node.querySelector('#friend-list') as HTMLElement;
  const friendSearchInput = node.querySelector('#friend-search') as HTMLInputElement;
  const friendSearchBtn = node.querySelector('#friend-search-btn') as HTMLButtonElement;
  const friendSearchResult = node.querySelector('#friend-search-result') as HTMLElement;
  const friendRequestsBtn = node.querySelector('#friend-requests-btn') as HTMLButtonElement;
  const friendRequestsPanel = node.querySelector('#friend-requests-panel') as HTMLElement;
  const friendRequestsList = node.querySelector('#friend-requests-list') as HTMLElement;
  const requestsBadge = node.querySelector('#requests-badge') as HTMLElement;

  async function loadFriendsList() {
    try {
      const res = await fetch('/api/friends', { credentials: 'same-origin' });
      if (!res.ok) return;
      const json = await res.json();
      if (!json.ok) return;
      const friends = json.friends || [];
      friendListEl.innerHTML = '';
      for (const f of friends) {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-3 p-2 border rounded';
        row.setAttribute('data-user-id', String(f.id));
        const onlineClass = f.online ? 'bg-green-500' : 'bg-gray-400';
        row.innerHTML = `
          <span class="presence-dot w-3 h-3 rounded-full ${onlineClass} inline-block"></span>
          <strong class="ml-2">${escapeHtml(f.name)}</strong>
          <span class="small ml-auto">${escapeHtml(f.email)}</span>
          <button class="btn small ml-2 remove-friend">Supprimer</button>
        `;
        const removeBtn = row.querySelector('.remove-friend') as HTMLButtonElement;
        removeBtn.addEventListener('click', async () => {
          await fetch('/api/friends/remove', {
            method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friend_id: f.id })
          });
          await loadFriendsList();
        });
        friendListEl.appendChild(row);
      }
    } catch (err) {
      console.error('loadFriendsList', err);
    }
  }

  async function searchUser(name: string) {
    try {
      const res = await fetch(`/api/user/${encodeURIComponent(name)}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.ok) return null;
      return json.user;
    } catch (err) {
      return null;
    }
  }

  friendSearchBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    friendSearchResult.innerHTML = '';
    const q = friendSearchInput.value.trim();
    if (!q) return;
    friendSearchResult.innerHTML = '<div class="small">Recherche...</div>';
    const user = await searchUser(q);
    if (!user) { friendSearchResult.innerHTML = '<div class="small">Utilisateur non trouvé</div>'; return; }
    const div = document.createElement('div');
    div.className = 'p-2 border rounded flex items-center gap-3';
    div.innerHTML = `
      <strong>${escapeHtml(user.name)}</strong>
      <span class="small ml-auto">${escapeHtml(user.email || '')}</span>
      <button id="add-friend-btn" class="btn small ml-2">Ajouter</button>
    `;
    friendSearchResult.innerHTML = '';
    friendSearchResult.appendChild(div);
    (div.querySelector('#add-friend-btn') as HTMLButtonElement).addEventListener('click', async () => {
      try {
        const res = await fetch('/api/friends/request', {
          method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friend_id: user.id })
        });
        const j = await res.json();
        if (j.ok) {
          friendSearchResult.innerHTML = '<div class="small text-green-600">Demande envoyée ✔️</div>';
          await loadFriendsList();
        } else {
          friendSearchResult.innerHTML = `<div class="small text-red-600">${escapeHtml(j.error || 'Erreur')}</div>`;
        }
      } catch (err) {
        friendSearchResult.innerHTML = '<div class="small text-red-600">Erreur réseau</div>';
      }
    });
  });

  friendRequestsBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (friendRequestsPanel.classList.contains('hidden')) {
      await loadFriendRequests();
      friendRequestsPanel.classList.remove('hidden');
    } else {
      friendRequestsPanel.classList.add('hidden');
    }
  });

  async function loadFriendRequests() {
    try {
      const res = await fetch('/api/friends/requests', { credentials: 'same-origin' });
      if (!res.ok) return;
      const json = await res.json();
      if (!json.ok) return;
      friendRequestsList.innerHTML = '';
      const reqs = json.requests || [];
      requestsBadge.textContent = reqs.length ? String(reqs.length) : '';
      for (const r of reqs) {
        const item = document.createElement('div');
        item.className = 'p-2 border rounded flex items-center gap-3';
        item.innerHTML = `
          <div><strong>${escapeHtml(r.requester_name)}</strong><div class="small">${escapeHtml(r.requester_email)}</div></div>
          <div class="ml-auto flex gap-2">
            <button class="btn small accept-btn">Accepter</button>
            <button class="btn small reject-btn">Refuser</button>
          </div>
        `;
        (item.querySelector('.accept-btn') as HTMLButtonElement).addEventListener('click', async () => {
          await respondRequest(r.id, 'accept');
          await loadFriendRequests();
          await loadFriendsList();
        });
        (item.querySelector('.reject-btn') as HTMLButtonElement).addEventListener('click', async () => {
          await respondRequest(r.id, 'reject');
          await loadFriendRequests();
        });
        friendRequestsList.appendChild(item);
      }
    } catch (err) { console.error('loadFriendRequests', err); }
  }

  async function respondRequest(request_id: number, action: 'accept' | 'reject') {
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, action })
      });
      if (!res.ok) return;
      await res.json();
    } catch (err) { console.error('respondRequest', err); }
  }

  // presence updates from presence WS (if available)
  function attachPresenceListener() {
    try {
      const client = (state as any)?.appState?.ws;
      const ws = client?.socket || client; // client may be wrapper exposing .socket
      if (!ws) return;
      ws.addEventListener('message', (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === 'presence') {
            const userId = String(data.userId);
            const online = !!data.online;
            const el = friendListEl.querySelector(`[data-user-id="${userId}"] .presence-dot`);
            if (el) {
              el.classList.toggle('bg-green-500', online);
              el.classList.toggle('bg-gray-400', !online);
            }
          }
        } catch (e) {}
      });
    } catch (e) {}
  }

  // init friends UI after profile loaded
  async function initFriends() {
    await loadFriendsList();
    await loadFriendRequests();
    attachPresenceListener();
  }

  // initial load + init friends UI after profile loaded
  loadProfile().then(() => {
    initFriends();
  }).catch((e) => { console.error('init profile error', e); });

  return node;
}
