# js/corp/corps.js

[index](../../../README.md) · 262 lines · 33 symbols · 3 imports · 45 importers

## About

<!-- note:@file -->
LIVING GALAXY — corporations.

Sixteen per sky, grown from the system seed: five majors that hold the
charters, five alternates working the margins, five hostiles who stopped
pretending — and one Security Directorate, chartered to answer distress
calls and flying every patrol and picket hull in the sky. Every one is tied
to a sector, so who you trade with and who you shoot at moves the same
numbers.

The directorate is the odd one out and deliberately so: it holds no ports
of its own, it is paid a retainer by the ports it covers, and its standing
is the single number that decides whether the cavalry comes when YOU put
out a call. See npc/security.js for what it actually does.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../economy/materials.js` | `SECTOR_IDS`, `SECTORS` | [js/economy/materials.js](../economy/materials.js.md) |
| 2 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 3 | `../data/factions.js` | `POWERS`, `powersOf`, `relationOf` as `powerRelation`, `relationLabel` | [js/data/factions.js](../data/factions.js.md) |

## Imported by

- [js/aria/senses.js](../aria/senses.js.md) — `corps`, `corpOfStation`, `standingLabel`
- [js/comms/comms.js](../comms/comms.js.md) — `adjustStanding`, `corpOfStation`, `corpOfVessel`, `standingLabel`
- [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md) — `corpById`, `standingLabel`
- [js/console/panels/corp.js](../console/panels/corp.js.md) — `standingLabel`, `corpOfStation`
- [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md) — `corpById`
- [js/corp/company.js](company.js.md) — `corpOfStation`, `adjustStanding`
- [js/corp/fleet.js](fleet.js.md) — `corpOfStation`
- [js/corp/seclevel.js](seclevel.js.md) — `adjustStanding`, `corpOfStation`
- [js/crew/captive.js](../crew/captive.js.md) — `corpById`, `adjustStanding`
- [js/drones/npcdrones.js](../drones/npcdrones.js.md) — `corps`, `corpById`
- [js/economy/contracts.js](../economy/contracts.js.md) — `corpOfStation`, `corpRelation`, `corps`, `adjustStanding`, `standingLabel`
- [js/flight/pilot.js](../flight/pilot.js.md) — `corpById`, `corps`, `setStandingMods`
- [js/flight/repair.js](../flight/repair.js.md) — `corpOfStation`
- [js/npc/battles.js](../npc/battles.js.md) — `corpOfVessel`, `corpRelation`
- [js/npc/bounty.js](../npc/bounty.js.md) — `corps`, `corpById`, `corpOfStation`, `corpRelation`, `adjustStanding`
- [js/npc/captain.js](../npc/captain.js.md) — `corpOfStation`
- [js/npc/combat.js](../npc/combat.js.md) — `corpOfVessel`, `corpRelation`
- [js/npc/security.js](../npc/security.js.md) — `corps`, `corpById`, `corpOfVessel`, `corpRelation`, `adjustStanding`
- [js/npc/speech.js](../npc/speech.js.md) — `corpOfStation`, `corpOfVessel`, `corpById`, `adjustStanding`
- [js/npc/traffic.js](../npc/traffic.js.md) — `corpById`
- [js/sim/sim.js](../sim/sim.js.md) — `buildCorps`, `corpOfStation`, `corpOfVessel`, `corpById`, `blameKill`, `adjustStanding`, `standingMargin`, `corps`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `corpOfStation`, `standingLabel`
- [js/station/stationlife.js](../station/stationlife.js.md) — `adjustStanding`, `corpOfStation`
- [js/ui/boardview.js](../ui/boardview.js.md) — `corps`, `standingLabel`
- [js/ui/creation.js](../ui/creation.js.md) — `byTier`, `buildCorps`, `corps`
- [js/ui/dockboot.js](../ui/dockboot.js.md) — `corpOfStation`, `standingLabel`
- [js/ui/map.js](../ui/map.js.md) — `corpOfVessel`, `standingLabel`
- [js/world/events/atmoworks.js](../world/events/atmoworks.js.md) — `adjustStanding`, `corps`
- test/ariabiz.test.mjs _(outside js/)_ — `corps`
- test/ariaplay.test.mjs _(outside js/)_ — `corps`
- test/ariasense.test.mjs _(outside js/)_ — `corps`
- test/board.test.mjs _(outside js/)_ — `corps`, `corpOfStation`, `corpRelation`
- test/bounty.test.mjs _(outside js/)_ — `corps`, `corpById`, `corpRelation`, `corpOfStation`
- test/chains.test.mjs _(outside js/)_ — `corps`
- test/desk.test.mjs _(outside js/)_ — `corps`, `corpOfStation`
- test/dockwork.test.mjs _(outside js/)_ — `corps`
- test/hold.test.mjs _(outside js/)_ — `corps`
- test/jobloop.test.mjs _(outside js/)_ — `corps`
- test/marks.test.mjs _(outside js/)_ — `corps`
- test/people.test.mjs _(outside js/)_ — `corps`, `corpOfVessel`, `corpRelation`, `corpWars`, `blameKill`, `corpById`, `standingLabel`
- test/portdrones.test.mjs _(outside js/)_ — `corps`, `corpById`
- test/reactive.test.mjs _(outside js/)_ — `corps`
- test/sites.test.mjs _(outside js/)_ — `corps`
- test/speech.test.mjs _(outside js/)_ — `corpById`
- test/undock.test.mjs _(outside js/)_ — `corps`

## Exports

- `relationLabel` — **no importer in scanned roots**
- [`corps`](#s-corps) · const — used by [js/aria/senses.js](../aria/senses.js.md), [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/pilot.js](../flight/pilot.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/npc/security.js](../npc/security.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/boardview.js](../ui/boardview.js.md), [js/ui/creation.js](../ui/creation.js.md), [js/world/events/atmoworks.js](../world/events/atmoworks.js.md), test/ariabiz.test.mjs, test/ariaplay.test.mjs, test/ariasense.test.mjs, test/board.test.mjs, test/bounty.test.mjs, test/chains.test.mjs, test/desk.test.mjs, test/dockwork.test.mjs, test/hold.test.mjs, test/jobloop.test.mjs, test/marks.test.mjs, test/people.test.mjs, test/portdrones.test.mjs, test/reactive.test.mjs, test/sites.test.mjs, test/undock.test.mjs
- [`corpRelation`](#s-corpRelation) · function — used by [js/economy/contracts.js](../economy/contracts.js.md), [js/npc/battles.js](../npc/battles.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/npc/combat.js](../npc/combat.js.md), [js/npc/security.js](../npc/security.js.md), test/board.test.mjs, test/bounty.test.mjs, test/people.test.mjs
- [`corpWars`](#s-corpWars) · function — used by test/people.test.mjs
- [`buildCorps`](#s-buildCorps) · function — used by [js/sim/sim.js](../sim/sim.js.md), [js/ui/creation.js](../ui/creation.js.md)
- [`corpOfVessel`](#s-corpOfVessel) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/npc/battles.js](../npc/battles.js.md), [js/npc/combat.js](../npc/combat.js.md), [js/npc/security.js](../npc/security.js.md), [js/npc/speech.js](../npc/speech.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/map.js](../ui/map.js.md), test/people.test.mjs
- [`blameKill`](#s-blameKill) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/people.test.mjs
- [`corpById`](#s-corpById) · function — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), [js/crew/captive.js](../crew/captive.js.md), [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/flight/pilot.js](../flight/pilot.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/npc/security.js](../npc/security.js.md), [js/npc/speech.js](../npc/speech.js.md), [js/npc/traffic.js](../npc/traffic.js.md), [js/sim/sim.js](../sim/sim.js.md), test/bounty.test.mjs, test/people.test.mjs, test/portdrones.test.mjs, test/speech.test.mjs
- [`corpOfStation`](#s-corpOfStation) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/corp/company.js](company.js.md), [js/corp/fleet.js](fleet.js.md), [js/corp/seclevel.js](seclevel.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/repair.js](../flight/repair.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/npc/speech.js](../npc/speech.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), [js/station/stationlife.js](../station/stationlife.js.md), [js/ui/dockboot.js](../ui/dockboot.js.md), test/board.test.mjs, test/bounty.test.mjs, test/desk.test.mjs
- [`byTier`](#s-byTier) · function — used by [js/ui/creation.js](../ui/creation.js.md)
- [`setStandingMods`](#s-setStandingMods) · function — used by [js/flight/pilot.js](../flight/pilot.js.md)
- [`adjustStanding`](#s-adjustStanding) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/corp/company.js](company.js.md), [js/corp/seclevel.js](seclevel.js.md), [js/crew/captive.js](../crew/captive.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/npc/security.js](../npc/security.js.md), [js/npc/speech.js](../npc/speech.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationlife.js](../station/stationlife.js.md), [js/world/events/atmoworks.js](../world/events/atmoworks.js.md)
- [`standingLabel`](#s-standingLabel) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), [js/ui/boardview.js](../ui/boardview.js.md), [js/ui/dockboot.js](../ui/dockboot.js.md), [js/ui/map.js](../ui/map.js.md), test/people.test.mjs
- [`standingMargin`](#s-standingMargin) · function — used by [js/sim/sim.js](../sim/sim.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-TIER_BLOC"></a>`TIER_BLOC`

const · L6–6

<!-- note:TIER_BLOC -->
Each tier of local outfit is chartered under one of the galactic blocs
(data/factions.js): majors hold Coalition paper, alternates signed nothing,
hostiles are Outer. The power a corp answers to gives it a charter and a
temper — and the power's wars are the corp's wars.
<!-- /note -->

### <a id="s-MAJOR_HEADS"></a>`MAJOR_HEADS`

const · L8–11

<!-- note:MAJOR_HEADS -->
<!-- /note -->

### <a id="s-MAJOR_TAILS"></a>`MAJOR_TAILS`

const · L12–15

<!-- note:MAJOR_TAILS -->
<!-- /note -->

### <a id="s-ALT_HEADS"></a>`ALT_HEADS`

const · L16–19

<!-- note:ALT_HEADS -->
<!-- /note -->

### <a id="s-ALT_TAILS"></a>`ALT_TAILS`

const · L20–20

<!-- note:ALT_TAILS -->
<!-- /note -->

### <a id="s-HOSTILE_HEADS"></a>`HOSTILE_HEADS`

const · L21–24

<!-- note:HOSTILE_HEADS -->
<!-- /note -->

### <a id="s-HOSTILE_TAILS"></a>`HOSTILE_TAILS`

const · L25–25

<!-- note:HOSTILE_TAILS -->
<!-- /note -->

### <a id="s-MAJOR_LINES"></a>`MAJOR_LINES`

const · L27–35

<!-- note:MAJOR_LINES -->
<!-- /note -->

### <a id="s-ALT_LINES"></a>`ALT_LINES`

const · L36–43

<!-- note:ALT_LINES -->
<!-- /note -->

### <a id="s-HOSTILE_LINES"></a>`HOSTILE_LINES`

const · L44–51

<!-- note:HOSTILE_LINES -->
<!-- /note -->

### <a id="s-LAW_HEADS"></a>`LAW_HEADS`

const · L53–56

<!-- note:LAW_HEADS -->
The directorate names itself after the writ it flies under, not after a
founder — it is a chartered service, not a family firm.
<!-- /note -->

### <a id="s-LAW_TAILS"></a>`LAW_TAILS`

const · L57–60

<!-- note:LAW_TAILS -->
<!-- /note -->

### <a id="s-LAW_LINES"></a>`LAW_LINES`

const · L61–66

<!-- note:LAW_LINES -->
<!-- /note -->

### <a id="s-seq"></a>`seq`

const · L68–68

<!-- note:seq -->
<!-- /note -->

### <a id="s-corps"></a>`corps`

const · **exported** · L69–69

<!-- note:corps -->
<!-- /note -->

### <a id="s-pick"></a>`pick(rnd, arr)`

function · L71–73

- called by: [`buildCorps`](#s-buildCorps) ×5 · [`charterCorps`](#s-charterCorps) ×4 · [`make`](#s-make) · [`nameFrom`](#s-nameFrom) ×3

<!-- note:pick -->
<!-- /note -->

### <a id="s-nameFrom"></a>`nameFrom(rnd, heads, tails, used)`

function · L75–80

- calls: [`pick`](#s-pick) ×3
- called by: [`make`](#s-make)

<!-- note:nameFrom -->
One family name per sky. Two outfits called Kessler read as a bug, not a
dynasty, so the head is what gets reserved — not the whole name.
<!-- /note -->

### <a id="s-make"></a>`make(rnd, tier, used, sector)`

function · L82–104

- calls: [`nameFrom`](#s-nameFrom) · [`pick`](#s-pick)
- called by: [`buildCorps`](#s-buildCorps) ×4

<!-- note:make -->
- L95 · `standing: tier === "major" ? 0 : tier === "alt" ? 10 : tier === "law" ? 5 : -60,` — -100 .. +100. Majors start indifferent, alternates warm, hostiles are not.
  The directorate starts correct rather than friendly: it has no opinion
  about a pilot it has never had to come out for.
- L96 · `margin: tier === "major" ? 1.0 : tier === "alt" ? 1.06 : tier === "law" ? 1.0 : 0.85,` — what they pay above or below the sector rate
- L98 · `bloc: TIER_BLOC[tier],` — filled by charterCorps(): the galactic power this outfit answers to
- L102 · `feuds: {},` — local feuds on top of the powers' wars: corpId → shift
<!-- /note -->

### <a id="s-charterCorps"></a>`charterCorps(rnd)`

function · L106–125

- calls: [`charterCorps>feud`](#s-charterCorps-feud) ×2 · [`pick`](#s-pick) ×4 · [`powersOf`](../data/factions.js.md#s-powersOf) _js/data/factions.js_
- called by: [`buildCorps`](#s-buildCorps)

<!-- note:charterCorps -->
Hand every outfit a power of its bloc, and seed a few local feuds.

- L118 · `const civil = corps.filter((c) => c.tier !== "hostile");` — a sky has its own quarrels: two or three pairs of honest outfits at odds, and one old alliance
<!-- /note -->

#### <a id="s-charterCorps-feud"></a>`charterCorps>feud(a, b, v)`

function · L119–119

- called by: [`charterCorps`](#s-charterCorps) ×2

<!-- note:charterCorps>feud -->
<!-- /note -->

### <a id="s-corpRelation"></a>`corpRelation(a, b)`

function · **exported** · L127–136

- calls: [`corpById`](#s-corpById) ×2 · [`relationOf`](../data/factions.js.md#s-relationOf) _js/data/factions.js_
- called by: [`blameKill`](#s-blameKill) · [`corpWars`](#s-corpWars) · [`issuersAt`](../economy/contracts.js.md#s-issuersAt) _js/economy/contracts.js_ · [`settle`](../economy/contracts.js.md#s-settle) _js/economy/contracts.js_ · [`engagementFor`](../npc/battles.js.md#s-engagementFor) _js/npc/battles.js_ · [`attemptCapture`](../npc/bounty.js.md#s-attemptCapture) _js/npc/bounty.js_ · [`boardAt`](../npc/bounty.js.md#s-boardAt) _js/npc/bounty.js_ · [`hostileTo`](../npc/combat.js.md#s-hostileTo) _js/npc/combat.js_ · [`coverageFor`](../npc/security.js.md#s-coverageFor) _js/npc/security.js_

<!-- note:corpRelation -->
How corp `a` regards corp `b`, −1 (war) .. +1 (allied): the powers' history plus the sky's own feuds.
<!-- /note -->

### <a id="s-corpWars"></a>`corpWars()`

function · **exported** · L138–145

- calls: [`corpRelation`](#s-corpRelation) · [`relationLabel`](../data/factions.js.md#s-relationLabel) _js/data/factions.js_

<!-- note:corpWars -->
Every pair of local outfits at war or hostile, worst first — the sky's live corp wars.
<!-- /note -->

### <a id="s-buildCorps"></a>`buildCorps(rnd)`

function · **exported** · L147–190

- calls: [`charterCorps`](#s-charterCorps) · [`make`](#s-make) ×4 · [`pick`](#s-pick) ×5
- via [js/station/stations.js](../station/stations.js.md): `stations.map`
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_ · [`mountCreation.show`](../ui/creation.js.md#s-mountCreation-show) _js/ui/creation.js_

<!-- note:buildCorps -->
Grows the roster for a system and hands each corporation the ports it runs.
Call after buildStations so there is something to hand out.

- L152 · `const order = [...SECTOR_IDS].sort(() => rnd() - 0.5);` — Majors take one sector each, so the five cover the economy.
- L156 · `corps.push(make(rnd, "law", used, "military"));` — one directorate, chartered to the military sector whether or not this sky
  has a military port — it is the writ that places it, not a berth
- L158 · `const majors = corps.filter((c) => c.tier === "major");` — Hand out the ports. A port flies somebody's flag.
- L173 · `const byId = new Map(stations.map((s) => [s.id, s]));` — A charter holder with no berth is not a charter holder. Any major left
  empty takes a port off whichever outfit is holding the most.
<!-- /note -->

### <a id="s-corpOfVessel"></a>`corpOfVessel(n)`

function · **exported** · L192–197

- calls: [`corpById`](#s-corpById) · [`corpOfStation`](#s-corpOfStation)
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`hailContact`](../comms/comms.js.md#s-hailContact) _js/comms/comms.js_ ×5 · [`withTalk>provider`](../comms/comms.js.md#s-withTalk-provider) _js/comms/comms.js_ · [`blameKill`](#s-blameKill) · [`engagementFor`](../npc/battles.js.md#s-engagementFor) _js/npc/battles.js_ ×2 · [`stepBattles`](../npc/battles.js.md#s-stepBattles) _js/npc/battles.js_ · [`hostileTo`](../npc/combat.js.md#s-hostileTo) _js/npc/combat.js_ ×2 · [`callForHelp`](../npc/security.js.md#s-callForHelp) _js/npc/security.js_ · [`coverageFor`](../npc/security.js.md#s-coverageFor) _js/npc/security.js_ · [`vesselUnit`](../npc/speech.js.md#s-vesselUnit) _js/npc/speech.js_ · [`leaveHulk`](../sim/sim.js.md#s-leaveHulk) _js/sim/sim.js_ · [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ ×2 · [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_ · [`mountMap>drawSheet`](../ui/map.js.md#s-mountMap-drawSheet) _js/ui/map.js_

<!-- note:corpOfVessel -->
The corporation a hull flies for: its own flag, else its home port's.
<!-- /note -->

### <a id="s-blameKill"></a>`blameKill(n, why=)`

function · **exported** · L199–211

- calls: [`adjustStanding`](#s-adjustStanding) ×3 · [`corpOfVessel`](#s-corpOfVessel) · [`corpRelation`](#s-corpRelation)
- called by: [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_

<!-- note:blameKill -->
Shooting a hull is a standing event with its flag — and its flag's friends and enemies.
<!-- /note -->

### <a id="s-corpById"></a>`corpById(id)`

function · **exported** · L213–215

- called by: [`markCard`](../console/panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_ · [`captiveCard`](../console/panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ · [`adjustStanding`](#s-adjustStanding) · [`corpOfStation`](#s-corpOfStation) · [`corpOfVessel`](#s-corpOfVessel) · [`corpRelation`](#s-corpRelation) ×2 · [`canRecruit`](../crew/captive.js.md#s-canRecruit) _js/crew/captive.js_ · [`interact`](../crew/captive.js.md#s-interact) _js/crew/captive.js_ · [`npcDroneReport`](../drones/npcdrones.js.md#s-npcDroneReport) _js/drones/npcdrones.js_ · [`corp`](../flight/pilot.js.md#s-corp) _js/flight/pilot.js_ · [`attemptCapture`](../npc/bounty.js.md#s-attemptCapture) _js/npc/bounty.js_ · [`ransom`](../npc/bounty.js.md#s-ransom) _js/npc/bounty.js_ · [`securityCorp`](../npc/security.js.md#s-securityCorp) _js/npc/security.js_ · [`talkTo`](../npc/speech.js.md#s-talkTo) _js/npc/speech.js_ · [`vesselStatus`](../npc/traffic.js.md#s-vesselStatus) _js/npc/traffic.js_ ×2 · [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_

<!-- note:corpById -->
<!-- /note -->

### <a id="s-corpOfStation"></a>`corpOfStation(st)`

function · **exported** · L217–219

- calls: [`corpById`](#s-corpById)
- called by: [`sensePorts`](../aria/senses.js.md#s-sensePorts) _js/aria/senses.js_ · [`stationCtx`](../comms/comms.js.md#s-stationCtx) _js/comms/comms.js_ · [`withTalk>provider`](../comms/comms.js.md#s-withTalk-provider) _js/comms/comms.js_ · [`mountBoard`](../console/panels/corp.js.md#s-mountBoard) _js/console/panels/corp.js_ · [`foundCompany`](company.js.md#s-foundCompany) _js/corp/company.js_ · [`corpOfVessel`](#s-corpOfVessel) · [`spawnHull`](fleet.js.md#s-spawnHull) _js/corp/fleet.js_ · [`payFine`](seclevel.js.md#s-payFine) _js/corp/seclevel.js_ · [`chainOffer`](../economy/contracts.js.md#s-chainOffer) _js/economy/contracts.js_ · [`issuersAt`](../economy/contracts.js.md#s-issuersAt) _js/economy/contracts.js_ · [`makeOffer`](../economy/contracts.js.md#s-makeOffer) _js/economy/contracts.js_ · [`pricePerPoint`](../flight/repair.js.md#s-pricePerPoint) _js/flight/repair.js_ · [`boardAt`](../npc/bounty.js.md#s-boardAt) _js/npc/bounty.js_ · [`snapshot`](../npc/captain.js.md#s-snapshot) _js/npc/captain.js_ · [`flowUnit`](../npc/speech.js.md#s-flowUnit) _js/npc/speech.js_ · [`stationUnit`](../npc/speech.js.md#s-stationUnit) _js/npc/speech.js_ · [`laneCredit`](../sim/sim.js.md#s-laneCredit) _js/sim/sim.js_ · [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ ×2 · [`sellPriceAt`](../sim/sim.js.md#s-sellPriceAt) _js/sim/sim.js_ · [`stepLaneDiscipline`](../sim/sim.js.md#s-stepLaneDiscipline) _js/sim/sim.js_ · [`stepWarp`](../sim/sim.js.md#s-stepWarp) _js/sim/sim.js_ · [`tradeBuy`](../sim/sim.js.md#s-tradeBuy) _js/sim/sim.js_ · [`tradeSell`](../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_ · [`PANELS.board`](../station/stationdeck.js.md#s-PANELS-board) _js/station/stationdeck.js_ · [`EVENTS.run~2`](../station/stationlife.js.md#s-EVENTS-run-2) _js/station/stationlife.js_ · [`EVENTS.run~8`](../station/stationlife.js.md#s-EVENTS-run-8) _js/station/stationlife.js_ · [`mountDockBoot>build`](../ui/dockboot.js.md#s-mountDockBoot-build) _js/ui/dockboot.js_

<!-- note:corpOfStation -->
<!-- /note -->

### <a id="s-byTier"></a>`byTier(tier)`

function · **exported** · L221–223

- called by: [`mountCreation>renderCorp`](../ui/creation.js.md#s-mountCreation-renderCorp) _js/ui/creation.js_

<!-- note:byTier -->
<!-- /note -->

### <a id="s-standingMods"></a>`standingMods`

const · L225–225

<!-- note:standingMods -->
Pilot modifiers that scale standing moves: `standing` for gains, `blame` for losses.
<!-- /note -->

### <a id="s-setStandingMods"></a>`setStandingMods(m)`

function · **exported** · L226–228

- called by: [`refreshMods`](../flight/pilot.js.md#s-refreshMods) _js/flight/pilot.js_

<!-- note:setStandingMods -->
<!-- /note -->

### <a id="s-adjustStanding"></a>`adjustStanding(id, delta, reason)`

function · **exported** · L230–247

- calls: [`corpById`](#s-corpById)
- called by: [`stationCtx.standing`](../comms/comms.js.md#s-stationCtx-standing) _js/comms/comms.js_ · [`foundCompany`](company.js.md#s-foundCompany) _js/corp/company.js_ · [`blameKill`](#s-blameKill) ×3 · [`addHeat`](seclevel.js.md#s-addHeat) _js/corp/seclevel.js_ · [`payFine`](seclevel.js.md#s-payFine) _js/corp/seclevel.js_ ×2 · [`stepSecLevel`](seclevel.js.md#s-stepSecLevel) _js/corp/seclevel.js_ · [`wingArrived`](seclevel.js.md#s-wingArrived) _js/corp/seclevel.js_ · [`recruit`](../crew/captive.js.md#s-recruit) _js/crew/captive.js_ ×2 · [`tryEscape`](../crew/captive.js.md#s-tryEscape) _js/crew/captive.js_ · [`settle`](../economy/contracts.js.md#s-settle) _js/economy/contracts.js_ ×5 · [`abandonTicket`](../npc/bounty.js.md#s-abandonTicket) _js/npc/bounty.js_ · [`attemptCapture`](../npc/bounty.js.md#s-attemptCapture) _js/npc/bounty.js_ ×2 · [`deliver`](../npc/bounty.js.md#s-deliver) _js/npc/bounty.js_ ×3 · [`ransom`](../npc/bounty.js.md#s-ransom) _js/npc/bounty.js_ ×2 · [`release`](../npc/bounty.js.md#s-release) _js/npc/bounty.js_ ×2 · [`tickHunters`](../npc/bounty.js.md#s-tickHunters) _js/npc/bounty.js_ · [`stepSecurity`](../npc/security.js.md#s-stepSecurity) _js/npc/security.js_ · [`talkTo`](../npc/speech.js.md#s-talkTo) _js/npc/speech.js_ · [`laneCredit`](../sim/sim.js.md#s-laneCredit) _js/sim/sim.js_ · [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ ×4 · [`stepLaneDiscipline`](../sim/sim.js.md#s-stepLaneDiscipline) _js/sim/sim.js_ · [`stepWarp`](../sim/sim.js.md#s-stepWarp) _js/sim/sim.js_ · [`tradeBuy`](../sim/sim.js.md#s-tradeBuy) _js/sim/sim.js_ · [`tradeSell`](../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_ · [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_ ×2 · [`EVENTS.run~2`](../station/stationlife.js.md#s-EVENTS-run-2) _js/station/stationlife.js_ · [`EVENTS.run~8`](../station/stationlife.js.md#s-EVENTS-run-8) _js/station/stationlife.js_ · [`stepAtmoWorks`](../world/events/atmoworks.js.md#s-stepAtmoWorks) _js/world/events/atmoworks.js_

<!-- note:adjustStanding -->
Moves standing and bleeds a little to whoever shares the sector.

- L234 · `if (c.temper) delta *= delta > 0 ? c.temper.gain : c.temper.loss;` — the power's temper: a syndicate forgives quickly and forgets nothing, a bureau is the reverse
- L240 · `if (c.tier !== "hostile" && delta < 0) {` — Hostiles enjoy what the majors do not.
<!-- /note -->

### <a id="s-standingLabel"></a>`standingLabel(v)`

function · **exported** · L249–257

- called by: [`sensePorts`](../aria/senses.js.md#s-sensePorts) _js/aria/senses.js_ · [`hailContact`](../comms/comms.js.md#s-hailContact) _js/comms/comms.js_ · [`markCard`](../console/panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_ · [`mountBoard`](../console/panels/corp.js.md#s-mountBoard) _js/console/panels/corp.js_ · [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_ · [`mountStanding`](../console/panels/corp.js.md#s-mountStanding) _js/console/panels/corp.js_ · [`search`](../console/panels/corp.js.md#s-search) _js/console/panels/corp.js_ · [`acceptBlocker`](../economy/contracts.js.md#s-acceptBlocker) _js/economy/contracts.js_ · [`PANELS.board`](../station/stationdeck.js.md#s-PANELS-board) _js/station/stationdeck.js_ · [`renderDesk`](../ui/boardview.js.md#s-renderDesk) _js/ui/boardview.js_ · [`mountDockBoot>build`](../ui/dockboot.js.md#s-mountDockBoot-build) _js/ui/dockboot.js_ · [`mountMap>drawSheet`](../ui/map.js.md#s-mountMap-drawSheet) _js/ui/map.js_

<!-- note:standingLabel -->
<!-- /note -->

### <a id="s-standingMargin"></a>`standingMargin(c)`

function · **exported** · L259–262

- called by: [`sellPriceAt`](../sim/sim.js.md#s-sellPriceAt) _js/sim/sim.js_

<!-- note:standingMargin -->
Price multiplier a corporation gives you at its ports, from standing.
<!-- /note -->
