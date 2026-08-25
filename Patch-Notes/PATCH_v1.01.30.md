# PATCH v1.01.30 — "Watch"

The substrate under the crew work: a structured log, crew telemetry with attribution, and
the readouts that make both visible. No schema change — none of this is saved, deliberately.
28 suites, **2,381 checks**, all green.

The plan for the rest — rest and improvement, ARIA on the watch bill, relationships,
generations — is in `docs/CREW_ROADMAP.md`.

---

## Why this went first

The request was five things: more crew statistics, ways to rest and improve people,
relationships and generations, ARIA handling stations and scheduling, and logging and
diagnostics.

They share one prerequisite, and it was missing. **Every crew number in this game was a
snapshot.** Morale is 0.62. Fatigue is 0.31. Nothing recorded that morale was 0.91 an hour
ago, or that it fell during the third watch because nobody was fed.

That single absence blocks four of the five asks at once:

- you cannot show a *trend* from a scalar
- you cannot tell whether a rest **worked** without a baseline
- ARIA cannot schedule, because scheduling means reasoning about the last watch and the last
  watch left no trace
- and "logging and diagnostics" *is* this, under another name

So the crew simulation has been detailed since v1.00.30 and completely opaque. A player could
watch morale sitting at 48% with no way to know whether it was climbing back from 30% or
falling from 90%, or what did it. **"My crew keep quitting" was not a diagnosable
complaint.**

---

## Attribution is the whole feature

Recording that morale moved is nearly worthless. Recording that it moved *because the galley
ran dry* is the thing a player can act on and the thing a scheduler will optimise against.

So the payroll pass no longer applies one net drift. Each term is recorded against its own
cause:

```
wages missed          -0.11
short rations         -0.06
posted off speciality -0.04
shore leave           +0.03
```

The net number tells a player their gunner is unhappy. The terms tell them it is the empty
galley and not the pay.

**And the attribution is scaled to what actually landed.** At the morale floor or ceiling the
terms are notional — asking for −0.21 when only −0.03 was available. A diagnosis that sums to
more than the observed change is a diagnosis that lies, so each cause is scaled by the ratio
of what happened to what was requested. `test/crew-log.mjs` drives a crewman to the floor and
asserts the attributed total never exceeds the real fall.

Every other place that moves a number a player cares about now calls through the same
function: breaks, retraining, a death aboard, a kill on the watch, persuasion, hostile
influence, and running out of stamina on station.

---

## Bounded, always

`core/log.js` is a ring buffer with a hard cap, and the crew sampler caps each person's
series and prunes anybody who leaves the roster.

This runs in a browser tab that may be open for hours. An unbounded history of sixteen people
is a **memory leak wearing a feature's clothes**, and both caps are asserted rather than
assumed — the log suite floods 850 entries into a 600-entry buffer and checks that the oldest
fell off, the newest was kept, and the count of dropped entries is reported.

That last part matters more than it looks. A diagnostic that silently discards the thing you
were looking for is worse than no diagnostic, so the panel says *"and 250 older entries have
rolled off"* rather than implying the log is complete.

**None of it is saved.** A diagnostic that survives a reload would have to be migrated
forever for no gain, which is why there is no schema bump in this patch.

---

## Sampling is a cadence, not a recording

Every six seconds, not every frame. Sixteen people over an hour is a few thousand small
records; per frame it is a hundred times that, for a curve nobody can see the difference in.

The trend readout has a **dead band** for the same reason: a number technically rising by
0.0001 must read as *steady*, or the panel flickers between "improving" and "falling" and the
player learns to ignore it.

---

## The readouts

**Watch log tab.** The roster ordered by who needs attention first, not by name or post — a
list sorted alphabetically makes you read all sixteen to find the one that matters. The
ordering weights *falling* above *low*: somebody at 40% and climbing is being handled;
somebody at 60% in freefall is the one about to become a problem. Tapping a row gives the
diagnosis — causes ranked by what they cost — rather than a chronological dump.

Diagnostics live behind the same tab rather than in settings, because when something is
wrong with the crew the log is the next thing you want, and a separate screen is a screen
nobody finds.

**ARIA gains three tools.** `crew_watch` reports the roster by concern, `crew_why` names what
is costing a specific person, and `diagnostics` reports the flight log. A player asking "how
is my crew" wants an *answer*; a panel can only show them numbers.

---

## Files

**New** — `src/core/log.js`, `src/systems/crew-log.js`, `test/crew-log.mjs`,
`docs/CREW_ROADMAP.md`, `PATCH_v1.01.30.md`

**Changed** — `src/systems/crew.js`, `src/systems/tools.js`, `src/ui/crew.js`,
`src/core/config.js`, `src/core/state.js`, `src/core/version.js`, `index.html`,
`package.json`, `test/all.mjs`, `README.md`, `CHANGELOG.md`

---

## Verified vs not

**Verified:** the log caps, drops from the oldest end, and reports what it dropped; levels
gate and `debug` costs nothing when off; every query filter works and they compose; samples
are taken on cadence, capped per person, and pruned when somebody leaves; trends read
rising, falling and steady with a dead band that suppresses noise; retraining, kills, breaks
and deaths each file an attributed delta that matches the change that actually happened; a
crewman driven to the morale floor never has more attributed to them than really fell; the
diagnosis ranks causes worst-first and finds all three of missed wages, short rations and
being posted off speciality; the roster sorts the worst case first and ranks freefall above
merely low; and all three ARIA tools answer, carry data, and handle an empty ship and an
unknown name.

**Not verified — and worth saying:**

- **Nothing has been watched for an hour.** Whether six-second sampling produces a legible
  trend at the timescale morale actually moves is a session question, and the caps (24
  minutes of history each) may turn out to be too short to see a payroll cycle properly.
- **The watch log tab has not been used on a phone.** It renders a card per crew member plus
  an expandable diagnosis of up to a dozen lines, inside a tab that already scrolls.
- **Nothing acts on any of it yet.** This slice makes the crew legible and changes no
  behaviour: no new way to rest people, no scheduling, no relationships. That is the whole
  of slices A–D in `docs/CREW_ROADMAP.md`, and calling the telemetry "crew improvements"
  would be overclaiming — it is the instrument, not the treatment.
- **`influenceAttempt` is still untriggered**, so the hostile-influence cause it now files
  cannot actually happen. Carried from v1.01.20.
