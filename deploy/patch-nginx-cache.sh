#!/usr/bin/env bash
# Патч nginx на уже настроенном сервере — правильный кэш для Mini App (важно для телефона).
set -euo pipefail

DOMAIN="${DOMAIN:-predictapp.ru}"
PORT="${PORT:-3001}"
NGINX_SITE="/etc/nginx/sites-available/predict"

if [[ ! -f "$NGINX_SITE" ]]; then
  echo "WARN: $NGINX_SITE не найден — пропуск nginx cache patch"
  exit 0
fi

if grep -q 'location /assets/' "$NGINX_SITE"; then
  echo "nginx cache headers уже настроены"
  exit 0
fi

python3 - "$NGINX_SITE" "$PORT" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
port = sys.argv[2]
text = path.read_text()

needle = "    location / {"
if needle not in text:
    print("WARN: не найден location / в nginx config")
    sys.exit(0)

insert = f"""    location /assets/ {{
        proxy_pass http://127.0.0.1:{port};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }}

    location = /telegram-web-app.js {{
        proxy_pass http://127.0.0.1:{port};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=86400" always;
    }}

"""

text = text.replace(needle, insert + needle, 1)

if 'add_header Cache-Control "no-cache, no-store, must-revalidate"' not in text:
    text = text.replace(
        "        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n",
        "        proxy_set_header X-Forwarded-Proto $scheme;\n"
        "        add_header Cache-Control \"no-cache, no-store, must-revalidate\" always;\n"
        "        add_header Pragma \"no-cache\" always;\n"
        "        add_header Expires \"0\" always;\n"
        "    }\n",
        1,
    )

path.write_text(text)
print("nginx cache patch applied")
PY

nginx -t
systemctl reload nginx
echo "nginx reloaded"
