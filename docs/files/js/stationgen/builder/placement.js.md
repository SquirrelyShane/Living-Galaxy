# js/stationgen/builder/placement.js

[index](../../../../README.md) · 96 lines · 7 symbols · 3 imports · 1 importers

## About

<!-- note:@file -->
Placement: fit the manifest onto the slots.

For every module the solver scores every free slot it is allowed to
mount on — how close the slot's zone is to the module's, whether the
slot's sun exposure matches what the module wants, whether the module
is next to something it likes (kitchens beside mess halls, traffic
control beside hangars, life support beside quarters) — then tries the
best slots in order until one's footprint clears the occupancy boxes.
A module that will not fit tries a smaller footprint twice, then is
recorded as unplaced (it stays on the manifest: the parts list is the
station's, not the picture's).

Hangars are planned per candidate slot (hangar.js hangarPlan): the form
a slot allows — cut into a spine, bored into an end, a blister, a bay —
sets the footprint and how far it sinks into the structure.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `./frames.js` | `slotBox`, `slotBoxes`, `frameMatrix`, `sunDot` | [js/stationgen/builder/frames.js](frames.js.md) |
| 3 | `./hangar.js` | `hangarPlan`, `hangarFootprint` | [js/stationgen/builder/hangar.js](hangar.js.md) |

## Imported by

- [js/stationgen/builder/StationBuilder.js](StationBuilder.js.md) — `place`

## Exports

- [`scoreSlot`](#s-scoreSlot) · function — **no importer in scanned roots**
- [`place`](#s-place) · function — used by [js/stationgen/builder/StationBuilder.js](StationBuilder.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-AFFINITY"></a>`AFFINITY`

const · L5–15

<!-- note:AFFINITY -->
<!-- /note -->

### <a id="s-AVOID"></a>`AVOID`

const · L16–21

<!-- note:AVOID -->
<!-- /note -->

### <a id="s-_box"></a>`_box`

const · L23–23

<!-- note:_box -->
<!-- /note -->

### <a id="s-scoreSlot"></a>`scoreSlot(mod, s, sun, placed, relax=, throatW=)`

function · **exported** · L25–47

- calls: [`sunDot`](frames.js.md#s-sunDot) _js/stationgen/builder/frames.js_
- called by: [`place`](#s-place)

<!-- note:scoreSlot -->
- L35 · `const likes = AFFINITY[mod.id] ?? [], avoid = AVOID[mod.id] ?? [];` — neighbours: things it likes within 90 m, things it avoids within 140 m
- L37 · `if (!p.pos) continue;` — structural (the drum) has no slot
- L42 · `if (s.hard && mod.tags.includes("weapon")) sc += 3;` — hard points want guns; the nave wants its great door; caps want a throat when the style likes one
- L45 · `if (mod.size[0] > s.width) sc -= (mod.size[0] - s.width) / 30;` — big things want big slots
<!-- /note -->

### <a id="s-_own"></a>`_own`

const · L49–49

<!-- note:_own -->
<!-- /note -->

### <a id="s-clear"></a>`clear(boxes, occ, s, pad=)`

function · L50–61

- called by: [`place`](#s-place) ×2

<!-- note:clear -->
a footprint may touch the structure it sits on (its slot's owner, or any structure box the slot lies on) but nothing else
<!-- /note -->

### <a id="s-place"></a>`place(B, mod, {…}=)`

function · **exported** · L63–96

- calls: [`frameMatrix`](frames.js.md#s-frameMatrix) _js/stationgen/builder/frames.js_ · [`slotBox`](frames.js.md#s-slotBox) _js/stationgen/builder/frames.js_ ×2 · [`slotBoxes`](frames.js.md#s-slotBoxes) _js/stationgen/builder/frames.js_ ×2 · [`hangarFootprint`](hangar.js.md#s-hangarFootprint) _js/stationgen/builder/hangar.js_ · [`hangarPlan`](hangar.js.md#s-hangarPlan) _js/stationgen/builder/hangar.js_ · [`clear`](#s-clear) ×2 · [`scoreSlot`](#s-scoreSlot)
- called by: [`StationBuilder.build`](StationBuilder.js.md#s-StationBuilder-build) _js/stationgen/builder/StationBuilder.js_ ×2

<!-- note:place -->
Place `mod` once. Returns the placement { module, slot, size, matrix,
pos, plan? } or null. `B` is the builder: slots, occ, placed, sun, rng, styleArch.

- L80 · `if (!plan || plan.form === "throat") continue;` — a hangar may face the other way if its approach is blocked
- L87 · `const box = plan ? slotBox(s, [size[0], size[1], plan.d], lift, 0) : slotBox(s, size, lift` — neighbours inside the footprint go too (the bay itself, not its approach)
<!-- /note -->
