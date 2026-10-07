# js/aria/mind.js

[index](../../../README.md) · 255 lines · 56 symbols · 0 imports · 13 importers

## About

<!-- note:@file -->
One bounded, deterministic intelligence. No simulation imports or actuator access.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/aria/aria.js](aria.js.md) — `ariaMind`, `resetMind`, `saveMind`, `loadMind`, `mindKey`, `bindPeopleLookup`, `explanationPacket`, `bindPacketExtras`, `calibReport`
- [js/aria/company.js](company.js.md) — `authorize`, `remember`
- [js/aria/pilot.js](pilot.js.md) — `ariaMind`, `authorize`, `contextualScore`, `decideMind`, `policyScore`, `learnOutcome`, `breakLine`, `forecast`, `settleForecast`, `riskAversion`
- [js/aria/play.js](play.js.md) — `ariaMind`, `authorize`, `decideMind`, `policyScore`, `learnOutcome`, `spendCap`, `breakLine`, `forecast`, `settleForecast`, `riskAversion`, `calibReport`
- [js/aria/senses.js](senses.js.md) — `ariaMind`, `discount`, `remember`
- [js/aria/wake.js](wake.js.md) — `ariaMind`, `verbOf`
- [js/console/panels/aria-core.js](../console/panels/aria-core.js.md) — `ariaMind`, `setOrders`, `personMemory`, `explanationPacket`, `calibReport`
- [js/flight/recorder.js](../flight/recorder.js.md) — `ariaMind`, `saveMind`, `learnTape`
- [js/mission/run.js](../mission/run.js.md) — `authorize`
- [js/mission/tradeops.js](../mission/tradeops.js.md) — `authorize`, `spendCap`
- test/aria-mining-loop.test.mjs _(outside js/)_ — `ariaMind`
- test/ariamind-integration.test.mjs _(outside js/)_ — `ariaMind`, `resetMind`
- test/ariamind.test.mjs _(outside js/)_ — `ariaMind`, `resetMind`, `learnTape`, `authorize`, `setOrders`, `remember`, `bindPeopleLookup`, `personMemory`, `decideMind`, `explanationPacket`, `loadMind`, `saveMind`, `spendCap`, `WORKING_FLOOR`

## Exports

