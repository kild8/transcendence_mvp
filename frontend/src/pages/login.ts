import { elFromHTML } from '../utils.js';
import { navigateTo } from '../router.js';
import { getHashPage } from '../router.js';
import { render } from '../renderer/renderer.js';
import { state } from '../state.js';

export function loginContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-4 items-center">
      <h2 class="text-xl font-semibold">Connexion</h2>
      <p class="small">Connecte-toi via Google pour participer aux tournois.</p>

      <div class="flex gap-2 mt-4">
        <a id="btn-google" class="btn" href="/api/auth/google">↪ Se connecter avec Google</a>
        <button id="btn-guest" class="btn small">Continuer en invité</button>
      </div>

      <div class="mt-4 small text-center">
        <p>Tu seras redirigé vers Google pour t'authentifier, puis ramené ici.</p>
      </div>
    </section>
  `;
  const node = elFromHTML(html);
  node.querySelector('#btn-guest')!.addEventListener('click', () => {
    // guest mode: set a tiny pseudo user in appState (dev convenience)
    state.appState.currentUser = { id: -1, name: 'Guest', email: '' };
    navigateTo('home');
    render(getHashPage());
  });
  return node;
}