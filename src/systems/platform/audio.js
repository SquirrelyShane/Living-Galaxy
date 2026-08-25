// Living Galaxy — tiny synth. No files, no libraries: oscillators only.
//
// 0.9 gives it a mix. Everything used to connect straight to one master gain, which
// meant three things were impossible: turning music down without turning gunfire down,
// hearing a lock-on alarm over a firefight, and having a distant shot sound distant.
//
// The graph is now:
//
//     source → bus gain → master → limiter → destination
//
// Four buses — sfx, alert, engine, music — because those are the four things that need
// to be balanced against each other independently. Alerts *duck* the others rather than
// simply being louder: a warning that has to win a shouting match with the mix is a
// warning the player will miss, and turning everything else down for 400 ms is far more
// audible than turning one thing up.

import { S } from '../../core/state.js';
import { AUDIO } from '../../core/config.js';
import { startBed, stopBed, moveBed, bedRunning, bedMood, bedReport } from './music.js';

let ctx = null, master = null, limiter = null;
const buses = {};
let duckUntil = 0;
let music = null;

export function initAudio() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();

  // A limiter on the end, because this synth can and does stack a dozen voices during a
  // fight, and clipping on a phone speaker is the ugliest sound the game can make.
  limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -8;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.18;

  master = ctx.createGain();
  master.gain.value = AUDIO.master;
  master.connect(limiter);
  limiter.connect(ctx.destination);

  for (const name in AUDIO.buses) {
    const g = ctx.createGain();
    g.gain.value = AUDIO.buses[name];
    g.connect(master);
    buses[name] = g;
  }
}

const busFor = name => buses[name] || master;

/** Mix levels are settings, so they persist with everything else in S.settings. */
export function setBusLevel(name, value) {
  if (!AUDIO.buses[name]) return false;
  const v = Math.max(0, Math.min(1, value));
  if (!S.settings.mix) S.settings.mix = {};
  S.settings.mix[name] = v;
  if (buses[name] && ctx) buses[name].gain.setTargetAtTime(v, ctx.currentTime, 0.02);
  return true;
}

export function busLevel(name) {
  const m = S.settings.mix || {};
  return m[name] !== undefined ? m[name] : (AUDIO.buses[name] || 0);
}

export function applyMix() {
  if (!ctx) return;
  for (const name in AUDIO.buses) {
    if (buses[name]) buses[name].gain.setTargetAtTime(busLevel(name), ctx.currentTime, 0.05);
  }
  master.gain.setTargetAtTime(S.settings.audio ? AUDIO.master : 0, ctx.currentTime, 0.05);
}

/**
 * Pull every other bus down for a moment so an alert lands. Called by the alert sounds
 * themselves rather than by their callers, so nothing has to remember to do it.
 */
export function duck(ms = AUDIO.duckMs) {
  if (!ctx) return;
  const now = ctx.currentTime;
  duckUntil = Math.max(duckUntil, now + ms / 1000);
  for (const name in buses) {
    if (name === 'alert') continue;
    const g = buses[name].gain;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(busLevel(name) * AUDIO.duckTo, now, 0.02);
    g.setTargetAtTime(busLevel(name), duckUntil, 0.12);
  }
}

/**
 * Doppler and distance falloff for a sound with a position. Returns the pitch multiplier
 * and gain to apply, or null when the source is out of earshot entirely.
 *
 * This is deliberately not a PannerNode. A full 3D panner per shot would mean allocating
 * and garbage-collecting a node graph sixty times a second during a firefight; two
 * numbers computed here cost nothing and are indistinguishable through a phone speaker.
 */
export function spatial(pos, vel) {
  if (!pos || !S.player) return { pitch: 1, gain: 1 };
  const p = S.player.position;
  const dx = pos.x - p.x, dy = pos.y - p.y, dz = pos.z - p.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist > AUDIO.earshot) return null;

  const gain = Math.max(0, 1 - dist / AUDIO.earshot);
  let pitch = 1;
  if (vel && dist > 1) {
    // Closing speed along the line between us, as a fraction of the notional speed of
    // sound. Positive closing raises the pitch.
    const inv = 1 / dist;
    const closing = -((vel.x - S.player.velocity.x) * dx +
                      (vel.y - S.player.velocity.y) * dy +
                      (vel.z - S.player.velocity.z) * dz) * inv;
    pitch = 1 + Math.max(-AUDIO.dopplerMax, Math.min(AUDIO.dopplerMax, closing / AUDIO.soundSpeed));
  }
  return { pitch, gain: gain * gain };     // squared, so falloff sounds like distance
}

