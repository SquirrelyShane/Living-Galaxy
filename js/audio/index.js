import { ensureAudio, unlock, resumeIfNeeded, setMuted, setBusLevel, busLevels, resetMix, BUSES, audio, duck, NOTE } from "./graph.js";
import { CUES, cue, UI, WARN, NAV, SHIP, CREW, VIEW } from "./cues.js";
import { startAmbience, stopAmbience, updateAmbience, ambience, PLACE_IDS, disposeAmbience } from "./ambience.js";
import { heldDrone } from "./voices.js";

export { cue, CUES, UI, WARN, NAV, SHIP, CREW, VIEW };
export { setBusLevel, busLevels, resetMix, BUSES, audio, duck };
export { ambience, PLACE_IDS, startAmbience, stopAmbience, disposeAmbience };

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

export function playScan() { NAV.ping(); }
export function playCollect() { SHIP.collect(); }
export function playWarp() { NAV.jump(); }

export function playWarn() { WARN.deny(); }
export function warnCaution() { WARN.caution(); }
export function warnAlarm() { WARN.alarm(); }
export function warnCritical() { WARN.critical(); }

export function tickAudio(state, dt) {
  updateAmbience(state, dt);
}

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
