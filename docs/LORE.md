# Living Galaxy — the political layer

Companion to `src/data/factions.js`. **That file is the source of truth**; this one explains
why it is shaped the way it is and reads the fiction out loud. If the two disagree, the code
is right and this document is stale.

---

## The rule that decides what goes in

> **A faction is a thing you can be in trouble with.**

If a power cannot refuse you a contract, price you differently, or send somebody after you,
it is not a faction — it is a description string, and it belongs in a `blurb` field. Every
one of the nine below does at least one of those three, mechanically, today.

This is also why there are nine and not thirty. Thirty organisations that all behave
identically is one organisation with thirty names.

## Why three blocs was not enough

Standing was three numbers from v0.5 to v1.02.35: `coalition`, `pirate`, `independent`.
That is exactly enough to decide whether a station opens its clamps, and it is enough for
nothing else. Consequences that shipped and stayed:

- Every corporation shared one reputation. Six hours of freight for one cartel made you
  equally welcome at its bitterest rival's berths.
- The "corp war" the lineage descriptions kept alluding to had no representation anywhere.
  It was scenery in a text field.
- Every character began at **+10 Coalition / −20 Outer** — a stance nobody had taken,
  applied before they had done anything, disliked by a third of the galaxy for reasons they
  could not point at.

Nine powers, each with its own opinion of you *and of each other*, is what makes "I did a
job for Meridian and Severance noticed" expressible at all.

The blocs are kept. `systems/reputation.js` is still correct about the coarse questions —
may I dock, will that ship shoot — and rewriting it would have been change for its own sake.

---

## The nine

### Coalition — chartered space

**Meridian Combine** · *economic* · the inner exchanges
The oldest chartered combine still trading under its founding name. Runs the clearing
houses the whole inner system prices against, which is a quieter kind of power than a fleet
and has outlasted several. Hires couriers, supply runs, survey work and escorts.
> *"Everything is a position. Including you."*

**Aurelian Directorate** · *military* · the fortress line
The Coalition's standing navy in everything but name — chartered as a security contractor
because a charter can be revoked and an army cannot. Writes the bounty schedule the rest of
the inner system pays against. Slow to trust (`gain 0.7`), fast to condemn (`loss 1.4`), and
it remembers (`memory 0.9`).
> *"Order is a service, and it is billed."*

**Halloway Assay** · *industrial* · the refineries
Refines and certifies. A Halloway stamp is what turns a hold of rock into a priced
commodity, so everybody who cuts ore eventually works for them whether they signed anything
or not. The most even-tempered power in the game, which is its own kind of leverage.
> *"Unmeasured is unowned."*

**Severance Holdings** · *economic* · nowhere it admits to
Chartered, listed, and audited annually by a firm it owns. Buys positions rather than cargo,
and the positions have a way of becoming correct shortly afterwards. Hardest temper in the
table — `gain 0.6, loss 1.6, memory 1.0`. Severance forgives nothing and never quite
accuses you of anything either.
> *"Information is the only commodity that does not spoil."*

### Independent — everyone who signed nothing

**Freewake Collective** · *logistic* · the free ports
Not a company. A standing agreement between several thousand crews that they will not
undercut each other and will not carry for anyone who does. It has no fleet and can close a
lane anyway. Quickest to warm to you of anyone (`gain 1.3`) and quickest to move on
(`memory 0.3`).
> *"Nobody flies alone twice."*

**Kestrel Guild** · *military* · the hiring halls
The mercenary register. Kestrel does not fight; it decides who is *allowed to be hired to*,
and a crew struck from the roll finds every legitimate desk in the system suddenly fully
staffed. Nobody elected it and everybody checks it.
> *"A contract kept is the only credential."*

**Drossgate Yards** · *industrial* · the breaker fields
Builds nothing new and can repair anything. Grew out of the wreck fields the Tariff War left
behind and never stopped — half the hulls in the outer system carry a Drossgate weld
somewhere. The one power with no strong enemies, which is what happens when everybody
eventually needs you.
> *"Everything comes apart. That is not a tragedy."*

### Outer — the claim-and-hold economy

**Kessler Compact** · *military* · the claimed belts
The largest claim-and-hold power, and the only one that keeps books. Kessler taxes the lanes
it holds and defends them properly, which its victims find more insulting than raiding. The
Directorate has called it piracy for sixty years and has never once retaken the corridor.
> *"We charge for the road. They charge for the paperwork."*

**Vosk Reclamation** · *industrial* · the wrecks
Strips what Kessler stops. Vosk crews will recover a hull with the crew still aboard and
consider having knocked first to be the courtesy. Pays in full, immediately, asks nothing,
and forgets you did anything (`memory 0.2`).
> *"Salvage law is just law that arrived first."*

---

## The timeline

Coalition Reckoning. **CR 0 is the signing of the Charter; it is now CR 158.**

