# js/economy/fabricate.js

[index](../../../README.md) · 239 lines · 32 symbols · 1 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — the fabrication line: rock in one end, parts out the other.

The three tiers have been in js/economy/materials.js since the beginning — ORES carry
`refine` (what a unit becomes at the smelter), MINERALS and COMPONENTS carry
`from` (what a unit is built out of) — and until now only the FIRST arrow was
ever executed. `smeltAll()` turns ore into minerals; nothing turned minerals
into steel, or steel into a plate, or copper and a bearing into a motor. The
whole top of the graph was data nobody could reach, while the ports sold the
very components it describes.

So: a job is "make N of X at this port", and it resolves the WHOLE tree.

  1x Electric motor  ← copper 4, steel 2, bearing 1
       bearing       ← stainless 1, bronze 1
       stainless     ← steel 2, chromium 1, nickel 1
       steel         ← iron 3, carbon 1
       …and every mineral that is still missing is smelted from its ore.

Which bottoms out at 46 units of ore for one motor. That is the point: the
graph is checked acyclic and every component reduces to ores you can cut, so
a hold of rock is a genuine input to the parts economy.

WHAT IT CONSUMES, AND IN WHAT ORDER. Always the nearest thing to the
finished part first. If you are holding steel, a plate takes the steel; it
does not smelt fresh iron and leave the steel sitting there. Only what is
still missing after the pool is exhausted recurses down a tier, so bringing
half-finished stock shortens the job instead of being ignored.

WHAT IT IS NOT. It does not invent value, and it does not hide the price.
Running this graph for the first time found eleven recipes that cost more in
raw ore than the product sold for — a Gyroscope was 1,726 cr of ore for an
1,120 cr part — because nothing had ever run the numbers. Those values were
raised in 0.3.11 and a test now holds the line at "nothing is worth less than
the rock it came out of". The margin is still reported on every job, because
1.1x and 6.5x are both above water and only one of them is worth the trip.

THIS MODULE IS A LEAF. It imports the materials table and nothing else. The
clock, the stock it draws on, the credits it charges and the locker it
delivers into are all injected by `wireFab`, which is what lets the whole
thing — solver and queue — run in node with no sim and no browser.

