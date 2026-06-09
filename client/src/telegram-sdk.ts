const TELEGRAM_SDK_URL = 'https://telegram.org/js/telegram-web-app.js?59';
const SDK_LOAD_TIMEOUT_MS = 8_000;

/** Не блокируем парсинг HTML — на VPN telegram.org может долго не отвечать. */
export function loadTelegramSdk(): Promise<void> {
  if (window.Telegram?.WebApp) return Promise.resolve();

  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = TELEGRAM_SDK_URL;
    script.async = true;

    const done = () => {
      window.clearTimeout(timer);
      resolve();
    };

    const timer = window.setTimeout(done, SDK_LOAD_TIMEOUT_MS);
    script.onload = done;
    script.onerror = done;
    document.head.appendChild(script);
  });
}
