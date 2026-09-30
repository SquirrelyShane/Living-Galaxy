# js/audio/voices.js

[index](../../../README.md) · 273 lines · 20 symbols · 1 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY — synthesis voices.

Six primitives, and every sound in the game is made of them. They are the
Interstellar palette taken literally: a pipe organ, a sub, moving air,
struck metal, knocked wood, and a bowed swell. There is deliberately no
"beep" in here — if a cue needs to say something short and bright it says
it with a wooden knock or an organ chiff, because the moment a sine beep
exists somebody reaches for it.

Everything takes an absolute start time so a cue can lay its parts out in
a line, and everything routes through toBus() so the node graph comes back
down afterwards.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./graph.js` | `ensureAudio`, `toBus`, `claimVoice`, `releaseVoice`, `noiseBuffer` | [js/audio/graph.js](graph.js.md) |

## Imported by

- [js/audio/ambience.js](ambience.js.md) — `heldDrone`, `heldAir`
- [js/audio/cues.js](cues.js.md) — `organ`, `chord`, `sub`, `air`, `metal`, `wood`, `swell`
- [js/audio/index.js](index.js.md) — `heldDrone`

## Exports

- [`organ`](#s-organ) · function — used by [js/audio/cues.js](cues.js.md)
- [`chord`](#s-chord) · function — used by [js/audio/cues.js](cues.js.md)
- [`sub`](#s-sub) · function — used by [js/audio/cues.js](cues.js.md)
- [`air`](#s-air) · function — used by [js/audio/cues.js](cues.js.md)
- [`metal`](#s-metal) · function — used by [js/audio/cues.js](cues.js.md)
- [`wood`](#s-wood) · function — used by [js/audio/cues.js](cues.js.md)
- [`swell`](#s-swell) · function — used by [js/audio/cues.js](cues.js.md)
- [`heldDrone`](#s-heldDrone) · function — used by [js/audio/ambience.js](ambience.js.md), [js/audio/index.js](index.js.md)
- [`heldAir`](#s-heldAir) · function — used by [js/audio/ambience.js](ambience.js.md)
- `releaseVoice` — **no importer in scanned roots**

## Effects

- **timer** — `setTimeout` (heldDrone.stop:235, heldAir.stop:266)

## Symbols

### <a id="s-env"></a>`env(g, t, {…})`

function · L3–12

- called by: [`air`](#s-air) · [`metal`](#s-metal) · [`organ`](#s-organ) ×2 · [`sub`](#s-sub) · [`swell`](#s-swell) · [`wood`](#s-wood)

<!-- note:env -->
<!-- /note -->

### <a id="s-organ"></a>`organ(freq, {…}=)`

function · **exported** · L14–66

- calls: [`claimVoice`](graph.js.md#s-claimVoice) _js/audio/graph.js_ · [`ensureAudio`](graph.js.md#s-ensureAudio) _js/audio/graph.js_ · [`noiseBuffer`](graph.js.md#s-noiseBuffer) _js/audio/graph.js_ · [`toBus`](graph.js.md#s-toBus) _js/audio/graph.js_ · [`env`](#s-env) ×2
- called by: [`CREW.hail`](cues.js.md#s-CREW-hail) _js/audio/cues.js_ ×2 · [`NAV.contact`](cues.js.md#s-NAV-contact) _js/audio/cues.js_ ×2 · [`NAV.lock`](cues.js.md#s-NAV-lock) _js/audio/cues.js_ ×2 · [`NAV.ping`](cues.js.md#s-NAV-ping) _js/audio/cues.js_ · [`NAV.unlock`](cues.js.md#s-NAV-unlock) _js/audio/cues.js_ ×2 · [`SHIP.collect`](cues.js.md#s-SHIP-collect) _js/audio/cues.js_ · [`SHIP.cutStart`](cues.js.md#s-SHIP-cutStart) _js/audio/cues.js_ · [`SHIP.trade`](cues.js.md#s-SHIP-trade) _js/audio/cues.js_ · [`UI.close`](cues.js.md#s-UI-close) _js/audio/cues.js_ · [`UI.press`](cues.js.md#s-UI-press) _js/audio/cues.js_ · [`UI.tab`](cues.js.md#s-UI-tab) _js/audio/cues.js_ · [`WARN.caution`](cues.js.md#s-WARN-caution) _js/audio/cues.js_ ×2 · [`WARN.deny`](cues.js.md#s-WARN-deny) _js/audio/cues.js_ · [`chord`](#s-chord)

<!-- note:organ -->
---- 1. organ -----------------------------------------------------------
A drawbar stack: the fundamental plus a chosen set of harmonics, each its
own sine, lightly detuned against each other so the thing breathes. The
chiff — the puff of wind before a pipe speaks — is what stops it sounding
like a synth pad, so it is not optional here.

- L34 · `const weight = harmonics.reduce((a, h) => a + 1 / Math.pow(h, tilt), 0) || 1;` — Normalised: without this, `gain` means "the fundamental" and the real
  peak is whatever the harmonic stack happens to add on top — which made a
  six-harmonic organ twice as loud as a three-harmonic one at the same
  nominal setting, and made every cue gain in the library a guess.
- L49 · `if (chiff > 0) {` — the chiff: a breath of filtered air on the attack only
<!-- /note -->

### <a id="s-chord"></a>`chord(freqs, opts=)`

function · **exported** · L68–77

- calls: [`ensureAudio`](graph.js.md#s-ensureAudio) _js/audio/graph.js_ · [`organ`](#s-organ)
- called by: [`CREW.birth`](cues.js.md#s-CREW-birth) _js/audio/cues.js_ · [`CREW.bond`](cues.js.md#s-CREW-bond) _js/audio/cues.js_ · [`CREW.rift`](cues.js.md#s-CREW-rift) _js/audio/cues.js_ · [`NAV.arrive`](cues.js.md#s-NAV-arrive) _js/audio/cues.js_ · [`NAV.jump`](cues.js.md#s-NAV-jump) _js/audio/cues.js_ · [`SHIP.docked`](cues.js.md#s-SHIP-docked) _js/audio/cues.js_ · [`UI.commit`](cues.js.md#s-UI-commit) _js/audio/cues.js_ · [`UI.panel`](cues.js.md#s-UI-panel) _js/audio/cues.js_ · [`VIEW.map`](cues.js.md#s-VIEW-map) _js/audio/cues.js_ · [`WARN.alarm`](cues.js.md#s-WARN-alarm) _js/audio/cues.js_ · [`WARN.critical`](cues.js.md#s-WARN-critical) _js/audio/cues.js_

<!-- note:chord -->
A chord, laid as one call. Voices are staggered slightly, as a real hand is.
<!-- /note -->

### <a id="s-sub"></a>`sub(freq, {…}=)`

function · **exported** · L79–94

- calls: [`claimVoice`](graph.js.md#s-claimVoice) _js/audio/graph.js_ · [`ensureAudio`](graph.js.md#s-ensureAudio) _js/audio/graph.js_ · [`toBus`](graph.js.md#s-toBus) _js/audio/graph.js_ · [`env`](#s-env)
- called by: [`CREW.birth`](cues.js.md#s-CREW-birth) _js/audio/cues.js_ · [`CREW.rift`](cues.js.md#s-CREW-rift) _js/audio/cues.js_ · [`NAV.arrive`](cues.js.md#s-NAV-arrive) _js/audio/cues.js_ · [`NAV.dropout`](cues.js.md#s-NAV-dropout) _js/audio/cues.js_ · [`NAV.jump`](cues.js.md#s-NAV-jump) _js/audio/cues.js_ · [`NAV.spool`](cues.js.md#s-NAV-spool) _js/audio/cues.js_ · [`SHIP.clamp`](cues.js.md#s-SHIP-clamp) _js/audio/cues.js_ · [`SHIP.docked`](cues.js.md#s-SHIP-docked) _js/audio/cues.js_ · [`SHIP.impact`](cues.js.md#s-SHIP-impact) _js/audio/cues.js_ · [`SHIP.tractor`](cues.js.md#s-SHIP-tractor) _js/audio/cues.js_ · [`UI.commit`](cues.js.md#s-UI-commit) _js/audio/cues.js_ · [`VIEW.interiorIn`](cues.js.md#s-VIEW-interiorIn) _js/audio/cues.js_ · [`WARN.alarm`](cues.js.md#s-WARN-alarm) _js/audio/cues.js_ · [`WARN.caution`](cues.js.md#s-WARN-caution) _js/audio/cues.js_ · [`WARN.critical`](cues.js.md#s-WARN-critical) _js/audio/cues.js_

<!-- note:sub -->
---- 2. sub -------------------------------------------------------------
The floor of the whole mix. A sine an octave or two under everything else,
with a slow envelope — this is what gives a warp jump or an impact its
weight, and it is felt more than heard on a phone speaker, which is fine:
it still shapes how loud everything above it seems.
<!-- /note -->

### <a id="s-air"></a>`air({…}=)`

function · **exported** · L96–119

- calls: [`claimVoice`](graph.js.md#s-claimVoice) _js/audio/graph.js_ · [`ensureAudio`](graph.js.md#s-ensureAudio) _js/audio/graph.js_ · [`noiseBuffer`](graph.js.md#s-noiseBuffer) _js/audio/graph.js_ · [`toBus`](graph.js.md#s-toBus) _js/audio/graph.js_ · [`env`](#s-env)
- called by: [`NAV.arrive`](cues.js.md#s-NAV-arrive) _js/audio/cues.js_ · [`NAV.dropout`](cues.js.md#s-NAV-dropout) _js/audio/cues.js_ · [`NAV.jump`](cues.js.md#s-NAV-jump) _js/audio/cues.js_ · [`NAV.spool`](cues.js.md#s-NAV-spool) _js/audio/cues.js_ · [`SHIP.cutStart`](cues.js.md#s-SHIP-cutStart) _js/audio/cues.js_ · [`SHIP.cutStop`](cues.js.md#s-SHIP-cutStop) _js/audio/cues.js_ · [`SHIP.impact`](cues.js.md#s-SHIP-impact) _js/audio/cues.js_ · [`SHIP.release`](cues.js.md#s-SHIP-release) _js/audio/cues.js_ · [`UI.close`](cues.js.md#s-UI-close) _js/audio/cues.js_ · [`UI.panel`](cues.js.md#s-UI-panel) _js/audio/cues.js_ · [`VIEW.camera`](cues.js.md#s-VIEW-camera) _js/audio/cues.js_ · [`VIEW.interiorIn`](cues.js.md#s-VIEW-interiorIn) _js/audio/cues.js_ · [`VIEW.interiorOut`](cues.js.md#s-VIEW-interiorOut) _js/audio/cues.js_ · [`WARN.alarm`](cues.js.md#s-WARN-alarm) _js/audio/cues.js_

<!-- note:air -->
---- 3. air -------------------------------------------------------------
Filtered noise. Hull wash, thruster breath, atmosphere, the rush under a
warp. The filter sweep is the whole character — static noise is a hiss,
moving noise is weather.

- L114 · `const end = env(g, t, { attack, hold: Math.max(0, dur - attack - 0.2), decay: Math.max(0.1` — Pink noise through a band pass measures well under a sine at the same
  nominal gain; this is the trim that puts them on the same scale.
<!-- /note -->

### <a id="s-PLATE"></a>`PLATE`

const · L121–121

<!-- note:PLATE -->
---- 4. metal -----------------------------------------------------------
A struck plate: a noise burst through a bank of sharp resonant bands whose
ratios are deliberately inharmonic. Clamps, hull strikes, the docking
clunk. Ratios are not integer multiples, which is the difference between
metal and a bell.

Inharmonic ratios — integer multiples would be a bell, and a bell is the
one thing a hull strike must not sound like.

MAKEUP is measured, not guessed: a bank of high-Q bandpass filters passes a
tiny slice of broadband noise, so the raw output of this voice came back at
half a percent of its nominal gain. tools/audiobake.mjs prints the number
these are trimmed against.
<!-- /note -->

### <a id="s-METAL_MAKEUP"></a>`METAL_MAKEUP`

const · L122–122

<!-- note:METAL_MAKEUP -->
<!-- /note -->

### <a id="s-metal"></a>`metal(freq, {…}=)`

function · **exported** · L123–147

- calls: [`claimVoice`](graph.js.md#s-claimVoice) _js/audio/graph.js_ · [`ensureAudio`](graph.js.md#s-ensureAudio) _js/audio/graph.js_ · [`noiseBuffer`](graph.js.md#s-noiseBuffer) _js/audio/graph.js_ · [`toBus`](graph.js.md#s-toBus) _js/audio/graph.js_ · [`env`](#s-env)
- called by: [`NAV.ping`](cues.js.md#s-NAV-ping) _js/audio/cues.js_ · [`SHIP.clamp`](cues.js.md#s-SHIP-clamp) _js/audio/cues.js_ ×2 · [`SHIP.docked`](cues.js.md#s-SHIP-docked) _js/audio/cues.js_ · [`SHIP.impact`](cues.js.md#s-SHIP-impact) _js/audio/cues.js_ · [`SHIP.release`](cues.js.md#s-SHIP-release) _js/audio/cues.js_

<!-- note:metal -->
<!-- /note -->

### <a id="s-WOOD_MAKEUP"></a>`WOOD_MAKEUP`

const · L149–149

<!-- note:WOOD_MAKEUP -->
---- 5. wood ------------------------------------------------------------
The click. A very short pitched thud with almost no tail — this is what a
button press is, instead of a beep. Two of them a few milliseconds apart
reads as a switch throwing.

A 1.8 ms attack sounds right on paper and measured at nine percent of
nominal: at these pitches the envelope had already fallen most of the way
before the waveform reached its first peak. 4 ms is still a click.
<!-- /note -->

### <a id="s-wood"></a>`wood(freq=, {…}=)`

function · **exported** · L150–168

- calls: [`claimVoice`](graph.js.md#s-claimVoice) _js/audio/graph.js_ · [`ensureAudio`](graph.js.md#s-ensureAudio) _js/audio/graph.js_ · [`toBus`](graph.js.md#s-toBus) _js/audio/graph.js_ · [`env`](#s-env)
- called by: [`CREW.line`](cues.js.md#s-CREW-line) _js/audio/cues.js_ · [`SHIP.collect`](cues.js.md#s-SHIP-collect) _js/audio/cues.js_ · [`SHIP.trade`](cues.js.md#s-SHIP-trade) _js/audio/cues.js_ ×2 · [`UI.commit`](cues.js.md#s-UI-commit) _js/audio/cues.js_ · [`UI.press`](cues.js.md#s-UI-press) _js/audio/cues.js_ · [`UI.tab`](cues.js.md#s-UI-tab) _js/audio/cues.js_ · [`UI.tap`](cues.js.md#s-UI-tap) _js/audio/cues.js_ · [`UI.tick`](cues.js.md#s-UI-tick) _js/audio/cues.js_ · [`UI.toggleOff`](cues.js.md#s-UI-toggleOff) _js/audio/cues.js_ ×2 · [`UI.toggleOn`](cues.js.md#s-UI-toggleOn) _js/audio/cues.js_ ×2 · [`VIEW.camera`](cues.js.md#s-VIEW-camera) _js/audio/cues.js_ · [`WARN.deny`](cues.js.md#s-WARN-deny) _js/audio/cues.js_

<!-- note:wood -->
<!-- /note -->

### <a id="s-swell"></a>`swell(freq, {…}=)`

function · **exported** · L170–198

- calls: [`claimVoice`](graph.js.md#s-claimVoice) _js/audio/graph.js_ · [`ensureAudio`](graph.js.md#s-ensureAudio) _js/audio/graph.js_ · [`toBus`](graph.js.md#s-toBus) _js/audio/graph.js_ · [`env`](#s-env)
- called by: [`NAV.spool`](cues.js.md#s-NAV-spool) _js/audio/cues.js_ · [`SHIP.tractor`](cues.js.md#s-SHIP-tractor) _js/audio/cues.js_ · [`WARN.critical`](cues.js.md#s-WARN-critical) _js/audio/cues.js_

<!-- note:swell -->
---- 6. swell -----------------------------------------------------------
A bowed string-ish rise: two saws through a moving low pass, slow in and
slow out. Used where something is building — a warp spool, an alarm that
has not resolved, a panel coming up.
<!-- /note -->

### <a id="s-heldDrone"></a>`heldDrone(freq, {…}=)`

function · **exported** · L200–241

- calls: [`ensureAudio`](graph.js.md#s-ensureAudio) _js/audio/graph.js_
- called by: [`build`](ambience.js.md#s-build) _js/audio/ambience.js_ ×4 · [`setEngineLevel`](index.js.md#s-setEngineLevel) _js/audio/index.js_

<!-- note:heldDrone -->
---- held voices --------------------------------------------------------
Everything above is fire-and-forget. The ambient bed needs the opposite: a
voice that starts, is held for as long as a place lasts, has its level
moved from outside, and is stopped by hand. It gets its own shape rather
than an option on the others, because a held voice that leaks is a leak
that lasts the whole session.
<!-- /note -->

#### <a id="s-heldDrone-set"></a>`heldDrone.set(v, ms=)`

prop · L229–229

<!-- note:heldDrone.set -->
<!-- /note -->

#### <a id="s-heldDrone-freq"></a>`heldDrone.freq(v, ms=)`

prop · L230–230

<!-- note:heldDrone.freq -->
<!-- /note -->

#### <a id="s-heldDrone-cutoff"></a>`heldDrone.cutoff(v, ms=)`

prop · L231–231

<!-- note:heldDrone.cutoff -->
<!-- /note -->

#### <a id="s-heldDrone-stop"></a>`heldDrone.stop(ms=)`

prop · L232–239

- effects: timer `setTimeout`

<!-- note:heldDrone.stop -->
- L236 · `for (const s of sources) { try { s.stop(); s.disconnect(); } catch {` — gone
- L237 · `try { lp.disconnect(); g.disconnect(); } catch {` — gone
<!-- /note -->

### <a id="s-heldAir"></a>`heldAir({…}=)`

function · **exported** · L243–271

- calls: [`ensureAudio`](graph.js.md#s-ensureAudio) _js/audio/graph.js_ · [`noiseBuffer`](graph.js.md#s-noiseBuffer) _js/audio/graph.js_
- called by: [`build`](ambience.js.md#s-build) _js/audio/ambience.js_ ×3

<!-- note:heldAir -->
Held filtered noise — hull wash, room tone, the belt.
<!-- /note -->

#### <a id="s-heldAir-set"></a>`heldAir.set(v, ms=)`

prop · L261–261

<!-- note:heldAir.set -->
<!-- /note -->

#### <a id="s-heldAir-cutoff"></a>`heldAir.cutoff(v, ms=)`

prop · L262–262

<!-- note:heldAir.cutoff -->
<!-- /note -->

#### <a id="s-heldAir-stop"></a>`heldAir.stop(ms=)`

prop · L263–269

- effects: timer `setTimeout`

<!-- note:heldAir.stop -->
- L267 · `try { n.stop(); n.disconnect(); f.disconnect(); g.disconnect(); } catch {` — gone
<!-- /note -->
