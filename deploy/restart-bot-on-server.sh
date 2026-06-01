#!/usr/bin/env bash
# Запуск на VPS (консоль Timeweb), если SSH с Mac не работает.
# cd /opt/predict && bash deploy/restart-bot-on-server.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/predict}"
cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "ERROR: нет $APP_DIR/.env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

for v in BOT_TOKEN BOT_API_SECRET; do
  if [[ -z "${!v:-}" ]]; then
    echo "ERROR: в .env не задан $v"
    exit 1
  fi
done

if [[ ${#BOT_API_SECRET} -lt 32 ]]; then
  echo "ERROR: BOT_API_SECRET короче 32 символов"
  exit 1
fi

export NODE_ENV=production
npm run build

if command -v pm2 >/dev/null; then
  pm2 restart liga-server liga-bot 2>/dev/null || {
    pm2 delete liga-server liga-bot 2>/dev/null || true
    pm2 start npm --name liga-server --cwd "$APP_DIR" -- start
    pm2 start npm --name liga-bot --cwd "$APP_DIR" -- run start --workspace=bot
  }
  pm2 save
  echo ""
  pm2 status
  echo ""
  pm2 logs liga-bot --lines 25 --nostream
else
  echo "pm2 не установлен. Установите: npm i -g pm2"
  echo "Или вручную: npm run start (сервер) и npm run start --workspace=bot (бот)"
  exit 1
fi

echo ""
echo "==> Telegram getWebhookInfo (должен быть url пустой при polling):"
curl -sS "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | head -c 400
echo ""
