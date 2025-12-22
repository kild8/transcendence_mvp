export type Page = 'home' | 'versus' | 'tournament' | 'add-user' | 'list-users' | 'profile';

export function navigateTo(page: Page) {
  window.location.hash = `#${page}`;
}

export function getHashPage(): Page {
  const h = (window.location.hash || '#home').replace('#','') as Page;
  if (!['home','versus','tournament','add-user','list-users','profile'].includes(h)) return 'home';
  return h;
}
