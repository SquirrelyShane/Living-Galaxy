# PATCH v1.01.94 — "Seen Once"

A one-line fix with a wider blast radius than it looks, plus the favicon 404. Schema stays
**17**.

---

## The doubled contact

`Skud Extraction… 900 km` appeared twice in the Contacts list, and exactly once on the nav
map and once in the world. That combination is the diagnosis: **one object, registered
twice.**

`spawnNpc()` already does three things at the end — `scene.add(g)`, `trackInterp(g)` and
`S.world.npcs.push(g)`. `commissionHull()` then pushed the same object again. Rendering was
unaffected because `scene.add()` on an object already in the scene is a no-op, and the nav
map plots one marker per position, so both draws landed on the same pixel. Every list that
*walks* the array, though, saw two entries — which is the Contacts panel.

The part that was not cosmetic: **the world stepped the hull twice per frame.** A
commissioned ship accelerated at double rate, cut ore at double rate, and its contract was
reconciled twice a tick. The extraction figures in v1.01.93 were measured against a hull
being simulated twice, so expect a commissioned miner to run at roughly half the speed it
did yesterday. That is the correct speed; yesterday's was the bug.

`test/hangar.mjs` now asserts a commissioned hull appears exactly once in `S.world.npcs` by
identity *and* by name, and that a fleet of six is six entries in the world rather than
twelve.

## The favicon

Browsers request `/favicon.ico` on every load whether or not the page asks for one, and the
Python dev server answers 404 each time. Harmless, but it is the first line of every console
session and it makes a clean run look like a broken one. Now an inline SVG data URI — no
extra file, no extra request.

## The other console output

Not errors, and nothing to fix:

- **`Unable to determine content-length…`** — transformers.js streaming a model whose server
  did not send the header. It expands its buffer and carries on.
- **`powerPreference … ignored on Windows`** — a Chromium notice about WebGPU adapter
  selection. Platform behaviour, not ours.
- **`Some nodes were not assigned to the preferred execution providers`** — onnxruntime
  placing shape operators on CPU deliberately. It says as much in the message.

---

## Files touched

| File | Change |
|---|---|
| `src/systems/fleet.js` | the duplicate `S.world.npcs.push()` removed |
| `index.html` | inline SVG favicon |
| `test/hangar.mjs` | three checks pinning single registration |
| `package.json`, `README.md`, `CHANGELOG.md`, `src/core/version.js` | 1.01.94 |

## Verified

- `node test/all.mjs` — **41/41 suites, 3,238 checks, 0 failed.**

## Not verified

Nothing rendered in a browser. The favicon is a data URI in the markup and passes the asset
audit, but no suite loads a page.

The extraction pacing numbers in `WORK` were tuned against a double-stepped hull and have not
been re-tuned. If a commissioned miner now feels sluggish, that is this fix landing, and
`cutRate`, `warpSpeed` and `transitBoost` are the numbers to move.
