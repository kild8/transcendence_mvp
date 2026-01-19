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
  container.className = 'card';
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

  // Si l'utilisateur est connecté -> afficher son nom + profile + logout
  if (state.appState.currentUser) {
    const name = state.appState.currentUser.name || 'Utilisateur';
    // avatar if available (fallback to default image)
    const avatarSrc = (state.appState.currentUser as any).avatar || '/default-avatar.png';
    right.innerHTML = `
      <div class="flex items-center gap-3">
        <img id="hdr-avatar" src="${escapeHtml(avatarSrc)}" alt="avatar" class="w-8 h-8 rounded-full" />
        <div class="small">Bonjour, <strong id="hdr-username">${escapeHtml(name)}</strong></div>
        <button id="hdr-profile" class="btn small">Profil</button>
        <button id="hdr-logout" class="btn small">Se déconnecter</button>
      </div>
    `;

    const profileBtn = node.querySelector('#hdr-profile') as HTMLButtonElement;
    const logoutBtn = node.querySelector('#hdr-logout') as HTMLButtonElement;
    const usernameEl = node.querySelector('#hdr-username') as HTMLElement;

    profileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('profile');
      // on réaffiche la page (render est la fonction exportée dans ce module)
      render(getHashPage());
    });

    // clique sur le pseudo renvoie aussi au profile
    usernameEl.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('profile');
      render(getHashPage());
    });

    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        // envoie le POST pour supprimer le cookie côté serveur
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      } catch (err) {
        console.warn('Logout failed', err);
        // on continue quand même côté front
      }
      if (state.appState.ws) {
        state.appState.ws.close();
        state.appState.ws = null;
      }
      // fallback: close global presence client if exists
      try {
        const pc = (window as any).__presenceClient;
        if (pc && typeof pc.close === 'function') pc.close();
        (window as any).__presenceClient = null;
      } catch (e) {}
      // close lobby ws if present
      try {
        const lw = (state as any).appState.lobbyWs;
        if (lw && typeof lw.close === 'function') lw.close();
        if ((state as any).appState) delete (state as any).appState.lobbyWs;
      } catch (e) {}
      // vider l'état côté client
      state.appState.currentUser = null;
      // aller au login et rerender
      navigateTo('login');
      render(getHashPage());
    });

  } else {
    // non connecté -> ne rien afficher dans l'entête (les pages login/register gèrent la navigation)
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