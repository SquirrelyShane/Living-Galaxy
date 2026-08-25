# PATCH v1.03.02 — "Papers In Order"

Hotfix slice from the first real deployment (Windows, no Git Bash, no openssl): the
openssl cert flow failed half-way and the server crashed reading the missing half. TLS
is now self-issued in pure Node at every boot, and the failure modes speak. Gate:
**70/70 suites green**.

## Root cause (from the field)

`galaxy-data/certs/` on the deployment machine held `ca.key` + `server.key` but no
`.crt` files — `make-certs.sh` had died mid-run with its errors hidden by `2>/dev/null`.
`server/main.js` then tested `existsSync(server.key)` but read `server.crt` → ENOENT at
module top level → instant exit → the launcher's minimized window closed unreadably.

## Files touched

### New
| File | What |
| --- | --- |
| `server/certs.js` | pure-Node X.509: minimal DER encoder, ECDSA P-256, one self-signed cert (CA:TRUE, serverAuth, SANs = beacon name + localhost + LAN IPs); `ensureCerts()` issues/reissues at boot, heals half-states, sweeps openssl leavings, writes the pair atomically |
| `tools/make-certs.mjs` | manual reissue with extra names (VPN address, other-subnet hostname) |
| `test/certs.mjs` | 22 checks — DER validated by node:crypto's X509Certificate, live TLS handshake, and the field half-states: key-without-cert, foreign leavings, rename, corruption — all must heal |

### Changed
| File | What |
| --- | --- |
| `server/main.js` | boot calls `ensureCerts` (the existsSync/readFile mismatch is gone); EADDRINUSE and other listen errors exit with a plain sentence, not a stack trace |
| `launch.cmd` | no openssl/bash anywhere; stops a stale galaxy first (PowerShell process match); probes https then http for readiness; failure output includes the server's own log and names the two usual causes; passphrase semantics stated at the prompt |
| `start.sh` | cert step removed (server's job now); readiness probes https then http; passphrase semantics stated |
| `tools/make-certs.sh` | reduced to a shim that execs the .mjs |
| `src/core/version.js` | 1.03.02 "Papers In Order"; schema unchanged at 23 |
| `package.json` | version; `certs` script → node; `test:certs` |
| `test/all.mjs` | `certs` suite registered |
| `README.md`, `docs/SERVER.md` | TLS-is-automatic wording; make-certs references updated |
| `CHANGELOG.md` | this release |

## Verified

- 70/70 suites green.
- Cold start with no `galaxy-data/`: cert self-issued, https/wss up, `/api/status`
  reachable, real TLS handshake shows `DNS:galaxy.local, DNS:localhost` + both IPs
  (checked with openssl s_client against the running server).
- Generated cert passes `openssl verify` and node:crypto `X509Certificate.verify`.
- The exact field failure (server.key present, server.crt absent, ca.key leavings)
  reproduced in the suite — heals by reissue, leavings swept.
- Wrong-passphrase and port-in-use paths print sentences, not stacks.

## Not verified (honest list)

- `launch.cmd` on the Legion itself — the flow is unchanged in shape; the new parts
  (PowerShell stale-kill, dual-scheme probe) follow stock Windows tooling. First
  double-click will confirm.
- Browser acceptance of the ECDSA self-signed cert on each player device family —
  Chrome/Edge/Firefox/Safari all accept-with-warning for P-256 self-signed; not driven
  from real profiles here.

## Notes

- The vault passphrase on the deployment machine is whatever was typed on its FIRST
  launcher run (the vault already exists there — `galaxy-data/check` is sealed under
  it). A mismatch now exits with "Wrong vault passphrase" in the surfaced log. Reset =
  delete `galaxy-data/` (wipes accounts/wallets/deltas).
