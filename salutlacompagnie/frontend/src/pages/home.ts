import { elFromHTML } from '../utils.js';
import { navigateTo } from '../router.js';
import { t } from '../lang/langIndex.js';
import { state } from '../state.js';

export function homeContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-6 items-center">
      <div class="w-full flex flex-col sm:flex-row gap-4">
        <button id="btn-versus" class="btn">
          ${t(state.lang, "Home.BTN_VERSUS")}
        </button>
        <button id="btn-tournament" class="btn">
          ${t(state.lang, "Home.BTN_TOURNAMENT")}
        </button>
        <button id="btn-online" class="btn">
          ${t(state.lang, "Home.BTN_ONLINE")}
        </button>
      </div>
    </section>
  `;
  const node = elFromHTML(html);

  node.querySelector('#btn-versus')!.addEventListener('click', () => navigateTo('versus'));
  node.querySelector('#btn-tournament')!.addEventListener('click', () => navigateTo('tournament'));
  // node.querySelector('#btn-add-user')!.addEventListener('click', () => navigateTo('add-user'));
  // node.querySelector('#btn-list-users')!.addEventListener('click', () => navigateTo('list-users'));
  // node.querySelector('#btn-profile')!.addEventListener('click', () => navigateTo('profile'));
  node.querySelector('#btn-online')!.addEventListener('click', () => navigateTo('online'));

  return node;
}
