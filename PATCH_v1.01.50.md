# PATCH v1.01.50 — "Findings"

Research: turning what you looked at into what you know. Save schema 14 → 15 (migration
included). 30 suites, **2,531 checks**, all green.

---

## What was actually wrong

Two gaps that turned out to be the same gap seen from opposite ends.

**Survey data had exactly one sink.** Probes, surface features and anomaly telemetry have
been producing it since v1.00.40, and the only thing a pilot could ever do with it was sell
it. Every scan anyone has ever run resolved to a commodity price. The features table, the
twenty-type planet catalogue, the atmospheric interference model, the six anomaly types —
all of it fed a cargo hold and stopped.

**Blueprints had no gate at all.** A fresh pilot with the materials could queue a tier-5
antimatter torpedo in their first hour. There was no knowledge progression in the game: what
you could build was decided entirely by what you could afford.

Research is what joins them. Knowledge you gathered becomes knowledge you have.

---

## Findings are typed, and that is the whole design

The cheap version of a research tree is a currency: bank points, spend points, get +5%. That
is a checklist with a progress bar, and — worse — it makes **where you went irrelevant**. All
telemetry is interchangeable, so you probe whatever is nearest and never leave the inner
system.

So a project consumes *findings*, and a finding has a kind that depends on what you were
looking at:

| kind | where it comes from |
|---|---|
| thermal | hot worlds, lava fields, tidal volcanism |
| cryogenic | ice, methane, subsurface oceans |
| biotic | living chemistry, wherever it was found |
| geologic | rock, ore bodies, impact structures |
| atmospheric | weather, pressure, gas envelopes |
| exotic | **anomaly telemetry only** |

You cannot research cryogenics without having been somewhere cold. You cannot touch the
exotic tier without going out to a Lagrange point and working an anomaly — which is what
finally makes those a destination rather than a curiosity on the chart.

The suite asserts the converse directly, because it is the property that would quietly
disappear in a balance pass: **unlimited raw data does not unlock a project you lack evidence
for.**

### Derived from the body, not from a table

`kindsOf()` reads a world's own traits and its discovered features. There is no map of planet
names to research categories to maintain — which matters because the planet table has grown
twice, and a whitelist would have quietly stopped covering it. That is exactly the failure
that left `planetInfo()` speaking a dead vocabulary until v1.00.40.

A world can be several things at once: a cryovolcanic moon is cold *and* geologically active,
and flattening it to one category would make the outer system a single note.

**Once per body.** Probing the same moon eight times has not taught you eight times as much
about cold. Without that rule the whole system collapses into farming the nearest convenient
world.

---

## What a project gives

**Permanent effects**, registered through the same path a module bonus takes:

```js
registerResearchBonuses(researchBonuses);
```

A fourth source of bonuses alongside the fit, the crew and the pilot, in the same shape — so
nothing downstream has to know whether a number came from a module or a finished project. It
registers lazily for the same reason `character.js` does: research calls `recalcStats()` on
completion, and a static import would be a cycle.

**Blueprint unlocks**, and here the restraint matters. Only the seven tier-5 entries are
gated. Gating the whole catalogue retroactively would take things away from a pilot who
already had them, and **a slice that makes an existing save worse is a slice that should have
been designed differently.** The top tier was always meant to be a project rather than a
purchase — it is the same argument as the tier-2 ceiling on station ammunition stock in
v1.00.60.

The gate bites at the fabricator, not only in a query: `queueJob()` refuses a locked
blueprint and names the project that would open it.

---

## One project at a time

A queue would make research a background process a player sets and forgets. One at a time
makes it a choice about what to know next, which is the only interesting question the system
has.

Abandoning a project does not refund the telemetry. That is what makes starting one a
decision.

---

## Files

**New** — `src/data/research.js`, `src/systems/research.js`, `test/research.mjs`,
`PATCH_v1.01.50.md`

**Changed** — `src/core/state.js`, `src/core/config.js`, `src/core/version.js`,
`src/main.js`, `src/systems/survey.js`, `src/systems/lagrange.js`,
`src/systems/crafting.js`, `src/systems/save.js`, `src/ui/ops.js`, `index.html`,
`package.json`, `test/all.mjs`, `test/reachability.mjs`, and seven suites for the schema
bump.

Both new verbs are registered in `test/reachability.mjs` and wired to the Research tab.

---

## Verified vs not

**Verified:** every project has a cost, an effect and a real prerequisite chain with no
cycles; only tier-5 blueprints are gated and every gated id exists; a gas giant teaches
atmosphere and not geology, a cold body teaches cryogenics, nothing teaches both hot and
cold, every body yields at least one kind, and no ordinary world yields exotic; a probe files
findings once per body and never again for that body; a project blocked for want of evidence
stays blocked with unlimited data; starting consumes both the telemetry and the findings;
completion changes the ship's stats and releases blueprints the fabricator then accepts;
abandoning refunds nothing; and the schema-15 payload round-trips with negative findings,
unknown kinds, unknown projects and a project both completed and in the lab all rejected.

**Not verified — and worth saying:**

- **An old save loses seven blueprints.** This is the one place the slice takes something
  away: a v14 save arrives with nothing researched, so the tier-5 entries it could
  previously have queued are locked until the projects are done. I judged that acceptable
  because those seven are the antimatter-and-exotics end that almost nobody will have built,
  and the loss is recoverable by playing — but it *is* a loss, and gating the whole catalogue
  would have been indefensible for the same reason.
- **The economics are unmeasured.** 120 kg of data for a first project against a probe
  yielding perhaps 30–90 kg means three or four probes for the cheapest unlock, and nothing
  has weighed that against the credits the same telemetry would have fetched. If selling data
  is strictly better than researching it, the whole system is decorative.
- **Nine projects is a thin tree.** It is enough to prove the shape and not enough to be a
  progression: the tier-3 tail is three projects wide and then stops.
- **Nothing tells a player what a world would teach before they spend a probe on it.** The
  scan report says what is there; it does not say which findings it would file. That is the
  obvious next thing and it is small.
- **Findings are not spendable across projects in any partial sense** — a project takes its
  full requirement or none, so there is no reason to gather beyond what the next project
  needs. A pilot with eleven geologic findings and no use for them is holding dead inventory.
