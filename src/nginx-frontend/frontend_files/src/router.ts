export type Page = 'login' | 'register' | 'home' | 'versus' | 'tournament' | 'add-user' | 'list-users' | 'profile' | 'online';

export function navigateTo(page: Page) {
  window.location.hash = `#${page}`;
}

export function getHashPage(): Page {
  const h = (window.location.hash || '#home').replace('#','') as Page;
  if (!['login','register','home','versus','tournament','add-user','list-users','profile', 'online'].includes(h)) return 'home';
  return h;
}
