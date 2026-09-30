# js/flight/defence.js

[index](../../../README.md) · 79 lines · 15 symbols · 0 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — what a hull can take, and what takes it.

0.3.34. Reported: rogue drones kill you quickly, and there is nothing to be
done about it. Both true, and the second was the reason for the first.

WHAT WAS MEASURED, before:

  Every hull in the game had exactly 100 hull and 100 shield. Not as a
  balance choice — `hullMaxOf()` returned `ship.hullMax ?? 100` and NOTHING
  ever set `hullMax`, so a 468,000 cr World Frame at 7,500 tonnes was as
  fragile as a 4,400 cr Buoy Skiff at nine. Tier bought you thrust, cargo
  and reactor, and not one point of survivability.

  Mitigation was shields soaking at 1.6:1, then a flat divisor. Against
  seven drones: dead in 8.5 seconds, shields gone at 3.2. The best armour
  upgrade in the game bought 0.9 extra seconds. A full 0.3.30 surge of
  fifteen killed a stock hull in 3.6 seconds — less time than it takes to
  read this sentence, and since 0.3.33 that is the hull gone for good.

So there are three things here, and they are meant to be read together:

  POOLS come from the hull, off data that already existed on all 121 of
  them. Hull integrity follows mass, shield capacity follows reactor. Mass
  spans 833x across the tiers, so the curve is a cube root rather than a
  line — a G-frame is about nine times the hull of an A, not eight hundred.

  RESISTANCES are the part that was missing entirely. Damage has a KIND,
  and shields and armour are good at opposite things: a screen bleeds off
  energy and is poor at stopping mass, while plate is the reverse. That is
  what makes a refit a decision instead of a number going up.

  DRONE DAMAGE comes down, because after all of the above a rogue swarm was
  still the fastest way to lose a hull you had just paid to insure.

Resists are deliberately modest — a few percent to about a third — because
they are supposed to flavour a fight, not decide it before it starts. The
pools do the heavy lifting.

- L44 · `export const RESIST_CAP = 0.62;` — nothing is ever immune to anything
<!-- /note -->

## Imports

_none_

## Imported by

- [js/flight/ship.js](ship.js.md) — `throughShield`, `throughArmour`
- [js/npc/flight.js](../npc/flight.js.md) — `POOL`
- [js/sim/sim.js](../sim/sim.js.md) — `hullPoolFor`, `shieldPoolFor`, `resistsFor`
- [js/station/refityard.js](../station/refityard.js.md) — `defenceReport`, `KINDS`
- test/defence.test.mjs _(outside js/)_ — `KINDS`, `POOL`, `RESIST_CAP`, `SHIELD_RESIST`, `hullPoolFor`, `shieldPoolFor`, `resistsFor`, `defenceReport`, `throughShield`, `throughArmour`

## Exports

