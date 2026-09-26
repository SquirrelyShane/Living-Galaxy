#!/usr/bin/env bash
# Run after deploying this game's source and website 0.2.3.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo 'Run with sudo.'; exit 1; }
NODE_BIN=$(command -v node || true)
[ -n "$NODE_BIN" ] || { echo 'Install Node.js 22 or newer, then rerun.'; exit 1; }
"$NODE_BIN" -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)' || { echo 'Node.js 22+ required.'; exit 1; }
GAME=/srv/living-galaxy/game
RELAY=/srv/living-galaxy/relay
[ -f "$GAME/host/sol-host.mjs" ] || { echo 'Deploy the updated game source first (host/sol-host.mjs missing).'; exit 1; }
grep -q 'class SolStore' "$RELAY/server.py" || { echo 'Updated relay server.py is not deployed yet.'; exit 1; }
id lgsite >/dev/null
# Optional import of the pre-upgrade in-memory snapshot; never replace a saved world.
if [ "${1:-}" = "--seed" ]; then
  [ -f "${2:-}" ] || { echo 'Usage: install-sol.sh --seed /path/to/sol-before-persistence.json'; exit 1; }
  python3 - "$2" "$RELAY/sol-state.sqlite3" <<'PYSEED'
import json, sqlite3, sys, time, os, pwd
source, dest = sys.argv[1:]
if os.path.exists(dest):
    print('Persistent Sol database already exists; seed import skipped.')
else:
    data=json.load(open(source))
    world=data.get('world')
    if not isinstance(world,dict) or world.get('v') != 1:
        print('Seed has no world snapshot; Sol will initialize on first start.')
    else:
        record={'world':world,'wseq':data.get('wseq',1),'at':data.get('at',time.time()),'born':data.get('born',time.time()),'hostState':{}}
        with sqlite3.connect(dest) as db:
            db.execute('CREATE TABLE checkpoint(id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL)')
            db.execute('INSERT INTO checkpoint VALUES(1,?)',(json.dumps(record),))
        user=pwd.getpwnam('lgsite');os.chown(dest,user.pw_uid,user.pw_gid);os.chmod(dest,0o600)
        print('Imported Sol world checkpoint.')
PYSEED
fi
install -d -m 700 /etc/living-galaxy
if [ ! -s /etc/living-galaxy/sol.env ]; then
  python3 - <<'PY'
import secrets, os
p='/etc/living-galaxy/sol.env'
fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
with os.fdopen(fd,'w') as f:
    f.write('SOL_HOST_TOKEN='+secrets.token_hex(32)+'\nSOL_RELAY_URL=http://127.0.0.1:8080\nSOL_STATE_DB=/srv/living-galaxy/relay/sol-state.sqlite3\nSOL_STATUS_FILE=/srv/living-galaxy/relay/sol-host-status.json\n')
PY
fi
install -d /etc/systemd/system/lg-relay.service.d
cat > /etc/systemd/system/lg-relay.service.d/sol.conf <<'EOF'
[Service]
EnvironmentFile=/etc/living-galaxy/sol.env
EOF
cat > /etc/systemd/system/lg-sol.service <<EOF
[Unit]
Description=Living Galaxy persistent Sol simulation
After=network.target lg-relay.service
Requires=lg-relay.service
PartOf=lg-relay.service
StartLimitIntervalSec=0

[Service]
Type=simple
User=lgsite
Group=lgsite
WorkingDirectory=$GAME
EnvironmentFile=/etc/living-galaxy/sol.env
ExecStart=$NODE_BIN $GAME/host/sol-host.mjs
Restart=always
RestartSec=5
TimeoutStopSec=20
KillSignal=SIGTERM
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$RELAY
UMask=0077
MemoryMax=1G
TasksMax=128

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl restart lg-relay
systemctl enable --now lg-sol
sleep 2
systemctl --no-pager --full status lg-sol || true
printf '\nCheck: sudo journalctl -u lg-sol -n 30 --no-pager\nGNN: curl http://127.0.0.1:8080/net/gnn\n'
