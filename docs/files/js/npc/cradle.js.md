# js/npc/cradle.js

[index](../../../README.md) · 452 lines · 60 symbols · 5 imports · 48 importers

## About

<!-- note:@file -->
LIVING GALAXY experimental — CRADLE.

  Crew Registry And Digital Ledger of Entities

Every person the sky ever produces is born here and filed here: a name, a
race, an origin, a trade and rank, a skill sheet, a personality vector, and
a history that grows as they sail. Hiring halls draw from the ledger before
they invent anyone new, so the hand you dismissed at Foundry Hold can turn
up at Kessler Reach two skies later with the grudge still on record. An NPC
who has held command carries a `brain` — the weights of the neural core
that learned from the way you fly — and that comes with them.

Storage: localStorage on the device (always), plus the relay server's
`/cradle` endpoints when one is present (opt-in shared ledger, see
server.py). Records are plain JSON; `exportLedger()` / `importLedger()`
move them between devices by hand.

- L334 · `const pending = new Map();` — id → record, coalesced: the last write wins
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../careers/complexes.js` | `COMPLEXES`, `RANK_LETTERS` | [js/careers/complexes.js](../careers/complexes.js.md) |
| 2 | `../crew/races.js` | `RACES` | [js/crew/races.js](../crew/races.js.md) |
| 3 | `../world/names.js` | `personName`, `forgeWord` | [js/world/names.js](../world/names.js.md) |
| 4 | `../data/lexicons.js` | `LEXICONS` | [js/data/lexicons.js](../data/lexicons.js.md) |
| 5 | `../genome/spacer.js` | `SPACER`, `SYNTH`, `createSpacer`, `packGenome`, `unpackGenome`, `fingerprint`, `genomeTraits`, `genomeIdentity`, `genomePulse`, `genomeTells`, `skillAptitude`, `tellLine` | [js/genome/spacer.js](../genome/spacer.js.md) |

## Imported by

- [js/comms/comms.js](../comms/comms.js.md) — `cradle`, `traitLine`
- [js/console/panels/corp-town.js](../console/panels/corp-town.js.md) — `cradle`, `traitLine`
- [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md) — `describeNPC`
- [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md) — `cradle`, `looksLine`
- [js/console/panels/crew.js](../console/panels/crew.js.md) — `GENDERS`
- [js/corp/company.js](../corp/company.js.md) — `cradle`
- [js/corp/fleet.js](../corp/fleet.js.md) — `cradle`
- [js/corp/gdb.js](../corp/gdb.js.md) — `cradle`
- [js/crew/bonds.js](../crew/bonds.js.md) — `cradle`
- [js/crew/captive.js](../crew/captive.js.md) — `cradle`
- [js/crew/children.js](../crew/children.js.md) — `cradle`, `genomeOf`
- [js/crew/childtalk.js](../crew/childtalk.js.md) — `cradle`
- [js/crew/deckacts.js](../crew/deckacts.js.md) — `cradle`
- [js/crew/deckmind.js](../crew/deckmind.js.md) — `cradle`, `drawnTo`
- [js/crew/family.js](../crew/family.js.md) — `cradle`, `drawnTo`, `generateNPC`, `genomeOf`, `looksLine`, `GENDERS`, `PRONOUNS`, `TRAIT_AXES`
- [js/crew/heritage.js](../crew/heritage.js.md) — `cradle`
- [js/crew/journal.js](../crew/journal.js.md) — `cradle`
- [js/crew/learn.js](../crew/learn.js.md) — `cradle`
- [js/crew/ledger.js](../crew/ledger.js.md) — `cradle`, `drawnTo`, `ensureIdentity`, `generateNPC`, `genomeOf`
- [js/crew/robots.js](../crew/robots.js.md) — `PRONOUNS`
- [js/crew/romance.js](../crew/romance.js.md) — `cradle`, `drawnTo`
- [js/crew/roster.js](../crew/roster.js.md) — `cradle`
- [js/crew/talk.js](../crew/talk.js.md) — `cradle`, `PRONOUNS`
- [js/crew/talkview.js](../crew/talkview.js.md) — `cradle`, `traitLine`
- [js/interior/boarding.js](../interior/boarding.js.md) — `cradle`, `generateNPC`
- [js/npc/bounty.js](bounty.js.md) — `cradle`, `generateNPC`, `ensureIdentity`
- [js/npc/captain.js](captain.js.md) — `cradle`
- [js/npc/npccrew.js](npccrew.js.md) — `cradle`, `generateNPC`
- [js/npc/speech.js](speech.js.md) — `PRONOUNS`
- [js/npc/traffic.js](traffic.js.md) — `generateNPC`, `cradle`
- [js/station/deckhall.js](../station/deckhall.js.md) — `cradle`
- [js/station/stafflife.js](../station/stafflife.js.md) — `cradle`
- [js/station/staffline.js](../station/staffline.js.md) — `cradle`, `PRONOUNS`
- [js/station/stationlife.js](../station/stationlife.js.md) — `cradle`, `generateNPC`, `drawnTo`, `ensureIdentity`, `genomeOf`, `PRONOUNS`
- [js/ui/creation.js](../ui/creation.js.md) — `releaseEmployed`
- [js/ui/hud.js](../ui/hud.js.md) — `connectCradle`, `disconnectCradle`
- test/beats.test.mjs _(outside js/)_ — `cradle`
- test/bounty.test.mjs _(outside js/)_ — `cradle`, `generateNPC`, `ensureIdentity`, `PRONOUNS`
- test/childtalk.test.mjs _(outside js/)_ — `cradle`
- test/crew-life.test.mjs _(outside js/)_ — `cradle`
- test/experimental.test.mjs _(outside js/)_ — `generateNPC`, `cradle`, `exportLedger`, `importLedger`, `TRAIT_AXES`
- test/gdb.test.mjs _(outside js/)_ — `cradle`, `generateNPC`
- test/gender.test.mjs _(outside js/)_ — `generateNPC`, `ensureIdentity`, `PRONOUNS`, `GENDERS`
- test/genome.test.mjs _(outside js/)_ — `cradle`, `generateNPC`, `ensureGenome`, `genomeOf`, `looksLine`, `CRADLE_VERSION`
- test/line.test.mjs _(outside js/)_ — `cradle`
- test/people.test.mjs _(outside js/)_ — `cradle`
- test/skycrew.test.mjs _(outside js/)_ — `cradle`
- test/skycrew.test.mjs _(outside js/)_ — `generateNPC`

## Exports

- [`CRADLE_VERSION`](#s-CRADLE_VERSION) · const — used by test/genome.test.mjs
- [`TRAIT_AXES`](#s-TRAIT_AXES) · const — used by [js/crew/family.js](../crew/family.js.md), test/experimental.test.mjs
- [`GENDERS`](#s-GENDERS) · const — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/family.js](../crew/family.js.md), test/gender.test.mjs
- [`PRONOUNS`](#s-PRONOUNS) · const — used by [js/crew/family.js](../crew/family.js.md), [js/crew/robots.js](../crew/robots.js.md), [js/crew/talk.js](../crew/talk.js.md), [js/npc/speech.js](speech.js.md), [js/station/staffline.js](../station/staffline.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/bounty.test.mjs, test/gender.test.mjs
- [`rollIdentity`](#s-rollIdentity) · function — **no importer in scanned roots**
- [`ensureIdentity`](#s-ensureIdentity) · function — used by [js/crew/ledger.js](../crew/ledger.js.md), [js/npc/bounty.js](bounty.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/bounty.test.mjs, test/gender.test.mjs
- [`drawnTo`](#s-drawnTo) · function — used by [js/crew/deckmind.js](../crew/deckmind.js.md), [js/crew/family.js](../crew/family.js.md), [js/crew/ledger.js](../crew/ledger.js.md), [js/crew/romance.js](../crew/romance.js.md), [js/station/stationlife.js](../station/stationlife.js.md)
- [`generateNPC`](#s-generateNPC) · function — used by [js/crew/family.js](../crew/family.js.md), [js/crew/ledger.js](../crew/ledger.js.md), [js/interior/boarding.js](../interior/boarding.js.md), [js/npc/bounty.js](bounty.js.md), [js/npc/npccrew.js](npccrew.js.md), [js/npc/traffic.js](traffic.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/bounty.test.mjs, test/experimental.test.mjs, test/gdb.test.mjs, test/gender.test.mjs, test/genome.test.mjs, test/skycrew.test.mjs
- [`ensureGenome`](#s-ensureGenome) · function — used by test/genome.test.mjs
- [`genomeOf`](#s-genomeOf) · function — used by [js/crew/children.js](../crew/children.js.md), [js/crew/family.js](../crew/family.js.md), [js/crew/ledger.js](../crew/ledger.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/genome.test.mjs
- [`looksLine`](#s-looksLine) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/family.js](../crew/family.js.md), test/genome.test.mjs
- [`cradle`](#s-cradle) · const — used by [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/corp/company.js](../corp/company.js.md), [js/corp/fleet.js](../corp/fleet.js.md), [js/corp/gdb.js](../corp/gdb.js.md), [js/crew/bonds.js](../crew/bonds.js.md), [js/crew/captive.js](../crew/captive.js.md), [js/crew/children.js](../crew/children.js.md), [js/crew/childtalk.js](../crew/childtalk.js.md), [js/crew/deckacts.js](../crew/deckacts.js.md), [js/crew/deckmind.js](../crew/deckmind.js.md), [js/crew/family.js](../crew/family.js.md), [js/crew/heritage.js](../crew/heritage.js.md), [js/crew/journal.js](../crew/journal.js.md), [js/crew/learn.js](../crew/learn.js.md), [js/crew/ledger.js](../crew/ledger.js.md), [js/crew/romance.js](../crew/romance.js.md), [js/crew/roster.js](../crew/roster.js.md), [js/crew/talk.js](../crew/talk.js.md), [js/crew/talkview.js](../crew/talkview.js.md), [js/interior/boarding.js](../interior/boarding.js.md), [js/npc/bounty.js](bounty.js.md), [js/npc/captain.js](captain.js.md), [js/npc/npccrew.js](npccrew.js.md), [js/npc/traffic.js](traffic.js.md), [js/station/deckhall.js](../station/deckhall.js.md), [js/station/stafflife.js](../station/stafflife.js.md), [js/station/staffline.js](../station/staffline.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/beats.test.mjs, test/bounty.test.mjs, test/childtalk.test.mjs, test/crew-life.test.mjs, test/experimental.test.mjs, test/gdb.test.mjs, test/genome.test.mjs, test/line.test.mjs, test/people.test.mjs, test/skycrew.test.mjs
- [`releaseEmployed`](#s-releaseEmployed) · function — used by [js/ui/creation.js](../ui/creation.js.md)
- [`employedCount`](#s-employedCount) · function — **no importer in scanned roots**
- [`exportLedger`](#s-exportLedger) · function — used by test/experimental.test.mjs
- [`importLedger`](#s-importLedger) · function — used by test/experimental.test.mjs
- [`FLUSH_MS`](#s-FLUSH_MS) · const — **no importer in scanned roots**
- [`FLUSH_MAX`](#s-FLUSH_MAX) · const — **no importer in scanned roots**
- [`PULL_RETRY_MS`](#s-PULL_RETRY_MS) · const — **no importer in scanned roots**
- [`PULL_RETRY_STEADY_MS`](#s-PULL_RETRY_STEADY_MS) · const — **no importer in scanned roots**
- [`PUSH_RETRY_MS`](#s-PUSH_RETRY_MS) · const — **no importer in scanned roots**
- [`pullRemote`](#s-pullRemote) · function — **no importer in scanned roots**
- [`connectCradle`](#s-connectCradle) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`disconnectCradle`](#s-disconnectCradle) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`cradleRemote`](#s-cradleRemote) · function — **no importer in scanned roots**
- [`flushRemote`](#s-flushRemote) · function — **no importer in scanned roots**
- [`traitLine`](#s-traitLine) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/crew/talkview.js](../crew/talkview.js.md)
- [`describeNPC`](#s-describeNPC) · function — used by [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md)

## Effects

- **net.fetch** — `/cradle/all?room=${…}` (pullRemote:365) · `/cradle/put POST` (flushRemote>put:420)
- **storage.get** — `‹LS_KEY›` (load:209)
- **timer** — `setTimeout` (schedulePull:357, pushRemote:412)

## Symbols

### <a id="s-CRADLE_VERSION"></a>`CRADLE_VERSION`

const · **exported** · L10–10

<!-- note:CRADLE_VERSION -->
v2: every record carries a genome. The five trait axes, the pulse, the
identity and the visible tells are all read off it rather than rolled
separately, so a child really does have their mother's eyes and their
father's caution. v1 records are grown a genome from their own seed the
first time they are touched — deterministic, so the same old hand comes
back the same way on every device.
<!-- /note -->

### <a id="s-LS_KEY"></a>`LS_KEY`

const · L11–11

<!-- note:LS_KEY -->
<!-- /note -->

### <a id="s-mulberry"></a>`mulberry(seedStr)`

function · L13–23

- called by: [`ensureIdentity`](#s-ensureIdentity) · [`generateNPC`](#s-generateNPC)

<!-- note:mulberry -->
<!-- /note -->

### <a id="s-ORIGIN_PLACE"></a>`ORIGIN_PLACE`

const · L25–29

<!-- note:ORIGIN_PLACE -->
Names used to come out of one pool regardless of who they were attached to,
which is why a sky that is half women read as a sky of men. Then they came
out of three. Now they come out of a forge (js/world/names.js): every race has
its own sounds, gender rides on the ending the way it does in most real
tongues, and a share of every draw takes the neutral endings so a crew list
still tells you less than a face does. The supply is effectively endless,
and a Korrash reads as a Korrash before you have seen one.

Where somebody is from, built rather than listed — a place and the thing
that was wrong with it. Four hundred-odd combinations, and the place half
is drawn from the same tongue their name is, so a Delvath is from a
Delvath-sounding warren.
<!-- /note -->

### <a id="s-ORIGIN_TWIST"></a>`ORIGIN_TWIST`

const · L30–35

<!-- note:ORIGIN_TWIST -->
<!-- /note -->

### <a id="s-originFor"></a>`originFor(race, rnd)`

function · L37–45

- calls: [`forgeWord`](../world/names.js.md#s-forgeWord) _js/world/names.js_ ×2
- called by: [`generateNPC`](#s-generateNPC)

<!-- note:originFor -->
<!-- /note -->

### <a id="s-TRAIT_AXES"></a>`TRAIT_AXES`

const · **exported** · L47–47

<!-- note:TRAIT_AXES -->
Five axes. 0..1. Nothing is good or bad; a cautious pilot lives and a greedy one gets rich.
<!-- /note -->

### <a id="s-GENDERS"></a>`GENDERS`

const · **exported** · L49–49

<!-- note:GENDERS -->
---- identity ------------------------------------------------------------
Who someone is, for the deck's social life: a gender, pronouns, and who
they are drawn to. Any pairing can form aboard when the interest is
mutual — the ledger does not have a "default" couple. Synthetics roll the
same table; a few of everyone are aromantic and simply make good friends.
<!-- /note -->

### <a id="s-PRONOUNS"></a>`PRONOUNS`

const · **exported** · L50–54

<!-- note:PRONOUNS -->
<!-- /note -->

### <a id="s-rollIdentity"></a>`rollIdentity(rnd)`

function · **exported** · L56–67

- called by: [`ensureIdentity`](#s-ensureIdentity)

<!-- note:rollIdentity -->
The genome decides who someone is; this is the old die-roll, kept for tests.

- L61 · `if (o < 0.08) attractedTo = [];` — aromantic
- L62 · `else if (o < 0.24) attractedTo = GENDERS.slice();` — anyone
- L63 · `else if (o < 0.46) attractedTo = [gender];` — same
<!-- /note -->

### <a id="s-ensureIdentity"></a>`ensureIdentity(rec)`

function · **exported** · L69–92

- calls: [`genomeIdentity`](../genome/spacer.js.md#s-genomeIdentity) _js/genome/spacer.js_ ×2 · [`ensureGenome`](#s-ensureGenome) · [`genomeOf`](#s-genomeOf) ×2 · [`mulberry`](#s-mulberry) · [`rollIdentity`](#s-rollIdentity)
- called by: [`candidateFrom`](../crew/ledger.js.md#s-candidateFrom) _js/crew/ledger.js_ · [`boardAt`](bounty.js.md#s-boardAt) _js/npc/bounty.js_ · [`EVENTS.run~4`](../station/stationlife.js.md#s-EVENTS-run-4) _js/station/stationlife.js_ ×2 · [`bearChild`](../station/stationlife.js.md#s-bearChild) _js/station/stationlife.js_ ×2

<!-- note:ensureIdentity -->
Older ledger records predate identity; grow one from the genome.

v2 records carry a gender read off the old sex split, which put a fifth of
everyone in the same box. A record with no `sex` on it is one of those:
re-read it, which is deterministic, so the same person comes back the same
way — just with the ratios the sky should have had.
<!-- /note -->

### <a id="s-drawnTo"></a>`drawnTo(a, b)`

function · **exported** · L94–96

- called by: [`buildContext`](../crew/deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ ×2 · [`couldCourt`](../crew/family.js.md#s-couldCourt) _js/crew/family.js_ ×2 · [`stepBonds`](../crew/ledger.js.md#s-stepBonds) _js/crew/ledger.js_ ×2 · [`attraction`](../crew/romance.js.md#s-attraction) _js/crew/romance.js_ ×2 · [`EVENTS.run~4`](../station/stationlife.js.md#s-EVENTS-run-4) _js/station/stationlife.js_ ×2

<!-- note:drawnTo -->
Would `a` be drawn to `b`, on paper? Mutual interest is what a bond needs.
<!-- /note -->

### <a id="s-generateNPC"></a>`generateNPC(seed, opts=)`

function · **exported** · L98–165

- calls: [`createSpacer`](../genome/spacer.js.md#s-createSpacer) _js/genome/spacer.js_ · [`fingerprint`](../genome/spacer.js.md#s-fingerprint) _js/genome/spacer.js_ · [`genomeIdentity`](../genome/spacer.js.md#s-genomeIdentity) _js/genome/spacer.js_ · [`genomePulse`](../genome/spacer.js.md#s-genomePulse) _js/genome/spacer.js_ · [`genomeTells`](../genome/spacer.js.md#s-genomeTells) _js/genome/spacer.js_ · [`genomeTraits`](../genome/spacer.js.md#s-genomeTraits) _js/genome/spacer.js_ · [`packGenome`](../genome/spacer.js.md#s-packGenome) _js/genome/spacer.js_ · [`skillAptitude`](../genome/spacer.js.md#s-skillAptitude) _js/genome/spacer.js_ · [`hash32`](#s-hash32) · [`mulberry`](#s-mulberry) · [`originFor`](#s-originFor) · [`personName`](../world/names.js.md#s-personName) _js/world/names.js_
- via [js/crew/races.js](../crew/races.js.md): `RACES.find`
- via [js/careers/complexes.js](../careers/complexes.js.md): `RANK_LETTERS.indexOf`
- called by: [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ · [`genomeForParent`](../crew/family.js.md#s-genomeForParent) _js/crew/family.js_ · [`stationRoster`](../crew/ledger.js.md#s-stationRoster) _js/crew/ledger.js_ · [`startBoarding`](../interior/boarding.js.md#s-startBoarding) _js/interior/boarding.js_ · [`attemptCapture`](bounty.js.md#s-attemptCapture) _js/npc/bounty.js_ · [`boardAt`](bounty.js.md#s-boardAt) _js/npc/bounty.js_ · [`crewOf`](npccrew.js.md#s-crewOf) _js/npc/npccrew.js_ · [`promote`](npccrew.js.md#s-promote) _js/npc/npccrew.js_ · [`buildRoster`](traffic.js.md#s-buildRoster) _js/npc/traffic.js_ · [`bearChild`](../station/stationlife.js.md#s-bearChild) _js/station/stationlife.js_

<!-- note:generateNPC -->
Deterministic new entity. `seed` decides everything; the same seed is the same person.

- L108 · `const typeId = opts.genomeType ?? SPACER;` — the body comes first — everything below is read off it
- L112 · `const skills = {};` — skills: primaries scaled by rank, lifted where the body is suited to it,
  and a couple of strays from whatever else they turned out to be good at
- L140 · `partner: null,` — ledger id of who they are with, if anyone
- L153 · `ageCycles: opts.newborn ? 0 : Math.round(260 + idx * 45 + rnd() * 180),` — Age on the life-stage clock, in pay cycles. A hand who walks into a
  hiring hall has already had a life: rank buys years, so an Entry hand
  reads prime and a Director reads mature. Only somebody born aboard
  starts at zero. Lifespan comes off the longevity genes, so the same
  number of cycles is not the same age for everyone.
- L157 · `status: "pool",` — pool | aboard | captain | dismissed | captive | dead
- L158 · `employer: null,` — callsign of the pilot who has them aboard
- L162 · `journal: [],` — full decision records — see js/crew/journal.js
- L163 · `brain: null,` — neural-core weights once they have held the conn
<!-- /note -->

### <a id="s-ensureGenome"></a>`ensureGenome(rec)`

function · **exported** · L167–183

- calls: [`createSpacer`](../genome/spacer.js.md#s-createSpacer) _js/genome/spacer.js_ · [`fingerprint`](../genome/spacer.js.md#s-fingerprint) _js/genome/spacer.js_ · [`genomeTells`](../genome/spacer.js.md#s-genomeTells) _js/genome/spacer.js_ · [`genomeTraits`](../genome/spacer.js.md#s-genomeTraits) _js/genome/spacer.js_ · [`packGenome`](../genome/spacer.js.md#s-packGenome) _js/genome/spacer.js_ · [`skillAptitude`](../genome/spacer.js.md#s-skillAptitude) _js/genome/spacer.js_ · [`unpackGenome`](../genome/spacer.js.md#s-unpackGenome) _js/genome/spacer.js_
- called by: [`ensureIdentity`](#s-ensureIdentity) · [`genomeOf`](#s-genomeOf) · [`importLedger`](#s-importLedger)

<!-- note:ensureGenome -->
A v1 record, or any record that lost its genome, grows one from its own
seed. The seed is what made the person in the first place, so the body it
produces is the body they always had — it was simply never written down.

- L170 · `try { unpackGenome(rec.genome); return rec; } catch {` — corrupt — regrow below
<!-- /note -->

### <a id="s-genomeOf"></a>`genomeOf(rec)`

function · **exported** · L185–188

- calls: [`unpackGenome`](../genome/spacer.js.md#s-unpackGenome) _js/genome/spacer.js_ · [`ensureGenome`](#s-ensureGenome)
- called by: [`inheritance`](../crew/children.js.md#s-inheritance) _js/crew/children.js_ ×4 · [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ · [`genomeForParent`](../crew/family.js.md#s-genomeForParent) _js/crew/family.js_ ×2 · [`genomeFor`](../crew/ledger.js.md#s-genomeFor) _js/crew/ledger.js_ · [`ensureIdentity`](#s-ensureIdentity) ×2 · [`looksLine`](#s-looksLine) · [`kinOK`](../station/stationlife.js.md#s-kinOK) _js/station/stationlife.js_ ×2

<!-- note:genomeOf -->
The genome itself, decoded. Null only if the record cannot produce one.
<!-- /note -->

### <a id="s-looksLine"></a>`looksLine(rec)`

function · **exported** · L190–193

- calls: [`tellLine`](../genome/spacer.js.md#s-tellLine) _js/genome/spacer.js_ · [`genomeOf`](#s-genomeOf)
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ · [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_

<!-- note:looksLine -->
"183 cm, lean, red hair and grey eyes" — what you can see across a mess.
<!-- /note -->

### <a id="s-hash32"></a>`hash32(s)`

function · L195–199

- called by: [`generateNPC`](#s-generateNPC)

<!-- note:hash32 -->
<!-- /note -->

### <a id="s-db"></a>`db`

const · L201–201

<!-- note:db -->
---- the ledger ----------------------------------------------------------
<!-- /note -->

### <a id="s-loaded"></a>`loaded`

const · L202–202

<!-- note:loaded -->
<!-- /note -->

### <a id="s-dirty"></a>`dirty`

const · L203–203

<!-- note:dirty -->
<!-- /note -->

### <a id="s-load"></a>`load()`

function · L205–212

- called by: [`cradle.all`](#s-cradle-all) · [`cradle.clear`](#s-cradle-clear) · [`cradle.forget`](#s-cradle-forget) · [`cradle.get`](#s-cradle-get) · [`cradle.put`](#s-cradle-put) · [`cradle.size`](#s-cradle-size) · [`employedCount`](#s-employedCount) · [`releaseEmployed`](#s-releaseEmployed)
- effects: storage.get `‹LS_KEY›`

<!-- note:load -->
- L211 · `} catch {` — private mode, or no storage — the ledger lives for the session
<!-- /note -->

### <a id="s-shedJournals"></a>`shedJournals()`

function · L214–222

- called by: [`save`](#s-save)

<!-- note:shedJournals -->
Journals are the heavy part of a record and the cheapest thing to lose: a
person's genome, lineage and history are what make them the same person on
the next device. When the device refuses the write, shed the stored decision
records of everyone who is not currently aboard and try once more.
<!-- /note -->

### <a id="s-save"></a>`save()`

function · L224–234

- calls: [`shedJournals`](#s-shedJournals)
- called by: [`cradle.clear`](#s-cradle-clear) · [`cradle.forget`](#s-cradle-forget) · [`cradle.put`](#s-cradle-put) · [`releaseEmployed`](#s-releaseEmployed)

<!-- note:save -->
- L231 · `if (!shedJournals()) return;` — nothing left to give up
- L232 · `try { ls.setItem(LS_KEY, JSON.stringify([...db.values()])); } catch {` — still full
<!-- /note -->

### <a id="s-cradle"></a>`cradle`

const · **exported** · L236–260

<!-- note:cradle -->
<!-- /note -->

#### <a id="s-cradle-size"></a>`cradle.size()`

prop · L237–237

- calls: [`load`](#s-load)

<!-- note:cradle.size -->
<!-- /note -->

#### <a id="s-cradle-get"></a>`cradle.get(id)`

prop · L238–238

- calls: [`load`](#s-load)

<!-- note:cradle.get -->
<!-- /note -->

#### <a id="s-cradle-all"></a>`cradle.all()`

prop · L239–239

- calls: [`load`](#s-load)

<!-- note:cradle.all -->
<!-- /note -->

#### <a id="s-cradle-put"></a>`cradle.put(rec)`

prop · L240–247

- calls: [`load`](#s-load) · [`pushRemote`](#s-pushRemote) · [`save`](#s-save)

<!-- note:cradle.put -->
<!-- /note -->

#### <a id="s-cradle-note"></a>`cradle.note(id, text, at=)`

prop · L248–254

<!-- note:cradle.note -->
Append a line to a record's history and file it.
<!-- /note -->

#### <a id="s-cradle-pool"></a>`cradle.pool(filter=)`

prop · L255–257

<!-- note:cradle.pool -->
Everyone not currently aboard someone's ship.
<!-- /note -->

#### <a id="s-cradle-forget"></a>`cradle.forget(id)`

prop · L258–258

- calls: [`load`](#s-load) · [`save`](#s-save)

<!-- note:cradle.forget -->
<!-- /note -->

#### <a id="s-cradle-clear"></a>`cradle.clear()`

prop · L259–259

- calls: [`load`](#s-load) · [`save`](#s-save)

<!-- note:cradle.clear -->
<!-- /note -->

### <a id="s-isCrewing"></a>`isCrewing(r)`

function · L262–265

- called by: [`employedCount`](#s-employedCount) · [`importLedger`](#s-importLedger) ×2 · [`releaseEmployed`](#s-releaseEmployed)

<!-- note:isCrewing -->
---- employment is a fact about one run, not about the sky -----------------

A record carries `status: "aboard"` and `employer: &lt;callsign>` while somebody
is flying with you. That is true of YOUR run and nobody else's — and the
ledger outlives your run by design, because the point of a ledger is that the
hand you dismissed at Foundry Hold turns up at Kessler Reach later.

So the flags leaked. Retire a pilot, make a new one, and forty people were
still filed as crewing a ship that no longer existed under a callsign that
was no longer yours: hiring halls thinned to two candidates, and the old name
was still printed beside every one of them. Worse over the relay, where a
shared `cradle.json` accumulated every client's crew and handed them to
everyone, and worse again after a server restart, which changed nothing
because the file is the thing that persists.

`releaseEmployed()` puts them back in the pool. A new run calls it with no
argument (release everyone — none of them are yours); leaving a sky calls it
with the callsign that is walking. Records already `dismissed`, `captive` or
`dead` are left exactly as they are: those ARE facts about the sky.

- L263 · `if (r.status !== "aboard" && r.status !== "captain") return false;` — Read `employer` carefully. An NPC commanding their own hull is filed as
  `captain` with THEMSELVES as the employer — a sky holds about fifty-five of
  them and none of them are anybody's crew. A hand you hired, or one you
  handed the con to, is employed by a NAME THAT IS NOT THEIR OWN. That is the
  whole discriminator, and getting it wrong in either direction is visible:
  too loose and every traffic captain in the sky gets demoted to a dockside
  job-seeker, too tight and your old crew never go back in the pool.
<!-- /note -->

### <a id="s-releaseEmployed"></a>`releaseEmployed(employer=, note=)`

function · **exported** · L267–284

- calls: [`isCrewing`](#s-isCrewing) · [`load`](#s-load) · [`save`](#s-save)
- called by: [`mountCreation>finish`](../ui/creation.js.md#s-mountCreation-finish) _js/ui/creation.js_

<!-- note:releaseEmployed -->
<!-- /note -->

### <a id="s-employedCount"></a>`employedCount(employer=)`

function · **exported** · L286–295

- calls: [`isCrewing`](#s-isCrewing) · [`load`](#s-load)

<!-- note:employedCount -->
How many records the ledger currently thinks are crewing something.
<!-- /note -->

### <a id="s-exportLedger"></a>`exportLedger()`

function · **exported** · L297–299

<!-- note:exportLedger -->
<!-- /note -->

### <a id="s-importLedger"></a>`importLedger(json)`

function · **exported** · L301–331

- calls: [`ensureGenome`](#s-ensureGenome) · [`isCrewing`](#s-isCrewing) ×2
- called by: [`pullRemote`](#s-pullRemote)

<!-- note:importLedger -->
- L307 · `if (!have || (r.history?.length ?? 0) >= (have.history?.length ?? 0)) {` — newest history wins; never lose a brain
- L310 · `if (have?.journal?.length) {` — journals merge rather than replace — two devices saw different watches
- L317 · `if (isCrewing(r)) {` — Employment never travels. A record that arrives from the relay — or out
  of an exported ledger — saying it is aboard is describing SOMEBODY
  ELSE'S ship, and adopting that flag is what emptied the hiring halls.
  The person is real and welcome; the job they had on another hull is
  not ours to honour.
- L322 · `r.status = have.status;` — ours already: keep our own view of who they work for
<!-- /note -->

### <a id="s-remote"></a>`remote`

const · L333–333

<!-- note:remote -->
---- shared ledger over the relay ----------------------------------------

---- the shared ledger ------------------------------------------------------

server.py carries the ledger for a shared sky (GET /cradle/all, POST
/cradle/put). A plain `python3 -m http.server` does not, and that case had
two bugs that between them filled the terminal forever:

  1. `fetch` only REJECTS on a network failure. A 501 is a perfectly good
     response, so `.catch(() => remote.failed++)` never ran, `failed` stayed
     at 0, and the `failed > 3` guard never tripped. Every record filed —
     and a hiring hall files a dozen at once — POSTed to a server that had
     already said it does not do POST. Forever.
  2. A 404 on /cradle/all told us the same thing on the very first call and
     we did not listen.

Both are read properly now, and 404/405/501 is treated the way net.js treats
it: this host has no relay, stop asking. Everything still works — the ledger
is local-first and localStorage is the authority — you simply do not get a
shared sky, which you were never going to get from a file server.

The other half is volume. `put()` is called once per record and a station
roster files eight in a burst, so even a real relay was taking a POST each.
They are queued and flushed together now.
<!-- /note -->

### <a id="s-pending"></a>`pending`

const · L334–334

<!-- note:pending -->
<!-- /note -->

### <a id="s-flushTimer"></a>`flushTimer`

const · L335–335

<!-- note:flushTimer -->
<!-- /note -->

### <a id="s-FLUSH_MS"></a>`FLUSH_MS`

const · **exported** · L336–336

<!-- note:FLUSH_MS -->
<!-- /note -->

### <a id="s-FLUSH_MAX"></a>`FLUSH_MAX`

const · **exported** · L337–337

<!-- note:FLUSH_MAX -->
<!-- /note -->

### <a id="s-relayGone"></a>`relayGone(status, path)`

function · L339–346

- called by: [`flushRemote`](#s-flushRemote) · [`pullRemote`](#s-pullRemote)

<!-- note:relayGone -->
<!-- /note -->

### <a id="s-PULL_RETRY_MS"></a>`PULL_RETRY_MS`

const · **exported** · L348–348

<!-- note:PULL_RETRY_MS -->
0.3.44 — the pull is retried, and a run of failed pushes is not forever.
The pull happened exactly once, at connect: a relay that was down for the
five seconds of a launch (a cloudflared restart, `--update` bouncing
lg-relay, a 503 from the site's pass-through) meant this session never
saw the shared ledger at all. And `failed > 3` switched pushes off for the
rest of the session, so the same outage silently stopped the sky's
people being shared until a reload. Now: the pull backs off and tries
again (5 s, 15 s, 45 s, then every two minutes); the push gate reopens
after PUSH_RETRY_MS; a success resets the count.
<!-- /note -->

### <a id="s-PULL_RETRY_STEADY_MS"></a>`PULL_RETRY_STEADY_MS`

const · **exported** · L349–349

<!-- note:PULL_RETRY_STEADY_MS -->
<!-- /note -->

### <a id="s-PUSH_RETRY_MS"></a>`PUSH_RETRY_MS`

const · **exported** · L350–350

<!-- note:PUSH_RETRY_MS -->
<!-- /note -->

### <a id="s-pullTimer"></a>`pullTimer`

const · L351–351

<!-- note:pullTimer -->
<!-- /note -->

### <a id="s-pullTries"></a>`pullTries`

const · L352–352

<!-- note:pullTries -->
<!-- /note -->

### <a id="s-schedulePull"></a>`schedulePull()`

function · L354–361

- calls: [`pullRemote`](#s-pullRemote)
- called by: [`pullRemote`](#s-pullRemote)
- effects: timer `setTimeout`

<!-- note:schedulePull -->
<!-- /note -->

### <a id="s-pullRemote"></a>`pullRemote()`

function · **exported** · L363–377

- calls: [`importLedger`](#s-importLedger) · [`noteFail`](#s-noteFail) · [`noteOk`](#s-noteOk) · [`relayGone`](#s-relayGone) · [`schedulePull`](#s-schedulePull)
- called by: [`connectCradle`](#s-connectCradle) · [`schedulePull`](#s-schedulePull)
- effects: net.fetch `/cradle/all?room=${…}`

<!-- note:pullRemote -->
Pull what the server holds for this sky; local records stay authoritative on conflict.

- L372 · `noteOk(); remote.pulled = true; pullTries = 0;` — before the import: its records go out through an open gate
<!-- /note -->

### <a id="s-connectCradle"></a>`connectCradle(room)`

function · **exported** · L379–385

- calls: [`pullRemote`](#s-pullRemote)
- called by: [`mountHud>go`](../ui/hud.js.md#s-mountHud-go) _js/ui/hud.js_

<!-- note:connectCradle -->
<!-- /note -->

### <a id="s-disconnectCradle"></a>`disconnectCradle()`

function · **exported** · L387–392

- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:disconnectCradle -->
<!-- /note -->

### <a id="s-cradleRemote"></a>`cradleRemote()`

function · **exported** · L394–396

<!-- note:cradleRemote -->
For the console and the tests: what the ledger's server side is doing.
<!-- /note -->

### <a id="s-noteFail"></a>`noteFail()`

function · L398–401

- called by: [`flushRemote`](#s-flushRemote) ×4 · [`pullRemote`](#s-pullRemote)

<!-- note:noteFail -->
A push or pull failed: count it, and after a run of them shut the push gate for PUSH_RETRY_MS.
<!-- /note -->

### <a id="s-noteOk"></a>`noteOk()`

function · L402–402

- called by: [`flushRemote`](#s-flushRemote) · [`pullRemote`](#s-pullRemote)

<!-- note:noteOk -->
<!-- /note -->

### <a id="s-pushRemote"></a>`pushRemote(rec)`

function · L404–413

- calls: [`flushRemote`](#s-flushRemote)
- called by: [`cradle.put`](#s-cradle-put)
- effects: timer `setTimeout`

<!-- note:pushRemote -->
- L407 · `if (Date.now() < remote.retryAt) return;` — the gate: shut by noteFail() after a run of failures, open for ONE more try once PUSH_RETRY_MS has passed
- L408 · `remote.retryAt = 0; remote.failed = 3;` — that try: a success resets everything, a failure shuts the gate again
<!-- /note -->

### <a id="s-flushRemote"></a>`flushRemote()`

function · **exported** · L415–432

- calls: [`flushRemote>put`](#s-flushRemote-put) ×2 · [`noteFail`](#s-noteFail) ×4 · [`noteOk`](#s-noteOk) · [`relayGone`](#s-relayGone)
- called by: [`pushRemote`](#s-pushRemote)

<!-- note:flushRemote -->
<!-- /note -->

#### <a id="s-flushRemote-put"></a>`flushRemote>put(rec)`

function · L420–424

- called by: [`flushRemote`](#s-flushRemote) ×2
- effects: net.fetch `/cradle/put`

<!-- note:flushRemote>put -->
One record per POST is what the server takes. The first of a batch is sent
ALONE and waited on: if the answer is "this host does not do POST" the
other thirty-nine are never sent and the relay is written off, so a static
host costs exactly one request rather than one per record. A healthy relay
pays one round trip of latency per flush and then sends the rest at once.
<!-- /note -->

### <a id="s-traitLine"></a>`traitLine(rec)`

function · **exported** · L434–446

- called by: [`hailContact`](../comms/comms.js.md#s-hailContact) _js/comms/comms.js_ · [`lineCard`](../console/panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`subLine`](../crew/talkview.js.md#s-subLine) _js/crew/talkview.js_ · [`describeNPC`](#s-describeNPC)

<!-- note:traitLine -->
---- personality in words -----------------------------------------------
<!-- /note -->

### <a id="s-describeNPC"></a>`describeNPC(rec)`

function · **exported** · L448–452

- calls: [`traitLine`](#s-traitLine)
- via [js/crew/races.js](../crew/races.js.md): `RACES.find`
- called by: [`personCard`](../console/panels/crew-gdb.js.md#s-personCard) _js/console/panels/crew-gdb.js_

<!-- note:describeNPC -->
<!-- /note -->
