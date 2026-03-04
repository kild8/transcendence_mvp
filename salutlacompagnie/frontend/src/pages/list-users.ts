import { elFromHTML } from '../utils.js';
import { navigateTo } from '../router.js';
import { t } from '../lang/langIndex.js';
import { state } from '../state.js';

export function listUsersContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-2 items-center">
      <button id="btn-back" class="btn small">${t(state.lang, "ListUsers.BTN_BACK")}</button>
      <ul id="users-list" class="mt-2 border p-2 rounded w-64"></ul>
    </section>
  `;
  const node = elFromHTML(html);
  const ul = node.querySelector('#users-list') as HTMLUListElement;

  node.querySelector('#btn-back')!.addEventListener('click', () => navigateTo('home'));

  (async () => {
    try {
      const res = await fetch('/api/users');
      const users = await res.json();
      ul.innerHTML = users.map((u: any) => `<li>${u.id} — ${u.name}</li>`).join('');
    } catch(e) {
      const errorMessage = e instanceof Error ? e.message : String(e); 
      const li = document.createElement("li");
      li.textContent = t(state.lang, "ListUsers.FETCH_ERROR", {error: errorMessage});
      ul.appendChild(li);
    }
  })();

  return node;
}
