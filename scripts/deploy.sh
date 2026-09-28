#!/usr/bin/env bash
set -euo pipefail
ENV="${1:?usage: deploy.sh test|prod}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="$(basename "$APP_DIR")"
echo "==> Deploy ${APP_NAME} (${ENV})"
cd "$APP_DIR"
can_docker() { command -v docker >/dev/null && docker info >/dev/null 2>&1; }
case "$APP_NAME" in
  backend)
    if [[ -f src/docker-compose.yml ]] && can_docker; then
      sudo /bin/systemctl stop wzone-backend-placeholder 2>/dev/null || true
      cd src
      docker network create wzone_net 2>/dev/null || true
      if [[ -f .env.prod ]]; then set -a; . ./.env.prod; set +a; fi
      COMPOSE_PROJECT_NAME=wzone PORT_BIND="${PORT_BIND:-18090}" docker compose -p wzone up -d --build
      sleep 2
      curl -sf "http://127.0.0.1:${PORT_BIND:-18090}/health" || true
    fi
    ;;
  web|admin)
    if [[ -f src/docker-compose.yml ]] && can_docker && [[ -f src/Dockerfile ]]; then
      cd src
      docker network create wzone_net 2>/dev/null || true
      docker network connect wzone_net wzone_backend 2>/dev/null || true
      COMPOSE_PROJECT_NAME=wzone-web WEB_PORT="${WEB_PORT:-13000}" docker compose -p wzone-web up -d --build
    fi
    ;;
esac
if systemctl is-active nginx >/dev/null 2>&1; then
  sudo /usr/sbin/nginx -t && sudo /bin/systemctl reload nginx || true
fi
echo "OK ${APP_NAME} deploy done"

