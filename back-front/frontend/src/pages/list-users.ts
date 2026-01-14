import { elFromHTML } from '../utils.js';
import { navigateTo } from '../router.js';

export function listUsersContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-2 items-center">
      <button id="btn-back" class="btn small">← Retour</button>
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
      ul.innerHTML = `<li>Erreur lors de la récupération : ${e}</li>`;
    }
  })();

  return node;
}
