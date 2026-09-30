# js/data/lexicons.js

[index](../../../README.md) · 302 lines · 10 symbols · 1 imports · 7 importers

## About

<!-- note:@file -->
LIVING GALAXY — tongues.

Phoneme inventories, not name lists. Each entry describes how a people or
a reach of sky builds a word: which sounds can open a syllable, which can
close one, how long words run, and how a family name is shaped — because
the shape of the family name is the lore. The Sef have no surname, they
have a hull. T-Synth have a foundry line and a number. Brann have a father.

Fields:
  on / nu / co   onsets, nuclei, codas
  syl            weighted word length, e.g. { 2: 6, 3: 3, 1: 1 }
  pCoda          chance a mid-word syllable closes on a consonant
  pCodaEnd       the same for the last syllable
  pBareStart     chance a word opens on its vowel
  mark / pMark   an infix the tongue uses (an apostrophe, a hyphen)
  ban            a regex of clusters this tongue will not produce
  end            gendered endings { f, m, n } glued to a given name
  given          curated names blended in at pCurated, where a people has
                 recognisable ones
  family         how surnames are made (see familyName in names.js)

- L? · `import { HUMAN_GIVEN_M, HUMAN_GIVEN_F, HUMAN_LAST } from "../naming.js";` — Terran names people actually recognise — kept in the mix because a sky
  with nothing familiar in it reads as costume rather than a place.
- L? · `import { HUMAN_GIVEN_M, HUMAN_GIVEN_F, HUMAN_LAST } from "../naming.js";` — 0.3.32 — the wide pools behind the hand-picked ones. The lists below stay
  exactly as they were: they are the CORE, chosen for flavour and for a
  deliberately global spread, and they still carry that job. What they could
  not carry was volume — 44 given names and 65 surnames meant "Piotr" 37
  times in three thousand terrans, and a vessel callsign is built off the
  captain's surname, so the board repeated with them. See js/world/naming.js.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 17 | `../world/naming.js` | `HUMAN_GIVEN_M`, `HUMAN_GIVEN_F`, `HUMAN_LAST` | [js/world/naming.js](../world/naming.js.md) |

## Imported by

- [js/corp/gdb.js](../corp/gdb.js.md) — `LEXICONS`, `DEFAULT_LEX`
- [js/npc/cradle.js](../npc/cradle.js.md) — `LEXICONS`
- [js/world/names.js](../world/names.js.md) — `LEXICONS`, `TONGUES`, `DEFAULT_LEX`
- test/bounty.test.mjs _(outside js/)_ — `LEXICONS`
- test/gender.test.mjs _(outside js/)_ — `LEXICONS`
- test/names.test.mjs _(outside js/)_ — `LEXICONS`, `TONGUES`
- test/naming.test.mjs _(outside js/)_ — `LEXICONS`

## Exports

