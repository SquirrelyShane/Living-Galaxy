# js/world/names.js

[index](../../../README.md) · 401 lines · 53 symbols · 1 imports · 12 importers

## About

<!-- note:@file -->
LIVING GALAXY — the name forge.

One assembler, many tongues. Names are built out of phonemes rather than
drawn from a list, so the supply is effectively bottomless and a name
carries information: a Korrash sounds like a Korrash, a world in the
Oph reach sounds like its neighbours, and a rock that has been on the
charts long enough to kill something has earned a name instead of a
designation.

Everything here is seeded and pure. Pass an rng in and the same seed gives
the same sky on every device; pass nothing and it rolls.

  personName("korrash", "woman", rnd)   -> { first, last, full }
  worldName(sky, { kind, arch, settled }, rnd)
  moonName(parentName, index, sky, rnd)
  rockName(seq, radius, rnd)
  skyTongue(seed)                       -> a lexicon every world in one
                                           system is named from

- L340 · `const HALF_MONTH = "ABCDEFGHJKLMNOPQRSTUVWXY";` — no I, as the real scheme goes
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../data/lexicons.js` | `LEXICONS`, `TONGUES`, `DEFAULT_LEX` | [js/data/lexicons.js](../data/lexicons.js.md) |

## Imported by

- [js/corp/gdb.js](../corp/gdb.js.md) — `givenName`, `nameRng`, `familyOf`
- [js/crew/family.js](../crew/family.js.md) — `childFamily`, `nameRng`
- [js/npc/cradle.js](../npc/cradle.js.md) — `personName`, `forgeWord`
- [js/npc/speech.js](../npc/speech.js.md) — `personName`
- [js/station/stationlife.js](../station/stationlife.js.md) — `childFamily`, `nameRng`
- [js/world/events/impactors.js](events/impactors.js.md) — `rockName`, `surveyYear`
- [js/world/generate.js](generate.js.md) — `skyNaming`, `worldName`, `moonName`, `beaconName`
- test/bounty.test.mjs _(outside js/)_ — `givenName`, `nameRng`
- test/gdb.test.mjs _(outside js/)_ — `personName`, `nameRng`
- test/gender.test.mjs _(outside js/)_ — `personName`, `givenName`
- test/names.test.mjs _(outside js/)_ — `nameRng`, `forgeWord`, `personName`, `givenName`, `familyName`, `familyOf`, `childFamily`, `worldName`, `moonName`, `rockName`, `beaconName`, `skyNaming`, `skyTongue`, `surveyYear`, `offensive`
- test/naming.test.mjs _(outside js/)_ — `personName`, `offensive`

## Exports

- [`nameRng`](#s-nameRng) · function — used by [js/corp/gdb.js](../corp/gdb.js.md), [js/crew/family.js](../crew/family.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/bounty.test.mjs, test/gdb.test.mjs, test/names.test.mjs
- [`offensive`](#s-offensive) · function — used by test/names.test.mjs, test/naming.test.mjs
- [`forgeWord`](#s-forgeWord) · function — used by [js/npc/cradle.js](../npc/cradle.js.md), test/names.test.mjs
- [`givenName`](#s-givenName) · function — used by [js/corp/gdb.js](../corp/gdb.js.md), test/bounty.test.mjs, test/gender.test.mjs, test/names.test.mjs
- [`familyName`](#s-familyName) · function — used by test/names.test.mjs
- [`familyOf`](#s-familyOf) · function — used by [js/corp/gdb.js](../corp/gdb.js.md), test/names.test.mjs
- [`childFamily`](#s-childFamily) · function — used by [js/crew/family.js](../crew/family.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/names.test.mjs
- [`personName`](#s-personName) · function — used by [js/npc/cradle.js](../npc/cradle.js.md), [js/npc/speech.js](../npc/speech.js.md), test/gdb.test.mjs, test/gender.test.mjs, test/names.test.mjs, test/naming.test.mjs
- [`skyTongue`](#s-skyTongue) · function — used by test/names.test.mjs
- [`catalogueRoot`](#s-catalogueRoot) · function — **no importer in scanned roots**
- [`worldName`](#s-worldName) · function — used by [js/world/generate.js](generate.js.md), test/names.test.mjs
- [`moonName`](#s-moonName) · function — used by [js/world/generate.js](generate.js.md), test/names.test.mjs
- [`skyNaming`](#s-skyNaming) · function — used by [js/world/generate.js](generate.js.md), test/names.test.mjs
- [`surveyYear`](#s-surveyYear) · function — used by [js/world/events/impactors.js](events/impactors.js.md), test/names.test.mjs
- [`rockName`](#s-rockName) · function — used by [js/world/events/impactors.js](events/impactors.js.md), test/names.test.mjs
- [`beaconName`](#s-beaconName) · function — used by [js/world/generate.js](generate.js.md), test/names.test.mjs
- `LEXICONS` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-nameRng"></a>`nameRng(seedStr)`

function · **exported** · L3–14

- called by: [`reforged`](../corp/gdb.js.md#s-reforged) _js/corp/gdb.js_ · [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ · [`bearChild`](../station/stationlife.js.md#s-bearChild) _js/station/stationlife.js_ · [`skyNaming`](#s-skyNaming) · [`skyTongue`](#s-skyTongue)

<!-- note:nameRng -->
---- seeding ------------------------------------------------------------
<!-- /note -->

### <a id="s-pick"></a>`pick(rnd, a)`

function · L16–16

- called by: [`buildBeacon`](#s-buildBeacon) · [`buildFamily`](#s-buildFamily) ×10 · [`catalogueRoot`](#s-catalogueRoot) · [`childFamily`](#s-childFamily) · [`colonistName`](#s-colonistName) ×8 · [`endingFor`](#s-endingFor) ×2 · [`forgeWord`](#s-forgeWord) ×3 · [`givenName`](#s-givenName) · [`moonName`](#s-moonName) · [`spokenRock`](#s-spokenRock) ×8 · [`syllable`](#s-syllable) ×4

<!-- note:pick -->
<!-- /note -->

### <a id="s-chance"></a>`chance(rnd, p)`

function · L17–17

- called by: [`buildFamily`](#s-buildFamily) ×2 · [`catalogueRoot`](#s-catalogueRoot) · [`endingFor`](#s-endingFor) · [`forgeWord`](#s-forgeWord) ×2 · [`givenName`](#s-givenName) ×3 · [`rockName`](#s-rockName) · [`skyNaming`](#s-skyNaming) · [`spokenRock`](#s-spokenRock) ×2 · [`syllable`](#s-syllable) ×2

<!-- note:chance -->
<!-- /note -->

### <a id="s-weighted"></a>`weighted(rnd, table)`

function · L19–25

- called by: [`buildFamily>stem`](#s-buildFamily-stem) · [`forgeWord`](#s-forgeWord) · [`givenName`](#s-givenName) · [`moonName`](#s-moonName) · [`skyNaming`](#s-skyNaming) · [`worldName`](#s-worldName)

<!-- note:weighted -->
Weighted pick over a { key: weight } table. Returns the key.
<!-- /note -->

### <a id="s-cap"></a>`cap(s)`

function · L27–27

- called by: [`buildFamily`](#s-buildFamily) ×3 · [`forgeWord`](#s-forgeWord) ×3 · [`givenName`](#s-givenName)

<!-- note:cap -->
<!-- /note -->

### <a id="s-DIGRAPH"></a>`DIGRAPH`

const · L29–29

<!-- note:DIGRAPH -->
---- the assembler ------------------------------------------------------
A word is a run of syllables. Each syllable is onset + nucleus + coda,
any of which a tongue may leave empty. The rules that matter are the ones
that stop it sounding like keyboard mash: no three of the same letter, no
coda that collides with the next onset, and a tongue-specific ban list.
<!-- /note -->

### <a id="s-VOWEL"></a>`VOWEL`

const · L30–30

<!-- note:VOWEL -->
<!-- /note -->

### <a id="s-simpleOnsets"></a>`simpleOnsets(lex)`

function · L32–38

- called by: [`forgeWord`](#s-forgeWord) · [`syllable`](#s-syllable)

<!-- note:simpleOnsets -->
Onsets a syllable may take when the one before it closed on a consonant.
<!-- /note -->

### <a id="s-syllable"></a>`syllable(lex, rnd, {…})`

function · L40–56

- calls: [`chance`](#s-chance) ×2 · [`pick`](#s-pick) ×4 · [`simpleOnsets`](#s-simpleOnsets)
- called by: [`forgeWord`](#s-forgeWord)

<!-- note:syllable -->
A syllable knows what came before it. That one fact is what separates a
name from keyboard mash: a closed syllable is followed by a light onset,
never by another three-consonant cluster, and no sound is used twice
running.

- L51 · `const heavy = on.length > 1 && !DIGRAPH.test(on);` — A cluster onset has already spent the syllable's consonant budget.
<!-- /note -->

### <a id="s-smooth"></a>`smooth(w, lex)`

function · L58–65

- called by: [`forgeWord`](#s-forgeWord)

<!-- note:smooth -->
Clean up the joins between syllables without flattening the tongue.

- L60 · `out = out.replace(/(.)\1\1+/g, "$1$1");` — no trebles
- L61 · `out = out.replace(/([bcdfgjkpqtvxz])\1/g, "$1");` — stops don't double
<!-- /note -->

### <a id="s-HARD"></a>`HARD`

const · L67–70

<!-- note:HARD -->
A forge that draws from phonemes will eventually draw something the player
did not want to read on a crew manifest. Cheap to check, embarrassing to
skip: "Clitor" came out of the Oberlin tongue on the second sampling run.
HARD fragments are rejected anywhere in a word; EDGE fragments only where
they start or end one, so ordinary names like Kassar and Titania survive.
<!-- /note -->

### <a id="s-EDGE"></a>`EDGE`

const · L71–72

<!-- note:EDGE -->
<!-- /note -->

### <a id="s-offensive"></a>`offensive(w)`

function · **exported** · L74–79

- called by: [`beaconName`](#s-beaconName) · [`childFamily`](#s-childFamily) · [`familyName`](#s-familyName) · [`givenName`](#s-givenName) ×2 · [`moonName`](#s-moonName) · [`rockName`](#s-rockName) · [`sayable`](#s-sayable) · [`worldName`](#s-worldName)

<!-- note:offensive -->
<!-- /note -->

### <a id="s-sayable"></a>`sayable(w, lex, want)`

function · L81–92

- calls: [`offensive`](#s-offensive)
- called by: [`forgeWord`](#s-forgeWord) ×2

<!-- note:sayable -->
A word nobody could say out loud is not a name. Four cheap checks catch
nearly all of them.

- L84 · `if (!/[^aeiouy]/.test(w)) return false;` — all vowels is not a word either
- L85 · `if (/[^aeiouy]{4,}/.test(w)) return false;` — four consonants in a row
- L86 · `for (const c of new Set(w.replace(/[aeiouy]/g, ""))) {` — The same consonant three times over reads as a stutter, not a tongue.
<!-- /note -->

### <a id="s-forgeWord"></a>`forgeWord(lex, rnd, syl)`

function · **exported** · L94–118

- calls: [`cap`](#s-cap) ×3 · [`chance`](#s-chance) ×2 · [`pick`](#s-pick) ×3 · [`sayable`](#s-sayable) ×2 · [`simpleOnsets`](#s-simpleOnsets) · [`smooth`](#s-smooth) · [`syllable`](#s-syllable) · [`weighted`](#s-weighted)
- called by: [`originFor`](../npc/cradle.js.md#s-originFor) _js/npc/cradle.js_ ×2 · [`buildBeacon`](#s-buildBeacon) · [`buildFamily>stem`](#s-buildFamily-stem) · [`colonistName`](#s-colonistName) ×2 · [`givenName`](#s-givenName) ×2 · [`moonName`](#s-moonName) · [`skyNaming`](#s-skyNaming) · [`spokenRock`](#s-spokenRock) · [`worldName`](#s-worldName)

<!-- note:forgeWord -->
Build a raw word in a tongue. `syl` overrides the tongue's own length
table — worlds want longer words than call signs do.

- L116 · `const lite = cap(pick(rnd, simpleOnsets(lex)) + pick(rnd, lex.nu) + (chance(rnd, 0.4) ? pi` — Twelve rejects means the tongue is a tight one. Fall back to its
  simplest possible shape rather than shipping mush.
<!-- /note -->

### <a id="s-AMBIGUOUS"></a>`AMBIGUOUS`

const · L120–120

<!-- note:AMBIGUOUS -->
---- people -------------------------------------------------------------
Gender rides on the ending rather than on a separate word list, which is
how most real tongues do it and what makes the supply bottomless. A share
of every draw takes the neutral set regardless, so a crew list still tells
you less than a face does — the same intent the three-pool split had, with
four orders of magnitude more names behind it.

How often a given name takes the neutral ending set instead of its own.

18% was chosen so a crew list tells you less than a face does, which is a
nice idea and the wrong call for this game: the tongues are invented, so a
player has no ear for them, and a name with no gender signal does not read
as ambiguous — it reads as male, which is the default anyone brings to a
sci-fi crew roster. At 10% the ending still varies without the whole list
defaulting one way.
<!-- /note -->

### <a id="s-endingFor"></a>`endingFor(lex, gender, rnd)`

function · L122–126

- calls: [`chance`](#s-chance) · [`pick`](#s-pick) ×2
- called by: [`givenName`](#s-givenName) ×2

<!-- note:endingFor -->
<!-- /note -->

### <a id="s-affix"></a>`affix(stem, end)`

function · L128–134

- called by: [`buildFamily`](#s-buildFamily) ×2 · [`childFamily`](#s-childFamily) · [`givenName`](#s-givenName) ×2

<!-- note:affix -->
Glue an ending on without stacking vowels or repeating the last sound.

- L133 · `return (stem + end).replace(/[aeiouy]{3,}/gi, (m) => m.slice(0, 2));` — The join is where vowel piles come from: "Waero" + "ioe". Trim it here
  rather than shipping something nobody can pronounce.
<!-- /note -->

### <a id="s-oneFlourish"></a>`oneFlourish(name)`

function · L136–142

- called by: [`givenName`](#s-givenName) ×3

<!-- note:oneFlourish -->
0.3.54 — a given name gets ONE flourish. The tongues that double their
vowels or break a word with an apostrophe were doing it two and three times
in a name ("Z'hesskiisaa"), and a crew list of those reads as one name
printed five times. The first doubled vowel and the first mark stay; the
rest are sung short.

- L141 · `return out.replace(/([a-z])\1\1+/gi, "$1$1");` — "Hsazhas" + "ssa" is not "sss"
<!-- /note -->

### <a id="s-GIVEN_MAX"></a>`GIVEN_MAX`

const · L144–144

<!-- note:GIVEN_MAX -->
Past this a given name is a mouthful on a crew list (0.3.54: 12 → 10).
<!-- /note -->

### <a id="s-givenName"></a>`givenName(lex, gender, rnd)`

function · **exported** · L146–162

- calls: [`affix`](#s-affix) ×2 · [`cap`](#s-cap) · [`chance`](#s-chance) ×3 · [`endingFor`](#s-endingFor) ×2 · [`forgeWord`](#s-forgeWord) ×2 · [`offensive`](#s-offensive) ×2 · [`oneFlourish`](#s-oneFlourish) ×3 · [`pick`](#s-pick) · [`weighted`](#s-weighted)
- called by: [`reforged`](../corp/gdb.js.md#s-reforged) _js/corp/gdb.js_ · [`personName`](#s-personName)

<!-- note:givenName -->
- L147 · `if (lex.given && chance(rnd, lex.pCurated ?? 0)) {` — Curated names stay in the mix for the tongues that have them — a sky
  with no familiar names in it reads as costume rather than place.
  
  0.3.32: there are two curated pools now, not one. `given` is the CORE —
  forty-odd names chosen by hand for flavour and for a deliberately global
  spread, the ones that make a terran deck sound like a terran deck.
  `wide` is thousands, vendored, behind it. Before this there was only the
  core, and it showed: "Piotr" came up 37 times in three thousand terrans.
  Drawing mostly from the wide pool fixes the repetition; still drawing
  from the core often enough keeps the flavour that was picked on purpose.
- L157 · `for (let i = 0; i < 6 && (name.replace(/'/g, "").length > GIVEN_MAX || offensive(name)); i` — A given name is something somebody shouts across a deck. Ten letters
  is already generous; past that, take the short form of the tongue.
- L157 · `for (let i = 0; i < 6 && (name.replace(/'/g, "").length > GIVEN_MAX || offensive(name)); i` — The join can make one the syllables never held: "Cli" + "tor".
<!-- /note -->

### <a id="s-familyName"></a>`familyName(lex, rnd, gender)`

function · **exported** · L164–170

- calls: [`buildFamily`](#s-buildFamily) · [`offensive`](#s-offensive)
- called by: [`childFamily`](#s-childFamily) · [`colonistName`](#s-colonistName) · [`personName`](#s-personName) ×2 · [`spokenRock`](#s-spokenRock)

<!-- note:familyName -->
Family name. Tongues carry a `family` shape describing how their people
are placed — a clan, a crèche contract, a barge, a foundry line — and it
is that shape, not a surname list, that makes Sef read as Sef.

- L165 · `for (let i = 0; i < 6; i++) {` — The join is where these appear — "Skanu" + "sdatter" makes a word the
  syllables never held. Six tries, then the bare stem.
<!-- /note -->

### <a id="s-buildFamily"></a>`buildFamily(lex, rnd, gender)`

function · L172–203

- calls: [`affix`](#s-affix) ×2 · [`buildFamily>stem`](#s-buildFamily-stem) ×5 · [`cap`](#s-cap) ×3 · [`chance`](#s-chance) ×2 · [`pick`](#s-pick) ×10
- called by: [`familyName`](#s-familyName)

<!-- note:buildFamily -->
- L179 · `return shape.wide?.length && !chance(rnd, shape.pCore ?? 1)` — same core/wide split as the given names: the hand-picked pool carries
  the flavour, the vendored one carries the variety (0.3.32)
- L182 · `case "of":` — "of the Long Marrow" — barge and order folk
- L184 · `case "clan":` — "Ostrek-Vane" — shipyard and border clans
- L186 · `case "line": {` — "Tethys-4417" — spec-born, and they know it
- L190 · `case "patronym": {` — "Halvarsdottir" — the outer docks
- L194 · `case "corp":` — "Oberlin Grade" — raised on contract
- L196 · `case "compound":` — "Ashfall", "Cinderwake"
<!-- /note -->

#### <a id="s-buildFamily-stem"></a>`buildFamily>stem()`

function · L174–174

- calls: [`forgeWord`](#s-forgeWord) · [`weighted`](#s-weighted)
- called by: [`buildFamily`](#s-buildFamily) ×5

<!-- note:buildFamily>stem -->
<!-- /note -->

### <a id="s-familyOf"></a>`familyOf(fullName)`

function · **exported** · L205–208

- called by: [`reforged`](../corp/gdb.js.md#s-reforged) _js/corp/gdb.js_ · [`childFamily`](#s-childFamily) ×2

<!-- note:familyOf -->
The family part of a full name — everything after the given name.
<!-- /note -->

### <a id="s-childFamily"></a>`childFamily(sire, carrier, gender, raceId, rnd=)`

function · **exported** · L210–225

- calls: [`affix`](#s-affix) · [`familyName`](#s-familyName) · [`familyOf`](#s-familyOf) ×2 · [`offensive`](#s-offensive) · [`pick`](#s-pick)
- called by: [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ · [`bearChild`](../station/stationlife.js.md#s-bearChild) _js/station/stationlife.js_

<!-- note:childFamily -->
What a child born aboard is called. Most tongues hand the family name
straight down; the Brann do not have one to hand down, they have a father,
so a Brann child is named off whichever parent's given name they take. The
Veyd have no family name at all and the child gets none either.
<!-- /note -->

### <a id="s-personName"></a>`personName(race, gender, rnd=)`

function · **exported** · L227–233

- calls: [`echoes`](#s-echoes) · [`familyName`](#s-familyName) ×2 · [`givenName`](#s-givenName)
- called by: [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_ · [`flowPilot`](../npc/speech.js.md#s-flowPilot) _js/npc/speech.js_

<!-- note:personName -->
A whole person. `race` is a race id from races.js; anything unknown falls
back to the common tongue, so a new race added later still gets names.

- L231 · `for (let i = 0; i < 3 && last && echoes(first, last); i++) last = familyName(lex, rnd, gen` — 0.3.54: "Thregruka Thregargh-Vrakourk" — a family name that opens on the
  same sound as the given name reads as a stammer. Three more tries.
<!-- /note -->

### <a id="s-bare"></a>`bare(w)`

function · L234–234

- called by: [`echoes`](#s-echoes) ×2

<!-- note:bare -->
<!-- /note -->

### <a id="s-echoes"></a>`echoes(first, last)`

function · L235–235

- calls: [`bare`](#s-bare) ×2
- called by: [`personName`](#s-personName)

<!-- note:echoes -->
<!-- /note -->

### <a id="s-skyTongue"></a>`skyTongue(seed)`

function · **exported** · L237–240

- calls: [`nameRng`](#s-nameRng)
- called by: [`skyNaming`](#s-skyNaming)

<!-- note:skyTongue -->
---- worlds -------------------------------------------------------------
Every system picks one tongue and names its worlds from it, so a sky
hangs together — you can hear that Ophiath and Ophelune are neighbours.
On top of that sit two other registers. A world nobody lives on often
never got past its survey designation; a world people settled usually
carries the name of whoever was first onto it.
<!-- /note -->

### <a id="s-CATALOGUES"></a>`CATALOGUES`

const · L242–242

<!-- note:CATALOGUES -->
<!-- /note -->

### <a id="s-COLONY_HEAD"></a>`COLONY_HEAD`

const · L243–243

<!-- note:COLONY_HEAD -->
<!-- /note -->

### <a id="s-COLONY_TAIL"></a>`COLONY_TAIL`

const · L244–244

<!-- note:COLONY_TAIL -->
<!-- /note -->

### <a id="s-catalogueRoot"></a>`catalogueRoot(rnd)`

function · **exported** · L246–250

- calls: [`chance`](#s-chance) · [`pick`](#s-pick)
- called by: [`skyNaming`](#s-skyNaming)

<!-- note:catalogueRoot -->
A survey designation for a star: "HD 4181", "LX-2276".
<!-- /note -->

### <a id="s-ORBIT_LETTERS"></a>`ORBIT_LETTERS`

const · L252–252

<!-- note:ORBIT_LETTERS -->
<!-- /note -->

### <a id="s-worldName"></a>`worldName(sky, info, rnd=, used=)`

function · **exported** · L254–273

- calls: [`colonistName`](#s-colonistName) · [`forgeWord`](#s-forgeWord) · [`offensive`](#s-offensive) · [`registerFor`](#s-registerFor) · [`weighted`](#s-weighted)
- called by: [`generateSystem`](generate.js.md#s-generateSystem) _js/world/generate.js_

<!-- note:worldName -->
Name a world.

  sky   { tongue, root, seed }  from skyNaming()
  info  { kind, arch, settled, index }

`index` is the orbital slot, used for catalogue letters so that the
designations count outward the way a real catalogue does.

- L266 · `if (n.length < 4 && attempt < 8) continue;` — "Gur" is a grunt, not a world. Anything a tongue coughs up that
  short gets sent back once before it goes on a chart.
<!-- /note -->

### <a id="s-registerFor"></a>`registerFor(info, rnd)`

function · L275–283

- called by: [`worldName`](#s-worldName)

<!-- note:registerFor -->
Which register a world gets is the whole point of the mix: a designation
should mean "nobody ever cared enough", so it belongs on the cold margins
and the hostile rock, not on half the chart. A nav list that is mostly
&lt;star> b, &lt;star> d, &lt;star> g is less varied than what it replaced.

- L281 · `if (k === "dwarf") return r < 0.44 ? "spoken" : "catalogue";` — the chart's margin
- L282 · `return r < 0.62 ? "spoken" : r < 0.72 ? "colonist" : "catalogue";` — rocky, cloud
<!-- /note -->

### <a id="s-COLONY_VIRTUE"></a>`COLONY_VIRTUE`

const · L285–286

<!-- note:COLONY_VIRTUE -->
Somebody got here first and the name stuck. Half the time that somebody
left a surname on it; the rest of the time they named it for what it was
on the day they landed.
<!-- /note -->

### <a id="s-colonistName"></a>`colonistName(lex, rnd)`

function · L288–298

- calls: [`familyName`](#s-familyName) · [`forgeWord`](#s-forgeWord) ×2 · [`pick`](#s-pick) ×8
- called by: [`worldName`](#s-worldName)

<!-- note:colonistName -->
<!-- /note -->

### <a id="s-ROMAN"></a>`ROMAN`

const · L300–300

<!-- note:ROMAN -->
<!-- /note -->

### <a id="s-moonName"></a>`moonName(parent, index, sky, rnd=, used=)`

function · **exported** · L302–322

- calls: [`forgeWord`](#s-forgeWord) · [`offensive`](#s-offensive) · [`pick`](#s-pick) · [`shorten`](#s-shorten) · [`weighted`](#s-weighted)
- called by: [`generateSystem`](generate.js.md#s-generateSystem) _js/world/generate.js_

<!-- note:moonName -->
Moons take their parent's name far more often than not, because that is
how charts work — but which form they take depends on what the parent is.
A catalogue world's moons are numbered off the designation; a named world's
moons get Roman numerals, a diminutive, or a name of their own.
<!-- /note -->

### <a id="s-shorten"></a>`shorten(w)`

function · L324–329

- called by: [`moonName`](#s-moonName)

<!-- note:shorten -->
"Ophiath" -> "Ophia". Enough to read as the same word, shorter on a chart.
<!-- /note -->

### <a id="s-skyNaming"></a>`skyNaming(seed)`

function · **exported** · L331–338

- calls: [`catalogueRoot`](#s-catalogueRoot) · [`chance`](#s-chance) · [`forgeWord`](#s-forgeWord) · [`nameRng`](#s-nameRng) · [`skyTongue`](#s-skyTongue) · [`weighted`](#s-weighted)
- called by: [`generateSystem`](generate.js.md#s-generateSystem) _js/world/generate.js_

<!-- note:skyNaming -->
Everything one system needs to name itself consistently.

- L334 · `const cat = catalogueRoot(rnd);` — Most stars carry a name somebody gave them; the rest never got past the
  survey catalogue. Either way that is what the designations count off, so
  a sky reads as one place: Kesune, Kesune b, Kesune c — or LX-2276 and
  LX-2276 b, if nobody ever cared enough to name it.
<!-- /note -->

### <a id="s-HALF_MONTH"></a>`HALF_MONTH`

const · L340–340

<!-- note:HALF_MONTH -->
---- rogue rocks --------------------------------------------------------
A rock gets a provisional designation the moment a survey sees it, the way
the real minor-planet catalogues do it: year, a half-month letter, an order
letter, and a cycle count. Most rocks die as a designation. The big ones —
the ones that end a moon — get talked about, and a thing that gets talked
about gets a name.
<!-- /note -->

### <a id="s-ORDER"></a>`ORDER`

const · L341–341

<!-- note:ORDER -->
<!-- /note -->

### <a id="s-ROCK_ADJ"></a>`ROCK_ADJ`

const · L342–342

<!-- note:ROCK_ADJ -->
<!-- /note -->

### <a id="s-ROCK_NOUN"></a>`ROCK_NOUN`

const · L343–343

<!-- note:ROCK_NOUN -->
<!-- /note -->

### <a id="s-ROCK_SOLO"></a>`ROCK_SOLO`

const · L344–344

<!-- note:ROCK_SOLO -->
<!-- /note -->

### <a id="s-surveyYear"></a>`surveyYear(rnd)`

function · **exported** · L346–348

- called by: [`resetImpactors`](events/impactors.js.md#s-resetImpactors) _js/world/events/impactors.js_ · [`rockName`](#s-rockName)

<!-- note:surveyYear -->
A believable survey year, stable for the life of a sky.
<!-- /note -->

### <a id="s-rockName"></a>`rockName(seq, radius, rnd=, year, taken)`

function · **exported** · L350–367

- calls: [`chance`](#s-chance) · [`offensive`](#s-offensive) · [`spokenRock`](#s-spokenRock) · [`surveyYear`](#s-surveyYear)
- called by: [`addRogue`](events/impactors.js.md#s-addRogue) _js/world/events/impactors.js_ · [`launch`](events/impactors.js.md#s-launch) _js/world/events/impactors.js_

<!-- note:rockName -->
Name a rogue rock.

  seq     the spawn counter, so designations never collide
  radius  in world units — big rocks earn a spoken name
  year    the sky's survey year (surveyYear), optional

- L352 · `const cycle = Math.floor(seq / ORDER.length);` — Built entirely out of seq, because a designation that rolls any part of
  itself is a designation that can collide — and a catalogue with two
  entries under one number is not a catalogue. The half-month letter walks
  forward a step each time the order letters wrap, exactly as the real
  scheme does, so the numbers read like a survey working through a year.
- L357 · `const big = radius > 420;` — Big enough to be worth a name, and not every big one gets one.
- L361 · `for (let attempt = 0; attempt < 6; attempt++) {` — A designation is unique by construction; a spoken name is not. If this
  sky already has a Grey Sister on the boards, roll again — and if the
  dice keep landing there, ship the designation rather than a second one.
<!-- /note -->

### <a id="s-spokenRock"></a>`spokenRock(rnd)`

function · L369–381

- calls: [`chance`](#s-chance) ×2 · [`familyName`](#s-familyName) · [`forgeWord`](#s-forgeWord) · [`pick`](#s-pick) ×8
- called by: [`rockName`](#s-rockName)

<!-- note:spokenRock -->
- L372 · `if (r < 0.12) return pick(rnd, ROCK_SOLO);` — The fixed list is the smallest branch on purpose — two rocks called
  Wanderer in one session is exactly the problem this replaced.
- L376 · `const who = familyName(LEXICONS.terran, rnd, "woman").split(" ")[0].replace(/-.*$/, "");` — Named for whoever first put it on a chart.
<!-- /note -->

### <a id="s-beaconName"></a>`beaconName(sky, i, rnd=)`

function · **exported** · L383–389

- calls: [`buildBeacon`](#s-buildBeacon) · [`offensive`](#s-offensive)
- called by: [`generateSystem`](generate.js.md#s-generateSystem) _js/world/generate.js_

<!-- note:beaconName -->
---- odds and ends ------------------------------------------------------

Beacons, buoys and other hardware somebody bolted a label to.
<!-- /note -->

### <a id="s-buildBeacon"></a>`buildBeacon(sky, i, rnd)`

function · L391–399

- calls: [`forgeWord`](#s-forgeWord) · [`pick`](#s-pick)
- called by: [`beaconName`](#s-beaconName)

<!-- note:buildBeacon -->
<!-- /note -->
