export function toast(message: string) {
  const root = document.querySelector<HTMLElement>('#toast-root');
  if (!root) return;
  const item = document.createElement('div');
  item.className = 'toast';
  item.textContent = message;
  root.append(item);
  window.setTimeout(() => item.remove(), 2600);
}