| year | event | who |
|---|---|---|
| 0 | **The Charter** | Meridian · Aurelian · Halloway |
| 34 | **The Assay Act** | Halloway · Meridian |
| 61 | **The Tariff War** | Meridian · Freewake · Aurelian |
| 63 | **The Breaker Fields** | Drossgate · Freewake · Aurelian |
| 88 | **The Kessler Claim** | Kessler · Aurelian · Meridian |
| 96 | **The Register** | Kestrel · Aurelian · Kessler |
| 112 | **The Silent Quarter** | Severance · Meridian · Freewake |
| 127 | **The Vosk Precedent** | Vosk · Kessler · Halloway |
| 141 | **The Quiet Merger** | Severance · Kessler |
| 158 | **Now** | — |

### The three that still decide everything

**The Tariff War (CR 61)** is the load-bearing one. The Coalition set a transit levy on
unchartered hulls, and the independent crews did not protest and did not fight — they simply
stopped carrying, all of them, for nine weeks. Three inner stations went to rationing. The
levy was withdrawn, and the Freewake Collective existed as a fact from that day. Every
independent power in the game traces its confidence to those nine weeks, and Meridian has
never entirely forgiven being beaten by an absence.

**The Kessler Claim (CR 88)** is why the Outer bloc is not simply "pirates". A raiding
compact declared a belt corridor its own, posted a tariff, and — this was the part nobody
was ready for — *published the accounts*. It is the single deepest hostility in the table
and the reason the Directorate's budget survives every review.

**The Silent Quarter (CR 112)** is the one people still lower their voices about. Severance
held short positions on four commodities in a quarter when all four collapsed. Two inquiries
found nothing; both were chaired by former Severance counsel. Freewake has refused their
cargo ever since, at real cost to itself, and that refusal is the reason a Freewake-aligned
pilot finds Severance desks closed before they have done anything at all.

## Relationships are derived, not declared

This is the part that matters mechanically.

`relationOf(a, b)` computes an opinion from **base regard + every historical shift naming
the pair + a bloc pull**. There is no second table listing who hates whom. Adding an event
to `HISTORY` changes the politics of the game, and nothing else has to be edited to agree
with it — the fiction and the mechanics *cannot* drift, because there is only one of them.

It is the same rule the NPC layer adopted at v1.00.90: **derive relationships, do not store
them.** A parallel relationship table is a second source of truth that has to be bounded,
migrated, and kept in step with the thing it duplicates.

`activeWars()` is therefore not a list somebody maintains. It is a query.

## What standing actually does

Standing is per-power, ranges −100..+100, and **starts at zero with everybody**.

The only thing that moves it at creation is the lineage and corporation the player chose,
and those are now bonuses to *named organisations* rather than to a third of the galaxy —
`LINEAGE_POWERS` and `CORP_POWERS` in `src/data/origins.js`. A Belter out of Freewake starts
at +42 with the Collective and at exactly **0** with Halloway, Kestrel and Kessler, because
nothing in their history says otherwise yet.

When standing moves, it moves the rivals too. `adjustStanding()` bleeds a fraction of every
change into every other power in proportion to `relationOf()` — so running Directorate
escorts costs you with Kessler at a rate the *timeline* sets, and warms Meridian slightly
because the Charter made them partners in CR 0. Each power's `temper` scales how fast it
gains, how hard it punishes, and how long it holds on.

That is the corp war stopping being lore.

## The career ladder

Five rungs per career, in `LADDER` (`src/systems/dossier.js`). A rung is a **gate, not a
reward**: it opens contract families and licences, and it is reached by demonstrable
competence rather than elapsed time.

Requirements combine skill proficiency (continuous 0..1, not ranks), standing with named
powers, earned qualifications, and — for later rungs — all three at once. `nextRung()`
returns exactly what is missing and by how much, because **a gate that will not say what it
wants is what makes a progression system feel arbitrary**.

The enforcer ladder is the clearest illustration of why standing had to be per-power:

| rung | needs |
|---|---|
| Unlicensed | — |
| Marked Gun | gunnery 20% |
| Warranted | gunnery 40% · **Aurelian 15** |
| Commissioned | gunnery 60% · sensors 30% · **Aurelian 40** · clean record |
| Proscriptor | gunnery 80% · engineering 40% · **Aurelian 65** |

Under three blocs that middle column read "Coalition 40", which a pirate hunter and a
Severance fixer could both satisfy while working directly against each other. Naming the
Directorate makes the ladder a *choice of employer*, and choosing that employer costs you
with Kessler on the way up.

## Individuals

`npcDossier(name)` derives a complete person from the world seed and their name — a
proficiency curve strong in one or two skills, standing with two or three powers and none
with the rest, and two or three seeded traits. Deterministic everywhere, and **not stored**
until something changes them, so seventy NPCs do not become seventy save records at boot.

Two mercenaries with the same `role` are now different hires in ways that decide what work
they can take. That is the whole point of the patch: `role` stopped being the answer to
"who is this", and became one field on a record that has several.

---

## Open

- **Contract issuers are still bloc-level.** `issuerOf(station)` returns a bloc, so the
  board does not yet post per-power work. Wiring it is the next obvious step and is what
  makes the ladder's standing gates reachable through play rather than through the console.
- **Nothing consumes `charter` or `hires` yet.** Both are declared on every power and read
  by nobody, which by this project's own standards makes them inert until .37.
- **Powers do not act.** They have opinions, tempers and histories; none of them yet *does*
  anything as an organisation — no faction fleets, no territory, no war that advances.
