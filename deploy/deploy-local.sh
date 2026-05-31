#!/usr/bin/env bash
# Деплой с Mac: подхватывает .env, нужен SSHPASS (пароль root Timeweb).
#
#   export SSHPASS='пароль-root'
#   bash deploy/deploy-local.sh
#
# Или одной строкой:
#   SSHPASS='...' bash deploy/deploy-local.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export BOT_TOKEN="${BOT_TOKEN:?Задайте BOT_TOKEN в .env}"
export SSHPASS="${SSHPASS:?Задайте SSHPASS (пароль root VPS): export SSHPASS='...'}"
export UPDATE_ONLY="${UPDATE_ONLY:-1}"
export DOMAIN="${DOMAIN:-predictapp.ru}"
export ADMIN_USER_IDS="${ADMIN_USER_IDS:-}"

exec bash "$ROOT_DIR/deploy/run-from-mac.sh"
