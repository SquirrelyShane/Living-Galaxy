# PATCH v1.00.60 — "Magazine"

Slice 6: **ammunition and thermal load** — the two deferred items from v1.00.20 that gave
the trigger something to spend other than power. No schema change; the chambered round
rides with the ammunition payload it selects from. 23 suites, **2,001 checks**, all green.

---

## What was actually wrong

Forty ammunition blueprints have been in the crafting database since v1.00.20, with
compatibility lists, tier gates, bills of materials and manufacturing hours. `S.ammo` has
existed, been serialised and been restored the whole time. The manufacturing queue could
build rounds and put them in the hold.

**Nothing in the game could fire one.** `weapons.js` spent energy and produced a projectile
out of nothing. It was a complete supply chain with no consumer at the far end of it — the
sort of thing that looks finished from every angle except the one that matters.

Heat was worse: it did not exist at all. Energy was the only budget on the trigger, and a
weapon system with one limiter has one decision in it.

---

## Two budgets, failing differently

That is the design, and it is why both landed in one slice rather than two:

- **Running dry is a supply problem.** You solve it before you undock, at a station counter
  or a manufacturing queue.
- **Overheating is a tempo problem.** You solve it inside the fight, by easing off.

One tells you to plan; the other tells you to stop squeezing. Adding either alone would
have left the other half of the trigger unexamined.

**Energy weapons take no ammunition, on purpose.** A pulse laser that runs dry is a
projectile weapon with extra steps. The split is the whole trade: energy guns cost you the
bank and never strand you; projectile and missile guns cost you cargo space, credits and
forethought, and hit harder for it. Correspondingly, energy weapons run *hot* — a beam
projector trips the cutout on its own in a few seconds — so the two families are limited by
different things rather than one being strictly better.

---

## Compatibility is derived, not listed

`AMMUNITION[id].compatible` is prose: "Autocannon/Railgun", "Missile Rack/Torpedo", written
for a human reading a catalogue. The obvious move was a second table mapping weapon keys to
ammo ids — which is the same table said twice, and drifts the first time anyone adds a
round.

Instead each weapon declares the *words* its feed answers to, and compatibility is a match
against the catalogue's own text:

```js
export const FEEDS = {
  autocannon: { match: ['Autocannon', 'Flak'] },
  rail:       { match: ['Railgun', 'Coilgun', 'Gauss'] },
  ...
};
```

A new `AMMO-` entry joins the right guns the moment it is added. Same for what a round
*does*: `damage_type` is also prose and also the authority — "Kinetic/AP" is kinetic with a
penetration flag, "EMP" and "Ion" are EM, "Thermal", "Nuclear" and "Antimatter" burn.
Reading the string beats a forty-row lookup nobody will keep in step.

Non-combat stores share that catalogue — a boarding pod and a coolant cartridge are things a
ship carries, not things a gun fires at somebody — and are filtered out, so the loadout panel
never offers a choice that does nothing.

---

## The bugs I wrote and then found

Three worth recording, because each one was the *obvious* implementation.

### Penetration went the wrong way

`npcResist()` looks up `DAMAGE.resist`, and those entries are damage **multipliers**, not
resistances. Kinetic against armour is already `1.30`. So the natural reading of the word
penetration — "lift the resistance toward 1" — made armour-piercing rounds *worse* against
armour, which is the exact opposite of the thing they are named for.

Penetration widens the multiplier the round already has. Paired with `apYield` at 0.88 it is
a real trade rather than a strict upgrade: an AP round gives up yield everywhere in exchange
for going through plate, so it is right against a plated raider and wrong against a shield
boat.

### Heat capacity from mass made the freighter the best gun platform

Mass was the obvious proxy — a big hull soaks more, same reason a big hull is slow — and it
produced an industrial hauler at 77 heat and a military hull at 40, because a freighter is
heavy. How much fire a ship can sustain is radiators, not tonnage. It is a number each hull
carries now.

### The thermal cutout could never fire

I put the latch in the venting function, where it read correctly and was unreachable: heat
is clamped at capacity when it is added, so the stored value never *exceeds* the cutout, and
the vent runs before the check — by the time the comparison happened, heat was always a
fraction under the line. The latch goes down where heat is generated. Only the clearing half
belongs with the venting.

