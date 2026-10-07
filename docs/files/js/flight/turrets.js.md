# js/flight/turrets.js

[index](../../../README.md) · 510 lines · 52 symbols · 10 imports · 26 importers

## About

<!-- note:@file -->
LIVING GALAXY — turret hardpoints, contacts and ordnance.

Two hardpoint classes share one target list:
  combat   — modes off / castle / passive / neutral / enemies / allies / ffa
  industrial (mining laser) — modes off / closest / overdrive

CASTLE is the default: the guns stay cold until something puts energy into
your shields or hull, then they answer it and nothing else.

NPC rounds used to be theatre: `npcTracer` fired damage-0 shots and
`stepShots` skipped anything whose faction began "npc", because the seed
had already decided who was going down before the fight started. They are
real now. An NPC round carries damage and a `target` — the id it was aimed
at — and it lands on that hull and nothing else, which keeps a crowded
engagement from turning into a friendly-fire lottery without needing a
relation lookup per round per contact. The hull's own integrity is the
source of truth (npc/flight.js gives every hull hp, shields and a gun off
its registry entry); the contact mirrors it both ways, exactly as corp
drones already did.

- L4 · `export const MINE_YIELD = 0.38;` — 0.3.11: half the old gather rate; 0.3.58: three-quarters of that
- L17 · `const PIRATE_RANGE = 950;` — a lurking pirate opens up on anyone this close
- L18 · `export const CONTACT_R = 50000;` — hulls beyond this are on the board, not on the contact list
- L19 · `const PIRATE_RATE = 1.1;` — seconds between rounds
- L34 · `export const contacts = [];` — ships/drones/peers the turrets can see
- L35 · `export const shots = [];` — tracer pool
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ship.js` | `DRAW`, `addCargo`, `applyDamage`, `holdRoom` | [js/flight/ship.js](ship.js.md) |
| 2 | `../world/field.js` | `nearbyRocks`, `wearRock` | [js/world/field.js](../world/field.js.md) |
| 8 | `../world/debris.js` | `chunks`, `removeChunk` | [js/world/debris.js](../world/debris.js.md) |
| 9 | `../economy/materials.js` | `goodName` | [js/economy/materials.js](../economy/materials.js.md) |
| 10 | `../world/bodies.js` | `currentSystem` | [js/world/bodies.js](../world/bodies.js.md) |
| 11 | `../world/generate.js` | `rngFromSeed` | [js/world/generate.js](../world/generate.js.md) |
| 12 | `../npc/traffic.js` | `traffic`, `HOSTILE_ROLES`, `LAW_ROLES` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 13 | `../drones/npcdrones.js` | `npcDrones` | [js/drones/npcdrones.js](../drones/npcdrones.js.md) |
| 14 | `../npc/battles.js` | `engagementAt`, `ENGAGE_R` | [js/npc/battles.js](../npc/battles.js.md) |
| 15 | `../aria/aria.js` | `notePlayerChoice`, `handsOff` | [js/aria/aria.js](../aria/aria.js.md) |

## Imported by

- [js/aria/senses.js](../aria/senses.js.md) — `contacts`
- [js/comms/comms.js](../comms/comms.js.md) — `contacts`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `contacts`
- [js/console/panels/ship.js](../console/panels/ship.js.md) — `mining`, `turretAim`
- [js/corp/seclevel.js](../corp/seclevel.js.md) — `contactById`, `contacts`, `fireRound`
- [js/drones/ops.js](../drones/ops.js.md) — `contacts`, `contactById`, `fireRound`
- [js/flight/autopilot.js](autopilot.js.md) — `mining`, `MINE_RANGE`
- [js/interior/interior.js](../interior/interior.js.md) — `contacts`
- [js/mission/salvage.js](../mission/salvage.js.md) — `contacts`
- [js/npc/captain.js](../npc/captain.js.md) — `contacts`, `mining`, `turretAim`
- [js/npc/combat.js](../npc/combat.js.md) — `npcTracer`, `contacts`, `contactById`
- [js/render/engine.js](../render/engine.js.md) — `contacts`, `mining`, `shots`, `turretAim`
- [js/sim/sim.js](../sim/sim.js.md) — `combatHooks`, `contacts`, `fireRound`, `mining`, `npcTracer`, `resetCombat`, `shots`, `stepMining`, `stepShots`, `stepTurrets`, `syncContacts`, `turretAim`, `miningHooks`
- [js/station/stationworks.js](../station/stationworks.js.md) — `contacts`, `fireRound`
- [js/ui/chatbox.js](../ui/chatbox.js.md) — `contacts`
- [js/ui/hud.js](../ui/hud.js.md) — `contacts`
- [js/ui/tutorial.js](../ui/tutorial.js.md) — `MINE_RANGE`
- test/aria-mining-loop.test.mjs _(outside js/)_ — `contacts`
- test/hotpath-optimization.test.mjs _(outside js/)_ — `contacts`, `syncContacts`, `CONTACT_R`, `shots`
- test/hulks.test.mjs _(outside js/)_ — `contacts`, `fireRound`
- test/portdrones.test.mjs _(outside js/)_ — `contacts`, `shots`, `stepShots`, `syncContacts`
- test/qrf.test.mjs _(outside js/)_ — `contacts`, `shots`, `stepShots`, `syncContacts`
- test/reactive.test.mjs _(outside js/)_ — `contacts`, `syncContacts`, `shots`, `stepShots`, `CONTACT_R`
- test/rig.test.mjs _(outside js/)_ — `mining`, `stepMining`
- test/seclevel.test.mjs _(outside js/)_ — `syncContacts`, `contacts`
- test/sky.test.mjs _(outside js/)_ — `contacts`, `shots`, `syncContacts`, `stepShots`, `npcTracer`, `CONTACT_R`

## Exports

- [`MINE_YIELD`](#s-MINE_YIELD) · const — **no importer in scanned roots**
- [`miningHooks`](#s-miningHooks) · const — used by [js/sim/sim.js](../sim/sim.js.md)
- [`CONTACT_R`](#s-CONTACT_R) · const — used by test/hotpath-optimization.test.mjs, test/reactive.test.mjs, test/sky.test.mjs
- [`COMBAT_RANGE`](#s-COMBAT_RANGE) · const — **no importer in scanned roots**
- [`MINE_RANGE`](#s-MINE_RANGE) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md)
- [`MINE_RANGE_OD`](#s-MINE_RANGE_OD) · const — **no importer in scanned roots**
- [`contacts`](#s-contacts) · const — used by [js/aria/senses.js](../aria/senses.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/corp/seclevel.js](../corp/seclevel.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/interior/interior.js](../interior/interior.js.md), [js/mission/salvage.js](../mission/salvage.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/npc/combat.js](../npc/combat.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationworks.js](../station/stationworks.js.md), [js/ui/chatbox.js](../ui/chatbox.js.md), [js/ui/hud.js](../ui/hud.js.md), test/aria-mining-loop.test.mjs, test/hotpath-optimization.test.mjs, test/hulks.test.mjs, test/portdrones.test.mjs, test/qrf.test.mjs, test/reactive.test.mjs, test/seclevel.test.mjs, test/sky.test.mjs
- [`shots`](#s-shots) · const — used by [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), test/hotpath-optimization.test.mjs, test/portdrones.test.mjs, test/qrf.test.mjs, test/reactive.test.mjs, test/sky.test.mjs
- [`combatHooks`](#s-combatHooks) · const — used by [js/sim/sim.js](../sim/sim.js.md)
- [`mining`](#s-mining) · const — used by [js/console/panels/ship.js](../console/panels/ship.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), test/rig.test.mjs
- [`turretAim`](#s-turretAim) · const — used by [js/console/panels/ship.js](../console/panels/ship.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`resetCombat`](#s-resetCombat) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`contactById`](#s-contactById) · function — used by [js/corp/seclevel.js](../corp/seclevel.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/npc/combat.js](../npc/combat.js.md)
- [`syncContacts`](#s-syncContacts) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/hotpath-optimization.test.mjs, test/portdrones.test.mjs, test/qrf.test.mjs, test/reactive.test.mjs, test/seclevel.test.mjs, test/sky.test.mjs
- [`npcTracer`](#s-npcTracer) · function — used by [js/npc/combat.js](../npc/combat.js.md), [js/sim/sim.js](../sim/sim.js.md), test/sky.test.mjs
- [`pickCombatTarget`](#s-pickCombatTarget) · function — **no importer in scanned roots**
- [`nearestContact`](#s-nearestContact) · function — **no importer in scanned roots**
- [`fireRound`](#s-fireRound) · function — used by [js/corp/seclevel.js](../corp/seclevel.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationworks.js](../station/stationworks.js.md), test/hulks.test.mjs
- [`stepShots`](#s-stepShots) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/portdrones.test.mjs, test/qrf.test.mjs, test/reactive.test.mjs, test/sky.test.mjs
- [`stepTurrets`](#s-stepTurrets) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`stepMining`](#s-stepMining) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/rig.test.mjs

## Effects

- **bus.emit** — `‹c› on fire` (syncContacts:146, stepPirates:174, stepDrones:256) · `‹from› on fire` (npcTracer:181, fireRound:327) · `‹ship.pos› on fire` (stepTurrets:408)

## Symbols

### <a id="s-MINE_YIELD"></a>`MINE_YIELD`

const · **exported** · L4–4

<!-- note:MINE_YIELD -->
<!-- /note -->

### <a id="s-miningHooks"></a>`miningHooks`

const · **exported** · L6–6

<!-- note:miningHooks -->
sim.js hangs the stow here: the cutter cannot reach setMiningMode from a leaf.
<!-- /note -->

### <a id="s-PIRATE_RANGE"></a>`PIRATE_RANGE`

const · L17–17

<!-- note:PIRATE_RANGE -->
<!-- /note -->

### <a id="s-CONTACT_R"></a>`CONTACT_R`

const · **exported** · L18–18

<!-- note:CONTACT_R -->
<!-- /note -->

### <a id="s-PIRATE_RATE"></a>`PIRATE_RATE`

const · L19–19

<!-- note:PIRATE_RATE -->
<!-- /note -->

### <a id="s-COMBAT_RANGE"></a>`COMBAT_RANGE`

const · **exported** · L21–21

<!-- note:COMBAT_RANGE -->
<!-- /note -->

### <a id="s-MINE_RANGE"></a>`MINE_RANGE`

const · **exported** · L22–22

<!-- note:MINE_RANGE -->
<!-- /note -->

### <a id="s-MINE_RANGE_OD"></a>`MINE_RANGE_OD`

const · **exported** · L23–23

<!-- note:MINE_RANGE_OD -->
<!-- /note -->

### <a id="s-OVERDRIVE_BONUS"></a>`OVERDRIVE_BONUS`

const · L24–24

<!-- note:OVERDRIVE_BONUS -->
<!-- /note -->

### <a id="s-DRONE_RANGE"></a>`DRONE_RANGE`

const · L25–25

<!-- note:DRONE_RANGE -->
<!-- /note -->

### <a id="s-DRONE_DMG"></a>`DRONE_DMG`

const · L26–26

<!-- note:DRONE_DMG -->
What a drone's gun does.

0.3.34 took this from 7 to 4 — and the measurement behind that number was
wrong, because it measured THIS loop while the drones actually killing
people were firing from stepPirates below at 6 on a 1.16 s cycle. See the
note there. Reported twice, and right both times.

0.3.35, with the routing corrected so every drone in the sky is on this
number, and lowered again to 3 because it had been asked for twice. Against
a trainer, with the 0.3.34 pools: a seven-drone pack takes 27 s and a full
fifteen-drone surge 10 s. A mid-tier hull gets 63 s and 21 s.

Raise it here if the belt ever feels toothless — 4 puts the trainer back to
19 s and 8 s, which is where 0.3.34 meant to leave it.
<!-- /note -->

### <a id="s-DRONE_CD_MIN"></a>`DRONE_CD_MIN`

const · L27–27

<!-- note:DRONE_CD_MIN -->
<!-- /note -->

### <a id="s-DRONE_CD_SPAN"></a>`DRONE_CD_SPAN`

const · L27–27

<!-- note:DRONE_CD_SPAN -->
<!-- /note -->

### <a id="s-MAX_DRONES"></a>`MAX_DRONES`

const · L28–28

<!-- note:MAX_DRONES -->
<!-- /note -->

### <a id="s-DRONE_SPAWN_R"></a>`DRONE_SPAWN_R`

const · L29–29

<!-- note:DRONE_SPAWN_R -->
<!-- /note -->

### <a id="s-DRONE_DESPAWN_R"></a>`DRONE_DESPAWN_R`

const · L30–30

<!-- note:DRONE_DESPAWN_R -->
<!-- /note -->

### <a id="s-DRONE_ACCEL"></a>`DRONE_ACCEL`

const · L31–31

<!-- note:DRONE_ACCEL -->
<!-- /note -->

### <a id="s-DRONE_TOP"></a>`DRONE_TOP`

const · L32–32

<!-- note:DRONE_TOP -->
<!-- /note -->

### <a id="s-contacts"></a>`contacts`

const · **exported** · L34–34

<!-- note:contacts -->
<!-- /note -->

### <a id="s-shots"></a>`shots`

const · **exported** · L35–35

<!-- note:shots -->
<!-- /note -->

### <a id="s-combatHooks"></a>`combatHooks`

const · **exported** · L36–36

<!-- note:combatHooks -->
onHit(contact, damage, ownerId, time) — raised for every round that lands
on a contact, whoever fired it. npc/security.js listens so a hull being
worked over can put out a call; npc/combat.js listens so a hull that is
being shot at knows to run or answer.
<!-- /note -->

### <a id="s-lastCutNote"></a>`lastCutNote`

const · L37–37

<!-- note:lastCutNote -->
<!-- /note -->

### <a id="s-mining"></a>`mining`

const · **exported** · L39–39

<!-- note:mining -->
<!-- /note -->

### <a id="s-turretAim"></a>`turretAim`

const · **exported** · L40–40

<!-- note:turretAim -->
<!-- /note -->

### <a id="s-droneSeed"></a>`droneSeed`

const · L42–42

<!-- note:droneSeed -->
<!-- /note -->

### <a id="s-rng"></a>`rng`

const · L43–43

- called by: [`spawnDrone`](#s-spawnDrone) ×5 · [`stepDrones`](#s-stepDrones) ×4

<!-- note:rng -->
<!-- /note -->

### <a id="s-resetCombat"></a>`resetCombat(seedKey)`

function · **exported** · L45–55

- calls: [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetCombat -->
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L57–59

- called by: [`fire`](#s-fire) · [`nearestContact`](#s-nearestContact) · [`pickCombatTarget`](#s-pickCombatTarget) · [`stepDrones`](#s-stepDrones) · [`stepPirates`](#s-stepPirates)

<!-- note:d3 -->
<!-- /note -->

### <a id="s-byId"></a>`byId`

const · L61–61

<!-- note:byId -->
---- contacts -----------------------------------------------------------

The board is an ARRAY because everything that draws it or walks it wants an
array. It is also looked up by id three times a tick in syncContacts — once
per peer, once per hull, once per drone — and doing that with
`contacts.find()` is a linear scan with a fresh closure each time. In a busy
sky that is 120 hulls against a 120-entry board: fourteen thousand id
comparisons per pass, three passes, sixty times a second, on a phone.

So syncContacts builds an index. The important part is that the index is
PRIVATE TO ONE CALL and rebuilt at the top of it.

The first attempt at this kept the Map alive between calls and revalidated it
against `contacts.length`, on the theory that anything adding or removing a
contact changes the length. That is not true, and the failure is silent: swap
one contact for another — `contacts.length = 0` then push a different one, as
a test harness does and as any future caller might — and the length is
identical, the index is never rebuilt, and lookups return a contact that is
no longer on the board while missing the one that is.

`contacts` is exported and anything can mutate it, so a long-lived index over
it cannot be validated cheaply without every mutator cooperating — and a
cache that is usually right is worse than no cache at all. Rebuilding once
per tick costs one O(n) pass and removes the whole class of problem: within a
call the index cannot go stale, because nothing else runs.
<!-- /note -->

### <a id="s-liveNpc"></a>`liveNpc`

const · L62–62

<!-- note:liveNpc -->
<!-- /note -->

### <a id="s-liveCd"></a>`liveCd`

const · L63–63

<!-- note:liveCd -->
<!-- /note -->

### <a id="s-contactById"></a>`contactById(id)`

function · **exported** · L65–68

- called by: [`alive`](../corp/seclevel.js.md#s-alive) _js/corp/seclevel.js_ · [`attackerKind`](../corp/seclevel.js.md#s-attackerKind) _js/corp/seclevel.js_ · [`bountyFor`](../corp/seclevel.js.md#s-bountyFor) _js/corp/seclevel.js_ · [`callSOS`](../corp/seclevel.js.md#s-callSOS) _js/corp/seclevel.js_ · [`wingArrived`](../corp/seclevel.js.md#s-wingArrived) _js/corp/seclevel.js_ ×2 · [`ROLE_STEP.combat`](../drones/ops.js.md#s-ROLE_STEP-combat) _js/drones/ops.js_

<!-- note:contactById -->
One contact by id. Linear, and deliberately so — see the note above.
<!-- /note -->

### <a id="s-addContact"></a>`addContact(c)`

function · L70–74

- called by: [`syncContacts`](#s-syncContacts) ×3

<!-- note:addContact -->
Push onto the board and into this call's index, so the next pass sees it.
<!-- /note -->

### <a id="s-syncContacts"></a>`syncContacts(ship, remotes, relationOf, time, dt)`

function · **exported** · L76–154

- calls: [`addContact`](#s-addContact) ×3 · [`fire`](#s-fire) · [`stepDrones`](#s-stepDrones) · [`stepPirates`](#s-stepPirates)
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- called by: [`tickSim`](../sim/sim.js.md#s-tickSim) _js/sim/sim.js_
- effects: bus.emit `‹c›`

<!-- note:syncContacts -->
Sensor and drone firing range comparisons use squared distances; sensor equality is included and firing equality is excluded. Retain the per-call contact index and bidirectional damage synchronization.

Rebuilds the contact list: live peers plus whatever drones are around.

- L77 · `byId.clear();` — one O(n) pass to index the board, then every lookup below is O(1). The
  Sets are module-level and cleared rather than rebuilt, so a steady sky
  allocates nothing in here at all.
- L81 · `for (const r of remotes.values()) {` — peers
- L97 · `for (const n of traffic) {` — CRADLE captains working this sky — traders, miners, haulers, pickets
- L98 · `if (n.visible === false) continue;` — docked inside a ring, in a lane, or shot down: off the board
- L? · `if (d3(n, ship.pos) > CONTACT_R) continue;` — sensors do not reach: the board knows it, the turrets do not
- L104 · `c = addContact({ id: n.id, kind: "npc", name: n.name, hp: n.hp ?? 120, shield: n.shield ??` — the hull's own numbers, not one size for a picket and an ore barge
- L106 · `if (n.hp != null) {` — two-way: rounds that land on the contact land on the hull, and damage
  the hull took out of contact range is already on it when it comes back
- L123 · `const rel = relationOf(n.id);` — relationOf() was called twice per hull per tick to answer one question
- L124 · `c.relation = rel === "neutral" ? (LAW_ROLES.has(n.role) ? (ship.outlaw ? "hostile" : "ally` — 0.3.48: a wanted pilot (security ◆ RED) is the Directorate's quarry
- L132 · `for (const u of npcDrones.units) {` — the corporations' drones (drones/npcdrones.js): hostile holds' gun drones join the board as
  hostile "drone" contacts inside contact range, so the sentry sees them and they shoot back
- L143 · `if (c.hp < u.hp) u.hp = c.hp;` — rounds landed on the contact land on the drone
- L? · `if (u.hostile && u.role === "combat" && c.cooldown <= 0 && d3(u, ship.pos) < 900) { c.cool` — a hold's gun drone shoots at anyone inside its port's water
<!-- /note -->

### <a id="s-HOSTILE_GUN"></a>`HOSTILE_GUN`

const · L156–159

<!-- note:HOSTILE_GUN -->
Pirates shoot back. A lurker takes anyone inside PIRATE_RANGE; once you
have joined an engagement (npc/battles.js) the whole wing takes you
inside ENGAGE_R.

WHO IS SHOOTING, AND WITH WHAT.

0.3.35. This loop takes everything in HOSTILE_ROLES, and js/npc/rogues.js
puts "rogue" in that set — so the 0.3.30 nest wave drones, the ones that
actually swarm the belt, were firing on the PIRATE profile: 6 damage on a
1.16 s cycle, 5.19 dps each. The ambient swarm this file spawns itself fires
4 on a 2.2 s cycle, 1.82 dps.

So a nest drone was doing 2.9x what a drone does, and 0.3.34's "drone
damage 7 -> 4" never touched the ones doing the killing. A fifteen-strong
surge was landing 78 dps on a hull with about 260 effective points behind
it. Reported twice, correctly, and the second time was still right.

A machine that wandered out of a derelict is not a crewed raider, and now
it does not shoot like one. The profile is per role rather than one number
for everything hostile, so this cannot quietly happen again the next time
something is added to HOSTILE_ROLES.

- L157 · `pirate: { dmg: 6, wing: 8, speed: 560, cd: () => PIRATE_RATE * (0.8 + Math.random() * 0.5)` — a crewed hull hunting you: fast, and worse once its wing is on you
- L158 · `rogue: { dmg: DRONE_DMG, wing: DRONE_DMG, speed: 520, cd: () => DRONE_CD_MIN + Math.random` — a nest drone: the same gun the ambient swarm carries, because it is the
  same kind of thing — and no wing bonus, because a wave is not a wing
<!-- /note -->

#### <a id="s-HOSTILE_GUN-cd"></a>`HOSTILE_GUN.cd()`

prop · L157–157

<!-- note:HOSTILE_GUN.cd -->
<!-- /note -->

#### <a id="s-HOSTILE_GUN-cd-2"></a>`HOSTILE_GUN.cd~2()`

prop · L158–158

<!-- note:HOSTILE_GUN.cd~2 -->
<!-- /note -->

### <a id="s-DEFAULT_GUN"></a>`DEFAULT_GUN`

const · L160–160

<!-- note:DEFAULT_GUN -->
<!-- /note -->

### <a id="s-stepPirates"></a>`stepPirates(ship, time, dt)`

function · L162–176

- calls: [`d3`](#s-d3) · [`fire`](#s-fire) · [`engagementAt`](../npc/battles.js.md#s-engagementAt) _js/npc/battles.js_
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- called by: [`syncContacts`](#s-syncContacts)
- effects: bus.emit `‹c›`

<!-- note:stepPirates -->
<!-- /note -->

### <a id="s-npcTracer"></a>`npcTracer(from, to, faction=, damage=, speed=, spread=)`

function · **exported** · L178–186

- calls: [`fire`](#s-fire)
- called by: [`stepGuns`](../npc/combat.js.md#s-stepGuns) _js/npc/combat.js_
- effects: bus.emit `‹from›`

<!-- note:npcTracer -->
A round between two NPC hulls. `damage` of 0 keeps the old cosmetic
behaviour for anything that still wants theatre; anything above 0 is real
and will only ever land on `to`.
<!-- /note -->

### <a id="s-spawnDrone"></a>`spawnDrone(ship)`

function · L188–207

- calls: [`rng`](#s-rng) ×5
- called by: [`stepDrones`](#s-stepDrones)

<!-- note:spawnDrone -->
<!-- /note -->

### <a id="s-stepDrones"></a>`stepDrones(ship, time, dt)`

function · L209–259

- calls: [`addCargo`](ship.js.md#s-addCargo) _js/flight/ship.js_ ×2 · [`d3`](#s-d3) · [`fire`](#s-fire) · [`rng`](#s-rng) ×4 · [`spawnDrone`](#s-spawnDrone)
- called by: [`syncContacts`](#s-syncContacts)
- effects: bus.emit `‹c›`

<!-- note:stepDrones -->
- L221 · `if (c.hp <= 0 && !c.eaten) {` — a hole's kill leaves nothing to salvage
- L228 · `if ((c.truceUntil ?? -1) > time) {` — A guard under truce (toll paid over comms) holds station and holds fire.
- L234 · `const want = 620;` — Close to standoff range, then hold and shoot.
<!-- /note -->

### <a id="s-engages"></a>`engages(mode, contact, ship, time)`

function · L261–279

- called by: [`pickCombatTarget`](#s-pickCombatTarget)

<!-- note:engages -->
---- engagement rules ---------------------------------------------------
<!-- /note -->

### <a id="s-pickCombatTarget"></a>`pickCombatTarget(ship, time)`

function · **exported** · L281–294

- calls: [`d3`](#s-d3) · [`engages`](#s-engages)
- called by: [`stepTurrets`](#s-stepTurrets)

<!-- note:pickCombatTarget -->
Nearest contact the current rules allow us to shoot.
<!-- /note -->

### <a id="s-nearestContact"></a>`nearestContact(ship)`

function · **exported** · L296–307

- calls: [`d3`](#s-d3)
- called by: [`stepTurrets`](#s-stepTurrets)

<!-- note:nearestContact -->
Tracked-but-not-engaged contact, so PASSIVE still earns its power.
<!-- /note -->

### <a id="s-fire"></a>`fire(from, to, speed, damage, owner, faction, kind=, target=)`

function · L309–326

- calls: [`d3`](#s-d3)
- called by: [`fireRound`](#s-fireRound) · [`npcTracer`](#s-npcTracer) · [`stepDrones`](#s-stepDrones) · [`stepPirates`](#s-stepPirates) · [`stepTurrets`](#s-stepTurrets) · [`syncContacts`](#s-syncContacts)

<!-- note:fire -->
---- ordnance -----------------------------------------------------------
<!-- /note -->

### <a id="s-fireRound"></a>`fireRound(from, to, speed, damage, owner, faction, kind=, target=)`

function · **exported** · L327–327

- calls: [`fire`](#s-fire)
- called by: [`wingSupport`](../corp/seclevel.js.md#s-wingSupport) _js/corp/seclevel.js_ · [`ROLE_STEP.combat`](../drones/ops.js.md#s-ROLE_STEP-combat) _js/drones/ops.js_ · [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_ · [`stepDefences`](../station/stationworks.js.md#s-stepDefences) _js/station/stationworks.js_ · [`stepStationDrones`](../station/stationworks.js.md#s-stepStationDrones) _js/station/stationworks.js_
- effects: bus.emit `‹from›`

<!-- note:fireRound -->
A round from something that is not the player's ship: station mounts and drones (stationworks.js).
<!-- /note -->

### <a id="s-sweptMiss"></a>`sweptMiss(px, py, pz, ax, ay, az, dx, dy, dz)`

function · L329–334

- called by: [`stepShots`](#s-stepShots) ×3

<!-- note:sweptMiss -->
Closest approach of the segment travelled this tick to a point.
<!-- /note -->

### <a id="s-stepShots"></a>`stepShots(ship, dt, time, onKill)`

function · **exported** · L336–390

- calls: [`applyDamage`](ship.js.md#s-applyDamage) _js/flight/ship.js_ · [`sweptMiss`](#s-sweptMiss) ×3
- called by: [`tickSim`](../sim/sim.js.md#s-tickSim) _js/sim/sim.js_

<!-- note:stepShots -->
- L353 · `if (s.faction.startsWith("npc")) {` — An NPC round with no target is theatre (something still firing tracers);
  one with a target is real, and lands on that hull alone.
- L355 · `const c = byId.get(s.target);` — through the index, never a scan: stepShots runs immediately after
  syncContacts rebuilt it, and a target that is not on the board is a
  round with nothing to land on
- L368 · `if (s.faction === "hostile") {` — Rounds move hundreds of units a frame, so test the whole segment.
- L370 · `applyDamage(ship, s.damage, s.owner, time, s.dmgKind ?? "kinetic");` — a round is mass on a trajectory: kinetic, which is exactly what a
  screen is worst at and plate is best at (js/flight/defence.js)
- L377 · `if (s.faction === "station" && (c.relation !== "hostile" || c.kind === "sdrone")) continue` — a port's guns and drones only ever hit what is hostile; your own rounds hit whatever they meet
- L384 · `combatHooks.onHit?.(c, s.damage, s.owner, time);` — somebody just shot somebody: whoever cares about that hears it here
<!-- /note -->

### <a id="s-stepTurrets"></a>`stepTurrets(ship, dt, time)`

function · **exported** · L392–422

- calls: [`fire`](#s-fire) · [`nearestContact`](#s-nearestContact) · [`pickCombatTarget`](#s-pickCombatTarget)
- called by: [`stepShip`](../sim/sim.js.md#s-stepShip) _js/sim/sim.js_
- effects: bus.emit `‹ship.pos›`

<!-- note:stepTurrets -->
---- the turret tick ----------------------------------------------------

- L402 · `const rate = (ship.powered.gravity ? 0.42 : 0.52) / ((ship.tune?.turretRate ?? 1) * (ship.` — Local gravity on gives the mounts something to brace against.
- L405 · `ship.lastFireAt = time;` — 0.3.48: shooting is being in a fight (js/corp/seclevel.js)
- L406 · `combatHooks.onFire?.(target, time);` — 0.3.56: …and whether it was self-defence
- L421 · `return target && ship.powered.turrets ? (DRAW.turretFire - DRAW.turrets) * (ship.tune?.tur` — Faster cycling costs proportionally more on the bus. Billed for the whole
  engagement, not only the tick a round leaves: a one-tick 19 kW spike
  averaged under 1 kW and cost twice as much at 30 fps as at 60.
<!-- /note -->

### <a id="s-minableDebris"></a>`minableDebris(ship, range)`

function · L424–438

- calls: [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_
- called by: [`stepMining`](#s-stepMining)

<!-- note:minableDebris -->
---- mining -------------------------------------------------------------

Impact debris the cutter can reach, shaped like a belt rock so one loop mines both.
<!-- /note -->

### <a id="s-stepMining"></a>`stepMining(ship, dt, time, lock=, want=)`

function · **exported** · L440–510

- calls: [`handsOff`](../aria/aria.js.md#s-handsOff) _js/aria/aria.js_ · [`notePlayerChoice`](../aria/aria.js.md#s-notePlayerChoice) _js/aria/aria.js_ · [`addCargo`](ship.js.md#s-addCargo) _js/flight/ship.js_ ×2 · [`holdRoom`](ship.js.md#s-holdRoom) _js/flight/ship.js_ · [`minableDebris`](#s-minableDebris) · [`removeChunk`](../world/debris.js.md#s-removeChunk) _js/world/debris.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_ · [`wearRock`](../world/field.js.md#s-wearRock) _js/world/field.js_
- called by: [`tickSim`](../sim/sim.js.md#s-tickSim) _js/sim/sim.js_

<!-- note:stepMining -->
The cutter works whatever is in reach: belt rocks and impact debris alike.
A locked rock or chunk is preferred over the merely nearest one, so P-LOCK
picks the cut. `lock` is the sim's lock record ({kind, id, locked}).

- L454 · `const hasWant = want ? rocks.some((r) => r.ore === want && Math.hypot(r.x - ship.pos.x, r.` — 0.3.22: `want` is an ore the pilot is under contract for, passed only while
  something else is flying (the mining loop). A rock of that ore inside the
  cutter's reach wins over a nearer rock of anything else — otherwise a loop
  sent to cut nickel comes home with a hold of whatever it brushed past. It
  is a preference, not a filter: with none in reach the cutter works the
  belt as it always has, and a locked rock still overrides everything.
- L482 · `const cut = (od ? 0.075 : 0.032) * dt;` — 0.3.11 halved the pull. A hold used to fill faster than anything downstream
  of it could consume — and now that ore is the input to a fabrication chain
  rather than just a thing to sell, the cut rate is the tap on the whole
  economy. One named constant, because this is the number to reach for when
  the belt feels too generous or too mean.
- L485 · `const c = best.debris;` — a chunk is finite: the cutter eats it down and it is gone
- L492 · `const boiloff = best.ice && od ? 0.75 : 1;` — Bigger rock, richer pull — same exponential logic as the worlds.
  An overdriven cutter boils volatiles off an ice rock — faster, wasteful.
- L497 · `if (!handsOff() && Math.floor(time) !== lastCutNote) { lastCutNote = Math.floor(time); not` — what you actually point the cutter at, sampled rather than counted every
  frame — one example a second is plenty and keeps the tally honest
- L498 · `if (best.seed > 0.95) addCargo(ship, best.ice ? "deuterium" : "platinum_ore", yieldRate *` — the odd rock carries something better than what it looks like
- L498 · `if (best.seed > 0.95) addCargo(ship, best.ice ? "deuterium" : "platinum_ore", yieldRate *` — 0.3.58: one rock in twenty, a fortieth of the pull (was one in seven, an eighth)
- L501 · `mining.fullSince = time;` — The hold is full and the cutter is still burning: power into a beam that
  lands nothing. Stow it and say so, once per fill — the latch matters
  because this runs every frame and a notice per frame is a strobe.
  turrets.js is a leaf and may not import sim.js, so the actual stow goes
  through the hook, which sim.js owns.
- L505 · `if (best.rich && mining.assayed !== best.key) {` — the assay call every prospector lives for — sim picks this up and logs it
<!-- /note -->
