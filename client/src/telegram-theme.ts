/** Фирменные цвета приложения — не зависят от светлой темы Telegram. */
const APP_BG = '#0a0f1a';
const APP_HEADER = '#0a0f1a';

/** Синхронизация chrome Telegram (фон WebView, шапка) с брендом приложения. */
export function applyTelegramTheme(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  tg.setBackgroundColor(APP_BG);
  tg.setHeaderColor(APP_HEADER);
}

export function bindTelegramThemeEvents(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  applyTelegramTheme();
  tg.onEvent?.('themeChanged', applyTelegramTheme);
}
