# js/corp/seclevel.js

[index](../../../README.md) · 306 lines · 29 symbols · 6 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — the security level: one diamond that says where you stand.

  ◆ GREEN   Safe. The system's policing corporation (npc/security.js's
            Directorate) has you on its books. SOS calls a quick-reaction
            wing to wherever you are, on the same honest clock the NPCs get.
  ◆ YELLOW  In combat — shot at, or shooting, inside the last 20 seconds.
            The Directorate does not dispatch into a fight YOU picked: SOS
            is closed until it goes quiet. But a fight that picked you is
            another matter (0.3.56): rogue drones or pirates hitting you,
            and you have not gone after them yourself — no P-LOCK attack,
            no first shot; turrets returning fire is self-defence — and
            SOS stays open. A wing that arrives to find them still at it
            pays a bounty for the call, by what they found.
  ◆ RED     Wanted. You have killed enough honest hulls — and pilots — for
            the Directorate to lower your standing with it to nothing: no
            SOS, its patrols read you as hostile and open fire, and it
            stays that way until the heat cools or you pay the fine at an
            honest port.

HEAT is the number under it. Every honest hull you destroy adds to it, a
Directorate hull more, another pilot most of all; opening fire on an honest
hull that then calls for help adds a little. It cools on its own, slowly,
and it rides the pilot record (pilot.secHeat), so a reload is not an
amnesty. Red is heat ≥ SEC.red; pay the fine and it is zero.

