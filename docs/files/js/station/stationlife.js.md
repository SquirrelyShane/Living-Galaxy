# js/station/stationlife.js

[index](../../../README.md) · 379 lines · 47 symbols · 13 imports · 10 importers

## About

<!-- note:@file -->
LIVING GALAXY — life on the station.

A settled hand used to be a row in a ledger that produced a number every
cycle and never did anything else. They had a name, a port and an income,
and that was the whole of their life after they walked off the ship — which
is a strange fate for somebody you spent forty cycles talking to.

So the rolls run now. Every cycle each settled member of the company has a
small chance of something happening to them, weighted by who they are, what
kind of port they are on, and how the company is doing. They are promoted,
they marry each other, they have children who grow up and join the firm,
they are let go, they fall out, they are commended, they strike, and —
because this is a frontier — so sometimes something
happens to them that the port files as an incident and the company files as
a death. None of it is decoration: every event moves the treasury, the
standing, the board's confidence, or the rolls themselves.

The one rule that makes it a game rather than a screensaver: you can always
see it coming and you can usually do something about it. A member whose
mood is falling shows on the desk before they walk, and a port you keep
standing with loses fewer of them.

- L16 · `const EVENT_CHANCE = 0.10;` — per settled member per cycle, before weighting
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../corp/company.js` | `company`, `staffAt` | [js/corp/company.js](../corp/company.js.md) |
| 2 | `../npc/cradle.js` | `cradle`, `generateNPC`, `drawnTo`, `ensureIdentity`, `genomeOf`, `PRONOUNS` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 3 | `../corp/gdb.js` | `file` as `gdbFile`, `markDead` | [js/corp/gdb.js](../corp/gdb.js.md) |
| 4 | `../genome/spacer.js` | `breed`, `packGenome`, `fingerprint`, `genomeTraits`, `genomeIdentity`, `skillAptitude`, `SPACER`, `kinship` | [js/genome/spacer.js](../genome/spacer.js.md) |
| 5 | `../world/names.js` | `childFamily`, `nameRng` | [js/world/names.js](../world/names.js.md) |
| 6 | `./stations.js` | `stationById` | [js/station/stations.js](stations.js.md) |
| 7 | `../corp/corps.js` | `adjustStanding`, `corpOfStation` | [js/corp/corps.js](../corp/corps.js.md) |
| 8 | `../sim/sim.js` | `logEvent`, `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 9 | `../careers/complexes.js` | `COMPLEXES` | [js/careers/complexes.js](../careers/complexes.js.md) |
| 10 | `../comms/chat.js` | `post` | [js/comms/chat.js](../comms/chat.js.md) |
| 11 | `./staffline.js` | `hearFrom`, `moodLift` | [js/station/staffline.js](staffline.js.md) |
| 12 | `./stafflife.js` | `planAt` | [js/station/stafflife.js](stafflife.js.md) |
| 13 | `./stationclock.js` | `hoursAt` | [js/station/stationclock.js](stationclock.js.md) |

## Imported by

- [js/console/panels/corp-town.js](../console/panels/corp-town.js.md) — `townReport`, `townLog`, `townLine`, `roleAt`
- [js/corp/company.js](../corp/company.js.md) — `tickStationLife`, `incomeOf`, `resetStationLife`, `stationLife`
- [js/crew/family.js](../crew/family.js.md) — `carryPregnancyAshore`
- [js/station/deckhall.js](deckhall.js.md) — `incomeOf`, `roleAt`
- [js/station/staffcare.js](staffcare.js.md) — `incomeOf`
- [js/station/stafflife.js](stafflife.js.md) — `stationLife`
- [js/station/staffline.js](staffline.js.md) — `ROLES`, `roleAt`, `roleIndex`, `incomeOf`, `stationLife`
- test/line.test.mjs _(outside js/)_ — `SL`
- test/stafflife.test.mjs _(outside js/)_ — `SL`
- test/systems.test.mjs _(outside js/)_ — `SL`

