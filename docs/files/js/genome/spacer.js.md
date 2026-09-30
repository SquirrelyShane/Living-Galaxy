# js/genome/spacer.js

[index](../../../README.md) · 419 lines · 49 symbols · 3 imports · 13 importers

## About

<!-- note:@file -->
Living Galaxy — the SPACER genome.

The genome engine ships ten entity types, all of them built for a fantasy
bestiary. None of them is a person who lives in a hull. This registers two
that are:

  spacer — a crewable human being. 123 of the 256 gene slots, chosen so
           that every active gene is read by something the sim already
           simulates: watch performance, skill ceilings, temperament, who
           they get on with, how they age, what a child inherits. No magic,
           no elemental affinity, no claws, no photosynthesis — those slots
           stay null, which means they cost nothing to store and can never
           leak into a phenotype.
  synth  — a machine that holds a post. The same frame minus fertility,
           hormones, digestion and circadian drift, so a robot can run the
           same decision graph without ever courting anyone or getting
           hungry.

Because only the active slots carry meaning, `packGenome` writes just those
— 123 bytes instead of 256, a 168-character string instead of 359. A ledger
of 500 people costs about 90 KB rather than 190 KB. `encodeGenome` from the
engine still works and still round-trips with the genome-agent project;
this is the compact form CRADLE stores.

