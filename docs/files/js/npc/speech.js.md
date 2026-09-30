# js/npc/speech.js

[index](../../../README.md) · 478 lines · 61 symbols · 16 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — the speech bridge.

Every word an NPC says on the open channel, or back to you when you talk to
it, comes out of js/speech/npc-speech.js (the NPCSPEECHGEN drop-in,
verbatim): 71 clause frames, 44 topics, register by role and faction, a
phrasing bank that learns what each listener likes, and a memory store that
makes regard auditable. This file is the adapter between that world and
ours.

What it does:
  - mirrors the hulls and ports around you as speech "units" — callsign,
    role, faction (the corporation's power; holds are "pirate"), task from
    the timetable job, cargo, damage, the port they are bound for — rebuilt
    from the sim before every use, so a unit always says what is true
  - runs exchanges itself rather than calling the speech world's tick():
    tick() also drifts every unit's state at random (and can rename where a
    ship is to a Living Galaxy place), which is the one thing a mirror must
    not do. The commit step is the speech world's own, restated here.
  - files what you say to a ship through the world's talk(), so regard for
    you is the same auditable memory as regard between NPCs, and hands the
    regard change back as corporate standing (positive gains capped per hull)
  - feeds shoot-downs in as the hull the band remembers losing

Positions go in at 1/SPEECH_SCALE: the speech world thinks in a ~1400-wide
map where "near" is 400–600 and "can talk" is 900, which at 60 lands at
24–36 km and 54 km — a port's approaches and its belt claims.

