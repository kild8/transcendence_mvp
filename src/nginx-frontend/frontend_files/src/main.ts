/**
 * Frontend SPA (Vanilla TS + Tailwind)
 * Build: tsc -> dist/main.js ; tailwindcss -> dist/style.css
 */

import { render } from './renderer/renderer.js';
import { getHashPage } from './router.js';
import { state } from './state.js';
import { navigateTo } from './router.js';

//Reset LAN mode and websocket

if (state.appState.ws) {
  state.appState.ws.close();
  state.appState.ws = null;
  state.appState.mode = 'LOCAL';
  state.appState.playerRole = null;
}

/* Init routing */
window.addEventListener('hashchange', () => render(getHashPage()));

async function checkAuth() {
  try {
    const res = await fetch('/api/me', { credentials: 'same-origin' });
    const data = await res.json();

    if (data.ok) {
      state.appState.currentUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email
      };
      return true;
    }
  } catch (e) {
    console.warn('checkAuth failed', e);
  }

  state.appState.currentUser = null;
  return false;
}

(async () => {
  const logged = await checkAuth();
  if (!logged) {
    // si pas loggé, montrer directement login
    navigateTo('login');
  } else {
    // si hash vide, aller à home
    if (!window.location.hash) navigateTo('home');
  }
  render(getHashPage());
})();