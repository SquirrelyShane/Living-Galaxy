# js/audio/graph.js

[index](../../../README.md) · 257 lines · 42 symbols · 0 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — the audio graph.

One AudioContext, five named buses, two reverbs and a limiter. Nothing is
loaded: every sound in the game is synthesised at the moment it plays, the
same way every hull and every world is. That is not purity for its own
sake — it means a new cue costs a few lines instead of a wav file, the
whole kit survives being served off a phone, and a sound can be tuned by
the thing that triggered it (how hard the rock hit, how far off the lane
you are) rather than picked from a handful of takes.

The palette is Interstellar's, which is a narrow one on purpose: pipe
organ, sub-bass, air, wood and metal. No bright digital beeps anywhere —
the thing being replaced was one loud sine doing twenty different jobs.

  BUSES   ui · world · alert · ambience · engine
  SENDS   room (0.9 s) · space (4.6 s)
  MASTER  → limiter → destination

- L13 · `export const ROOT = 55;` — A1
- L14 · `const STEPS = [0, 2, 3, 5, 7, 8, 10];` — aeolian
<!-- /note -->

## Imports

_none_

## Imported by

- [js/audio/ambience.js](ambience.js.md) — `NOTE`, `degree`, `ensureAudio`
- [js/audio/cues.js](cues.js.md) — `NOTE`, `degree`, `duck`, `ensureAudio`
- [js/audio/index.js](index.js.md) — `ensureAudio`, `unlock`, `resumeIfNeeded`, `setMuted`, `setBusLevel`, `busLevels`, `resetMix`, `BUSES`, `audio`, `duck`, `NOTE`
- [js/audio/voices.js](voices.js.md) — `ensureAudio`, `toBus`, `claimVoice`, `releaseVoice`, `noiseBuffer`

## Exports

