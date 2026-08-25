# PATCH v1.02.36 — "Papers"

Everybody is somebody in particular now. Schema **19 → 20**.

Per the brief: *"if built just for 6 is a constraint that's limiting exposure and depth, open
it up to be unique per npc and player. They start out with 0 standing, besides the bonuses
from character creation."*

Both halves were true, and the second one was worse than it sounded.

---

## Six was the bottleneck, in three places at once

Every gate in the game asked **"which of the six are you?"** — six fleet roles, six careers,
three reputation blocs. That is a useful question for exactly as long as six is enough, and
as of the twelve order types in v1.02.35 it stopped being enough. A category with twelve
things behind it is not a category; it is a bottleneck with a name.

A **dossier** replaces it: one record per individual, player or NPC. Nothing in it is an
enum.

- **proficiency** — continuous 0..1 per skill, not a rank, so a requirement can ask for 42%
  and get a meaningful answer.
- **standing** — per *power*, not per bloc. Nine numbers.
- **quals** — discrete earned qualifications, which is what contracts gate on.
- **rung** — position on a career ladder, and exactly what the next one needs.
- **traits** — two or three seeded quirks.

`role` stopped being the answer to "who is this" and became one field on a record that has
several. Two mercenaries of the same role are now different hires in the ways that decide
what work they can take.

**NPCs cost nothing until they matter.** `npcDossier(name)` derives a complete person from
the world seed and their name — deterministic on every device and every load — and is only
*stored* once something changes them. Seventy NPCs do not become seventy save records at
boot.

## Zero, and only zero

Standing started at **+10 Coalition / −20 Outer for everybody**. A stance nobody had taken,
applied to a character before they had done anything, leaving every pilot disliked by a
third of the galaxy for reasons they could never point at.

It starts at zero with all nine powers. The only thing that moves it at creation is the
lineage and corporation actually chosen, and those are bonuses to **named organisations**
now (`LINEAGE_POWERS` / `CORP_POWERS`). A Belter out of Freewake starts +42 with the
Collective and at exactly **0** with Halloway, Kestrel and Kessler, because nothing in their
history says otherwise yet.

The head start is written directly rather than through `adjustStanding()`, deliberately: a
birth is not something you *did*, so it must not bleed into rivals and must not appear in
the history log as an action. The suite asserts both.

## Nine powers, ten events, and wars that are queries

`src/data/factions.js`. The rule that decided what got in:

> **A faction is a thing you can be in trouble with.** If a power cannot refuse you a
> contract, price you differently, or send somebody after you, it is a description string.

Nine qualify — Meridian, Aurelian, Halloway, Severance (Coalition); Freewake, Kestrel,
Drossgate (Independent); Kessler, Vosk (Outer). Each has a charter, a seat, a doctrine, and
a **temper** that scales how fast it warms, how hard it punishes, and how long it holds on.
Severance is `gain 0.6 / loss 1.6 / memory 1.0`. Vosk forgets you in a fortnight.

Ten dated events from CR 0 to CR 158. The Tariff War is the load-bearing one: the Coalition
set a levy on unchartered hulls, and the independent crews did not protest and did not
fight — they simply stopped carrying, all of them, for nine weeks, until three inner
stations went to rationing and the levy was withdrawn. Freewake existed as a fact from that
day.

**Relationships are derived, not declared.** `relationOf(a, b)` computes an opinion from
base regard plus every historical shift naming the pair plus a bloc pull. There is no second
table of who hates whom. Add an event to `HISTORY` and the politics change with nothing else
edited — the fiction and the mechanics *cannot* drift, because there is only one of them.
`activeWars()` is a query, not a maintained list.

Same rule the NPC layer adopted at v1.00.90: derive relationships, do not store them.

**And that is what makes the corp war mechanical.** `adjustStanding()` bleeds a fraction of
every change into every other power in proportion to `relationOf()`. Running Directorate
escorts costs you with Kessler at a rate the *timeline* sets, and warms Meridian slightly
because the Charter made them partners in CR 0.

## The ladder, and the bug the suite found in it

Five rungs per career, combining skill proficiency, standing with named powers, and earned
qualifications. `nextRung()` returns exactly what is missing and by how much, because **a
gate that will not say what it wants is what makes progression feel arbitrary.**

The enforcer track shows why standing had to be per-power:

