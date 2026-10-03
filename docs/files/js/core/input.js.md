# js/core/input.js

[index](../../../README.md) · 221 lines · 24 symbols · 0 imports · 12 importers

## About

<!-- note:@file -->
LIVING GALAXY — input. Pan is aim, the slider is thrust, everything else is RCS.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/flight/autopilot.js](../flight/autopilot.js.md) — `setInjectedPan`, `touch`
- [js/interior/interior.js](../interior/interior.js.md) — `setInjectedKeys`, `setInjectedPan`
- [js/npc/captain.js](../npc/captain.js.md) — `setInjectedPan`, `touch`
- [js/render/engine.js](../render/engine.js.md) — `addLook`, `bindInput`
- [js/sim/sim.js](../sim/sim.js.md) — `consumeLook`, `justPressed`, `sampleInput`, `setInjectedKeys`, `setInjectedPan`, `touch`
- [js/ui/hud.js](../ui/hud.js.md) — `touch`
- test/autopilot.test.mjs _(outside js/)_ — `touch`
- test/avoid.test.mjs _(outside js/)_ — `touch`
- test/chart.test.mjs _(outside js/)_ — `setInjectedKeys`, `sampleInput`, `touch`
- test/mission.test.mjs _(outside js/)_ — `touch`
- test/nose.test.mjs _(outside js/)_ — `touch`
- test/trade.test.mjs _(outside js/)_ — `touch`

## Exports

