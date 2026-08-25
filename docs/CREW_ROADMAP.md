# Crew roadmap — from a stat block to a ship's company

> **Superseded as a status document.** Everything below is the *reasoning* and stays as
> written. For what is actually open, closed or in progress, read **`docs/OPEN_ITEMS.md`**,
> re-verified against the live tree at v1.01.98. Where this file and that one disagree, that
> one is right — it is grepped, this one is remembered.
> Known stale here: **slice B "ARIA keeps the watch" was proposed for v1.01.80 and was not
> built** — only `crew_watch` and `crew_why` exist (`systems/tools.js:277,295`). The carried
> line about crew ashore being injured by a hull breach is **closed**: `startShoreLeave()` and
> `startTraining()` both clear `onDuty`, and `crewCasualty()` draws from on-duty crew only.

---

Written at v1.01.30, covering the request: more crew statistics, ways to rest and improve
people, relationships and generations, ARIA running the watch bill, and logging and
diagnostics.

Five asks, and they are not five slices — they share one prerequisite, and two of them are
the same problem seen from different ends.

---

## The prerequisite, and why it went first

Every crew number in this game was a **snapshot**. Morale is 0.62. Fatigue is 0.31. Nothing
recorded that morale was 0.91 an hour ago, or that it fell during the third watch because
nobody was fed.

That single absence blocked four of the five asks at once:

- **more statistics** — you cannot show a trend from a scalar
- **rest and improvement** — you cannot tell whether a rest worked without a baseline
- **ARIA scheduling** — scheduling means reasoning about the last watch, and the last watch
  left no trace
- **logging and diagnostics** — that *is* this, by another name

So v1.01.30 built the substrate: a bounded structured log, a rolling per-crew time series,
and — the part that matters — **attribution**. Recording that morale moved is nearly
worthless. Recording that it moved because the galley ran dry is a thing a player can act on
and a thing a scheduler can optimise against.

Everything below assumes it.

---

## Slice A — Rest, recovery and improvement *(shipped, v1.01.40)*

The verbs the request asks for, now that their effect is measurable.

- **Shore leave** as a real action rather than a passive docked bonus: time and money spent
  deliberately, with a recovery curve that shows up in the log as its own cause.
- **Bunk quality and galley quality** as ship state — a hot meal and a quiet berth are
  cheaper than replacing people, and both are currently free and invisible.
- **Training** distinct from experience: experience is what happens *to* somebody, training
  is something you *choose*, costs time off watch, and is the answer to "how do I improve
  this person" that does not involve waiting.
- **A medbay that does something between injured and fit** — recovery is currently a single
  rate with a medic multiplier.

The trap to avoid: making rest a button that removes fatigue. Fatigue exists to force a
rotation; a "rest" verb that solves it in one tap deletes the rotation and the watch bill
along with it. Rest should cost the thing you did not want to spend — time on station,
somebody off the line, or money.

---

> **Shipped in v1.01.40.** Two things carried forward: training teaches only the speciality
> somebody already has, so cross-training — the thing that would make the cross-penalty
> navigable — is still missing; and crew ashore can still be injured by a hull breach,
> because `crewCasualty()` does not skip them.

## Slice B — ARIA keeps the watch *(next)*

The request is for ARIA to *handle* stations and scheduling, and the honest version of that
is narrower than it sounds, in a way worth stating before it is built.

**What ARIA should do:** read the telemetry, notice the pattern a player would have to
scroll to find, propose a watch bill, and — with permission — run it. "Kestrel is going to
break in about forty minutes; I have Ardan rested and cross-trained for that post."

**What ARIA should not do:** silently manage the roster. The moment the assistant makes
personnel decisions without being asked, the crew stop being the player's crew and the
panel becomes a status display for somebody else's ship. Autonomy needs a rung ladder, the
way the planetary site managers already have one: *suggest*, *ask*, *act and report*.

Concretely: a scheduling model over posts and people that respects fatigue, speciality,
cross-training penalties and morale trend; `crew_watch` and `crew_why` extended into
`crew_plan` and `crew_rotate`; and a standing report at the top of the watch.

This is the slice where the telemetry pays for itself, and it should not be attempted before
slice A — a scheduler with nothing to schedule *toward* is a sorting algorithm.

---

## Slice C — Relationships

Crew currently coexist. They do not know each other.

The machinery already exists and is proven: `npc-avatar/core/memory.js` takes a fact with a
subject that can be any character, and `systems/npc-comms.js` derives relationships from
those facts rather than storing a parallel table. Crew relationships are the same shape
applied inward — which means this slice is mostly *reuse*, and should be, rather than a
second relationship system with its own bugs.

- Bonds formed by serving the same watch, surviving the same fight, sharing a speciality.
- Friction from competing for a promotion, being posted under somebody junior, a death
  somebody blames on somebody.
- Effects that are already-existing channels: a bonded pair on the same watch works better;
  a feuding pair on the same watch works worse and files it in the log where the player can
  see why the gunnery numbers dropped.

The check to hold this to: **after two people become friends, what is different?** If the
answer is only "a line in a panel", it is decoration.

---

## Slice D — Generations

The largest and the one most likely to go wrong, so it goes last.

The ask is a crew population that grows across generations. What that needs, in order:

1. **Time that matters.** `served` exists and nothing reads it. Careers need a span — people
   age, peak, and decline — or a second generation is just more hiring.
2. **Pairings and children** from slice C's relationships, on a timescale that fits a
   session rather than a lifetime.
3. **Inheritance that is not a stat roll.** A child of two engineers who grew up aboard
   should start with something their parents had — an affinity, a trait, a familiarity with
   the ship — and not simply better numbers, or the generational layer becomes a breeding
   optimiser.
4. **Berths as the constraint.** Population growth against a fixed hull is a *problem*, and
   that is what makes it interesting: a bigger ship or a station posting becomes a real
   decision rather than an upgrade.

The failure mode to name now: a generational system that only ever adds people is a
population graph, not a story. Death, retirement, people leaving for better berths, and the
hole a lost crewman leaves in the relationships around them are what make the growth mean
anything.

---

## What this does not need

Worth writing down, because both are tempting and both would cost more than they return.

**A second memory system.** Crew relationships reuse the persona memory. Two relationship
models in one codebase is how the "deal ledger" and the "reputation matrix" would have
diverged if the ledger had not been made to read the same facts.

**Per-frame telemetry.** The sampler runs on a cadence and the caps are hard. A crew history
detailed enough to reconstruct every moment is a memory leak with a nice UI, and nobody can
see the difference between six-second and per-frame resolution on a sparkline.

---

## Order, and the reason for it

Substrate, then the verbs that need measuring, then the assistant that needs something to
optimise, then the relationships, then the generations that need relationships to inherit
from. Each one is only testable because the one under it is real — which is the same
argument as `docs/NPC_ROADMAP.md`, and for the same reason.

The recurring check across all of them: **after this, what is different about the ship?**
