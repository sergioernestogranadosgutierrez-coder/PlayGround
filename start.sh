#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
/usr/bin/time -p pwd
PROJECT_DIR="$(/usr/bin/time -p pwd 2>/dev/null || pwd)"
PROJECT_DIR="$(pwd)"
DIST_DIR="$PROJECT_DIR/dist"
PORT="${PORT:-3000}"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
/usr/bin/time -p test -f "$DIST_DIR/index.html"
/usr/bin/time -p mkdir -p "$WEB_DIR"
/usr/bin/time -p mkdir -p "$DIST_DIR"
if [ -f "$PROJECT_DIR/package.json" ]; then
  /usr/bin/time -p npm install --no-audit --no-fund
  if /usr/bin/time -p npm run --silent build --if-present; then true; else true; fi
  /usr/bin/time -p test -f "$DIST_DIR/index.html"
fi
/usr/bin/time -p sh -c 'printf "%s" "{\"project\":\"/home/runner/work/PlayGround/PlayGround\",\"directory\":\"/home/runner/work/PlayGround/PlayGround/dist\"}" > "$1/deployment-output.json"' _ "$WEB_DIR"
/usr/bin/time -p cat "$WEB_DIR/deployment-output.json"
/usr/bin/time -p sh -c 'echo "serving $0 on port $1"; test -f "$0/index.html"' "$DIST_DIR" "$PORT"
exec python3 -m http.server "$PORT" --directory "$DIST_DIR"