Leaf-ish: no DOM, no sim import. sim.js calls stepSecLevel() once a tick
with the ship and wires `secHooks` for the log and the toasts.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../flight/pilot.js` | `pilot` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 2 | `../npc/security.js` | `callForHelp`, `callById`, `securityCorp`, `etaOf` | [js/npc/security.js](../npc/security.js.md) |
| 3 | `../npc/traffic.js` | `traffic`, `HOSTILE_ROLES`, `LAW_ROLES`, `vesselById` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 4 | `./corps.js` | `adjustStanding`, `corpOfStation` | [js/corp/corps.js](corps.js.md) |
| 5 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 6 | `../flight/turrets.js` | `contactById`, `contacts`, `fireRound` | [js/flight/turrets.js](../flight/turrets.js.md) |

## Imported by

- [js/sim/sim.js](../sim/sim.js.md) — `stepSecLevel`, `resetSecLevel`, `secHooks`, `selfVictim`, `noteKillBySelf`, `noteHonestHit`, `noteShot`, `wingArrived`
- [js/ui/secbadge.js](../ui/secbadge.js.md) — `secLevel`, `callSOS`, `payFine`, `SEC`, `LEVELS`, `BOUNTY`
- test/qrf.test.mjs _(outside js/)_ — `SEC`
- test/seclevel.test.mjs _(outside js/)_ — `SEC`

## Exports

- [`SEC`](#s-SEC) · const — used by [js/ui/secbadge.js](../ui/secbadge.js.md), test/qrf.test.mjs, test/seclevel.test.mjs
- [`BOUNTY`](#s-BOUNTY) · const — used by [js/ui/secbadge.js](../ui/secbadge.js.md)
- [`LEVELS`](#s-LEVELS) · const — used by [js/ui/secbadge.js](../ui/secbadge.js.md)
- [`secState`](#s-secState) · const — **no importer in scanned roots**
- [`secHooks`](#s-secHooks) · const — used by [js/sim/sim.js](../sim/sim.js.md)
- [`resetSecLevel`](#s-resetSecLevel) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`attackerKind`](#s-attackerKind) · function — **no importer in scanned roots**
- [`noteShot`](#s-noteShot) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`noteHitBy`](#s-noteHitBy) · function — **no importer in scanned roots**
- [`assault`](#s-assault) · function — **no importer in scanned roots**
- [`bountyFor`](#s-bountyFor) · function — **no importer in scanned roots**
- [`heat`](#s-heat) · function — **no importer in scanned roots**
- [`noteKillBySelf`](#s-noteKillBySelf) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`noteHonestHit`](#s-noteHonestHit) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`noteFired`](#s-noteFired) · function — **no importer in scanned roots**
- [`secLevel`](#s-secLevel) · function — used by [js/ui/secbadge.js](../ui/secbadge.js.md)
- [`callSOS`](#s-callSOS) · function — used by [js/ui/secbadge.js](../ui/secbadge.js.md)
- [`selfVictim`](#s-selfVictim) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`payFine`](#s-payFine) · function — used by [js/ui/secbadge.js](../ui/secbadge.js.md)
- [`wingArrived`](#s-wingArrived) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`stepSecLevel`](#s-stepSecLevel) · function — used by [js/sim/sim.js](../sim/sim.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-SEC"></a>`SEC`

const · **exported** · L8–29

<!-- note:SEC -->
- L9 · `combatWindow: 20,` — s since a hit taken or a round fired that still counts as "in combat"
- L10 · `red: 3,` — heat at which you are wanted
- L11 · `cool: 360,` — s of quiet for one point of heat to go
- L12 · `honestKill: 1,` — an honest hull destroyed
- L13 · `lawKill: 2,` — a Directorate hull destroyed
- L14 · `playerKill: 2,` — another pilot destroyed
- L15 · `honestHit: 0.2,` — opening fire on an honest hull that then calls for help
- L16 · `finePerHeat: 1200,` — cr a point at the Directorate's counter
- L18 · `sosCooldown: 150,` — s between SOS calls
- L19 · `sosReach: 9000,` — u: a hostile inside this of you is what the wing comes for
- L20 · `falseAlarm: -1,` — standing with the Directorate for a wing that found nothing
- L21 · `defendWindow: 22,` — 0.3.56 — a fight that picked you
- L21 · `defendWindow: 22,` — s after a hit in which firing back is self-defence
- L22 · `pickedFor: 90,` — s a fight you picked keeps SOS closed
- L23 · `bonusCap: 2500,` — cr the Directorate pays for one call, at most
- L24 · `standingCap: 5,` — standing it gives for one call, at most
- L25 · `wingRange: 2400,` — u: a wing hull this close to you fights what is on you
- L26 · `wingReach: 1800,` — u: …and reaches this far from itself
- L27 · `wingRate: 1.1,` — s between a wing hull's rounds
<!-- /note -->

### <a id="s-BOUNTY"></a>`BOUNTY`

const · **exported** · L31–36

<!-- note:BOUNTY -->
What the Directorate pays when its wing finds the hostile still at you.
<!-- /note -->

### <a id="s-HOSTILE_KINDS"></a>`HOSTILE_KINDS`

const · L37–37

<!-- note:HOSTILE_KINDS -->
<!-- /note -->

### <a id="s-LEVELS"></a>`LEVELS`

const · **exported** · L39–43

<!-- note:LEVELS -->
<!-- /note -->

### <a id="s-secState"></a>`secState`

const · **exported** · L45–45

<!-- note:secState -->
Live, per session. Heat itself is pilot.secHeat.
<!-- /note -->

### <a id="s-secHooks"></a>`secHooks`

const · **exported** · L46–46

<!-- note:secHooks -->
<!-- /note -->

### <a id="s-resetSecLevel"></a>`resetSecLevel()`

function · **exported** · L48–51

- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetSecLevel -->
<!-- /note -->

### <a id="s-attackerKind"></a>`attackerKind(id)`

function · **exported** · L53–62

- calls: [`contactById`](../flight/turrets.js.md#s-contactById) _js/flight/turrets.js_ · [`vesselById`](../npc/traffic.js.md#s-vesselById) _js/npc/traffic.js_
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`
- called by: [`assault`](#s-assault) · [`wingArrived`](#s-wingArrived) ×2

<!-- note:attackerKind -->
---- 0.3.56: who started it ------------------------------------------------

What kind of hostile this id is, or null if it is not one the Directorate pays for.
<!-- /note -->

### <a id="s-alive"></a>`alive(id)`

function · L64–69

- calls: [`contactById`](../flight/turrets.js.md#s-contactById) _js/flight/turrets.js_ · [`vesselById`](../npc/traffic.js.md#s-vesselById) _js/npc/traffic.js_
- called by: [`assault`](#s-assault) · [`callSOS`](#s-callSOS) · [`secLevel`](#s-secLevel) · [`wingArrived`](#s-wingArrived) ×2

<!-- note:alive -->
<!-- /note -->

### <a id="s-noteShot"></a>`noteShot(target, t, lockedId=)`

function · **exported** · L71–78

- called by: [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_

<!-- note:noteShot -->
Your turrets fired at `target`. Self-defence — returning fire on something
that hit you inside SEC.defendWindow — is not picking a fight. A P-LOCK on
it is (you went after it by hand), and so is shooting first.
<!-- /note -->

### <a id="s-noteHitBy"></a>`noteHitBy(id, t)`

function · **exported** · L80–80

- called by: [`stepSecLevel`](#s-stepSecLevel)

<!-- note:noteHitBy -->
Somebody hit you (stepSecLevel reads ship.lastHitBy; tests may call this).
<!-- /note -->

### <a id="s-assault"></a>`assault(ship, t)`

function · **exported** · L82–95

- calls: [`alive`](#s-alive) · [`attackerKind`](#s-attackerKind)
- called by: [`secLevel`](#s-secLevel)

<!-- note:assault -->
Is this fight one that picked you? → { ok, why, attackers: [{ id, kind }] }
ok when everything that hit you inside the combat window is a hostile the
Directorate answers for, and you have not picked a fight with anything
still alive inside SEC.pickedFor.
<!-- /note -->

### <a id="s-bountyFor"></a>`bountyFor(list)`

function · **exported** · L97–107

- calls: [`contactById`](../flight/turrets.js.md#s-contactById) _js/flight/turrets.js_ · [`vesselById`](../npc/traffic.js.md#s-vesselById) _js/npc/traffic.js_
- called by: [`secLevel`](#s-secLevel) · [`wingArrived`](#s-wingArrived)

<!-- note:bountyFor -->
What a wing finding these still at you would pay.
<!-- /note -->

### <a id="s-heat"></a>`heat()`

function · **exported** · L109–109

- called by: [`addHeat`](#s-addHeat) ×2 · [`payFine`](#s-payFine) · [`secLevel`](#s-secLevel) · [`stepSecLevel`](#s-stepSecLevel) ×3

<!-- note:heat -->
<!-- /note -->

### <a id="s-addHeat"></a>`addHeat(n, why, t)`

function · L110–122

- calls: [`adjustStanding`](corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`heat`](#s-heat) ×2 · [`securityCorp`](../npc/security.js.md#s-securityCorp) _js/npc/security.js_
- called by: [`noteHonestHit`](#s-noteHonestHit) · [`noteKillBySelf`](#s-noteKillBySelf) ×3

<!-- note:addHeat -->
<!-- /note -->

### <a id="s-noteKillBySelf"></a>`noteKillBySelf({…}=)`

function · **exported** · L124–129

- calls: [`addHeat`](#s-addHeat) ×3
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- called by: [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ ×2

<!-- note:noteKillBySelf -->
---- what raises it -------------------------------------------------------

You destroyed a hull. `n` is the traffic record (or null for a peer), `peer` a remote pilot.

- L126 · `if (!n || HOSTILE_ROLES.has(n.role) || n.rogue) return null;` — pirates and rogues are the job
<!-- /note -->

### <a id="s-noteHonestHit"></a>`noteHonestHit(call, t=)`

function · **exported** · L131–134

- calls: [`addHeat`](#s-addHeat)
- called by: [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_

<!-- note:noteHonestHit -->
An honest hull you opened fire on called for help.
<!-- /note -->

### <a id="s-noteFired"></a>`noteFired(t)`

function · **exported** · L136–136

<!-- note:noteFired -->
You fired a round (turrets.js marks ship.lastFireAt; this is the fallback).
<!-- /note -->

### <a id="s-inCombat"></a>`inCombat(ship, t)`

function · L138–142

- called by: [`secLevel`](#s-secLevel)

<!-- note:inCombat -->
---- the level -------------------------------------------------------------
<!-- /note -->

### <a id="s-secLevel"></a>`secLevel(ship, t)`

function · **exported** · L144–167

- calls: [`alive`](#s-alive) · [`assault`](#s-assault) · [`bountyFor`](#s-bountyFor) · [`heat`](#s-heat) · [`inCombat`](#s-inCombat) · [`callById`](../npc/security.js.md#s-callById) _js/npc/security.js_ · [`etaOf`](../npc/security.js.md#s-etaOf) _js/npc/security.js_ · [`securityCorp`](../npc/security.js.md#s-securityCorp) _js/npc/security.js_
- called by: [`callSOS`](#s-callSOS) · [`stepSecLevel`](#s-stepSecLevel) · [`mountSecBadge`](../ui/secbadge.js.md#s-mountSecBadge) _js/ui/secbadge.js_

<!-- note:secLevel -->
→ { id, label, colour, heat, corp, canSOS, why, fine, cools }
`why` is the reason SOS is closed, or null when it is open.

- L165 · `assault: under?.ok ? { kinds: under.attackers.map((a) => a.kind), bounty: bountyFor(under.` — 0.3.56: a fight that picked you — who, and what a wing finding them would pay
<!-- /note -->

### <a id="s-nearestHostile"></a>`nearestHostile(pos)`

function · L169–177

- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`
- called by: [`callSOS`](#s-callSOS) · [`stepSecLevel`](#s-stepSecLevel)

<!-- note:nearestHostile -->
---- SOS -------------------------------------------------------------------
<!-- /note -->

### <a id="s-callSOS"></a>`callSOS(ship, t)`

function · **exported** · L179–197

- calls: [`alive`](#s-alive) · [`nearestHostile`](#s-nearestHostile) · [`secLevel`](#s-secLevel) · [`contactById`](../flight/turrets.js.md#s-contactById) _js/flight/turrets.js_ · [`callById`](../npc/security.js.md#s-callById) _js/npc/security.js_ · [`callForHelp`](../npc/security.js.md#s-callForHelp) _js/npc/security.js_ · [`etaOf`](../npc/security.js.md#s-etaOf) _js/npc/security.js_ · [`vesselById`](../npc/traffic.js.md#s-vesselById) _js/npc/traffic.js_
- called by: [`mountSecBadge>build`](../ui/secbadge.js.md#s-mountSecBadge-build) _js/ui/secbadge.js_

<!-- note:callSOS -->
Call the quick-reaction wing to where you are. Returns { ok, why, call }.

- L182 · `const prev = secState.sosId ? callById(secState.sosId) : null;` — a call nobody could answer is closed before a new one goes out — the bus
  refreshes an open call rather than re-dispatching it
- L184 · `const on = lv.assault ? [...secState.hitBy].filter(([id, at]) => t - at < SEC.combatWindow` — 0.3.56: under attack, the call names who is on you — the newest attacker
<!-- /note -->

### <a id="s-selfPos"></a>`selfPos`

const · L199–199

<!-- note:selfPos -->
Where the player's own call is (npc/security.js asks this for victim "self").
<!-- /note -->

### <a id="s-selfVictim"></a>`selfVictim()`

function · **exported** · L200–202

<!-- note:selfVictim -->
<!-- /note -->

### <a id="s-payFine"></a>`payFine(ship)`

function · **exported** · L204–221

- calls: [`adjustStanding`](corps.js.md#s-adjustStanding) _js/corp/corps.js_ ×2 · [`corpOfStation`](corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`heat`](#s-heat) · [`securityCorp`](../npc/security.js.md#s-securityCorp) _js/npc/security.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`mountSecBadge>build`](../ui/secbadge.js.md#s-mountSecBadge-build) _js/ui/secbadge.js_

<!-- note:payFine -->
---- the fine -------------------------------------------------------------

Clear the heat at an honest port's Directorate counter. Returns null or why not.
<!-- /note -->

### <a id="s-wingArrived"></a>`wingArrived(call, t, ship)`

function · **exported** · L223–250

- calls: [`adjustStanding`](corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`alive`](#s-alive) ×2 · [`attackerKind`](#s-attackerKind) ×2 · [`bountyFor`](#s-bountyFor) · [`wingArrived>near`](#s-wingArrived-near) ×2 · [`contactById`](../flight/turrets.js.md#s-contactById) _js/flight/turrets.js_ ×2 · [`securityCorp`](../npc/security.js.md#s-securityCorp) _js/npc/security.js_ · [`vesselById`](../npc/traffic.js.md#s-vesselById) _js/npc/traffic.js_ ×2
- called by: [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_

<!-- note:wingArrived -->
---- 0.3.56: the wing arrives -------------------------------------------------

The wing is on scene for YOUR call. If what was on you is still at it, the
Directorate pays for the call — by what its hulls found — and remembers it.
Returns { cr, standing, found } or null when it was not your call.
<!-- /note -->

#### <a id="s-wingArrived-near"></a>`wingArrived>near(o)`

function · L228–228

- called by: [`wingArrived`](#s-wingArrived) ×2

<!-- note:wingArrived>near -->
<!-- /note -->

### <a id="s-wingSupport"></a>`wingSupport(call, ship, t)`

function · L252–269

- calls: [`fireRound`](../flight/turrets.js.md#s-fireRound) _js/flight/turrets.js_ · [`vesselById`](../npc/traffic.js.md#s-vesselById) _js/npc/traffic.js_
- called by: [`stepSecLevel`](#s-stepSecLevel)

<!-- note:wingSupport -->
The wing fights what is on you: a turret drone the NPC fight never sees gets rounds too.

- L266 · `const lead = bd / 950;` — a picket leads its target the way your mounts do
<!-- /note -->

### <a id="s-stepSecLevel"></a>`stepSecLevel(ship, t, dt, {…}=)`

function · **exported** · L271–306

- calls: [`adjustStanding`](corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`heat`](#s-heat) ×3 · [`nearestHostile`](#s-nearestHostile) · [`noteHitBy`](#s-noteHitBy) · [`secLevel`](#s-secLevel) · [`wingSupport`](#s-wingSupport) · [`callById`](../npc/security.js.md#s-callById) _js/npc/security.js_ · [`securityCorp`](../npc/security.js.md#s-securityCorp) _js/npc/security.js_
- via [js/npc/traffic.js](../npc/traffic.js.md): `traffic.some`
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepSecLevel -->
---- the tick --------------------------------------------------------------

- L275 · `if (ship.lastHitBy && ship.lastHitAt !== secState.lastHitSeen) { secState.lastHitSeen = sh` — who has hit you, and when — self-defence is judged against this
- L277 · `if (heat() > 0) {` — heat cools with time, not with docking or reloading
- L281 · `const call = secState.sosId ? callById(secState.sosId) : null;` — the player's own call: keep it pointed at the fight, keep it open while you are hit
- L304 · `ship.outlaw = lv.id === "red";` — the patrols read a wanted pilot as hostile (turrets.js keys off this)
<!-- /note -->
