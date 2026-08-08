#!/usr/bin/env bash
# Living Galaxy — start the local HTTP server and open the game in the default browser.
# Usage: ./start.sh   (from the living-galaxy directory)
# Or:    bash start.sh

set -e
cd "$(dirname "$0")"

PORT=8080
URL="http://localhost:${PORT}/"

# Kill any previous server on this port (best-effort, ignore errors)
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
  pid=$(lsof -t -i:"${PORT}" 2>/dev/null || true)
  [ -n "$pid" ] && kill $pid 2>/dev/null || true
fi

echo "Starting Living Galaxy HTTP server on port ${PORT}..."
python3 -m http.server "$PORT" >/tmp/living-galaxy-http.log 2>&1 &
SERVER_PID=$!
echo "Server PID $SERVER_PID  (log: /tmp/living-galaxy-http.log)"

# Give the server a moment to bind
sleep 0.6

# Open default browser (desktop)
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open "$URL" || true
elif command -v sensible-browser >/dev/null 2>&1; then
  sensible-browser "$URL" || true
else
  echo "Open this URL in your browser: $URL"
fi

echo ""
echo "  Living Galaxy is running."
echo "  Main menu:  $URL"
echo "  Press Ctrl+C to stop the server."
echo ""

# Keep the script in the foreground so Ctrl+C kills the server
trap 'echo; echo "Stopping server…"; kill $SERVER_PID 2>/dev/null; exit 0' INT TERM
wait $SERVER_PID
