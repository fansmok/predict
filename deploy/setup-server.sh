#!/usr/bin/env bash
# Деплой «Лига Прогнозов» на Ubuntu 22.04 (Timeweb VPS)
# Запуск:
#   BOT_TOKEN='...' BOT_USERNAME='predictliga_bot' DOMAIN='predictapp.ru' \
#   ADMIN_USER_IDS='123456789' bash setup-server.sh

set -euo pipefail

APP_DIR="/opt/predict"
REPO_URL="https://github.com/fansmok/predict.git"
BOT_TOKEN="${BOT_TOKEN:?Задайте BOT_TOKEN}"
BOT_USERNAME="${BOT_USERNAME:?Задайте BOT_USERNAME}"
DOMAIN="${DOMAIN:?Задайте DOMAIN (например predictapp.ru)}"
ADMIN_USER_IDS="${ADMIN_USER_IDS:-}"
WEBAPP_URL="https://${DOMAIN}"
SERVER_URL="https://${DOMAIN}"
PORT="${PORT:-3001}"

echo "==> Обновление системы"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

echo "==> Установка пакетов"
apt-get install -y -qq git curl nginx certbot python3-certbot-nginx ufw

echo "==> Node.js 20"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

echo "==> PM2"
npm install -g pm2

echo "==> Клонирование репозитория"
if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> .env"
cat > "$APP_DIR/.env" <<EOF
BOT_TOKEN=${BOT_TOKEN}
BOT_USERNAME=${BOT_USERNAME}
WEBAPP_URL=${WEBAPP_URL}
SERVER_URL=${SERVER_URL}
PORT=${PORT}
NODE_ENV=production
DEV_MODE=false
DISABLE_CRON=false
ADMIN_USER_IDS=${ADMIN_USER_IDS}
EOF
chmod 600 "$APP_DIR/.env"

echo "==> Сборка"
npm install
npm run build

echo "==> nginx"
cat > /etc/nginx/sites-available/predict <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/predict /etc/nginx/sites-enabled/predict
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

echo "==> Firewall"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> PM2: server + bot"
cd "$APP_DIR"
pm2 delete liga-server liga-bot 2>/dev/null || true
pm2 start npm --name liga-server -- start
pm2 start npm --name liga-bot -- run start --workspace=bot
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo "==> SSL (Let's Encrypt)"
if dig +short "${DOMAIN}" A | grep -q .; then
  certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" \
    --non-interactive --agree-tos --register-unsafely-without-email --redirect || \
    echo "WARN: certbot не удался — проверьте DNS A-запись ${DOMAIN} -> $(curl -4 -s ifconfig.me)"
else
  echo "WARN: DNS для ${DOMAIN} ещё не настроен. SSL пропущен."
  echo "      После настройки A-записи выполните:"
  echo "      certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
fi

echo ""
echo "============================================"
echo "  Готово!"
echo "  URL:  ${WEBAPP_URL}"
echo "  Bot:  @${BOT_USERNAME}"
echo "  PM2:  pm2 status"
echo "============================================"
