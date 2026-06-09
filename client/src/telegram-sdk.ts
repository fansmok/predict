const LOCAL_SDK_URL = '/telegram-web-app.js?v=59';
const REMOTE_SDK_URL = 'https://telegram.org/js/telegram-web-app.js?59';
const SCRIPT_TIMEOUT_MS = 5_000;

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

/** Не блокирует UI — можно вызывать без await. */
export function loadTelegramSdk(): Promise<void> {
  if (window.Telegram?.WebApp) return Promise.resolve();

  return (async () => {
    await loadScript(LOCAL_SDK_URL);
    if (window.Telegram?.WebApp) return;
    await loadScript(REMOTE_SDK_URL);
  })();
}
