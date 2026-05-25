export type Route = 'login' | 'lobby' | 'room' | 'game';

export function setRoute(route: Route) {
  window.history.replaceState(null, '', route === 'lobby' ? '/' : `#${route}`);
}
