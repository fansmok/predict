#!/usr/bin/env bash
# Запуск с Mac после того как SSH заработает:
#   SSHPASS='ваш-пароль' BOT_TOKEN='...' bash deploy/run-from-mac.sh

set -euo pipefail

SERVER="${SERVER:-root@186.246.6.229}"
APP_DIR="/opt/predict"
BOT_TOKEN="${BOT_TOKEN:?Задайте BOT_TOKEN}"
BOT_USERNAME="${BOT_USERNAME:-predictliga_bot}"
WEBAPP_SHORT_NAME="${WEBAPP_SHORT_NAME:-predictliga}"
DOMAIN="${DOMAIN:-predictapp.ru}"
ADMIN_USER_IDS="${ADMIN_USER_IDS:-}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v sshpass >/dev/null; then
  echo "Установите sshpass: brew install sshpass"
  exit 1
fi

export SSHPASS="${SSHPASS:?Задайте SSHPASS (root-пароль Timeweb)}"

echo "==> Проверка SSH"
sshpass -e ssh -o StrictHostKeyChecking=accept-new "$SERVER" "echo SSH OK"

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

echo "==> Установка на сервере"
sshpass -e ssh "$SERVER" "BOT_TOKEN='$BOT_TOKEN' BOT_USERNAME='$BOT_USERNAME' WEBAPP_SHORT_NAME='$WEBAPP_SHORT_NAME' DOMAIN='$DOMAIN' ADMIN_USER_IDS='$ADMIN_USER_IDS' bash $APP_DIR/deploy/setup-server.sh"

echo "==> Готово: https://$DOMAIN"