- [`WORKING_FLOOR`](#s-WORKING_FLOOR) · const — used by test/ariamind.test.mjs
- [`BREAK`](#s-BREAK) · const — **no importer in scanned roots**
- [`breakLine`](#s-breakLine) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md)
- [`domainOf`](#s-domainOf) · function — **no importer in scanned roots**
- [`reserveFor`](#s-reserveFor) · function — **no importer in scanned roots**
- [`spendCap`](#s-spendCap) · function — used by [js/aria/play.js](play.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), test/ariamind.test.mjs
- [`ariaMind`](#s-ariaMind) · const — used by [js/aria/aria.js](aria.js.md), [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md), [js/aria/senses.js](senses.js.md), [js/aria/wake.js](wake.js.md), [js/console/panels/aria-core.js](../console/panels/aria-core.js.md), [js/flight/recorder.js](../flight/recorder.js.md), test/aria-mining-loop.test.mjs, test/ariamind-integration.test.mjs, test/ariamind.test.mjs
- [`bindPeopleLookup`](#s-bindPeopleLookup) · function — used by [js/aria/aria.js](aria.js.md), test/ariamind.test.mjs
- [`bindPacketExtras`](#s-bindPacketExtras) · function — used by [js/aria/aria.js](aria.js.md)
- [`resetMind`](#s-resetMind) · function — used by [js/aria/aria.js](aria.js.md), test/ariamind-integration.test.mjs, test/ariamind.test.mjs
- [`mindKey`](#s-mindKey) · function — used by [js/aria/aria.js](aria.js.md)
- [`saveMind`](#s-saveMind) · function — used by [js/aria/aria.js](aria.js.md), [js/flight/recorder.js](../flight/recorder.js.md), test/ariamind.test.mjs
- [`loadMind`](#s-loadMind) · function — used by [js/aria/aria.js](aria.js.md), test/ariamind.test.mjs
- [`setOrders`](#s-setOrders) · function — used by [js/console/panels/aria-core.js](../console/panels/aria-core.js.md), test/ariamind.test.mjs
- [`remember`](#s-remember) · function — used by [js/aria/company.js](company.js.md), [js/aria/senses.js](senses.js.md), test/ariamind.test.mjs
- [`personMemory`](#s-personMemory) · function — used by [js/console/panels/aria-core.js](../console/panels/aria-core.js.md), test/ariamind.test.mjs
- [`VERBS`](#s-VERBS) · const — **no importer in scanned roots**
- [`verbOf`](#s-verbOf) · function — used by [js/aria/wake.js](wake.js.md)
- [`CONTEXT_CAP`](#s-CONTEXT_CAP) · const — **no importer in scanned roots**
- [`migrateContexts`](#s-migrateContexts) · function — **no importer in scanned roots**
- [`FADE`](#s-FADE) · const — **no importer in scanned roots**
- [`learnTape`](#s-learnTape) · function — used by [js/flight/recorder.js](../flight/recorder.js.md), test/ariamind.test.mjs
- [`contextualScore`](#s-contextualScore) · function — used by [js/aria/pilot.js](pilot.js.md)
- [`riskAversion`](#s-riskAversion) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md)
- [`authorize`](#s-authorize) · function — used by [js/aria/company.js](company.js.md), [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), test/ariamind.test.mjs
- [`calibrated`](#s-calibrated) · function — **no importer in scanned roots**
- [`forecast`](#s-forecast) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md)
- [`settleForecast`](#s-settleForecast) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md)
- [`calibReport`](#s-calibReport) · function — used by [js/aria/aria.js](aria.js.md), [js/aria/play.js](play.js.md), [js/console/panels/aria-core.js](../console/panels/aria-core.js.md)
- [`decideMind`](#s-decideMind) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md), test/ariamind.test.mjs
- [`explanationPacket`](#s-explanationPacket) · function — used by [js/aria/aria.js](aria.js.md), [js/console/panels/aria-core.js](../console/panels/aria-core.js.md), test/ariamind.test.mjs
- [`policyScore`](#s-policyScore) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md)
- [`learnOutcome`](#s-learnOutcome) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md)
- [`discount`](#s-discount) · function — used by [js/aria/senses.js](senses.js.md)

## Effects

- **storage.get** — `‹key›` (loadMind:26)
- **storage.set** — `‹key›` (saveMind:22)

## Symbols

### <a id="s-clamp"></a>`clamp(n, lo=, hi=)`

function · L1–1

- called by: [`breakLine`](#s-breakLine) ×2 · [`calibrated`](#s-calibrated) ×4 · [`cellOf`](#s-cellOf) ×2 · [`decideMind`](#s-decideMind) ×4 · [`forecast`](#s-forecast) · [`learnTape`](#s-learnTape) · [`pointOf`](#s-pointOf) ×3 · [`policyScore`](#s-policyScore) · [`remember`](#s-remember) · [`riskAversion`](#s-riskAversion) · [`setOrders`](#s-setOrders) ×3

<!-- note:clamp -->
<!-- /note -->

### <a id="s-freshCalib"></a>`freshCalib()`

function · L2–2

- called by: [`fresh`](#s-fresh) · [`loadMind`](#s-loadMind)

<!-- note:freshCalib -->
<!-- /note -->

### <a id="s-fresh"></a>`fresh()`

function · L3–3

- calls: [`freshCalib`](#s-freshCalib)
- called by: [`ariaMind`](#s-ariaMind) · [`resetMind`](#s-resetMind)

<!-- note:fresh -->
0.3.88: every authority starts GRANTED. The Core patch shipped hiring,
founding, treasury, settlement, dismissal, combat and build withheld, which
silently removed things ARIA had always done. The Core panel is where a
captain takes one away.
<!-- /note -->

### <a id="s-WORKING_FLOOR"></a>`WORKING_FLOOR`

const · **exported** · L4–4

<!-- note:WORKING_FLOOR -->
What stays in the purse through day-to-day spending (cargo, hiring bonuses,
works fees). It is the 800 cr aria-play has always kept.
<!-- /note -->

### <a id="s-INVESTMENT"></a>`INVESTMENT`

const · L5–5

<!-- note:INVESTMENT -->
The captain's reserve guards INVESTMENTS only. Repairs and treasury
transfers are never held back by a credit rule: one is survival, the other
moves money between the captain's own two accounts.
<!-- /note -->

### <a id="s-UNCAPPED"></a>`UNCAPPED`

const · L6–6

<!-- note:UNCAPPED -->
<!-- /note -->

### <a id="s-DOMAIN"></a>`DOMAIN`

const · L7–7

<!-- note:DOMAIN -->
<!-- /note -->

### <a id="s-BREAK"></a>`BREAK`

const · **exported** · L8–8

<!-- note:BREAK -->
0.3.90 — where "it is going badly" starts. The captain's repair line is the
hull she breaks off at with contacts close. With the battery under a quarter
the mains are about to go cold and the run home is a coast, so the line is
lifted: at the default 55% a flat-battery hull was reaching the yard on 18%,
and the salvage hull on 2%.
<!-- /note -->

### <a id="s-breakLine"></a>`breakLine(charge=, threat=)`

function · **exported** · L9–11

- calls: [`clamp`](#s-clamp) ×2
- called by: [`shouldBreakOff`](pilot.js.md#s-shouldBreakOff) _js/aria/pilot.js_ · [`shouldBreakOff`](play.js.md#s-shouldBreakOff) _js/aria/play.js_

<!-- note:breakLine -->
<!-- /note -->

### <a id="s-domainOf"></a>`domainOf(action)`

function · **exported** · L12–12

- called by: [`authorize`](#s-authorize) · [`spendCap`](#s-spendCap)

<!-- note:domainOf -->
<!-- /note -->

### <a id="s-reserveFor"></a>`reserveFor(domain)`

function · **exported** · L13–13

- called by: [`authorize`](#s-authorize) · [`spendCap`](#s-spendCap)

<!-- note:reserveFor -->
<!-- /note -->

### <a id="s-spendCap"></a>`spendCap(credits, action=)`

function · **exported** · L14–14

- calls: [`domainOf`](#s-domainOf) · [`reserveFor`](#s-reserveFor)
- called by: [`purse`](play.js.md#s-purse) _js/aria/play.js_ · [`makeTradeOps.BUY`](../mission/tradeops.js.md#s-makeTradeOps-BUY) _js/mission/tradeops.js_

<!-- note:spendCap -->
The most ARIA may spend on one purchase in this domain with this purse —
planners budget with it so a plan is never refused at the till.
<!-- /note -->

### <a id="s-ariaMind"></a>`ariaMind`

const · **exported** · L15–15

- calls: [`fresh`](#s-fresh)

<!-- note:ariaMind -->
<!-- /note -->

### <a id="s-resolver"></a>`resolver()`

function · L16–16

- called by: [`personMemory`](#s-personMemory)

<!-- note:resolver -->
<!-- /note -->

### <a id="s-extras"></a>`extras()`

function · L17–17

- called by: [`explanationPacket`](#s-explanationPacket)

<!-- note:extras -->
<!-- /note -->

### <a id="s-bindPeopleLookup"></a>`bindPeopleLookup(fn)`

function · **exported** · L18–18

- called by: [`wireAria`](aria.js.md#s-wireAria) _js/aria/aria.js_

<!-- note:bindPeopleLookup -->
<!-- /note -->

### <a id="s-bindPacketExtras"></a>`bindPacketExtras(fn)`

function · **exported** · L19–19

- called by: [`wireAria`](aria.js.md#s-wireAria) _js/aria/aria.js_

<!-- note:bindPacketExtras -->
<!-- /note -->

### <a id="s-resetMind"></a>`resetMind(identity=)`

function · **exported** · L20–20

- calls: [`fresh`](#s-fresh)
- called by: [`resetAria`](aria.js.md#s-resetAria) _js/aria/aria.js_ · [`loadMind`](#s-loadMind)

<!-- note:resetMind -->
<!-- /note -->

### <a id="s-mindKey"></a>`mindKey(sky, captain)`

function · **exported** · L21–21

- called by: [`loadAria`](aria.js.md#s-loadAria) _js/aria/aria.js_ · [`resetAria`](aria.js.md#s-resetAria) _js/aria/aria.js_ · [`saveAria`](aria.js.md#s-saveAria) _js/aria/aria.js_

<!-- note:mindKey -->
<!-- /note -->

### <a id="s-saveMind"></a>`saveMind(key)`

function · **exported** · L22–22

- called by: [`saveAria`](aria.js.md#s-saveAria) _js/aria/aria.js_ · [`learnTape`](#s-learnTape) · [`saveTape`](../flight/recorder.js.md#s-saveTape) _js/flight/recorder.js_
- effects: storage.set `‹key›`

<!-- note:saveMind -->
<!-- /note -->

### <a id="s-loadMind"></a>`loadMind(key)`

function · **exported** · L23–38

- calls: [`freshCalib`](#s-freshCalib) · [`migrateContexts`](#s-migrateContexts) · [`resetMind`](#s-resetMind) · [`setOrders`](#s-setOrders)
- called by: [`loadAria`](aria.js.md#s-loadAria) _js/aria/aria.js_
- effects: storage.get `‹key›`

<!-- note:loadMind -->
- L30 · `if (raw.v === 2) for (const k of Object.keys(ariaMind.authority)) if (typeof raw.authority` — A v1 mind never recorded a captain's choice separately from the withheld
  defaults it shipped with, so its authority block is dropped once.
<!-- /note -->

### <a id="s-setOrders"></a>`setOrders(patch)`

function · **exported** · L39–46

- calls: [`clamp`](#s-clamp) ×3
- called by: [`loadMind`](#s-loadMind) · [`mountCore`](../console/panels/aria-core.js.md#s-mountCore) _js/console/panels/aria-core.js_ ×4

<!-- note:setOrders -->
<!-- /note -->

### <a id="s-remember"></a>`remember({…})`

function · **exported** · L47–50

- calls: [`clamp`](#s-clamp)
- called by: [`considerHire`](company.js.md#s-considerHire) _js/aria/company.js_ · [`considerLayoff`](company.js.md#s-considerLayoff) _js/aria/company.js_ · [`considerSettle`](company.js.md#s-considerSettle) _js/aria/company.js_ · [`learnOutcome`](#s-learnOutcome) · [`learnTape`](#s-learnTape) · [`react`](senses.js.md#s-react) _js/aria/senses.js_

<!-- note:remember -->
<!-- /note -->

### <a id="s-personMemory"></a>`personMemory(id)`

function · **exported** · L51–51

- calls: [`resolver`](#s-resolver)
- called by: [`mountCore`](../console/panels/aria-core.js.md#s-mountCore) _js/console/panels/aria-core.js_

<!-- note:personMemory -->
<!-- /note -->

### <a id="s-VERBS"></a>`VERBS`

const · **exported** · L53–53

<!-- note:VERBS -->
<!-- /note -->

### <a id="s-OP_VERB"></a>`OP_VERB`

const · L54–54

<!-- note:OP_VERB -->
<!-- /note -->

### <a id="s-OP_SKIP"></a>`OP_SKIP`

const · L55–55

<!-- note:OP_SKIP -->
<!-- /note -->

### <a id="s-ORDER_VERB"></a>`ORDER_VERB`

const · L56–56

<!-- note:ORDER_VERB -->
<!-- /note -->

### <a id="s-KEY_VERB"></a>`KEY_VERB`

const · L57–57

<!-- note:KEY_VERB -->
<!-- /note -->

### <a id="s-CAT_VERB"></a>`CAT_VERB`

const · L58–58

<!-- note:CAT_VERB -->
<!-- /note -->

### <a id="s-TAP_VERB"></a>`TAP_VERB`

const · L59–59

<!-- note:TAP_VERB -->
<!-- /note -->

### <a id="s-verbOf"></a>`verbOf(action, kind=, arg=)`

function · **exported** · L60–70

- called by: [`contextualScore`](#s-contextualScore) ×2 · [`learnTape`](#s-learnTape) · [`migrateContexts`](#s-migrateContexts) · [`wakeJobClose`](wake.js.md#s-wakeJobClose) _js/aria/wake.js_

<!-- note:verbOf -->
<!-- /note -->

### <a id="s-CONTEXT_CAP"></a>`CONTEXT_CAP`

const · **exported** · L72–72

<!-- note:CONTEXT_CAP -->
<!-- /note -->

### <a id="s-migrateContexts"></a>`migrateContexts(list)`

function · **exported** · L73–87

- calls: [`verbOf`](#s-verbOf)
- called by: [`loadMind`](#s-loadMind)

<!-- note:migrateContexts -->
<!-- /note -->

### <a id="s-FADE"></a>`FADE`

const · **exported** · L88–88

<!-- note:FADE -->
<!-- /note -->

### <a id="s-KERNEL"></a>`KERNEL`

const · L89–89

<!-- note:KERNEL -->
<!-- /note -->

### <a id="s-fade"></a>`fade(dt, half)`

function · L90–90

- called by: [`learnOutcome`](#s-learnOutcome) · [`learnTape`](#s-learnTape)

<!-- note:fade -->
<!-- /note -->

### <a id="s-cellOf"></a>`cellOf(s)`

function · L91–91

- calls: [`clamp`](#s-clamp) ×2
- called by: [`learnTape`](#s-learnTape)

<!-- note:cellOf -->
<!-- /note -->

### <a id="s-pointOf"></a>`pointOf(s)`

function · L92–92

- calls: [`clamp`](#s-clamp) ×3
- called by: [`contextualScore`](#s-contextualScore) · [`learnTape`](#s-learnTape)

<!-- note:pointOf -->
<!-- /note -->

### <a id="s-centreOf"></a>`centreOf(c)`

function · L93–97

- called by: [`contextualScore`](#s-contextualScore) · [`learnTape`](#s-learnTape)

<!-- note:centreOf -->
<!-- /note -->

### <a id="s-nearness"></a>`nearness(a, b)`

function · L98–102

- called by: [`contextualScore`](#s-contextualScore)

<!-- note:nearness -->
<!-- /note -->

### <a id="s-learnTape"></a>`learnTape(r)`

function · **exported** · L103–141

- calls: [`cellOf`](#s-cellOf) · [`centreOf`](#s-centreOf) · [`clamp`](#s-clamp) · [`fade`](#s-fade) · [`pointOf`](#s-pointOf) · [`remember`](#s-remember) · [`saveMind`](#s-saveMind) · [`verbOf`](#s-verbOf)
- called by: [`settle`](../flight/recorder.js.md#s-settle) _js/flight/recorder.js_

<!-- note:learnTape -->
- L? · `` const key = `${r.by}:${r.kind}:${r.act}`; `` — Thirty-second deltas are associated observations, not causal action rewards.
<!-- /note -->

### <a id="s-contextualScore"></a>`contextualScore(action, state)`

function · **exported** · L142–155

- calls: [`centreOf`](#s-centreOf) · [`nearness`](#s-nearness) · [`pointOf`](#s-pointOf) · [`verbOf`](#s-verbOf) ×2
- called by: [`decideMind`](#s-decideMind) · [`policyScore`](#s-policyScore) · [`planJob`](pilot.js.md#s-planJob) _js/aria/pilot.js_

<!-- note:contextualScore -->
<!-- /note -->

### <a id="s-riskAversion"></a>`riskAversion()`

function · **exported** · L156–158

- calls: [`clamp`](#s-clamp)
- called by: [`bestRepairPort`](pilot.js.md#s-bestRepairPort) _js/aria/pilot.js_ · [`jobsFor`](play.js.md#s-jobsFor) _js/aria/play.js_

<!-- note:riskAversion -->
<!-- /note -->

### <a id="s-authorize"></a>`authorize(action, {…}=)`

function · **exported** · L159–168

- calls: [`domainOf`](#s-domainOf) · [`reserveFor`](#s-reserveFor)
- called by: [`considerFound`](company.js.md#s-considerFound) _js/aria/company.js_ · [`considerHire`](company.js.md#s-considerHire) _js/aria/company.js_ · [`considerLayoff`](company.js.md#s-considerLayoff) _js/aria/company.js_ · [`considerSettle`](company.js.md#s-considerSettle) _js/aria/company.js_ · [`considerTreasury`](company.js.md#s-considerTreasury) _js/aria/company.js_ · [`planJob`](pilot.js.md#s-planJob) _js/aria/pilot.js_ · [`registerAriaOps`](pilot.js.md#s-registerAriaOps) _js/aria/pilot.js_ · [`registerBuildOp`](pilot.js.md#s-registerBuildOp) _js/aria/pilot.js_ · [`registerFabOp`](pilot.js.md#s-registerFabOp) _js/aria/pilot.js_ · [`registerRefitOp`](pilot.js.md#s-registerRefitOp) _js/aria/pilot.js_ · [`tickAriaPilot`](pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`decide`](play.js.md#s-decide) _js/aria/play.js_ · [`resumeHeld`](play.js.md#s-resumeHeld) _js/aria/play.js_ · [`startJob`](play.js.md#s-startJob) _js/aria/play.js_ · [`stepPlay`](play.js.md#s-stepPlay) _js/aria/play.js_ ×2 · [`tickMission`](../mission/run.js.md#s-tickMission) _js/mission/run.js_ · [`makeTradeOps.BUY`](../mission/tradeops.js.md#s-makeTradeOps-BUY) _js/mission/tradeops.js_

<!-- note:authorize -->
<!-- /note -->

### <a id="s-BIN_EDGES"></a>`BIN_EDGES`

const · L170–170

<!-- note:BIN_EDGES -->
<!-- /note -->

### <a id="s-binOf"></a>`binOf(p)`

function · L171–171

- called by: [`calibrated`](#s-calibrated) · [`settleForecast`](#s-settleForecast)

<!-- note:binOf -->
<!-- /note -->

### <a id="s-calibrated"></a>`calibrated(p)`

function · **exported** · L172–175

- calls: [`binOf`](#s-binOf) · [`clamp`](#s-clamp) ×4
- called by: [`decideMind`](#s-decideMind)

<!-- note:calibrated -->
<!-- /note -->

### <a id="s-forecast"></a>`forecast({…}=)`

function · **exported** · L176–179

- calls: [`clamp`](#s-clamp)
- called by: [`tickAriaPilot`](pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`begun`](play.js.md#s-begun) _js/aria/play.js_

<!-- note:forecast -->
<!-- /note -->

### <a id="s-settleForecast"></a>`settleForecast(key, secs, cr, ok)`

function · **exported** · L180–195

- calls: [`binOf`](#s-binOf)
- called by: [`tickAriaPilot`](pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`finishMove`](play.js.md#s-finishMove) _js/aria/play.js_

<!-- note:settleForecast -->
<!-- /note -->

### <a id="s-calibReport"></a>`calibReport()`

function · **exported** · L196–200

- called by: [`ariaWatchReport`](aria.js.md#s-ariaWatchReport) _js/aria/aria.js_ · [`explanationPacket`](#s-explanationPacket) · [`playReport`](play.js.md#s-playReport) _js/aria/play.js_ · [`mountCore>draw`](../console/panels/aria-core.js.md#s-mountCore-draw) _js/console/panels/aria-core.js_

<!-- note:calibReport -->
<!-- /note -->

### <a id="s-decideMind"></a>`decideMind({…})`

function · **exported** · L202–210

- calls: [`calibrated`](#s-calibrated) · [`clamp`](#s-clamp) ×4 · [`contextualScore`](#s-contextualScore)
- called by: [`planJob`](pilot.js.md#s-planJob) _js/aria/pilot.js_ · [`decide`](play.js.md#s-decide) _js/aria/play.js_

<!-- note:decideMind -->
<!-- /note -->

### <a id="s-explanationPacket"></a>`explanationPacket()`

function · **exported** · L211–215

- calls: [`calibReport`](#s-calibReport) · [`extras`](#s-extras)
- called by: [`mountCore`](../console/panels/aria-core.js.md#s-mountCore) _js/console/panels/aria-core.js_

<!-- note:explanationPacket -->
This packet deliberately contains no executor, callbacks, tools or ship references.
<!-- /note -->

### <a id="s-policyScore"></a>`policyScore(action, base, state=, {…}=)`

function · **exported** · L217–232

- calls: [`clamp`](#s-clamp) · [`contextualScore`](#s-contextualScore)
- called by: [`rawPlanJob>weight`](pilot.js.md#s-rawPlanJob-weight) _js/aria/pilot.js_ · [`weightOf`](play.js.md#s-weightOf) _js/aria/play.js_

<!-- note:policyScore -->
<!-- /note -->

### <a id="s-learnOutcome"></a>`learnOutcome(action, secs, cr, ok, at=)`

function · **exported** · L234–244

- calls: [`fade`](#s-fade) · [`remember`](#s-remember)
- called by: [`tickAriaPilot`](pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`brainNote`](play.js.md#s-brainNote) _js/aria/play.js_

<!-- note:learnOutcome -->
<!-- /note -->

### <a id="s-discount"></a>`discount(match, keep=, why=, at=)`

function · **exported** · L245–255

- called by: [`react`](senses.js.md#s-react) _js/aria/senses.js_ ×2

<!-- note:discount -->
<!-- /note -->