- [`LEXICONS`](#s-LEXICONS) · const — used by [js/corp/gdb.js](../corp/gdb.js.md), [js/npc/cradle.js](../npc/cradle.js.md), [js/world/names.js](../world/names.js.md), test/bounty.test.mjs, test/gender.test.mjs, test/names.test.mjs, test/naming.test.mjs
- [`DEFAULT_LEX`](#s-DEFAULT_LEX) · const — used by [js/corp/gdb.js](../corp/gdb.js.md), [js/world/names.js](../world/names.js.md)
- [`TONGUES`](#s-TONGUES) · const — used by [js/world/names.js](../world/names.js.md), test/names.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-END_COMMON"></a>`END_COMMON`

const · L1–5

<!-- note:END_COMMON -->
Shared ending sets — most tongues take one of these and tilt it.
<!-- /note -->

### <a id="s-END_HARD"></a>`END_HARD`

const · L6–10

<!-- note:END_HARD -->
<!-- /note -->

### <a id="s-END_SOFT"></a>`END_SOFT`

const · L11–15

<!-- note:END_SOFT -->
<!-- /note -->

### <a id="s-P_CORE"></a>`P_CORE`

const · L19–19

<!-- note:P_CORE -->
How often a curated draw takes the hand-picked core rather than the wide
pool. Measured over three thousand terrans, distinct first / distinct
surnames / commonest first name / draws that landed on a flavour name:

  0.40   2248 / 1698 / Esme x18    / 118
  0.25   2421 / 2051 / Roman x11   /  80
  0.15   2511 / 2272 / Petra x8    /  45
  0.08   2585 / 2411 / Frankie x5  /  18

0.2 sits where a flavour name is still a recognisable seasoning — a couple
per hundred people — while the commonest name is under half a percent, so
nothing repeats at the scale anyone actually plays at. (Before: 1266 / 65 /
Piotr x37.)
<!-- /note -->

### <a id="s-HUMAN_WIDE"></a>`HUMAN_WIDE`

const · L20–20

<!-- note:HUMAN_WIDE -->
<!-- /note -->

### <a id="s-TERRAN_GIVEN"></a>`TERRAN_GIVEN`

const · L22–34

<!-- note:TERRAN_GIVEN -->
<!-- /note -->

### <a id="s-TERRAN_LAST"></a>`TERRAN_LAST`

const · L35–41

<!-- note:TERRAN_LAST -->
<!-- /note -->

### <a id="s-LEXICONS"></a>`LEXICONS`

const · **exported** · L43–249

<!-- note:LEXICONS -->
- L44 · `terran: {` — Sol and everywhere Sol shipped people. Broad, familiar, no one flavour.
- L56 · `tsynth: {` — Grown to a specification and aware of it. A handle and a foundry line.
- L71 · `eridian: {` — Spin gravity a third of standard and a sky full of nothing. Airy.
- L82 · `vantari: {` — Deep-cold drift. Hard consonants worn smooth by long vowels.
- L96 · `korrash: {` — High gravity. Short words, heavy endings, nothing decorative.
- L107 · `sef: {` — Born, married and buried aboard. No surname — a hull.
- L120 · `ashwalker: {` — Cinder belts. Everything sounds a little burnt.
- L134 · `myrrin: {` — Ring farms round the giants. Liquid, nasal, nothing sharp.
- L148 · `delvath: {` — Subsurface warrens. Clustered consonants, deep vowels, long words.
- L162 · `oberlin: {` — Raised on contract. The given name is plain; the surname is an employer.
- L178 · `haask: {` — The shatter-fields. Sibilants and a glottal stop where a vowel should be.
- L185 · `end: {` — 0.3.54: five endings a gender made a Haask crew one name five times
- L193 · `veyd: {` — Nobody agrees, and the Veyd have not clarified. One long name, no family.
- L209 · `brann: {` — Shipyard clans of the outer docks. You are your father's, and it shows.
- L223 · `sirrah: {` — Medical orders out of the old core. Soft, and always attached to a house.
- L236 · `kethran: {` — Border fleets that never stood down. Clipped, and hyphenated by unit.
<!-- /note -->

### <a id="s-DEFAULT_LEX"></a>`DEFAULT_LEX`

const · **exported** · L251–251

<!-- note:DEFAULT_LEX -->
<!-- /note -->

### <a id="s-TONGUES"></a>`TONGUES`

const · **exported** · L253–302

<!-- note:TONGUES -->
---- sky tongues --------------------------------------------------------
Every system names its worlds from one of these, so the bodies in a sky
sound like neighbours. Deliberately not the same set as the race tongues:
a world is named by whoever charted it first, and the charts are older
than anyone currently flying.

- L254 · `{` — the old survey tongue — this is what p10's ROOTS/TAILS sounded like
- L254 · `{` — liturgical — long, vowel-heavy, named by whoever came with a telescope and a creed
- L254 · `{` — the hard reaches — short and blunt, named by people in a hurry
- L254 · `{` — meltwater tongue — flowing, lots of l and r
- L254 · `{` — the sibilant charts — hissing names for hot skies
- L254 · `{` — deep-field designation tongue — heavy on stops, reads like machine output
- L254 · `{` — nasal tongue — hummed names, common in the ring reaches
- L254 · `{` — the old colonial tongue — vaguely familiar, half-remembered Earth
<!-- /note -->
