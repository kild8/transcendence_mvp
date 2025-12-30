/**
 * Frontend SPA (Vanilla TS + Tailwind)
 * Build: tsc -> dist/main.js ; tailwindcss -> dist/style.css
 */

import { render } from './renderer/renderer.js';
import { getHashPage } from './router.js';
import { state } from './state.js';

//Reset LAN mode and websocket

if (state.appState.ws) {
  state.appState.ws.close();
  state.appState.ws = null;
  state.appState.mode = 'LOCAL';
  state.appState.playerRole = null;
}

/* Init routing */
window.addEventListener('hashchange', () => render(getHashPage()));
render(getHashPage());

// LAN Websocket client

//if (!state.appState.ws && window.location.hostname !== "localhost") {

