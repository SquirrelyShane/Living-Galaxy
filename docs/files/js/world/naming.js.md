# js/world/naming.js

[index](../../../README.md) · 70 lines · 15 symbols · 2 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY — the seam between the name forge and the vendored pools.

js/world/names.js is the forge: phoneme lexicons per tongue, family shapes that
carry the lore, survey-year catalogue conventions. It is not going anywhere
and most of the sky is still named by it. This file exists because two
corners of the naming system were not forged at all — they were lookup
tables — and they had run out.

WHAT WAS MEASURED (0.3.32, before):

  Ports came from 5 sector prefixes × 7 suffixes = 35 names per sector,
  175 in the whole game. Across twelve systems, 42% of ports carried a name
  another port also had, and 20% of eight-port systems had a duplicate
  inside one system.

  Terran people drew a curated given name 62% of the time from a pool of
  122, and a surname from a flat list of 65. Over three thousand terrans:
  "Piotr" 37 times, 65 distinct surnames — and since a vessel's callsign is
  built from its captain's surname, the board repeated with them.

WHAT THIS DOES NOT TOUCH. The alien tongues measured ~2,900 distinct first
names in 3,000 and are left exactly alone — a korrash called "Aaliyah
Aardema" would be a bug, not a fix. Nor are the deliberate family SHAPES:
the vantari 12×12 compound (144), the ashwalker's, and the veyd having no
family name at all are lore, not small pools that need filling.

