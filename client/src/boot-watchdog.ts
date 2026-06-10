/** Снимает HTML-fallback таймер из index.html после успешной загрузки приложения. */
export function clearAppLoadWatchdog(): void {
  const id = (window as Window & { __APP_LOAD_TIMEOUT?: number }).__APP_LOAD_TIMEOUT;
  if (id) window.clearTimeout(id);
}