- [`KINDS`](#s-KINDS) · const — used by [js/station/refityard.js](../station/refityard.js.md), test/defence.test.mjs
- [`POOL`](#s-POOL) · const — used by [js/npc/flight.js](../npc/flight.js.md), test/defence.test.mjs
- [`hullPoolFor`](#s-hullPoolFor) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/defence.test.mjs
- [`shieldPoolFor`](#s-shieldPoolFor) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/defence.test.mjs
- [`SHIELD_RESIST`](#s-SHIELD_RESIST) · const — used by test/defence.test.mjs
- [`RESIST_CAP`](#s-RESIST_CAP) · const — used by test/defence.test.mjs
- [`resistsFor`](#s-resistsFor) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/defence.test.mjs
- [`defenceReport`](#s-defenceReport) · function — used by [js/station/refityard.js](../station/refityard.js.md), test/defence.test.mjs
- [`throughShield`](#s-throughShield) · function — used by [js/flight/ship.js](ship.js.md), test/defence.test.mjs
- [`throughArmour`](#s-throughArmour) · function — used by [js/flight/ship.js](ship.js.md), test/defence.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-KINDS"></a>`KINDS`

const · **exported** · L1–1

<!-- note:KINDS -->
The three ways something hurts. Everything that deals damage names one.
<!-- /note -->

### <a id="s-POOL"></a>`POOL`

const · **exported** · L3–6

<!-- note:POOL -->
<!-- /note -->

### <a id="s-TIERS"></a>`TIERS`

const · L8–8

<!-- note:TIERS -->
<!-- /note -->

### <a id="s-hullPoolFor"></a>`hullPoolFor(def)`

function · **exported** · L10–14

- called by: [`defenceReport`](#s-defenceReport) · [`syncHullDefence`](../sim/sim.js.md#s-syncHullDefence) _js/sim/sim.js_

<!-- note:hullPoolFor -->
Hull integrity for a registry def. Follows mass, because the thing that
makes a hull hard to kill is how much of it there is.
<!-- /note -->

### <a id="s-shieldPoolFor"></a>`shieldPoolFor(def)`

function · **exported** · L16–20

- called by: [`defenceReport`](#s-defenceReport) · [`syncHullDefence`](../sim/sim.js.md#s-syncHullDefence) _js/sim/sim.js_

<!-- note:shieldPoolFor -->
Shield capacity. Follows the reactor: a screen is a power budget you are
holding in front of you, and a bigger plant holds a bigger one.
<!-- /note -->

### <a id="s-SHIELD_RESIST"></a>`SHIELD_RESIST`

const · **exported** · L22–22

<!-- note:SHIELD_RESIST -->
---- resistances ---------------------------------------------------------

Two profiles, and they are near-opposites on purpose.

A SHIELD is a field. It bleeds off energy well — that is what it is for —
and it is poor at stopping something with mass behind it, which is why a
drone's mass driver goes through a screen that shrugs off a laser.

ARMOUR is plate. It is excellent against mass and merely adequate against
heat, and it does almost nothing about an induced current, which is what
makes EM the answer to a heavily plated hull.

Neither is ever a wall. The caps below keep total mitigation well short of
immunity, because a fight nobody can lose is not a fight.
<!-- /note -->

### <a id="s-ARMOUR_BY_TIER"></a>`ARMOUR_BY_TIER(i)`

function · L24–28

- called by: [`resistsFor`](#s-resistsFor)

<!-- note:ARMOUR_BY_TIER -->
Plate scales with the tier — there is simply more of it on a bigger frame.
<!-- /note -->

### <a id="s-COMPLEX_BIAS"></a>`COMPLEX_BIAS`

const · L30–42

<!-- note:COMPLEX_BIAS -->
What a yard building for this trade puts on a hull. A security frame is
plated against being shot; a smelter or a cutter lives beside furnaces and
is lagged against heat; an energy or comms hull is built around a plant and
is shielded against its own induction before anybody else's.
<!-- /note -->

### <a id="s-RESIST_CAP"></a>`RESIST_CAP`

const · **exported** · L44–44

<!-- note:RESIST_CAP -->
<!-- /note -->

### <a id="s-clampResist"></a>`clampResist(v)`

function · L46–46

- called by: [`resistsFor`](#s-resistsFor) ×2

<!-- note:clampResist -->
<!-- /note -->

### <a id="s-resistsFor"></a>`resistsFor(def, mods=)`

function · **exported** · L48–58

- calls: [`ARMOUR_BY_TIER`](#s-ARMOUR_BY_TIER) · [`clampResist`](#s-clampResist) ×2
- called by: [`defenceReport`](#s-defenceReport) · [`syncHullDefence`](../sim/sim.js.md#s-syncHullDefence) _js/sim/sim.js_

<!-- note:resistsFor -->
The resist profile for a hull: what its plate turns away, and what its
screen does. `mods` is the ship's fitted modifiers — an upgrade can carry a
`resist: { kinetic, thermal, em }` block and it is added here.
<!-- /note -->

### <a id="s-defenceReport"></a>`defenceReport(def, mods=)`

function · **exported** · L60–71

- calls: [`defenceReport>pct`](#s-defenceReport-pct) ×2 · [`hullPoolFor`](#s-hullPoolFor) · [`resistsFor`](#s-resistsFor) · [`shieldPoolFor`](#s-shieldPoolFor)
- called by: [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_

<!-- note:defenceReport -->
Everything a pilot should be able to read off their own hull, for the refit
yard and the console. Percentages, rounded, no trailing arithmetic.
<!-- /note -->

#### <a id="s-defenceReport-pct"></a>`defenceReport>pct(v)`

function · L62–62

- called by: [`defenceReport`](#s-defenceReport) ×2

<!-- note:defenceReport>pct -->
<!-- /note -->

### <a id="s-throughShield"></a>`throughShield(amount, kind, resists)`

function · **exported** · L73–75

- called by: [`applyDamage`](ship.js.md#s-applyDamage) _js/flight/ship.js_

<!-- note:throughShield -->
How much of `amount` of `kind` gets through a shield, and how much gets
through plate. Returned separately because the caller spends the shield
first and only then touches the hull.
<!-- /note -->

### <a id="s-throughArmour"></a>`throughArmour(amount, kind, resists)`

function · **exported** · L77–79

- called by: [`applyDamage`](ship.js.md#s-applyDamage) _js/flight/ship.js_

<!-- note:throughArmour -->
<!-- /note -->
