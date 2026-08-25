# The Executive arc — v1.02.31 → v1.02.40

Ten patches on one career. This file is the plan; `docs/OPEN_ITEMS.md` stays the status
document, and where the two disagree that one is right.

## Why the career needed an arc rather than a slice

Executive shipped at v0.6.0 as a sixth entry in `CAREERS` — a hull, a licence, two starting
skills — and then grew a company (v1.00.31), a board, a treasury, a command tree, contracted
hulls, fleet objectives and a self-training loop across another dozen patches. All of that is
real and all of it works. None of it changed the fact that the career was still being played
through a cockpit.

That is the shape of the problem. The executive layer is not missing systems; it is missing a
**surface**. Every feature it has was reached by adding a tab to a panel that opens over a
canopy, and the canopy belongs to a ship the career explicitly does not have. The arc is
mostly about taking the flight game away and building the command game in the space it
leaves, not about adding more company mechanics on top of the ones already there.

Three principles the whole arc is written against:

1. **The fleet is the instrument.** A pilot's instrument is a hull; they point it at things.
   An executive's is a roster; they assign it to things. Any control that only makes sense
   with a hull under you is not a control this career gets a disabled version of — it is a
   control that does not appear.
2. **Every screen answers a question the career actually asks.** "Where is everything" and
   "what is everything" and "what is my money doing" and "what are my ships doing". If a
   panel does not answer one of those, it belongs to a different career.
3. **Detached means detached.** Not "the HUD is hidden". If the world is not being looked at,
   it is not being drawn, and the frame budget goes to the screen that is.

## The slices

| version | name | what it is | status |
|---|---|---|---|
| **1.02.31** | **Office Deck** | the flight lock as a capability; the command deck; the render gate; the chart's return path; live telemetry | **shipped** |
| **1.02.32** | **Shipping Lanes** | the fleet actually flies: decel ramp on arrival, undock on travel, route variety, passive means until recalled, no ship's crew for a founder | **shipped** |
| **1.02.33** | **Cartographer** | fully procedural system generation — seed decides star class, planet count, berths, fields and every name. Schema 17 → 18 | **shipped** |
| **1.02.34** | **Right of Way** | company hulls route around gravity wells; a well collapses their bubble; the star stops eating its own system. 11× fleet throughput | **shipped** |
| **1.02.35** | **Work Orders** | six new jobs so every sellable hull has work; the company construction order book; the coverage matrix as a rule. Schema 18 → 19 | **shipped** |
| **1.02.36** | **Papers** | individuals not categories — nine powers, derived corp wars, zero standing, the career ladder. Schema 19 → 20 | **shipped** |
| 1.02.37 | Desks | wire it in: per-power contract issuers, skill- and standing-gated boards, the dossier screen in-game | planned |
| 1.02.38 | Boardroom | the Ops relayout — contract / commission / build / corp / fleet as first-class tabs on a command surface rather than tabs on a flight overlay | planned |
| 1.02.39 | Target Record | the detailed statistics panel for a selected target, reached from the chart and from the fleet board; the deck under `test/layout.mjs`; undock closed properly | planned |
| 1.02.40 | The Yard | commissioning and refit as a build queue with lead times, not an instant purchase | planned |

Order is dependency order, as usual. .33 moves the schema and so wants to land before anything
that persists new company state on top of it. .34–.35 are the rest of the surface work.
.36–.37 are the loop the surface exists to drive, .38–.39 are the world reacting to a company
that is now legible, and .40 closes the arc.

## Patterns carried out of .31

- **A capability, not a career test.** `canPilot()` is asked in six places. Had the lock been
  written as `career === 'executive'` at each of them, the seventh call site added next month
  would have been the one that forgot. The next non-flying path costs one line in
  `systems/career.js`.
- **A "back" is part of a screen's contract.** The nav map was a leaf for eleven patches, and
  every caller worked around it by closing itself first. That is a dead end for a career with
  a cockpit and a dead *screen* for one without. Any overlay this arc adds takes a `returnTo`.
- **Presentation is skippable; simulation is not.** The render gate is safe precisely because
  it sits below every simulation phase in the frame. Anything later in the arc that wants to
  skip work should be held to the same test: does the world still step?
- **Gate on resolution, not on distance.** The telemetry panel is shorter when the dish cannot
  resolve something, and says why. A column of em dashes reads as a broken instrument.

## Carried out of .36

- **None of it is wired into play.** The dossier is built, persisted and tested; no contract
  board, station desk or UI reads it. This patch is a foundation, not a feature.
- **`issuerOf(station)` still returns a bloc**, so the board cannot post per-power work.
  That single wiring job is what turns this from modelled into playable.
- **`charter` and `hires` are declared on every power and read by nobody** — inert.
- **Powers hold opinions but do not act** — no faction fleets, no territory, no war that
  advances.
- **The UI is a standalone prototype**, hand-fed with five sample people.

## Carried out of .35

- **The fleet interface is unchanged and is now the bottleneck.** Twelve order types and a
  construction order book are being displayed by a UI built for six, through a dialogue tree
  seven branches deep on a phone. Reachable, not pleasant. This is .36.
- **No balance pass on any of the six new jobs.** Every rate was chosen to make the
  behaviour legible in a log, not to sit correctly against extraction and logistics income.
  Arbitrage can probably be farmed.
- **Hunt resolves combat by direct HP subtraction**, not through the projectile system.
- **Contract construction has no quoted fee or deadline** — it is labour, not a contract.

## Carried out of .34

- **Only logistics was measured end to end.** Patrol, escort, survey and station-keep get
  routing for free through the same `travel()`, but were not instrumented.
- **`STAR_WELL_MARGIN` (1.35) has not been swept across seeds.**
- **A `GENESIS_VERSION` mismatch is recorded but nothing acts on it.** Warning the player
  that their save was built by an older generator is a one-line job, undone.

## Carried out of .33

- **Nobody has flown a generated system.** It builds and is internally consistent; whether
  an 18-world red-dwarf system is *pleasant* to cross is not a question a suite can ask.
- **Moons, rings and Lagrange points are still rolled by the world builder**, not carried in
  the plan — so the plan is not yet the complete description of a system, and
  `GENESIS_VERSION` does not cover them.
- **Rock count per system roughly doubled** (660 → up to ~1,240). Not profiled on a phone.

## Carried out of .32

- **The route recency penalty (26 credits-equivalent) has not been swept across seeds.** It
  gives 6 berths over 900 s on one seed. A market whose spread is narrower than the penalty
  routes effectively at random, which is a different failure from the one it fixed.
- **Every order type got the undock fix, only logistics is exercised end to end.**

## Known open at the end of .31

- The render saving is reasoned, not profiled — no phone has been on a meter.
- `test/layout.mjs` knows nothing about `css/exec.css`; the deck has no geometry assertions.
- Undock is still reachable for an executive through the station interface. It is inert, but
  it should say so rather than be pressable.
- `data/command-menu.js` still assumes a five-branch company. The relayout in .34 is the
  natural moment to check whether that shape survived contact with the fleet board.