## Exports

- [`STATION_ADULT`](#s-STATION_ADULT) · const — **no importer in scanned roots**
- [`stationLife`](#s-stationLife) · const — used by [js/corp/company.js](../corp/company.js.md), [js/station/stafflife.js](stafflife.js.md), [js/station/staffline.js](staffline.js.md)
- [`resetStationLife`](#s-resetStationLife) · function — used by [js/corp/company.js](../corp/company.js.md)
- [`ROLES`](#s-ROLES) · const — used by [js/station/staffline.js](staffline.js.md)
- [`roleAt`](#s-roleAt) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md), [js/station/staffline.js](staffline.js.md)
- [`roleIndex`](#s-roleIndex) · function — used by [js/station/staffline.js](staffline.js.md)
- [`incomeOf`](#s-incomeOf) · function — used by [js/corp/company.js](../corp/company.js.md), [js/station/deckhall.js](deckhall.js.md), [js/station/staffcare.js](staffcare.js.md), [js/station/staffline.js](staffline.js.md)
- [`ACTIVITY_K`](#s-ACTIVITY_K) · const — **no importer in scanned roots**
- [`bearChild`](#s-bearChild) · function — **no importer in scanned roots**
- [`carryPregnancyAshore`](#s-carryPregnancyAshore) · function — used by [js/crew/family.js](../crew/family.js.md)
- [`tickStationLife`](#s-tickStationLife) · function — used by [js/corp/company.js](../corp/company.js.md)
- [`townReport`](#s-townReport) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md)
- [`townLog`](#s-townLog) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md)
- [`townLine`](#s-townLine) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-STATION_ADULT"></a>`STATION_ADULT`

const · **exported** · L15–15

<!-- note:STATION_ADULT -->
Cycles a station child takes to come of age and go on the rolls. Longer than
the shipboard one: a childhood on a station is not a cruise.
<!-- /note -->

### <a id="s-EVENT_CHANCE"></a>`EVENT_CHANCE`

const · L16–16

<!-- note:EVENT_CHANCE -->
<!-- /note -->

### <a id="s-MAX_LOG"></a>`MAX_LOG`

const · L17–17

<!-- note:MAX_LOG -->
<!-- /note -->

### <a id="s-stationLife"></a>`stationLife`

const · **exported** · L19–24

<!-- note:stationLife -->
- L20 · `log: [],` — { at, stationId, kind, who, text, delta }
- L21 · `households: {},` — staffId → { partner, children: [ids], since }
- L22 · `kids: [],` — { id, name, parents, stationId, age, gender, pronouns }
- L23 · `standing: {},` — stationId → how the port feels about your people
<!-- /note -->

### <a id="s-resetStationLife"></a>`resetStationLife()`

function · **exported** · L26–31

- called by: [`resetCompany`](../corp/company.js.md#s-resetCompany) _js/corp/company.js_

<!-- note:resetStationLife -->
<!-- /note -->

### <a id="s-note"></a>`note(kind, who, text, stId, delta=)`

function · L33–39

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`hearFrom`](staffline.js.md#s-hearFrom) _js/station/staffline.js_
- called by: [`EVENTS.run`](#s-EVENTS-run) · [`EVENTS.run~10`](#s-EVENTS-run-10) · [`EVENTS.run~11`](#s-EVENTS-run-11) · [`EVENTS.run~2`](#s-EVENTS-run-2) · [`EVENTS.run~3`](#s-EVENTS-run-3) · [`EVENTS.run~4`](#s-EVENTS-run-4) · [`EVENTS.run~6`](#s-EVENTS-run-6) · [`EVENTS.run~7`](#s-EVENTS-run-7) · [`EVENTS.run~8`](#s-EVENTS-run-8) · [`EVENTS.run~9`](#s-EVENTS-run-9) · [`bearChild`](#s-bearChild) · [`carryPregnancyAshore`](#s-carryPregnancyAshore) · [`kill`](#s-kill) · [`tickStationLife`](#s-tickStationLife)

<!-- note:note -->
- L37 · `try { hearFrom(kind, who, text); } catch {   }` — 0.3.46: it happened to a person, and they call the company about it
- L37 · `try { hearFrom(kind, who, text); } catch {` — the line is never why the rolls stop
<!-- /note -->

### <a id="s-roll"></a>`roll(seed)`

function · L41–47

- called by: [`EVENTS.run~10`](#s-EVENTS-run-10) · [`EVENTS.run~11`](#s-EVENTS-run-11) · [`EVENTS.run~3`](#s-EVENTS-run-3) · [`EVENTS.run~6`](#s-EVENTS-run-6) · [`EVENTS.run~9`](#s-EVENTS-run-9) · [`tickStationLife`](#s-tickStationLife) ×2

<!-- note:roll -->
One deterministic stream per member per cycle, so a save that reloads the
same cycle does not re-roll a different life.
<!-- /note -->

### <a id="s-traitOf"></a>`traitOf(s, k)`

function · L49–49

- called by: [`EVENTS.weight`](#s-EVENTS-weight) · [`EVENTS.weight~10`](#s-EVENTS-weight-10) · [`EVENTS.weight~11`](#s-EVENTS-weight-11) · [`EVENTS.weight~2`](#s-EVENTS-weight-2) · [`EVENTS.weight~3`](#s-EVENTS-weight-3) · [`EVENTS.weight~4`](#s-EVENTS-weight-4) · [`EVENTS.weight~6`](#s-EVENTS-weight-6) ×2 · [`EVENTS.weight~8`](#s-EVENTS-weight-8) ×2 · [`EVENTS.weight~9`](#s-EVENTS-weight-9)

<!-- note:traitOf -->
<!-- /note -->

### <a id="s-ROLES"></a>`ROLES`

const · **exported** · L51–57

<!-- note:ROLES -->
---- the roles a settled hand climbs ---------------------------------------
<!-- /note -->

### <a id="s-roleAt"></a>`roleAt(id)`

function · **exported** · L58–58

- called by: [`lineCard`](../console/panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`lineCard`](deckhall.js.md#s-lineCard) _js/station/deckhall.js_ · [`checkIn`](staffline.js.md#s-checkIn) _js/station/staffline.js_ · [`incomeOf`](#s-incomeOf) · [`townReport`](#s-townReport)

<!-- note:roleAt -->
<!-- /note -->

### <a id="s-roleIndex"></a>`roleIndex(id)`

function · **exported** · L59–59

- called by: [`TOPICS.hint~4`](staffline.js.md#s-TOPICS-hint-4) _js/station/staffline.js_ · [`TOPICS.ok~4`](staffline.js.md#s-TOPICS-ok-4) _js/station/staffline.js_ · [`TOPICS.run~4`](staffline.js.md#s-TOPICS-run-4) _js/station/staffline.js_ · [`EVENTS.run`](#s-EVENTS-run) · [`EVENTS.weight`](#s-EVENTS-weight) ×2

<!-- note:roleIndex -->
<!-- /note -->

### <a id="s-incomeOf"></a>`incomeOf(s)`

function · **exported** · L61–63

- calls: [`roleAt`](#s-roleAt)
- called by: [`boardBrief`](../corp/company.js.md#s-boardBrief) _js/corp/company.js_ · [`restoreCompany`](../corp/company.js.md#s-restoreCompany) _js/corp/company.js_ · [`tickCompany`](../corp/company.js.md#s-tickCompany) _js/corp/company.js_ · [`floorSection`](deckhall.js.md#s-floorSection) _js/station/deckhall.js_ · [`lineCard`](deckhall.js.md#s-lineCard) _js/station/deckhall.js_ · [`courseCost`](staffcare.js.md#s-courseCost) _js/station/staffcare.js_ · [`TOPICS.hint~3`](staffline.js.md#s-TOPICS-hint-3) _js/station/staffline.js_ · [`TOPICS.run~4`](staffline.js.md#s-TOPICS-run-4) _js/station/staffline.js_ · [`bonusCost`](staffline.js.md#s-bonusCost) _js/station/staffline.js_ · [`promoteCost`](staffline.js.md#s-promoteCost) _js/station/staffline.js_ · [`EVENTS.run`](#s-EVENTS-run) · [`townReport`](#s-townReport)

<!-- note:incomeOf -->
What this member is actually worth to the company per cycle, role included.
<!-- /note -->

### <a id="s-EVENTS"></a>`EVENTS`

const · L65–193

<!-- note:EVENTS -->
---- events ----------------------------------------------------------------

Each carries its own weight function, so who you settled and where decides
what happens to them. A cautious hand at a military port is promoted; a
greedy one at a pirate hold is the one who goes missing.
<!-- /note -->

#### <a id="s-EVENTS-weight"></a>`EVENTS.weight(s, st)`

prop · L68–69

- calls: [`roleIndex`](#s-roleIndex) ×2 · [`traitOf`](#s-traitOf)

<!-- note:EVENTS.weight -->
a floor climbs slowly: each rung wants a dozen more cycles served than
the last, or everybody is a regional director inside two hours
<!-- /note -->

#### <a id="s-EVENTS-run"></a>`EVENTS.run(s, st)`

prop · L70–77

- calls: [`incomeOf`](#s-incomeOf) · [`note`](#s-note) · [`roleIndex`](#s-roleIndex)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`

<!-- note:EVENTS.run -->
<!-- /note -->

#### <a id="s-EVENTS-weight-2"></a>`EVENTS.weight~2(s, st)`

prop · L81–81

- calls: [`traitOf`](#s-traitOf)

<!-- note:EVENTS.weight~2 -->
<!-- /note -->

#### <a id="s-EVENTS-run-2"></a>`EVENTS.run~2(s, st)`

prop · L82–87

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`note`](#s-note)

<!-- note:EVENTS.run~2 -->
<!-- /note -->

#### <a id="s-EVENTS-weight-3"></a>`EVENTS.weight~3(s, st)`

prop · L91–91

- calls: [`traitOf`](#s-traitOf)

<!-- note:EVENTS.weight~3 -->
<!-- /note -->

#### <a id="s-EVENTS-run-3"></a>`EVENTS.run~3(s, st)`

prop · L92–96

- calls: [`note`](#s-note) · [`roll`](#s-roll)

<!-- note:EVENTS.run~3 -->
<!-- /note -->

#### <a id="s-EVENTS-weight-4"></a>`EVENTS.weight~4(s, st)`

prop · L100–100

- calls: [`household`](#s-household) · [`traitOf`](#s-traitOf)

<!-- note:EVENTS.weight~4 -->
<!-- /note -->

#### <a id="s-EVENTS-run-4"></a>`EVENTS.run~4(s, st)`

prop · L101–116

- calls: [`staffAt`](../corp/company.js.md#s-staffAt) _js/corp/company.js_ · [`drawnTo`](../npc/cradle.js.md#s-drawnTo) _js/npc/cradle.js_ ×2 · [`ensureIdentity`](../npc/cradle.js.md#s-ensureIdentity) _js/npc/cradle.js_ ×2 · [`household`](#s-household) ×3 · [`kinOK`](#s-kinOK) · [`note`](#s-note)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`, `cradle.put`
- via [js/corp/company.js](../corp/company.js.md): `staffAt.filter`

<!-- note:EVENTS.run~4 -->
<!-- /note -->

#### <a id="s-EVENTS-weight-5"></a>`EVENTS.weight~5(s, st)`

prop · L120–120

- calls: [`household`](#s-household) ×2

<!-- note:EVENTS.weight~5 -->
<!-- /note -->

#### <a id="s-EVENTS-run-5"></a>`EVENTS.run~5(s, st)`

prop · L121–121

- calls: [`bearChild`](#s-bearChild)

<!-- note:EVENTS.run~5 -->
<!-- /note -->

#### <a id="s-EVENTS-weight-6"></a>`EVENTS.weight~6(s, st)`

prop · L125–125

- calls: [`traitOf`](#s-traitOf) ×2

<!-- note:EVENTS.weight~6 -->
<!-- /note -->

#### <a id="s-EVENTS-run-6"></a>`EVENTS.run~6(s, st)`

prop · L126–133

- calls: [`staffAt`](../corp/company.js.md#s-staffAt) _js/corp/company.js_ · [`note`](#s-note) · [`roll`](#s-roll)
- via [js/corp/company.js](../corp/company.js.md): `staffAt.filter`

<!-- note:EVENTS.run~6 -->
<!-- /note -->

#### <a id="s-EVENTS-weight-7"></a>`EVENTS.weight~7(s, st)`

prop · L137–137

<!-- note:EVENTS.weight~7 -->
<!-- /note -->

#### <a id="s-EVENTS-run-7"></a>`EVENTS.run~7(s, st)`

prop · L138–144

- calls: [`hoursAt`](stationclock.js.md#s-hoursAt) _js/station/stationclock.js_ · [`note`](#s-note)

<!-- note:EVENTS.run~7 -->
- L141 · `s.onStrikeUntil = hoursAt(sim.time) + 24;` — 0.3.52: a day on the picket line, not at the line
<!-- /note -->

#### <a id="s-EVENTS-weight-8"></a>`EVENTS.weight~8(s, st)`

prop · L148–148

- calls: [`traitOf`](#s-traitOf) ×2

<!-- note:EVENTS.weight~8 -->
<!-- /note -->

#### <a id="s-EVENTS-run-8"></a>`EVENTS.run~8(s, st)`

prop · L149–154

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`note`](#s-note) · [`removeStaff`](#s-removeStaff)

<!-- note:EVENTS.run~8 -->
<!-- /note -->

#### <a id="s-EVENTS-weight-9"></a>`EVENTS.weight~9(s, st)`

prop · L158–158

- calls: [`traitOf`](#s-traitOf)

<!-- note:EVENTS.weight~9 -->
<!-- /note -->

#### <a id="s-EVENTS-run-9"></a>`EVENTS.run~9(s, st)`

prop · L159–166

- calls: [`kill`](#s-kill) · [`note`](#s-note) · [`roll`](#s-roll)

<!-- note:EVENTS.run~9 -->
<!-- /note -->

#### <a id="s-EVENTS-weight-10"></a>`EVENTS.weight~10(s, st)`

prop · L170–170

- calls: [`traitOf`](#s-traitOf)

<!-- note:EVENTS.weight~10 -->
<!-- /note -->

#### <a id="s-EVENTS-run-10"></a>`EVENTS.run~10(s, st)`

prop · L171–178

- calls: [`kill`](#s-kill) · [`note`](#s-note) · [`roll`](#s-roll)

<!-- note:EVENTS.run~10 -->
<!-- /note -->

#### <a id="s-EVENTS-weight-11"></a>`EVENTS.weight~11(s)`

prop · L182–182

- calls: [`traitOf`](#s-traitOf)

<!-- note:EVENTS.weight~11 -->
<!-- /note -->

#### <a id="s-EVENTS-run-11"></a>`EVENTS.run~11(s, st)`

prop · L183–191

- calls: [`note`](#s-note) · [`roll`](#s-roll) · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- via [js/corp/company.js](../corp/company.js.md): `company.staff.filter`, `company.staff.filter.map`

<!-- note:EVENTS.run~11 -->
<!-- /note -->

### <a id="s-ACTIVITY_K"></a>`ACTIVITY_K`

const · **exported** · L195–203

<!-- note:ACTIVITY_K -->
0.3.52: what someone is doing when their cycle's roll comes up leans on what can happen
<!-- /note -->

### <a id="s-kinOK"></a>`kinOK(a, b)`

function · L205–209

- calls: [`kinship`](../genome/spacer.js.md#s-kinship) _js/genome/spacer.js_ · [`genomeOf`](../npc/cradle.js.md#s-genomeOf) _js/npc/cradle.js_ ×2
- called by: [`EVENTS.run~4`](#s-EVENTS-run-4)

<!-- note:kinOK -->
a CRADLE record carries its genome PACKED; kinship wants the array
<!-- /note -->

### <a id="s-household"></a>`household(s)`

function · L211–214

- called by: [`EVENTS.run~4`](#s-EVENTS-run-4) ×3 · [`EVENTS.weight~4`](#s-EVENTS-weight-4) · [`EVENTS.weight~5`](#s-EVENTS-weight-5) ×2 · [`bearChild`](#s-bearChild) ×2 · [`carryPregnancyAshore`](#s-carryPregnancyAshore) · [`kill`](#s-kill) · [`removeStaff`](#s-removeStaff) ×2 · [`tickStationLife`](#s-tickStationLife) · [`townReport`](#s-townReport)

<!-- note:household -->
<!-- /note -->

### <a id="s-removeStaff"></a>`removeStaff(s, why)`

function · L216–223

- calls: [`household`](#s-household) ×2
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- via [js/corp/company.js](../corp/company.js.md): `company.staff.indexOf`, `company.staff.splice`
- called by: [`EVENTS.run~8`](#s-EVENTS-run-8) · [`kill`](#s-kill)

<!-- note:removeStaff -->
<!-- /note -->

### <a id="s-kill"></a>`kill(s, st, how)`

function · L225–236

- calls: [`post`](../comms/chat.js.md#s-post) _js/comms/chat.js_ · [`staffAt`](../corp/company.js.md#s-staffAt) _js/corp/company.js_ · [`markDead`](../corp/gdb.js.md#s-markDead) _js/corp/gdb.js_ · [`household`](#s-household) · [`note`](#s-note) · [`removeStaff`](#s-removeStaff)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`EVENTS.run~10`](#s-EVENTS-run-10) · [`EVENTS.run~9`](#s-EVENTS-run-9)

<!-- note:kill -->
<!-- /note -->

### <a id="s-bearChild"></a>`bearChild(s, st, sireOverride=)`

function · **exported** · L238–275

- calls: [`file`](../corp/gdb.js.md#s-file) _js/corp/gdb.js_ · [`fingerprint`](../genome/spacer.js.md#s-fingerprint) _js/genome/spacer.js_ · [`genomeIdentity`](../genome/spacer.js.md#s-genomeIdentity) _js/genome/spacer.js_ · [`genomeTraits`](../genome/spacer.js.md#s-genomeTraits) _js/genome/spacer.js_ · [`packGenome`](../genome/spacer.js.md#s-packGenome) _js/genome/spacer.js_ · [`skillAptitude`](../genome/spacer.js.md#s-skillAptitude) _js/genome/spacer.js_ · [`ensureIdentity`](../npc/cradle.js.md#s-ensureIdentity) _js/npc/cradle.js_ ×2 · [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_ · [`household`](#s-household) ×2 · [`note`](#s-note) · [`safeBreed`](#s-safeBreed) · [`childFamily`](../world/names.js.md#s-childFamily) _js/world/names.js_ · [`nameRng`](../world/names.js.md#s-nameRng) _js/world/names.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`EVENTS.run~5`](#s-EVENTS-run-5) · [`tickStationLife`](#s-tickStationLife)

<!-- note:bearChild -->
A child born on a station.

Crossed from both parents the same way a shipboard birth is — the genome is
real, the heritage is real — and filed against the port rather than the
hull. It grows on the station clock and, when it comes of age, goes on the
company's rolls as family: no signing fee, no hall, and a share that starts
above a stranger's because it grew up in the trade.

- L269 · `gdbFile(child, { kind: "born", place: s.stationId, group: [a, b, ...h.children.map((id) =>` — 0.3.54: into the GDB — not a sibling's name, not a parent's
<!-- /note -->

### <a id="s-safeBreed"></a>`safeBreed(a, b, seed)`

function · L277–279

- calls: [`breed`](../genome/spacer.js.md#s-breed) _js/genome/spacer.js_
- called by: [`bearChild`](#s-bearChild)

<!-- note:safeBreed -->
<!-- /note -->

### <a id="s-carryPregnancyAshore"></a>`carryPregnancyAshore(carrierId, sireId, cyclesLeft, stationId)`

function · **exported** · L281–287

- calls: [`household`](#s-household) · [`note`](#s-note) · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_
- via [js/corp/company.js](../corp/company.js.md): `company.staff.find`
- called by: [`settleFamily`](../crew/family.js.md#s-settleFamily) _js/crew/family.js_

<!-- note:carryPregnancyAshore -->
Someone settled while carrying.

family.js hands a pregnancy over when its carrier leaves the ship for a
berth on a station — the child is still coming, it is just coming somewhere
with a hospital. Called by settleFamily().
<!-- /note -->

### <a id="s-tickStationLife"></a>`tickStationLife()`

function · **exported** · L289–349

- calls: [`planAt`](stafflife.js.md#s-planAt) _js/station/stafflife.js_ · [`moodLift`](staffline.js.md#s-moodLift) _js/station/staffline.js_ · [`hoursAt`](stationclock.js.md#s-hoursAt) _js/station/stationclock.js_ · [`bearChild`](#s-bearChild) · [`household`](#s-household) · [`note`](#s-note) · [`roll`](#s-roll) ×2 · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_ ×2
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.put`
- via [js/corp/company.js](../corp/company.js.md): `company.staff.find`, `company.staff.push`
- called by: [`tickCompany`](../corp/company.js.md#s-tickCompany) _js/corp/company.js_

<!-- note:tickStationLife -->
---- the cycle --------------------------------------------------------------

- L293 · `for (const k of [...stationLife.kids]) {` — children grow, and the grown ones go on the rolls as family
- L325 · `const target = 55 + (company.confidence ?? 0.5) * 40 + (st?.hostile ? -20 : 0) + moodLift(` — mood drifts toward what the port and the company are like to work for
- L325 · `const target = 55 + (company.confidence ?? 0.5) * 40 + (st?.hostile ? -20 : 0) + moodLift(` — 0.3.46: …and toward what they think of you — regard and raises from the company line
- L328 · `if (s.transit) continue;` — between ports on company passage: nothing happens to you on a liner
- L330 · `const h = household(s);` — a pregnancy carried ashore comes due
- L339 · `const act = planAt(s, hoursAt(sim.time)).id;` — which event: weighted draw off who they are, where they are — and, 0.3.52,
  what they are doing: the press line lets go on the people working it
<!-- /note -->

### <a id="s-townReport"></a>`townReport(stationId=)`

function · **exported** · L351–367

- calls: [`household`](#s-household) · [`incomeOf`](#s-incomeOf) · [`roleAt`](#s-roleAt) · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- via [js/corp/company.js](../corp/company.js.md): `company.staff.filter`, `company.staff.filter.map`, `company.staff.find`
- called by: [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ · [`townLine`](#s-townLine)

<!-- note:townReport -->
---- what the desk shows ----------------------------------------------------

Everyone on the rolls at this port, with their household and their mood.
<!-- /note -->

### <a id="s-townLog"></a>`townLog(stationId=, n=)`

function · **exported** · L369–371

- called by: [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_

<!-- note:townLog -->
The station-life log, newest first, optionally for one port.
<!-- /note -->

### <a id="s-townLine"></a>`townLine()`

function · **exported** · L373–379

- calls: [`townReport`](#s-townReport)
- called by: [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_

<!-- note:townLine -->
One line for the CORP tab: what the towns did this cycle.
<!-- /note -->
