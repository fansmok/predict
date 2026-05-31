# ⚽ Лига Прогнозов — ЧМ-2026

Telegram Web App для прогнозов на Чемпионат мира по футболу 2026.

## Возможности

- 🔐 Авторизация через Telegram
- 📅 Расписание всех матчей группового этапа и плей-офф
- 🎯 Прогнозы на каждый матч (до начала игры)
- 🏆 Рейтинг лучших прогнозистов
- ✨ Премиальный интерфейс в стиле FotMob Predict

## Система очков

| Результат | Очки |
|-----------|------|
| Точный счёт | 5 |
| Угадана разница мячей | 3 |
| Угадан исход (П1/X/П2) | 2 |
| Не угадано | 0 |

## Быстрый старт

### 1. Установка

```bash
npm install
cp .env.example .env
```

### 2. Создание Telegram-бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Создайте бота: `/newbot`
3. Скопируйте токен в `.env` → `BOT_TOKEN=...`
4. Настройте Web App: `/newapp` → укажите URL вашего приложения
5. Для локальной разработки используйте [ngrok](https://ngrok.com) или аналог

### 3. Запуск

```bash
# Терминал 1 — API сервер
npm run dev:server

# Терминал 2 — Frontend
npm run dev:client

# Терминал 3 — Telegram бот (опционально)
npm run dev:bot
```

Откройте http://localhost:5173 — приложение работает в dev-режиме без Telegram.

### 4. Продакшен

```bash
npm run build
npm start
```

## Структура проекта

```
├── client/          # React + Vite frontend (Telegram Web App)
├── server/          # Express API + SQLite
├── bot/             # Grammy Telegram bot
└── .env.example     # Переменные окружения
```

## API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/auth/me` | Текущий пользователь и статистика |
| GET | `/api/matches` | Список матчей |
| POST | `/api/predictions` | Сохранить прогноз |
| GET | `/api/leaderboard` | Рейтинг |
| GET | `/api/rules` | Правила начисления очков |

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `BOT_TOKEN` | Токен Telegram-бота (Telegram API + initData Mini App) |
| `BOT_API_SECRET` | Секрет bot↔server для `/api/bot` (≥32 символа, `openssl rand -hex 32`) |
| `BOT_API_ALLOWED_IPS` | IP для `/api/bot` в production (например `127.0.0.1,::1`) |
| `SERVER_URL` | URL backend для бота (локально / на VPS: `http://127.0.0.1:3001`) |
| `WEBAPP_URL` | URL Web App для бота |
| `PORT` | Порт сервера (по умолчанию 3001) |
| `DEV_MODE` | `true` — авторизация без Telegram |

## Технологии

- **Frontend:** React 19, Vite, TypeScript, Telegram Web App SDK
- **Backend:** Express, better-sqlite3
- **Bot:** Grammy
