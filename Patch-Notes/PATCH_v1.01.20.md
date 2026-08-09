# PATCH v1.01.20 — "Handles"

The rest of the reachability backlog, and — more usefully — an audit of the audit. No schema
change. 27 suites, **2,305 checks**, all green. `BACKLOG` in `test/reachability.mjs` is now
empty.

---

## The correction is worth more than the fixes

Two of the five gaps I wrote down in v1.01.10 were not gaps.

**`setDuty` and `rotateWatch`.** Reported unreachable; both have been reachable the whole
time. The crew panel has had an `ON WATCH` / `STAND DOWN` button since v1.00.30 — it calls
`toggleDuty()`, which wraps `setDuty()` inside the same module. `rotateWatch()` runs on the
crew tick, gated on the auto-rotate setting the panel toggles.

The registry named the inner function. That is a **registry bug reported as a product bug**,
and it is the more dangerous failure of the two: a fabricated gap costs a slice of work
chasing something that already works, and an audit that cries wolf gets ignored exactly the
way a flaky test does.

**`cyclePalette`.** A helper nothing needed. The settings panel sets a palette directly from
a card rather than stepping through them, so the *feature* was always reachable and only the
convenience wrapper was dead. Removed, and the test that covered it now exercises the path a
player actually takes.

Same shape, in config: **`POINTDEF.perRound`** was flagged as an unread tuning knob. It was
never a lever. Each round is judged exactly once on entry to the envelope, and the
alternative — rolling every frame — makes point defence strictly better against slower rounds
and ties the hit rate to frame rate. A constant with only one correct value is documentation
wearing a config key's clothes; it moved into the comment on the code that does the thing.

So `test/reachability.mjs` now separates three things it had been treating as one:

| category | meaning |
|---|---|
| **backlog** | genuinely unreachable, tracked, and now empty |
| **reachable under another name** | the registry was pointing at the wrong symbol |
| **untriggered** | declared behaviour that nothing invokes — the missing caller is not a button |

---

## What was actually missing

### The planetary operating layer

Eight verbs with no caller: `collectFrom`, `deliverTo`, `manufactureAt`, `upgradeCentre`,
`abandonSite`, plus `installFacility`, `toggleFacility` and `removeFacility` — **which the
hand-written registry missed entirely.** That miss is the honest limit of a hand-maintained
list, and it is why the registry grew by three entries alongside the panel.

A site card now expands into the operating panel, ordered by how often a player does the
thing: take the output, feed the fabricators, run a job, change the buildings, then the two
irreversible actions at the bottom where a mis-tap cannot reach them.

Since v1.00.20 you could found a complex (from a browser console, until last slice) and watch
it. You could not take anything out of it.

### `cancelJob`

A queued manufacturing job could be started and never stopped. `cancelJob()` shipped with a
refund curve scaled by remaining hours that nobody could ever collect. Jobs are listed in the
ledger with a CANCEL beside each, because the ledger is where you come to ask what you have
committed to.

### `CREW.moraleWin`

In config since v1.00.30, read by nothing. Crew morale could be ground down by unpaid wages,
short rations and long watches, and had **no path upward at all from the thing they are
aboard for.** Winning lifts the room now — only the watch actually on duty, because somebody
asleep in a bunk did not win anything.

### `SEEKER.reacquire`

This one could not have been read even if something had tried: `guide()` returns early on a
lost seeker, before the branch the flag would have controlled. The early return is what made
the flag unreadable, so both had to change together.

It stays `false` by default, deliberately. A missile that regains its lock turns the hard
turn that beat the seeker into a delay rather than a defence — the flag exists as a knob for
a harder difficulty, not as a fix for a bug.

---

## Two testing notes

**A test can be orphaned by a correct deletion.** Removing `cyclePalette` broke
`test/interface.mjs`, which cycled palettes to prove every one was selectable. The property
was worth keeping and the mechanism was not, so the check now selects each palette the way
the panel does.

**A projectile fired at the origin hits the player.** The first version of the reacquire test
reported *zero seekers* rather than a lost lock: a `'ship'`-faction round spawned on top of
the player connects on the first frame and is gone before the seeker has even armed. It fires
from 50,000 units out now.

---

## Files

**Changed** — `src/ui/ops.js`, `src/systems/planetary.js`, `src/systems/crew.js`,
`src/systems/projectiles.js`, `src/systems/display.js`, `src/core/config.js`,
`src/core/version.js`, `index.html`, `package.json`, `test/reachability.mjs`,
`test/combat.mjs`, `test/interface.mjs`, `README.md`, `CHANGELOG.md`,
`docs/REACHABILITY_AUDIT.md`

---

## Verified vs not

**Verified:** all eight planetary verbs and their blockers have callers in the ops panel,
asserted by name; the backlog is empty and asserted empty; the registry matches what the
modules export, so a rename cannot silently stop checking something; a lost lock stays lost
with `reacquire` off and is regained with it on; and the palette property survives the helper
that used to prove it.

**Not verified:**

- **`CREW.moraleWin` at 0.015 per kill is a guess.** It is a lift the crew could not
  previously get at all, so any value is an improvement on nothing — but whether a long
  patrol now floats morale up faster than unpaid wages drag it down is an interaction nobody
  has measured, and it would be quietly bad if winning fights made payroll irrelevant.
- **The site operating panel has not been used on a phone.** It adds five sections and up to
  a dozen rows underneath a card that was already inside a scrolling tab.
- **`deliverTo` picks from ship stock with no quantity control** — it moves what the row
  offers. Fine for a first pass, wrong the first time somebody wants to split a load.
- **`influenceAttempt` is still untriggered.** It is now recorded as what it is rather than
  mislabelled as an unreachable verb, but a hazard that exists and cannot happen is still a
  loose end: either something hostile should use it, or it should go.
- **Four inert config keys remain**: `POP.interval`, `SUPPLY.interval`,
  `ADVANCED.outOfCombat`, `ORDNANCE.stackScale`. The first two are cadence values for loops
  that run on their own timers — the same "documentation in a config key" shape as
  `POINTDEF.perRound`, and probably the same answer.
