import { elFromHTML } from '../utils.js';
import { navigateTo } from '../router.js';
import { t } from '../lang/langIndex.js';
import { state } from '../state.js';

export function addUserContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-4 items-center">
      <input id="input-name" placeholder=${t(state.lang, "ADD_USER.NAME_PLACEHOLDER")} class="bg-[#0a0a0a] text-[#ffffff] border border-[#333333] p-2 rounded" />
      <input id="input-email" placeholder=${t(state.lang, "ADD_USER.EMAIL_PLACEHOLDER")} class="bg-[#0a0a0a] text-[#ffffff] border border-[#333333] p-2 rounded" />
      <button id="btn-submit" class="py-[0.6rem] px-[1rem] rounded-[10px] font-bold border border-[#333333] bg-[#000000] text-[#ffffff]">${t(state.lang, "ADD_USER.BUTTON_ADD")}</button>
      <button id="btn-back" class="py-[0.4rem] px-[0.8rem] rounded-[8px] text-sm font-semibold border border-[#333333] bg-[#000000] text-[#ffffff]">${t(state.lang, "ADD_USER.BUTTON_BACK")}</button>
      <div id="msg" class="mt-2 text-sm text-green-700"></div>
    </section>
  `;

  const node = elFromHTML(html);
  const inputName = node.querySelector('#input-name') as HTMLInputElement;
  const inputEmail = node.querySelector('#input-email') as HTMLInputElement;
  const msg = node.querySelector('#msg') as HTMLElement;

  node.querySelector('#btn-submit')!.addEventListener('click', async () => {
    const name = inputName.value.trim();
    const email = inputEmail.value.trim();
    if (!name || !email) { msg.textContent = t(state.lang, "ADD_USER.MSG_NAME_EMAIL_REQUIRED"); return; }

    try {
      const res = await fetch('/api/add-user', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();
      if (data.ok) {
        msg.textContent = t(state.lang, "ADD_USER.MSG_USER_ADDED", {name: data.user.name, email: data.user.email});
        inputName.value = ''; inputEmail.value = '';
      } else {
        msg.textContent = t(state.lang, "ADD_USER.MSG_ERROR", {error: data.error || "unknown" });
      }
    } catch(e) { 
      const errorMessage = e instanceof Error ? e.message : String(e);
      msg.textContent = t(state.lang, "ADD_USER.MSG_NETWORK_ERROR", {error: errorMessage});
    }
  });

  node.querySelector('#btn-back')!.addEventListener('click', () => navigateTo('home'));

  return node;
}
