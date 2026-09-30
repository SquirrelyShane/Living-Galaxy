# js/audio/cues.js

[index](../../../README.md) · 251 lines · 48 symbols · 2 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the cue library.

Named sounds, built from the six voices. The point of the rewrite is in
the first three groups: the old kit had one `playWarn()` called from
twenty places, so "you cannot afford that" and "a rock just hit the hull"
were the same loud tone. They are now three separate families —

  deny      you asked for something the game will not do. Soft, low,
            over in a fifth of a second. It should not startle you.
  caution   something needs attention but nothing is broken.
  alarm     something is actually wrong. Ducks everything else.

Everything pitched here lives in the A-minor set in graph.js, so a cue
landing on top of the ambient bed is always in key with it.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./graph.js` | `NOTE`, `degree`, `duck`, `ensureAudio` | [js/audio/graph.js](graph.js.md) |
| 2 | `./voices.js` | `organ`, `chord`, `sub`, `air`, `metal`, `wood`, `swell` | [js/audio/voices.js](voices.js.md) |

## Imported by

- [js/audio/index.js](index.js.md) — `CUES`, `cue`, `UI`, `WARN`, `NAV`, `SHIP`, `CREW`, `VIEW`

## Exports

- [`UI`](#s-UI) · const — used by [js/audio/index.js](index.js.md)
- [`WARN`](#s-WARN) · const — used by [js/audio/index.js](index.js.md)
- [`NAV`](#s-NAV) · const — used by [js/audio/index.js](index.js.md)
- [`SHIP`](#s-SHIP) · const — used by [js/audio/index.js](index.js.md)
- [`CREW`](#s-CREW) · const — used by [js/audio/index.js](index.js.md)
- [`VIEW`](#s-VIEW) · const — used by [js/audio/index.js](index.js.md)
- [`CUES`](#s-CUES) · const — used by [js/audio/index.js](index.js.md)
- [`cue`](#s-cue) · function — used by [js/audio/index.js](index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-t0"></a>`t0()`

function · L4–4

- calls: [`ensureAudio`](graph.js.md#s-ensureAudio) _js/audio/graph.js_
- called by: [`CREW.birth`](#s-CREW-birth) · [`CREW.bond`](#s-CREW-bond) · [`CREW.hail`](#s-CREW-hail) · [`CREW.line`](#s-CREW-line) · [`CREW.rift`](#s-CREW-rift) · [`NAV.arrive`](#s-NAV-arrive) · [`NAV.contact`](#s-NAV-contact) · [`NAV.dropout`](#s-NAV-dropout) · [`NAV.jump`](#s-NAV-jump) · [`NAV.lock`](#s-NAV-lock) · [`NAV.ping`](#s-NAV-ping) · [`NAV.spool`](#s-NAV-spool) · [`NAV.unlock`](#s-NAV-unlock) · [`SHIP.clamp`](#s-SHIP-clamp) · [`SHIP.collect`](#s-SHIP-collect) · [`SHIP.cutStart`](#s-SHIP-cutStart) · [`SHIP.cutStop`](#s-SHIP-cutStop) · [`SHIP.docked`](#s-SHIP-docked) · [`SHIP.impact`](#s-SHIP-impact) · [`SHIP.release`](#s-SHIP-release) · [`SHIP.tractor`](#s-SHIP-tractor) · [`SHIP.trade`](#s-SHIP-trade) · [`UI.close`](#s-UI-close) · [`UI.commit`](#s-UI-commit) · [`UI.panel`](#s-UI-panel) · [`UI.press`](#s-UI-press) · [`UI.tab`](#s-UI-tab) · [`UI.tap`](#s-UI-tap) · [`UI.tick`](#s-UI-tick) · [`UI.toggleOff`](#s-UI-toggleOff) · [`UI.toggleOn`](#s-UI-toggleOn) · [`VIEW.camera`](#s-VIEW-camera) · [`VIEW.interiorIn`](#s-VIEW-interiorIn) · [`VIEW.interiorOut`](#s-VIEW-interiorOut) · [`VIEW.map`](#s-VIEW-map) · [`WARN.alarm`](#s-WARN-alarm) · [`WARN.caution`](#s-WARN-caution) · [`WARN.critical`](#s-WARN-critical) · [`WARN.deny`](#s-WARN-deny)

<!-- note:t0 -->
<!-- /note -->

### <a id="s-UI"></a>`UI`

const · **exported** · L6–50

<!-- note:UI -->
---- UI -----------------------------------------------------------------
These fire on taps, so they are the sounds the player hears ten thousand
times. Short, quiet, dark, and never the same shape as an alert.
<!-- /note -->

#### <a id="s-UI-tap"></a>`UI.tap()`

prop · L7–10

- calls: [`t0`](#s-t0) · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_

<!-- note:UI.tap -->
Any ordinary button. A knock, not a beep.
<!-- /note -->

#### <a id="s-UI-press"></a>`UI.press()`

prop · L11–15

- calls: [`t0`](#s-t0) · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_

<!-- note:UI.press -->
A control that changed something. Slightly fuller than a tap.
<!-- /note -->

#### <a id="s-UI-panel"></a>`UI.panel()`

prop · L16–20

- calls: [`t0`](#s-t0) · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`chord`](voices.js.md#s-chord) _js/audio/voices.js_

<!-- note:UI.panel -->
A panel opening: the console drawing breath.
<!-- /note -->

#### <a id="s-UI-close"></a>`UI.close()`

prop · L21–25

- calls: [`t0`](#s-t0) · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_

<!-- note:UI.close -->
And closing: the same shape, falling.
<!-- /note -->

#### <a id="s-UI-tab"></a>`UI.tab()`

prop · L26–30

- calls: [`t0`](#s-t0) · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_

<!-- note:UI.tab -->
Moving between tabs inside a panel.
<!-- /note -->

#### <a id="s-UI-toggleOn"></a>`UI.toggleOn()`

prop · L31–35

- calls: [`t0`](#s-t0) · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_ ×2

<!-- note:UI.toggleOn -->
<!-- /note -->

#### <a id="s-UI-toggleOff"></a>`UI.toggleOff()`

prop · L36–40

- calls: [`t0`](#s-t0) · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_ ×2

<!-- note:UI.toggleOff -->
<!-- /note -->

#### <a id="s-UI-commit"></a>`UI.commit()`

prop · L41–46

- calls: [`t0`](#s-t0) · [`chord`](voices.js.md#s-chord) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_ · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_

<!-- note:UI.commit -->
A real commitment — hire, buy, launch, accept.
<!-- /note -->

#### <a id="s-UI-tick"></a>`UI.tick()`

prop · L47–49

- calls: [`t0`](#s-t0) · [`degree`](graph.js.md#s-degree) _js/audio/graph.js_ · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_

<!-- note:UI.tick -->
Typing, ticking a list, a value stepping. Barely there by design.
<!-- /note -->

### <a id="s-WARN"></a>`WARN`

const · **exported** · L52–89

<!-- note:WARN -->
---- refusals and warnings ----------------------------------------------
<!-- /note -->

#### <a id="s-WARN-deny"></a>`WARN.deny()`

prop · L53–57

- calls: [`t0`](#s-t0) · [`degree`](graph.js.md#s-degree) _js/audio/graph.js_ · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_

<!-- note:WARN.deny -->
"No." Nothing is wrong, you just asked for something impossible — no
charge, no port in range, nothing under the reticle. This used to be the
same alarm as a hull breach, which is why the game felt like it was
shouting at you.
<!-- /note -->

#### <a id="s-WARN-caution"></a>`WARN.caution()`

prop · L58–64

- calls: [`t0`](#s-t0) · [`duck`](graph.js.md#s-duck) _js/audio/graph.js_ · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ ×2 · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_

<!-- note:WARN.caution -->
Worth looking at. A lane warning, a warp aborted, a contract expiring.
<!-- /note -->

#### <a id="s-WARN-alarm"></a>`WARN.alarm()`

prop · L65–76

- calls: [`t0`](#s-t0) · [`degree`](graph.js.md#s-degree) _js/audio/graph.js_ ×2 · [`duck`](graph.js.md#s-duck) _js/audio/graph.js_ · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`chord`](voices.js.md#s-chord) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_

<!-- note:WARN.alarm -->
Something is wrong now — hostiles, a breach, an inbound rock.
<!-- /note -->

#### <a id="s-WARN-critical"></a>`WARN.critical()`

prop · L77–88

- calls: [`t0`](#s-t0) · [`degree`](graph.js.md#s-degree) _js/audio/graph.js_ ×4 · [`duck`](graph.js.md#s-duck) _js/audio/graph.js_ · [`chord`](voices.js.md#s-chord) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_ · [`swell`](voices.js.md#s-swell) _js/audio/voices.js_

<!-- note:WARN.critical -->
The one that means the ship may not survive the next minute. Held, not
repeated — a klaxon you cannot think through is a klaxon the player
mutes, and then they never hear any of the others either.
<!-- /note -->

### <a id="s-NAV"></a>`NAV`

const · **exported** · L91–136

<!-- note:NAV -->
---- navigation and flight ----------------------------------------------
<!-- /note -->

#### <a id="s-NAV-lock"></a>`NAV.lock()`

prop · L92–96

- calls: [`t0`](#s-t0) · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ ×2

<!-- note:NAV.lock -->
A signature lock takes. Rising fifth — the sound of something closing.
<!-- /note -->

#### <a id="s-NAV-unlock"></a>`NAV.unlock()`

prop · L97–101

- calls: [`t0`](#s-t0) · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ ×2

<!-- note:NAV.unlock -->
<!-- /note -->

#### <a id="s-NAV-ping"></a>`NAV.ping()`

prop · L102–106

- calls: [`t0`](#s-t0) · [`metal`](voices.js.md#s-metal) _js/audio/voices.js_ · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_

<!-- note:NAV.ping -->
A survey ping going out. Long tail — the sky is big.
<!-- /note -->

#### <a id="s-NAV-contact"></a>`NAV.contact()`

prop · L107–111

- calls: [`t0`](#s-t0) · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ ×2

<!-- note:NAV.contact -->
The ping came back with something on it.
<!-- /note -->

#### <a id="s-NAV-spool"></a>`NAV.spool(seconds=)`

prop · L112–117

- calls: [`t0`](#s-t0) · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_ · [`swell`](voices.js.md#s-swell) _js/audio/voices.js_

<!-- note:NAV.spool -->
Charge building before a jump. Call once; it runs itself.
<!-- /note -->

#### <a id="s-NAV-jump"></a>`NAV.jump()`

prop · L118–124

- calls: [`t0`](#s-t0) · [`duck`](graph.js.md#s-duck) _js/audio/graph.js_ · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`chord`](voices.js.md#s-chord) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_

<!-- note:NAV.jump -->
The jump itself.
<!-- /note -->

#### <a id="s-NAV-arrive"></a>`NAV.arrive()`

prop · L125–130

- calls: [`t0`](#s-t0) · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`chord`](voices.js.md#s-chord) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_

<!-- note:NAV.arrive -->
Dropping out the far side.
<!-- /note -->

#### <a id="s-NAV-dropout"></a>`NAV.dropout()`

prop · L131–135

- calls: [`t0`](#s-t0) · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_

<!-- note:NAV.dropout -->
Warp broken off — falling, not alarming.
<!-- /note -->

### <a id="s-SHIP"></a>`SHIP`

const · **exported** · L138–189

<!-- note:SHIP -->
---- the ship and the port ----------------------------------------------
<!-- /note -->

#### <a id="s-SHIP-tractor"></a>`SHIP.tractor()`

prop · L139–143

- calls: [`t0`](#s-t0) · [`degree`](graph.js.md#s-degree) _js/audio/graph.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_ · [`swell`](voices.js.md#s-swell) _js/audio/voices.js_

<!-- note:SHIP.tractor -->
Tractor takes the helm. Something much larger than you has hold of it.
<!-- /note -->

#### <a id="s-SHIP-clamp"></a>`SHIP.clamp()`

prop · L144–149

- calls: [`t0`](#s-t0) · [`metal`](voices.js.md#s-metal) _js/audio/voices.js_ ×2 · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_

<!-- note:SHIP.clamp -->
Clamps. The most physical sound in the game.
<!-- /note -->

#### <a id="s-SHIP-release"></a>`SHIP.release()`

prop · L150–154

- calls: [`t0`](#s-t0) · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`metal`](voices.js.md#s-metal) _js/audio/voices.js_

<!-- note:SHIP.release -->
<!-- /note -->

#### <a id="s-SHIP-docked"></a>`SHIP.docked()`

prop · L155–160

- calls: [`t0`](#s-t0) · [`chord`](voices.js.md#s-chord) _js/audio/voices.js_ · [`metal`](voices.js.md#s-metal) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_

<!-- note:SHIP.docked -->
Docked, all secure. The one genuinely warm sound in the kit.
<!-- /note -->

#### <a id="s-SHIP-collect"></a>`SHIP.collect()`

prop · L161–165

- calls: [`t0`](#s-t0) · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_

<!-- note:SHIP.collect -->
Cargo aboard.
<!-- /note -->

#### <a id="s-SHIP-trade"></a>`SHIP.trade()`

prop · L166–171

- calls: [`t0`](#s-t0) · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_ ×2

<!-- note:SHIP.trade -->
Money moved.
<!-- /note -->

#### <a id="s-SHIP-impact"></a>`SHIP.impact(sev=)`

prop · L172–179

- calls: [`t0`](#s-t0) · [`duck`](graph.js.md#s-duck) _js/audio/graph.js_ · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`metal`](voices.js.md#s-metal) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_

<!-- note:SHIP.impact -->
Something hit us. `sev` 0..1 decides how much of the hull you feel.
<!-- /note -->

#### <a id="s-SHIP-cutStart"></a>`SHIP.cutStart()`

prop · L180–184

- calls: [`t0`](#s-t0) · [`degree`](graph.js.md#s-degree) _js/audio/graph.js_ · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_

<!-- note:SHIP.cutStart -->
Mining cutter biting in, and letting go.
<!-- /note -->

#### <a id="s-SHIP-cutStop"></a>`SHIP.cutStop()`

prop · L185–188

- calls: [`t0`](#s-t0) · [`air`](voices.js.md#s-air) _js/audio/voices.js_

<!-- note:SHIP.cutStop -->
<!-- /note -->

### <a id="s-CREW"></a>`CREW`

const · **exported** · L191–214

<!-- note:CREW -->
---- people -------------------------------------------------------------
<!-- /note -->

#### <a id="s-CREW-hail"></a>`CREW.hail()`

prop · L192–196

- calls: [`t0`](#s-t0) · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ ×2

<!-- note:CREW.hail -->
An incoming hail, far away.
<!-- /note -->

#### <a id="s-CREW-line"></a>`CREW.line()`

prop · L197–199

- calls: [`t0`](#s-t0) · [`degree`](graph.js.md#s-degree) _js/audio/graph.js_ · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_

<!-- note:CREW.line -->
A line of dialogue arriving. Under everything, almost subliminal.
<!-- /note -->

#### <a id="s-CREW-bond"></a>`CREW.bond()`

prop · L200–203

- calls: [`t0`](#s-t0) · [`chord`](voices.js.md#s-chord) _js/audio/voices.js_

<!-- note:CREW.bond -->
Something good happened between two people.
<!-- /note -->

#### <a id="s-CREW-rift"></a>`CREW.rift()`

prop · L204–208

- calls: [`t0`](#s-t0) · [`degree`](graph.js.md#s-degree) _js/audio/graph.js_ · [`chord`](voices.js.md#s-chord) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_

<!-- note:CREW.rift -->
And something bad. Same chord, flattened.
<!-- /note -->

#### <a id="s-CREW-birth"></a>`CREW.birth()`

prop · L209–213

- calls: [`t0`](#s-t0) · [`chord`](voices.js.md#s-chord) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_

<!-- note:CREW.birth -->
Somebody born aboard.
<!-- /note -->

### <a id="s-VIEW"></a>`VIEW`

const · **exported** · L216–235

<!-- note:VIEW -->
---- viewpoints ---------------------------------------------------------
A change of place should be audible, because the bed underneath is about
to change and an unmarked crossfade reads as a glitch.
<!-- /note -->

#### <a id="s-VIEW-interiorIn"></a>`VIEW.interiorIn()`

prop · L217–221

- calls: [`t0`](#s-t0) · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_

<!-- note:VIEW.interiorIn -->
Into the hull — the sky cuts off.
<!-- /note -->

#### <a id="s-VIEW-interiorOut"></a>`VIEW.interiorOut()`

prop · L222–225

- calls: [`t0`](#s-t0) · [`air`](voices.js.md#s-air) _js/audio/voices.js_

<!-- note:VIEW.interiorOut -->
And back out.
<!-- /note -->

#### <a id="s-VIEW-camera"></a>`VIEW.camera()`

prop · L226–230

- calls: [`t0`](#s-t0) · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_

<!-- note:VIEW.camera -->
Cockpit ↔ external camera.
<!-- /note -->

#### <a id="s-VIEW-map"></a>`VIEW.map()`

prop · L231–234

- calls: [`t0`](#s-t0) · [`chord`](voices.js.md#s-chord) _js/audio/voices.js_

<!-- note:VIEW.map -->
The chart opening over the world.
<!-- /note -->

### <a id="s-CUES"></a>`CUES`

const · **exported** · L237–244

<!-- note:CUES -->
Every cue in the kit, flat, for the audition lab and the test suite.
<!-- /note -->

### <a id="s-cue"></a>`cue(name, ...args)`

function · **exported** · L246–251

<!-- note:cue -->
Fire a cue by name. Unknown names are ignored, never thrown.
<!-- /note -->
