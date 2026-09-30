# js/data/factions.js

[index](../../../README.md) · 304 lines · 13 symbols · 0 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY — the galactic powers. Ported from Living Galaxy (src/data/factions.js,
lg-1.04.00) verbatim: this is the refined political layer Astra was missing.
Astra's per-sky corporations (corps.js) are chartered under these powers, so
a local outfit inherits a bloc, a charter, a temper and a war.

Living Galaxy — who is out here, and what they did to each other.

Standing has been three numbers since v0.5: `coalition`, `pirate`, `independent`. Three
blocs is enough to decide whether a station opens its clamps, and it is not enough for
anything else. Every corporation in the game shared one reputation; a haulier who spent
six hours running freight for one cartel was equally welcome at its rival's berths; and
the "corp war" that the lineage descriptions kept alluding to had no representation at
all — it was scenery in a text field.

This file is the world's political layer as data. Three things live here:

  1. **Blocs** — the three coarse alignments, kept because docking rules, bounty payment
     and the NPC hostility check all read them and are correct as they are.
  2. **Powers** — the actual organisations. Corporations, governments, syndicates and
     the two guilds. Each belongs to a bloc, each holds its own opinion of you, and each
     holds its own opinion of *the others*, which is what makes a war expressible.
  3. **History** — a dated timeline. Not flavour text: every entry names the powers it
     involved and what it changed, and `relationOf()` is derived from the events rather
     than declared beside them, so the fiction and the mechanics cannot drift apart.

## The design rule

**A faction is a thing you can be in trouble with.** If a power cannot refuse you a
contract, price you differently, or send somebody after you, it does not belong in this
table — it belongs in a description string. Every power below does at least one.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/corp/corps.js](../corp/corps.js.md) — `POWERS`, `powersOf`, `relationOf`, `relationLabel`
- [js/economy/contracts.js](../economy/contracts.js.md) — `POWERS`
- test/people.test.mjs _(outside js/)_ — `POWERS`, `activeWars`, `relationOf`

## Exports

