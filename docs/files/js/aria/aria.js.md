# js/aria/aria.js

[index](../../../README.md) · 212 lines · 24 symbols · 11 imports · 10 importers

## About

<!-- note:@file -->
LIVING GALAXY — ARIA: the conn that learned from you.

There has been a net in this game earlier — js/npc/brain.js — and a "house
core" that quietly watches how you fly whenever nobody else holds the conn
(captain.js, one imitation label every five seconds). It was only ever used
to seed NPC captains. It never flew your ship and it never touched your
autopilot, so the thing it learned went nowhere you could see.

Three things here, all fed by the same idea — what you DO is the training
data, not what you say:

  1. PREFERENCES. Every time you choose one port to sell at over the two
     that were closer, or cut a chromite rock and leave the silicate next to
     it, that is a labelled example. The autopilot's own scoring asks here
     before it picks, so it converges on your habits rather than on a
     formula. Counts, not a net: a tally is honest about how much it has
     seen, which a net is not, and "you have done this nine times" is
     something the panel can say out loud.

  2. ADVISORIES. The assistant learns which kinds of advice you act on and
     which you swipe away, and stops surfacing the ones you ignore. Ignoring
     a kind four times running buries it; acting on it once digs it back up.

  3. THE CONN. ARIA can take the ship the way a crew captain can, except
     the core it flies with is the one that has been watching you — so it
     flies the way you fly. It then trains on its OWN outcomes through the
     same learnOutcome path the NPC captains use, which means a long ARIA
     watch makes it better at being you than you were when it started.

