#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=================================================="
echo "  🚀 Starting WorkHub Platform (Full Stack)"
echo "=================================================="

# 1. Start Docker infra (PostgreSQL, Redis, MinIO)
echo "[1/5] Starting Docker containers (Postgres, Redis, MinIO)..."
cd "$ROOT_DIR/backend"
docker compose up -d

# 2. Check backend .env
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
fi

# 3. Start Backend in background if not already running
if ! curl -s http://localhost:8080/health >/dev/null 2>&1; then
  echo "[2/5] Starting Go Backend API on port 8080..."
  (cd "$ROOT_DIR/backend" && go run ./cmd/api) &
else
  echo "[2/5] Backend is already running on port 8080."
fi

# 4. Start Web Client on port 3000
if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
  echo "[3/5] Starting Web Client on port 3000..."
  (cd "$ROOT_DIR/web" && npm run dev) &
else
  echo "[3/5] Web is already running on port 3000."
fi

# 5. Start Admin Dashboard on port 3001
if ! curl -s http://localhost:3001 >/dev/null 2>&1; then
  echo "[4/5] Starting Admin Dashboard on port 3001..."
  (cd "$ROOT_DIR/admin" && npm run dev) &
else
  echo "[4/5] Admin is already running on port 3001."
fi

# 6. Start Mobile Emulator on port 3005
if ! curl -s http://localhost:3005 >/dev/null 2>&1; then
  echo "[5/6] Starting Mobile Emulator on port 3005..."
  (cd "$ROOT_DIR/emulator" && python3 -m http.server 3005) &
else
  echo "[5/6] Emulator is already running on port 3005."
fi

# 7. Start 3D Mobile Preview Studio on port 3006
if ! curl -s http://localhost:3006 >/dev/null 2>&1; then
  echo "[6/6] Starting 3D Mobile Preview Studio on port 3006..."
  (cd "$ROOT_DIR/preview-3d" && python3 -m http.server 3006) &
else
  echo "[6/6] 3D Mobile Preview is already running on port 3006."
fi

echo "=================================================="
echo "  ✅ All WorkHub services are running!"
echo "=================================================="
echo "  - Web App:          http://localhost:3000"
echo "  - Admin Dashboard:  http://localhost:3001"
echo "  - Mobile Emulator:  http://localhost:3005"
echo "  - 3D Preview:       http://localhost:3006"
echo "  - Backend API:      http://localhost:8080"
echo "  - MinIO Console:    http://localhost:9003 (minioadmin / minioadmin)"
echo "  - PostgreSQL:       localhost:5433 (user: postgres, db: workhub)"
echo "  - Redis:            localhost:6380"
echo "=================================================="