- [`BUSES`](#s-BUSES) · const — used by [js/audio/index.js](index.js.md)
- [`ROOT`](#s-ROOT) · const — **no importer in scanned roots**
- [`degree`](#s-degree) · function — used by [js/audio/ambience.js](ambience.js.md), [js/audio/cues.js](cues.js.md)
- [`NOTE`](#s-NOTE) · const — used by [js/audio/ambience.js](ambience.js.md), [js/audio/cues.js](cues.js.md), [js/audio/index.js](index.js.md)
- [`ensureAudio`](#s-ensureAudio) · function — used by [js/audio/ambience.js](ambience.js.md), [js/audio/cues.js](cues.js.md), [js/audio/index.js](index.js.md), [js/audio/voices.js](voices.js.md)
- [`audio`](#s-audio) · const — used by [js/audio/index.js](index.js.md)
- [`busNode`](#s-busNode) · function — **no importer in scanned roots**
- [`sendNode`](#s-sendNode) · function — **no importer in scanned roots**
- [`now`](#s-now) · function — **no importer in scanned roots**
- [`setMuted`](#s-setMuted) · function — used by [js/audio/index.js](index.js.md)
- [`setBusLevel`](#s-setBusLevel) · function — used by [js/audio/index.js](index.js.md)
- [`busLevels`](#s-busLevels) · function — used by [js/audio/index.js](index.js.md)
- [`resetMix`](#s-resetMix) · function — used by [js/audio/index.js](index.js.md)
- [`duck`](#s-duck) · function — used by [js/audio/cues.js](cues.js.md), [js/audio/index.js](index.js.md)
- [`claimVoice`](#s-claimVoice) · function — used by [js/audio/voices.js](voices.js.md)
- [`releaseVoice`](#s-releaseVoice) · function — used by [js/audio/voices.js](voices.js.md)
- [`toBus`](#s-toBus) · function — used by [js/audio/voices.js](voices.js.md)
- [`noiseBuffer`](#s-noiseBuffer) · function — used by [js/audio/voices.js](voices.js.md)
- [`unlock`](#s-unlock) · function — used by [js/audio/index.js](index.js.md)
- [`resumeIfNeeded`](#s-resumeIfNeeded) · function — used by [js/audio/index.js](index.js.md)
- [`_installContext`](#s-_installContext) · function — **no importer in scanned roots**
- [`_teardown`](#s-_teardown) · function — **no importer in scanned roots**

## Effects

- **storage.get** — `‹LS_KEY›` (readMix:52)
- **storage.set** — `‹LS_KEY›` (writeMix:62)
- **timer** — `setTimeout` (toBus:192, tidy:203)

## Symbols

### <a id="s-BUSES"></a>`BUSES`

const · **exported** · L1–1

<!-- note:BUSES -->
<!-- /note -->

### <a id="s-DEFAULT_LEVELS"></a>`DEFAULT_LEVELS`

const · L3–3

<!-- note:DEFAULT_LEVELS -->
Defaults chosen so the bed sits under everything and an alert cuts.
<!-- /note -->

### <a id="s-LS_KEY"></a>`LS_KEY`

const · L4–4

<!-- note:LS_KEY -->
<!-- /note -->

### <a id="s-MAX_VOICES"></a>`MAX_VOICES`

const · L6–6

<!-- note:MAX_VOICES -->
A hard ceiling on simultaneous synthesised voices. A phone that is already
drawing a sky does not have the headroom for fifty oscillators, and past
about this many nobody can hear the difference anyway.
<!-- /note -->

### <a id="s-kit"></a>`kit`

const · L8–8

<!-- note:kit -->
<!-- /note -->

### <a id="s-muted"></a>`muted`

const · L9–9

<!-- note:muted -->
<!-- /note -->

### <a id="s-levels"></a>`levels`

const · L10–10

<!-- note:levels -->
<!-- /note -->

### <a id="s-voices"></a>`voices`

const · L11–11

<!-- note:voices -->
<!-- /note -->

### <a id="s-ROOT"></a>`ROOT`

const · **exported** · L13–13

<!-- note:ROOT -->
---- tuning -------------------------------------------------------------
Every pitched sound in the game comes out of one scale, so a cue can never
clash with the bed underneath it. A natural minor on A: no major third
anywhere, which is most of why the palette reads as cold rather than
cheerful.
<!-- /note -->

### <a id="s-STEPS"></a>`STEPS`

const · L14–14

<!-- note:STEPS -->
<!-- /note -->

### <a id="s-degree"></a>`degree(n, octave=)`

function · **exported** · L15–19

- called by: [`build`](ambience.js.md#s-build) _js/audio/ambience.js_ ×2 · [`updateAmbience`](ambience.js.md#s-updateAmbience) _js/audio/ambience.js_ ×4 · [`CREW.line`](cues.js.md#s-CREW-line) _js/audio/cues.js_ · [`CREW.rift`](cues.js.md#s-CREW-rift) _js/audio/cues.js_ · [`SHIP.cutStart`](cues.js.md#s-SHIP-cutStart) _js/audio/cues.js_ · [`SHIP.tractor`](cues.js.md#s-SHIP-tractor) _js/audio/cues.js_ · [`UI.tick`](cues.js.md#s-UI-tick) _js/audio/cues.js_ · [`WARN.alarm`](cues.js.md#s-WARN-alarm) _js/audio/cues.js_ ×2 · [`WARN.critical`](cues.js.md#s-WARN-critical) _js/audio/cues.js_ ×4 · [`WARN.deny`](cues.js.md#s-WARN-deny) _js/audio/cues.js_ · [`NOTE`](#s-NOTE) ×12

<!-- note:degree -->
<!-- /note -->

### <a id="s-NOTE"></a>`NOTE`

const · **exported** · L20–25

- calls: [`degree`](#s-degree) ×12

<!-- note:NOTE -->
Named handles for the notes cues actually use.
<!-- /note -->

### <a id="s-impulse"></a>`impulse(ctx, seconds, decay, damp)`

function · L27–48

- called by: [`ensureAudio`](#s-ensureAudio) ×2

<!-- note:impulse -->
---- reverb -------------------------------------------------------------
Two impulse responses, generated rather than loaded. Noise under an
exponential decay is a crude reverb and an entirely convincing one at this
scale; the only refinements that matter are a little stereo decorrelation
so it opens up, and rolling the top off the tail so it does not hiss.

- L37 · `lp += (Math.random() * 2 - 1 - lp) * damp;` — one-pole low pass over the noise: the tail darkens as it dies, the
  way a real room does
- L40 · `if (seconds < 2) {` — a couple of early reflections give the short room a size
<!-- /note -->

### <a id="s-readMix"></a>`readMix()`

function · L50–59

- called by: [`ensureAudio`](#s-ensureAudio)
- effects: storage.get `‹LS_KEY›`

<!-- note:readMix -->
---- the kit ------------------------------------------------------------
<!-- /note -->

### <a id="s-writeMix"></a>`writeMix()`

function · L61–63

- called by: [`setBusLevel`](#s-setBusLevel)
- effects: storage.set `‹LS_KEY›`

<!-- note:writeMix -->
- L62 · `try { localStorage.setItem(LS_KEY, JSON.stringify(levels)); } catch {` — private mode
<!-- /note -->

### <a id="s-ensureAudio"></a>`ensureAudio()`

function · **exported** · L65–115

- calls: [`new _installContext>AC`](#s-_installContext-AC) · [`impulse`](#s-impulse) ×2 · [`readMix`](#s-readMix)
- called by: [`build`](ambience.js.md#s-build) _js/audio/ambience.js_ · [`t0`](cues.js.md#s-t0) _js/audio/cues.js_ · [`_installContext`](#s-_installContext) · [`busNode`](#s-busNode) · [`noiseBuffer`](#s-noiseBuffer) · [`now`](#s-now) · [`sendNode`](#s-sendNode) · [`toBus`](#s-toBus) · [`unlock`](#s-unlock) · [`setEngineLevel`](index.js.md#s-setEngineLevel) _js/audio/index.js_ · [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`chord`](voices.js.md#s-chord) _js/audio/voices.js_ · [`heldAir`](voices.js.md#s-heldAir) _js/audio/voices.js_ · [`heldDrone`](voices.js.md#s-heldDrone) _js/audio/voices.js_ · [`metal`](voices.js.md#s-metal) _js/audio/voices.js_ · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_ · [`swell`](voices.js.md#s-swell) _js/audio/voices.js_ · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_

<!-- note:ensureAudio -->
- L74 · `const limiter = ctx.createDynamicsCompressor();` — A limiter, not a compressor doing limiter duty: a hard knee up near 0 dB
  so a burst of cues on top of the bed never clips, and nothing below it is
  touched. The old kit had no protection at all, which is part of why one
  tone read as "loud".
- L102 · `const d = ctx.createGain();` — Ducking rides on its own node so the player's level and the duck never
  fight over the same AudioParam — the old single-gain approach is how
  you end up with a bus stuck at 30% after an alert.
<!-- /note -->

### <a id="s-audio"></a>`audio`

const · **exported** · L117–122

<!-- note:audio -->
<!-- /note -->

#### <a id="s-audio-ctx"></a>`audio.ctx()`

prop · L118–118

<!-- note:audio.ctx -->
<!-- /note -->

#### <a id="s-audio-ready"></a>`audio.ready()`

prop · L119–119

<!-- note:audio.ready -->
<!-- /note -->

#### <a id="s-audio-muted"></a>`audio.muted()`

prop · L120–120

<!-- note:audio.muted -->
<!-- /note -->

#### <a id="s-audio-voices"></a>`audio.voices()`

prop · L121–121

<!-- note:audio.voices -->
<!-- /note -->

### <a id="s-busNode"></a>`busNode(name)`

function · **exported** · L124–127

- calls: [`ensureAudio`](#s-ensureAudio)

<!-- note:busNode -->
<!-- /note -->

### <a id="s-sendNode"></a>`sendNode(which)`

function · **exported** · L128–131

- calls: [`ensureAudio`](#s-ensureAudio)

<!-- note:sendNode -->
<!-- /note -->

### <a id="s-now"></a>`now()`

function · **exported** · L132–135

- calls: [`ensureAudio`](#s-ensureAudio)

<!-- note:now -->
<!-- /note -->

### <a id="s-setMuted"></a>`setMuted(v)`

function · **exported** · L137–141

- called by: [`setAudioMuted`](index.js.md#s-setAudioMuted) _js/audio/index.js_

<!-- note:setMuted -->
---- mix ----------------------------------------------------------------
<!-- /note -->

### <a id="s-setBusLevel"></a>`setBusLevel(name, value)`

function · **exported** · L143–152

- calls: [`writeMix`](#s-writeMix)
- called by: [`resetMix`](#s-resetMix) · [`mountHud>paintRow`](../ui/hud.js.md#s-mountHud-paintRow) _js/ui/hud.js_

<!-- note:setBusLevel -->
<!-- /note -->

### <a id="s-busLevels"></a>`busLevels()`

function · **exported** · L154–154

- called by: [`audioState`](index.js.md#s-audioState) _js/audio/index.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_ ×2

<!-- note:busLevels -->
<!-- /note -->

### <a id="s-resetMix"></a>`resetMix()`

function · **exported** · L155–155

- calls: [`setBusLevel`](#s-setBusLevel)
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:resetMix -->
<!-- /note -->

### <a id="s-duck"></a>`duck(depth=, holdMs=)`

function · **exported** · L157–169

- called by: [`NAV.jump`](cues.js.md#s-NAV-jump) _js/audio/cues.js_ · [`SHIP.impact`](cues.js.md#s-SHIP-impact) _js/audio/cues.js_ · [`WARN.alarm`](cues.js.md#s-WARN-alarm) _js/audio/cues.js_ · [`WARN.caution`](cues.js.md#s-WARN-caution) _js/audio/cues.js_ · [`WARN.critical`](cues.js.md#s-WARN-critical) _js/audio/cues.js_

<!-- note:duck -->
Pull everything except alerts down for a moment. A warning that arrives
under a full engine bed and a station hum is a warning nobody hears, and
turning the alert up instead is how you get the thing being replaced here.
<!-- /note -->

### <a id="s-claimVoice"></a>`claimVoice(priority=)`

function · **exported** · L171–176

- called by: [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`metal`](voices.js.md#s-metal) _js/audio/voices.js_ · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_ · [`swell`](voices.js.md#s-swell) _js/audio/voices.js_ · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_

<!-- note:claimVoice -->
---- voices -------------------------------------------------------------
A claim/release pair rather than a pool of pre-built nodes: Web Audio
sources are single-use by design, so pooling them buys nothing. What is
worth having is the cap and the priority, so a click cannot starve an
alarm.

- L173 · `if (voices >= MAX_VOICES + 8) return false;` — even alerts have a ceiling
<!-- /note -->

### <a id="s-releaseVoice"></a>`releaseVoice()`

function · **exported** · L177–177

- called by: [`toBus`](#s-toBus)

<!-- note:releaseVoice -->
<!-- /note -->

### <a id="s-toBus"></a>`toBus(node, busName, {…}=)`

function · **exported** · L179–197

- calls: [`ensureAudio`](#s-ensureAudio) · [`releaseVoice`](#s-releaseVoice) · [`tidy`](#s-tidy) ×3
- called by: [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`metal`](voices.js.md#s-metal) _js/audio/voices.js_ · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_ · [`sub`](voices.js.md#s-sub) _js/audio/voices.js_ · [`swell`](voices.js.md#s-swell) _js/audio/voices.js_ · [`wood`](voices.js.md#s-wood) _js/audio/voices.js_
- effects: timer `setTimeout`

<!-- note:toBus -->
Wire a voice's output and schedule its own teardown. Everything that makes
a sound goes through here, which is the only reason the node count comes
back down: a forgotten disconnect in a game that plays a cue per tap is a
leak with a stopwatch on it.

- L188 · `try { s.stop(stopAt); } catch {` — already stopped
- L193 · `for (const s of sources) { try { s.disconnect(); } catch {` — gone
<!-- /note -->

### <a id="s-tidy"></a>`tidy(node, stopAt)`

function · L199–204

- called by: [`toBus`](#s-toBus) ×3
- effects: timer `setTimeout`

<!-- note:tidy -->
- L203 · `setTimeout(() => { try { node.disconnect(); } catch {` — gone
<!-- /note -->

### <a id="s-noiseBuf"></a>`noiseBuf`

const · L206–206

<!-- note:noiseBuf -->
---- noise --------------------------------------------------------------
One shared noise buffer. Air, hull rumble, thruster wash, metal strikes
and the reverb tails all start life here, so it is built once and looped
rather than allocated per cue.
<!-- /note -->

### <a id="s-noiseBuffer"></a>`noiseBuffer()`

function · **exported** · L207–225

- calls: [`ensureAudio`](#s-ensureAudio)
- called by: [`air`](voices.js.md#s-air) _js/audio/voices.js_ · [`heldAir`](voices.js.md#s-heldAir) _js/audio/voices.js_ · [`metal`](voices.js.md#s-metal) _js/audio/voices.js_ · [`organ`](voices.js.md#s-organ) _js/audio/voices.js_

<!-- note:noiseBuffer -->
- L218 · `b0 = 0.99765 * b0 + w * 0.0990460;` — Pinked: white noise reads as hiss, and there is no hiss anywhere in
  this palette. Cheap three-pole approximation.
<!-- /note -->

### <a id="s-resuming"></a>`resuming`

const · L227–227

<!-- note:resuming -->
---- lifecycle ----------------------------------------------------------
<!-- /note -->

### <a id="s-unlock"></a>`unlock()`

function · **exported** · L228–232

- calls: [`ensureAudio`](#s-ensureAudio)
- called by: [`unlockAudio`](index.js.md#s-unlockAudio) _js/audio/index.js_

<!-- note:unlock -->
<!-- /note -->

### <a id="s-resumeIfNeeded"></a>`resumeIfNeeded()`

function · **exported** · L233–241

- called by: [`resumeAudioIfNeeded`](index.js.md#s-resumeAudioIfNeeded) _js/audio/index.js_

<!-- note:resumeIfNeeded -->
<!-- /note -->

#### <a id="s-resumeIfNeeded-done"></a>`resumeIfNeeded>done()`

function · L238–238

<!-- note:resumeIfNeeded>done -->
<!-- /note -->

### <a id="s-_installContext"></a>`_installContext(ctx)`

function · **exported** · L243–256

- calls: [`ensureAudio`](#s-ensureAudio)

<!-- note:_installContext -->
Tests and the audition lab drive an OfflineAudioContext through here.
<!-- /note -->

#### <a id="s-_installContext-AC"></a>`_installContext>AC()`

function · L247–247

- called by: [`ensureAudio`](#s-ensureAudio)

<!-- note:_installContext>AC -->
<!-- /note -->

### <a id="s-_teardown"></a>`_teardown()`

function · **exported** · L257–257

<!-- note:_teardown -->
<!-- /note -->