| rung | needs |
|---|---|
| Unlicensed | — |
| Marked Gun | gunnery 35% |
| Warranted | gunnery 55% · **Aurelian 25** |
| Commissioned | gunnery 72% · sensors 45% · **Aurelian 40** · clean record |
| Proscriptor | gunnery 88% · engineering 55% · **Aurelian 65** |

Under three blocs that middle column read "Coalition 40", which a pirate hunter and a
Severance fixer could both satisfy while working directly against each other.

**The first cut of this ladder was broken and `test/dossier.mjs` caught it.** Thresholds
started at 20%; career and lineage together hand out 10–60% of a primary skill. So a
Core-born broker began at **rung 2 of 5** — handed 40% of their own career progression at
creation, before doing anything. That is the same fault as the +10 Coalition standing
wearing different clothes, in the patch written to remove it. Thresholds are 35/55/72/88 now
and the suite asserts across *every* career × lineage combination that no birth starts above
rung 1. A specialist may start at rung 1 in their own speciality — a rim-born pathfinder
genuinely is already a scout.

---

## Files touched

**New**

- `src/data/factions.js` — nine powers, ten events, derived relations
- `src/systems/dossier.js` — individual records, qualification, the ladder
- `test/dossier.mjs` — 139 checks
- `docs/LORE.md` — the political layer, written out
- `docs/dossier-prototype.html` — the interactive UI design, driven by the real tables

**Changed**

- `src/data/origins.js` — `LINEAGE_POWERS`, `CORP_POWERS`, `startingStanding()`
- `src/core/config.js` — `REP.start` zeroed across the board
- `src/systems/character.js` — seeds the player dossier from the chosen birth
- `src/core/state.js` — `S.dossiers`
- `src/systems/save.js` — dossiers persisted; v19 → v20
- `src/core/version.js` — 1.02.36 "Papers", **schema 20**
- `test/all.mjs`

## Verified

`node test/all.mjs` — **48/48 suites green**, 98.9 s.

`dossier` 139/139:

- Every power fully declared with a temper, a colour and a hire list; every timeline entry
  dated, titled and naming only real powers; the current year is the last entry.
- **The documented wars are actual wars** — Kessler/Aurelian resolves hostile from the
  timeline, Meridian/Aurelian resolves as partners, relations bounded, unknown powers
  neutral rather than an exception.
- **Zero means zero** — every power the creation bonus does not name is at exactly 0; the
  ones it names carry exactly the declared value; the head start did not bleed into rivals
  and is not in the history log.
- **Individuals differ** — two NPCs of the same role differ, regenerate byte-identically,
  are not stored until touched, and a hostile stands well with Kessler and badly with the
  Directorate.
- **The gate explains itself** — an unreachable requirement lists *everything* missing, not
  just the first, with need-and-have on each.
- **The corp war moves** — working for one power measurably warms its partner, cools its
  enemy, and leaves an indifferent third party alone.
- **The ladder** — requirements rise (measured as the peak skill, not the sum), every track
  tops out near mastery, and no birth starts above rung 1 across all 24 career × lineage
  combinations.
- Persistence: touched records saved, derived ones not, restore complete, junk safe.

Two assertions in the suite were wrong on the first run and are worth recording. "Requirements
rise" summed each rung's skill needs — but a top rung asking one skill at 88% sums lower than
a middle rung asking 72% + 45%, so a correctly ordered ladder failed. The peak is the right
measure, and the top rung dropping its secondary skill is the design. And "a new character is
on the bottom rung" was asserted on one sample; widening it to all 24 combinations is what
turned a passing anecdote into the rung-2 finding above.

## Not verified — staged, not measured

- **None of this is wired into play yet.** The dossier is built, persisted, and tested; no
  contract board, station desk or UI reads it. The ladder's standing gates are reachable
  from the console and nowhere else. **This patch is a foundation, not a feature.**
- **`issuerOf(station)` still returns a bloc**, so the contract board cannot post per-power
  work. That wiring is the single thing that turns all of this from modelled into playable.
- **`charter` and `hires` are declared on every power and read by nobody** — inert by this
  project's own standard.
- **Powers do not act.** They hold opinions, tempers and histories. None of them yet *does*
  anything as an organisation: no faction fleets, no territory, no war that advances.
- **The UI is a prototype, not an implementation.** `docs/dossier-prototype.html` is
  standalone and hand-fed with five sample people.

## Next

**.37 — "Desks"**: wire it in. Per-power contract issuers, skill- and standing-gated boards,
and the dossier screen implemented in-game against the prototype.
