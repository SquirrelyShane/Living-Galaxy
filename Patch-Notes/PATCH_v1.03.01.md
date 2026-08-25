# PATCH v1.03.01 — "A Name On The Door"

The launcher and the custom address: one command (or double-click) from cold laptop to
open cockpit, and players join at `galaxy.local` instead of an IP. Gate: **69/69 suites
green** (`node test/all.mjs --quiet`).

## Files touched

### New
| File | What |
| --- | --- |
| `server/beacon.js` | stdlib mDNS responder — answers A queries for `<name>.local` with the machine's LAN IPv4s; pure DNS packet codec (`parseQuery`/`buildAnswer`) exported for the suite; degrades to a logged warning + IP fallback if 5353 can't be shared |
| `launch.cmd` | Windows launcher — certs if possible, passphrase prompt, server start, readiness poll via curl, browser open, join line printed |
| `test/beacon.mjs` | 15 checks — codec against hand-built packet bytes; live responder answering a QU query unicast (no multicast dependency in the sandbox); foreign names get silence |

### Changed
| File | What |
| --- | --- |
| `start.sh` | rewritten: was a python http.server helper, now the full launcher — cert generation on first run, no-echo passphrase read, readiness polled against `/api/status`, wrong-passphrase caught and named, browser opened (Termux/Android/desktop paths kept), SIGTERM shutdown so pilots park and age saves |
| `server/main.js` | `--name`/`GALAXY_NAME` (default `galaxy`) + `--no-beacon`; starts the beacon; prints "players join at https://galaxy.local:PORT" + IP fallbacks; `/api/status` reports `name` and `ips` |
| `tools/make-certs.sh` | `DNS:<name>.local` SAN, name from `GALAXY_NAME` |
| `index.html` | boot placeholder suggests `wss://galaxy.local:8765` |
| `src/core/version.js` | 1.03.01 "A Name On The Door"; schema unchanged at 23 |
| `package.json` | version; `test:beacon` script |
| `test/all.mjs` | `beacon` suite registered |
| `test/net.mjs`, `test/galaxy-server.mjs` | spawn with `--no-beacon` so suites stay quiet and port-collision-free |
| `README.md`, `docs/SERVER.md` | launcher + name-on-the-door sections |
| `CHANGELOG.md` | this release |

## Verified

- 69/69 suites green.
- Beacon live-answers a QU query with this machine's addresses; ignores foreign names;
  codec asserted against hand-built DNS bytes (flags, cache-flush class, id 0, rdata).
- `start.sh` end-to-end in this environment: first-run cert generation (with
  `DNS:galaxy.local` SAN), server up, `/api/status` over https answering, join lines
  printed, clean SIGTERM shutdown.
- Wrong-passphrase fast-exit is caught by the launcher's stayed-up check.

## Not verified (honest list)

- `.local` resolution from real player devices (iPhone/Android/Windows) against this
  beacon — the responder follows RFC 6762's answer shape and was live-tested by direct
  query, but the first LAN session should confirm each device family resolves it. The
  printed IP fallback covers any that don't.
- `launch.cmd` on a real Windows box (batch is untestable here) — the flow mirrors
  start.sh; worst case is the readiness loop's `timeout /t` granularity.
- Coexistence with another mDNS stack bound to 5353 (Windows' native resolver, avahi):
  the socket opens with address reuse and the failure path is the logged IP fallback,
  but side-by-side behaviour on the Legion itself is the thing to watch on first run.

## Notes for the next slice

- The beacon only answers A (IPv4). AAAA is a small addition if a player device insists
  on IPv6-first resolution and stalls — none observed yet.
- If the galaxy ever leaves the LAN (friends joining over the internet), the honest path
  is a rented domain + real certificate (Let's Encrypt) + port forward or a tunnel;
  mDNS does not cross routers by design. `docs/SERVER.md` would grow a section.
