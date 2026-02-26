/**
 * Frontend SPA (Vanilla TS + Tailwind)
 * Build: tsc -> dist/main.js ; tailwindcss -> dist/style.css
 */

import './Game.js';
import { createPresenceSocket } from './wsClient.js';
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
      // prefer a stored session-level language if available (user may have changed it via header)
      const storedSession = (function() { try { return localStorage.getItem('language_session'); } catch (e) { return null; } })();
      state.appState.currentUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar,
        language: data.user.language || 'en',
        language_session: storedSession || data.user.language || 'en'
      };
      // open presence websocket client (keeps user online)
      try {
        if (!state.appState.ws) {
          const presenceClient = createPresenceSocket(() => {
            console.log('presence socket opened');
          }, () => {
            console.log('presence socket closed');
          });
          // store the client (has .close())
          // presenceClient exposes .socket and .close(); store the wrapper object
          state.appState.ws = presenceClient as unknown as WebSocket;
        }
      } catch (e) {
        console.warn('Failed to open presence socket', e);
      }
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

// close presence socket on unload
window.addEventListener('beforeunload', () => {
  try {
    if (state.appState.ws) {
      state.appState.ws.close();
      state.appState.ws = null;
    }
  } catch (e) {}
});