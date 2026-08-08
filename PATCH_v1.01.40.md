# PATCH v1.01.40 — "Shore"

Slice A of `docs/CREW_ROADMAP.md`: the ways to rest and improve people, now that v1.01.30
made their effect measurable. Save schema 13 → 14 (migration included). 29 suites,
**2,460 checks**, all green.

---

## The trap this slice was built to avoid

The obvious version of "let the player rest the crew" is a button that removes fatigue.

That deletes the watch rotation — fatigue exists to force one — and turns the whole crew
simulation into a cooldown you tap between fights. The roadmap named it before any of this
was written, and it is the constraint every number here answers to:

**No recovery is both fast and free.** Each of the three costs something different, and none
of them is money alone.

| route | what it actually costs |
|---|---|
| **shore leave** | *time docked*. The crew are off the ship entirely — no output, no watch, no experience — and undocking cuts it short |
| **fittings** | *money up front and upkeep forever*. The standing answer: cheaper than replacing people, and they never stop billing |
| **training** | *a body off the watch bill*. On a four-berth hull that is a quarter of the ship |

---

## Shore leave, and the clock you cannot dodge

Crew ashore come off the roster completely. They do not stand a watch, wear down, recover on
the ship's clock, learn from what the ship is doing, or eat the ship's provisions. A ship in a
fight with its crew in a bar is a ship flying on automation, and that is the price.

**Undocking is what cuts it short.** The timer does not quietly pause when you leave — the
crew are recalled, they keep a fraction of the benefit, and the log records *"shore leave cut
short"* as its own cause.

That last part is the telemetry slice paying for itself. A player who grants leave, undocks
after twenty minutes, and wonders why their crew are still miserable can open the watch log
and find the answer, instead of concluding the feature is broken.

Keeping a fraction rather than nothing is deliberate: a pilot who *has* to run should not be
punished into never trying it again. It is a poor deal, not a void one.

## Fittings

Quarters, galley and infirmary, three levels each, priced on a curve so level 3 is a
commitment rather than a formality.

They are read once per tick in `comfortEffects()` rather than looked up per crewman, so a
fitting cannot mean one thing in the fatigue branch and something slightly different in the
healing branch.

**The galley is the one worth explaining.** It does not conjure provisions — it makes running
low hurt less, which is the honest thing a cook can do about an empty hold. The suite asserts
both halves: a galley softens the ration penalty, *and* does not remove it.

Upkeep bills on the same clock as wages. Hiding it somewhere else would let a player buy a
level-3 galley and never work out what was draining the account.

## Training

The distinction the roadmap asked for: **experience is what happens to somebody; training is
something you choose.** It costs money and, more importantly, a station — they are off the
watch bill for the duration.

Pulling somebody out halfway refunds nothing and awards nothing. That is what makes starting
one a decision rather than a formality.

---

## A testing note worth keeping

The first run of the quarters check compared recovery over sixty seconds and read
**1.000 vs 1.000** — both cases had bottomed out at zero fatigue long before the window
closed, so the test was measuring the floor rather than the rate. Four seconds separates
them cleanly.

Generalisable: when comparing two rates, the window has to be shorter than the time either
takes to saturate, or the assertion quietly becomes "both of these eventually finish".

---

## Files

**New** — `src/systems/welfare.js`, `test/welfare.mjs`, `PATCH_v1.01.40.md`

**Changed** — `src/systems/crew.js`, `src/systems/economy.js`, `src/systems/save.js`,
`src/ui/crew.js`, `src/core/config.js`, `src/core/state.js`, `src/core/version.js`,
`index.html`, `package.json`, `test/all.mjs`, `test/reachability.mjs`, `test/industry.mjs`,
`test/preflight.mjs`, `test/avatar.mjs`, `test/celestial.mjs`, `test/ordnance.mjs`,
`test/npc-comms.mjs`, `test/deals.mjs`, `README.md`, `CHANGELOG.md`

All five new verbs are registered in `test/reachability.mjs` and wired to the Welfare tab —
a slice that adds a player-facing verb does not close until something calls it.

---

## Verified vs not

**Verified:** fittings cost money, raise a level, bill upkeep, cap at three, and refuse
politely when unaffordable, undocked or maxed; quarters measurably speed off-watch recovery
and an infirmary measurably speeds healing, both through the real tick rather than through a
returned multiplier; a galley softens the ration penalty without removing it; leave costs per
head, takes the whole roster off the ship's clock, returns them rested and attributed, and
refuses a second grant while anyone is away; undocking recalls early, delivers materially
less than a full leave, and files *cut short* as its own cause; training costs money, takes
somebody off the tick, awards experience on completion, and refunds nothing if cancelled;
upkeep is actually charged and never drives the account negative; and the schema-14 payload
round-trips with out-of-range levels clamped.

**Not verified — and worth saying:**

- **The economics are guesses.** 9,000 credits for a first fitting, 420 a head for leave,
  3,200 for a course: all chosen to feel like real money against the current wage bill and
  none of them weighed against what an hour of play actually earns. The one I would most
  expect to be wrong is upkeep — 140 per level per payroll may be either invisible or
  crippling, and nothing measures which.
- **Eight game-hours of leave is about 2.7 real minutes.** That is short enough that the
  "cost is the clock" framing may not land at all, and long enough to be annoying if it does.
  It wants a session, not a test.
- **Nothing schedules any of this.** Deciding *who* should go ashore and *when* is still
  entirely manual — that is slice B, and the verbs here exist partly so that ARIA has
  something to actually propose.
- **Training is level-agnostic in what it teaches.** It awards experience toward the
  speciality somebody already has. Cross-training a crewman into a second post — the thing
  that would make the cross-penalty navigable — is not in this slice.
- **Crew ashore are still aboard for casualties.** `crewCasualty()` does not skip them, so a
  hull breach while the crew are drinking at the station can injure somebody who is not on
  the ship. Small, real, and not fixed here.