- [`BLOCS`](#s-BLOCS) · const — **no importer in scanned roots**
- [`BLOC_KEYS`](#s-BLOC_KEYS) · const — **no importer in scanned roots**
- [`POWERS`](#s-POWERS) · const — used by [js/corp/corps.js](../corp/corps.js.md), [js/economy/contracts.js](../economy/contracts.js.md), test/people.test.mjs
- [`POWER_KEYS`](#s-POWER_KEYS) · const — **no importer in scanned roots**
- [`powersOf`](#s-powersOf) · function — used by [js/corp/corps.js](../corp/corps.js.md)
- [`HISTORY`](#s-HISTORY) · const — **no importer in scanned roots**
- [`NOW`](#s-NOW) · const — **no importer in scanned roots**
- [`relationOf`](#s-relationOf) · function — used by [js/corp/corps.js](../corp/corps.js.md), test/people.test.mjs
- [`relationLabel`](#s-relationLabel) · function — used by [js/corp/corps.js](../corp/corps.js.md)
- [`activeWars`](#s-activeWars) · function — used by test/people.test.mjs
- [`historyOf`](#s-historyOf) · function — **no importer in scanned roots**
- [`powerFor`](#s-powerFor) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-BLOCS"></a>`BLOCS`

const · **exported** · L1–5

<!-- note:BLOCS -->
── the blocs ────────────────────────────────────────────────────────
Unchanged, and deliberately so. `systems/reputation.js` resolves any power to its bloc
for the coarse questions (may I dock, will they shoot) and asks this file for the fine
ones (will this desk hire me, what does that cost).
<!-- /note -->

### <a id="s-BLOC_KEYS"></a>`BLOC_KEYS`

const · **exported** · L6–6

<!-- note:BLOC_KEYS -->
<!-- /note -->

### <a id="s-POWERS"></a>`POWERS`

const · **exported** · L8–152

<!-- note:POWERS -->
── the powers ───────────────────────────────────────────────────────

Nine, which is the number that came out of asking "can this refuse me work?" of every
name the game already used somewhere. Four were already in `data/origins.js` as
corporations you could be born into; the rest were implied by stations, contract issuers
and NPC factions that had no organisation behind them.

`charter` is what the power actually sells or enforces, and it is what decides which
contract families its desks post. `temper` biases how fast standing moves: a syndicate
forgives quickly and forgets nothing, a bureau is the reverse.

- L22 · `regard: { severance: -0.5, freewake: 0.2, aurelian: 0.4, halloway: -0.2, kessler: -0.7 }` — What this power thinks of the others, before history is applied. Derived values live
  in `relationOf()`; these are the standing grudges the timeline then modifies.
- L62 · `charter: 'logistics',` — 'logistics', not 'logistic'. It was the singular until v1.02.39, which was harmless
  for as long as `charter` was read by nobody and silently wrong the moment it decided
  which desk a depot belongs to: the one power in the galaxy whose whole charter is
  freight would not have been offered a logistics station.
<!-- /note -->

### <a id="s-POWER_KEYS"></a>`POWER_KEYS`

const · **exported** · L153–153

<!-- note:POWER_KEYS -->
<!-- /note -->

### <a id="s-powersOf"></a>`powersOf(bloc)`

function · **exported** · L155–155

- called by: [`charterCorps`](../corp/corps.js.md#s-charterCorps) _js/corp/corps.js_ · [`powerFor`](#s-powerFor)

<!-- note:powersOf -->
Powers belonging to a bloc.
<!-- /note -->

### <a id="s-HISTORY"></a>`HISTORY`

const · **exported** · L157–247

<!-- note:HISTORY -->
── history ──────────────────────────────────────────────────────────

A dated timeline, and the mechanical source of truth for who hates whom. Each entry
names its participants and the shift it caused, so `relationOf()` can *derive* a
relationship instead of reading a second table that would immediately drift from the
story beside it. Same rule the NPC layer follows in v1.00.90: derive relationships, do
not store them.

Dates are Coalition Reckoning — CR 0 is the signing of the Charter.
<!-- /note -->

### <a id="s-NOW"></a>`NOW`

const · **exported** · L249–249

<!-- note:NOW -->
The current year, so a dossier can date what it says.
<!-- /note -->

### <a id="s-relCache"></a>`relCache`

const · L251–251

<!-- note:relCache -->
── derived relationships ────────────────────────────────────────────
<!-- /note -->

### <a id="s-relationOf"></a>`relationOf(a, b)`

function · **exported** · L253–274

- called by: [`corpRelation`](../corp/corps.js.md#s-corpRelation) _js/corp/corps.js_ · [`activeWars`](#s-activeWars) ×2

<!-- note:relationOf -->
How power `a` regards power `b`, from −1 (war) to +1 (allied).

Base regard plus every historical shift that names the pair, clamped. Derived rather
than declared so the timeline is the single source of truth: adding an event to
`HISTORY` changes the politics, and nothing else has to be edited to agree with it.

- L267 · `if (A.bloc === B.bloc) v += 0.15;` — Blocs pull. Two powers under the same charter are colleagues before they are rivals,
  and two across the Coalition/Outer line start from a worse place than their own
  opinions of each other would suggest.
<!-- /note -->

### <a id="s-relationLabel"></a>`relationLabel(v)`

function · **exported** · L276–283

- called by: [`corpWars`](../corp/corps.js.md#s-corpWars) _js/corp/corps.js_ · [`activeWars`](#s-activeWars)

<!-- note:relationLabel -->
Words for a relationship, for the dossier.
<!-- /note -->

### <a id="s-activeWars"></a>`activeWars()`

function · **exported** · L285–295

- calls: [`relationLabel`](#s-relationLabel) · [`relationOf`](#s-relationOf) ×2

<!-- note:activeWars -->
Every pair currently at war or hostile — the live corp wars, derived.
<!-- /note -->

### <a id="s-historyOf"></a>`historyOf(power)`

function · **exported** · L297–298

<!-- note:historyOf -->
Historical entries that name this power, newest first.
<!-- /note -->

### <a id="s-powerFor"></a>`powerFor(key)`

function · **exported** · L300–304

- calls: [`powersOf`](#s-powersOf)

<!-- note:powerFor -->
The power a station's issuer key resolves to, tolerating a bloc name.
<!-- /note -->
