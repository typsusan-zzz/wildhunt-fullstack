export function showGameToast(message: string) {
  window.dispatchEvent(new CustomEvent('wildhunt:toast', { detail: message }));
}
