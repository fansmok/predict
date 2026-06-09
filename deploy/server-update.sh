#!/usr/bin/env bash
# Запускать НА СЕРВЕРЕ (консоль Timeweb или SSH):
#   bash /opt/predict/deploy/server-update.sh
#
# Подтягивает код с GitHub, дополняет .env, собирает и перезапускает PM2.

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/predict}"
DOMAIN="${DOMAIN:-predictapp.ru}"
PORT="${PORT:-3001}"

cd "$APP_DIR"

echo "==> Git pull"
if [[ -d .git ]]; then
  git pull origin main
else
  echo "ERROR: нет .git в $APP_DIR"
  exit 1
fi

ENV_FILE="$APP_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: нет $ENV_FILE — сначала deploy/setup-server.sh"
  exit 1
fi

echo "==> Проверка .env (security + production)"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

upsert_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

if [[ -z "${BOT_API_SECRET:-}" || "${BOT_API_SECRET}" == "your_bot_api_secret" ]]; then
  upsert_env "BOT_API_SECRET" "$(openssl rand -hex 32)"
  echo "    добавлен BOT_API_SECRET"
fi

if [[ -z "${BOT_API_ALLOWED_IPS:-}" ]]; then
  upsert_env "BOT_API_ALLOWED_IPS" "127.0.0.1,::1"
  echo "    добавлен BOT_API_ALLOWED_IPS"
fi

upsert_env "SERVER_URL" "http://127.0.0.1:${PORT}"
upsert_env "WEBAPP_URL" "https://${DOMAIN}"
upsert_env "NODE_ENV" "production"
upsert_env "DEV_MODE" "false"
upsert_env "PORT" "${PORT}"
chmod 600 "$ENV_FILE"

echo "==> npm install + build"
# devDependencies (typescript, vite) нужны для сборки; NODE_ENV=production их отключает
NODE_ENV=development npm install --include=dev
npm run build

echo "==> nginx cache (mobile WebView)"
if [[ -f "$APP_DIR/deploy/patch-nginx-cache.sh" ]]; then
  bash "$APP_DIR/deploy/patch-nginx-cache.sh" || echo "WARN: nginx cache patch skipped"
fi

echo "==> PM2"
if ! pm2 describe liga-server &>/dev/null; then
  echo "    первый запуск PM2"
  pm2 start npm --name liga-server -- start
  pm2 start npm --name liga-bot -- run start --workspace=bot
else
  pm2 restart liga-server liga-bot
fi
pm2 save

echo "==> Health check"
sleep 2
code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/api/config" || echo "000")
echo "    /api/config → HTTP $code"

if [[ "$code" != "200" ]]; then
  echo "==> Последние логи liga-server:"
  pm2 logs liga-server --lines 30 --nostream || true
  exit 1
fi

echo ""
echo "OK: https://${DOMAIN}"
pm2 status
