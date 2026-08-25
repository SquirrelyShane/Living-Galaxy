# PATCH v1.03.00 — "Somewhere To Live"

The galaxy server: `server.py` retired, replaced by a stdlib-only Node process that serves
the game, rooms pilots by system, and owns accounts, wallets and world deltas inside an
encrypted vault. Gate: **68/68 suites green** (`node test/all.mjs --quiet`).

## Files touched

### New
| File | What |
| --- | --- |
| `server/main.js` | the process — static serving, `/api/status`, upgrade handling, the message router, TLS autodetect, age persistence |
| `server/wire.js` | RFC 6455 by hand — handshake, incremental frame parser, connection wrapper |
| `server/vault.js` | scrypt → AES-256-GCM encrypted store; atomic writes; passphrase check record; account password hashing |
| `server/tickets.js` | HMAC-signed expiring resume/session tickets |
| `server/rooms.js` | system = shard; per-room host election with tenure; occupancy; motion guard |
| `server/registry.js` | accounts, the wallet ledger, per-system world deltas, the server document |
| `tools/make-certs.sh` | local CA + server cert with LAN SANs → https/wss |
| `docs/SERVER.md` | operator's guide + architecture + upgrade paths |
| `test/vault.mjs` | 54 checks — crypto, wire codec, tickets, rooms, motion guard |
| `test/galaxy-server.mjs` | 13 checks — durability across a process kill; wrong-passphrase refusal; nothing legible on disk |

### Changed
| File | What |
| --- | --- |
| `src/systems/platform/net.js` | rooms (re-room on `S.galaxy.node` change, `room` message), account login, wallet (`netBank`), world deltas (`registerDeltas`/`sendDelta`), warp flag on state, richer `netReport()` |
| `src/main.js` | boot passes the account passphrase to `connectNet` |
| `index.html` | `mp-pass` input on the boot card; server-flavoured placeholder text |
| `src/core/version.js` | 1.03.00 "Somewhere To Live"; schema **unchanged** at 23 |
| `package.json` | version; `galaxy`/`certs` scripts; new test scripts; `relay` removed |
| `test/net.mjs` | rewritten against `server/main.js` — old relay coverage kept, rooms/auth/ticket coverage added (36 checks) |
| `test/all.mjs` | three suite registrations |
| `README.md` | multiplayer section rewritten for the galaxy server; test roster updated |
| `CHANGELOG.md` | this release |

### Removed
| File | Why |
| --- | --- |
| `server.py` | superseded; every behaviour it had is asserted against the new server in `test/net.mjs` before the new coverage begins |

## Verified

- 68/68 suites green, including the three new ones and the rewritten `net`.
- TLS smoke test: `make-certs.sh` → https `/api/status`, game served 200, vault path 403.
- Wrong vault passphrase refuses boot (exit 1) before any write — asserted in suite.
- Encrypted-at-rest asserted by grepping raw vault files for stored secrets.
- Host tenure asserted (an arrival cannot unseat a sitting host) — this was a live bug
  found during the slice: global seniority let a senior pilot yank authority on jump-in.
- Wallet arithmetic (deposit, withdraw, overdraft, negative amounts) and delta
  latest-per-key survival across restart.

## Not verified (honest list)

- Real-browser wss with the generated CA — smoke-tested with curl only; not driven from a
  real Chrome/Firefox profile in this environment. First LAN session should confirm the
  one-time cert acceptance flow on each player device.
- The wallet has no cockpit UI yet — `netBank()` is wired and tested at the protocol
  layer; a dock-services "Bank" pane is the natural next slice. ARIA could also take
  "bank five thousand credits" through `systems/platform/tools.js`.
- No game system writes world deltas yet — the channel is live end-to-end (host-gated,
  persisted, replayed) but wrecks/claims adopting it is future work.
- Termux hosting of the Node server — Node runs under Termux, but not exercised here.

## Notes for the next slice

- The market/trade network (queued #1) now has its home: order books are registry records,
  and the `bank` message is the transactional pattern to copy.
- Server-side NPC authority: a headless client joining busy rooms with host priority —
  the election rule in `rooms.js` is the only seam.
