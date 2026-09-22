#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
port="${1:-8080}"
if ! [[ "$port" =~ ^[0-9]+$ ]] || ((port < 1 || port > 65535)); then
  echo 'Usage: bash start-demo.sh [port 1–65535]' >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo 'Install Python first. In Termux: pkg install python' >&2
  exit 1
fi
printf 'Open http://127.0.0.1:%s/demo.html in your browser. Ctrl+C stops the server.\n' "$port"
exec python3 -m http.server "$port" --bind 127.0.0.1
