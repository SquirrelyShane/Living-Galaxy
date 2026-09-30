# js/interior/deckplan.js

[index](../../../README.md) · 157 lines · 12 symbols · 2 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY experimental — hull deck plans.

Every hull in the registry grows a deterministic interior from its def and
the pilot's seed: one to three decks on a central spine, rooms sized to the
hull's tier, and the industrial spaces its complex would actually carry.
The interior is scaled up from the exterior on purpose — a 24 m skiff has
a bridge you can stand in — because the deck plan is a place to be, not a
cutaway. `INTERIOR_SCALE` is the one knob.

Rooms are laid out in grid cells (1 cell ≈ 3 m). Doors open onto the deck's
corridor band (y ∈ [0,1)); a lift shaft at `liftX` joins the decks. The
router in interior.js walks room → door → corridor → lift → … → room.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../careers/complexes.js` | `COMPLEXES` | [js/careers/complexes.js](../careers/complexes.js.md) |
| 2 | `../careers/complexes.js` | `RANK_LETTERS` | [js/careers/complexes.js](../careers/complexes.js.md) |

## Imported by

- [js/crew/roster.js](../crew/roster.js.md) — `hullPlan`, `stationRoomFor`
- [js/interior/interior.js](interior.js.md) — `hullPlan`, `stationRoomFor`, `quartersFor`
- [js/npc/crewfx.js](../npc/crewfx.js.md) — `hullPlan`, `stationRoomFor`
- test/crew-life.test.mjs _(outside js/)_ — `stationRoomFor`
- test/experimental.test.mjs _(outside js/)_ — `hullPlan`, `stationRoomFor`, `quartersFor`

## Exports

- [`INTERIOR_SCALE`](#s-INTERIOR_SCALE) · const — **no importer in scanned roots**
- [`COMPLEX_ROOMS`](#s-COMPLEX_ROOMS) · const — **no importer in scanned roots**
- [`hullPlan`](#s-hullPlan) · function — used by [js/crew/roster.js](../crew/roster.js.md), [js/interior/interior.js](interior.js.md), [js/npc/crewfx.js](../npc/crewfx.js.md), test/experimental.test.mjs
- [`stationRoomFor`](#s-stationRoomFor) · function — used by [js/crew/roster.js](../crew/roster.js.md), [js/interior/interior.js](interior.js.md), [js/npc/crewfx.js](../npc/crewfx.js.md), test/crew-life.test.mjs, test/experimental.test.mjs
- [`quartersFor`](#s-quartersFor) · function — used by [js/interior/interior.js](interior.js.md), test/experimental.test.mjs
- `COMPLEXES` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-INTERIOR_SCALE"></a>`INTERIOR_SCALE`

const · **exported** · L4–4

<!-- note:INTERIOR_SCALE -->
<!-- /note -->

### <a id="s-mulberry"></a>`mulberry(seedStr)`

function · L6–16

- called by: [`hullPlan`](#s-hullPlan)

<!-- note:mulberry -->
<!-- /note -->

### <a id="s-COMPLEX_ROOMS"></a>`COMPLEX_ROOMS`

const · **exported** · L18–36

<!-- note:COMPLEX_ROOMS -->
Industrial spaces per complex: [name, w, h, kind]. Tier decides how many ship.

- L35 · `general:        [["Workshop", 2, 2, "works"], ["Stores", 2, 1, "cargo"], ["Passenger Cabin` — open-market hulls: a workshop, nothing more
<!-- /note -->

### <a id="s-DECK_NAMES"></a>`DECK_NAMES`

const · L38–38

<!-- note:DECK_NAMES -->
<!-- /note -->

### <a id="s-deckFor"></a>`deckFor(kind, decks)`

function · L40–45

- called by: [`hullPlan`](#s-hullPlan)

<!-- note:deckFor -->
Which deck a room kind lives on when the hull has that many decks.
<!-- /note -->

### <a id="s-hullPlan"></a>`hullPlan(def, seed=)`

function · **exported** · L47–127

- calls: [`deckFor`](#s-deckFor) · [`hullPlan>add`](#s-hullPlan-add) ×11 · [`hullPlan>byKind`](#s-hullPlan-byKind) ×5 · [`hullPlan>sz`](#s-hullPlan-sz) ×10 · [`mulberry`](#s-mulberry)
- via [js/careers/complexes.js](../careers/complexes.js.md): `RANK_LETTERS.indexOf`
- called by: [`currentPlan`](../crew/roster.js.md#s-currentPlan) _js/crew/roster.js_ · [`ensurePlan`](interior.js.md#s-ensurePlan) _js/interior/interior.js_ · [`crewEffects`](../npc/crewfx.js.md#s-crewEffects) _js/npc/crewfx.js_

<!-- note:hullPlan -->
Grow the deck plan for a hull def.
@param def   shipdb def ({ id, tier, complex, dims, stats, grammar })
@param seed  string — the pilot's callsign, so your hull is yours

- L55 · `const spec = [];` — rooms every hull carries
- L59 · `const qn = Math.min(6, Math.max(1, Math.ceil(crewCap / (big ? 8 : 2))));` — berthing blocks: a G-tier flagship sleeps its hundred in six blocks, not thirty cabins
- L69 · `const ind = COMPLEX_ROOMS[def.complex] ?? [];` — the industry the hull was built for
- L76 · `const deckRooms = Array.from({ length: decks }, () => []);` — lay each deck out on its own spine
- L82 · `const fore = list.filter((r) => r.fore);` — fore rooms first, aft rooms last, everything else shuffled deterministically
- L96 · `sensors: r.w * r.h >= 4 ? 2 : 1,` — interior sensor nodes: one per room, two in big rooms
- L119 · `bridge: byKind("bridge")[0],` — handy lookups
- L125 · `robots: 1 + Math.floor(tierIdx / 2),` — maintenance robotics the hull carries: scale with tier
<!-- /note -->

#### <a id="s-hullPlan-sz"></a>`hullPlan>sz(w, h)`

function · L53–53

- called by: [`hullPlan`](#s-hullPlan) ×10

<!-- note:hullPlan>sz -->
<!-- /note -->

#### <a id="s-hullPlan-add"></a>`hullPlan>add(name, w, h, kind, extra=)`

function · L56–56

- called by: [`hullPlan`](#s-hullPlan) ×11

<!-- note:hullPlan>add -->
<!-- /note -->

#### <a id="s-hullPlan-byKind"></a>`hullPlan>byKind(k)`

function · L107–107

- called by: [`hullPlan`](#s-hullPlan) ×5

<!-- note:hullPlan>byKind -->
<!-- /note -->

### <a id="s-stationRoomFor"></a>`stationRoomFor(plan, member)`

function · **exported** · L129–144

- calls: [`hash`](#s-hash) ×3
- called by: [`dutyOf`](../crew/roster.js.md#s-dutyOf) _js/crew/roster.js_ · [`roomFor`](interior.js.md#s-roomFor) _js/interior/interior.js_ · [`syncWalkers`](interior.js.md#s-syncWalkers) _js/interior/interior.js_ · [`crewEffects`](../npc/crewfx.js.md#s-crewEffects) _js/npc/crewfx.js_

<!-- note:stationRoomFor -->
Where a crew member works, from what they trained as.

- L130 · `if (member.duty) {` — a duty the captain assigned (crew/roster.js setDuty) beats the trade they trained in
<!-- /note -->

### <a id="s-quartersFor"></a>`quartersFor(plan, member)`

function · **exported** · L146–149

- calls: [`hash`](#s-hash)
- called by: [`roomFor`](interior.js.md#s-roomFor) _js/interior/interior.js_

<!-- note:quartersFor -->
<!-- /note -->

### <a id="s-hash"></a>`hash(s)`

function · L151–155

- called by: [`quartersFor`](#s-quartersFor) · [`stationRoomFor`](#s-stationRoomFor) ×3

<!-- note:hash -->
<!-- /note -->
