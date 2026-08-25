# PATCH v1.02.10 — "Office Deck"

Four things from playing the executive start, one of which turned out to be two bugs and one
of which turned out to be a slice. Schema stays **17**.

---

## The system chart is reachable from Ops

`OPEN SYSTEM CHART`, at the top of the fleet list. Every objective on that screen is about a
place — a belt to work, a lane to hold, a body to survey — and the only route to seeing where
any of it was involved closing Ops and finding NAV on the flight bar. An executive who never
leaves the office deck should still be able to look at the system.

## One fleet list instead of two

The Staff tab had **Fleet objectives** above and **Contracted hulls** below, so a ship on an
objective appeared twice under the same name and you had to hold both entries in your head to
answer one question: what is this doing and can I change it.

The hull is the thing that exists; an objective is a state it is in. So the list is hull-first
and there is one card per ship. The summary carries the name, the role and what it is doing —
objective, progress, and what that objective has actually produced. Everything the second
section used to show — hull integrity, distance, upkeep, hold, default mode, lifetime tonnage
and earnings — is behind a `DETAILS ▾` disclosure, with the action row. One card open at a
time, because every card expanded is the two-section layout again.

`RECALL` stays on the summary. It is the one action you take without wanting to read anything
first, and burying it would make an idle-command screen slower than the command menu it
exists to replace.

The `TO ME` button is gone. v1.02.00 made player-ward transfers refuse — a hull the treasury
paid for stays on the company books — so it was a button whose only outcome was an error.

## "IN USE" on a ship you do not have, and it was two bugs

The yard listed the economic hull as **IN USE** for a founder who had just been refused an
undock for having no hull. Two separate mistakes stacked:

- `active = key === S.player.classKey` never asked whether you *own* it. "In use" has to mean
  owned and flown.
- `classKey` pointed at the career's charter hull regardless, so a shipless founder was
  sitting in a freighter that does not exist. That is also why the HUD read **Mass 9.5 t ·
  0 / 6000 kg** — cargo capacity, draw and mass were all describing the wrong ship. A shipless
  start now sits in the `civilian` shuttle it is licensed for.

## Spacing the system out — built, measured, and held at 1.0

You were right about the cause and it is worse than it looks. A hull's sensor reaches
4,200–5,200 km. Five planets and four stations sit inside 6,800 km of the star. **The entire
inner system fits in one sensor bubble**, which makes a sensor rating meaningless and a chart
close to pointless — everything is already on it.

`ORBIT_SCALE` is in `core/config.js` and every orbit reads through it — planets, stations,
belts and the spawn point. Setting it to `3.0` is one edit. I ran it there, and it is not a
knob:

- **`entities/npcs.js` carried a bare `FAR = 9000` simulation cull.** At 3× the belts sat
  outside it, so company miners stopped extracting and patrols never met anything. Two suites
  caught it. **This one is fixed and kept** — a cull radius is a fraction of the world and
  never a constant, and it was wrong at any scale.
- **Ambush geometry breaks.** An ambusher is held near its hide; at 3× that hide can sit
  further from where the ship loiters than the trigger radius is wide, so a trap that should
  spring never does. Geometry to re-tune, not a number to multiply.
- **Every NPC mining and hauling cycle gets three times longer**, which moves the extraction
  throughput figures from v1.01.93 — the ones that were never re-measured after v1.01.94
  fixed the double-registration they were taken against.

So the constant ships at **1.0** with the findings written beside it. Change it to `3.0` to
see the wider system immediately: innermost planet at 8,400 km, roughly two sensor radii, and
a full crossing costing about 80 s at warp against 27 s now. Expect the two behaviours above
to be visibly wrong until they are tuned. That is a balance slice, and it deserves the
measurement pass the last three patches earned.

## The test harness could not see the DOM, and two checks in the last patch were fake

Writing coverage for the merged fleet list exposed this. `test/stub.mjs` implemented
`querySelectorAll` as a **lookup table of the exact selector strings the game happened to
use**, returning hand-built arrays. Anything not on the list returned `[]`.

`[]` is indistinguishable from "found nothing". A test that loops over the result and clicks
each element passes by doing nothing at all — and two of the nav-map pane checks added in
v1.02.00 were green exactly that way. They asserted nothing.

The harness has a real selector engine now: `#id`, `.class`, `tag`, `[data-x]`, `[data-x=y]`
and descendant chains, walked over the actual node tree. Not CSS, but every selector in
`src/`. `innerHTML` also sets `textContent` with the tags stripped, which is what makes a
button findable by its label when the UI set that label through `innerHTML` — most of them.

With that working, `test/ui.mjs` covers the Ops panel for the first time. Nothing rendered
`ops.js` in any suite before today, which is how a fleet list could be restructured with
`node --check` as the only thing behind it. Five new checks: the panel opens with no company,
a founder with a fleet renders, the disclosure opens and closes, the chart button reaches the
nav map, and every tab renders.

One trap found while writing them and worth stating: creating a founder wipes `ownedHulls`,
which is the point of the shipless start, and every docking check further down `ui.mjs`
undocks a ship. The block restores the pilot on the way out. A test that leaves the world in a
state the next block cannot use fails somebody else's assertion, which is the worst kind to
debug.

## Files touched

| file | change |
|---|---|
| `src/ui/ops.js` | one fleet list with a per-hull disclosure; chart button; `TO ME` removed |
| `src/ui/dock.js` | "in use" requires ownership |
| `src/systems/character.js` | a shipless start sits in the shuttle, not its charter hull |
| `src/entities/npcs.js` | the NPC simulation cull scales with the world |
| `src/core/config.js` | `ORBIT_SCALE`, held at 1.0, with what happens at 3.0 |
| `src/world/system.js`, `src/world/asteroids.js` | orbits and belts read through the scale |
| `test/stub.mjs` | a real selector engine; `innerHTML` sets `textContent` |
| `test/ui.mjs` | Ops panel coverage; nav-map pane checks that now actually run |
| `test/character.mjs` | a shipless career launches in the shuttle, and owns what it flies |

## Verified

- `node test/all.mjs` — **42/42 suites green, 3,324 checks** (93 s).
- `ORBIT_SCALE` at 3.0 was run against the full suite before being backed out; the three
  consequences above are what it reported, not what I expected it to report.

## Not verified

- **Still nothing opened on a phone.** Ninth slice. The disclosure is a new tap target on a
  tab that was already on the never-opened list.
- **The merged fleet list has never been seen with more than one hull.** Coverage builds a
  fleet of one. Whether ten cards with one expanded actually scans better than two sections
  is the question the change is betting on, and it is not answered here.
- **`ORBIT_SCALE` at 3.0 is untuned, not unsafe.** It runs; two behaviours are wrong.
