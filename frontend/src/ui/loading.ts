export function setLoading(target: HTMLButtonElement, loading: boolean) {
  target.disabled = loading;
  target.dataset.loading = loading ? 'true' : 'false';
}
