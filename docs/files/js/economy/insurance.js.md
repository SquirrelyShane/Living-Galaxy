# js/economy/insurance.js

[index](../../../README.md) · 136 lines · 24 symbols · 0 imports · 6 importers

## About

<!-- note:@file -->
LIVING GALAXY — hull insurance.

Up to 0.3.33 nothing in this game could lose a hull and mean it. The
player's ship clamped to twelve points and coughed "hull breach contained";
NPCs went dark for ten minutes and came back on the same route; only a
contracted drone could actually die, and when it did you simply ate the
loss. There was nothing to insure against, so there was no insurance.

Now there is. A policy is bought at a yard against ONE hull, it costs
credits, and it pays a fraction of what that hull is worth when the hull is
gone. Five tiers, and the payout fraction is the whole product:

  PLATINUM  100%      GOLD  75%      SILVER  50%      COPPER  25%      BRONZE  10%

A policy covers one loss and is consumed by it. No renewals, no billing
cycle, no lapse state: you buy cover for the hull you are about to fly, and
after it pays you decide again. The decision to re-insure is more
interesting than the bookkeeping would have been.

WHAT A HULL IS WORTH, and why it is not the list price. The yard sells to a
complex member in their own line at 45% (ISSUE_RATE in js/economy/shipcost.js). If
cover were written against list, a member could buy at 0.45, insure
platinum at 0.35, throw the hull away and bank 1.00 — a twenty percent
profit per deliberate loss, which is a money printer rather than a game
mechanic. So a hull is insured for what it costs ITS OWNER, at that owner's
own rate, and both sides of the trade move together.

PREMIUMS are a flat fraction of that value, and every tier is a losing bet
unless you expect to lose the hull about a third of the time:

  tier      payout   premium   break-even loss rate
  platinum   100%      35%            35%
  gold        75%      24%            32%
  silver      50%      15%            30%
  copper      25%       7%            28%
  bronze      10%       3%            30%

Deliberately flat. The high tiers are very slightly the worse bet because
what you are buying up there is certainty, and certainty is never free.

This module is state and arithmetic and nothing else — no document, no sim
import — so the whole thing is testable without a sky. Who claims and when
lives with the thing being lost: js/sim/sim.js for the player, js/drones/ops.js
for contracted drones, js/npc/traffic.js for everybody else.

- L13 · `export const insuranceLog = [];` — the last few claims, for the console and the desk
<!-- /note -->

## Imports

_none_

## Imported by

- [js/console/panels/work-drones.js](../console/panels/work-drones.js.md) — `TIERS`, `TIER_BY_ID`, `premiumFor`
- [js/drones/ops.js](../drones/ops.js.md) — `claim`, `insure`, `droneKey`, `premiumFor`, `TIER_BY_ID`, `release`
- [js/npc/traffic.js](../npc/traffic.js.md) — `coverForVessel`, `downScaleFor`
- [js/sim/sim.js](../sim/sim.js.md) — `claim`, `insure`, `playerKey`, `policies`, `policyFor`, `resetInsurance`
- [js/ui/coverage.js](../ui/coverage.js.md) — `quoteAll`, `policyFor`, `insure`, `playerKey`, `TIER_BY_ID`
- test/insurance.test.mjs _(outside js/)_ — `TIERS`, `TIER_BY_ID`, `policies`, `insuranceLog`, `resetInsurance`, `premiumFor`, `payoutFor`, `quoteAll`, `insure`, `policyFor`, `isInsured`, `release`, `claim`, `insuranceReport`, `playerKey`, `droneKey`, `npcKey`, `coverForVessel`, `downScaleFor`, `DOWN_SCALE`

## Exports

