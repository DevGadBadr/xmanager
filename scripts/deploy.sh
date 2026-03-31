#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="x-wrike-3008"

cd "$ROOT_DIR"

echo "[1/3] Building app..."
pnpm build

echo "[2/3] Restarting PM2 app: $APP_NAME"
pm2 startOrRestart ecosystem.config.cjs --only "$APP_NAME"

echo "[3/3] Saving PM2 process list"
pm2 save

echo "Deploy complete."