- L15 · `export const fabJobs = [];` — live jobs, every port
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./materials.js` | `ORES`, `ALL_GOODS`, `SECTORS`, `goodName`, `baseValue` | [js/economy/materials.js](materials.js.md) |

## Imported by

- [js/aria/pilot.js](../aria/pilot.js.md) — `orderFab`, `planJob`, `canFabAt`, `fabMenuAt`, `maxRunnable`, `fabQueueAt`, `FAB`
- [js/console/panels/work.js](../console/panels/work.js.md) — `fabReport`, `cancelFab`
- [js/sim/sim.js](../sim/sim.js.md) — `wireFab`, `stepFab`, `loadFab`, `resetFab`
- [js/station/fabyard.js](../station/fabyard.js.md) — `FAB`, `fabMenuAt`, `planJob`, `orderFab`, `cancelFab`, `fabQueueAt`, `canFabAt`, `maxRunnable`
- test/balance.test.mjs _(outside js/)_ — `fabMargin`, `recipeFor`

## Exports

- [`FAB_KEY`](#s-FAB_KEY) · function — **no importer in scanned roots**
- [`FAB`](#s-FAB) · const — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/station/fabyard.js](../station/fabyard.js.md)
- [`fabJobs`](#s-fabJobs) · const — **no importer in scanned roots**
- [`recipeFor`](#s-recipeFor) · function — used by test/balance.test.mjs
- [`billOfMaterials`](#s-billOfMaterials) · function — **no importer in scanned roots**
- [`fabMargin`](#s-fabMargin) · function — used by test/balance.test.mjs
- [`planJob`](#s-planJob) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/station/fabyard.js](../station/fabyard.js.md)
- [`maxRunnable`](#s-maxRunnable) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/station/fabyard.js](../station/fabyard.js.md)
- [`canFabAt`](#s-canFabAt) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/station/fabyard.js](../station/fabyard.js.md)
- [`fabMenuAt`](#s-fabMenuAt) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/station/fabyard.js](../station/fabyard.js.md)
- [`fabQueueAt`](#s-fabQueueAt) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/station/fabyard.js](../station/fabyard.js.md)
- [`fabJobById`](#s-fabJobById) · function — **no importer in scanned roots**
- [`orderFab`](#s-orderFab) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/station/fabyard.js](../station/fabyard.js.md)
- [`cancelFab`](#s-cancelFab) · function — used by [js/console/panels/work.js](../console/panels/work.js.md), [js/station/fabyard.js](../station/fabyard.js.md)
- [`stepFab`](#s-stepFab) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`fabReport`](#s-fabReport) · function — used by [js/console/panels/work.js](../console/panels/work.js.md)
- [`save`](#s-save) · function — **no importer in scanned roots**
- [`loadFab`](#s-loadFab) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`resetFab`](#s-resetFab) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`wireFab`](#s-wireFab) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- `default` · Identifier — **no importer in scanned roots**

## Effects

- **storage.get** — `‹FAB_KEY()›` (loadFab:218)
- **storage.set** — `‹FAB_KEY()›` (save:212)

## Symbols

### <a id="s-FAB_KEY"></a>`FAB_KEY()`

function · **exported** · L3–3

- called by: [`loadFab`](#s-loadFab) · [`save`](#s-save)

<!-- note:FAB_KEY -->
Run key — a pilot's own jobs. Filed in js/core/profile.js.
<!-- /note -->

### <a id="s-FAB"></a>`FAB`

const · **exported** · L5–13

<!-- note:FAB -->
- L6 · `fee: 0.09,` — share of the finished value the works keeps
- L7 · `secsPerOp: 3.5,` — sim seconds per production operation
- L8 · `minSecs: 20,` — no job is instant; you leave and come back
- L11 · `perPort: 3,` — jobs one port will run at once
- L12 · `loss: 0.02,` — scrap: a fraction of each operation's input is lost
<!-- /note -->

### <a id="s-fabJobs"></a>`fabJobs`

const · **exported** · L15–15

<!-- note:fabJobs -->
<!-- /note -->

### <a id="s-seq"></a>`seq`

const · L16–16

<!-- note:seq -->
<!-- /note -->

### <a id="s-BY_ID"></a>`BY_ID`

const · L18–18

- via [js/economy/materials.js](materials.js.md): `ALL_GOODS.map`

<!-- note:BY_ID -->
---- the graph ------------------------------------------------------------
<!-- /note -->

### <a id="s-ORE_FOR"></a>`ORE_FOR`

const · L19–19

<!-- note:ORE_FOR -->
mineral id → the ore that refines into it. First ore wins; the table has one
ore per mineral today, and if that ever changes the cheapest is the one to
prefer, not the first.
<!-- /note -->

### <a id="s-cur"></a>`cur`

const · L22–22

<!-- note:cur -->
<!-- /note -->

### <a id="s-recipeFor"></a>`recipeFor(id)`

function · **exported** · L26–33

- called by: [`billOfMaterials`](#s-billOfMaterials) · [`planJob>produce`](#s-planJob-produce)

<!-- note:recipeFor -->
How one unit of `id` is made.
  { kind: "make",   from: { input: qty, … } }   a recipe in the table
  { kind: "refine", from: { ore: qty }, ore }   smelted from its ore
  null                                          raw: it comes out of a rock
<!-- /note -->

### <a id="s-billOfMaterials"></a>`billOfMaterials(id, qty=, acc=, depth=)`

function · **exported** · L35–41

- calls: [`billOfMaterials`](#s-billOfMaterials) · [`recipeFor`](#s-recipeFor)
- called by: [`billOfMaterials`](#s-billOfMaterials) · [`fabMargin`](#s-fabMargin)

<!-- note:billOfMaterials -->
Everything a good is ultimately made of, in raw ore.

- L36 · `if (depth > 32) return acc;` — the graph is acyclic; this is a backstop
<!-- /note -->

### <a id="s-fabMargin"></a>`fabMargin(id)`

function · **exported** · L43–48

- calls: [`billOfMaterials`](#s-billOfMaterials) · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_ ×2
- called by: [`fabMenuAt`](#s-fabMenuAt) · [`planJob`](#s-planJob)

<!-- note:fabMargin -->
What a good is worth as raw ore, against what it sells for. > 1 is worth making.
<!-- /note -->

### <a id="s-planJob"></a>`planJob(id, qty=, stock=)`

function · **exported** · L50–105

- calls: [`fabMargin`](#s-fabMargin) · [`planJob>produce`](#s-planJob-produce) · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_
- called by: [`fabStop`](../aria/pilot.js.md#s-fabStop) _js/aria/pilot.js_ ×2 · [`registerFabOp`](../aria/pilot.js.md#s-registerFabOp) _js/aria/pilot.js_ · [`maxRunnable`](#s-maxRunnable) ×3 · [`orderFab`](#s-orderFab) · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_

<!-- note:planJob -->
---- planning a job --------------------------------------------------------

Work out a job against the stock actually on hand.

`stock` is a plain { goodId: qty } of everything reachable — the hold and the
port's locker, merged by the caller. Nothing here mutates it.

→ { ok, steps, use, short, ops, secs, fee, outValue, margin, mass }
    steps  productions in dependency order (inputs before the things they feed)
    use    what comes off the shelf, by id
    short  what is missing even after cascading all the way down to ore

- L78 · `const need = {};` — What to actually BRING. `billOfMaterials` is the arithmetic; this is the
  arithmetic plus scrap, minus whatever the pool already covered — i.e. the
  shopping list. Without it a pilot who brings exactly the bill is told the
  job is short by 2% and has no idea why.
- L81 · `const merged = new Map();` — One line per good rather than one per branch: steel gets produced twice in
  a motor (once for the hull, once inside the stainless) and a list that says
  so twice reads like a bug.
<!-- /note -->

#### <a id="s-planJob-produce"></a>`planJob>produce(want, n, depth)`

function · L62–75

- calls: [`planJob>produce`](#s-planJob-produce) · [`recipeFor`](#s-recipeFor)
- called by: [`planJob`](#s-planJob) · [`planJob>produce`](#s-planJob-produce)

<!-- note:planJob>produce -->
Post-order: a step is pushed only once everything it needs has been
planned, so running `steps` front to back never reaches for something that
does not exist yet.

- L71 · `const batches = rem * (1 + FAB.loss);` — scrap: ask the line for a little more than the arithmetic needs
<!-- /note -->

### <a id="s-maxRunnable"></a>`maxRunnable(id, stock=, cap=)`

function · **exported** · L107–116

- calls: [`planJob`](#s-planJob) ×3
- called by: [`fabStop`](../aria/pilot.js.md#s-fabStop) _js/aria/pilot.js_ · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_

<!-- note:maxRunnable -->
The most of `id` this stock will actually run, for the MAX rung on the
quantity control. Binary search rather than arithmetic, because the cascade
reuses part-finished stock: ten plates do not cost ten times one plate when
you are already holding steel, so dividing a bill by a stock level gets the
wrong answer in exactly the case the pilot cares about.

`planJob` is cheap (a few dozen nodes), so ~9 probes costs nothing.
<!-- /note -->

### <a id="s-canFabAt"></a>`canFabAt(st, id=)`

function · **exported** · L118–126

- called by: [`fabStop`](../aria/pilot.js.md#s-fabStop) _js/aria/pilot.js_ · [`registerFabOp`](../aria/pilot.js.md#s-registerFabOp) _js/aria/pilot.js_ · [`fabMenuAt`](#s-fabMenuAt) · [`orderFab`](#s-orderFab) · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_ ×2

<!-- note:canFabAt -->
---- which ports will run it -----------------------------------------------

A port fabricates what it is known for, and an industrial yard fabricates
anything. That is `services` and `sells` from the SECTORS table doing the
gating rather than a second list invented here and left to drift.
<!-- /note -->

### <a id="s-fabMenuAt"></a>`fabMenuAt(st)`

function · **exported** · L128–138

- calls: [`canFabAt`](#s-canFabAt) · [`fabMargin`](#s-fabMargin)
- called by: [`fabStop`](../aria/pilot.js.md#s-fabStop) _js/aria/pilot.js_ · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_

<!-- note:fabMenuAt -->
What this port will build, best margin first.

- L132 · `if (g.tier === "ore") continue;` — ore is cut, not built
<!-- /note -->

### <a id="s-state"></a>`state`

const · L140–149

<!-- note:state -->
---- the queue --------------------------------------------------------------

- L142 · `stockAt: () => ({}),` — (stId, by) → { id: qty } the job may draw on
- L143 · `consume: () => {},` — (stId, by, { id: qty })
- L144 · `deliver: () => {},` — (stId, by, id, qty)
- L145 · `pay: () => "no payer",` — (by, credits, why) → null | why not
- L146 · `log: () => {},` — (text, job)
<!-- /note -->

#### <a id="s-state-now"></a>`state.now()`

prop · L141–141

<!-- note:state.now -->
<!-- /note -->

#### <a id="s-state-stockAt"></a>`state.stockAt()`

prop · L142–142

<!-- note:state.stockAt -->
<!-- /note -->

#### <a id="s-state-consume"></a>`state.consume()`

prop · L143–143

<!-- note:state.consume -->
<!-- /note -->

#### <a id="s-state-deliver"></a>`state.deliver()`

prop · L144–144

<!-- note:state.deliver -->
<!-- /note -->

#### <a id="s-state-pay"></a>`state.pay()`

prop · L145–145

<!-- note:state.pay -->
<!-- /note -->

#### <a id="s-state-log"></a>`state.log()`

prop · L146–146

<!-- note:state.log -->
<!-- /note -->

### <a id="s-fabQueueAt"></a>`fabQueueAt(stId)`

function · **exported** · L151–151

- called by: [`fabStop`](../aria/pilot.js.md#s-fabStop) _js/aria/pilot.js_ · [`orderFab`](#s-orderFab) · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_

<!-- note:fabQueueAt -->
<!-- /note -->

### <a id="s-fabJobById"></a>`fabJobById(jid)`

function · **exported** · L152–152

<!-- note:fabJobById -->
<!-- /note -->

### <a id="s-orderFab"></a>`orderFab({…}=)`

function · **exported** · L154–175

- calls: [`canFabAt`](#s-canFabAt) · [`fabQueueAt`](#s-fabQueueAt) · [`planJob`](#s-planJob) · [`save`](#s-save) · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×4
- called by: [`registerFabOp`](../aria/pilot.js.md#s-registerFabOp) _js/aria/pilot.js_ · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_

<!-- note:orderFab -->
Put a job on a port's line.
`by` is "player" (your credits, you must be docked) or "company" (the
treasury, and it runs while you are somewhere else).
→ { ok: true, job } | { ok: false, why }
<!-- /note -->

### <a id="s-cancelFab"></a>`cancelFab(jid)`

function · **exported** · L177–185

- calls: [`save`](#s-save)
- called by: [`editor>render`](../console/panels/work.js.md#s-editor-render) _js/console/panels/work.js_ · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_

<!-- note:cancelFab -->
Pull a job and hand back nothing — the materials are already in it.

- L181 · `for (const [k, v] of Object.entries(job.used ?? {})) state.deliver(job.stId, job.by, k, v)` — what went in comes back: a cancelled job has not been run
<!-- /note -->

### <a id="s-stepFab"></a>`stepFab(now=)`

function · **exported** · L187–199

- calls: [`save`](#s-save)
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepFab -->
Called from the sim tick. Finishes whatever is due. → how many landed
<!-- /note -->

### <a id="s-fabReport"></a>`fabReport()`

function · **exported** · L201–208

- called by: [`editor>render`](../console/panels/work.js.md#s-editor-render) _js/console/panels/work.js_

<!-- note:fabReport -->
<!-- /note -->

### <a id="s-save"></a>`save()`

function · **exported** · L210–214

- calls: [`FAB_KEY`](#s-FAB_KEY)
- called by: [`cancelFab`](#s-cancelFab) · [`orderFab`](#s-orderFab) · [`stepFab`](#s-stepFab)
- effects: storage.set `‹FAB_KEY()›`

<!-- note:save -->
---- persistence --------------------------------------------------------------

- L213 · `} catch {` — storage is a convenience
<!-- /note -->

### <a id="s-loadFab"></a>`loadFab()`

function · **exported** · L216–227

- calls: [`FAB_KEY`](#s-FAB_KEY)
- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_
- effects: storage.get `‹FAB_KEY()›`

<!-- note:loadFab -->
<!-- /note -->

### <a id="s-resetFab"></a>`resetFab()`

function · **exported** · L229–232

- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:resetFab -->
<!-- /note -->

### <a id="s-wireFab"></a>`wireFab(hooks=)`

function · **exported** · L234–237

- called by: [`@file`](../sim/sim.js.md#) _js/sim/sim.js_

<!-- note:wireFab -->
sim.js injects the world; nothing above this line knows what a station is.
<!-- /note -->