- [`TIERS`](#s-TIERS) · const — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), test/insurance.test.mjs
- [`TIER_BY_ID`](#s-TIER_BY_ID) · const — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/ui/coverage.js](../ui/coverage.js.md), test/insurance.test.mjs
- [`policies`](#s-policies) · const — used by [js/sim/sim.js](../sim/sim.js.md), test/insurance.test.mjs
- [`insuranceLog`](#s-insuranceLog) · const — used by test/insurance.test.mjs
- [`playerKey`](#s-playerKey) · function — used by [js/sim/sim.js](../sim/sim.js.md), [js/ui/coverage.js](../ui/coverage.js.md), test/insurance.test.mjs
- [`droneKey`](#s-droneKey) · function — used by [js/drones/ops.js](../drones/ops.js.md), test/insurance.test.mjs
- [`npcKey`](#s-npcKey) · function — used by test/insurance.test.mjs
- [`resetInsurance`](#s-resetInsurance) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/insurance.test.mjs
- [`premiumFor`](#s-premiumFor) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/drones/ops.js](../drones/ops.js.md), test/insurance.test.mjs
- [`payoutFor`](#s-payoutFor) · function — used by test/insurance.test.mjs
- [`quoteAll`](#s-quoteAll) · function — used by [js/ui/coverage.js](../ui/coverage.js.md), test/insurance.test.mjs
- [`insure`](#s-insure) · function — used by [js/drones/ops.js](../drones/ops.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/coverage.js](../ui/coverage.js.md), test/insurance.test.mjs
- [`policyFor`](#s-policyFor) · function — used by [js/sim/sim.js](../sim/sim.js.md), [js/ui/coverage.js](../ui/coverage.js.md), test/insurance.test.mjs
- [`isInsured`](#s-isInsured) · function — used by test/insurance.test.mjs
- [`release`](#s-release) · function — used by [js/drones/ops.js](../drones/ops.js.md), test/insurance.test.mjs
- [`claim`](#s-claim) · function — used by [js/drones/ops.js](../drones/ops.js.md), [js/sim/sim.js](../sim/sim.js.md), test/insurance.test.mjs
- [`insuranceReport`](#s-insuranceReport) · function — used by test/insurance.test.mjs
- [`coverForVessel`](#s-coverForVessel) · function — used by [js/npc/traffic.js](../npc/traffic.js.md), test/insurance.test.mjs
- [`DOWN_SCALE`](#s-DOWN_SCALE) · const — used by test/insurance.test.mjs
- [`downScaleFor`](#s-downScaleFor) · function — used by [js/npc/traffic.js](../npc/traffic.js.md), test/insurance.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-TIERS"></a>`TIERS`

const · **exported** · L1–7

<!-- note:TIERS -->
The tiers, cheapest first. `payout` and `rate` are both fractions of hull value.
<!-- /note -->

### <a id="s-TIER_BY_ID"></a>`TIER_BY_ID`

const · **exported** · L9–9

<!-- note:TIER_BY_ID -->
<!-- /note -->

### <a id="s-policies"></a>`policies`

const · **exported** · L11–11

<!-- note:policies -->
Live policies, keyed by hull key. One per hull: buying again replaces it.
<!-- /note -->

### <a id="s-insuranceLog"></a>`insuranceLog`

const · **exported** · L13–13

<!-- note:insuranceLog -->
<!-- /note -->

### <a id="s-LOG_CAP"></a>`LOG_CAP`

const · L14–14

<!-- note:LOG_CAP -->
<!-- /note -->

### <a id="s-playerKey"></a>`playerKey(hullId)`

function · **exported** · L16–16

- called by: [`loseHull`](../sim/sim.js.md#s-loseHull) _js/sim/sim.js_ · [`buyCoverage`](../ui/coverage.js.md#s-buyCoverage) _js/ui/coverage.js_ · [`renderCoverage`](../ui/coverage.js.md#s-renderCoverage) _js/ui/coverage.js_

<!-- note:playerKey -->
Keys are namespaced so a drone and a vessel can never collide.
<!-- /note -->

### <a id="s-droneKey"></a>`droneKey(unitId)`

function · **exported** · L17–17

- called by: [`destroy`](../drones/ops.js.md#s-destroy) _js/drones/ops.js_ · [`loadDroneOps`](../drones/ops.js.md#s-loadDroneOps) _js/drones/ops.js_ · [`rollOff`](../drones/ops.js.md#s-rollOff) _js/drones/ops.js_ · [`scrapDrone`](../drones/ops.js.md#s-scrapDrone) _js/drones/ops.js_

<!-- note:droneKey -->
<!-- /note -->

### <a id="s-npcKey"></a>`npcKey(vesselId)`

function · **exported** · L18–18

<!-- note:npcKey -->
<!-- /note -->

### <a id="s-resetInsurance"></a>`resetInsurance()`

function · **exported** · L20–23

- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:resetInsurance -->
<!-- /note -->

### <a id="s-premiumFor"></a>`premiumFor(value, tierId)`

function · **exported** · L25–29

- called by: [`buildSection`](../console/panels/work-drones.js.md#s-buildSection) _js/console/panels/work-drones.js_ · [`orderBuild`](../drones/ops.js.md#s-orderBuild) _js/drones/ops.js_ · [`insure`](#s-insure) · [`quoteAll`](#s-quoteAll)

<!-- note:premiumFor -->
What a tier costs against a hull worth `value`. Rounded to whole credits.
<!-- /note -->

### <a id="s-payoutFor"></a>`payoutFor(value, tierId)`

function · **exported** · L31–35

- called by: [`insure`](#s-insure) · [`quoteAll`](#s-quoteAll)

<!-- note:payoutFor -->
What a tier would pay out against a hull worth `value`.
<!-- /note -->

### <a id="s-quoteAll"></a>`quoteAll(value)`

function · **exported** · L37–48

- calls: [`payoutFor`](#s-payoutFor) · [`premiumFor`](#s-premiumFor)
- called by: [`renderCoverage`](../ui/coverage.js.md#s-renderCoverage) _js/ui/coverage.js_

<!-- note:quoteAll -->
Every tier priced against one hull, for a yard panel or a test.

The fractions and the credit amounts are separate fields on purpose. A
first cut spread the tier and then overwrote `payout` — a fraction — with a
credit total, so anything downstream reading `payout` got 50,618 where it
expected 1. Two names, no ambiguity.

- L42 · `payoutPct: t.payout,` — fraction of hull value this tier covers
- L43 · `ratePct: t.rate,` — fraction of hull value the premium costs
- L44 · `premium: premiumFor(value, t.id),` — credits
- L45 · `payout: payoutFor(value, t.id),` — credits
<!-- /note -->

### <a id="s-insure"></a>`insure(key, tierId, value, at=)`

function · **exported** · L50–63

- calls: [`payoutFor`](#s-payoutFor) · [`premiumFor`](#s-premiumFor)
- called by: [`loadDroneOps`](../drones/ops.js.md#s-loadDroneOps) _js/drones/ops.js_ · [`rollOff`](../drones/ops.js.md#s-rollOff) _js/drones/ops.js_ · [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`buyCoverage`](../ui/coverage.js.md#s-buyCoverage) _js/ui/coverage.js_

<!-- note:insure -->
Write cover. `value` is what the hull is worth TO ITS OWNER — see the head
of this file for why that is not the list price. Returns the policy, or
null for an unknown tier or a worthless hull.
<!-- /note -->

### <a id="s-policyFor"></a>`policyFor(key)`

function · **exported** · L65–67

- called by: [`loseHull`](../sim/sim.js.md#s-loseHull) _js/sim/sim.js_ · [`renderCoverage`](../ui/coverage.js.md#s-renderCoverage) _js/ui/coverage.js_

<!-- note:policyFor -->
The cover on a hull, or null.
<!-- /note -->

### <a id="s-isInsured"></a>`isInsured(key)`

function · **exported** · L69–71

<!-- note:isInsured -->
<!-- /note -->

### <a id="s-release"></a>`release(key)`

function · **exported** · L73–75

- called by: [`scrapDrone`](../drones/ops.js.md#s-scrapDrone) _js/drones/ops.js_

<!-- note:release -->
Tear up a policy without paying it — the hull was sold, or the sky reset.
<!-- /note -->

### <a id="s-claim"></a>`claim(key, {…}=)`

function · **exported** · L77–88

- called by: [`destroy`](../drones/ops.js.md#s-destroy) _js/drones/ops.js_ · [`loseHull`](../sim/sim.js.md#s-loseHull) _js/sim/sim.js_

<!-- note:claim -->
The hull is gone. Pays out and consumes the policy; returns what is owed,
or 0 if there was no cover.

The payout is settled against the value recorded WHEN THE COVER WAS WRITTEN,
not the hull's worth today. That is what an insurer actually promises, and
it stops a refit the week before a loss from paying for itself.
<!-- /note -->

### <a id="s-insuranceReport"></a>`insuranceReport()`

function · **exported** · L90–102

<!-- note:insuranceReport -->
What the underwriters have on the books, for the console and the news desk.
<!-- /note -->

### <a id="s-ROLE_COVER"></a>`ROLE_COVER`

const · L104–115

<!-- note:ROLE_COVER -->
---- who else carries cover ---------------------------------------------

The sky is not all uninsured just because the player is the only one who
shops. A hull with a captain and a route has an underwriter behind it, and
which tier is a fact about that operator — a freight line running a lane
insures properly, a pirate does not insure at all.

It is seeded off the vessel id, so the same hull always carries the same
cover: no state to sync across a shared sky, and the SHIPS directory can
say what a contact is covered for without asking anybody.
<!-- /note -->

### <a id="s-DEFAULT_COVER"></a>`DEFAULT_COVER`

const · L116–116

<!-- note:DEFAULT_COVER -->
<!-- /note -->

### <a id="s-hash32"></a>`hash32(s)`

function · L118–122

- called by: [`coverForVessel`](#s-coverForVessel)

<!-- note:hash32 -->
<!-- /note -->

### <a id="s-coverForVessel"></a>`coverForVessel(vessel)`

function · **exported** · L124–129

- calls: [`hash32`](#s-hash32)
- called by: [`downScaleFor`](#s-downScaleFor) · [`buildRoster.cover`](../npc/traffic.js.md#s-buildRoster-cover) _js/npc/traffic.js_

<!-- note:coverForVessel -->
The tier a vessel carries, or null for none. Deterministic in its id.

- L126 · `if (vessel.rogue) return null;` — nobody underwrites a drone nest
<!-- /note -->

### <a id="s-DOWN_SCALE"></a>`DOWN_SCALE`

const · **exported** · L131–131

<!-- note:DOWN_SCALE -->
How long a downed hull stays off the board, as a multiple of the base.
A covered operator has the money to replace it and is back sooner; an
uninsured one is not. This is the whole mechanical meaning of NPC cover,
and it is visible: a lane that keeps its traffic is a lane whose haulers
are properly underwritten.
<!-- /note -->

### <a id="s-downScaleFor"></a>`downScaleFor(vessel)`

function · **exported** · L133–136

- calls: [`coverForVessel`](#s-coverForVessel)
- called by: [`markVesselDown`](../npc/traffic.js.md#s-markVesselDown) _js/npc/traffic.js_

<!-- note:downScaleFor -->
- L135 · `return tier ? (DOWN_SCALE[tier] ?? 1) : 1.35;` — uninsured takes longer than the base
<!-- /note -->
