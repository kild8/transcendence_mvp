import { elFromHTML } from '../utils.js';
import { getHashPage } from '../router.js';
import { navigateTo } from '../router.js';
import { state } from '../state.js'; // si ton projet exporte state (optionnel mais pratique)
import { t } from "../lang/langIndex.js";

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
        <img id="profile-avatar" class="w-24 h-24 rounded-full border border-[#333333] mx-auto mb-4" src="/default-avatar.png" />
        <div class="flex gap-2 justify-center mb-2">
          <form id="avatar-form" class="flex items-center gap-2" enctype="multipart/form-data">
            <input type="file" id="avatar-input" accept="image/*" class="text-sm text-[#9ca3af]" />
            <button type="submit" id="avatar-submit" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff]">${t(state.lang, "Profile.CHANGE_AVATAR")}</button>
          </form>
        </div>

        <div class="mb-2">
          <strong id="profile-name" class="text-lg"></strong>
          <button id="edit-name" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff] ml-2">${t(state.lang, "Profile.EDIT")}</button>
        </div>

        <div class="mb-2">
          <label for="profile-language" class="text-sm text-[#9ca3af] mr-2">${t(state.lang, "Profile.LANGUAGE")}</label>
          <select id="hdr-lang"class="bg-gray-800 text-white border border-gray-600 rounded p-1 text-sm"title="Langue">
            <option value="en" style="background-color: dark-gray;">EN</option>
            <option value="fr" style="background-color: dark-gray;">FR</option>
            <option value="de" style="background-color: dark-gray;">DE</option>
          </select>
          <button id="save-language" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff] ml-2">${t(state.lang, "Profile.SAVE")}</button>
          <div id="lang-msg" class="text-sm text-red-600 mt-1"></div>
        </div>

        <div id="edit-name-form" class="hidden mb-2">
          <input id="new-name" class="bg-[#0a0a0a] text-[#ffffff] border border-[#333333] p-2 rounded mr-2" placeholder="Nouveau pseudo" />
          <button id="save-name" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff]">${t(state.lang, "Profile.SAVE")}</button>
          <button id="cancel-name" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff]">${t(state.lang, "Profile.CANCEL")}</button>
          <div id="name-msg" class="text-sm text-red-600 mt-1"></div>
        </div>

        <p id="profile-email" class="text-sm text-[#9ca3af]"></p>
        <p id="profile-date" class="text-sm text-gray-600"></p>

        <div class="mt-4 text-sm">
          <span id="wins-losses">0 win | 0 lose</span>
        </div>

        <div class="mt-4 flex gap-2 justify-center">
          <button id="btn-history" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff]">${t(state.lang, "Profile.SHOW_HISTORY")}</button>
          <button id="btn-back" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff]">${t(state.lang, "Profile.BACK")}</button>
        </div>

        <!-- FRIENDS SECTION -->
        <div id="friends-area" class="mt-6 w-full max-w-2xl">
          <h3 class="text-lg font-medium mb-2">${t(state.lang, "Profile.FRIENDS")}</h3>

          <div class="flex gap-2 items-center mb-3">
            <input id="friend-search" class="bg-[#0a0a0a] text-[#ffffff] border border-[#333333] p-2 rounded flex-1" placeholder="${t(state.lang, "Profile.SEARCH_USER_PLACEHOLDER")}" />
            <button id="friend-search-btn" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff]">${t(state.lang, "Profile.SEARCH")}</button>
            <button id="friend-requests-btn" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff]">${t(state.lang, "Profile.REQUESTS")}<span id="requests-badge" class="ml-1 text-sm text-red-600"></span></button>
          </div>

          <div id="friend-search-result" class="mb-3"></div>

          <div id="friend-requests-panel" class="mb-3 hidden">
            <h4 class="font-medium">${t(state.lang, "Profile.INCOMING_REQUESTS")}</h4>
            <div id="friend-requests-list" class="flex flex-col gap-2 mt-2"></div>
          </div>

          <div id="friend-list" class="flex flex-col gap-2 max-h-64 overflow-y-auto"></div>
        </div>

        <div id="history-area" class="mt-4 w-full max-w-2xl hidden">
          <h3 class="text-lg font-medium mb-2">${t(state.lang, "Profile.MATCH_HISTORY")}</h3>
          <div id="history-list" class="flex flex-col gap-2 text-sm"></div>
        </div>

        <p id="profile-msg" class="text-sm text-green-700 mt-3"></p>
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
        // preserve any existing session-level preference (set by header),
        // otherwise prefer a stored localStorage session value, then fallback to persisted user.language
        const existingSession = (state as any).appState.currentUser && (state as any).appState.currentUser.language_session;
        const storedSession = (function() { try { return localStorage.getItem('language_session'); } catch (e) { return null; } })();
        (state as any).appState.currentUser = {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
          language: (currentUser as any).language,
          language_session: existingSession || storedSession || (currentUser as any).language
        } as any;
      }

      // fill UI (currentUser is guaranteed non-null here)
      nameEl.textContent = currentUser.name;
      emailEl.textContent = currentUser.email || '';
      dateEl.textContent = currentUser.created_at ? t(state.lang, "Profile.ADDED_ON", { date: currentUser.created_at }) : '';
      const avatarFilename = currentUser.avatar ? String(currentUser.avatar).split('/').pop() : null;
      avatarEl.src = avatarFilename ? `/api/uploads/${avatarFilename}` : '/default-avatar.png';
      profileMsg.textContent = '';

      // initialize language select if present — show the persisted user preference (don't auto-save session)
      try {
        const sel = node.querySelector('#profile-language') as HTMLSelectElement | null;
        if (sel && currentUser) {
          // prefer persisted user.language (what is stored as preference), then fallback to session
          const sessionLang = (state as any).appState.currentUser && (state as any).appState.currentUser.language_session;
          sel.value = (currentUser as any).language || sessionLang || 'en';
        }
      } catch (e) {}

      // load matches to compute wins/losses, but don't show history yet
      await loadMatchesSummary();
    } catch (err) {
      console.error('loadProfile failed', err);
      profileMsg.textContent = t(state.lang, "Profile.NETWORK_ERROR");
    }
  }

  // --- upload avatar (we include userId to keep backend compatibility) ---
  avatarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    profileMsg.textContent = '';
    if (!currentUser) { profileMsg.textContent = t(state.lang, "Profile.USER_NOT_LOADED"); return; }
    const file = avatarInput.files?.[0];
    if (!file) { profileMsg.textContent = t(state.lang, "Profile.IMAGE_REQUIRED"); return; }

    avatarSubmit.disabled = true;
    profileMsg.textContent = t(state.lang, "Profile.UPLOAD_IN_PROGRESS");

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
        const text = await res.text();
        console.error('upload failed', res.status, text);
        profileMsg.textContent = t(state.lang, "Profile.UPLOAD_FAIL");
        return;
      }
      const data = await res.json();
      if (!data.ok) {
        profileMsg.textContent = data.error ? t(state.lang, data.error) : t(state.lang, "Profile.SERVER_ERROR");
        return;
      }
      const url = data.url ? data.url : `/api/uploads/${data.avatar}`;
      avatarEl.src = `${url}?t=${Date.now()}`;
      profileMsg.textContent = t(state.lang, "Profile.AVATAR_UPDATED");
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
      profileMsg.textContent = t(state.lang, "Profile.UPLOAD_FAILED");
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
    if (!newName) { nameMsg.textContent = t(state.lang, "Profile.NAME_EMPTY"); return; }
    saveNameBtn.disabled = true;
    nameMsg.textContent = t(state.lang, "Profile.HISTORY_LOADING");

    try {
      const res = await fetch('/api/user/me', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('rename failed', res.status, text);
        nameMsg.textContent = t(state.lang, "Profile.NAME_UPDATE_FAIL");
        return;
      }
      const data = await res.json();
      if (!data.ok) {
        profileMsg.textContent = data.error ? t(state.lang, data.error) : t(state.lang, "Profile.SERVER_ERROR");
        return;
      }
      // update UI & state (currentUser exists here)
      if (currentUser) currentUser.name = newName;
      nameEl.textContent = newName;
      if ((state as any)?.appState?.currentUser) (state as any).appState.currentUser.name = newName;
      nameMsg.textContent = t(state.lang, "Profile.NAME_UPDATED");
      editForm.classList.add('hidden');
    } catch (err) {
      console.error('rename error', err);
      nameMsg.textContent = t(state.lang, "Profile.NETWORK_ERROR");
    } finally {
      saveNameBtn.disabled = false;
      setTimeout(() => { nameMsg.textContent = ''; }, 2500);
    }
  });

  // --- language save ---
  const profileLangSelect = node.querySelector('#profile-language') as HTMLSelectElement | null;
  const saveLangBtn = node.querySelector('#save-language') as HTMLButtonElement | null;
  const langMsg = node.querySelector('#lang-msg') as HTMLElement | null;

  if (saveLangBtn && profileLangSelect) {
    saveLangBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!currentUser) return;
      const newLang = (profileLangSelect.value || 'en') as 'en' | 'fr' | 'de';
      saveLangBtn.disabled = true;
      if (langMsg) { langMsg.textContent = t(state.lang, "Profile.LANG_SAVING"); }
      try {
        const res = await fetch('/api/user/me', {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: newLang })
        });
        if (!res.ok) {
          const text = await res.text();
          console.error('save language failed', res.status, text);
          if (langMsg) langMsg.textContent = t(state.lang, "Profile.LANG_SAVE_ERROR");
          return;
        }
        const data = await res.json();
        if (!data.ok) {
          if (langMsg) langMsg.textContent = data.error? t(state.lang, data.error) : t(state.lang, "PROFILE.NETWORK_ERROR");
          return;
        }
        // update local state and UI: persisted language and session language
        currentUser = { ...currentUser, language: data.user.language } as any;
        if ((state as any)?.appState?.currentUser) {
          (state as any).appState.currentUser.language = data.user.language;
          // also update session-level selection so header/other pages reflect user's choice immediately
          (state as any).appState.currentUser.language_session = data.user.language;
          try { localStorage.setItem('language_session', data.user.language); } catch (e) { /* ignore */ }
        }
        if (langMsg) { langMsg.textContent = t(state.lang, "Profile.LANG_SAVED"); }
        // also update header select if present
        try {
          const hdr = document.getElementById('hdr-lang') as HTMLSelectElement | null;
          if (hdr) hdr.value = data.user.language;
        } catch (e) {}
        // re-render to apply translations
        try { navigateTo(getHashPage()); } catch (e) { /* ignore */ }
      } catch (err) {
        console.error('save language error', err);
        if (langMsg) langMsg.textContent = t(state.lang, "PROFILE.NETWORK_ERROR");
      } finally {
        saveLangBtn.disabled = false;
        setTimeout(() => { if (langMsg) langMsg.textContent = ''; }, 2500);
      }
    });
  }

  // --- matches summary & history ---
  async function loadMatchesSummary() {
    try {
      const res = await fetch('/api/matches/me', { credentials: 'same-origin' });
      if (!res.ok) { winsLossesEl.textContent = t(state.lang, "Profile.WINS_LOSSES", {wins: 0, losses: 0}); return; }
      const json = await res.json();
      if (!json.ok) { winsLossesEl.textContent = t(state.lang, "Profile.WINS_LOSSES", {wins: 0, losses: 0}); return; }
      matchesCache = json.matches || [];

      // compute wins / losses comparing winner_name with current user's name
      const myName = currentUser ? currentUser.name : '';
      let wins = 0;
      for (const m of matchesCache) {
        if (m.winner_name === myName) wins++;
      }
      const losses = (matchesCache.length - wins);
      winsLossesEl.textContent = t(state.lang, "Profile.WINS_LOSSES", {wins, losses});
    } catch (err) {
      console.error('loadMatchesSummary failed', err);
      winsLossesEl.textContent = t(state.lang, "Profile.WINS_LOSSES", {wins: 0, losses: 0});
    }
  }

  btnHistory.addEventListener('click', async (e) => {
    e.preventDefault();
    profileMsg.textContent = '';
    historyArea.classList.remove('hidden');
    historyList.innerHTML = `<div class="small">${t(state.lang, "Profile.HISTORY_LOADING")}</div>`;

    try {
      // reuse cache if present
      if (matchesCache.length === 0) await loadMatchesSummary();
      if (!matchesCache || matchesCache.length === 0) {
        historyList.innerHTML = `<div class="small">${t(state.lang, "Profile.NO_MATCHES")}</div>`;
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
      historyList.innerHTML = `<div class="small text-red-600">${t(state.lang, "Profile.HISTORY_LOAD_ERROR")}</div>`;
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
          <button class="btn small ml-2 remove-friend">${t(state.lang, "Profile.REMOVE")}</button>
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
    friendSearchResult.innerHTML = `<div class="small">${t(state.lang, "Profile.SEARCHING")}</div>`;
    const user = await searchUser(q);
    if (!user) { friendSearchResult.innerHTML = `<div class="small">${t(state.lang, "Profile.USER_NOT_FOUND")}</div>`; return; }
    const div = document.createElement('div');
    div.className = 'p-2 border rounded flex items-center gap-3';
    div.innerHTML = `
      <strong>${escapeHtml(user.name)}</strong>
      <span class="small ml-auto">${escapeHtml(user.email || '')}</span>
      <button id="add-friend-btn" class="btn small ml-2">${t(state.lang, "Profile.ADD")}</button>
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
          friendSearchResult.innerHTML = `<div class="small text-green-600">${t(state.lang, "Profile.REQUEST_SENT")}</div>`;
          await loadFriendsList();
        } else {
          friendSearchResult.innerHTML = `<div class="small text-red-600">${escapeHtml(j.error ? t(state.lang, j.error) : t(state.lang, "Profile.SERVER_ERROR"))}</div>`;
        }
      } catch (err) {
        friendSearchResult.innerHTML = `<div class="small text-red-600">${t(state.lang, "Profile.NETWORK_ERROR")}</div>`;
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
            <button class="btn small accept-btn">${t(state.lang, "Profile.ACCEPT")}</button>
            <button class="btn small reject-btn">${t(state.lang, "Profile.REJECT")}</button>
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