- L62 · `const MUTE_AT = 4;` — ignored this many times running and it stops asking
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../flight/recorder.js` | `flushPending` | [js/flight/recorder.js](../flight/recorder.js.md) |
| 2 | `./mind.js` | `ariaMind`, `resetMind`, `saveMind`, `loadMind`, `mindKey`, `bindPeopleLookup`, `explanationPacket`, `bindPacketExtras`, `calibReport` | [js/aria/mind.js](mind.js.md) |
| 3 | `./wake.js` | `wakeSave`, `wakeLoad`, `wakeReset` | [js/aria/wake.js](wake.js.md) |
| 4 | `./footprint.js` | `footprintReport`, `footprintLine` | [js/aria/footprint.js](footprint.js.md) |
| 5 | `./belief.js` | `beliefReport` | [js/aria/belief.js](belief.js.md) |
| 6 | `./senses.js` | `perceive` | [js/aria/senses.js](senses.js.md) |
| 7 | `../corp/gdb.js` | `entryOf` | [js/corp/gdb.js](../corp/gdb.js.md) |
| 8 | `../sim/sim.js` | `sim`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 9 | `../npc/captain.js` | `captain`, `houseBrain`, `retakeCommand`, `ariaHooks` | [js/npc/captain.js](../npc/captain.js.md) |
| 10 | `../comms/chat.js` | `post` | [js/comms/chat.js](../comms/chat.js.md) |
| 11 | `./pilot.js` | `beginAriaWatch`, `endAriaWatch`, `tickAriaPilot`, `wireAriaPilot`, `bindAriaPrefs`, `notePlayLabel`, `notePlayerJob`, `ariaPilot`, `jobHabits`, `planJob` | [js/aria/pilot.js](pilot.js.md) |

## Imported by

- [js/console/panels/aria-core.js](../console/panels/aria-core.js.md) — `saveAria`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `ariaTakeConn`, `ariaRelease`, `ariaHasConn`, `ariaWatchReport`, `preferenceReport`, `adviceReport`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `preferenceFor`
- [js/flight/turrets.js](../flight/turrets.js.md) — `notePlayerChoice`, `handsOff`
- [js/render/engine.js](../render/engine.js.md) — `loadAria`, `wireAria`
- [js/sim/sim.js](../sim/sim.js.md) — `notePlayerChoice`
- [js/ui/hud.js](../ui/hud.js.md) — `ariaHasConn`, `ariaTakeConn`, `ariaRelease`
- test/ariamind-integration.test.mjs _(outside js/)_ — `wireAria`, `aria`, `saveAria`
- test/systems.test.mjs _(outside js/)_ — `A`
- test/trade.test.mjs _(outside js/)_ — `notePlayerChoice`

## Exports

- [`aria`](#s-aria) · const — used by test/ariamind-integration.test.mjs
- [`resetAria`](#s-resetAria) · function — **no importer in scanned roots**
- [`handsOff`](#s-handsOff) · function — used by [js/flight/turrets.js](../flight/turrets.js.md)
- [`notePlayerChoice`](#s-notePlayerChoice) · function — used by [js/flight/turrets.js](../flight/turrets.js.md), [js/sim/sim.js](../sim/sim.js.md), test/trade.test.mjs
- [`preferenceFor`](#s-preferenceFor) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md)
- [`preferenceReport`](#s-preferenceReport) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`shouldAdvise`](#s-shouldAdvise) · function — **no importer in scanned roots**
- [`noteAdvice`](#s-noteAdvice) · function — **no importer in scanned roots**
- [`answerAdvice`](#s-answerAdvice) · function — **no importer in scanned roots**
- [`adviceReport`](#s-adviceReport) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`ariaHasConn`](#s-ariaHasConn) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`ariaTakeConn`](#s-ariaTakeConn) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`ariaRelease`](#s-ariaRelease) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`ariaNoteDecision`](#s-ariaNoteDecision) · function — **no importer in scanned roots**
- [`ariaWatchReport`](#s-ariaWatchReport) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`saveAria`](#s-saveAria) · function — used by [js/console/panels/aria-core.js](../console/panels/aria-core.js.md), test/ariamind-integration.test.mjs
- [`loadAria`](#s-loadAria) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`wireAriaHooks`](#s-wireAriaHooks) · function — **no importer in scanned roots**
- [`wireAria`](#s-wireAria) · function — used by [js/render/engine.js](../render/engine.js.md), test/ariamind-integration.test.mjs

## Effects

- **storage.get** — `‹KEY()›` (loadAria:177)
- **storage.set** — `‹KEY()›` (saveAria:167)

## Symbols

### <a id="s-KEY"></a>`KEY()`

function · L13–13

- called by: [`loadAria`](#s-loadAria) · [`saveAria`](#s-saveAria)

<!-- note:KEY -->
<!-- /note -->

### <a id="s-SAVE_EVERY"></a>`SAVE_EVERY`

const · L14–14

<!-- note:SAVE_EVERY -->
<!-- /note -->

### <a id="s-aria"></a>`aria`

const · **exported** · L16–21

<!-- note:aria -->
- L? · `prefs: { port: {}, ore: {}, plan: {}, lane: {}, job: {} },` — kind → key → { n, last } : how often you chose this, and when
- L18 · `advice: {},` — advisory kind → { shown, acted, ignored, muted }
- L19 · `conn: { held: false, since: 0, decisions: 0, earned: 0, hullAt: 100, log: [] },` — ARIA's own watch
<!-- /note -->

### <a id="s-resetAria"></a>`resetAria()`

function · **exported** · L23–30

- calls: [`mindKey`](mind.js.md#s-mindKey) _js/aria/mind.js_ · [`resetMind`](mind.js.md#s-resetMind) _js/aria/mind.js_ · [`bindAriaPrefs`](pilot.js.md#s-bindAriaPrefs) _js/aria/pilot.js_ · [`wakeReset`](wake.js.md#s-wakeReset) _js/aria/wake.js_

<!-- note:resetAria -->
<!-- /note -->

### <a id="s-handsOff"></a>`handsOff()`

function · **exported** · L32–32

- called by: [`stepMining`](../flight/turrets.js.md#s-stepMining) _js/flight/turrets.js_

<!-- note:handsOff -->
Is somebody other than the pilot flying?

turrets.js is a leaf and must not import sim.js, so the flag lives on `sim`
and is read through here — the autopilot sets it every tick, and an NPC or
ARIA holding the conn sets it too. Nothing learns from a choice the player
did not make; a core trained on its own autopilot output converges on its
own habits and calls that your taste.
<!-- /note -->

### <a id="s-notePlayerChoice"></a>`notePlayerChoice(kind, key, weight=)`

function · **exported** · L34–41

- calls: [`saveAria`](#s-saveAria)
- called by: [`stepMining`](../flight/turrets.js.md#s-stepMining) _js/flight/turrets.js_ · [`sellAllOre`](../sim/sim.js.md#s-sellAllOre) _js/sim/sim.js_

<!-- note:notePlayerChoice -->
---- 1. preferences ---------------------------------------------------------

You did a thing. `kind` is the family of choice ("port", "ore", "plan"),
`key` the option you took, `weight` how much of a choice it was — selling a
full hold says more than dropping two units.
<!-- /note -->

### <a id="s-preferenceFor"></a>`preferenceFor(kind, key)`

function · **exported** · L43–52

- called by: [`preferenceReport`](#s-preferenceReport) · [`apMine`](../flight/autopilot.js.md#s-apMine) _js/flight/autopilot.js_ · [`bestPortFor`](../flight/autopilot.js.md#s-bestPortFor) _js/flight/autopilot.js_

<!-- note:preferenceFor -->
How much the autopilot should lean toward `key`, 0.75 … 1.45.

Deliberately gentle. A preference is a thumb on the scale, not a rule: an
autopilot that only ever went where you had been before would never find you
the better price, and the whole point of the thing is that it flies while you
are doing something else.

- L50 · `const confidence = Math.min(1, total / 12);` — it has to have seen enough
<!-- /note -->

### <a id="s-preferenceReport"></a>`preferenceReport(kind)`

function · **exported** · L54–60

- calls: [`preferenceFor`](#s-preferenceFor)
- called by: [`mountAria`](../console/panels/nav.js.md#s-mountAria) _js/console/panels/nav.js_

<!-- note:preferenceReport -->
What it thinks it knows, for the panel.
<!-- /note -->

### <a id="s-MUTE_AT"></a>`MUTE_AT`

const · L62–62

<!-- note:MUTE_AT -->
---- 2. advisories ----------------------------------------------------------
<!-- /note -->

### <a id="s-adv"></a>`adv(kind)`

function · L64–67

- called by: [`answerAdvice`](#s-answerAdvice) · [`noteAdvice`](#s-noteAdvice) · [`shouldAdvise`](#s-shouldAdvise)

<!-- note:adv -->
<!-- /note -->

### <a id="s-shouldAdvise"></a>`shouldAdvise(kind)`

function · **exported** · L69–71

- calls: [`adv`](#s-adv)

<!-- note:shouldAdvise -->
Should the assistant raise this kind of thing at all?
<!-- /note -->

### <a id="s-noteAdvice"></a>`noteAdvice(kind)`

function · **exported** · L73–77

- calls: [`adv`](#s-adv)

<!-- note:noteAdvice -->
It raised one.
<!-- /note -->

### <a id="s-answerAdvice"></a>`answerAdvice(kind, acted)`

function · **exported** · L79–85

- calls: [`adv`](#s-adv) · [`saveAria`](#s-saveAria)

<!-- note:answerAdvice -->
You acted on it, or you did not. Acting on a kind once un-mutes it — people
change what they care about, and a core that learned "never mention the
battery" in an hour of belt work should not keep that forever.
<!-- /note -->

### <a id="s-adviceReport"></a>`adviceReport()`

function · **exported** · L87–91

- called by: [`mountAria`](../console/panels/nav.js.md#s-mountAria) _js/console/panels/nav.js_

<!-- note:adviceReport -->
<!-- /note -->

### <a id="s-ariaMember"></a>`ariaMember()`

function · L93–99

- called by: [`ariaTakeConn`](#s-ariaTakeConn)

<!-- note:ariaMember -->
---- 3. the conn -------------------------------------------------------------

The synthetic who holds the conn.

Not a crew member: ARIA has no berth, no wage and no morale, and giving it
one would put it on the crew ladder where it does not belong. It carries the
shape captain.js expects and nothing else.
<!-- /note -->

### <a id="s-ariaHasConn"></a>`ariaHasConn()`

function · **exported** · L101–101

- called by: [`ariaNoteDecision`](#s-ariaNoteDecision) · [`ariaWatchReport`](#s-ariaWatchReport) · [`wireAriaHooks`](#s-wireAriaHooks) · [`search.status~4`](../console/panels/nav.js.md#s-search-status-4) _js/console/panels/nav.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_ ×2 · [`mountHud>paintAll`](../ui/hud.js.md#s-mountHud-paintAll) _js/ui/hud.js_

<!-- note:ariaHasConn -->
Is ARIA flying?
<!-- /note -->

### <a id="s-ariaTakeConn"></a>`ariaTakeConn()`

function · **exported** · L103–121

- calls: [`ariaMember`](#s-ariaMember) · [`beginAriaWatch`](pilot.js.md#s-beginAriaWatch) _js/aria/pilot.js_ · [`jobHabits`](pilot.js.md#s-jobHabits) _js/aria/pilot.js_ · [`post`](../comms/chat.js.md#s-post) _js/comms/chat.js_ · [`houseBrain`](../npc/captain.js.md#s-houseBrain) _js/npc/captain.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`mountAria`](../console/panels/nav.js.md#s-mountAria) _js/console/panels/nav.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:ariaTakeConn -->
Hand ARIA the ship.

It flies with the HOUSE CORE — the net that has been watching you fly since
the first time you took the stick — rather than with a personality of its
own. That is the whole point: an NPC captain flies like themselves, and ARIA
flies like you.
<!-- /note -->

### <a id="s-ariaRelease"></a>`ariaRelease()`

function · **exported** · L123–132

- calls: [`saveAria`](#s-saveAria) · [`endAriaWatch`](pilot.js.md#s-endAriaWatch) _js/aria/pilot.js_ · [`post`](../comms/chat.js.md#s-post) _js/comms/chat.js_ · [`retakeCommand`](../npc/captain.js.md#s-retakeCommand) _js/npc/captain.js_
- called by: [`wireAriaHooks`](#s-wireAriaHooks) · [`mountAria`](../console/panels/nav.js.md#s-mountAria) _js/console/panels/nav.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:ariaRelease -->
<!-- /note -->

### <a id="s-ariaNoteDecision"></a>`ariaNoteDecision(action, rationale)`

function · **exported** · L134–139

- calls: [`ariaHasConn`](#s-ariaHasConn)
- called by: [`wireAriaHooks`](#s-wireAriaHooks) ×2

<!-- note:ariaNoteDecision -->
Called from tickCaptain while ARIA flies: book what its watch has produced,
so the panel can say whether letting it fly was worth it. The LEARNING is
already happening — captain.js scores every decision against what the hull,
the credits and the hold did next, and writes it into the same core.
<!-- /note -->

### <a id="s-ariaWatchReport"></a>`ariaWatchReport()`

function · **exported** · L141–160

- calls: [`ariaHasConn`](#s-ariaHasConn) · [`footprintLine`](footprint.js.md#s-footprintLine) _js/aria/footprint.js_ · [`calibReport`](mind.js.md#s-calibReport) _js/aria/mind.js_ · [`jobHabits`](pilot.js.md#s-jobHabits) _js/aria/pilot.js_ · [`houseBrain`](../npc/captain.js.md#s-houseBrain) _js/npc/captain.js_
- called by: [`mountAria`](../console/panels/nav.js.md#s-mountAria) _js/console/panels/nav.js_ · [`search.status~4`](../console/panels/nav.js.md#s-search-status-4) _js/console/panels/nav.js_

<!-- note:ariaWatchReport -->
<!-- /note -->

### <a id="s-saveAria"></a>`saveAria()`

function · **exported** · L162–169

- calls: [`KEY`](#s-KEY) · [`mindKey`](mind.js.md#s-mindKey) _js/aria/mind.js_ · [`saveMind`](mind.js.md#s-saveMind) _js/aria/mind.js_ · [`wakeSave`](wake.js.md#s-wakeSave) _js/aria/wake.js_
- called by: [`answerAdvice`](#s-answerAdvice) · [`ariaRelease`](#s-ariaRelease) · [`notePlayerChoice`](#s-notePlayerChoice) · [`wireAriaHooks`](#s-wireAriaHooks) ×2 · [`mountCore`](../console/panels/aria-core.js.md#s-mountCore) _js/console/panels/aria-core.js_ ×5
- effects: storage.set `‹KEY()›`

<!-- note:saveAria -->
---- persistence --------------------------------------------------------------

- L168 · `} catch {` — quota, or no window
<!-- /note -->

### <a id="s-loadAria"></a>`loadAria()`

function · **exported** · L171–184

- calls: [`KEY`](#s-KEY) · [`loadMind`](mind.js.md#s-loadMind) _js/aria/mind.js_ · [`mindKey`](mind.js.md#s-mindKey) _js/aria/mind.js_ · [`bindAriaPrefs`](pilot.js.md#s-bindAriaPrefs) _js/aria/pilot.js_ ×2 · [`wakeLoad`](wake.js.md#s-wakeLoad) _js/aria/wake.js_
- called by: [`wireAriaHooks`](#s-wireAriaHooks) · [`mountGame`](../render/engine.js.md#s-mountGame) _js/render/engine.js_
- effects: storage.get `‹KEY()›`

<!-- note:loadAria -->
<!-- /note -->

### <a id="s-wireAriaHooks"></a>`wireAriaHooks()`

function · **exported** · L186–200

- calls: [`ariaHasConn`](#s-ariaHasConn) · [`ariaNoteDecision`](#s-ariaNoteDecision) ×2 · [`ariaRelease`](#s-ariaRelease) · [`loadAria`](#s-loadAria) · [`saveAria`](#s-saveAria) ×2 · [`notePlayerJob`](pilot.js.md#s-notePlayerJob) _js/aria/pilot.js_ · [`notePlayLabel`](pilot.js.md#s-notePlayLabel) _js/aria/pilot.js_ · [`tickAriaPilot`](pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`wireAriaPilot`](pilot.js.md#s-wireAriaPilot) _js/aria/pilot.js_ · [`post`](../comms/chat.js.md#s-post) _js/comms/chat.js_ · [`flushPending`](../flight/recorder.js.md#s-flushPending) _js/flight/recorder.js_
- called by: [`wireAria`](#s-wireAria)

<!-- note:wireAriaHooks -->
This used to be a bare top-level assignment:

    ariaHooks.onDecision = (action, rationale) => ariaNoteDecision(…);

`ariaHooks` is an `export const` of js/npc/captain.js, and aria.js and
captain.js are in an import cycle (aria → captain → turrets → aria). A
top-level READ of a binding from a module that is still initialising is a
TDZ error, and whether it happens depends entirely on which side of the
cycle the loader enters first — today that is turrets.js, so aria.js is
already in progress when captain.js starts and the assignment is fine.

It is fine BY ACCIDENT. Give any module that evaluates earlier than
turrets.js an import of npc/captain.js and the order flips: captain.js goes
first, aria.js runs to completion inside it, and the line throws
`ReferenceError: Cannot access 'ariaHooks' before initialization` at page
load — a white screen, with no game and nothing in the log that points here.

So the wiring moves into a function, which is the pattern js/economy/upgrades.js,
js/crew/family.js, js/npc/battles.js and js/corp/fleet.js all already use. main.js
calls it after the graph has finished loading, when nothing is in TDZ.
<!-- /note -->

### <a id="s-wireAria"></a>`wireAria()`

function · **exported** · L202–212

- calls: [`wireAriaHooks`](#s-wireAriaHooks) · [`footprintLine`](footprint.js.md#s-footprintLine) _js/aria/footprint.js_ · [`footprintReport`](footprint.js.md#s-footprintReport) _js/aria/footprint.js_ · [`bindPacketExtras`](mind.js.md#s-bindPacketExtras) _js/aria/mind.js_ · [`bindPeopleLookup`](mind.js.md#s-bindPeopleLookup) _js/aria/mind.js_
- called by: [`mountGame`](../render/engine.js.md#s-mountGame) _js/render/engine.js_

<!-- note:wireAria -->
<!-- /note -->
