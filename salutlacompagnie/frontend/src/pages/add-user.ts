import { elFromHTML } from '../utils.js';
import { navigateTo } from '../router.js';

export function addUserContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-4 items-center">
      <input id="input-name" placeholder="Nom de l'utilisateur" class="border p-2 rounded" />
      <input id="input-email" placeholder="Email" class="border p-2 rounded" />
      <button id="btn-submit" class="btn">Ajouter</button>
      <button id="btn-back" class="btn small">← Retour</button>
      <div id="msg" class="mt-2 small text-green-700"></div>
    </section>
  `;

  const node = elFromHTML(html);
  const inputName = node.querySelector('#input-name') as HTMLInputElement;
  const inputEmail = node.querySelector('#input-email') as HTMLInputElement;
  const msg = node.querySelector('#msg') as HTMLElement;

  node.querySelector('#btn-submit')!.addEventListener('click', async () => {
    const name = inputName.value.trim();
    const email = inputEmail.value.trim();
    if (!name || !email) { msg.textContent = "Nom et email requis"; return; }

    try {
      const res = await fetch('/api/add-user', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();
      if (data.ok) {
        msg.textContent = `Utilisateur ajouté : ${data.user.name} (${data.user.email})`;
        inputName.value = ''; inputEmail.value = '';
      } else {
        msg.textContent = `Erreur : ${data.error || 'unknown'}`;
      }
    } catch(e) { msg.textContent = `Erreur réseau : ${e}`; }
  });

  node.querySelector('#btn-back')!.addEventListener('click', () => navigateTo('home'));

  return node;
}
