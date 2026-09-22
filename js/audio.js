/* LIVING GALAXY — audio.
 *
 * The public face of js/audio/. Everything the rest of the game calls lives
 * here, and the four functions the old kit exported still exist with the
 * same signatures, so no call site had to change to get the new sound.
 *
 * What did change is what they mean. `playWarn()` was called from twenty
 * places — no charge, no port in range, a hostile hail, a hull breach — and
 * played one loud tone for all of them. It still works, but it is now the
 * gentlest of three, and the call sites that meant something worse have
 * been moved to `warnCaution()` and `warnAlarm()`.
 *
 *   cue("ui.tap")              fire any cue by name
 *   UI / WARN / NAV / SHIP / CREW / VIEW    the same, as call sites
 *   tickAudio(state, dt)       drives the ambient bed
 *   setBusLevel("alert", 0.8)  the mixer
 */

import { ensureAudio, unlock, resumeIfNeeded, setMuted, setBusLevel, busLevels, resetMix, BUSES, audio, duck, NOTE } from "./audio/graph.js";
import { CUES, cue, UI, WARN, NAV, SHIP, CREW, VIEW } from "./audio/cues.js";
import { startAmbience, stopAmbience, updateAmbience, ambience, PLACE_IDS, disposeAmbience } from "./audio/ambience.js";
import { heldDrone } from "./audio/voices.js";

export { cue, CUES, UI, WARN, NAV, SHIP, CREW, VIEW };
export { setBusLevel, busLevels, resetMix, BUSES, audio, duck };
export { ambience, PLACE_IDS, startAmbience, stopAmbience, disposeAmbience };

/* ---- lifecycle ---------------------------------------------------------- */

export function unlockAudio() {
  unlock();
  startAmbience();
}

export function setAudioMuted(v) {
  setMuted(v);
}

export function resumeAudioIfNeeded() {
  resumeIfNeeded();
}

/* ---- the engine ---------------------------------------------------------
 * Not a cue: a held voice whose pitch and level track the drive. It lives
 * here rather than in ambience.js because it is the ship, not the place —
 * it follows you into a belt and a gravity well unchanged.
 */
let engine = null;
let engineAir = null;

export function setEngineLevel(speedAbs, boost, throttle) {
  const k = ensureAudio();
  if (!k) return;
  if (!engine) {
    engine = heldDrone(NOTE.A0 * 1.3, {
      bus: "engine", harmonics: [1, 2, 3, 4.02], gain: 0, cut: 300, type: "sawtooth", space: 0.12,
    });
    if (!engine) return;
  }
  const want = Math.min(1, speedAbs / 300 + Math.abs(throttle ?? 0) * 0.35 + (boost ? 0.22 : 0));
  engine.set(want * 0.11, 260);
  engine.freq(NOTE.A0 * (1.15 + want * 0.9), 320);
  engine.cutoff(220 + want * 1400, 300);
}

/* ---- back-compat --------------------------------------------------------
 * The four the old module exported. Kept so that a call site nobody has
 * revisited still makes a sensible noise rather than none.
 */
export function playScan() { NAV.ping(); }
export function playCollect() { SHIP.collect(); }
export function playWarp() { NAV.jump(); }

/**
 * The old catch-all. It is now the *soft* one — a refusal, not an alarm —
 * because that is what most of its twenty call sites actually meant. The
 * ones that meant something worse call warnCaution() or warnAlarm().
 */
export function playWarn() { WARN.deny(); }
export function warnCaution() { WARN.caution(); }
export function warnAlarm() { WARN.alarm(); }
export function warnCritical() { WARN.critical(); }

/* ---- the bed ------------------------------------------------------------ */

/**
 * Called once a frame from the engine tick. Cheap: the bed rate-limits
 * itself internally and allocates nothing per call.
 */
export function tickAudio(state, dt) {
  updateAmbience(state, dt);
}

/** Everything the mixer panel needs, in one read. */
export function audioState() {
  return {
    ready: audio.ready,
    muted: audio.muted,
    voices: audio.voices,
    levels: busLevels(),
    place: ambience.place,
    running: ambience.running,
  };
}
