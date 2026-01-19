import { elFromHTML } from '../utils.js';
import { navigateTo } from '../router.js';
import { getHashPage } from '../router.js';
import { render } from '../renderer/renderer.js';
import { state } from '../state.js';

export function loginContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-4 items-center w-full max-w-sm mx-auto">
      <h2 class="text-xl font-semibold">Connexion</h2>

      <!-- LOGIN LOCAL -->
      <form id="login-form" class="w-full flex flex-col gap-3">
        <input
          id="login-identifier"
          class="border p-2 rounded"
          placeholder="Email ou pseudo"
          required
        />
        <input
          id="login-password"
          type="password"
          class="border p-2 rounded"
          placeholder="Mot de passe"
          required
        />
        <button class="btn w-full" type="submit">
          Se connecter
        </button>
        <p id="login-error" class="small text-red-600 text-center"></p>
      </form>

      <div class="w-full border-t my-4"></div>

      <!-- GOOGLE -->
      <a id="btn-google" class="btn w-full" href="/api/auth/google">
        ↪ Se connecter avec Google
      </a>

      <!-- REGISTER -->
      <button id="btn-register" class="btn small w-full">
        Créer un compte
      </button>

    </section>
  `;

  const node = elFromHTML(html);

  // ---------- LOGIN LOCAL ----------
  node.querySelector('#login-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = (node.querySelector('#login-identifier') as HTMLInputElement).value.trim();
    const password = (node.querySelector('#login-password') as HTMLInputElement).value;
    const errorEl = node.querySelector('#login-error') as HTMLElement;

    errorEl.textContent = '';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        errorEl.textContent = data.error || 'Connexion échouée';
        return;
      }

      // récupérer l'utilisateur via /api/me
      const meRes = await fetch('/api/me');
      const meData = await meRes.json();
      if (meData.ok) {
        state.appState.currentUser = meData.user;
        try {
          // try to create presence socket immediately after login
          if (!state.appState.ws) {
            const { createPresenceSocket } = await import('../wsClient.js');
              const client = createPresenceSocket(() => console.log('presence open'), () => console.log('presence closed'));
              state.appState.ws = client as any;
              try { (window as any).__presenceClient = client; } catch (e) {}
          }
        } catch (e) { console.warn('presence socket init failed', e); }
        navigateTo('home');
        render(getHashPage());
      }
    } catch (err) {
      errorEl.textContent = 'Erreur réseau';
    }
  });

  // ---------- REGISTER ----------
  node.querySelector('#btn-register')!.addEventListener('click', () => {
    navigateTo('register');
    render(getHashPage());
  });

  // ---------- GUEST ----------
  // node.querySelector('#btn-guest')!.addEventListener('click', () => {
  //   state.appState.currentUser = { id: -1, name: 'Guest', email: '' };
  //   navigateTo('home');
  //   render(getHashPage());
  // });

  return node;
}