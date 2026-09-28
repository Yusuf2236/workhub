#!/usr/bin/env bash
# Per-app deploy hook — copy to /opt/wzone/{app}/scripts/deploy.sh
set -euo pipefail

ENV="${1:?usage: deploy.sh test|prod}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="$(basename "$APP_DIR")"

echo "==> Deploy ${APP_NAME} (${ENV})"
cd "$APP_DIR"

has_real_static() {
  local dir="$1"
  [[ -d "$dir" ]] || return 1
  [[ -f "$dir/index.html" || -f "$dir/index.htm" ]] || return 1
  return 0
}

can_docker() {
  command -v docker >/dev/null 2>&1 || return 1
  docker info >/dev/null 2>&1 || return 1
  return 0
}

case "$APP_NAME" in
  backend)
    if [[ -f src/docker-compose.yml ]] && can_docker; then
      (
        cd src
        PORT_BIND="${PORT_BIND:-18080}" docker compose pull || true
        PORT_BIND="${PORT_BIND:-18080}" docker compose up -d --build
      )
    else
      echo "WARN: docker compose unavailable — write heartbeat"
      date -u +"deployed_at=%Y-%m-%dT%H:%M:%SZ" > "$APP_DIR/STATUS"
    fi
    ;;
  web|admin)
    mkdir -p www
    if has_real_static src/out; then
      rsync -a --delete src/out/ www/
    elif has_real_static src/dist; then
      rsync -a --delete src/dist/ www/
    else
      echo "WARN: no static build — writing placeholder"
      cat > www/index.html <<HTML
<!doctype html><html><head><meta charset="utf-8"><title>WZone ${APP_NAME}</title></head>
<body style="font-family:system-ui;padding:40px">
<h1>WZone ${APP_NAME}</h1>
<p>Environment: <b>${ENV}</b></p>
<p>Scaffold pending.</p>
</body></html>
HTML
    fi
    ;;
  *)
    echo "Unknown app: $APP_NAME"; exit 1
    ;;
esac

if command -v apachectl >/dev/null && systemctl is-active apache2 >/dev/null 2>&1; then
  sudo apachectl configtest && sudo systemctl reload apache2 || true
elif command -v nginx >/dev/null && systemctl is-active nginx >/dev/null 2>&1; then
  sudo nginx -t && sudo systemctl reload nginx || true
fi

echo "OK ${APP_NAME} deploy done"
