# PATCH v1.01.73 — "Dispatch"

Executive command becomes a real surface: a curated dialogue menu and ARIA share one
resolver that emits structured fleet orders. Carried with it are the dock exterior-view
fix, the NPC check-in self-ack fix, the NPC knowledge-base substrate, and the fleet
objective timers that make idle command legible. Save schema stays **16** — nothing in
this slice changes the persisted payload shape.

`docs/OPEN_ITEMS.md` marks the curated dialogue menu closed. HQ spawn, real hull binding,
live nav-map command layer, and the self-training loop remain open.

---

## Why this slice

An executive who only has a company ledger is an accountant. An executive who can tell a
wing to patrol for thirty seconds, extract to a quota, or haul and return — and who can
do that from either a menu or a sentence to ARIA — is running an operation.

The failure mode to avoid was two channels that almost agreed. A button that dispatched
one shape of order and a spoken request that invented another would have made the
command surface untrustworthy the first time they diverged. So the menu and ARIA both
call `systems/command.js`, and that file is the only path into `dispatchFleet`.

---

## Fixed first (v1.01.71)

**Docked pilots could close the station overlay and become stranded.** Closing the dock
UI (or Service → View Outside) now enters a deliberate exterior view while still docked.
A HUD "Return to Station" control and the Dock key both restore the full station
interface, including Undock. Movement stays locked until a true undock. `S.viewOutside`
is the flag; `undock()` clears it.

**NPC check-in replies acknowledged the speaker instead of the other party.** After the
deliberate a/b swap in `exchange()`, the reply template used `${a.name}` (self). It now
uses `${b.name}` — the ship that marked them on the board. One line in
`data/npc-topics.js`; the rest of the topic table was already correct.

---

## NPC knowledge base (v1.01.72)

`src/data/npc-kb/` is the durable substrate for diagnostics and future onboard training.

| File | Role |
|------|------|
| `schema.js` | `NpcProfile`, `DiagnosticEvent`, `TrainingExample` + light validators |
| `profiles.js` | Role templates (mine, haul, trade, merc, combat, patrol, official, manager, board) with speech patterns, heuristics, loyalties, red lines, KPI defaults |
| `diagnostics.js` | Bounded event log, `diagnose()`, `diagnoseBoard()`, dialogue/manager helpers |
| `training-corpus.js` | Hand-curated seed examples for dialogue, decision, diagnostic, and command |
| `index.js` | Stable public surface |

NPC-to-NPC exchanges record dialogue diagnostics. ARIA rule answers and context cover
company books, board confidence, live fleet objectives, and per-NPC briefs
("who is X?", "diagnose…").

---

## Fleet objectives (v1.01.72)

`FLEET` config and `FLEET_ORDER_TYPES` in `systems/orders.js`:

| Type | Default | Notes |
|------|---------|--------|
| `patrol` | 30 s | Auto-return |
| `extract` | 120 s | Quota / single-load params |
| `logistics` | 90 s | Dest, commodity, return leg |
| `escort` | 60 s | Protect a hull |
| `survey_pass` | 45 s | Assay without ground team |
| `station_keep` | until recall | Passive-friendly |

Active / passive mode, progress, remaining timer. `updateFleetOrders(dt)` runs in the
sim phase. Demo wing assets only — binding to real owned hulls is still open.

---

## Curated command dialogue (v1.01.73)

**`src/data/command-menu.js`** — hierarchical desks:

- **Military** — patrol (30 / 90 / passive), escort (60 / 180), station-keep
- **Industrial** — extract (quota / single load / passive), survey pass
- **Logistical** — haul (return / one-way / passive), personnel transfer
- **Economic** — market presence, trade-lane watch
- **Civilian** — chart pass, support station-keep

Every leaf is `{ type, durationSec, mode, target, params }` plus preferred asset role/name.

**`src/systems/command.js`** — single resolver:

- `commandByPath` — Ops menu walk
- `commandById` — direct leaf
- `commandFromText` — ARIA / natural language via `intentFromUtterance`
- `commandRecall` — by asset, type, or `"last"`
- Dispatches write diagnostic events into `npc-kb`

**Ops → Staff** walks the tree with Back / Top breadcrumbs and Dispatch on leaves.
Flash line confirms the result.

**ARIA tools** (also in the rule matcher, no model required):

- `fleet_dispatch` / `fleet_recall` / `fleet_status` / `command_menu`
- Patterns scoped so pilot nav phrases ("send me to the belt") are not stolen

---

## Still open

From `docs/OPEN_ITEMS.md`, executive line:

- HQ interior / spawn-at-office when career is executive
- Bind fleet orders to real owned or contracted hulls
- Live nav-map entity layer under HQ / ship scan radius
- Per-asset active/passive toggle strip (mode is already on menu leaves)
- Self-training loop over `npc-kb` diagnostics

---

## Files touched (summary)

- `src/core/state.js`, `src/core/config.js`, `src/core/version.js`
- `src/ui/dock.js`, `src/ui/hud.js`, `src/ui/controls.js`, `src/ui/ops.js`, `index.html`, `css/hud.css`
- `src/systems/economy.js`, `src/systems/orders.js`, `src/systems/assistant.js`, `src/systems/tools.js`, `src/systems/npc-comms.js`, `src/systems/command.js` *(new)*
- `src/data/npc-topics.js`
- `src/data/npc-kb/*` *(new)*
- `src/data/command-menu.js` *(new)*
- `src/main.js`
- `docs/OPEN_ITEMS.md`, `CHANGELOG.md`

No schema migration. No new suites required for the green bar to stay honest about what
this slice claimed; fleet and command paths are exercised through the existing ops and
assistant surfaces.
