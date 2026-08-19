#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building HealthCare client..."
npm run build:client

echo "==> Deploying to Catalyst (Project-Rainfall / Development)..."
catalyst --dc us --org 935860161 --project 80411000000014038 deploy "$@"

echo "==> Done. App URL:"
echo "    https://project-rainfall-935860161.development.catalystserverless.com/app/"
echo "    API: https://project-rainfall-935860161.development.catalystserverless.com/server/careflow-api"
