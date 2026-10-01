# js/crew/family.js

[index](../../../README.md) · 438 lines · 52 symbols · 15 imports · 33 importers

## About

<!-- note:@file -->
LIVING GALAXY — the people aboard: talk, ties, families, and where they go.

crew.js keeps the ledger (wages, morale, who is with whom). This is the
layer above it:

  talk      — a dialogue tree per hand, with outcomes: praise, a bonus, a
              dressing-down, a question about themselves, their partner,
              their kids. Every choice moves trust (theirs, toward you) and
              morale, and the lines are theirs — pronouns, temperament,
              what they are drawn to.
  settings  — YOUR identity (gender, pronouns, who you are drawn to) and the
              two switches: romance (off / crew only / including you) and
              family (whether anyone conceives aboard). Gender-specific by
              design: a hand who is not drawn to your gender declines,
              kindly; a pair who cannot conceive together do not.
  family    — partners aboard (or a hand and you) may conceive: a pregnancy
              runs six cycles, a child is a CRADLE record with both parents'
              race, blended traits and a berth. Children grow by the cycle
              and, in time, walk into a hiring hall as adults.
  room      — a berth holds one hand or two children. When the household
              outgrows the hull you SETTLE a family at a port: on the
              company's books as staff (they earn the company a wage share
              every cycle) or paid off and recorded (company.js keeps the
              address, the hall will show them again).

- L61 · `const CONCEIVE_CHANCE = 0.05;` — per partnered pair per cycle when family is on and both are settled in
- L428 · `crewHooks.onCycle = tickHousehold;` — the ledger's cycle is the household's cycle
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew`, `crewHooks`, `rapportBetween` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `../npc/cradle.js` | `cradle`, `drawnTo`, `generateNPC`, `genomeOf`, `looksLine`, `GENDERS`, `PRONOUNS`, `TRAIT_AXES` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 3 | `../corp/gdb.js` | `file` as `gdbFile` | [js/corp/gdb.js](../corp/gdb.js.md) |
| 4 | `../world/names.js` | `childFamily`, `nameRng` | [js/world/names.js](../world/names.js.md) |
| 5 | `../genome/spacer.js` | `breed`, `packGenome`, `fingerprint`, `genomeTraits`, `genomeIdentity`, `genomePulse`, `genomeTells`, `skillAptitude`, `SPACER`, `kinship` | [js/genome/spacer.js](../genome/spacer.js.md) |
| 6 | `./heritage.js` | `heritageFor`, `applyHeritage`, `heritageLine`, `startingLetter` | [js/crew/heritage.js](heritage.js.md) |
| 7 | `../careers/complexes.js` | `COMPLEXES` | [js/careers/complexes.js](../careers/complexes.js.md) |
| 8 | `./children.js` | `comeOfAge` | [js/crew/children.js](children.js.md) |
| 9 | `../station/stationlife.js` | `carryPregnancyAshore` | [js/station/stationlife.js](../station/stationlife.js.md) |
| 10 | `./voice.js` | `line` as `voiceLine`, `wrap` as `voiceWrap` | [js/crew/voice.js](voice.js.md) |
| 11 | `../corp/company.js` | `company`, `hasCompany`, `settleAsStaff`, `payOffAndRecord` | [js/corp/company.js](../corp/company.js.md) |
| 12 | `../sim/sim.js` | `logEvent`, `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 13 | `../flight/pilot.js` | `pilot` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 14 | `./races.js` | `RACES` | [js/crew/races.js](races.js.md) |
| 15 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |

## Imported by

- [js/console/panels/crew.js](../console/panels/crew.js.md) — `social`, `setSocial`, `loadSocial`, `household`, `settleFamily`, `berthsUsed`, `trustOf`
- [js/crew/beats.js](beats.js.md) — `adjustMorale`, `adjustTrust`, `trustOf`, `social`, `loadSocial`, `playerAsPerson`, `couldCourt`, `pairWithPlayer`
- [js/crew/bonds.js](bonds.js.md) — `adjustMorale`
- [js/crew/children.js](children.js.md) — `household`, `personById`, `note`
- [js/crew/childtalk.js](childtalk.js.md) — `household`, `note`, `personById`
- [js/crew/deckacts.js](deckacts.js.md) — `adjustMorale`, `adjustTrust`
- [js/crew/deckmind.js](deckmind.js.md) — `adjustMorale`, `trustOf`, `social`, `loadSocial`, `household`
- [js/crew/duties.js](duties.js.md) — `adjustMorale`
- [js/crew/hull.js](hull.js.md) — `social`, `loadSocial`
- [js/crew/orders.js](orders.js.md) — `adjustMorale`, `adjustTrust`
- [js/crew/romance.js](romance.js.md) — `social`, `loadSocial`, `adjustMorale`, `household`
- [js/crew/roster.js](roster.js.md) — `trustOf`
- [js/crew/talk-trees.js](talk-trees.js.md) — `trustOf`
- [js/crew/talk.js](talk.js.md) — `crewTopics`, `greetLine`, `adjustTrust`, `adjustMorale`, `familyOf`
- [js/crew/talkview.js](talkview.js.md) — `familyOf`, `trustOf`
- [js/crew/tiers.js](tiers.js.md) — `trustOf`
- [js/crew/tiers.js](tiers.js.md) — `couldCourt`, `playerAsPerson`
- [js/sim/sim.js](../sim/sim.js.md) — `resetHousehold`
- [js/station/deckhall.js](../station/deckhall.js.md) — `settleFamily`, `trustOf`
- [js/ui/hud.js](../ui/hud.js.md) — `wireFamily`
- test/beats.test.mjs _(outside js/)_ — `setSocial`, `social`, `trustOf`, `couldCourt`, `pairWithPlayer`, `bumpTrust`
- test/childtalk.test.mjs _(outside js/)_ — `household`, `conceive`
- test/converse.test.mjs _(outside js/)_ — `setSocial`
- test/crew-life.test.mjs _(outside js/)_ — `crewTopics`, `couldCourt`, `adjustTrust`, `adjustMorale`, `bumpTrust`, `setSocial`
- test/genome.test.mjs _(outside js/)_ — `setSocial`, `household`, `tickHousehold`, `conceive`, `adjustTrust`
- test/people.test.mjs _(outside js/)_ — `social`, `setSocial`, `household`, `crewTopics`, `couldCourt`, `settleFamily`, `familyOf`, `tickHousehold`, `canConceive`, `berthsUsed`, `overBerths`, `playerAsPerson`, `adjustTrust`, `adjustMorale`, `bumpTrust`, `bumpMorale`, `greetLine`
- test/skycrew.test.mjs _(outside js/)_ — `setSocial`, `trustOf`
- test/skycrew.test.mjs _(outside js/)_ — `household`, `social`, `tickHousehold`
- test/systems.test.mjs _(outside js/)_ — `F`
- addon/adult/index.js _(outside js/)_ — `social`, `loadSocial`, `setSocial`, `playerAsPerson`, `adjustMorale`, `adjustTrust`
- addon/adult/legacy-addon.js _(outside js/)_ — `social`, `loadSocial`, `playerAsPerson`
- addon/adult/npc.js _(outside js/)_ — `social`
- addon/adult/trees.js _(outside js/)_ — `social`, `loadSocial`, `playerAsPerson`, `adjustMorale`, `adjustTrust`