Worth generalising: **a threshold checked after the thing that moves it away from the
threshold is a threshold that never trips.**

---

## Details that took a second pass

**Fractional draw, integer stock.** A burst autocannon eating a whole round per trigger
frame empties a 200-slug stack in half a minute. Feeds draw a fraction per shot and the
remainder is carried — and `roundsHeld` rounds *up*, not down, because a part-expended round
is still a round you have. Flooring showed a pilot 9 slugs the instant they touched the
trigger on a full rack of 10.

**Auto-chamber.** If nothing is selected, or the selection runs out mid-fight, the cheapest
compatible round still aboard chambers itself. A pilot who never opens the loadout panel
should never be told their guns are empty while there are slugs in the hold — the panel is
for choosing, not for the basic case working.

**One chambered round per feed, not per mount.** Three autocannons share a magazine because
they share a supply chain, and asking a pilot to set the same round three times is a chore
dressed as a decision.

**A new pilot has to be able to fire the gun they were issued.** The starting fit carries a
gauss driver; a standard-issue gun that cannot fire is not a design decision, it is a bug
with a rationale attached. New pilots undock with 400 standard slugs and 120 AP, and stations
sell stacks up to tier 2. Tier 3+ stays a manufacturing problem — the ammunition tree should
not resolve to a shop counter.

---

## Files

**New** — `src/systems/ordnance.js`, `src/systems/magazine.js`, `test/ordnance.mjs`,
`PATCH_v1.00.60.md`

**Changed** — `src/systems/weapons.js`, `src/systems/preflight.js`, `src/systems/combat.js`,
`src/systems/projectiles.js`, `src/systems/economy.js`, `src/systems/crafting.js`,
`src/core/config.js`, `src/core/state.js`, `src/core/version.js`, `src/ui/hud.js`,
`css/hud.css`, `index.html`, `package.json`, `test/all.mjs`, `README.md`, `CHANGELOG.md`,
`docs/SLICE_PLAN.md`

---

## Verified vs not

**Verified:** every feed resolves against the live catalogue and rejects rounds it cannot
chamber; non-combat stores never appear as shots; every round in the catalogue maps to a
known damage type; AP helps against plate, does nothing against shields, and is bounded;
firing spends rounds and generates heat; a dry rack stops the gun, says why, and generates no
heat; the cutout trips under sustained fire, latches, blocks preflight, and clears on its own;
heat never goes negative or exceeds capacity; stations stock nothing above their tier; a
refused purchase delivers nothing; the loadout survives a save and a pre-slice payload loads
and auto-chambers.

**Not verified — and worth saying:**

- **None of the numbers have been measured against play.** `perEnergy`, `perDamage`,
  `ventRate` and the per-hull capacities were written to make the arithmetic come out at a
  sensible tempo — a triple gauss rack trips in about five seconds, a beam projector faster —
  and then checked only for internal consistency. Whether that tempo is *fun* is a session,
  not a test. Same for ammunition prices: a stack of slugs costs what the catalogue says
  times a markup, and has not been weighed against what an hour of mining pays.
- **Weapon groups are not in this slice.** Ammunition makes the *type* of round a decision;
  groups are what would make it a decision you take mid-fight, by firing your kinetic rack at
  a plated raider and your EM rack at a shield boat. That wants an input and UI slice of its
  own, and pretending a feed selector covers it would be overclaiming.
- **There is no loadout panel yet.** `magazineReport()` and `chamber()` exist and are tested;
  the HUD shows a magazine line and a heat bar, but choosing a round currently has no screen.
  Until that lands, auto-chamber is doing all the work and the tactical choice the slice is
  built around is not actually reachable by a player.
- **Module wear** was the third deferred item and is still deferred.
- **NPC ships neither carry ammunition nor overheat.** Both budgets apply to the player only,
  which is a real asymmetry — it means an NPC gun platform can hold a trigger down forever.
  Defensible while NPCs resolve damage through a single pool, but it is an asymmetry rather
  than a decision, and it should not stay one.
