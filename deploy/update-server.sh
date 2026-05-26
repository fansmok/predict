#!/usr/bin/env bash
# Быстрое обновление на уже настроенном сервере (без переустановки nginx/ssl)
set -euo pipefail

APP_DIR="/opt/predict"
BOT_TOKEN="${BOT_TOKEN:-}"
BOT_USERNAME="${BOT_USERNAME:-predictliga_bot}"
WEBAPP_SHORT_NAME="${WEBAPP_SHORT_NAME:-predictliga}"
DOMAIN="${DOMAIN:-predictapp.ru}"
ADMIN_USER_IDS="${ADMIN_USER_IDS:-}"

cd "$APP_DIR"

if [[ -d .git ]]; then
  git pull origin main
fi

if [[ -n "$BOT_TOKEN" ]]; then
  cat > "$APP_DIR/.env" <<EOF
BOT_TOKEN=${BOT_TOKEN}
BOT_USERNAME=${BOT_USERNAME}
WEBAPP_SHORT_NAME=${WEBAPP_SHORT_NAME}
WEBAPP_URL=https://${DOMAIN}
SERVER_URL=https://${DOMAIN}
PORT=3001
NODE_ENV=production
DEV_MODE=false
DISABLE_CRON=false
ADMIN_USER_IDS=${ADMIN_USER_IDS}
EOF
  chmod 600 "$APP_DIR/.env"
fi

npm install
npm run build
pm2 restart liga-server liga-bot
pm2 save

echo "OK: https://${DOMAIN} | pm2 status:"
pm2 status
