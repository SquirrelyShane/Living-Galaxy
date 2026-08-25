#!/usr/bin/env bash
# Living Galaxy — one command from cold laptop to open cockpit.
#
#     ./start.sh                # certs if missing → server up → browser open
#     PORT=9000 ./start.sh
#     GALAXY_PASS=... ./start.sh    # unattended (systemd, tmux, Termux:Boot)
#     GALAXY_NAME=nexis ./start.sh  # players join at nexis.local instead
#
# Until v1.03 this file started a bare python http.server, because that was all serving
# the game took. The galaxy server does that job itself now (plus the sockets, the vault
# and the beacon), so this script's job is smaller and better: make sure the certificates
# exist, get the server up, wait until it actually answers, open the cockpit, and print
# the one line players need — the name, not your IP.
set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

PORT="${PORT:-8765}"
NAME="${GALAXY_NAME:-galaxy}"
DATA="${SCRIPT_DIR}/galaxy-data"
LOG_FILE="${SCRIPT_DIR}/living-galaxy.log"
PID_FILE="${SCRIPT_DIR}/living-galaxy.pid"
SERVER_PID=""

info()  { printf '%s\n' "$*"; }
error() { printf 'ERROR: %s\n' "$*" >&2; }

cleanup() {
    local status=$?
    if [ -n "${SERVER_PID}" ] && kill -0 "${SERVER_PID}" 2>/dev/null; then
        info ""
        info "Stopping the galaxy..."
        # SIGTERM, not -9: the server parks every connected pilot and saves the world's
        # age on the way down. Give it that chance before insisting.
        kill "${SERVER_PID}" 2>/dev/null || true
        for _ in 1 2 3 4 5; do
            kill -0 "${SERVER_PID}" 2>/dev/null || break
            sleep 0.2
        done
        kill -0 "${SERVER_PID}" 2>/dev/null && kill -9 "${SERVER_PID}" 2>/dev/null || true
    fi
    rm -f "${PID_FILE}" 2>/dev/null || true
    exit "${status}"
}
trap cleanup INT TERM EXIT

# ── prerequisites ────────────────────────────────────────────────────

if ! command -v node >/dev/null 2>&1; then
    error "node was not found. Termux: pkg install nodejs · Debian/Ubuntu: apt install nodejs"
    trap - INT TERM EXIT; exit 1
fi

case "${PORT}" in ''|*[!0-9]*) error "Invalid PORT: ${PORT}"; trap - INT TERM EXIT; exit 1 ;; esac

# Stop a server left behind by a previous run of this script (and only that one).
if [ -f "${PID_FILE}" ]; then
    OLD_PID="$(cat "${PID_FILE}" 2>/dev/null || true)"
    if [ -n "${OLD_PID}" ] && kill -0 "${OLD_PID}" 2>/dev/null; then
        info "Stopping previous galaxy (PID ${OLD_PID})..."
        kill "${OLD_PID}" 2>/dev/null || true
        sleep 0.5
        kill -0 "${OLD_PID}" 2>/dev/null && kill -9 "${OLD_PID}" 2>/dev/null || true
    fi
    rm -f "${PID_FILE}" 2>/dev/null || true
fi

# ── certificates ─────────────────────────────────────────────────────
# Not this script's job any more: the server issues (and refreshes) its own certificate
# in pure Node at boot — no openssl anywhere. The readiness poll below probes https
# first and falls back to http so a deliberately-plain run is still detected honestly.

SCHEME="https"

# ── the vault passphrase ─────────────────────────────────────────────
# Read here rather than letting the server prompt, because the server's stdin is about to
# be a background process's. Never echoed, never written anywhere.
# First ever run: what you type BECOMES the passphrase — every later run must match it.
# Forgotten? Delete galaxy-data/ to reset (wipes accounts, banked credits, world history).

if [ -z "${GALAXY_PASS:-}" ]; then
    printf 'Vault passphrase: '
    stty -echo 2>/dev/null || true
    IFS= read -r GALAXY_PASS
    stty echo 2>/dev/null || true
    printf '\n'
    export GALAXY_PASS
fi

# ── lift off ─────────────────────────────────────────────────────────

: > "${LOG_FILE}" 2>/dev/null || { error "Cannot write ${LOG_FILE}"; trap - INT TERM EXIT; exit 1; }