- L20 · `export const SPEECH_SCALE = 60;` — game units per speech unit
- L21 · `export const SPEECH_RANGE = 140000;` — who is on your band (matches comms CHATTER_RANGE)
- L22 · `const TALK_R = 900;` — speech units: who a speaker can reach
- L23 · `const MAX_UNITS = 36;` — nearest first; a band of 36 is already a busy one
- L24 · `const GAIN_COOLDOWN = 600;` — sim s between standing gains from the same hull
- L26 · `reports.nameOf = (n) => voiceName(n.captain, n.name, n.id);` — first-hand reports (npc/reports.js) name the pilot the way the band does
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../speech/npc-speech.js` | `CALIBRATION`, `PLAYER_PROMPTS`, `TOPICS`, `chooseTopic`, `createWorld`, `exchange`, `memoriesFrom`, `obligationFrom`, `registerOf` | [js/speech/npc-speech.js](../speech/npc-speech.js.md) |
| 4 | `./traffic.js` | `traffic`, `HOSTILE_ROLES` | [js/npc/traffic.js](traffic.js.md) |
| 5 | `./flow.js` | `flow` | [js/npc/flow.js](flow.js.md) |
| 6 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 7 | `../corp/corps.js` | `corpOfStation`, `corpOfVessel`, `corpById`, `adjustStanding` | [js/corp/corps.js](../corp/corps.js.md) |
| 8 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 9 | `../economy/materials.js` | `baseValue` | [js/economy/materials.js](../economy/materials.js.md) |
| 10 | `../world/bodies.js` | `BODIES` | [js/world/bodies.js](../world/bodies.js.md) |
| 11 | `../crew/races.js` | `RACES` | [js/crew/races.js](../crew/races.js.md) |
| 12 | `../world/names.js` | `personName` | [js/world/names.js](../world/names.js.md) |
| 13 | `../corp/gdb.js` | `catalogue` | [js/corp/gdb.js](../corp/gdb.js.md) |
| 14 | `./cradle.js` | `PRONOUNS` | [js/npc/cradle.js](cradle.js.md) |
| 15 | `../ui/glyphs.js` | `mulberry` | [js/ui/glyphs.js](../ui/glyphs.js.md) |
| 16 | `./reports.js` | `reports`, `answerFor` | [js/npc/reports.js](reports.js.md) |
| 17 | `./ground.js` | `placeOf`, `portCensus`, `underFire`, `threatsNear`, `claimSurvey`, `bearingTo`, `THREAT_R` | [js/npc/ground.js](ground.js.md) |
| 18 | `./chat.js` | `dressLine`, `dressReply`, `extraChips`, `loadChatRating` | [js/npc/chat.js](chat.js.md) |

## Imported by

- [js/comms/comms.js](../comms/comms.js.md) — `SIGN_OFF`, `chatter`, `noteLost`, `resetSpeech`, `speechStats`, `talkChips`, `talkTo`, `regardOf`
- [js/ui/chatbox.js](../ui/chatbox.js.md) — `talkTo`, `SPEECH_RANGE`
- test/ground.test.mjs _(outside js/)_ — `speech`, `resetSpeech`, `syncBand`, `chatter`, `talkTo`
- test/npcchat.test.mjs _(outside js/)_ — `chatter`, `talkTo`, `syncBand`, `speech`, `resetSpeech`, `talkChips`, `unitOf`
- test/speech.test.mjs _(outside js/)_ — `speech`, `resetSpeech`, `syncBand`, `chatter`, `talkTo`, `regardOf`, `speechName`, `talkChips`, `noteLost`, `speechStats`, `localise`, `SPEECH_SCALE`

## Exports

- [`SPEECH_SCALE`](#s-SPEECH_SCALE) · const — used by test/speech.test.mjs
- [`SPEECH_RANGE`](#s-SPEECH_RANGE) · const — used by [js/ui/chatbox.js](../ui/chatbox.js.md)
- [`speech`](#s-speech) · const — used by test/ground.test.mjs, test/npcchat.test.mjs, test/speech.test.mjs
- [`resetSpeech`](#s-resetSpeech) · function — used by [js/comms/comms.js](../comms/comms.js.md), test/ground.test.mjs, test/npcchat.test.mjs, test/speech.test.mjs
- [`speechName`](#s-speechName) · function — used by test/speech.test.mjs
- [`voiceName`](#s-voiceName) · function — **no importer in scanned roots**
- [`syncBand`](#s-syncBand) · function — used by test/ground.test.mjs, test/npcchat.test.mjs, test/speech.test.mjs
- [`localise`](#s-localise) · function — used by test/speech.test.mjs
- [`chatter`](#s-chatter) · function — used by [js/comms/comms.js](../comms/comms.js.md), test/ground.test.mjs, test/npcchat.test.mjs, test/speech.test.mjs
- [`unitOf`](#s-unitOf) · function — used by test/npcchat.test.mjs
- [`talkTo`](#s-talkTo) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/ui/chatbox.js](../ui/chatbox.js.md), test/ground.test.mjs, test/npcchat.test.mjs, test/speech.test.mjs
- [`regardOf`](#s-regardOf) · function — used by [js/comms/comms.js](../comms/comms.js.md), test/speech.test.mjs
- [`noteLost`](#s-noteLost) · function — used by [js/comms/comms.js](../comms/comms.js.md), test/speech.test.mjs
- [`talkChips`](#s-talkChips) · function — used by [js/comms/comms.js](../comms/comms.js.md), test/npcchat.test.mjs, test/speech.test.mjs
- [`SIGN_OFF`](#s-SIGN_OFF) · const — used by [js/comms/comms.js](../comms/comms.js.md)
- [`speechStats`](#s-speechStats) · function — used by [js/comms/comms.js](../comms/comms.js.md), test/speech.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-SPEECH_SCALE"></a>`SPEECH_SCALE`

const · **exported** · L20–20

<!-- note:SPEECH_SCALE -->
<!-- /note -->

### <a id="s-SPEECH_RANGE"></a>`SPEECH_RANGE`

const · **exported** · L21–21

<!-- note:SPEECH_RANGE -->
<!-- /note -->

### <a id="s-TALK_R"></a>`TALK_R`

const · L22–22

<!-- note:TALK_R -->
<!-- /note -->

### <a id="s-MAX_UNITS"></a>`MAX_UNITS`

const · L23–23

<!-- note:MAX_UNITS -->
<!-- /note -->

### <a id="s-GAIN_COOLDOWN"></a>`GAIN_COOLDOWN`

const · L24–24

<!-- note:GAIN_COOLDOWN -->
<!-- /note -->

### <a id="s-DIALS"></a>`DIALS`

const · L28–28

<!-- note:DIALS -->
Fitted offline: createWorld({seed:808,crew:24}).selfTrain(6000, 3) against the corpus
targets. The band still runs terser than conversation (radio should), but it asks
questions and closes exchanges instead of trading two lines and going quiet.
<!-- /note -->

### <a id="s-speech"></a>`speech`

const · **exported** · L30–42

<!-- note:speech -->
- L33 · `units: [],` — the array the speech world holds — mutated in place
- L34 · `byName: new Map(),` — speech name → unit
- L35 · `byId: new Map(),` — game id → unit
- L39 · `gains: new Map(),` — unit name → sim time of the last standing gain
<!-- /note -->

### <a id="s-resetSpeech"></a>`resetSpeech(skySeed=)`

function · **exported** · L44–60

- calls: [`loadChatRating`](chat.js.md#s-loadChatRating) _js/npc/chat.js_ · [`groundTopics`](#s-groundTopics) · [`hash`](#s-hash) · [`createWorld`](../speech/npc-speech.js.md#s-createWorld) _js/speech/npc-speech.js_
- called by: [`step`](../comms/comms.js.md#s-step) _js/comms/comms.js_ · [`ensure`](#s-ensure)

<!-- note:resetSpeech -->
---- setup ----------------------------------------------------------------

A fresh band for a sky. Same sky seed, same voices.
<!-- /note -->

#### <a id="s-resetSpeech-ground"></a>`resetSpeech.ground()`

prop · L57–57

- calls: [`groundCtx`](#s-groundCtx)

<!-- note:resetSpeech.ground -->
<!-- /note -->

### <a id="s-ensure"></a>`ensure(skySeed)`

function · L62–64

- calls: [`resetSpeech`](#s-resetSpeech)
- called by: [`syncBand`](#s-syncBand) · [`unitOf`](#s-unitOf)

<!-- note:ensure -->
<!-- /note -->

### <a id="s-advance"></a>`advance(now)`

function · L66–73

- called by: [`chatter`](#s-chatter) · [`talkTo`](#s-talkTo)

<!-- note:advance -->
The speech world's clock only moves through tick(); tick with an empty band moves it
without drifting anybody. Memory decay and cooldowns read this clock.
<!-- /note -->

### <a id="s-hash"></a>`hash(s)`

function · L75–80

- called by: [`frac`](#s-frac) · [`localise`](#s-localise) · [`resetSpeech`](#s-resetSpeech) · [`talkChips`](#s-talkChips) · [`tasteOf`](#s-tasteOf)

<!-- note:hash -->
---- mirror -----------------------------------------------------------------
<!-- /note -->

### <a id="s-frac"></a>`frac(s)`

function · L81–81

- calls: [`hash`](#s-hash)
- called by: [`tasteOf`](#s-tasteOf) ×4

<!-- note:frac -->
<!-- /note -->

### <a id="s-polar"></a>`polar(x)`

function · L82–82

- called by: [`tasteOf`](#s-tasteOf) ×4

<!-- note:polar -->
<!-- /note -->

### <a id="s-speechName"></a>`speechName(name)`

function · **exported** · L84–88

- called by: [`flowUnit`](#s-flowUnit) · [`noteLost`](#s-noteLost) · [`vesselUnit`](#s-vesselUnit) · [`voiceName`](#s-voiceName)

<!-- note:speechName -->
A hull's radio shorthand: "Clamshell Mk II ORTEGA-42" → "Ortega 42".

Still used for the hull side of a call sign, and for the band's memory of a
hull that went down — but it is no longer what a voice is called. Ships do
not talk to each other; people do, and a channel full of "Ortega 42 ›
Tamarin 14" reads like freight manifests rather than a system with anyone
in it. `voiceName()` below is what the band uses now.
<!-- /note -->

### <a id="s-flowPilots"></a>`flowPilots`

const · L90–90

<!-- note:flowPilots -->
Who is speaking.

A traffic captain is a real CRADLE person and always has been — the band
just never used the name. A flow boat is not; it is a hull on a timetable
with nobody filed for it, so one is forged here off the boat's own id:
deterministic, so the same boat is the same pilot every time you meet it,
and it costs a name draw rather than a genome.
<!-- /note -->

### <a id="s-flowPilot"></a>`flowPilot(b)`

function · L91–103

- calls: [`catalogue`](../corp/gdb.js.md#s-catalogue) _js/corp/gdb.js_ · [`mulberry`](../ui/glyphs.js.md#s-mulberry) _js/ui/glyphs.js_ · [`personName`](../world/names.js.md#s-personName) _js/world/names.js_
- called by: [`flowUnit`](#s-flowUnit)

<!-- note:flowPilot -->
- L98 · `` const person = catalogue({ id: `pilot:${b.id}`, seed: `pilot:${b.id}`, name: personName(ra `` — 0.3.54: a pilot is a person, and the GDB has them — one name, theirs alone
<!-- /note -->

### <a id="s-voiceName"></a>`voiceName(person, fallbackHull, id=)`

function · **exported** · L105–115

- calls: [`speechName`](#s-speechName) · [`voiceName>taken`](#s-voiceName-taken) ×2
- called by: [`@file`](#) · [`flowUnit`](#s-flowUnit) · [`vesselUnit`](#s-vesselUnit)

<!-- note:voiceName -->
The name a voice goes by on the open channel: the person, not the hull.

Short, because radio is short and because the speech engine drops the name
INTO the sentence — "I've marked Skreth Scorchspur on my board" is a mouthful
where "I've marked Skreth on my board" is a transmission. First name only,
then first name plus an initial when two of them are on the band at once,
then the full name; `uniqueName` is the last resort after that. The family
name still carries the lore, it just carries it on the crew sheet where
there is room to read it.
<!-- /note -->

#### <a id="s-voiceName-taken"></a>`voiceName>taken(n)`

function · L109–109

- called by: [`voiceName`](#s-voiceName) ×2

<!-- note:voiceName>taken -->
<!-- /note -->

### <a id="s-ROLE"></a>`ROLE`

const · L117–117

<!-- note:ROLE -->
<!-- /note -->

### <a id="s-TASK"></a>`TASK`

const · L118–121

<!-- note:TASK -->
<!-- /note -->

### <a id="s-factionOf"></a>`factionOf(corp, hostile)`

function · L123–126

- called by: [`flowUnit`](#s-flowUnit) · [`stationUnit`](#s-stationUnit) · [`vesselUnit`](#s-vesselUnit)

<!-- note:factionOf -->
<!-- /note -->

### <a id="s-tasteOf"></a>`tasteOf(key)`

function · L128–134

- calls: [`frac`](#s-frac) ×4 · [`hash`](#s-hash) · [`polar`](#s-polar) ×4
- called by: [`flowUnit`](#s-flowUnit) · [`stationUnit`](#s-stationUnit) · [`vesselUnit`](#s-vesselUnit)

<!-- note:tasteOf -->
<!-- /note -->

### <a id="s-nearestPortName"></a>`nearestPortName(p)`

function · L136–143 · **never referenced**

<!-- note:nearestPortName -->
<!-- /note -->

### <a id="s-unitFor"></a>`unitFor(id, make)`

function · L145–149

- called by: [`flowUnit`](#s-flowUnit) · [`stationUnit`](#s-stationUnit) · [`vesselUnit`](#s-vesselUnit)

<!-- note:unitFor -->
<!-- /note -->

### <a id="s-place"></a>`place(u, p)`

function · L151–155

- called by: [`flowUnit`](#s-flowUnit) · [`stationUnit`](#s-stationUnit) · [`vesselUnit`](#s-vesselUnit)

<!-- note:place -->
- L153 · `u.position.y = p.z / SPEECH_SCALE;` — the speech map is flat: x/z plane, height as z
<!-- /note -->

### <a id="s-vesselUnit"></a>`vesselUnit(n)`

function · L157–191

- calls: [`corpOfVessel`](../corp/corps.js.md#s-corpOfVessel) _js/corp/corps.js_ · [`baseValue`](../economy/materials.js.md#s-baseValue) _js/economy/materials.js_ · [`claimSurvey`](ground.js.md#s-claimSurvey) _js/npc/ground.js_ · [`placeOf`](ground.js.md#s-placeOf) _js/npc/ground.js_ · [`underFire`](ground.js.md#s-underFire) _js/npc/ground.js_ · [`factionOf`](#s-factionOf) · [`place`](#s-place) · [`speechName`](#s-speechName) · [`tasteOf`](#s-tasteOf) · [`uniqueName`](#s-uniqueName) · [`unitFor`](#s-unitFor) · [`voiceName`](#s-voiceName) · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_
- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`
- called by: [`syncBand`](#s-syncBand) · [`unitOf`](#s-unitOf)

<!-- note:vesselUnit -->
- L173 · `const fire = hostile ? null : underFire(n, speech.clock);` — 0.3.16 — grounded (npc/ground.js). Hull is the hull's real integrity, not
  a number read off the job string; "under fire" means something is
  actually shooting at it; a miner's grade is the rock at its claim.
- L188 · `u.nearestName = where.kind === "port" ? where.station.name : where.kind === "belt" ? where` — where it IS, not where it is bound: "off X" only when it is off X
<!-- /note -->

### <a id="s-flowUnit"></a>`flowUnit(b)`

function · L193–218

- calls: [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`baseValue`](../economy/materials.js.md#s-baseValue) _js/economy/materials.js_ · [`placeOf`](ground.js.md#s-placeOf) _js/npc/ground.js_ · [`factionOf`](#s-factionOf) · [`flowPilot`](#s-flowPilot) · [`place`](#s-place) · [`speechName`](#s-speechName) · [`tasteOf`](#s-tasteOf) · [`uniqueName`](#s-uniqueName) · [`unitFor`](#s-unitFor) · [`voiceName`](#s-voiceName)
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`syncBand`](#s-syncBand) · [`unitOf`](#s-unitOf)

<!-- note:flowUnit -->
<!-- /note -->

### <a id="s-stationUnit"></a>`stationUnit(st)`

function · L220–234

- calls: [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`factionOf`](#s-factionOf) · [`place`](#s-place) · [`tasteOf`](#s-tasteOf) · [`uniqueName`](#s-uniqueName) · [`unitFor`](#s-unitFor)
- called by: [`unitOf`](#s-unitOf)

<!-- note:stationUnit -->
<!-- /note -->

### <a id="s-uniqueName"></a>`uniqueName(want, id)`

function · L236–240

- called by: [`flowUnit`](#s-flowUnit) · [`stationUnit`](#s-stationUnit) · [`vesselUnit`](#s-vesselUnit)

<!-- note:uniqueName -->
<!-- /note -->

### <a id="s-syncBand"></a>`syncBand(pos, skySeed=)`

function · **exported** · L242–258

- calls: [`ensure`](#s-ensure) · [`flowUnit`](#s-flowUnit) · [`syncBand>d`](#s-syncBand-d) ×4 · [`vesselUnit`](#s-vesselUnit)
- called by: [`chatter`](#s-chatter)

<!-- note:syncBand -->
Rebuild the band around `pos`: the nearest hulls inside SPEECH_RANGE.

Ports are NOT on it. A station is a building with a duty officer, and the
open channel is pilots talking to pilots — a port that joins the gossip
ends up trading opinions about ore prices with a freighter, which is not
what a harbour does. Port control still calls you, still answers a hail,
still runs the lane and the clamps: all of that is CallSession in comms.js
and none of it comes through here. `unitOf()` will still build a station
unit on demand so you can talk TO one; `chatter()` below simply never picks
one to speak.

- L247 · `for (const n of traffic) if (n.visible !== false && n.job !== "down" && !n.rogue && d(n) <` — rogue drones are nobody: no captain, no voice (they are counted as threats, npc/ground.js)
<!-- /note -->

#### <a id="s-syncBand-d"></a>`syncBand>d(o)`

function · L245–245

- called by: [`syncBand`](#s-syncBand) ×4

<!-- note:syncBand>d -->
<!-- /note -->

### <a id="s-LG_PLACE"></a>`LG_PLACE`

const · L260–260

<!-- note:LG_PLACE -->
---- local places ------------------------------------------------------------
A handful of the engine's stock phrases name Living Galaxy places outright ("the tow off
Cinder Reach"). Rather than fork the vendored file, the band swaps them for somewhere in
this sky — a port or a world, stable per line so a retelling names the same place.
<!-- /note -->

### <a id="s-localise"></a>`localise(text)`

function · **exported** · L261–269

- calls: [`hash`](#s-hash)
- via [js/station/stations.js](../station/stations.js.md): `stations.map`
- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.filter`, `BODIES.filter.map`
- called by: [`chatter`](#s-chatter) · [`talkTo`](#s-talkTo)

<!-- note:localise -->
<!-- /note -->

### <a id="s-relKey"></a>`relKey(a, b)`

function · L271–271

- called by: [`commit`](#s-commit) · [`ctxFor`](#s-ctxFor) ×2

<!-- note:relKey -->
---- the open channel -------------------------------------------------------
<!-- /note -->

### <a id="s-ctxFor"></a>`ctxFor(a, b)`

function · L273–282

- calls: [`groundCtx`](#s-groundCtx) · [`relKey`](#s-relKey) ×2
- called by: [`chatter`](#s-chatter)

<!-- note:ctxFor -->
<!-- /note -->

### <a id="s-groundCtx"></a>`groundCtx()`

function · L284–295

- calls: [`bearingTo`](ground.js.md#s-bearingTo) _js/npc/ground.js_ ×2 · [`portCensus`](ground.js.md#s-portCensus) _js/npc/ground.js_ · [`threatsNear`](ground.js.md#s-threatsNear) _js/npc/ground.js_ ×3
- called by: [`ctxFor`](#s-ctxFor) · [`resetSpeech.ground`](#s-resetSpeech-ground)

<!-- note:groundCtx -->
0.3.16: the world callbacks the engine rolled or read off the band, read off the sky instead.
Handed to the world as opts.ground too, so what a hull tells YOU when you talk to it is held
to the same sky as what it says on the open channel.

- L288 · `ctx.threatNear = (u) => Boolean(u?.ref) && threatsNear(u.ref, THREAT_R, u.ref).count > 0;` — 0.3.16: the world callbacks the engine rolled or read off the band, read off the sky instead
<!-- /note -->

### <a id="s-GROUNDED"></a>`GROUNDED`

const · L297–309

<!-- note:GROUNDED -->
0.3.16 — the claims the engine's topics make, held to the sky. The vendored
engine is untouched; each topic that asserts a fact about the world gets a
`when` that also asks whether it is true.
<!-- /note -->

#### <a id="s-GROUNDED-askHelp"></a>`GROUNDED.askHelp(a, b)`

prop · L298–298

- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`

<!-- note:GROUNDED.askHelp -->
a mayday only from a hull something is actually shooting, to an armed hull that is not shooting at it
<!-- /note -->

#### <a id="s-GROUNDED-refuseHelp"></a>`GROUNDED.refuseHelp(a)`

prop · L299–299

<!-- note:GROUNDED.refuseHelp -->
<!-- /note -->

#### <a id="s-GROUNDED-medicalAid"></a>`GROUNDED.medicalAid(a)`

prop · L300–300

<!-- note:GROUNDED.medicalAid -->
<!-- /note -->

#### <a id="s-GROUNDED-rescueReport"></a>`GROUNDED.rescueReport(a, b)`

prop · L301–301

<!-- note:GROUNDED.rescueReport -->
"they broke off": only once the asker is no longer under fire
<!-- /note -->

#### <a id="s-GROUNDED-positionReport"></a>`GROUNDED.positionReport(a)`

prop · L302–302

- calls: [`threatsNear`](ground.js.md#s-threatsNear) _js/npc/ground.js_

<!-- note:GROUNDED.positionReport -->
"board is clear this side": only when it is
<!-- /note -->

#### <a id="s-GROUNDED-laneReport"></a>`GROUNDED.laneReport(a)`

prop · L303–303

<!-- note:GROUNDED.laneReport -->
a lane report is about the port the speaker is AT, from the count around it
<!-- /note -->

#### <a id="s-GROUNDED-routeAdvice"></a>`GROUNDED.routeAdvice()`

prop · L304–304

<!-- note:GROUNDED.routeAdvice -->
"the corridor has been busy / the beacon net is down": nothing in the sky backs it
<!-- /note -->

#### <a id="s-GROUNDED-oreTip"></a>`GROUNDED.oreTip(a)`

prop · L305–305

<!-- note:GROUNDED.oreTip -->
a miner's seam talk needs a miner on a claim
<!-- /note -->

#### <a id="s-GROUNDED-gradeReport"></a>`GROUNDED.gradeReport(a)`

prop · L306–306

<!-- note:GROUNDED.gradeReport -->
<!-- /note -->

#### <a id="s-GROUNDED-claimDispute"></a>`GROUNDED.claimDispute(a, b)`

prop · L307–307

<!-- note:GROUNDED.claimDispute -->
<!-- /note -->

#### <a id="s-GROUNDED-smallTalk"></a>`GROUNDED.smallTalk(a)`

prop · L308–308

- calls: [`threatsNear`](ground.js.md#s-threatsNear) _js/npc/ground.js_

<!-- note:GROUNDED.smallTalk -->
"the belt is quiet enough to hear the hull tick" and its kind: only on a quiet belt
<!-- /note -->

### <a id="s-groundTopics"></a>`groundTopics()`

function · L310–318

- called by: [`resetSpeech`](#s-resetSpeech)

<!-- note:groundTopics -->
<!-- /note -->

### <a id="s-commit"></a>`commit(key, ctx, script)`

function · L320–345

- calls: [`relKey`](#s-relKey) · [`memoriesFrom`](../speech/npc-speech.js.md#s-memoriesFrom) _js/speech/npc-speech.js_ · [`obligationFrom`](../speech/npc-speech.js.md#s-obligationFrom) _js/speech/npc-speech.js_ · [`registerOf`](../speech/npc-speech.js.md#s-registerOf) _js/speech/npc-speech.js_
- called by: [`chatter`](#s-chatter)

<!-- note:commit -->
The speech world's commit, minus the parts that belong to tick().
<!-- /note -->

### <a id="s-sd"></a>`sd(a, b)`

function · L347–347

- called by: [`chatter`](#s-chatter) ×2

<!-- note:sd -->
<!-- /note -->

### <a id="s-chatter"></a>`chatter(pos, now, rnd=, {…}=)`

function · **exported** · L349–397

- calls: [`dressLine`](chat.js.md#s-dressLine) _js/npc/chat.js_ · [`advance`](#s-advance) · [`commit`](#s-commit) · [`ctxFor`](#s-ctxFor) · [`localise`](#s-localise) · [`sd`](#s-sd) ×2 · [`syncBand`](#s-syncBand) · [`chooseTopic`](../speech/npc-speech.js.md#s-chooseTopic) _js/speech/npc-speech.js_ · [`exchange`](../speech/npc-speech.js.md#s-exchange) _js/speech/npc-speech.js_ · [`registerOf`](../speech/npc-speech.js.md#s-registerOf) _js/speech/npc-speech.js_
- called by: [`onVesselTransition`](../comms/comms.js.md#s-onVesselTransition) _js/comms/comms.js_ · [`stepChatter`](../comms/comms.js.md#s-stepChatter) _js/comms/comms.js_

<!-- note:chatter -->
One exchange on the open channel, or null if nobody near you has anything to say (which
is a normal answer). `rnd` is the caller's seeded draw. `forceSpeaker` pins who opens.
Returns { topic, channel, lines: [{ from, to, text, move }] } where from/to carry the
game entity (`ref`) and its kind.

- L352 · `const U = speech.units.filter((u) => !u.isStation);` — belt and braces: unitOf() pushes a station onto the band when you talk to
  one and does not take it off again, so filter here as well as at the pool
- L355 · `let a = forceSpeaker ? speech.byId.get(forceSpeaker) : null;` — the loudest voices are the nearest ones
- L379 · `const channel = TOPICS[key].channel;` — 0.3.23: the engine decided WHO says WHAT to WHOM about WHICH topic — all
  simulation. A registered voice (js/npc/chat.js) may now re-word the line
  itself before it reaches the band. None registered, or none interested,
  and these are the engine's own words, exactly as before.
<!-- /note -->

### <a id="s-unitOf"></a>`unitOf(entity, kind=)`

function · **exported** · L399–406

- calls: [`ensure`](#s-ensure) · [`flowUnit`](#s-flowUnit) · [`stationUnit`](#s-stationUnit) · [`vesselUnit`](#s-vesselUnit)
- called by: [`regardOf`](#s-regardOf) · [`talkChips`](#s-talkChips) · [`talkTo`](#s-talkTo)

<!-- note:unitOf -->
---- you, on the channel ----------------------------------------------------

The speech unit for a hull or port you are talking to (built if it is not on the band).
<!-- /note -->

### <a id="s-talkTo"></a>`talkTo(entity, text, now, kind=)`

function · **exported** · L408–435

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`corpById`](../corp/corps.js.md#s-corpById) _js/corp/corps.js_ · [`dressReply`](chat.js.md#s-dressReply) _js/npc/chat.js_ · [`answerFor`](reports.js.md#s-answerFor) _js/npc/reports.js_ · [`advance`](#s-advance) · [`localise`](#s-localise) · [`unitOf`](#s-unitOf) · [`registerOf`](../speech/npc-speech.js.md#s-registerOf) _js/speech/npc-speech.js_ ×2
- called by: [`withTalk>provider`](../comms/comms.js.md#s-withTalk-provider) _js/comms/comms.js_ · [`send`](../ui/chatbox.js.md#s-send) _js/ui/chatbox.js_

<!-- note:talkTo -->
Say something to a hull or port. Files the exchange as memory (so it can gossip about you
later) and returns { text, intent, understood, regardDelta, standing } — `standing` is the
corporate standing actually applied (+ gains at most once per hull per GAIN_COOLDOWN).

- L414 · `if (u.kind === "vessel") {` — 0.3.16: a question about the rock, the threat board or the traffic is answered off the sky
<!-- /note -->

### <a id="s-regardOf"></a>`regardOf(entity, kind=)`

function · **exported** · L437–441

- calls: [`unitOf`](#s-unitOf)

<!-- note:regardOf -->
Regard a hull or port holds for you, −1..1, and the memories behind it.
<!-- /note -->

### <a id="s-noteLost"></a>`noteLost(entity)`

function · **exported** · L443–446

- calls: [`speechName`](#s-speechName)
- called by: [`noteShootDowns`](../comms/comms.js.md#s-noteShootDowns) _js/comms/comms.js_

<!-- note:noteLost -->
A hull went down near you: the band will talk about it.
<!-- /note -->

### <a id="s-CHIP"></a>`CHIP`

const · L448–458

<!-- note:CHIP -->
---- chips for the call panel -----------------------------------------------
<!-- /note -->

### <a id="s-talkChips"></a>`talkChips(entity, turn=, kind=)`

function · **exported** · L460–467

- calls: [`extraChips`](chat.js.md#s-extraChips) _js/npc/chat.js_ · [`hash`](#s-hash) · [`unitOf`](#s-unitOf)
- called by: [`withTalk>chips`](../comms/comms.js.md#s-withTalk-chips) _js/comms/comms.js_

<!-- note:talkChips -->
Three quick lines that suit who you are talking to, rotating so a long chat varies.

- L466 · `return [...mine, ...extraChips(u, turn, "direct")].slice(0, 5);` — a pack can put its own things to say on the call panel
<!-- /note -->

### <a id="s-SIGN_OFF"></a>`SIGN_OFF`

const · **exported** · L469–469

<!-- note:SIGN_OFF -->
<!-- /note -->

### <a id="s-speechStats"></a>`speechStats()`

function · **exported** · L471–478

<!-- note:speechStats -->
Debug console handle.
<!-- /note -->

## Module-level calls

- calls: [`voiceName`](#s-voiceName)
