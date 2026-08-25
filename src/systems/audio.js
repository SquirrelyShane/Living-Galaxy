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

import { S } from '../core/state.js';
import { AUDIO } from '../core/config.js';

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

// ── music ────────────────────────────────────────────────────────────
// Not a soundtrack — a drone. Two detuned oscillators and a slow filter sweep, with the
// root note chosen by what is happening. It exists because thirty minutes of belt mining
// in total silence is a different experience from thirty minutes of belt mining, and
// because a generated bed costs a few hundred bytes where an audio file costs megabytes
// the game has spent seven slices not needing.

const MOODS = {
  calm:   { root: 55.0, fifth: 82.4, cutoff: 420, sweep: 0.05 },
  work:   { root: 61.7, fifth: 92.5, cutoff: 560, sweep: 0.08 },
  tense:  { root: 49.0, fifth: 73.4, cutoff: 300, sweep: 0.16 },
  combat: { root: 41.2, fifth: 61.7, cutoff: 780, sweep: 0.35 }
};

export function startMusic() {
  if (!ctx || music) return;
  if (!S.settings.audio) return;      // do not start a bed that mute cannot reach yet
  const g = ctx.createGain();
  g.gain.value = 0;
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = MOODS.calm.cutoff;
  filt.Q.value = 3;

  const a = ctx.createOscillator(), b = ctx.createOscillator();
  a.type = 'sawtooth'; b.type = 'sawtooth';
  a.frequency.value = MOODS.calm.root;
  b.frequency.value = MOODS.calm.fifth;
  b.detune.value = 7;                       // a few cents apart, so it beats slowly

  a.connect(filt); b.connect(filt);
  filt.connect(g); g.connect(busFor('music'));
  a.start(); b.start();

  music = { a, b, g, filt, mood: 'calm', t: 0 };
  g.gain.setTargetAtTime(0.5, ctx.currentTime, 3);
  return music;
}

export function stopMusic() {
  if (!music || !ctx) return;
  music.g.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
  const m = music;
  music = null;
  setTimeout(() => { try { m.a.stop(); m.b.stop(); } catch (e) { /* already stopped */ } }, 1400);
}

export const musicMood = () => (music ? music.mood : null);

/**
 * Move the bed to a new mood. Everything glides over seconds — a bed that cuts between
 * moods draws attention to itself, which is the one thing it must never do.
 */
export function setMood(mood) {
  if (!music || !ctx || !MOODS[mood] || music.mood === mood) return false;
  const m = MOODS[mood];
  const t = ctx.currentTime;
  music.a.frequency.setTargetAtTime(m.root, t, 1.6);
  music.b.frequency.setTargetAtTime(m.fifth, t, 1.6);
  music.filt.frequency.setTargetAtTime(m.cutoff, t, 2.2);
  music.mood = mood;
  return true;
}

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
  if (!ctx || !music) return;
  moodT += dt;
  if (moodT < 2.5) return;
  moodT = 0;
  setMood(moodFor());
}