The vendored pools and their licences are in js/vendor/stellar-names/.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../vendor/stellar-names/index.js` | `NameGenerator` | [js/vendor/stellar-names/index.js](../vendor/stellar-names/index.js.md) |
| 2 | `../vendor/stellar-names/classified-names.js` | `CLASSIFIED_NAMES` | [js/vendor/stellar-names/classified-names.js](../vendor/stellar-names/classified-names.js.md) |

## Imported by

- [js/data/lexicons.js](../data/lexicons.js.md) — `HUMAN_GIVEN_M`, `HUMAN_GIVEN_F`, `HUMAN_LAST`
- [js/station/stations.js](../station/stations.js.md) — `stationName`, `openSkyNames`, `reserveNames`
- test/naming.test.mjs _(outside js/)_ — `stationName`, `openSkyNames`, `reserveNames`, `portNameSpace`, `HUMAN_LAST`, `HUMAN_GIVEN_M`, `HUMAN_GIVEN_F`

## Exports

- [`HUMAN_GIVEN_M`](#s-HUMAN_GIVEN_M) · const — used by [js/data/lexicons.js](../data/lexicons.js.md), test/naming.test.mjs
- [`HUMAN_GIVEN_F`](#s-HUMAN_GIVEN_F) · const — used by [js/data/lexicons.js](../data/lexicons.js.md), test/naming.test.mjs
- [`HUMAN_LAST`](#s-HUMAN_LAST) · const — used by [js/data/lexicons.js](../data/lexicons.js.md), test/naming.test.mjs
- [`openSkyNames`](#s-openSkyNames) · function — used by [js/station/stations.js](../station/stations.js.md), test/naming.test.mjs
- [`reserveNames`](#s-reserveNames) · function — used by [js/station/stations.js](../station/stations.js.md), test/naming.test.mjs
- [`stationName`](#s-stationName) · function — used by [js/station/stations.js](../station/stations.js.md), test/naming.test.mjs
- [`portNameSpace`](#s-portNameSpace) · function — used by test/naming.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-HUMAN_GIVEN_M"></a>`HUMAN_GIVEN_M`

const · **exported** · L4–4

<!-- note:HUMAN_GIVEN_M -->
---- people -------------------------------------------------------------
Offered to js/data/lexicons.js for the tongues whose names are meant to
sound like Earth's. The forge still does the other 38% of the work, so a
terran sky keeps a few invented names in it rather than reading as a
phone book.
<!-- /note -->

### <a id="s-HUMAN_GIVEN_F"></a>`HUMAN_GIVEN_F`

const · **exported** · L5–5

<!-- note:HUMAN_GIVEN_F -->
<!-- /note -->

### <a id="s-HUMAN_LAST"></a>`HUMAN_LAST`

const · **exported** · L6–6

<!-- note:HUMAN_LAST -->
<!-- /note -->

### <a id="s-SECTOR_WORDS"></a>`SECTOR_WORDS`

const · L8–14

<!-- note:SECTOR_WORDS -->
---- ports --------------------------------------------------------------

The sector word is the anchor and it stays: a port called Bastion or Smelt
or Hookfall tells you what kind of place you are docking at before the
market screen does, and that is worth more than raw variety. What was
missing was everything around it.

Three shapes, so a system's roster does not read as one template:

  A  Copper Forge Works        an adjective on the sector word
  B  Smelt Station             the old bare shape, kept so the game still
                               sounds like itself
  C  Meridian-4417 Exchange    a port a company owns and named after itself

C is weighted by sector: a shipping combine builds industrial and civilian
ports, and does not build Hookfall.
<!-- /note -->

### <a id="s-SUFFIX"></a>`SUFFIX`

const · L15–19

<!-- note:SUFFIX -->
the game's own suffixes first, then the ones the vendored list adds
<!-- /note -->

### <a id="s-CORPORATE"></a>`CORPORATE`

const · L20–20

<!-- note:CORPORATE -->
how often a sector's ports are company-built
<!-- /note -->

### <a id="s-namer"></a>`namer`

const · L22–22

<!-- note:namer -->
<!-- /note -->

### <a id="s-namerSeed"></a>`namerSeed`

const · L23–23

<!-- note:namerSeed -->
<!-- /note -->

### <a id="s-openSkyNames"></a>`openSkyNames(skySeed=)`

function · **exported** · L25–29

- calls: [`new NameGenerator`](../vendor/stellar-names/index.js.md#s-NameGenerator) _js/vendor/stellar-names/index.js_
- called by: [`buildStations`](../station/stations.js.md#s-buildStations) _js/station/stations.js_ · [`stationName`](#s-stationName)

<!-- note:openSkyNames -->
Prime the port namer for a sky. Deterministic in the seed, and `unique` is
on, so two ports in one system cannot collide by construction rather than
by being lucky.
<!-- /note -->

### <a id="s-reserveNames"></a>`reserveNames(list)`

function · **exported** · L31–33

- called by: [`gnnStationFor`](../station/stations.js.md#s-gnnStationFor) _js/station/stations.js_ ×2

<!-- note:reserveNames -->
Keep a name off the table — a port already placed, a fixed landmark.
<!-- /note -->

### <a id="s-stationName"></a>`stationName(sector)`

function · **exported** · L35–58

- calls: [`openSkyNames`](#s-openSkyNames) · [`pick`](#s-pick) ×9 · [`stationName>rnd`](#s-stationName-rnd) ×2
- called by: [`name`](../station/stations.js.md#s-name) _js/station/stations.js_

<!-- note:stationName -->
A port name for `sector`.

IT DOES NOT TOUCH THE CALLER'S GENERATOR. The station builder threads one
seeded `rnd` through the whole roster — radii, orbits, mounts, works — and
the first version of this drew from it a VARIABLE number of times depending
on which shape it picked. That shifted every draw after it, so changing a
name changed where the port was, which hull was parked at it and what the
market held: eight suites failed, none of them about names. A name is not
allowed to move a station.

So the words come from the sky's own namer and nothing else. Same sky, same
ports in the same places as before this patch — only better named.

- L45 · `const raw = namer.name("station", { style: "corporate", unique: false });` — C — a company port. The vendored generator owns the house names and
  the hull number, and we take the word off the front of its result.
- L48 · `` out = `${pick(rnd, words)} ${pick(rnd, SUFFIX)}`; `` — B — the bare shape the game shipped with
- L50 · `const word = pick(rnd, words);` — A — an adjective on the sector word. Some sector words are already
  phrases — "The Nail", "Cutter's Rest" — and "Ember The Nail Terminal"
  is not a place. Those take the bare shape instead.
- L57 · `` return `${pick(rnd, words)} ${pick(rnd, SUFFIX)} ${1 + Math.floor(rnd() * 99)}`; `` — forty collisions in a row means the shapes above are exhausted for this
  sector, which the counts say cannot happen — but never hand back a
  duplicate silently, and never throw in the middle of building a sky
<!-- /note -->

#### <a id="s-stationName-rnd"></a>`stationName>rnd()`

function · L39–39

- called by: [`pick`](#s-pick) · [`stationName`](#s-stationName) ×2

<!-- note:stationName>rnd -->
<!-- /note -->

### <a id="s-pick"></a>`pick(rnd, arr)`

function · L60–62

- calls: [`stationName>rnd`](#s-stationName-rnd)
- called by: [`stationName`](#s-stationName) ×9

<!-- note:pick -->
<!-- /note -->

### <a id="s-portNameSpace"></a>`portNameSpace()`

function · **exported** · L64–70

- calls: [`new NameGenerator`](../vendor/stellar-names/index.js.md#s-NameGenerator) _js/vendor/stellar-names/index.js_ · [`portNameSpace>perSector`](#s-portNameSpace-perSector)

<!-- note:portNameSpace -->
How big the port name space actually is, for the tests and the log.
<!-- /note -->

#### <a id="s-portNameSpace-perSector"></a>`portNameSpace>perSector(w)`

function · L66–66

- called by: [`portNameSpace`](#s-portNameSpace)

<!-- note:portNameSpace>perSector -->
<!-- /note -->
