# js/economy/sites.js

[index](../../../README.md) · 194 lines · 26 symbols · 2 imports · 9 importers

## About

<!-- note:@file -->
LIVING GALAXY — job sites: where a contract actually sends you.

0.3.20. A mining job used to say "cut 200 chromite, any band" and leave you
to go and find some. The belt is hundreds of thousands of units wide and the
ore a rock carries is decided by the band and the rock's own hash, so "any
band" meant flying around reading assays until something matched.

A job with rock in it now names a PLACE. The desk picks a stretch of belt
when it posts the job — a drift with a name, a bearing and a distance from
the port — and accepting it opens a SITE there: a seeded scatter of rocks
carrying the ore the job wants, laid into the field the belt already has.
They are extra rock, not a replacement: everything the cells would have
grown there is still there, so a site is a good seam surrounded by an
ordinary belt and a run to one pays twice — the contract's ore, and whatever
else you cut while you are out there.

The rocks are real rocks: same shape as js/world/field.js's, same key-based
depletion, same generator, same assay. field.js asks this module for the
site rocks in each cell it builds; nothing else has to know.

A site lives as long as the job does — `openSite` on accept, `closeSite` on
deliver, abandon or expiry.

- L4 · `export const sites = new Map();` — id → site
- L5 · `export const siteHooks = { onChange: null };` — field.js hangs its cache-clear here
- L117 · `const laid = new Map();` — site id → [{ key, x, y, z, r, seed, cls, ore, oreName, rich, ice }]
- L194 · `void classFor; void classOre;` — kept in the import list: the site's class is picked the same way the field picks one
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../bodygen/classes.js` | `classFor`, `classOre`, `CLASSES`, `CLASS_IDS` | [js/bodygen/classes.js](../bodygen/classes.js.md) |
| 2 | `./materials.js` | `ORES`, `goodName` | [js/economy/materials.js](materials.js.md) |

## Imported by

- [js/aria/senses.js](../aria/senses.js.md) — `sites`, `sitesNear`
- [js/economy/contracts.js](contracts.js.md) — `pickSpot`, `spotLine`, `openSite`, `closeSite`, `siteById`
- [js/mission/run.js](../mission/run.js.md) — `siteById`
- [js/ui/boardview.js](../ui/boardview.js.md) — `siteById`
- [js/ui/holdview.js](../ui/holdview.js.md) — `classForOre`
- [js/world/field.js](../world/field.js.md) — `siteRocksInCell`, `siteHooks`, `classForOre`, `siteRocks`, `siteRockBase`
- test/jobloop.test.mjs _(outside js/)_ — `clearSites`
- test/marks.test.mjs _(outside js/)_ — `siteById`, `siteRocks`, `clearSites`
- test/sites.test.mjs _(outside js/)_ — `sites`, `openSite`, `closeSite`, `clearSites`, `siteById`, `sitesNear`, `pickSpot`, `spotLine`, `siteReport`, `classForOre`

## Exports

- [`sites`](#s-sites) · const — used by [js/aria/senses.js](../aria/senses.js.md), test/sites.test.mjs
- [`siteHooks`](#s-siteHooks) · const — used by [js/world/field.js](../world/field.js.md)
- [`siteVersion`](#s-siteVersion) · function — **no importer in scanned roots**
- [`classForOre`](#s-classForOre) · function — used by [js/ui/holdview.js](../ui/holdview.js.md), [js/world/field.js](../world/field.js.md), test/sites.test.mjs
- [`pickSpot`](#s-pickSpot) · function — used by [js/economy/contracts.js](contracts.js.md), test/sites.test.mjs
- [`spotLine`](#s-spotLine) · function — used by [js/economy/contracts.js](contracts.js.md), test/sites.test.mjs
- [`openSite`](#s-openSite) · function — used by [js/economy/contracts.js](contracts.js.md), test/sites.test.mjs
- [`closeSite`](#s-closeSite) · function — used by [js/economy/contracts.js](contracts.js.md), test/sites.test.mjs
- [`clearSites`](#s-clearSites) · function — used by test/jobloop.test.mjs, test/marks.test.mjs, test/sites.test.mjs
- [`siteById`](#s-siteById) · function — used by [js/economy/contracts.js](contracts.js.md), [js/mission/run.js](../mission/run.js.md), [js/ui/boardview.js](../ui/boardview.js.md), test/marks.test.mjs, test/sites.test.mjs
- [`sitesNear`](#s-sitesNear) · function — used by [js/aria/senses.js](../aria/senses.js.md), test/sites.test.mjs
- [`inSite`](#s-inSite) · function — **no importer in scanned roots**
- [`siteRocksInCell`](#s-siteRocksInCell) · function — used by [js/world/field.js](../world/field.js.md)
- [`siteRocks`](#s-siteRocks) · function — used by [js/world/field.js](../world/field.js.md), test/marks.test.mjs
- [`siteRockBase`](#s-siteRockBase) · function — used by [js/world/field.js](../world/field.js.md)
- [`siteReport`](#s-siteReport) · function — used by test/sites.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-sites"></a>`sites`

const · **exported** · L4–4

<!-- note:sites -->
<!-- /note -->

### <a id="s-siteHooks"></a>`siteHooks`

const · **exported** · L5–5

<!-- note:siteHooks -->
<!-- /note -->

### <a id="s-version"></a>`version`

const · L6–6

<!-- note:version -->
<!-- /note -->

### <a id="s-siteVersion"></a>`siteVersion()`

function · **exported** · L8–8

<!-- note:siteVersion -->
<!-- /note -->

### <a id="s-ORE_BY_ID"></a>`ORE_BY_ID`

const · L10–10

- via [js/economy/materials.js](materials.js.md): `ORES.map`

<!-- note:ORE_BY_ID -->
<!-- /note -->

### <a id="s-DRIFT_WORDS"></a>`DRIFT_WORDS`

const · L12–15

<!-- note:DRIFT_WORDS -->
A drift has a name so it can be spoken about: "the Kestrel Drift, 41 km out
from Smelt Station, bearing 214".
<!-- /note -->

### <a id="s-hash32"></a>`hash32(s)`

function · L17–22

- called by: [`frac`](#s-frac)

<!-- note:hash32 -->
<!-- /note -->

### <a id="s-frac"></a>`frac(s)`

function · L23–23

- calls: [`hash32`](#s-hash32)
- called by: [`layOut>f`](#s-layOut-f) · [`pickSpot>f`](#s-pickSpot-f)

<!-- note:frac -->
<!-- /note -->

### <a id="s-bearing"></a>`bearing(from, to)`

function · L24–24

- called by: [`pickSpot`](#s-pickSpot) · [`spotLine`](#s-spotLine)

<!-- note:bearing -->
<!-- /note -->

### <a id="s-classForOre"></a>`classForOre(ore)`

function · **exported** · L26–33

- called by: [`layOut`](#s-layOut) · [`holdSlots`](../ui/holdview.js.md#s-holdSlots) _js/ui/holdview.js_ · [`cellRocks`](../world/field.js.md#s-cellRocks) _js/world/field.js_

<!-- note:classForOre -->
The class of rock that carries this ore best — so a site looks like what it holds.
<!-- /note -->

### <a id="s-pickSpot"></a>`pickSpot(seed, system, st=, opts=)`

function · **exported** · L35–56

- calls: [`bearing`](#s-bearing) · [`pickSpot>f`](#s-pickSpot-f) ×7
- called by: [`jobSpot`](contracts.js.md#s-jobSpot) _js/economy/contracts.js_

<!-- note:pickSpot -->
Pick a stretch of belt for a job: an angle and a radius inside a real belt,
within reach of the port that is posting it. Deterministic in `seed`.
→ { x, y, z, r, name, bearing, dist, belt }

- L41 · `const base = st ? Math.atan2(st.z, st.x) : f("a") * Math.PI * 2;` — near the port's own angle, so a job at a port is not always half a system away
- L42 · `const spread = opts.spread ?? 0.9;` — radians either side
<!-- /note -->

#### <a id="s-pickSpot-f"></a>`pickSpot>f(k)`

function · L40–40

- calls: [`frac`](#s-frac)
- called by: [`pickSpot`](#s-pickSpot) ×7

<!-- note:pickSpot>f -->
<!-- /note -->

### <a id="s-spotLine"></a>`spotLine(spot, st=)`

function · **exported** · L58–63

- calls: [`bearing`](#s-bearing)
- called by: [`KINDS.pod`](contracts.js.md#s-KINDS-pod) _js/economy/contracts.js_ · [`KINDS.wreck`](contracts.js.md#s-KINDS-wreck) _js/economy/contracts.js_ · [`chainOffer`](contracts.js.md#s-chainOffer) _js/economy/contracts.js_ · [`withSpot`](contracts.js.md#s-withSpot) _js/economy/contracts.js_

<!-- note:spotLine -->
"the Kestrel Drift — 412 km out from Smelt Station, bearing 214"
<!-- /note -->

### <a id="s-openSite"></a>`openSite(spec)`

function · **exported** · L65–85

- calls: [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_
- called by: [`acceptContract`](contracts.js.md#s-acceptContract) _js/economy/contracts.js_

<!-- note:openSite -->
Open a site. `spec` = { id, ore, count, x, y, z, r?, name?, rich?, size? }.
`count` is how many rocks of that ore to lay in; size scales their radius.
<!-- /note -->

### <a id="s-closeSite"></a>`closeSite(id)`

function · **exported** · L87–92

- called by: [`resetContracts`](contracts.js.md#s-resetContracts) _js/economy/contracts.js_ · [`settle`](contracts.js.md#s-settle) _js/economy/contracts.js_

<!-- note:closeSite -->
<!-- /note -->

### <a id="s-clearSites"></a>`clearSites()`

function · **exported** · L94–99

<!-- note:clearSites -->
<!-- /note -->

### <a id="s-siteById"></a>`siteById(id)`

function · **exported** · L101–101

- called by: [`anchorFor`](contracts.js.md#s-anchorFor) _js/economy/contracts.js_ · [`jobStatus`](contracts.js.md#s-jobStatus) _js/economy/contracts.js_ · [`resolve`](../mission/run.js.md#s-resolve) _js/mission/run.js_ · [`renderHeld`](../ui/boardview.js.md#s-renderHeld) _js/ui/boardview.js_

<!-- note:siteById -->
<!-- /note -->

### <a id="s-sitesNear"></a>`sitesNear(pos, r=)`

function · **exported** · L103–110

- called by: [`senseSpace`](../aria/senses.js.md#s-senseSpace) _js/aria/senses.js_

<!-- note:sitesNear -->
Sites within `r` of a point, nearest first.
<!-- /note -->

### <a id="s-inSite"></a>`inSite(pos, margin=)`

function · **exported** · L112–115

<!-- note:inSite -->
Is a point inside a site's scatter (plus a margin)?
<!-- /note -->

### <a id="s-laid"></a>`laid`

const · L117–117

<!-- note:laid -->
---- the rocks ------------------------------------------------------------------
Laid out once per site from its seed: a sphere of positions inside `r`. A
cell asks for the ones that fall inside it, so they arrive through exactly
the same path as the field's own rocks (field.js cellRocks).
<!-- /note -->

### <a id="s-layOut"></a>`layOut(site)`

function · L119–148

- calls: [`classForOre`](#s-classForOre) · [`layOut>f`](#s-layOut-f) ×6
- called by: [`siteReport`](#s-siteReport) · [`siteRocks`](#s-siteRocks) · [`siteRocksInCell`](#s-siteRocksInCell)

<!-- note:layOut -->
- L126 · `const u = Math.pow(f("u"), 0.62);` — a sphere, denser toward the middle: the seam has a heart
- L131 · `const y = site.y + rr * Math.cos(ph) * 0.35;` — the belt is a disc, so is a seam
<!-- /note -->

#### <a id="s-layOut-f"></a>`layOut>f(k)`

function · L125–125

- calls: [`frac`](#s-frac)
- called by: [`layOut`](#s-layOut) ×6

<!-- note:layOut>f -->
<!-- /note -->

### <a id="s-siteRocksInCell"></a>`siteRocksInCell(cx, cy, cz, cell, out, depleted)`

function · **exported** · L150–172

- calls: [`layOut`](#s-layOut)
- called by: [`cellRocks`](../world/field.js.md#s-cellRocks) _js/world/field.js_

<!-- note:siteRocksInCell -->
Append this cell's site rocks to `out`, in field.js's own rock shape.
`worn` is read through the caller's depletion map so a site rock mines out
like any other. Positions are the base ones; field.js applies the wobble.

- L161 · `out.push({` — 0.3.28: base position and the wobble's phases; field.js applies the
  wobble at read time, the same way it does for its own rocks
<!-- /note -->

### <a id="s-siteRocks"></a>`siteRocks(id)`

function · **exported** · L174–177

- calls: [`layOut`](#s-layOut)
- called by: [`siteRockBase`](#s-siteRockBase) · [`siteMarkRock`](../world/field.js.md#s-siteMarkRock) _js/world/field.js_

<!-- note:siteRocks -->
0.3.67 — a site's rocks as laid (base positions, no wobble, no wear). [] if it is not open.
<!-- /note -->

### <a id="s-siteRockBase"></a>`siteRockBase(key)`

function · **exported** · L179–184

- calls: [`siteRocks`](#s-siteRocks)
- called by: [`rockByKey`](../world/field.js.md#s-rockByKey) _js/world/field.js_

<!-- note:siteRockBase -->
0.3.67 — the laid rock behind a `site:&lt;id>:&lt;i>` key, or null.
<!-- /note -->

### <a id="s-siteReport"></a>`siteReport(depleted)`

function · **exported** · L186–192

- calls: [`layOut`](#s-layOut)

<!-- note:siteReport -->
For the console: what is open, with how much of it is left.
<!-- /note -->
