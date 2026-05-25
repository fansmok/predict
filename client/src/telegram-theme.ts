/** Синхронизация CSS-переменных с Telegram themeParams (светлая/тёмная тема клиента). */
export function applyTelegramTheme(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  const p = tg.themeParams;
  if (!p || typeof p !== 'object') return;

  const root = document.documentElement;
  const map: Record<string, string | undefined> = {
    '--bg-primary': p.bg_color,
    '--bg-secondary': p.secondary_bg_color,
    '--bg-card': p.section_bg_color,
    '--bg-elevated': p.secondary_bg_color,
    '--text-primary': p.text_color,
    '--text-secondary': p.hint_color,
    '--text-muted': p.subtitle_text_color,
    '--accent': p.button_color,
    '--border': p.section_separator_color
      ? `color-mix(in srgb, ${p.section_separator_color} 40%, transparent)`
      : undefined,
  };

  for (const [key, value] of Object.entries(map)) {
    if (value) root.style.setProperty(key, value);
  }

  if (p.bg_color) {
    tg.setBackgroundColor(p.bg_color);
    tg.setHeaderColor(p.bg_color);
  }
}

export function bindTelegramThemeEvents(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  applyTelegramTheme();
  tg.onEvent?.('themeChanged', applyTelegramTheme);
}
