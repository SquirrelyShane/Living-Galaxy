# js/interior/boarding.js

[index](../../../README.md) · 138 lines · 13 symbols · 5 imports · 9 importers

## About

<!-- note:@file -->
LIVING GALAXY experimental — boarding actions.

Refuse a pirate toll inside pod range and the watch sends a breach team:
a pod crosses (you can outrun it), clamps on at the airlock, and intruders
are on your deck — red on the plan, counted by the interior sensors, felt
in the sim whether the deck plan is open or not.

The fight is the crew's, resolved a round every five seconds:
  defense = Σ over hands  (security skill + grit) × morale, doubled for
            security-complex crew, + the maintenance robotics, + the
            sensor net (a watched corridor is a killing floor), + a
            docked port's own security if you make the clamps.
Intruders sabotage while they live — the hull bleeds a little every round
they hold a deck — and hands take morale hits (a nurse in a gunfight is
not having a good cycle). Beaten intruders are captured if the hull has a
BRIG, otherwise spaced; brigged prisoners turn into a Marshal's bounty the
next time you dock anywhere that is not hostile.

`startBoarding(n, from)` is also the console/test hook — anything (a
derelict, a bad passenger, a story) can put intruders on the deck.

- L24 · `export const POD_RANGE = 7000;` — refuse inside this and the pod launches
- L25 · `const POD_SPEED = 220;` — u/s — slow enough to run from
- L27 · `const SABOTAGE_HULL = 1.2;` — hull per living intruder per round
- L28 · `const BOUNTY = 400;` — cr per prisoner, at the Marshal's window
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../flight/ship.js` | `applyDamage` | [js/flight/ship.js](../flight/ship.js.md) |
| 3 | `../crew/ledger.js` | `crew` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 4 | `../npc/cradle.js` | `cradle`, `generateNPC` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 5 | `../corp/gdb.js` | `catalogue` | [js/corp/gdb.js](../corp/gdb.js.md) |

## Imported by

- [js/comms/comms.js](../comms/comms.js.md) — `launchPod`
- [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md) — `boarding`
- [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md) — `boarding`
- [js/crew/captive.js](../crew/captive.js.md) — `boarding`
- [js/crew/hull.js](../crew/hull.js.md) — `boarding`
- [js/interior/interior.js](interior.js.md) — `boarding`
- [js/npc/bounty.js](../npc/bounty.js.md) — `boarding`
- [js/sim/sim.js](../sim/sim.js.md) — `boarding`, `resetBoarding`, `tickBoarding`
- test/bounty.test.mjs _(outside js/)_ — `boarding`

## Exports

- [`boarding`](#s-boarding) · const — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), [js/crew/captive.js](../crew/captive.js.md), [js/crew/hull.js](../crew/hull.js.md), [js/interior/interior.js](interior.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/sim/sim.js](../sim/sim.js.md), test/bounty.test.mjs
- [`POD_RANGE`](#s-POD_RANGE) · const — **no importer in scanned roots**
- [`launchPod`](#s-launchPod) · function — used by [js/comms/comms.js](../comms/comms.js.md)
- [`startBoarding`](#s-startBoarding) · function — **no importer in scanned roots**
- [`defensePower`](#s-defensePower) · function — **no importer in scanned roots**
- [`tickBoarding`](#s-tickBoarding) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`resetBoarding`](#s-resetBoarding) · function — used by [js/sim/sim.js](../sim/sim.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-boarding"></a>`boarding`

const · **exported** · L7–14

<!-- note:boarding -->
- L8 · `pods: [],` — inbound: { eta, n, from }
- L9 · `intruders: [],` — aboard: { id, name, hp, skill }
- L10 · `brig: [],` — captured, awaiting a Marshal
<!-- /note -->

### <a id="s-note"></a>`note(text, kind=)`

function · L16–22

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`launchPod`](#s-launchPod) · [`startBoarding`](#s-startBoarding) · [`tickBoarding`](#s-tickBoarding) ×5

<!-- note:note -->
<!-- /note -->

### <a id="s-POD_RANGE"></a>`POD_RANGE`

const · **exported** · L24–24

<!-- note:POD_RANGE -->
<!-- /note -->

### <a id="s-POD_SPEED"></a>`POD_SPEED`

const · L25–25

<!-- note:POD_SPEED -->
<!-- /note -->

### <a id="s-ROUND_S"></a>`ROUND_S`

const · L26–26

<!-- note:ROUND_S -->
<!-- /note -->

### <a id="s-SABOTAGE_HULL"></a>`SABOTAGE_HULL`

const · L27–27

<!-- note:SABOTAGE_HULL -->
<!-- /note -->

### <a id="s-BOUNTY"></a>`BOUNTY`

const · L28–28

<!-- note:BOUNTY -->
<!-- /note -->

### <a id="s-launchPod"></a>`launchPod(st, n=)`

function · **exported** · L30–37

- calls: [`note`](#s-note)
- called by: [`stationCtx.board`](../comms/comms.js.md#s-stationCtx-board) _js/comms/comms.js_

<!-- note:launchPod -->
A pirate port answers a refusal with a breach team.
<!-- /note -->

### <a id="s-startBoarding"></a>`startBoarding(n, from=)`

function · **exported** · L39–47

- calls: [`catalogue`](../corp/gdb.js.md#s-catalogue) _js/corp/gdb.js_ · [`note`](#s-note) · [`syncSensors`](#s-syncSensors) · [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_
- via [js/sim/sim.js](../sim/sim.js.md): `sim.time.toFixed`
- called by: [`tickBoarding`](#s-tickBoarding)

<!-- note:startBoarding -->
Put intruders on the deck directly (pod arrival, console, future stories).

- L42 · `catalogue(rec, { kind: "boarder", sky: sim.skySeed ?? null, group: [...crew.aboard, ...boa` — 0.3.54
<!-- /note -->

### <a id="s-defensePower"></a>`defensePower()`

function · **exported** · L49–63

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`tickBoarding`](#s-tickBoarding)

<!-- note:defensePower -->
The deck's defense per round. Exported so the test can price a crew.

- L60 · `p += (sim.interior?.sensors ?? 0) * 0.6;` — a watched corridor
- L61 · `if (sim.ship.dockedAt) p += 40;` — port security storms aboard
<!-- /note -->

### <a id="s-syncSensors"></a>`syncSensors()`

function · L65–67

- called by: [`resetBoarding`](#s-resetBoarding) · [`startBoarding`](#s-startBoarding) · [`tickBoarding`](#s-tickBoarding)

<!-- note:syncSensors -->
<!-- /note -->

### <a id="s-tickBoarding"></a>`tickBoarding(dt)`

function · **exported** · L69–129

- calls: [`applyDamage`](../flight/ship.js.md#s-applyDamage) _js/flight/ship.js_ · [`defensePower`](#s-defensePower) · [`note`](#s-note) ×5 · [`startBoarding`](#s-startBoarding) · [`syncSensors`](#s-syncSensors)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`, `cradle.put`
- called by: [`stepCareer`](../sim/sim.js.md#s-stepCareer) _js/sim/sim.js_

<!-- note:tickBoarding -->
Called from the sim tick (sim seconds).

- L70 · `for (const pod of [...boarding.pods]) {` — pods in the black
- L82 · `if (sim.ship.dockedAt && boarding.brig.length) {` — Prisoners used to be swept off the ship for a flat fee the moment you
  docked anywhere. They are people now (crew/captive.js): who you hand over,
  who you sell back, who you let go and who you end up crewing with are all
  decisions, and a hatch that empties itself takes every one of them away.
  Boarders you have not spoken to still go quietly — anybody you have
  actually dealt with, or who came off a ticket, stays for you to decide.
- L101 · `applyDamage(sim.ship, SABOTAGE_HULL * boarding.intruders.length, null, sim.time);` — sabotage while they hold the deck
- L105 · `for (const i of boarding.intruders) i.hp -= (def / boarding.intruders.length) * (0.6 + Mat` — the crew works the intruders down; the intruders work the crew's nerve
- L115 · `i.rec.status = "captive";` — off the hiring pools; the record keeps the story
- L126 · `for (const m of crew.aboard) m.morale = Math.min(100, m.morale + 6);` — won the day
<!-- /note -->

### <a id="s-resetBoarding"></a>`resetBoarding()`

function · **exported** · L131–138

- calls: [`syncSensors`](#s-syncSensors)
- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:resetBoarding -->
<!-- /note -->
