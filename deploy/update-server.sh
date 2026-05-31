#!/usr/bin/env bash
# Быстрое обновление на уже настроенном сервере (без переустановки nginx/ssl)
set -euo pipefail

APP_DIR="/opt/predict"
BOT_TOKEN="${BOT_TOKEN:-}"
BOT_USERNAME="${BOT_USERNAME:-predictliga_bot}"
WEBAPP_SHORT_NAME="${WEBAPP_SHORT_NAME:-predictliga}"
DOMAIN="${DOMAIN:-predictapp.ru}"
ADMIN_USER_IDS="${ADMIN_USER_IDS:-}"
PORT="${PORT:-3001}"

cd "$APP_DIR"

if [[ -d .git ]]; then
  git pull origin main
fi

# Обновление .env только если передан BOT_TOKEN (деплой с Mac)
if [[ -n "$BOT_TOKEN" ]]; then
  EXISTING_SECRET=""
  EXISTING_ALLOWED_IPS=""
  if [[ -f "$APP_DIR/.env" ]]; then
    EXISTING_SECRET=$(grep '^BOT_API_SECRET=' "$APP_DIR/.env" | cut -d= -f2- || true)
    EXISTING_ALLOWED_IPS=$(grep '^BOT_API_ALLOWED_IPS=' "$APP_DIR/.env" | cut -d= -f2- || true)
  fi
  BOT_API_SECRET="${BOT_API_SECRET:-${EXISTING_SECRET:-$(openssl rand -hex 32)}}"
  BOT_API_ALLOWED_IPS="${BOT_API_ALLOWED_IPS:-${EXISTING_ALLOWED_IPS:-127.0.0.1,::1}}"

  cat > "$APP_DIR/.env" <<EOF
BOT_TOKEN=${BOT_TOKEN}
BOT_API_SECRET=${BOT_API_SECRET}
BOT_API_ALLOWED_IPS=${BOT_API_ALLOWED_IPS}
BOT_USERNAME=${BOT_USERNAME}
WEBAPP_SHORT_NAME=${WEBAPP_SHORT_NAME}
WEBAPP_URL=https://${DOMAIN}
SERVER_URL=http://127.0.0.1:${PORT}
PORT=${PORT}
NODE_ENV=production
DEV_MODE=false
DISABLE_CRON=false
ADMIN_USER_IDS=${ADMIN_USER_IDS}
EOF
  chmod 600 "$APP_DIR/.env"
fi

if [[ -z "$BOT_TOKEN" && -f "$APP_DIR/deploy/server-update.sh" ]]; then
  echo "==> BOT_TOKEN не передан — полное обновление через server-update.sh"
  exec bash "$APP_DIR/deploy/server-update.sh"
fi

npm install
npm run build
pm2 restart liga-server liga-bot
pm2 save

echo "OK: https://${DOMAIN} | pm2 status:"
pm2 status
