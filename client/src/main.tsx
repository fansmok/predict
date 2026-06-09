import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyTelegramTheme, bindTelegramThemeEvents } from './telegram-theme';
import { loadTelegramSdk } from './telegram-sdk';
import './styles/global.css';

async function startApp() {
  await loadTelegramSdk();

  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    applyTelegramTheme();
    bindTelegramThemeEvents();
  } else {
    document.documentElement.style.setProperty('--safe-top', '0px');
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void startApp();
