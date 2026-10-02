# js/audio/index.js

[index](../../../README.md) · 63 lines · 15 symbols · 4 imports · 10 importers

## About

<!-- note:@file -->
LIVING GALAXY — audio.

The public face of js/audio/. Everything the rest of the game calls lives
here, and the four functions the old kit exported still exist with the
same signatures, so no call site had to change to get the new sound.

What did change is what they mean. `playWarn()` was called from twenty
places — no charge, no port in range, a hostile hail, a hull breach — and
played one loud tone for all of them. It still works, but it is now the
gentlest of three, and the call sites that meant something worse have
been moved to `warnCaution()` and `warnAlarm()`.

  cue("ui.tap")              fire any cue by name
  UI / WARN / NAV / SHIP / CREW / VIEW    the same, as call sites
  tickAudio(state, dt)       drives the ambient bed
  setBusLevel("alert", 0.8)  the mixer
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./graph.js` | `ensureAudio`, `unlock`, `resumeIfNeeded`, `setMuted`, `setBusLevel`, `busLevels`, `resetMix`, `BUSES`, `audio`, `duck`, `NOTE` | [js/audio/graph.js](graph.js.md) |
| 2 | `./cues.js` | `CUES`, `cue`, `UI`, `WARN`, `NAV`, `SHIP`, `CREW`, `VIEW` | [js/audio/cues.js](cues.js.md) |
| 3 | `./ambience.js` | `startAmbience`, `stopAmbience`, `updateAmbience`, `ambience`, `PLACE_IDS`, `disposeAmbience` | [js/audio/ambience.js](ambience.js.md) |
| 4 | `./voices.js` | `heldDrone` | [js/audio/voices.js](voices.js.md) |

## Imported by

- [js/comms/comms.js](../comms/comms.js.md) — `WARN`, `CREW`
- [js/console/console.js](../console/console.js.md) — `UI`
- [js/flight/probes.js](../flight/probes.js.md) — `NAV`, `WARN`
- [js/interior/interior.js](../interior/interior.js.md) — `VIEW`
- [js/main.js](../main.js.md) — `setAudioMuted`
- [js/render/engine.js](../render/engine.js.md) — `resumeAudioIfNeeded`, `tickAudio`
- [js/sim/sim.js](../sim/sim.js.md) — `NAV`, `SHIP`, `UI`, `WARN`, `setEngineLevel`
- [js/ui/hud.js](../ui/hud.js.md) — `setAudioMuted`, `unlockAudio`, `UI`, `busLevels`, `setBusLevel`, `resetMix`, `BUSES`
- [js/ui/map.js](../ui/map.js.md) — `VIEW`
- [js/ui/secbadge.js](../ui/secbadge.js.md) — `UI`

## Exports

- `cue` — **no importer in scanned roots**
- `CUES` — **no importer in scanned roots**
- `UI` — used by [js/console/console.js](../console/console.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md), [js/ui/secbadge.js](../ui/secbadge.js.md)
- `WARN` — used by [js/comms/comms.js](../comms/comms.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/sim/sim.js](../sim/sim.js.md)
- `NAV` — used by [js/flight/probes.js](../flight/probes.js.md), [js/sim/sim.js](../sim/sim.js.md)
- `SHIP` — used by [js/sim/sim.js](../sim/sim.js.md)
- `CREW` — used by [js/comms/comms.js](../comms/comms.js.md)
- `VIEW` — used by [js/interior/interior.js](../interior/interior.js.md), [js/ui/map.js](../ui/map.js.md)
- `setBusLevel` — used by [js/ui/hud.js](../ui/hud.js.md)
- `busLevels` — used by [js/ui/hud.js](../ui/hud.js.md)
- `resetMix` — used by [js/ui/hud.js](../ui/hud.js.md)
- `BUSES` — used by [js/ui/hud.js](../ui/hud.js.md)
- `audio` — **no importer in scanned roots**
- `duck` — **no importer in scanned roots**
- `ambience` — **no importer in scanned roots**
- `PLACE_IDS` — **no importer in scanned roots**
- `startAmbience` — **no importer in scanned roots**
- `stopAmbience` — **no importer in scanned roots**
- `disposeAmbience` — **no importer in scanned roots**
- [`unlockAudio`](#s-unlockAudio) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`setAudioMuted`](#s-setAudioMuted) · function — used by [js/main.js](../main.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`resumeAudioIfNeeded`](#s-resumeAudioIfNeeded) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`setEngineLevel`](#s-setEngineLevel) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`playScan`](#s-playScan) · function — **no importer in scanned roots**
- [`playCollect`](#s-playCollect) · function — **no importer in scanned roots**
- [`playWarp`](#s-playWarp) · function — **no importer in scanned roots**
- [`playWarn`](#s-playWarn) · function — **no importer in scanned roots**
- [`warnCaution`](#s-warnCaution) · function — **no importer in scanned roots**
- [`warnAlarm`](#s-warnAlarm) · function — **no importer in scanned roots**
- [`warnCritical`](#s-warnCritical) · function — **no importer in scanned roots**
- [`tickAudio`](#s-tickAudio) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`audioState`](#s-audioState) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-unlockAudio"></a>`unlockAudio()`

function · **exported** · L10–13

- calls: [`startAmbience`](ambience.js.md#s-startAmbience) _js/audio/ambience.js_ · [`unlock`](graph.js.md#s-unlock) _js/audio/graph.js_
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_ ×2 · [`mountHud>go`](../ui/hud.js.md#s-mountHud-go) _js/ui/hud.js_ · [`mountHud>setMode.onNew`](../ui/hud.js.md#s-mountHud-setMode-onNew) _js/ui/hud.js_

<!-- note:unlockAudio -->
---- lifecycle ----------------------------------------------------------
<!-- /note -->

### <a id="s-setAudioMuted"></a>`setAudioMuted(v)`

function · **exported** · L15–17

- calls: [`setMuted`](graph.js.md#s-setMuted) _js/audio/graph.js_
- called by: [`@file`](../main.js.md#) _js/main.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:setAudioMuted -->
<!-- /note -->

### <a id="s-resumeAudioIfNeeded"></a>`resumeAudioIfNeeded()`

function · **exported** · L19–21

- calls: [`resumeIfNeeded`](graph.js.md#s-resumeIfNeeded) _js/audio/graph.js_
- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_

<!-- note:resumeAudioIfNeeded -->
<!-- /note -->

### <a id="s-engine"></a>`engine`

const · L23–23

<!-- note:engine -->
---- the engine ---------------------------------------------------------
Not a cue: a held voice whose pitch and level track the drive. It lives
here rather than in ambience.js because it is the ship, not the place —
it follows you into a belt and a gravity well unchanged.
<!-- /note -->

### <a id="s-engineAir"></a>`engineAir`

const · L24–24 · **never referenced**

<!-- note:engineAir -->
<!-- /note -->

### <a id="s-setEngineLevel"></a>`setEngineLevel(speedAbs, boost, throttle)`

function · **exported** · L26–39

- calls: [`ensureAudio`](graph.js.md#s-ensureAudio) _js/audio/graph.js_ · [`heldDrone`](voices.js.md#s-heldDrone) _js/audio/voices.js_
- called by: [`tickSim`](../sim/sim.js.md#s-tickSim) _js/sim/sim.js_ ×2

<!-- note:setEngineLevel -->
<!-- /note -->

### <a id="s-playScan"></a>`playScan()`

function · **exported** · L41–41

- via [js/audio/cues.js](cues.js.md): `NAV.ping`

<!-- note:playScan -->
---- back-compat --------------------------------------------------------
The four the old module exported. Kept so that a call site nobody has
revisited still makes a sensible noise rather than none.
<!-- /note -->

### <a id="s-playCollect"></a>`playCollect()`

function · **exported** · L42–42

- via [js/audio/cues.js](cues.js.md): `SHIP.collect`

<!-- note:playCollect -->
<!-- /note -->

### <a id="s-playWarp"></a>`playWarp()`

function · **exported** · L43–43

- via [js/audio/cues.js](cues.js.md): `NAV.jump`

<!-- note:playWarp -->
<!-- /note -->

### <a id="s-playWarn"></a>`playWarn()`

function · **exported** · L45–45

- via [js/audio/cues.js](cues.js.md): `WARN.deny`

<!-- note:playWarn -->
The old catch-all. It is now the *soft* one — a refusal, not an alarm —
because that is what most of its twenty call sites actually meant. The
ones that meant something worse call warnCaution() or warnAlarm().
<!-- /note -->

### <a id="s-warnCaution"></a>`warnCaution()`

function · **exported** · L46–46

- via [js/audio/cues.js](cues.js.md): `WARN.caution`

<!-- note:warnCaution -->
<!-- /note -->

### <a id="s-warnAlarm"></a>`warnAlarm()`

function · **exported** · L47–47

- via [js/audio/cues.js](cues.js.md): `WARN.alarm`

<!-- note:warnAlarm -->
<!-- /note -->

### <a id="s-warnCritical"></a>`warnCritical()`

function · **exported** · L48–48

- via [js/audio/cues.js](cues.js.md): `WARN.critical`

<!-- note:warnCritical -->
<!-- /note -->

### <a id="s-tickAudio"></a>`tickAudio(state, dt)`

function · **exported** · L50–52

- calls: [`updateAmbience`](ambience.js.md#s-updateAmbience) _js/audio/ambience.js_
- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_

<!-- note:tickAudio -->
---- the bed ------------------------------------------------------------

Called once a frame from the engine tick. Cheap: the bed rate-limits
itself internally and allocates nothing per call.
<!-- /note -->

### <a id="s-audioState"></a>`audioState()`

function · **exported** · L54–63

- calls: [`busLevels`](graph.js.md#s-busLevels) _js/audio/graph.js_

<!-- note:audioState -->
Everything the mixer panel needs, in one read.
<!-- /note -->
