import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyTelegramTheme, bindTelegramThemeEvents } from './telegram-theme';
import { primeInitDataFromUrl } from './telegram-init';
import { loadTelegramSdk } from './telegram-sdk';
import './styles/global.css';

function clearAppLoadWatchdog(): void {
  const id = (window as Window & { __APP_LOAD_TIMEOUT?: number }).__APP_LOAD_TIMEOUT;
  if (id) window.clearTimeout(id);
}

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

function startApp(): void {
  primeInitDataFromUrl();
  clearAppLoadWatchdog();

  const sdkPromise = loadTelegramSdk();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  void sdkPromise.then(bindTelegramChrome);
}

startApp();
