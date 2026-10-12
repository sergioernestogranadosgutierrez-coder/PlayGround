#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
# Servidor propio: sirve la app + API (/api/chat, /api/image, /api/search, /api/vision)
exec node server.js
