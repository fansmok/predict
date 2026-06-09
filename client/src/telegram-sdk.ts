/** Локальная копия — не зависит от доступности telegram.org (важно для VPN). */
const LOCAL_SDK_URL = '/telegram-web-app.js';
const REMOTE_SDK_URL = 'https://telegram.org/js/telegram-web-app.js?59';
const SCRIPT_TIMEOUT_MS = 6_000;

function loadScript(src: string): Promise<boolean> {
  if (window.Telegram?.WebApp) return Promise.resolve(true);

  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    const finish = (ok: boolean) => {
      window.clearTimeout(timer);
      resolve(ok);
    };

    const timer = window.setTimeout(() => finish(false), SCRIPT_TIMEOUT_MS);
    script.onload = () => finish(true);
    script.onerror = () => finish(false);
    document.head.appendChild(script);
  });
}

/** Сначала same-origin SDK, затем запасной URL Telegram. */
export async function loadTelegramSdk(): Promise<void> {
  if (window.Telegram?.WebApp) return;

  await loadScript(LOCAL_SDK_URL);
  if (window.Telegram?.WebApp) return;

  await loadScript(REMOTE_SDK_URL);
}
