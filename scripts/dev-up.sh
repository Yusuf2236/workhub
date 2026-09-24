#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f backend/.env ]; then
  echo "backend/.env already exists"
else
  cp backend/.env.example backend/.env
fi

cd backend

docker compose up -d

go mod download

go run ./cmd/api
