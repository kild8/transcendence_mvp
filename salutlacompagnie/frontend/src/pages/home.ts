import { elFromHTML } from '../utils.js';
import { navigateTo } from '../router.js';
import { t } from '../lang/langIndex.js';
import { state } from '../state.js';

export function homeContent(): HTMLElement {
  const html = `
    <section class="mt-6 flex flex-col gap-6 items-center">
      <div class="w-full flex flex-col sm:flex-row gap-4">
        <button id="btn-versus" class="py-[0.6rem] px-[1rem] rounded-[10px] font-bold border border-[#333333] bg-[#000000] text-[#ffffff] transition-all duration-200 ease-linear hover:bg-[#ffffff] hover:text-[#000000] hover:-translate-y-[1px]">
          ${t(state.lang, "Home.BTN_VERSUS")}
        </button>
        <button id="btn-tournament" class="py-[0.6rem] px-[1rem] rounded-[10px] font-bold border border-[#333333] bg-[#000000] text-[#ffffff] transition-all duration-200 ease-linear hover:bg-[#ffffff] hover:text-[#000000] hover:-translate-y-[1px]">
          ${t(state.lang, "Home.BTN_TOURNAMENT")}
        </button>
        <button id="btn-online" class="py-[0.6rem] px-[1rem] rounded-[10px] font-bold border border-[#333333] bg-[#000000] text-[#ffffff] transition-all duration-200 ease-linear hover:bg-[#ffffff] hover:text-[#000000] hover:-translate-y-[1px]">
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