- [`touch`](#s-touch) · const — used by [js/flight/autopilot.js](../flight/autopilot.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md), test/autopilot.test.mjs, test/avoid.test.mjs, test/chart.test.mjs, test/mission.test.mjs, test/nose.test.mjs, test/trade.test.mjs
- [`lookDelta`](#s-lookDelta) · const — **no importer in scanned roots**
- [`addLook`](#s-addLook) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`consumeLook`](#s-consumeLook) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`bindInput`](#s-bindInput) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`sampleInput`](#s-sampleInput) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/chart.test.mjs
- [`justPressed`](#s-justPressed) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`setInjectedKeys`](#s-setInjectedKeys) · function — used by [js/interior/interior.js](../interior/interior.js.md), [js/sim/sim.js](../sim/sim.js.md), test/chart.test.mjs
- [`setInjectedPan`](#s-setInjectedPan) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md), [js/interior/interior.js](../interior/interior.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`setInjectedSteer`](#s-setInjectedSteer) · function — **no importer in scanned roots**

## Effects

- **event.listen** — `keydown on window → onDown` (bindInput:111) · `keyup on window → onUp` (bindInput:112) · `blur on window → clear` (bindInput:113) · `visibilitychange on document → (inline)` (bindInput:114)
- **event.unlisten** — `keydown on window → onDown` (bindInput:118) · `keyup on window → onUp` (bindInput:119) · `blur on window → clear` (bindInput:120)
- **input.key** — `KeyW` (GAME_CODES:2, sampleInput:138) · `KeyA` (GAME_CODES:2, sampleInput:136) · `KeyS` (GAME_CODES:2, sampleInput:139) · `KeyD` (GAME_CODES:2, sampleInput:137) · `KeyQ` (GAME_CODES:2, sampleInput:142) · `KeyE` (GAME_CODES:2, sampleInput:143) · `KeyR` (GAME_CODES:2, sampleInput:144) · `KeyF` (GAME_CODES:2, sampleInput:145) · `KeyG` (GAME_CODES:2, sampleInput:186) · `KeyM` (GAME_CODES:3, sampleInput:187) · `KeyC` (GAME_CODES:3, sampleInput:189) · `KeyV` (GAME_CODES:3, sampleInput:185) · `KeyX` (GAME_CODES:3, sampleInput:180) · `KeyZ` (GAME_CODES:3, sampleInput:184) · `KeyT` (GAME_CODES:3, sampleInput:198) · `KeyY` (GAME_CODES:3, sampleInput:199) · `KeyU` (GAME_CODES:3, sampleInput:200) · `KeyB` (GAME_CODES:3, sampleInput:201) · `Space` (GAME_CODES:4, sampleInput:183) · `Tab` (GAME_CODES:4, sampleInput:201) · `ShiftLeft` (GAME_CODES:4, sampleInput:146) · `ShiftRight` (GAME_CODES:4, sampleInput:146) · `ControlLeft` (GAME_CODES:4, sampleInput:147) · `ControlRight` (GAME_CODES:4, sampleInput:147) · `ArrowUp` (GAME_CODES:5, sampleInput:140) · `ArrowDown` (GAME_CODES:5, sampleInput:141) · `ArrowLeft` (GAME_CODES:5, sampleInput:136) · `ArrowRight` (GAME_CODES:5, sampleInput:137) · `Escape` (GAME_CODES:5, sampleInput:188) · `BracketLeft` (GAME_CODES:6, sampleInput:191) · `BracketRight` (GAME_CODES:6, sampleInput:190) · `Digit1` (GAME_CODES:7, sampleInput:192) · `Digit2` (GAME_CODES:7, sampleInput:193) · `Digit3` (GAME_CODES:7, sampleInput:194) · `Digit4` (GAME_CODES:7, sampleInput:195) · `Digit5` (GAME_CODES:7, sampleInput:196) · `Digit6` (GAME_CODES:7, sampleInput:197) · `Digit7` (GAME_CODES:7) · `Digit8` (GAME_CODES:7) · `Digit9` (GAME_CODES:7) · `Digit0` (GAME_CODES:7)

## Symbols

### <a id="s-GAME_CODES"></a>`GAME_CODES`

const · L1–8

- effects: input.key `KeyW` · input.key `KeyA` · input.key `KeyS` · input.key `KeyD` · input.key `KeyQ` · input.key `KeyE` · input.key `KeyR` · input.key `KeyF` · input.key `KeyG` · input.key `KeyM` · input.key `KeyC` · input.key `KeyV` · input.key `KeyX` · input.key `KeyZ` · input.key `KeyT` · input.key `KeyY` · input.key `KeyU` · input.key `KeyB` · input.key `Space` · input.key `Tab` · input.key `ShiftLeft` · input.key `ShiftRight` · input.key `ControlLeft` · input.key `ControlRight` · input.key `ArrowUp` · input.key `ArrowDown` · input.key `ArrowLeft` · input.key `ArrowRight` · input.key `Escape` · input.key `BracketLeft` · input.key `BracketRight` · input.key `Digit1` · input.key `Digit2` · input.key `Digit3` · input.key `Digit4` · input.key `Digit5` · input.key `Digit6` · input.key `Digit7` · input.key `Digit8` · input.key `Digit9` · input.key `Digit0`

<!-- note:GAME_CODES -->
<!-- /note -->

### <a id="s-keys"></a>`keys`

const · L10–10

<!-- note:keys -->
<!-- /note -->

### <a id="s-injectedKeys"></a>`injectedKeys`

const · L11–11

<!-- note:injectedKeys -->
<!-- /note -->

### <a id="s-injectedPan"></a>`injectedPan`

const · L12–12

<!-- note:injectedPan -->
<!-- /note -->

### <a id="s-touch"></a>`touch`

const · **exported** · L14–26

<!-- note:touch -->
Touch surface state, written by the cockpit HUD.

- L15 · `panX: 0,` — left stick — camera/nose heading rate
- L17 · `rcsX: 0,` — thruster cluster: right(+) / up(+) / forward(+)
- L20 · `throttle: 0,` — absolute slider value, -0.4 .. 1.4
<!-- /note -->

### <a id="s-lookDelta"></a>`lookDelta`

const · **exported** · L28–28

<!-- note:lookDelta -->
Free-look drag on the canvas, consumed once per frame.
<!-- /note -->

### <a id="s-addLook"></a>`addLook(dx, dy)`

function · **exported** · L30–33

- called by: [`mountGame>onPointerMove`](../render/engine.js.md#s-mountGame-onPointerMove) _js/render/engine.js_

<!-- note:addLook -->
<!-- /note -->

### <a id="s-consumeLook"></a>`consumeLook()`

function · **exported** · L35–41

- called by: [`stepShip`](../sim/sim.js.md#s-stepShip) _js/sim/sim.js_

<!-- note:consumeLook -->
<!-- /note -->

### <a id="s-emptyActions"></a>`emptyActions()`

function · L43–72

- called by: [`curr`](#s-curr) · [`prev`](#s-prev)

<!-- note:emptyActions -->
<!-- /note -->

### <a id="s-prev"></a>`prev`

const · L74–74

- calls: [`emptyActions`](#s-emptyActions)

<!-- note:prev -->
<!-- /note -->

### <a id="s-curr"></a>`curr`

const · L75–75

- calls: [`emptyActions`](#s-emptyActions)

<!-- note:curr -->
<!-- /note -->

### <a id="s-has"></a>`has(code)`

function · L77–80

- called by: [`sampleInput`](#s-sampleInput) ×38

<!-- note:has -->
<!-- /note -->

### <a id="s-radialDeadzone"></a>`radialDeadzone(x, y, dz=)`

function · L82–87

- called by: [`sampleInput`](#s-sampleInput) ×2

<!-- note:radialDeadzone -->
<!-- /note -->

### <a id="s-clamp"></a>`clamp(v, lo, hi)`

function · L89–91

- called by: [`sampleInput`](#s-sampleInput) ×6

<!-- note:clamp -->
<!-- /note -->

### <a id="s-bindInput"></a>`bindInput(_target)`

function · **exported** · L93–122

- calls: [`bindInput>clear`](#s-bindInput-clear)
- called by: [`mountGame`](../render/engine.js.md#s-mountGame) _js/render/engine.js_
- effects: event.listen `keydown` · event.listen `keyup` · event.listen `blur` · event.listen `visibilitychange` · event.unlisten `keydown` · event.unlisten `keyup` · event.unlisten `blur`

<!-- note:bindInput -->
<!-- /note -->

#### <a id="s-bindInput-typing"></a>`bindInput>typing(e)`

function · L94–97

- called by: [`bindInput>onDown`](#s-bindInput-onDown)

<!-- note:bindInput>typing -->
<!-- /note -->

#### <a id="s-bindInput-onDown"></a>`bindInput>onDown(e)`

function · L98–106

- calls: [`bindInput>typing`](#s-bindInput-typing)

<!-- note:bindInput>onDown -->
<!-- /note -->

#### <a id="s-bindInput-onUp"></a>`bindInput>onUp(e)`

function · L107–109

<!-- note:bindInput>onUp -->
a key pressed on the canvas and released in a text field must still let go
<!-- /note -->

#### <a id="s-bindInput-clear"></a>`bindInput>clear()`

function · L110–110

- called by: [`bindInput`](#s-bindInput)

<!-- note:bindInput>clear -->
<!-- /note -->

### <a id="s-sampleInput"></a>`sampleInput()`

function · **exported** · L124–205

- calls: [`clamp`](#s-clamp) ×6 · [`has`](#s-has) ×38 · [`radialDeadzone`](#s-radialDeadzone) ×2
- called by: [`pauseTick`](../sim/sim.js.md#s-pauseTick) _js/sim/sim.js_ · [`tickSim`](../sim/sim.js.md#s-tickSim) _js/sim/sim.js_
- effects: input.key `KeyA` · input.key `ArrowLeft` · input.key `KeyD` · input.key `ArrowRight` · input.key `KeyW` · input.key `KeyS` · input.key `ArrowUp` · input.key `ArrowDown` · input.key `KeyQ` · input.key `KeyE` · input.key `KeyR` · input.key `KeyF` · input.key `ShiftLeft` · input.key `ShiftRight` · input.key `ControlLeft` · input.key `ControlRight` · input.key `KeyX` · input.key `Space` · input.key `KeyZ` · input.key `KeyV` · input.key `KeyG` · input.key `KeyM` · input.key `Escape` · input.key `KeyC` · input.key `BracketRight` · input.key `BracketLeft` · input.key `Digit1` · input.key `Digit2` · input.key `Digit3` · input.key `Digit4` · input.key `Digit5` · input.key `Digit6` · input.key `KeyT` · input.key `KeyY` · input.key `KeyU` · input.key `KeyB` · input.key `Tab`

<!-- note:sampleInput -->
- L136 · `if (has("KeyA") || has("ArrowLeft")) panX -= 1;` — WASD is the camera/nose: W up, S down, A left, D right. Arrows up/down
  step the mains; R/F are the vertical thrusters; Q/E strafe. Shift is the
  boost, Shift+Ctrl sets cruise (sim.js reads those).
<!-- /note -->

### <a id="s-justPressed"></a>`justPressed(action)`

function · **exported** · L207–209

- called by: [`pauseTick`](../sim/sim.js.md#s-pauseTick) _js/sim/sim.js_ · [`stepShip`](../sim/sim.js.md#s-stepShip) _js/sim/sim.js_ · [`tickSim`](../sim/sim.js.md#s-tickSim) _js/sim/sim.js_ ×17

<!-- note:justPressed -->
<!-- /note -->

### <a id="s-setInjectedKeys"></a>`setInjectedKeys(codes)`

function · **exported** · L211–213

- called by: [`closeInterior`](../interior/interior.js.md#s-closeInterior) _js/interior/interior.js_ · [`openInterior`](../interior/interior.js.md#s-openInterior) _js/interior/interior.js_ · [`wireControlsTest.setKeys`](../sim/sim.js.md#s-wireControlsTest-setKeys) _js/sim/sim.js_

<!-- note:setInjectedKeys -->
<!-- /note -->

### <a id="s-setInjectedPan"></a>`setInjectedPan(v)`

function · **exported** · L215–217

- called by: [`apHold`](../flight/autopilot.js.md#s-apHold) _js/flight/autopilot.js_ · [`apSteer`](../flight/autopilot.js.md#s-apSteer) _js/flight/autopilot.js_ · [`releaseControls`](../flight/autopilot.js.md#s-releaseControls) _js/flight/autopilot.js_ · [`closeInterior`](../interior/interior.js.md#s-closeInterior) _js/interior/interior.js_ · [`openInterior`](../interior/interior.js.md#s-openInterior) _js/interior/interior.js_ · [`execute`](../npc/captain.js.md#s-execute) _js/npc/captain.js_ ×2 · [`retakeCommand`](../npc/captain.js.md#s-retakeCommand) _js/npc/captain.js_ · [`steerToward`](../npc/captain.js.md#s-steerToward) _js/npc/captain.js_ · [`wireControlsTest.setPan`](../sim/sim.js.md#s-wireControlsTest-setPan) _js/sim/sim.js_

<!-- note:setInjectedPan -->
<!-- /note -->

### <a id="s-setInjectedSteer"></a>`setInjectedSteer(v)`

function · **exported** · L219–221

<!-- note:setInjectedSteer -->
legacy test hook
<!-- /note -->