export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

/**
 * Actually turn the sound off.
 *
 * `S.settings.audio` gated `tone()` and `noise()` — the things that start and stop — and
 * nothing else. The music bed is two oscillators that start once and run for the rest of
 * the session, so muting stopped new sounds and left a constant low drone playing
 * underneath. That is the "sound is off but it isn't off" you heard, and it was not the
 * engine hum: it was the bed's root note.
 *
 * The fix is to mute at the *master*, which everything routes through, and then suspend
 * the context so the oscillators stop being computed at all rather than merely being
 * multiplied by zero. Suspending matters on a phone — a silent oscillator still costs
 * battery.
 */
export function setAudioEnabled(on) {
  S.settings.audio = !!on;
  if (!ctx) return S.settings.audio;

  if (S.settings.audio) {
    if (ctx.state === 'suspended') ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(AUDIO.master, ctx.currentTime, 0.05);
  } else {
    master.gain.cancelScheduledValues(ctx.currentTime);
    // Ramp rather than cut: a hard zero on a running oscillator is an audible click, which
    // is a strange last thing to hear when you ask for silence.
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    setTimeout(() => {
      if (!S.settings.audio && ctx && ctx.state === 'running') ctx.suspend();
    }, 300);
  }
  return S.settings.audio;
}

export const audioEnabled = () => !!S.settings.audio;

/** True if anything is actually being computed. The diagnostics panel asks. */
export const audioRunning = () => !!(ctx && ctx.state === 'running');

