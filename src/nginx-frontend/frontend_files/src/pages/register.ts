import { elFromHTML } from '../utils.js';
import { navigateTo } from '../router.js';
import { getHashPage } from '../router.js';
import { render } from '../renderer/renderer.js';
import { state } from '../state.js';

export function registerContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-4 items-center w-full max-w-sm mx-auto">
      <h2 class="text-xl font-semibold">Créer un compte</h2>

      <form id="register-form" class="w-full flex flex-col gap-3">
        <input
          id="register-name"
          class="border p-2 rounded"
          placeholder="Pseudo"
          required
        />
        <input
          id="register-email"
          type="email"
          class="border p-2 rounded"
          placeholder="Email"
          required
        />
        <input
          id="register-password"
          type="password"
          class="border p-2 rounded"
          placeholder="Mot de passe (8+ caractères)"
          required
        />
        <button class="btn w-full" type="submit">
          Créer le compte
        </button>
        <p id="register-error" class="small text-red-600 text-center"></p>
      </form>

      <button id="btn-back-login" class="btn small w-full">
        ← Retour à la connexion
      </button>
    </section>
  `;

  const node = elFromHTML(html);

  // ---------- REGISTER ----------
  node.querySelector('#register-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = (node.querySelector('#register-name') as HTMLInputElement).value.trim();
    const email = (node.querySelector('#register-email') as HTMLInputElement).value.trim();
    const password = (node.querySelector('#register-password') as HTMLInputElement).value;
    const errorEl = node.querySelector('#register-error') as HTMLElement;

    errorEl.textContent = '';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        errorEl.textContent = data.error || 'Inscription échouée';
        return;
      }

      // auto-login via cookie JWT
      const meRes = await fetch('/api/me');
      const meData = await meRes.json();
      if (meData.ok) {
        state.appState.currentUser = meData.user;
        navigateTo('home');
        render(getHashPage());
      }
    } catch (err) {
      errorEl.textContent = 'Erreur réseau';
    }
  });

  node.querySelector('#btn-back-login')!.addEventListener('click', () => {
    navigateTo('login');
    render(getHashPage());
  });

  return node;
}
