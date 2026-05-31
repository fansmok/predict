#!/usr/bin/env bash
# Запуск с Mac:
#   SSHPASS='root-пароль' BOT_TOKEN='...' UPDATE_ONLY=1 bash deploy/run-from-mac.sh

set -euo pipefail

SERVER="${SERVER:-root@186.246.6.229}"
APP_DIR="/opt/predict"
BOT_TOKEN="${BOT_TOKEN:?Задайте BOT_TOKEN}"
BOT_USERNAME="${BOT_USERNAME:-predictliga_bot}"
WEBAPP_SHORT_NAME="${WEBAPP_SHORT_NAME:-predictliga}"
DOMAIN="${DOMAIN:-predictapp.ru}"
ADMIN_USER_IDS="${ADMIN_USER_IDS:-}"
UPDATE_ONLY="${UPDATE_ONLY:-1}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v sshpass >/dev/null; then
  echo "Установите sshpass: brew install sshpass"
  exit 1
fi

export SSHPASS="${SSHPASS:?Задайте SSHPASS (root-пароль Timeweb)}"

echo "==> Проверка SSH"
sshpass -e ssh \
  -o StrictHostKeyChecking=accept-new \
  -o ConnectTimeout=30 \
  -o ServerAliveInterval=10 \
  "$SERVER" "echo SSH OK"

echo "==> Загрузка файлов"
sshpass -e rsync -avz --delete \
  --exclude node_modules \
  --exclude client/dist \
  --exclude server/dist \
  --exclude server/data.db \
  --exclude server/data.db-wal \
  --exclude server/data.db-shm \
  --exclude .git \
  --exclude .env \
  "$ROOT_DIR/" "$SERVER:$APP_DIR/"

if [[ "$UPDATE_ONLY" == "1" ]]; then
  echo "==> Обновление на сервере"
  sshpass -e ssh "$SERVER" "BOT_TOKEN='$BOT_TOKEN' BOT_USERNAME='$BOT_USERNAME' WEBAPP_SHORT_NAME='$WEBAPP_SHORT_NAME' DOMAIN='$DOMAIN' ADMIN_USER_IDS='$ADMIN_USER_IDS' bash $APP_DIR/deploy/update-server.sh"
else
  echo "==> Полная установка на сервере"
  sshpass -e ssh "$SERVER" "BOT_TOKEN='$BOT_TOKEN' BOT_USERNAME='$BOT_USERNAME' WEBAPP_SHORT_NAME='$WEBAPP_SHORT_NAME' DOMAIN='$DOMAIN' ADMIN_USER_IDS='$ADMIN_USER_IDS' bash $APP_DIR/deploy/setup-server.sh"
fi

echo "==> Готово: https://$DOMAIN"
