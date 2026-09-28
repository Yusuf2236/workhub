#!/usr/bin/env bash
# WZone — Mobile Emulator & Device Runner Script (Android & iOS)
set -e

PORT=3005
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo "  📱 WZone Mobile Emulator & Device Runner"
echo "=================================================="
echo "  URL:       http://localhost:$PORT"
echo "  Backend:   http://localhost:8080"
echo "  Devices:   Google Pixel 8 Pro (Android), Apple iPhone 16 Pro (iOS)"
echo "  Mode:      Dual Side-by-Side (2lasini bir vaqtda sinash)"
echo "=================================================="

exec python3 -m http.server "$PORT" --directory "$DIR"
