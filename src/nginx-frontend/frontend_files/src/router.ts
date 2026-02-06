export type Page = 'login' | 'register' | 'home' | 'versus' | 'tournament' | 'add-user' | 'list-users' | 'profile' | 'rooms';

export function navigateTo(page: Page) {
  window.location.hash = `#${page}`;
}

export function getHashPage(): Page {
  const h = (window.location.hash || '#home').replace('#','') as Page;
  if (!['login','register','home','versus','tournament','add-user','list-users','profile', 'rooms'].includes(h)) return 'home';
  return h;
}