## Exports

- [`social`](#s-social) · const — used by addon/adult/index.js, addon/adult/legacy-addon.js, addon/adult/npc.js, addon/adult/trees.js, [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/beats.js](beats.js.md), [js/crew/deckmind.js](deckmind.js.md), [js/crew/hull.js](hull.js.md), [js/crew/romance.js](romance.js.md), test/beats.test.mjs, test/people.test.mjs, test/skycrew.test.mjs
- [`loadSocial`](#s-loadSocial) · function — used by addon/adult/index.js, addon/adult/legacy-addon.js, addon/adult/trees.js, [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/beats.js](beats.js.md), [js/crew/deckmind.js](deckmind.js.md), [js/crew/hull.js](hull.js.md), [js/crew/romance.js](romance.js.md)
- [`setSocial`](#s-setSocial) · function — used by addon/adult/index.js, [js/console/panels/crew.js](../console/panels/crew.js.md), test/beats.test.mjs, test/converse.test.mjs, test/crew-life.test.mjs, test/genome.test.mjs, test/people.test.mjs, test/skycrew.test.mjs
- [`playerPronouns`](#s-playerPronouns) · function — **no importer in scanned roots**
- [`playerAsPerson`](#s-playerAsPerson) · function — used by addon/adult/index.js, addon/adult/legacy-addon.js, addon/adult/trees.js, [js/crew/beats.js](beats.js.md), [js/crew/tiers.js](tiers.js.md), test/people.test.mjs
- [`household`](#s-household) · const — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/children.js](children.js.md), [js/crew/childtalk.js](childtalk.js.md), [js/crew/deckmind.js](deckmind.js.md), [js/crew/romance.js](romance.js.md), test/childtalk.test.mjs, test/genome.test.mjs, test/people.test.mjs, test/skycrew.test.mjs
- [`note`](#s-note) · function — used by [js/crew/children.js](children.js.md), [js/crew/childtalk.js](childtalk.js.md)
- [`berthsUsed`](#s-berthsUsed) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), test/people.test.mjs
- [`overBerths`](#s-overBerths) · function — used by test/people.test.mjs
- [`personById`](#s-personById) · function — used by [js/crew/children.js](children.js.md), [js/crew/childtalk.js](childtalk.js.md)
- [`canConceive`](#s-canConceive) · function — used by test/people.test.mjs
- [`conceive`](#s-conceive) · function — used by test/childtalk.test.mjs, test/genome.test.mjs
- [`tickHousehold`](#s-tickHousehold) · function — used by test/genome.test.mjs, test/people.test.mjs, test/skycrew.test.mjs
- [`familyOf`](#s-familyOf) · function — used by [js/crew/talk.js](talk.js.md), [js/crew/talkview.js](talkview.js.md), test/people.test.mjs
- [`settleFamily`](#s-settleFamily) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/station/deckhall.js](../station/deckhall.js.md), test/people.test.mjs
- [`trustOf`](#s-trustOf) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/beats.js](beats.js.md), [js/crew/deckmind.js](deckmind.js.md), [js/crew/roster.js](roster.js.md), [js/crew/talk-trees.js](talk-trees.js.md), [js/crew/talkview.js](talkview.js.md), [js/crew/tiers.js](tiers.js.md), [js/station/deckhall.js](../station/deckhall.js.md), test/beats.test.mjs, test/skycrew.test.mjs
- [`adjustTrust`](#s-adjustTrust) · function — used by addon/adult/index.js, addon/adult/trees.js, [js/crew/beats.js](beats.js.md), [js/crew/deckacts.js](deckacts.js.md), [js/crew/orders.js](orders.js.md), [js/crew/talk.js](talk.js.md), test/crew-life.test.mjs, test/genome.test.mjs, test/people.test.mjs
- [`adjustMorale`](#s-adjustMorale) · function — used by addon/adult/index.js, addon/adult/trees.js, [js/crew/beats.js](beats.js.md), [js/crew/bonds.js](bonds.js.md), [js/crew/deckacts.js](deckacts.js.md), [js/crew/deckmind.js](deckmind.js.md), [js/crew/duties.js](duties.js.md), [js/crew/orders.js](orders.js.md), [js/crew/romance.js](romance.js.md), [js/crew/talk.js](talk.js.md), test/crew-life.test.mjs, test/people.test.mjs
- [`bumpTrust`](#s-bumpTrust) · const — used by test/beats.test.mjs, test/crew-life.test.mjs, test/people.test.mjs
- [`bumpMorale`](#s-bumpMorale) · const — used by test/people.test.mjs
- [`pairWithPlayer`](#s-pairWithPlayer) · function — used by [js/crew/beats.js](beats.js.md), test/beats.test.mjs
- [`couldCourt`](#s-couldCourt) · function — used by [js/crew/beats.js](beats.js.md), [js/crew/tiers.js](tiers.js.md), test/beats.test.mjs, test/crew-life.test.mjs, test/people.test.mjs
- [`crewTopics`](#s-crewTopics) · function — used by [js/crew/talk.js](talk.js.md), test/crew-life.test.mjs, test/people.test.mjs
- [`greetLine`](#s-greetLine) · function — used by [js/crew/talk.js](talk.js.md), test/people.test.mjs
- [`resetHousehold`](#s-resetHousehold) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`wireFamily`](#s-wireFamily) · function — used by [js/ui/hud.js](../ui/hud.js.md)

## Effects

- **storage.get** — `‹SAVE_KEY›` (loadSocial:31)
- **storage.set** — `‹SAVE_KEY›` (saveSocial:34)

## Symbols

### <a id="s-social"></a>`social`

const · **exported** · L17–25

<!-- note:social -->
---- settings -------------------------------------------------------------

- L20 · `romance: "all",` — off | crew | all — crew: hands pair off with each other only; all: you too
- L21 · `family: true,` — conceptions aboard
- L22 · `adult: false,` — The adult switch adds one rung to the ladder — a couple with a berth to
  themselves get a night off-screen, and a conception can come from it
  rather than from a per-cycle die roll. It changes what is SIMULATED, not
  what is shown: nothing in the game depicts anything. Off by default, and
  with it off the crew still pair off, still bond and still have children
  the way they always did.
- L23 · `contraception: true,` — a couple who are not trying
- L24 · `name: "",` — what the crew call you
<!-- /note -->

### <a id="s-SAVE_KEY"></a>`SAVE_KEY`

const · L26–26

<!-- note:SAVE_KEY -->
<!-- /note -->

### <a id="s-loaded"></a>`loaded`

const · L27–27

<!-- note:loaded -->
<!-- /note -->

### <a id="s-loadSocial"></a>`loadSocial()`

function · **exported** · L28–32

- called by: [`mountHouse`](../console/panels/crew.js.md#s-mountHouse) _js/console/panels/crew.js_ · [`mountHouse>repaintRules`](../console/panels/crew.js.md#s-mountHouse-repaintRules) _js/console/panels/crew.js_ · [`CORE_BEATS.resolve~6`](beats.js.md#s-CORE_BEATS-resolve-6) _js/crew/beats.js_ · [`beatsFor`](beats.js.md#s-beatsFor) _js/crew/beats.js_ · [`odds`](beats.js.md#s-odds) _js/crew/beats.js_ · [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ · [`couldCourt`](#s-couldCourt) · [`crewTopics`](#s-crewTopics) · [`playerAsPerson`](#s-playerAsPerson) · [`setSocial`](#s-setSocial) · [`tickHousehold`](#s-tickHousehold) · [`playerHull.romance`](hull.js.md#s-playerHull-romance) _js/crew/hull.js_ · [`canHavePrivacy`](romance.js.md#s-canHavePrivacy) _js/crew/romance.js_ · [`conceptionOdds`](romance.js.md#s-conceptionOdds) _js/crew/romance.js_
- effects: storage.get `‹SAVE_KEY›`

<!-- note:loadSocial -->
- L31 · `try { const raw = globalThis.localStorage?.getItem(SAVE_KEY); if (raw) Object.assign(socia` — none
<!-- /note -->

### <a id="s-saveSocial"></a>`saveSocial()`

function · L33–35

- called by: [`setSocial`](#s-setSocial)
- effects: storage.set `‹SAVE_KEY›`

<!-- note:saveSocial -->
- L34 · `try { globalThis.localStorage?.setItem(SAVE_KEY, JSON.stringify(social)); } catch {` — none
<!-- /note -->

### <a id="s-setSocial"></a>`setSocial(patch)`

function · **exported** · L36–46

- calls: [`loadSocial`](#s-loadSocial) · [`saveSocial`](#s-saveSocial)
- via [js/npc/cradle.js](../npc/cradle.js.md): `GENDERS.includes`
- called by: [`mountHouse`](../console/panels/crew.js.md#s-mountHouse) _js/console/panels/crew.js_ · [`mountHouse.onPick`](../console/panels/crew.js.md#s-mountHouse-onPick) _js/console/panels/crew.js_ · [`mountHouse.onPick~2`](../console/panels/crew.js.md#s-mountHouse-onPick-2) _js/console/panels/crew.js_ · [`mountHouse.onPick~3`](../console/panels/crew.js.md#s-mountHouse-onPick-3) _js/console/panels/crew.js_ · [`mountHouse.onPick~4`](../console/panels/crew.js.md#s-mountHouse-onPick-4) _js/console/panels/crew.js_ · [`mountHouse.onPick~5`](../console/panels/crew.js.md#s-mountHouse-onPick-5) _js/console/panels/crew.js_ · [`mountHouse.onPick~6`](../console/panels/crew.js.md#s-mountHouse-onPick-6) _js/console/panels/crew.js_

<!-- note:setSocial -->
- L43 · `if (social.romance === "off") social.adult = false;` — no ladder, no rung
<!-- /note -->

### <a id="s-playerPronouns"></a>`playerPronouns()`

function · **exported** · L47–47

- called by: [`playerAsPerson`](#s-playerAsPerson)

<!-- note:playerPronouns -->
<!-- /note -->

### <a id="s-playerAsPerson"></a>`playerAsPerson()`

function · **exported** · L48–51

- calls: [`loadSocial`](#s-loadSocial) · [`playerPronouns`](#s-playerPronouns)
- called by: [`odds`](beats.js.md#s-odds) _js/crew/beats.js_ · [`couldCourt`](#s-couldCourt) · [`pairWithPlayer`](#s-pairWithPlayer) · [`personById`](#s-personById) · [`romanceTier`](tiers.js.md#s-romanceTier) _js/crew/tiers.js_

<!-- note:playerAsPerson -->
You, as the ledger sees you: enough for drawnTo() and a child's parentage.
<!-- /note -->

### <a id="s-household"></a>`household`

const · **exported** · L53–58

<!-- note:household -->
---- household ------------------------------------------------------------

Children aboard: CRADLE records with status "child", living on the ship.

- L54 · `children: [],` — { id, name, age (cycles), parents: [ids], raceId, gender }
- L55 · `pregnancies: [],` — { carrier, sire, cycles, due }
- L56 · `bonds: {},` — "bond:&lt;child id>" → 0..100, what the captain has put in
<!-- /note -->

### <a id="s-PREGNANCY_CYCLES"></a>`PREGNANCY_CYCLES`

const · L59–59

<!-- note:PREGNANCY_CYCLES -->
<!-- /note -->

### <a id="s-ADULT_CYCLES"></a>`ADULT_CYCLES`

const · L60–60

<!-- note:ADULT_CYCLES -->
<!-- /note -->

### <a id="s-CONCEIVE_CHANCE"></a>`CONCEIVE_CHANCE`

const · L61–61

<!-- note:CONCEIVE_CHANCE -->
<!-- /note -->

### <a id="s-note"></a>`note(msg)`

function · **exported** · L63–68

- via [js/crew/ledger.js](ledger.js.md): `crew.log.unshift`
- called by: [`raise`](children.js.md#s-raise) _js/crew/children.js_ · [`answerChild`](childtalk.js.md#s-answerChild) _js/crew/childtalk.js_ · [`momentFor`](childtalk.js.md#s-momentFor) _js/crew/childtalk.js_ · [`tickChildren`](childtalk.js.md#s-tickChildren) _js/crew/childtalk.js_ · [`crewTopics.run~10`](#s-crewTopics-run-10) · [`pairWithPlayer`](#s-pairWithPlayer) · [`settleFamily`](#s-settleFamily) ×2 · [`tickHousehold`](#s-tickHousehold) ×5

<!-- note:note -->
<!-- /note -->

### <a id="s-berthsUsed"></a>`berthsUsed()`

function · **exported** · L70–72

- called by: [`mountRoster`](../console/panels/crew.js.md#s-mountRoster) _js/console/panels/crew.js_ · [`berthsRoom`](#s-berthsRoom) ×2 · [`overBerths`](#s-overBerths)

<!-- note:berthsUsed -->
Berths: a hand is one, two children share one.
<!-- /note -->

### <a id="s-overBerths"></a>`overBerths(capacity)`

function · **exported** · L73–75

- calls: [`berthsUsed`](#s-berthsUsed)
- called by: [`berthsRoom`](#s-berthsRoom) · [`crewTopics.run~7`](#s-crewTopics-run-7)

<!-- note:overBerths -->
<!-- /note -->

### <a id="s-personById"></a>`personById(id)`

function · **exported** · L77–80

- calls: [`playerAsPerson`](#s-playerAsPerson)
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.find`
- called by: [`parentsOf`](children.js.md#s-parentsOf) _js/crew/children.js_ · [`parents`](childtalk.js.md#s-parents) _js/crew/childtalk.js_ · [`partnerOf`](#s-partnerOf) · [`tickHousehold`](#s-tickHousehold) ×2

<!-- note:personById -->
<!-- /note -->

### <a id="s-canConceive"></a>`canConceive(a, b)`

function · **exported** · L82–95

- calls: [`canConceive>role`](#s-canConceive-role) ×2
- called by: [`tickHousehold`](#s-tickHousehold)

<!-- note:canConceive -->
Whether these two could conceive: one carries, one sires. Nonbinary hands roll it from their seed.
<!-- /note -->

#### <a id="s-canConceive-role"></a>`canConceive>role(p)`

function · L84–92

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`canConceive`](#s-canConceive) ×2

<!-- note:canConceive>role -->
<!-- /note -->

### <a id="s-partnerOf"></a>`partnerOf(m)`

function · L97–99

- calls: [`personById`](#s-personById)
- called by: [`crewTopics`](#s-crewTopics) · [`tickHousehold`](#s-tickHousehold)

<!-- note:partnerOf -->
<!-- /note -->

### <a id="s-genomeForParent"></a>`genomeForParent(p)`

function · L101–107

- calls: [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_ · [`genomeOf`](../npc/cradle.js.md#s-genomeOf) _js/npc/cradle.js_ ×2
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`conceive`](#s-conceive) ×2

<!-- note:genomeForParent -->
A child of two people — real heredity, not an average.

The genome engine's crossover copies in blocks, lets a dominant allele win
where the parents' DOMINANCE_MOD says it should, and mutates on a gaussian
scaled by the parents' own mutation genes. So a child is recognisably
theirs, occasionally carries something neither of them shows, and has their
grandmother's eyes about as often as a person does. The five trait axes,
the pulse, the identity and the visible tells are all read off the result
rather than blended by hand — which means a child's caution is inherited
because the genes for it were, not because the number was averaged.

The player has no genome (there is no gene for being the captain), so where
one parent is the player the child is crossed with a body grown from the
pilot's own race and callsign — stable, and theirs.

- L105 · `` const stand = generateNPC(`parent:${p.id}:${p.raceId ?? "terran"}`, { raceId: p.raceId ??  `` — the player, or somebody who left no record: a body from who they are
<!-- /note -->

### <a id="s-conceive"></a>`conceive(carrier, sire)`

function · **exported** · L109–153

- calls: [`file`](../corp/gdb.js.md#s-file) _js/corp/gdb.js_ · [`genomeForParent`](#s-genomeForParent) ×2 · [`applyHeritage`](heritage.js.md#s-applyHeritage) _js/crew/heritage.js_ · [`heritageFor`](heritage.js.md#s-heritageFor) _js/crew/heritage.js_ · [`heritageLine`](heritage.js.md#s-heritageLine) _js/crew/heritage.js_ · [`breed`](../genome/spacer.js.md#s-breed) _js/genome/spacer.js_ · [`fingerprint`](../genome/spacer.js.md#s-fingerprint) _js/genome/spacer.js_ · [`genomeIdentity`](../genome/spacer.js.md#s-genomeIdentity) _js/genome/spacer.js_ · [`genomePulse`](../genome/spacer.js.md#s-genomePulse) _js/genome/spacer.js_ · [`genomeTells`](../genome/spacer.js.md#s-genomeTells) _js/genome/spacer.js_ · [`genomeTraits`](../genome/spacer.js.md#s-genomeTraits) _js/genome/spacer.js_ · [`kinship`](../genome/spacer.js.md#s-kinship) _js/genome/spacer.js_ ×2 · [`packGenome`](../genome/spacer.js.md#s-packGenome) _js/genome/spacer.js_ · [`skillAptitude`](../genome/spacer.js.md#s-skillAptitude) _js/genome/spacer.js_ ×2 · [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_ · [`genomeOf`](../npc/cradle.js.md#s-genomeOf) _js/npc/cradle.js_ · [`looksLine`](../npc/cradle.js.md#s-looksLine) _js/npc/cradle.js_ · [`childFamily`](../world/names.js.md#s-childFamily) _js/world/names.js_ · [`nameRng`](../world/names.js.md#s-nameRng) _js/world/names.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.note`
- via [js/sim/sim.js](../sim/sim.js.md): `sim.time.toFixed`
- called by: [`tickHousehold`](#s-tickHousehold) ×2

<!-- note:conceive -->
- L135 · `const t = {};` — no genomes on file (an imported save mid-migration): the old blend
- L142 · `const heritage = heritageFor(carrier, sire, { aptitude: child.aptitude ?? skillAptitude(ge` — What the house does, as well as what the bodies do. Two hands in the same
  trade raise the next generation of it: the child is born into the complex,
  comes of age already carrying a share of what their parents knew, and
  learns the rest of that trade faster than anybody who came to it cold.
  Every complex works this way, not just the drills.
- L145 · `` const surname = childFamily(sire, carrier, child.gender, child.raceId ?? raceId, nameRng(` `` — A family name from one parent — but which part of a name is the family
  part depends on the tongue. "Noil of the Sind" does not hand down "Sind",
  a Brann hands down their own given name with a suffix on it, and a Veyd
  has nothing to hand down at all. childFamily knows the difference.
- L147 · `gdbFile(child, { kind: "born", group: [carrier, sire, ...crew.aboard, ...household.childre` — 0.3.54: into the GDB — not a sibling's name, not a parent's, not a shipmate's
<!-- /note -->

### <a id="s-tickHousehold"></a>`tickHousehold()`

function · **exported** · L155–220

- calls: [`comeOfAge`](children.js.md#s-comeOfAge) _js/crew/children.js_ · [`berthsRoom`](#s-berthsRoom) · [`canConceive`](#s-canConceive) · [`conceive`](#s-conceive) ×2 · [`hashRoll`](#s-hashRoll) · [`loadSocial`](#s-loadSocial) · [`note`](#s-note) ×5 · [`partnerOf`](#s-partnerOf) · [`personById`](#s-personById) ×2 · [`startingLetter`](heritage.js.md#s-startingLetter) _js/crew/heritage.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ ×3
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- via [js/sim/sim.js](../sim/sim.js.md): `sim.time.toFixed`

<!-- note:tickHousehold -->
Every cycle, from tickCrew's hook: pregnancies advance, children grow, pairs may conceive.

- L157 · `for (const p of [...household.pregnancies]) {` — pregnancies
- L165 · `const twin = conceive(carrier, sire);` — a second child, crossed from the same two people with its own seed —
  fraternal, so it is genuinely a sibling and not a copy
- L178 · `for (const c of [...household.children]) {` — children grow
- L184 · `const h = rec.heritage;` — a child of the trade does not walk into a hall as a stranger
- L196 · `if (!social.family || social.adult) return;` — Conceptions. With the adult layer on, a child comes from a couple who had
  a berth to themselves and were not being careful (crew/romance.js) — the
  blanket per-cycle roll would double-count it, so it stands down.
<!-- /note -->

### <a id="s-hashRoll"></a>`hashRoll(s)`

function · L222–226

- called by: [`crewTopics.run~9`](#s-crewTopics-run-9) · [`tickHousehold`](#s-tickHousehold)

<!-- note:hashRoll -->
<!-- /note -->

### <a id="s-berthsRoom"></a>`berthsRoom()`

function · L228–231

- calls: [`berthsUsed`](#s-berthsUsed) ×2 · [`overBerths`](#s-overBerths)
- called by: [`tickHousehold`](#s-tickHousehold)

<!-- note:berthsRoom -->
<!-- /note -->

### <a id="s-familyOf"></a>`familyOf(m)`

function · **exported** · L233–237

- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.find`
- called by: [`crewTopics`](#s-crewTopics) · [`settleFamily`](#s-settleFamily) · [`talkContext`](talk.js.md#s-talkContext) _js/crew/talk.js_ · [`subLine`](talkview.js.md#s-subLine) _js/crew/talkview.js_

<!-- note:familyOf -->
The people who go with this hand if they leave: partner (if crew) and their children.
<!-- /note -->

### <a id="s-settleFamily"></a>`settleFamily(id, mode=)`

function · **exported** · L239–276

- calls: [`payOffAndRecord`](../corp/company.js.md#s-payOffAndRecord) _js/corp/company.js_ · [`settleAsStaff`](../corp/company.js.md#s-settleAsStaff) _js/corp/company.js_ · [`familyOf`](#s-familyOf) · [`note`](#s-note) ×2 · [`carryPregnancyAshore`](../station/stationlife.js.md#s-carryPregnancyAshore) _js/station/stationlife.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.put`
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.find`, `crew.aboard.indexOf`, `crew.aboard.splice`
- called by: [`rosterCard`](../console/panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ ×2 · [`crewTopics.run~12`](#s-crewTopics-run-12) · [`crewTopics.run~13`](#s-crewTopics-run-13) · [`crewSection>pay`](../station/deckhall.js.md#s-crewSection-pay) _js/station/deckhall.js_ · [`crewSection>settle`](../station/deckhall.js.md#s-crewSection-settle) _js/station/deckhall.js_

<!-- note:settleFamily -->
Settle a hand and theirs at the docked port. mode: "staff" (company books)
or "payoff" (severance, recorded). Returns null or the reason it failed.

- L250 · `for (const g of going) {` — they leave the roster without a departure penalty on whoever stays: this was the plan
- L263 · `for (const p of [...household.pregnancies]) {` — A pregnancy does not stop because its carrier took a berth ashore. It
  goes with them: js/station/stationlife.js carries it the rest of the way and the
  child is born at the port, on the company's books, where it grows up and
  eventually goes on the rolls as family rather than as a hire.
<!-- /note -->

### <a id="s-first"></a>`first(m)`

function · L278–278

- called by: [`couldCourt`](#s-couldCourt) ×2 · [`crewTopics`](#s-crewTopics) ×2 · [`crewTopics.run~5`](#s-crewTopics-run-5) · [`crewTopics.run~6`](#s-crewTopics-run-6) · [`greetLine`](#s-greetLine)

<!-- note:first -->
---- talk ------------------------------------------------------------------
<!-- /note -->

### <a id="s-cap"></a>`cap(s)`

function · L279–279

- called by: [`crewTopics.run~2`](#s-crewTopics-run-2) · [`crewTopics.run~6`](#s-crewTopics-run-6)

<!-- note:cap -->
<!-- /note -->

### <a id="s-trustOf"></a>`trustOf(m)`

function · **exported** · L281–281

- called by: [`rosterCard`](../console/panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ · [`CORE_BEATS.when~3`](beats.js.md#s-CORE_BEATS-when-3) _js/crew/beats.js_ · [`odds`](beats.js.md#s-odds) _js/crew/beats.js_ · [`holdingsOf`](deckmind.js.md#s-holdingsOf) _js/crew/deckmind.js_ · [`adjustTrust`](#s-adjustTrust) · [`couldCourt`](#s-couldCourt) · [`crewTopics.run~9`](#s-crewTopics-run-9) · [`greetLine`](#s-greetLine) · [`SORTERS.trust`](roster.js.md#s-SORTERS-trust) _js/crew/roster.js_ ×2 · [`unsettled`](roster.js.md#s-unsettled) _js/crew/roster.js_ · [`TREE.say~16.say`](talk-trees.js.md#s-TREE-say-16-say) _js/crew/talk-trees.js_ · [`subLine`](talkview.js.md#s-subLine) _js/crew/talkview.js_ · [`friendTier`](tiers.js.md#s-friendTier) _js/crew/tiers.js_ · [`romanceTier`](tiers.js.md#s-romanceTier) _js/crew/tiers.js_ ×2 · [`crewSection`](../station/deckhall.js.md#s-crewSection) _js/station/deckhall.js_

<!-- note:trustOf -->
<!-- /note -->

### <a id="s-adjustTrust"></a>`adjustTrust(m, d)`

function · **exported** · L282–282

- calls: [`trustOf`](#s-trustOf)
- called by: [`applyOutcome`](beats.js.md#s-applyOutcome) _js/crew/beats.js_ ×2 · [`applyAction`](deckacts.js.md#s-applyAction) _js/crew/deckacts.js_ · [`coachHabit`](orders.js.md#s-coachHabit) _js/crew/orders.js_ · [`giveOrder`](orders.js.md#s-giveOrder) _js/crew/orders.js_ · [`answerFreeText`](talk.js.md#s-answerFreeText) _js/crew/talk.js_ ×3 · [`applyFx`](talk.js.md#s-applyFx) _js/crew/talk.js_

<!-- note:adjustTrust -->
Move a hand's trust in you / morale, clamped. A robot's morale never moves (it has none).
<!-- /note -->

### <a id="s-adjustMorale"></a>`adjustMorale(m, d)`

function · **exported** · L283–283

- called by: [`applyOutcome`](beats.js.md#s-applyOutcome) _js/crew/beats.js_ · [`tickBonds`](bonds.js.md#s-tickBonds) _js/crew/bonds.js_ ×2 · [`applyAction`](deckacts.js.md#s-applyAction) _js/crew/deckacts.js_ ×6 · [`driftNeeds`](deckmind.js.md#s-driftNeeds) _js/crew/deckmind.js_ · [`tickDuties`](duties.js.md#s-tickDuties) _js/crew/duties.js_ · [`tickDutiesCycle`](duties.js.md#s-tickDutiesCycle) _js/crew/duties.js_ ×2 · [`coachHabit`](orders.js.md#s-coachHabit) _js/crew/orders.js_ · [`giveOrder`](orders.js.md#s-giveOrder) _js/crew/orders.js_ ×2 · [`actOnJealousy`](romance.js.md#s-actOnJealousy) _js/crew/romance.js_ ×2 · [`bond`](romance.js.md#s-bond) _js/crew/romance.js_ ×3 · [`breakOff`](romance.js.md#s-breakOff) _js/crew/romance.js_ ×2 · [`makePartners`](romance.js.md#s-makePartners) _js/crew/romance.js_ ×2 · [`privateNight`](romance.js.md#s-privateNight) _js/crew/romance.js_ ×2 · [`answerFreeText`](talk.js.md#s-answerFreeText) _js/crew/talk.js_ ×2 · [`applyFx`](talk.js.md#s-applyFx) _js/crew/talk.js_ ×2

<!-- note:adjustMorale -->
<!-- /note -->

### <a id="s-bumpTrust"></a>`bumpTrust`

const · **exported** · L284–284

- called by: [`crewTopics.run~10`](#s-crewTopics-run-10) · [`crewTopics.run~11`](#s-crewTopics-run-11) · [`crewTopics.run~2`](#s-crewTopics-run-2) · [`crewTopics.run~3`](#s-crewTopics-run-3) ×2 · [`crewTopics.run~4`](#s-crewTopics-run-4) · [`crewTopics.run~5`](#s-crewTopics-run-5) ×2 · [`crewTopics.run~9`](#s-crewTopics-run-9) ×2 · [`pairWithPlayer`](#s-pairWithPlayer)

<!-- note:bumpTrust -->
the old names, kept as aliases
<!-- /note -->

### <a id="s-bumpMorale"></a>`bumpMorale`

const · **exported** · L285–285

- called by: [`crewTopics.run~10`](#s-crewTopics-run-10) · [`crewTopics.run~11`](#s-crewTopics-run-11) · [`crewTopics.run~3`](#s-crewTopics-run-3) ×2 · [`crewTopics.run~4`](#s-crewTopics-run-4) · [`crewTopics.run~5`](#s-crewTopics-run-5) ×3 · [`pairWithPlayer`](#s-pairWithPlayer)

<!-- note:bumpMorale -->
<!-- /note -->

### <a id="s-pairWithPlayer"></a>`pairWithPlayer(m)`

function · **exported** · L287–298

- calls: [`bumpMorale`](#s-bumpMorale) · [`bumpTrust`](#s-bumpTrust) · [`couldCourt`](#s-couldCourt) · [`note`](#s-note) · [`playerAsPerson`](#s-playerAsPerson)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`, `cradle.put`
- called by: [`CORE_BEATS.resolve~5`](beats.js.md#s-CORE_BEATS-resolve-5) _js/crew/beats.js_ · [`crewTopics.run~9`](#s-crewTopics-run-9)

<!-- note:pairWithPlayer -->
Whether this hand would take you up on it: the switch, their interest, yours.

The captain and a hand become a couple. One place does it, because there are
two ways in now — the TALK topic and the staged dinner act (crew/beats.js) —
and the beat used to set `m.partner` on its own, leaving the ledger with no
record and the crew log with nothing in it.
<!-- /note -->

### <a id="s-couldCourt"></a>`couldCourt(m)`

function · **exported** · L300–310

- calls: [`first`](#s-first) ×2 · [`loadSocial`](#s-loadSocial) · [`playerAsPerson`](#s-playerAsPerson) · [`trustOf`](#s-trustOf) · [`drawnTo`](../npc/cradle.js.md#s-drawnTo) _js/npc/cradle.js_ ×2
- called by: [`CORE_BEATS.resolve~5`](beats.js.md#s-CORE_BEATS-resolve-5) _js/crew/beats.js_ · [`CORE_BEATS.when~5`](beats.js.md#s-CORE_BEATS-when-5) _js/crew/beats.js_ · [`crewTopics`](#s-crewTopics) · [`pairWithPlayer`](#s-pairWithPlayer) · [`romanceTier`](tiers.js.md#s-romanceTier) _js/crew/tiers.js_

<!-- note:couldCourt -->
<!-- /note -->

### <a id="s-crewTopics"></a>`crewTopics(m, ctx=)`

function · **exported** · L312–413

- calls: [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ ×2 · [`couldCourt`](#s-couldCourt) · [`familyOf`](#s-familyOf) · [`first`](#s-first) ×2 · [`loadSocial`](#s-loadSocial) · [`partnerOf`](#s-partnerOf)
- called by: [`baseNodes`](talk.js.md#s-baseNodes) _js/crew/talk.js_

<!-- note:crewTopics -->
The dialogue tree for a hand: [{ id, label, cls?, run() → line }]. The
interior panel renders it; the tests read it. Lines are first-person theirs.
<!-- /note -->

#### <a id="s-crewTopics-run"></a>`crewTopics.run()`

prop · L322–326

<!-- note:crewTopics.run -->
<!-- /note -->

#### <a id="s-crewTopics-run-2"></a>`crewTopics.run~2()`

prop · L328–334

- calls: [`bumpTrust`](#s-bumpTrust) · [`cap`](#s-cap) · [`line`](voice.js.md#s-line) _js/crew/voice.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- via [js/crew/races.js](races.js.md): `RACES.find`

<!-- note:crewTopics.run~2 -->
<!-- /note -->

#### <a id="s-crewTopics-run-3"></a>`crewTopics.run~3()`

prop · L336–340

- calls: [`bumpMorale`](#s-bumpMorale) ×2 · [`bumpTrust`](#s-bumpTrust) ×2 · [`line`](voice.js.md#s-line) _js/crew/voice.js_ ×2 · [`wrap`](voice.js.md#s-wrap) _js/crew/voice.js_ ×2

<!-- note:crewTopics.run~3 -->
<!-- /note -->

#### <a id="s-crewTopics-run-4"></a>`crewTopics.run~4()`

prop · L342–348

- calls: [`bumpMorale`](#s-bumpMorale) · [`bumpTrust`](#s-bumpTrust) · [`line`](voice.js.md#s-line) _js/crew/voice.js_ · [`wrap`](voice.js.md#s-wrap) _js/crew/voice.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_

<!-- note:crewTopics.run~4 -->
<!-- /note -->

#### <a id="s-crewTopics-run-5"></a>`crewTopics.run~5()`

prop · L350–355

- calls: [`bumpMorale`](#s-bumpMorale) ×3 · [`bumpTrust`](#s-bumpTrust) ×2 · [`first`](#s-first) · [`line`](voice.js.md#s-line) _js/crew/voice.js_ ×2 · [`wrap`](voice.js.md#s-wrap) _js/crew/voice.js_ ×2

<!-- note:crewTopics.run~5 -->
<!-- /note -->

#### <a id="s-crewTopics-run-6"></a>`crewTopics.run~6()`

prop · L358–362

- calls: [`cap`](#s-cap) · [`first`](#s-first) · [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_

<!-- note:crewTopics.run~6 -->
<!-- /note -->

#### <a id="s-crewTopics-run-7"></a>`crewTopics.run~7()`

prop · L365–368

- calls: [`overBerths`](#s-overBerths)

<!-- note:crewTopics.run~7 -->
<!-- /note -->

#### <a id="s-crewTopics-run-8"></a>`crewTopics.run~8()`

prop · L371–371

<!-- note:crewTopics.run~8 -->
<!-- /note -->

#### <a id="s-crewTopics-run-9"></a>`crewTopics.run~9()`

prop · L375–387

- calls: [`bumpTrust`](#s-bumpTrust) ×2 · [`hashRoll`](#s-hashRoll) · [`pairWithPlayer`](#s-pairWithPlayer) · [`trustOf`](#s-trustOf) · [`line`](voice.js.md#s-line) _js/crew/voice.js_ ×3 · [`wrap`](voice.js.md#s-wrap) _js/crew/voice.js_ ×3
- via [js/sim/sim.js](../sim/sim.js.md): `sim.time.toFixed`

<!-- note:crewTopics.run~9 -->
<!-- /note -->

#### <a id="s-crewTopics-run-10"></a>`crewTopics.run~10()`

prop · L389–394

- calls: [`bumpMorale`](#s-bumpMorale) · [`bumpTrust`](#s-bumpTrust) · [`note`](#s-note)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`

<!-- note:crewTopics.run~10 -->
<!-- /note -->

#### <a id="s-crewTopics-run-11"></a>`crewTopics.run~11()`

prop · L398–402

- calls: [`bumpMorale`](#s-bumpMorale) · [`bumpTrust`](#s-bumpTrust)

<!-- note:crewTopics.run~11 -->
<!-- /note -->

#### <a id="s-crewTopics-run-12"></a>`crewTopics.run~12()`

prop · L403–406

- calls: [`settleFamily`](#s-settleFamily)

<!-- note:crewTopics.run~12 -->
<!-- /note -->

#### <a id="s-crewTopics-run-13"></a>`crewTopics.run~13()`

prop · L407–410

- calls: [`settleFamily`](#s-settleFamily)

<!-- note:crewTopics.run~13 -->
<!-- /note -->

### <a id="s-greetLine"></a>`greetLine(m)`

function · **exported** · L415–426

- calls: [`first`](#s-first) · [`trustOf`](#s-trustOf) · [`line`](voice.js.md#s-line) _js/crew/voice.js_ ×4 · [`wrap`](voice.js.md#s-wrap) _js/crew/voice.js_ ×4
- called by: [`greet`](talk.js.md#s-greet) _js/crew/talk.js_

<!-- note:greetLine -->
A greeting that knows who is talking.

The seed moves once a cycle rather than once a frame, so a hand does not
recite a new line every time the panel repaints — but come back after a
watch and they greet you differently. Ninety-nine bags of these arrived from
Shane's own voice bank (js/crew/voice-bank.js, 2,848 lines); this picks the
bag and the bank picks the line.
<!-- /note -->

### <a id="s-resetHousehold"></a>`resetHousehold()`

function · **exported** · L430–434

- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:resetHousehold -->
<!-- /note -->

### <a id="s-wireFamily"></a>`wireFamily()`

function · **exported** · L436–438

- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:wireFamily -->
<!-- /note -->