info "Starting the galaxy server..."
node server/main.js --port="${PORT}" --name="${NAME}" >"${LOG_FILE}" 2>&1 &
SERVER_PID=$!
printf '%s\n' "${SERVER_PID}" > "${PID_FILE}" 2>/dev/null || true

# Ready means answering, not merely running — poll the status endpoint the way a player's
# browser would. -k because the CA is ours, not curl's.
READY=0
for _ in $(seq 1 40); do
    sleep 0.25
    if ! kill -0 "${SERVER_PID}" 2>/dev/null; then break; fi
    if command -v curl >/dev/null 2>&1; then
        curl -fsSk --max-time 1 "https://127.0.0.1:${PORT}/api/status" >/dev/null 2>&1 && { READY=1; SCHEME="https"; break; }
        curl -fsS --max-time 1 "http://127.0.0.1:${PORT}/api/status" >/dev/null 2>&1 && { READY=1; SCHEME="http"; break; }
    else
        # No curl (bare Termux): a TCP connect is the best probe available.
        (node -e "const n=require('net');const s=n.connect(${PORT},'127.0.0.1',()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1))") && { READY=1; break; }
    fi
done

if [ "${READY}" -ne 1 ]; then
    error "The galaxy server did not become ready. Its log:"
    info "----------------------------------------"
    cat "${LOG_FILE}" 2>/dev/null || true
    info "----------------------------------------"
    trap - INT TERM EXIT
    [ -n "${SERVER_PID}" ] && kill "${SERVER_PID}" 2>/dev/null || true
    rm -f "${PID_FILE}"
    exit 1
fi

# A wrong passphrase exits fast but can still sneak past one poll — check it stayed up.
sleep 0.3
if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
    error "The server started and immediately stopped — usually a wrong vault passphrase. Its log:"
    cat "${LOG_FILE}" 2>/dev/null || true
    trap - INT TERM EXIT; rm -f "${PID_FILE}"; exit 1
fi

# ── open the cockpit ─────────────────────────────────────────────────
# The machine hosting the beacon is the one machine that may not resolve its own name
# (Linux without avahi, for instance), so the local window opens by localhost — same
# certificate, same origin, zero resolution risk. The NAME is for everyone else.

LOCAL_URL="${SCHEME}://localhost:${PORT}/"
if getent hosts "${NAME}.local" >/dev/null 2>&1; then LOCAL_URL="${SCHEME}://${NAME}.local:${PORT}/"; fi

open_browser() {
    if command -v termux-open-url >/dev/null 2>&1; then termux-open-url "${LOCAL_URL}" >/dev/null 2>&1 & return 0; fi
    if command -v am >/dev/null 2>&1; then am start -a android.intent.action.VIEW -d "${LOCAL_URL}" >/dev/null 2>&1 & return 0; fi
    if command -v xdg-open >/dev/null 2>&1; then xdg-open "${LOCAL_URL}" >/dev/null 2>&1 & return 0; fi
    if command -v open >/dev/null 2>&1; then open "${LOCAL_URL}" >/dev/null 2>&1 & return 0; fi
    return 1
}
open_browser && BROWSER_NOTE="Browser opening at ${LOCAL_URL}" || BROWSER_NOTE="Open ${LOCAL_URL} yourself — no browser launcher found."

info ""
info "========================================"
info " Living Galaxy is up"
info "========================================"
info " Players join at:  ${SCHEME}://${NAME}.local:${PORT}/"
info "   (boot screen:   wss://${NAME}.local:${PORT})"
grep '(by IP' "${LOG_FILE}" 2>/dev/null | sed 's/^/  fallback /'
info " ${BROWSER_NOTE}"
info " Log: ${LOG_FILE}"
info ""
info " First https visit on each device: accept the certificate once"
info " (or install galaxy-data/certs/ca.crt). Ctrl+C stops the galaxy."
info "========================================"
info ""

wait "${SERVER_PID}"
STATUS=$?
[ "${STATUS}" -ne 0 ] && { error "The galaxy server stopped unexpectedly. Log:"; cat "${LOG_FILE}" 2>/dev/null || true; }
SERVER_PID=""
trap - INT TERM EXIT
rm -f "${PID_FILE}" 2>/dev/null || true
exit "${STATUS}"
