import { elFromHTML } from '../utils.js';
import { Page } from '../router.js';
import { homeContent } from '../pages/home.js';
import { versusContent } from '../pages/versus.js';
import { tournamentContent } from '../pages/tournament.js';
import { addUserContent } from '../pages/add-user.js';
import { listUsersContent } from '../pages/list-users.js';
import { profileContent } from '../pages/profile.js';

export const app = document.getElementById('app')!;

export function render(page: Page) {
  app.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'card';
  container.appendChild(header());

  const main = document.createElement('main');
  main.className = 'mt-6';

  if (page === 'home') main.appendChild(homeContent());
  if (page === 'versus') main.appendChild(versusContent());
  if (page === 'tournament') main.appendChild(tournamentContent());
  if (page === 'add-user') main.appendChild(addUserContent());
  if (page === 'list-users') main.appendChild(listUsersContent());
  if (page === 'profile') main.appendChild(profileContent());

  container.appendChild(main);

  const footer = elFromHTML(`<footer class="mt-6 small text-center">Petit MVP • Vanilla TS + Tailwind</footer>`);
  container.appendChild(footer);

  app.appendChild(container);
}

function header(): HTMLElement {
  const html = `
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">MVP — Mode de jeu</h1>
        <p class="small mt-1">Choisis un mode puis sélectionne les pseudos.</p>
      </div>
      <div class="small">Critère en haut</div>
    </header>
  `;
  return elFromHTML(html);
}

