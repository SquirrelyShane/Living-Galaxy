# PATCH v1.00.70 — "Trigger"

Slice 7: **weapon groups and the loadout panel.** This finishes v1.00.60 rather than
starting something new. Save schema 10 → 11 (migration included). 23 suites, **2,044
checks**, all green.

---

## What was actually wrong

v1.00.60 shipped green, fully tested, and with the thing it existed to create unreachable.

Ammunition made the *type* of round a decision — kinetic against plate, EM against shields,
AP trading yield for penetration — and then gave a pilot no way to make it. There was no
loadout screen, so `chamber()` was called by nothing and auto-chamber picked the cheapest
compatible round every time. Every test passed. A player could not touch any of it.

And even with a panel, the decision was still half-formed: every mount fired on one trigger,
so a rack of kinetic and a rack of EM went out at the same target on the same shot. The
choice collapsed back into "carry whatever is best on average" — which is not a choice.

Worth writing down as a rule: **a mechanic without a screen is not shipped.** Green suites
measure whether the code does the thing. They do not measure whether a player can.

---

## Groups

Two of them, with a three-state selector: I → II → ALL. Two is the number a thumb can drive
on a phone, and three states is what fits on one chip.

### The group is a property of the hardpoint, not the mount

`mountedWeapons()` drops empty slots, so mount 2 and hardpoint 2 are different things the
moment a pilot leaves a slot open. Keying assignments on the mount index would silently
reshuffle a pilot's groups every time they unfitted something — the guns would still be
there, in different groups, with no event to blame.

Assignments hang off `S.fit.weapon` indices. The firing loop iterates hardpoints and looks
the weapon up, rather than iterating mounts and trying to map back.

### Falloff is measured inside the volley that fires

`MULTI_GUN_FALLOFF` docks each barrel past the first. When only one group fires, the index
that matters is the position within *that* group: firing two of four guns should not pay the
fourth barrel's penalty on a gun that is now the second one shooting.

This is what makes splitting a rack a trade rather than a loss:

- **Fire everything** — maximum alpha, worst average yield per barrel.
- **Alternate two groups** — smaller volleys, but every barrel is near the front of its own
  queue, and the group not firing is cooling and not eating rounds.

Neither is the right answer to every fight, which is the point. `ALL` is unchanged from
v1.00.60 behaviour, so an existing fit fires exactly as it did.

### Cooldowns are per hardpoint

Clocks are keyed by hardpoint, not by position in the volley. A pilot who switches from I to
II mid-fight must not find their guns re-armed by the switch — the barrel that just fired is
still hot whether or not it is under the trigger. Asserted directly: firing ALL for one
frame and then immediately firing group I spends nothing more.

### Preflight judges the live group

`activeGuns()` is what every firing check now reads. A pilot with group I selected and group
I dry gets told their magazines are empty — not reassured because group II still has rounds
in it somewhere on the ship. An empty group is its own refusal (`nogroup`) rather than
collapsing into "no weapon fitted", because those are different problems with different
fixes.

---

## The Magazine tab

Per feed: every compatible round, what it does (`kinetic · AP · T3 · ×1.28 yield`), how many
are aboard, and which is chambered. Tap to chamber; tapping a round you do not have says so
rather than silently doing nothing.

When docked it also lists what the station will sell that this fit can actually chamber —
filtered by feed, so a laser boat is not shown a wall of slugs. Undocked it says where rounds
come from instead.

Group assignment sits on the Hardpoints tab as a separate `GRP` tag beside each weapon slot.
Tapping a hardpoint means "change what is in it" everywhere else in that screen; overloading
that tap to sometimes mean "change which trigger it answers" would make the most common
action in the panel ambiguous.

The group chip lives above the action grid rather than in it — a seventh button in that row
is a smaller tap target for every button — and it is **hidden until a fit has guns in two
groups**. A control that changes a label and nothing else invites a tap and teaches nothing.

---

## Two bugs from the DOM stub worth recording

Both were caught by `test/ui.mjs`, which boots the real `main.js` against a minimal DOM.

**`querySelector` on an element.** The FIRE label was found by walking the button. The stub
does not implement element-level queries — and the fix is better code anyway: the label
carries its own id now. A query that walks fixed markup is a query that breaks the first time
somebody adds a second span in there.

**`insertBefore`.** The group tag was inserted ahead of the chevron. Reordering construction
so everything is appended in order is simpler than the insert was, and does not depend on a
DOM method the harness has no reason to provide.

Neither is deep, but both are the reason that suite exists: they are exactly the class of
thing that looks fine in a diff and produces a blank screen on a phone.

---

## Files

**New** — `src/systems/groups.js`, `PATCH_v1.00.70.md`

**Changed** — `src/systems/weapons.js`, `src/systems/preflight.js`, `src/systems/save.js`,
`src/core/state.js`, `src/core/version.js`, `src/ui/fitting.js`, `src/ui/controls.js`,
`css/hud.css`, `index.html`, `package.json`, `test/all.mjs`, `test/ordnance.mjs`,
`test/industry.mjs`, `test/preflight.mjs`, `test/avatar.mjs`, `test/celestial.mjs`,
`README.md`, `CHANGELOG.md`, `docs/SLICE_PLAN.md`

---

## Verified vs not

**Verified:** an unassigned hardpoint is group I and an untouched fit fires exactly as it did
before; the selector cycles I → II → ALL and refuses nonsense; empty hardpoints never join a
volley or populate a group; a split volley fires fewer barrels, its last barrel is docked
less than the full rack's last, and it spends fewer rounds; switching groups does not re-arm
a hot barrel; a dry live group reports dry while a loaded one still fires; an empty live group
is its own refusal; assignments survive a save, out-of-range hardpoints are dropped on load,
and a schema-10 payload arrives firing everything on one trigger, which is what it did.

**Not verified — and worth saying:**

- **Nothing here has been played.** Whether two groups is the right number, whether the chip
  is findable on a phone, and whether alternating groups is actually a thing a pilot wants to
  do under fire are all session questions. The falloff trade is arithmetically real; that it
  is *fun* is unmeasured, and so is the tempo interaction with the thermal cutout from
  v1.00.60 — a split rack heats slower per volley, which may quietly make the cutout
  irrelevant.
- **The Magazine tab has not been looked at in portrait.** It can list nine rounds per feed
  plus a resupply block, which on two feeds is a long scroll on a phone. The layout suite
  checks the tool column, not overlay bodies.
- **Groups are player-only**, like ammunition and heat before them. An NPC still fires
  everything, forever, with no magazine and no cutout. That asymmetry has now been carried
  through three slices and should stop being carried.
- **Module wear** is deferred for the third time.
