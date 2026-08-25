# PATCH v1.01.92 — "Corpo Balance & Executive Career"

Four reports, and each one is the same shape: the game knew something and never said it out
loud. Schema stays **17**.

---

## The miner that would not mine

Commission an industrial hull, give it a passive extract objective, and the Operations
screen reads `Target belt` — the literal word from the menu leaf — while the contracted
hull below it is 9.8 Mm away. Warp out, scan it, and its manifest holds 2,344 kg of raw ore
that the roster on the same screen never showed and the objective never counted.

That is one symptom over four separate faults.

**Nothing ever chose a belt.** `order.target` was the string `'belt'`. Not a field, not a
waypoint — a placeholder that no code ever replaced. There was nothing to fly to, nothing
to broadcast, and nothing for the Executive screen to display.

`assignExtraction()` now picks the nearest field that actually has unmined rock near its
mid-orbit, records the field key and a real waypoint on the objective, and **broadcasts on
the company channel** — `working Cinder Belt, 3.9 Mm out. Loads to Trade Platform.` The
Ops objective card shows the seam by name.

**The hull never went there, and the reason is the interesting one.** A transit leg was
needed because `minerStep()` only searches 5,000 units around itself and a station is much
further from a belt than that. But the gate I first wrote also required `!u.rock` — and a
freshly spawned miner already carries a rock reference from wherever it was set down. So a
hull commissioned at a station reported itself as *cutting* while sitting 3,933 units from
the belt it had just been assigned, and never moved a metre. A rock reference is not
evidence of being at the right seam; the objective decides that. Entering transit now drops
the stale claim.

**The Executive screen never showed cargo.** The roster gave structure, distance and upkeep
and stopped. `fleetRoster()` now carries `hold`, `holdCap`, `holdPct`, the manifest, whether
the hull is running a load in and which berth to. A ship with 2,344 kg aboard no longer
reads as idle.

**Nothing brought a hull home on a schedule.** Ore became money only at a berth, and the run
in was triggered solely by the hold crossing `HOLD.minerRunAt`. `extractionDue()` gives the
rule as asked for:

| hold | clock | result |
|---|---|---|
| room left | time left | keep cutting |
| **full** | time left | **come home now** — a hull that cannot carry more should not sit on the rock waiting for a timer |
| part load | time up | come home and get paid |
| empty | time up | do not bother |

The hold wins over the clock. That was the explicit request and it is also the right rule:
the alternative is a ship idling on a full can.

---

## A ship being shot at

A contracted hull could be destroyed on the far side of the system and the first the owner
knew of it was the contract closing itself with *lost contact*. A ship you are paying
upkeep on being attacked is information you are entitled to before it becomes a wreck.

Watched in `systems/fleet.js` rather than in `combat.js`, because damage arrives from
several places — projectiles, collisions, the star — and what matters is not who fired but
that a hull on the roster is losing structure it had a moment ago.

It raises three things at once: a **distress transmission** in the hull's own voice, a
toast, and a **`#fleet-alert` banner** — amber, on its own line under the threat banner,
blinking slower than the lock warning, escalating to orange and *"LOSING HER"* below 35%
structure. The colour and rate are deliberate: `setThreat()` answers *am I in danger* and
this answers *is something of mine being destroyed somewhere else*. They are different
questions with different correct responses, and a pilot who reads the second as the first
will break off a fight for no reason. The alarm clears itself six seconds after the damage
stops, and repairing a hull does not trigger it.

---

## Locking on from across the system

`lockRange()` is a fraction of *detection* range, and detection is `sensor × signature` with
nothing bounding the signature above. A laden industrial hull burning hard, firing and
warping stacks mass × throttle × firing × warp to a signature near 10. A Nexis Command with
a 3,000-unit sensor then detects at ~31,800 units and locks at **~17,500 — seventeen
megametres**, most of the way across charted space. The lock alarm was firing for ships the
pilot could not see and that could not possibly have shot at them.

`LOCK.rangeCeiling` caps it, and the number is `hitCeiling` deliberately: nothing should
hold a firing solution further out than the furthest anything can actually shoot. Ordinary
engagements are untouched — the cap only bites on the runaway product, and a quiet hull is
still meaningfully harder to lock than a loud one.

---

## Files touched

| File | Change |
|---|---|
| `src/systems/fleet-work.js` | `pickBelt`, `assignExtraction`, `extractionDue`, `extractStep`; extract joins the work table |
| `src/systems/fleet.js` | cargo and under-fire state on the roster; `fleetUnderFire()` and the damage watcher |
| `src/core/config.js` | `LOCK.rangeCeiling` |
| `src/entities/npcs.js` | `lockRange()` capped |
| `src/ui/hud.js` | `setFleetAlert()` |
| `src/ui/ops.js` | hold, running-in berth and under-fire on each hull; placeholder target suppressed |
| `src/main.js` | alarm polled once per frame |
| `index.html`, `css/hud.css` | the `#fleet-alert` banner |
| `test/corpo.mjs` | **new** — 42 checks |
| `test/all.mjs`, `package.json`, `README.md`, `CHANGELOG.md`, `src/core/version.js` | 1.01.92 |

## Verified

- `node test/all.mjs` — **40/40 suites, 3,181 checks, 0 failed.**
- `test/corpo.mjs` asserts the unbounded arithmetic really would reach past 15,000 units
  before checking that the capped one does not, so the test would fail if the underlying
  problem ever went away and someone deleted the cap as dead code.
- The transit regression is pinned directly: a hull is placed away from its assigned seam
  and the suite requires the distance to *fall*.

## Not verified

Nothing rendered in a browser. The `#fleet-alert` banner is in the markup and passes the id
and selector audit, but no suite draws it — its position relative to `#threat-alert` when
both are showing is untested on a real screen.

`WORK.transitBoost` (2.2) and `WORK.payCycle` (300 s) are first numbers. The pay cycle in
particular decides how often you see a ship come home, which is a pacing judgement rather
than a physical one.

The broadcast goes out on the `trade` channel because there is no dedicated company band
yet. With several hulls working it will make that channel busy.
