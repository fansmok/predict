import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './AppErrorBoundary';
import { applyTelegramTheme, bindTelegramThemeEvents } from './telegram-theme';
import { primeInitDataFromUrl } from './telegram-init';
import { loadTelegramSdk } from './telegram-sdk';
import './styles/global.css';

function bindTelegramChrome(): void {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    applyTelegramTheme();
    bindTelegramThemeEvents();
  } else {
    document.documentElement.style.setProperty('--safe-top', '0px');
  }
}

function showBootFailure(): void {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML =
    '<div style="min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;color:#94a3b8;font-size:15px;line-height:1.5;">' +
    '<p>Не удалось запустить приложение.</p>' +
    '<button type="button" onclick="location.reload()" style="background:#22c55e;color:#0a0f1a;border:none;border-radius:12px;padding:12px 24px;font-size:16px;font-weight:600;">Обновить</button>' +
    '</div>';
}

async function startApp(): Promise<void> {
  primeInitDataFromUrl();

  try {
    await loadTelegramSdk();
    bindTelegramChrome();
  } catch (err) {
    console.warn('[telegram-sdk]', err);
  }

  const rootEl = document.getElementById('root');
  if (!rootEl) {
    showBootFailure();
    return;
  }

  createRoot(rootEl).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>
  );
}

void startApp().catch(err => {
  console.error('[boot]', err);
  showBootFailure();
});
