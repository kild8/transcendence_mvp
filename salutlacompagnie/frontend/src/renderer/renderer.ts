import { elFromHTML } from '../utils.js';
import { Page } from '../router.js';
import { state } from '../state.js';
import { getHashPage } from '../router.js';
import { navigateTo } from '../router.js';
import { loginContent } from '../pages/login.js'
import { homeContent } from '../pages/home.js';
import { versusContent } from '../pages/versus.js';
import { tournamentContent } from '../pages/tournament.js';
import { addUserContent } from '../pages/add-user.js';
import { listUsersContent } from '../pages/list-users.js';
import { profileContent } from '../pages/profile.js';
import { registerContent } from '../pages/register.js';
import { onlineContent } from '../pages/online.js';
import { t } from '../lang/langIndex.js';

export const app = document.getElementById('app')!;

export const protectedPages: Page[] = [
  'home',
  'versus',
  'tournament',
  'add-user',
  'list-users',
  'profile',
  'online'
];

export function render(page: Page) {

  // protect to see the site without login
  if (protectedPages.includes(page) && !state.appState.currentUser) {
    navigateTo('login');
    return;
  }

  app.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'bg-[#111111] rounded-[12px] border border-[#ffffff] shadow-[0_0_8px_#ffffff] p-5 w-full max-w-[900px] mx-auto text-center';
  container.appendChild(header());

  const main = document.createElement('main');
  main.className = 'mt-6';

  if (page === 'login') main.appendChild(loginContent());
  if (page === 'register') main.appendChild(registerContent());
  if (page === 'home') main.appendChild(homeContent());
  if (page === 'versus') main.appendChild(versusContent());
  if (page === 'tournament') main.appendChild(tournamentContent());
  if (page === 'add-user') main.appendChild(addUserContent());
  if (page === 'list-users') main.appendChild(listUsersContent());
  if (page === 'profile') main.appendChild(profileContent());
  if (page === 'online') main.appendChild(onlineContent());

  container.appendChild(main);

  app.appendChild(container);
}

function header(): HTMLElement {
  const html = `
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Transcendence PONG</h1>
      </div>
      <div id="header-right" class="flex items-center gap-3"></div>
    </header>
  `;
  const node = elFromHTML(html);
  const right = node.querySelector('#header-right') as HTMLElement;

  // Si l'utilisateur est connecté -> afficher son avatar + nom + profile + logout
  if (state.appState.currentUser) {
    const name = state.appState.currentUser.name || t(state.lang, "Renderer.USER");
    // compute avatar src:
    const rawAvatar = (state.appState.currentUser as any).avatar;
    const avatarSrc = (function () {
      if (!rawAvatar) return '/default-avatar.png';
      // si c'est déjà un chemin (contient /) on le prend tel quel (relatif ou absolu)
      if (String(rawAvatar).includes('/')) {
        return String(rawAvatar).startsWith('/') ? String(rawAvatar) : `/${String(rawAvatar)}`;
      }
      // sinon on suppose que c'est un filename stocké dans /api/uploads/
      return `/api/uploads/${String(rawAvatar)}`;
    })();

    right.innerHTML = `
      <div class="flex items-center gap-3">
        <img id="hdr-avatar" src="${escapeHtml(avatarSrc)}" alt="avatar" class="w-8 h-8 rounded-full cursor-pointer" />
        <div class="text-sm text-[#9ca3af]">${t(state.lang, "Renderer.HELLO")} <strong id="hdr-username">${escapeHtml(name)}</strong></div>
        <select id="hdr-lang"class="bg-gray-800 text-white border border-gray-600 rounded p-1 text-sm"title="Langue">
          <option value="en" style="background-color: dark-gray;">EN</option>
          <option value="fr" style="background-color: dark-gray;">FR</option>
          <option value="de" style="background-color: dark-gray;">DE</option>
        </select>
        <button id="hdr-profile" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff] transition-all duration-200 hover:bg-[#ffffff] hover:text-[#000000]">${t(state.lang, "Renderer.PROFILE")}</button>
        <button id="hdr-logout" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff] transition-all duration-200 hover:bg-[#ffffff] hover:text-[#000000]">${t(state.lang, "Renderer.LOGOUT")}</button>
      </div>
    `;

    const profileBtn = node.querySelector('#hdr-profile') as HTMLButtonElement;
    const logoutBtn = node.querySelector('#hdr-logout') as HTMLButtonElement;
    const usernameEl = node.querySelector('#hdr-username') as HTMLElement;
    const avatarEl = node.querySelector('#hdr-avatar') as HTMLImageElement | null;
    const langSelect = node.querySelector('#hdr-lang') as HTMLSelectElement | null;


    profileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('profile');
      render(getHashPage());
    });

    // clique sur le pseudo renvoie aussi au profile
    usernameEl.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('profile');
      render(getHashPage());
    });

    // clique sur l'avatar renvoie aussi au profile
    if (avatarEl) {
      avatarEl.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('profile');
        render(getHashPage());
      });
      // en cas d'erreur de chargement, fallback
      avatarEl.onerror = () => { avatarEl.src = '/default-avatar.png'; };
    }

    // language selector: do NOT persist immediately to backend. Only update a session-level preference
    // The profile page saves the persisted user preference (language) and should also update language_session.
    if (langSelect) {
      try { langSelect.value = state.lang; } catch (e) { /* ignore */ }
      langSelect.addEventListener('change', async () => {
        const newLang = (langSelect.value || 'en') as 'en' | 'fr' | 'de';
        // update only the UI/session value so translations re-render without touching the backend
        if (state.appState.currentUser) {
          (state.appState.currentUser as any).language_session = newLang;
        }
        try {
          // persist the session preference locally so pages that re-fetch the user don't overwrite it
          try { localStorage.setItem('language_session', newLang); } catch (e) { /* ignore */ }
        } catch (e) {}
        try { render(getHashPage()); } catch (e) { /* ignore */ }
      });
    }

    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      } catch (err) {
        console.warn('Logout failed', err);
      }
      if (state.appState.ws) {
        state.appState.ws.close();
        state.appState.ws = null;
      }
      try {
        const lw = (state as any).appState.lobbyWs;
        if (lw && typeof lw.close === 'function') lw.close();
        delete (state as any).appState.lobbyWs;
      } catch (e) {}
      try {
        const pc = (window as any).__presenceClient;
        if (pc && typeof pc.close === 'function') pc.close();
        (window as any).__presenceClient = null;
      } catch (e) {}
      state.appState.currentUser = null;
      navigateTo('login');
      render(getHashPage());
    });

  } else {
    // non connecté -> ne rien afficher dans l'entête
    right.innerHTML = '';
  }

  return node;
}

/* petit utilitaire pour échapper le HTML (sécurité XSS pour le nom affiché) */
function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}