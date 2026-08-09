# PATCH v1.01.60 — "Assay"

Measuring the slice I had just shipped, and fixing what the measurement found. No schema
change. 30 suites, **2,539 checks**, all green.

---

## The number I said would decide it

v1.01.50 shipped with this written in its own "not verified" section:

> *If selling data is strictly better than researching it, the whole system is decorative.*

So I measured it before building anything else. The measurement did not answer that question
— it found something worse first.

## The tree could not be completed

The projects demand **six thermal findings in total**. Solaris contains **three to five hot
bodies**, depending on seed.

Because v1.01.50 *consumed* findings when a project started, a pilot could research two of
the three thermal projects and then be permanently stuck: no hot world left to probe, two
projects visible and forever unstartable, and the exotic tier behind one of them.

Checked across four seeds, thermal supply came out 5, 3, 3, 3 against a demand of 6. **The
tree was uncompletable on every seed tested.**

This is invisible in the table. Each project asks for two thermal findings, which is
obviously reasonable; nothing in the file says how many hot worlds exist. It only appears
when you count one against the other, which is a thing you do with a script and not with
your eyes.

## The fix reframes the design rather than tuning it

The temptation was to lower the requirement to fit the supply. The actual mistake was
upstream: **findings were being consumed, which quietly made them a currency while every
comment in the file called them evidence.**

Evidence is the right model, and it is the one the design comments already claimed. Having
been somewhere hot is a thing that stays true. So:

- `data` is the consumable — telemetry you work through and no longer have
- `needs` is a **qualification** — evidence you hold, not a price you pay

What gates progress is now the *largest single* requirement rather than the sum. Thermal
peaks at 2 against a supply of 3, and the tree closes on every seed. It is also the version a
player can reason about: "I need to have been somewhere hot" is a sentence; "I need six units
of hot" is a spreadsheet.

`test/research.mjs` now asserts the property directly — every worldly finding kind must be
supplied in the quantity some project needs at once — so a later tuning pass cannot
re-introduce a dead end.

## And the original question

Measured: a probe yields **134 kg** of telemetry on average, against the 30–90 kg my own
patch note estimated. Data sells for 8–19 credits a kilogram.

At v1.01.50's costs, a first project was roughly **one probe** and 2,280 credits of forgone
sales. The whole nine-project tree was about 20 probes.

That is not "decorative because selling is better" — it is the opposite failure, and one I
had not thought to look for. Five of the seven effects are not obtainable from any module at
all, so research was the sole source of them *and* nearly free.

Costs are about 2.7× higher now: the full tree is roughly **60 probes and 153,000 credits**
of forgone sales, which is a progression rather than an afternoon.

## Also

The scan report says what a world would teach before you spend a probe on it, and says
*already on file* for one you have surveyed — because probing it twice teaches nothing, and
finding that out afterwards is a waste of a limited probe.

---

## Files

**Changed** — `src/data/research.js`, `src/systems/research.js`, `src/systems/scanner.js`,
`src/core/version.js`, `index.html`, `package.json`, `test/research.mjs`, `README.md`,
`CHANGELOG.md`

---

## Verified vs not

**Verified:** findings survive a completed project; every worldly kind is supplied in the
quantity some project needs at once, on the live system rather than by assertion; exotic
demand stays within what one-shot anomalies could supply; the scan report names the findings
a body would file and matches what a probe actually files; and a body already surveyed
reports *already on file* instead of advertising itself again.

**Not verified — and worth saying:**

- **The new costs are calibrated against forgone sales, not against play.** 153,000 credits
  across the tree is meaningful next to a hull price and I have not checked it against what
  an hour of trading or mining actually earns, which is the comparison that decides whether
  60 probes is a campaign or a grind.
- **I did not re-check the other direction.** Raising costs 2.7× could have pushed the first
  project out of reach for an early pilot who has neither probes nor a market nearby; the
  cheapest project is now about 2.4 probes, and nothing measures how long a new pilot takes
  to get there.
- **Thermal is still the scarcest kind by a wide margin** — 3 bodies against 45 geologic. The
  tree is completable, but a player who happens to probe the wrong three worlds early still
  has a long detour ahead, and nothing tells them thermal is rare before they need it.
- **The lesson is the transferable part.** Two of the last three slices shipped a number I
  had estimated rather than measured, and both estimates were wrong in ways a five-minute
  script exposed. Measuring supply against demand should be a step in any slice that adds a
  requirement, not a follow-up patch.
