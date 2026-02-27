import { elFromHTML } from '../utils.js';
import { navigateTo } from '../router.js';
import { getHashPage } from '../router.js';
import { render } from '../renderer/renderer.js';
import { state } from '../state.js';
import { t } from '../lang/langIndex.js';

export function registerContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-4 items-center w-full max-w-sm mx-auto">
      <h2 class="text-xl font-semibold">${t(state.lang, "Register.TITLE")}</h2>

      <form id="register-form" class="w-full flex flex-col gap-3">
        <input
          id="register-name"
          class="bg-[#0a0a0a] text-[#ffffff] border border-[#333333] rounded-[8px] p-2"
          placeholder="${t(state.lang, "Register.NAME_PLACEHOLDER")}"
          required
        />
        <input
          id="register-email"
          type="email"
          class="bg-[#0a0a0a] text-[#ffffff] border border-[#333333] rounded-[8px] p-2"
          placeholder="${t(state.lang, "Register.EMAIL_PLACEHOLDER")}"
          required
        />
        <input
          id="register-password"
          type="password"
          class="bg-[#0a0a0a] text-[#ffffff] border border-[#333333] rounded-[8px] p-2"
          placeholder="${t(state.lang, "Register.PASSWORD_PLACEHOLDER")}"
          required
        />
        <button class="py-[0.6rem] px-[1rem] rounded-[10px] font-bold border border-[#333333] bg-[#000000] text-[#ffffff] w-full transition-all duration-200 ease-linear hover:bg-[#ffffff] hover:text-[#000000]" type="submit">
          ${t(state.lang, "Register.BUTTON_CREATE")}
        </button>
        <p id="register-error" class="text-sm text-red-600 text-center"></p>
      </form>

      <button id="btn-back-login" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff] w-full transition-all duration-200 hover:bg-[#ffffff] hover:text-[#000000']">
        ${t(state.lang, "Register.BUTTON_BACK_LOGIN")}
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
        errorEl.textContent = data.error ? t(state.lang, data.error) : t(state.lang, "Register.ERROR_REGISTRATION");
        return;
      }

      // auto-login via cookie JWT
      const meRes = await fetch('/api/me');
      const meData = await meRes.json();
      if (meData.ok) {
        const storedSession = (function() { try { return localStorage.getItem('language_session'); } catch (e) { return null; } })();
  state.appState.currentUser = { ...meData.user, language_session: storedSession || meData.user.language || 'en' };
        navigateTo('home');
        render(getHashPage());
      }
    } catch (err) {
      errorEl.textContent = t(state.lang, "Register.NETWORK_ERROR");
    }
  });

  node.querySelector('#btn-back-login')!.addEventListener('click', () => {
    navigateTo('login');
    render(getHashPage());
  });

  return node;
}
