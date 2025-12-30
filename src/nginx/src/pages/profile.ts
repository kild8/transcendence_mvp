import { elFromHTML } from '../utils.js';
import { navigateTo } from '../router.js';

export function profileContent(): HTMLElement {
  let currentUserId: number | null = null;

  const html = `
    <section class="mt-6 flex flex-col gap-4 items-center">
      <input id="input-search-user" placeholder="Nom de l'utilisateur" class="border p-2 rounded" />
      <div class="flex gap-2">
        <button id="btn-search" class="btn">Rechercher</button>
        <button id="btn-back" class="btn small">← Retour</button>
      </div>
      <div id="profile-view" class="mt-6 hidden text-center">
        <img id="profile-avatar" class="w-24 h-24 rounded-full border mx-auto mb-4" />
        <form id="avatar-form" class="mt-4 flex flex-col items-center gap-2" hidden>
          <input type="file" id="avatar-input" accept="image/*" class="small" />
          <button type="submit" id="avatar-submit" class="btn small">Changer l’avatar</button>
          <p id="avatar-msg" class="small text-green-700"></p>
        </form>
        <p id="profile-name" class="text-lg font-semibold"></p>
        <p id="profile-email" class="small"></p>
        <p id="profile-date" class="small text-gray-600"></p>
      </div>
    </section>
  `;

  const node = elFromHTML(html);
  const input = node.querySelector('#input-search-user') as HTMLInputElement;
  const view = node.querySelector('#profile-view') as HTMLElement;
  const avatarEl = node.querySelector('#profile-avatar') as HTMLImageElement;
  const nameEl = node.querySelector('#profile-name') as HTMLElement;
  const emailEl = node.querySelector('#profile-email') as HTMLElement;
  const dateEl = node.querySelector('#profile-date') as HTMLElement;
  const avatarForm = node.querySelector('#avatar-form') as HTMLFormElement;
  const avatarInput = node.querySelector('#avatar-input') as HTMLInputElement;
  const avatarMsg = node.querySelector('#avatar-msg') as HTMLElement;
  const avatarSubmit = node.querySelector('#avatar-submit') as HTMLButtonElement;

  node.querySelector('#btn-back')!.addEventListener('click', () => navigateTo('home'));
  avatarEl.onerror = () => { avatarEl.src = '/default-avatar.png'; };

  node.querySelector('#btn-search')!.addEventListener('click', async () => {
    const name = input.value.trim();
    if (!name) return alert("Entre un nom.");

    view.classList.add('hidden');
    avatarForm.hidden = true;
    avatarEl.src = '';
    avatarMsg.textContent = '';
    nameEl.textContent = '';
    emailEl.textContent = '';
    dateEl.textContent = '';
    currentUserId = null;

    try {
      const res = await fetch(`/api/user/${encodeURIComponent(name)}`);
      if (!res.ok) return alert("Utilisateur introuvable.");
      const data = await res.json();
      if (!data.ok) return alert(data.error || "Utilisateur introuvable.");

      const user = data.user;
      currentUserId = user.id;
      const avatarFilename = user.avatar ? String(user.avatar).split('/').pop() : null;
      avatarEl.src = avatarFilename ? `/api/uploads/${avatarFilename}` : '/default-avatar.png';

      nameEl.textContent = user.name;
      emailEl.textContent = user.email || '';
      dateEl.textContent = user.created_at ? "Ajouté le : " + user.created_at : '';

      view.classList.remove('hidden');
      avatarForm.hidden = false;
      avatarInput.value = '';
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de la recherche.");
    }
  });

  avatarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    avatarMsg.textContent = '';
    if (!currentUserId) { avatarMsg.textContent = "Utilisateur non chargé"; return; }
    const file = avatarInput.files?.[0];
    if (!file) { avatarMsg.textContent = "Choisis une image"; return; }

    avatarSubmit.disabled = true;
    avatarMsg.textContent = "Upload en cours...";

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', String(currentUserId));
      const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData });
      if (!res.ok) { avatarMsg.textContent = "Erreur lors de l'upload"; return; }
      const data = await res.json();
      if (!data.ok) { avatarMsg.textContent = data.error || "Erreur serveur"; return; }

      const url = data.url ? data.url : `/api/uploads/${data.avatar}`;
      avatarEl.src = `${url}?t=${Date.now()}`;
      avatarMsg.textContent = "Avatar mis à jour ✔️";
    } catch (err) { console.error(err); avatarMsg.textContent = "Erreur réseau pendant l'upload"; }
    finally { avatarSubmit.disabled = false; }
  });

  return node;
}