- L294 · `export const SEX_SPLIT = { female: 0.615, male: 0.625 };` — the band between is intersex
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./genome-256.js` | `*` as `G` | [js/genome/genome-256.js](genome-256.js.md) |
| 2 | `./context.js` | `deriveCapabilities`, `expressContextual`, `createContext`, `lifeStage`, `expectedLifespan` | [js/genome/context.js](context.js.md) |
| 3 | `../crew/races.js` | `RACES` | [js/crew/races.js](../crew/races.js.md) |

## Imported by

- [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md) — `kinLabel`, `KIN_BLOCK`
- [js/crew/captive.js](../crew/captive.js.md) — `GENE`
- [js/crew/children.js](../crew/children.js.md) — `skillAptitude`, `genomeTraits`, `kinship`
- [js/crew/deckmind.js](../crew/deckmind.js.md) — `SPACER`, `SYNTH`, `createSpacer`, `packGenome`, `unpackGenome`, `fingerprint`, `capabilities`, `phenotype`, `createContext`, `genomeTraits`, `skillAptitude`, `expectedLifespan`
- [js/crew/family.js](../crew/family.js.md) — `breed`, `packGenome`, `fingerprint`, `genomeTraits`, `genomeIdentity`, `genomePulse`, `genomeTells`, `skillAptitude`, `SPACER`, `kinship`
- [js/crew/ledger.js](../crew/ledger.js.md) — `genomeCompat`, `kinship`, `KIN_BLOCK`, `kinLabel`
- [js/crew/romance.js](../crew/romance.js.md) — `genomeCompat`, `kinship`, `unpackGenome`, `KIN_BLOCK`, `GENE`
- [js/crew/talk-wants.js](../crew/talk-wants.js.md) — `kinLabel`
- [js/npc/cradle.js](../npc/cradle.js.md) — `SPACER`, `SYNTH`, `createSpacer`, `packGenome`, `unpackGenome`, `fingerprint`, `genomeTraits`, `genomeIdentity`, `genomePulse`, `genomeTells`, `skillAptitude`, `tellLine`
- [js/station/stationlife.js](../station/stationlife.js.md) — `breed`, `packGenome`, `fingerprint`, `genomeTraits`, `genomeIdentity`, `skillAptitude`, `SPACER`, `kinship`
- test/bounty.test.mjs _(outside js/)_ — `createSpacer`, `genomeIdentity`, `SEX_SPLIT`, `NONBINARY_SHARE`
- test/gender.test.mjs _(outside js/)_ — `genomeIdentity`, `SEX_SPLIT`, `NONBINARY_SHARE`, `createSpacer`
- test/genome.test.mjs _(outside js/)_ — `SPACER`, `SYNTH`, `SPACER_RANGES`, `createSpacer`, `packGenome`, `unpackGenome`, `fingerprint`, `capabilities`, `genomeTraits`, `genomeIdentity`, `genomeTells`, `skillAptitude`, `genomeCompat`, `breed`, `kinship`, `raceProfile`, `tellLine`, `phenotype`, `createContext`

## Exports

- [`SPACER_RANGES`](#s-SPACER_RANGES) · const — used by test/genome.test.mjs
- [`SYNTH_RANGES`](#s-SYNTH_RANGES) · const — **no importer in scanned roots**
- [`SPACER`](#s-SPACER) · const — used by [js/crew/deckmind.js](../crew/deckmind.js.md), [js/crew/family.js](../crew/family.js.md), [js/npc/cradle.js](../npc/cradle.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/genome.test.mjs
- [`SYNTH`](#s-SYNTH) · const — used by [js/crew/deckmind.js](../crew/deckmind.js.md), [js/npc/cradle.js](../npc/cradle.js.md), test/genome.test.mjs
- [`activeIndices`](#s-activeIndices) · function — **no importer in scanned roots**
- [`SKILL_GENES`](#s-SKILL_GENES) — **no importer in scanned roots**
- [`raceProfile`](#s-raceProfile) · function — used by test/genome.test.mjs
- [`createSpacer`](#s-createSpacer) · function — used by [js/crew/deckmind.js](../crew/deckmind.js.md), [js/npc/cradle.js](../npc/cradle.js.md), test/bounty.test.mjs, test/gender.test.mjs, test/genome.test.mjs
- [`PACK_VERSION`](#s-PACK_VERSION) · const — **no importer in scanned roots**
- [`packGenome`](#s-packGenome) · function — used by [js/crew/deckmind.js](../crew/deckmind.js.md), [js/crew/family.js](../crew/family.js.md), [js/npc/cradle.js](../npc/cradle.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/genome.test.mjs
- [`unpackGenome`](#s-unpackGenome) · function — used by [js/crew/deckmind.js](../crew/deckmind.js.md), [js/crew/romance.js](../crew/romance.js.md), [js/npc/cradle.js](../npc/cradle.js.md), test/genome.test.mjs
- [`fingerprint`](#s-fingerprint) · function — used by [js/crew/deckmind.js](../crew/deckmind.js.md), [js/crew/family.js](../crew/family.js.md), [js/npc/cradle.js](../npc/cradle.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/genome.test.mjs
- [`genomeTraits`](#s-genomeTraits) · function — used by [js/crew/children.js](../crew/children.js.md), [js/crew/deckmind.js](../crew/deckmind.js.md), [js/crew/family.js](../crew/family.js.md), [js/npc/cradle.js](../npc/cradle.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/genome.test.mjs
- [`skillAptitude`](#s-skillAptitude) · function — used by [js/crew/children.js](../crew/children.js.md), [js/crew/deckmind.js](../crew/deckmind.js.md), [js/crew/family.js](../crew/family.js.md), [js/npc/cradle.js](../npc/cradle.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/genome.test.mjs
- [`genomePulse`](#s-genomePulse) · function — used by [js/crew/family.js](../crew/family.js.md), [js/npc/cradle.js](../npc/cradle.js.md)
- [`SEX_SPLIT`](#s-SEX_SPLIT) · const — used by test/bounty.test.mjs, test/gender.test.mjs
- [`NONBINARY_SHARE`](#s-NONBINARY_SHARE) · const — used by test/bounty.test.mjs, test/gender.test.mjs
- [`TRANS_SHARE`](#s-TRANS_SHARE) · const — **no importer in scanned roots**
- [`genomeIdentity`](#s-genomeIdentity) · function — used by [js/crew/family.js](../crew/family.js.md), [js/npc/cradle.js](../npc/cradle.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/bounty.test.mjs, test/gender.test.mjs, test/genome.test.mjs
- [`genomeTells`](#s-genomeTells) · function — used by [js/crew/family.js](../crew/family.js.md), [js/npc/cradle.js](../npc/cradle.js.md), test/genome.test.mjs
- [`tellLine`](#s-tellLine) · function — used by [js/npc/cradle.js](../npc/cradle.js.md), test/genome.test.mjs
- [`capabilities`](#s-capabilities) · function — used by [js/crew/deckmind.js](../crew/deckmind.js.md), test/genome.test.mjs
- [`phenotype`](#s-phenotype) · function — used by [js/crew/deckmind.js](../crew/deckmind.js.md), test/genome.test.mjs
- `createContext` — used by [js/crew/deckmind.js](../crew/deckmind.js.md), test/genome.test.mjs
- `lifeStage` — **no importer in scanned roots**
- `expectedLifespan` — used by [js/crew/deckmind.js](../crew/deckmind.js.md)
- [`kinship`](#s-kinship) · function — used by [js/crew/children.js](../crew/children.js.md), [js/crew/family.js](../crew/family.js.md), [js/crew/ledger.js](../crew/ledger.js.md), [js/crew/romance.js](../crew/romance.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/genome.test.mjs
- [`KIN_BLOCK`](#s-KIN_BLOCK) · const — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/ledger.js](../crew/ledger.js.md), [js/crew/romance.js](../crew/romance.js.md)
- [`kinLabel`](#s-kinLabel) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/ledger.js](../crew/ledger.js.md), [js/crew/talk-wants.js](../crew/talk-wants.js.md)
- [`genomeCompat`](#s-genomeCompat) · function — used by [js/crew/ledger.js](../crew/ledger.js.md), [js/crew/romance.js](../crew/romance.js.md), test/genome.test.mjs
- [`breed`](#s-breed) · function — used by [js/crew/family.js](../crew/family.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/genome.test.mjs
- `engine` — **no importer in scanned roots**
- `GENE` — used by [js/crew/captive.js](../crew/captive.js.md), [js/crew/romance.js](../crew/romance.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-SPACER_RANGES"></a>`SPACER_RANGES`

const · **exported** · L7–55

<!-- note:SPACER_RANGES -->
---- the masks ----------------------------------------------------------
Ranges, not a scatter of indices, because activeRanges is what the engine's
mask builder takes. Singletons are written [i, i] on purpose — they are the
genes that earned their slot on their own.

- L8 · `[0, 11],` — endurance / strength / agility / intellect families
- L9 · `[12, 17],` — immunity, metabolism
- L10 · `[18, 22],` — risk, curiosity, social, aggression, discipline
- L11 · `[23, 25],` — learning rate, memory, pattern recognition
- L12 · `[26, 29],` — height, frame, build
- L13 · `[30, 32],` — skin, hair, eyes — the visible tells
- L14 · `[33, 35],` — fertility, longevity, mutation rate
- L15 · `[36, 38],` — recessive carriers — what skips a generation
- L16 · `[39, 41],` — stress response, adaptability, instability
- L17 · `[42, 46],` — vision, hearing, olfaction, touch, low-light
- L18 · `[50, 50],` — toxin detection — the nose for a bad seal
- L19 · `[51, 55],` — creativity, empathy, focus, strategy, intuition
- L20 · `[56, 59],` — mating preference, parental care, territoriality, cooperation
- L21 · `[60, 63],` — plasticity, epigenetic memory, dominance, expression rate
- L22 · `[66, 66],` — cortisol
- L23 · `[70, 71],` — oxytocin, adrenaline
- L24 · `[74, 75],` — aging rate, regeneration
- L25 · `[79, 79],` — epigenetic reset
- L26 · `[88, 89],` — thermal tolerance, pressure/g tolerance
- L27 · `[95, 95],` — urban adaptation — station-born
- L28 · `[96, 103],` — the eight cognition sub-types
- L29 · `[104, 109],` — dominance, submissiveness, altruism, kin recognition, reciprocity, coalitions
- L30 · `[111, 111],` — status signalling
- L31 · `[112, 115],` — monogamy, polygamy, parental investment, mate choice
- L32 · `[117, 117],` — gamete quality
- L33 · `[120, 121],` — global mutation, epigenetic stability
- L34 · `[126, 127],` — cultural meme, phylogenetic marker
- L35 · `[134, 135],` — burst and sustained speed
- L36 · `[136, 136],` — pain threshold
- L37 · `[138, 140],` — fatigue resistance, recovery, sleep efficiency
- L38 · `[142, 142],` — inflammation control
- L39 · `[144, 145],` — circadian phase and rigidity
- L40 · `[149, 149],` — time perception
- L41 · `[153, 154],` — vocal power, vocal complexity
- L42 · `[156, 156],` — body language
- L43 · `[164, 164],` — threat display
- L44 · `[166, 166],` — pack tactics
- L45 · `[170, 172],` — shelter drive, hoarding, flee threshold
- L46 · `[174, 174],` — play drive
- L47 · `[177, 177],` — path memory
- L48 · `[179, 180],` — dead reckoning, celestial navigation
- L49 · `[182, 183],` — depth perception, spatial mapping
- L50 · `[206, 206],` — toxin metabolism
- L51 · `[209, 209],` — fat storage
- L52 · `[232, 232],` — bone density
- L53 · `[247, 247],` — body symmetry
- L54 · `[255, 255],` — sex determination
<!-- /note -->

### <a id="s-SYNTH_RANGES"></a>`SYNTH_RANGES`

const · **exported** · L57–64

<!-- note:SYNTH_RANGES -->
A machine keeps the frame and the mind and loses the biology.
<!-- /note -->

### <a id="s-SPACER"></a>`SPACER`

const · **exported** · L80–80

<!-- note:SPACER -->
<!-- /note -->

### <a id="s-SYNTH"></a>`SYNTH`

const · **exported** · L81–81

<!-- note:SYNTH -->
<!-- /note -->

### <a id="s-_activeIdx"></a>`_activeIdx`

const · L83–83

<!-- note:_activeIdx -->
Active gene indices for a type, ascending. Cached — the codec runs per record.
<!-- /note -->

### <a id="s-activeIndices"></a>`activeIndices(typeId=)`

function · **exported** · L84–92

- calls: [`activeMask`](genome-256.js.md#s-activeMask) _js/genome/genome-256.js_
- called by: [`fingerprint`](#s-fingerprint) · [`packGenome`](#s-packGenome) · [`unpackGenome`](#s-unpackGenome)

<!-- note:activeIndices -->
<!-- /note -->

### <a id="s-SKILL_GENES"></a>`SKILL_GENES`

const · **exported** · L94–125

<!-- note:SKILL_GENES -->
---- race bias ----------------------------------------------------------
A race in Living Galaxy is already a set of multipliers that the sim honours
(races.js). Rather than invent a second personality system, the same
numbers bend the genome: a race with a strong `lock` bends pattern
recognition and reaction, one with cheap `life` bends metabolism down, and
every skill affinity bends the genes that skill reads from. So an Eridian
navigator is genetically a navigator, not a Terran wearing a label.
<!-- /note -->

### <a id="s-TRAIT_GENES"></a>`TRAIT_GENES`

const · L128–138

<!-- note:TRAIT_GENES -->
The multiplier genes a race trait bends, and which way.
<!-- /note -->

### <a id="s-SPACER_BASELINE"></a>`SPACER_BASELINE`

const · L140–148

<!-- note:SPACER_BASELINE -->
Species baseline. Hands, speech and abstraction are what a person IS, not a
lucky roll — a spacer who drew 0.06 manual dexterity would be a spacer with
no hands. These genes get a human floor, and the individual variation sits
on top of it.

- L141 · `[X.GENDER]: [0.5, 2],` — A bell curve on the sex gene is what made one in five people intersex.
  Spread 2 flattens the engine's three-uniform average across the whole
  range, so the two sides come out even and the band between is narrow.
<!-- /note -->

### <a id="s-_profiles"></a>`_profiles`

const · L150–150

<!-- note:_profiles -->
<!-- /note -->

### <a id="s-raceProfile"></a>`raceProfile(raceId)`

function · **exported** · L152–184

- via [js/crew/races.js](../crew/races.js.md): `RACES.find`
- called by: [`createSpacer`](#s-createSpacer)

<!-- note:raceProfile -->
Sparse `{ geneIndex: [mean, spread] }` bias for a race id. Built once per race.

- L160 · `const off = Math.max(-0.4, Math.min(0.4, (v - 1) * 0.9));` — traits are multipliers around 1; 1.2 is a strong race, 0.85 a weak one
- L175 · `if (race.id === "tsynth") {` — the foundry lines are built to a specification: less spread, more uniform
<!-- /note -->

### <a id="s-createSpacer"></a>`createSpacer(seed, raceId=, typeId=)`

function · **exported** · L186–188

- calls: [`createGenome`](genome-256.js.md#s-createGenome) _js/genome/genome-256.js_ · [`raceProfile`](#s-raceProfile)
- called by: [`bodyOf`](../crew/deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_ · [`speciesBaseline`](#s-speciesBaseline) · [`ensureGenome`](../npc/cradle.js.md#s-ensureGenome) _js/npc/cradle.js_ · [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_

<!-- note:createSpacer -->
Deterministic genome for a person. Same seed + race = same body, always.
<!-- /note -->

### <a id="s-B64"></a>`B64`

const · L190–190

<!-- note:B64 -->
---- the compact codec ---------------------------------------------------
`p1:&lt;type>:&lt;base64 of the active bytes>:&lt;checksum>` — only the slots the
type activates, so the string length tracks how much genome the type
actually uses. Decoding rebuilds a full 256-slot Float32Array with the
inactive slots nulled, which is the shape everything downstream expects.
<!-- /note -->

### <a id="s-B64I"></a>`B64I`

const · L191–191

<!-- note:B64I -->
<!-- /note -->

### <a id="s-PACK_VERSION"></a>`PACK_VERSION`

const · **exported** · L192–192

<!-- note:PACK_VERSION -->
<!-- /note -->

### <a id="s-bytesToB64"></a>`bytesToB64(bytes)`

function · L194–204

- called by: [`packGenome`](#s-packGenome)

<!-- note:bytesToB64 -->
<!-- /note -->

### <a id="s-b64ToBytes"></a>`b64ToBytes(str, len)`

function · L206–218

- called by: [`unpackGenome`](#s-unpackGenome)

<!-- note:b64ToBytes -->
<!-- /note -->

### <a id="s-packGenome"></a>`packGenome(genome, typeId=)`

function · **exported** · L220–228

- calls: [`activeIndices`](#s-activeIndices) · [`bytesToB64`](#s-bytesToB64)
- called by: [`bodyOf`](../crew/deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_ · [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ · [`ensureGenome`](../npc/cradle.js.md#s-ensureGenome) _js/npc/cradle.js_ · [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_ · [`bearChild`](../station/stationlife.js.md#s-bearChild) _js/station/stationlife.js_

<!-- note:packGenome -->
Genome → the short string CRADLE stores.
<!-- /note -->

### <a id="s-unpackGenome"></a>`unpackGenome(str)`

function · **exported** · L230–247

- calls: [`activeIndices`](#s-activeIndices) · [`b64ToBytes`](#s-b64ToBytes)
- called by: [`bodyOf`](../crew/deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_ · [`genomeFor`](../crew/romance.js.md#s-genomeFor) _js/crew/romance.js_ · [`ensureGenome`](../npc/cradle.js.md#s-ensureGenome) _js/npc/cradle.js_ · [`genomeOf`](../npc/cradle.js.md#s-genomeOf) _js/npc/cradle.js_

<!-- note:unpackGenome -->
The short string → { genome, typeId }. Throws on a corrupt or foreign payload.
<!-- /note -->

### <a id="s-fingerprint"></a>`fingerprint(genome, typeId=)`

function · **exported** · L249–254

- calls: [`activeIndices`](#s-activeIndices)
- called by: [`bodyOf`](../crew/deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_ · [`stepHand`](../crew/deckmind.js.md#s-stepHand) _js/crew/deckmind.js_ · [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ · [`ensureGenome`](../npc/cradle.js.md#s-ensureGenome) _js/npc/cradle.js_ · [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_ · [`bearChild`](../station/stationlife.js.md#s-bearChild) _js/station/stationlife.js_

<!-- note:fingerprint -->
Short, stable, human-readable id for a genome — shown on the crew sheet and
quoted in the ledger. The engine's own fingerprint is 16 bits, which
collides inside a ledger of a few hundred people; this is a 32-bit hash over
the active slots only, so two people with the same code really do have the
same genome for this entity type.
<!-- /note -->

### <a id="s-clamp01"></a>`clamp01(v)`

function · L256–256

- called by: [`genomeTraits`](#s-genomeTraits) ×5

<!-- note:clamp01 -->
---- reading a genome into the game --------------------------------------
<!-- /note -->

### <a id="s-r2"></a>`r2(v)`

function · L257–257

- called by: [`genomeCompat`](#s-genomeCompat) · [`genomeIdentity`](#s-genomeIdentity) · [`genomeTells`](#s-genomeTells) · [`genomeTraits`](#s-genomeTraits) ×5 · [`kinship`](#s-kinship) · [`skillAptitude`](#s-skillAptitude)

<!-- note:r2 -->
<!-- /note -->

### <a id="s-genomeTraits"></a>`genomeTraits(genome)`

function · **exported** · L259–268

- calls: [`clamp01`](#s-clamp01) ×5 · [`genomeTraits>g`](#s-genomeTraits-g) ×17 · [`r2`](#s-r2) ×5
- called by: [`inheritance`](../crew/children.js.md#s-inheritance) _js/crew/children.js_ · [`bodyOf`](../crew/deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_ · [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ · [`ensureGenome`](../npc/cradle.js.md#s-ensureGenome) _js/npc/cradle.js_ · [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_ · [`bearChild`](../station/stationlife.js.md#s-bearChild) _js/station/stationlife.js_

<!-- note:genomeTraits -->
The five axes CRADLE has always carried, grown from genes instead of a die
roll. Existing records keep their numbers — this is what new ones get, and
what a child inherits.
<!-- /note -->

#### <a id="s-genomeTraits-g"></a>`genomeTraits>g(i)`

function · L260–260

- called by: [`genomeTraits`](#s-genomeTraits) ×17

<!-- note:genomeTraits>g -->
<!-- /note -->

### <a id="s-skillAptitude"></a>`skillAptitude(genome)`

function · **exported** · L270–278

- calls: [`r2`](#s-r2)
- called by: [`inheritance`](../crew/children.js.md#s-inheritance) _js/crew/children.js_ ×2 · [`bodyOf`](../crew/deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_ · [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ ×2 · [`ensureGenome`](../npc/cradle.js.md#s-ensureGenome) _js/npc/cradle.js_ · [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_ · [`bearChild`](../station/stationlife.js.md#s-bearChild) _js/station/stationlife.js_

<!-- note:skillAptitude -->
0..1 per skill — the ceiling this body sets on what they can learn.
<!-- /note -->

### <a id="s-genomePulse"></a>`genomePulse(genome)`

function · **exported** · L280–283

- calls: [`genomePulse>g`](#s-genomePulse-g) ×3
- called by: [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ · [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_

<!-- note:genomePulse -->
Resting heart rate, from metabolism and the clock. The old `pulse` field.
<!-- /note -->

#### <a id="s-genomePulse-g"></a>`genomePulse>g(i)`

function · L281–281

- called by: [`genomePulse`](#s-genomePulse) ×3

<!-- note:genomePulse>g -->
<!-- /note -->

### <a id="s-genomeRoll"></a>`genomeRoll(genome, salt=)`

function · L285–292

- called by: [`genomeIdentity`](#s-genomeIdentity)

<!-- note:genomeRoll -->
A stable 0..1 read off a genome that is not any one gene — for the rolls
that should be deterministic per person without spending a gene slot on
them. Same genome, same number, on every device.
<!-- /note -->

### <a id="s-SEX_SPLIT"></a>`SEX_SPLIT`

const · **exported** · L294–294

<!-- note:SEX_SPLIT -->
Identity from the genome.

Two different things, which v2 ran together and got wrong. GENDER is the
body's SEX, and the engine draws every gene on a bell curve — so a band wide
enough to mean anything swallowed a fifth of the population and the sky came
out 40/40/20. The sex is now read off the same gene against a flat
distribution (`SEX_UNIFORM` in the spacer profile), which puts it back at
roughly even with a narrow intersex band.

GENDER IDENTITY is a separate roll off the genome as a whole: the large
majority of people are the gender their body is, a few are not, and a few
are neither. Attraction is its own gene again on top of that.

Where the sex gene is cut.

This used to be an even split and the measured sky came out 46/48/6, which
is correct and still read as male-dominant in play — because a sky is not a
census, it is the forty faces you actually meet, and the two things that
decide how those forty read are the NAME and whether anything on screen ever
says otherwise. Both of those are fixed elsewhere (names.js dropped the
ambiguous-ending rate, and the rosters, the hiring hall, the SHIPS directory
and the open channel all carry pronouns now).

This is the other half, asked for directly: the cut moved so the sky runs
about 55% women / 40% men / 5% nonbinary. It is one number, it is the only
number that sets the ratio, and it is here rather than spread across the
generators so it can be moved back in one edit.
<!-- /note -->

### <a id="s-NONBINARY_SHARE"></a>`NONBINARY_SHARE`

const · **exported** · L295–295

<!-- note:NONBINARY_SHARE -->
<!-- /note -->

### <a id="s-TRANS_SHARE"></a>`TRANS_SHARE`

const · **exported** · L296–296

<!-- note:TRANS_SHARE -->
<!-- /note -->

### <a id="s-genomeIdentity"></a>`genomeIdentity(genome, fallbackRnd=)`

function · **exported** · L298–322

- calls: [`genomeIdentity>g`](#s-genomeIdentity-g) ×6 · [`genomeRoll`](#s-genomeRoll) · [`r2`](#s-r2)
- called by: [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ · [`ensureIdentity`](../npc/cradle.js.md#s-ensureIdentity) _js/npc/cradle.js_ ×2 · [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_ · [`bearChild`](../station/stationlife.js.md#s-bearChild) _js/station/stationlife.js_

<!-- note:genomeIdentity -->
<!-- /note -->

#### <a id="s-genomeIdentity-g"></a>`genomeIdentity>g(i)`

function · L299–299

- called by: [`genomeIdentity`](#s-genomeIdentity) ×6

<!-- note:genomeIdentity>g -->
<!-- /note -->

### <a id="s-genomeTells"></a>`genomeTells(genome)`

function · **exported** · L324–338

- calls: [`genomeTells>g`](#s-genomeTells-g) ×10 · [`genomeTells>pick`](#s-genomeTells-pick) ×5 · [`r2`](#s-r2)
- called by: [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ · [`tellLine`](#s-tellLine) · [`ensureGenome`](../npc/cradle.js.md#s-ensureGenome) _js/npc/cradle.js_ · [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_

<!-- note:genomeTells -->
The things you can see across a mess hall. Used by the crew sheet and talk.
<!-- /note -->

#### <a id="s-genomeTells-g"></a>`genomeTells>g(i)`

function · L325–325

- called by: [`genomeTells`](#s-genomeTells) ×10

<!-- note:genomeTells>g -->
<!-- /note -->

#### <a id="s-genomeTells-pick"></a>`genomeTells>pick(v, list)`

function · L326–326

- called by: [`genomeTells`](#s-genomeTells) ×5

<!-- note:genomeTells>pick -->
<!-- /note -->

### <a id="s-tellLine"></a>`tellLine(genome)`

function · **exported** · L340–343

- calls: [`genomeTells`](#s-genomeTells)
- called by: [`looksLine`](../npc/cradle.js.md#s-looksLine) _js/npc/cradle.js_

<!-- note:tellLine -->
One line of it, for a card.
<!-- /note -->

### <a id="s-FLOOR"></a>`FLOOR`

const · L345–348

<!-- note:FLOOR -->
Capabilities every registered crew type has by construction. The engine
derives presence from the mask and degree from the genes; for a person the
presence of hands and language is not in question, so these are floored
true and the score is left alone to say how much of it they have.
<!-- /note -->

### <a id="s-capabilities"></a>`capabilities(genome, typeId=)`

function · **exported** · L350–358

- calls: [`deriveCapabilities`](context.js.md#s-deriveCapabilities) _js/genome/context.js_
- called by: [`bodyOf`](../crew/deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_

<!-- note:capabilities -->
What this body and mind are able to attempt. Gates whole branches of the deck graph.
<!-- /note -->

### <a id="s-phenotype"></a>`phenotype(genome, typeId=, ctx=)`

function · **exported** · L360–362

- calls: [`createContext`](context.js.md#s-createContext) _js/genome/context.js_ · [`expressContextual`](context.js.md#s-expressContextual) _js/genome/context.js_
- called by: [`buildContext`](../crew/deckmind.js.md#s-buildContext) _js/crew/deckmind.js_

<!-- note:phenotype -->
Contextual phenotype for a hand standing in a specific hull, right now.
<!-- /note -->

### <a id="s-_baseline"></a>`_baseline`

const · L366–366

<!-- note:_baseline -->
The engine's relatedness() is a raw similarity: two unrelated people of the
same species already read about 0.5, because they are the same species. What
the game wants is the coefficient of relationship — 0 for strangers, 0.5 for
a parent or a full sibling, 0.25 for a half-sibling — so the species baseline
is measured once per entity type and divided out. The measurement is over
fixed seeds, so it is the same number on every device.
<!-- /note -->

### <a id="s-speciesBaseline"></a>`speciesBaseline(typeId)`

function · L367–379

- calls: [`relatedness`](genome-256.js.md#s-relatedness) _js/genome/genome-256.js_ · [`createSpacer`](#s-createSpacer)
- via [js/crew/races.js](../crew/races.js.md): `RACES.slice`, `RACES.slice.map`
- called by: [`kinship`](#s-kinship)

<!-- note:speciesBaseline -->
<!-- /note -->

### <a id="s-kinship"></a>`kinship(a, b, typeId=)`

function · **exported** · L381–386

- calls: [`relatedness`](genome-256.js.md#s-relatedness) _js/genome/genome-256.js_ · [`r2`](#s-r2) · [`speciesBaseline`](#s-speciesBaseline)
- called by: [`inheritance`](../crew/children.js.md#s-inheritance) _js/crew/children.js_ ×2 · [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ ×2 · [`relatedTo`](../crew/ledger.js.md#s-relatedTo) _js/crew/ledger.js_ · [`kinBetween`](../crew/romance.js.md#s-kinBetween) _js/crew/romance.js_ · [`kinOK`](../station/stationlife.js.md#s-kinOK) _js/station/stationlife.js_

<!-- note:kinship -->
Coefficient of relationship, 0..1. 0.5 is a parent or a full sibling.
<!-- /note -->

### <a id="s-KIN_BLOCK"></a>`KIN_BLOCK`

const · **exported** · L388–388

<!-- note:KIN_BLOCK -->
Above this, two people are family and the deck graph will not court them.
<!-- /note -->

### <a id="s-kinLabel"></a>`kinLabel(k)`

function · **exported** · L390–396

- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ · [`kinLineBetween`](../crew/ledger.js.md#s-kinLineBetween) _js/crew/ledger.js_ · [`WANT_TOPICS.say~3`](../crew/talk-wants.js.md#s-WANT_TOPICS-say-3) _js/crew/talk-wants.js_

<!-- note:kinLabel -->
"half-sibling" and the rest, for the crew sheet.
<!-- /note -->

### <a id="s-genomeCompat"></a>`genomeCompat(ga, gb)`

function · **exported** · L398–413

- calls: [`genomeCompat>both`](#s-genomeCompat-both) ×2 · [`genomeCompat>d`](#s-genomeCompat-d) ×5 · [`r2`](#s-r2)
- called by: [`compat`](../crew/ledger.js.md#s-compat) _js/crew/ledger.js_ · [`attraction`](../crew/romance.js.md#s-attraction) _js/crew/romance.js_

<!-- note:genomeCompat -->
How well two people fit, from their genomes rather than five rounded
numbers: shared outlook helps, opposite clocks help (someone has to hold
the other watch), two dominants clash, two hoarders clash over one hold.
−5…+5, the same scale crew.js's compat() has always spoken.

- L403 · `c += (1 - d(X.COOPERATION)) * 1.6;` — the same idea of a favour owed
- L405 · `c += both(X.EMPATHY) * 1.2;` — either one of them noticing helps
- L406 · `c += d(X.CIRCADIAN_PHASE) * 0.9;` — opposite clocks share a hull well
- L407 · `c -= d(X.DISCIPLINE) * 1.4;` — one tidy, one not: this is the fight
- L411 · `c -= d(X.CULTURAL_MEME) * 0.6;` — they were raised on different decks
<!-- /note -->

#### <a id="s-genomeCompat-d"></a>`genomeCompat>d(i)`

function · L400–400

- called by: [`genomeCompat`](#s-genomeCompat) ×5

<!-- note:genomeCompat>d -->
<!-- /note -->

#### <a id="s-genomeCompat-both"></a>`genomeCompat>both(i)`

function · L401–401

- called by: [`genomeCompat`](#s-genomeCompat) ×2

<!-- note:genomeCompat>both -->
<!-- /note -->

### <a id="s-breed"></a>`breed(gA, gB, seed, typeId=)`

function · **exported** · L415–417

- calls: [`crossover`](genome-256.js.md#s-crossover) _js/genome/genome-256.js_
- called by: [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ · [`safeBreed`](../station/stationlife.js.md#s-safeBreed) _js/station/stationlife.js_

<!-- note:breed -->
A child of two people. Real heredity — blocks, dominance, mutation, lineage stamp.
<!-- /note -->

## Module-level calls

- calls: [`registerEntityType`](genome-256.js.md#s-registerEntityType) _js/genome/genome-256.js_