function tone({ freq = 440, to = null, dur = 0.12, type = 'sine', gain = 1, delay = 0,
                bus = 'sfx', pitch = 1 }) {
  if (!ctx || !S.settings.audio) return;
  freq *= pitch;
  if (to) to *= pitch;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(busFor(bus));
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

function noise(dur = 0.3, gain = 0.5, bus = 'sfx') {
  if (!ctx || !S.settings.audio) return;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 900;
  g.gain.value = gain;
  src.buffer = buf;
  src.connect(f); f.connect(g); g.connect(busFor(bus));
  src.start();
}

export const sfx = {
  fire:      () => tone({ freq: 720, to: 240, dur: 0.09, type: 'square', gain: 0.35 }),
  fireHeavy: () => tone({ freq: 240, to: 70,  dur: 0.18, type: 'sawtooth', gain: 0.5 }),
  missile:   () => {
    noise(0.28, 0.55);
    tone({ freq: 180, to: 90, dur: 0.35, type: 'sawtooth', gain: 0.45 });
    tone({ freq: 420, to: 160, dur: 0.22, type: 'square', gain: 0.28, delay: 0.04 });
  },
  hit:       () => tone({ freq: 180, to: 90,  dur: 0.10, type: 'square', gain: 0.4 }),
  shieldHit: () => tone({ freq: 900, to: 520, dur: 0.14, type: 'sine', gain: 0.45 }),
  explode:   () => { noise(0.45, 0.6); tone({ freq: 120, to: 40, dur: 0.4, type: 'sawtooth', gain: 0.35 }); },
  mine:      () => tone({ freq: 130, to: 160, dur: 0.14, type: 'triangle', gain: 0.22 }),
  pickup:    () => { tone({ freq: 520, dur: 0.07, type: 'sine', gain: 0.4 }); tone({ freq: 780, dur: 0.09, type: 'sine', gain: 0.35, delay: 0.06 }); },
  warpSpool: () => tone({ freq: 90, to: 900, dur: 2.4, type: 'sine', gain: 0.28 }),
  warpDrop:  () => tone({ freq: 900, to: 80, dur: 0.6, type: 'sine', gain: 0.3 }),
  dock:      () => { tone({ freq: 330, dur: 0.12, type: 'triangle', gain: 0.35 }); tone({ freq: 440, dur: 0.16, type: 'triangle', gain: 0.3, delay: 0.11 }); },
  deny:      () => tone({ freq: 160, to: 110, dur: 0.14, type: 'square', gain: 0.3 }),
  ui:        () => tone({ freq: 620, dur: 0.05, type: 'sine', gain: 0.25 }),
  /**
   * One character of somebody talking.
   *
   * Quiet and *short* — 22 ms, a fifth the gain of a UI tap. It fires a few times a second
   * for a second or two at a time, and the difference between "a voice" and "an alarm" here
   * is entirely duration and level. `voice` picks a pitch off a scale rather than a random
   * offset, so a speaker sounds like a speaker instead of like interference; the same name
   * always produces the same number (see `voiceOf` in ui/typewriter.js).
   */
  type: (voice = 0) => {
    const scale = [1, 1.125, 1.25, 1.335, 1.5, 1.685, 1.875, 2];
    const base = 330 + (voice % 24) * 13;
    const f = base * scale[(voice * 5 + (Math.random() * 3 | 0)) % scale.length];
    tone({ freq: f, dur: 0.022, type: 'triangle', gain: 0.05 });
  },
  // Hostile lock-on alarm — short rising chirp, called on a timer while locked
  lockAlarm: () => {
    duck();
    tone({ freq: 880, to: 1400, dur: 0.12, type: 'square', gain: 0.32, bus: 'alert' });
    tone({ freq: 880, to: 1400, dur: 0.12, type: 'square', gain: 0.28, delay: 0.14, bus: 'alert' });
  },

  /**
   * A shot fired somewhere other than under your own nose. Distance and closing speed
   * decide how it sounds, and a shot out of earshot is not played at all — which is
   * also the cheapest possible optimisation, since a 63-ship system generates a lot of
   * gunfire you are nowhere near.
   */
  fireAt: (pos, vel, heavy) => {
    const sp = spatial(pos, vel);
    if (!sp) return;
    if (heavy) tone({ freq: 240, to: 70, dur: 0.18, type: 'sawtooth',
                      gain: 0.5 * sp.gain, pitch: sp.pitch });
    else tone({ freq: 720, to: 240, dur: 0.09, type: 'square',
                gain: 0.35 * sp.gain, pitch: sp.pitch });
  },

  explodeAt: (pos, vel) => {
    const sp = spatial(pos, vel);
    if (!sp) return;
    noise(0.45, 0.6 * sp.gain);
    tone({ freq: 120, to: 40, dur: 0.4, type: 'sawtooth', gain: 0.35 * sp.gain, pitch: sp.pitch });
  },

  alarm: (freq = 320) => {
    duck();
    tone({ freq, to: freq * 0.6, dur: 0.3, type: 'square', gain: 0.4, bus: 'alert' });
  }
};

// ── the engine ───────────────────────────────────────────────────────
//
// There was an `engine` bus in the mix table from the day the mix was written and **nothing
// ever connected to it**. What sounded like a constant engine hum was the music bed's root
// note (see `systems/platform/music.js` for what happened to that), and the ship — the one
// object in this game that is always with you and always doing something — was silent.
//
// So this is the engine, and the point of it is that it *moves*. Three layers, all driven
// by the throttle and the hull:
//
//   - a low sine that rises about a fifth from idle to full,
//   - filtered noise whose cutoff opens with power — the "air" of a drive under load,
//   - a faint harmonic that only comes in over half throttle, so opening up is audible.
//
// At zero throttle it settles to a barely-there idle rather than to silence, because a
// powered hull is never silent and a drive that cuts out completely reads as a stall.
// Reverse gets a slightly detuned, rougher version, which is free character.
//
// Everything is a `setTargetAtTime` glide. Stepping a filter cutoff per frame at 60 Hz is
// audible as zipper noise, and it is the classic way a synthesised engine ends up sounding
// like a modem.

let engine = null;

function startEngine() {
  if (engine || !ctx) return;
  const bus = busFor('engine');

  const g = ctx.createGain();
  g.gain.value = 0;
  g.connect(bus);

  const low = ctx.createOscillator();
  low.type = 'sine';
  low.frequency.value = AUDIO.engine.idleHz;
  const lowG = ctx.createGain();
  lowG.gain.value = 0.7;
  low.connect(lowG); lowG.connect(g);

  const harm = ctx.createOscillator();
  harm.type = 'triangle';
  harm.frequency.value = AUDIO.engine.idleHz * 3;
  harm.detune.value = 9;
  const harmG = ctx.createGain();
  harmG.gain.value = 0;
  harm.connect(harmG); harmG.connect(g);

  // Looping noise, band-limited. One two-second buffer rather than a stream, because a
  // drive is a texture and nobody can hear the loop point through a lowpass at 400 Hz.
  const n = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
  const air = ctx.createBufferSource();
  air.buffer = buf; air.loop = true;
  const airF = ctx.createBiquadFilter();
  airF.type = 'lowpass';
  airF.frequency.value = AUDIO.engine.airMinHz;
  airF.Q.value = 1.1;
  const airG = ctx.createGain();
  airG.gain.value = 0.34;
  air.connect(airF); airF.connect(airG); airG.connect(g);

  const t = ctx.currentTime;
  low.start(t); harm.start(t); air.start(t);
  engine = { g, low, lowG, harm, harmG, air, airF, airG, level: 0 };
  g.gain.setTargetAtTime(1, t, 0.8);
}

function stopEngine() {
  if (!engine || !ctx) return;
  const e = engine;
  engine = null;
  e.g.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
  setTimeout(() => {
    try { e.low.stop(); e.harm.stop(); e.air.stop(); } catch (err) { /* already stopped */ }
  }, 900);
}

/**
 * Follow the throttle.
 *
 * Called once per rendered frame from `updateAudio`. Reads the *commanded* throttle rather
 * than the achieved speed on purpose: an engine that responds to velocity lags the control
 * by seconds and feels broken, while one that responds to the lever is what a pilot expects
 * even though it is less physical.
 */
function updateEngine(dt) {
  if (!ctx) return;
  const docked = !!S.docked;
  const warping = S.warp && S.warp.state === 'warping';
  const want = !docked && S.running && S.settings.audio && !warping;
  if (want && !engine) startEngine();
  if (!want) { if (engine) stopEngine(); return; }
  if (!engine) return;

  const thr = Math.abs((S.player && S.player.throttle) || 0);
  const rev = ((S.player && S.player.throttle) || 0) < -0.02;
  // Smoothed in software as well as in the audio graph: the throttle can now jump five
  // percent at a time from the stepper buttons, and a filter that chases a step function
  // even over 90 ms is a click.
  engine.level += (thr - engine.level) * Math.min(1, dt * 3.5);
  const L = engine.level;
  const t = ctx.currentTime;
  const E = AUDIO.engine;

  const hz = E.idleHz + (E.fullHz - E.idleHz) * L;
  engine.low.frequency.setTargetAtTime(hz * (rev ? 0.86 : 1), t, 0.12);
  engine.harm.frequency.setTargetAtTime(hz * 3 * (rev ? 0.9 : 1), t, 0.14);
  // The harmonic only exists over half throttle. This is the layer that makes "opening up"
  // a thing you hear rather than a number you read.
  const harmAmt = Math.max(0, (L - 0.45) / 0.55);
  engine.harmG.gain.setTargetAtTime(harmAmt * 0.22, t, 0.2);

  engine.airF.frequency.setTargetAtTime(E.airMinHz + (E.airMaxHz - E.airMinHz) * L, t, 0.15);
  engine.airG.gain.setTargetAtTime(0.16 + L * 0.4, t, 0.15);
  engine.g.gain.setTargetAtTime(E.idleGain + (1 - E.idleGain) * L, t, 0.2);
}

/** What the drive is doing, for the diagnostics panel. */
export const engineReport = () => (engine
  ? { running: true, level: +engine.level.toFixed(3),
      hz: +(AUDIO.engine.idleHz + (AUDIO.engine.fullHz - AUDIO.engine.idleHz) * engine.level).toFixed(1) }
  : { running: false });

// ── music ────────────────────────────────────────────────────────────
//
// The bed itself lives in `systems/platform/music.js` — it is a generative instrument with
// a scheduler, and it is long enough to deserve its own file. What stays here is the public
// surface every caller already uses, so nothing outside had to learn a new name.

export function startMusic() {
  if (!ctx || bedRunning()) return null;
  if (!S.settings.audio) return null;   // do not start a bed that mute cannot reach yet
  return startBed(ctx, busFor('music'), moodFor());
}

export function stopMusic() { stopBed(); }

export const musicMood = () => bedMood();
export const musicReport = () => bedReport();

/** Move the bed to a new mood. Everything glides — see `music.js`. */
export function setMood(mood) { return moveBed(mood); }

/** Pick a mood from what the ship is doing. Called on a slow timer, not per frame. */
export function moodFor() {
  // `?? -99`, not `|| -99`: a hit recorded at exactly time zero is a real hit, and the
  // falsy-zero version reads it as "never been hit". Only reachable in the first second
  // of a flight, which is precisely the kind of bug that survives to release.
  if (S.player && S.time - (S.player.lastHit ?? -99) < 8) return 'combat';
  if (S.input && (S.input.firing || S.threat)) return 'tense';
  if (S.input && S.input.mining) return 'work';
  if (S.warp && S.warp.state !== 'idle') return 'work';
  return 'calm';
}

let moodT = 0;
export function updateAudio(dt) {
  if (!ctx) return;
  // The engine is per-frame; the mood is not. A bed that re-evaluated its mood sixty times
  // a second would still only change every few seconds, and would spend the rest of the
  // time comparing strings.
  updateEngine(dt);
  if (!bedRunning()) return;
  moodT += dt;
  if (moodT < 2.5) return;
  moodT = 0;
  setMood(moodFor());
}
