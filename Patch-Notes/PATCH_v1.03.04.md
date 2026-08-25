# PATCH v1.03.04 — "Same Sky"

Root-caused from the first two-device session: pilots on one server flying different
galaxies, and no way to see where anyone was. Plus the domain guide. Gate: **70/70
suites green**.

## Files touched

| File | What |
| --- | --- |
| `src/main.js` | online, the server's galaxy is law: a save from another galaxy is relocated to the server's home node (everything aboard kept, said in words); layout forced procedural; density taken from the server |
| `server/main.js` | `--density` (server law, stored first boot); welcome carries `density` and `everyone` (name+sys per pilot); `who`/`gone` announced across systems on join/jump/leave |
| `server/registry.js` | serverDoc stores density; pre-1.03.04 docs backfilled |
| `src/systems/platform/net.js` | global pilot roster (`net.pilots`); welcome/`who`/`gone` handling with worded toasts ("Bravo is flying in XK-412 — find it on the chart"); roster cleared on disconnect; `everywhere` in netReport |
| `test/net.mjs` | +5 checks: everyone in welcome, density named, join/jump/departure announced across systems (41) |
| `docs/DOMAIN.md` | living-galaxy.com via Cloudflare Tunnel — setup, coexistence with galaxy.local, exposure cautions |
| `src/core/version.js`, `package.json` | 1.03.04; schema unchanged at 23 |
| `CHANGELOG.md`, this file | the release |

## Verified

- 70/70 green; cross-system announcements and welcome roster asserted against the real
  server; density flows server → welcome → generation input.
- Relocation logic exercised by reading: triggers only when `online && saved seed ≠
  server seed`; solo boot path byte-identical to before.

## Not verified (honest list)

- The relocation toast and arrival on real devices — next phone+desktop session is the
  test: both should now land in the same galaxy, see "X is flying in <system>", and be
  able to meet by jumping there.
- Cloudflare Tunnel end-to-end (needs the dashboard steps done on the Legion first).
- Two pilots parked mid-relocation edge: a relocated save writes its new placement on
  the next autosave; quitting before any save keeps the old galaxy placement (harmless —
  it relocates again next connect).

## Notes for the next slice

- "Meet up" affordance: the chart could mark occupied systems from `net.pilots` and
  offer JUMP TO PILOT directly — the data is already on the client.
- At hundreds of pilots, `who`/`gone` fan-out becomes a rate-limited digest; the message
  shape already allows it.
