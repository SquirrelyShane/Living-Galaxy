// Living Galaxy — the ambient bed. Generated, not a file; music, not a drone.
//
// ## What was wrong with the drone
//
// The bed was two detuned sawtooth oscillators at 55 Hz and 82.4 Hz through a lowpass,
// started once and left running for the session. It was doing exactly what it was written
// to do, and what it sounded like was **a constant loud engine hum**. That is not a mixing
// problem you can solve with a fader: an unchanging low sawtooth is the sound a machine
// makes, and a bed that never moves stops being heard as music within about ninety seconds
// and starts being heard as a fault.
//
// ## What replaced it
//
// Four layers, all generated from oscillators, all moving:
//
//   - **Pad** — three voices on a chord, slowly detuning against each other, through a
//     filter that breathes on a slow LFO. This is the only layer that is continuous, and
//     even it is never static.
//   - **Motif** — sparse bell notes from a pentatonic scale, scheduled a bar or two ahead,
//     with rests. Pentatonic because every note in it consonates with every other, so a
//     generator cannot produce a wrong note — which is the whole trick to generative music
//     that does not need a composer watching it.
//   - **Bass** — a soft sine root, once a phrase, an octave or two under the pad.
//   - **Air** — filtered noise at the edge of audibility, so silence between notes is a
//     room rather than a hole.
//
// Everything goes through a generated reverb: a decaying-noise impulse response built once
// into a ConvolverNode. Reverb is the single biggest difference between "oscillators" and
// "music", and it costs one buffer.
//
// ## Why a lookahead scheduler
//
// Notes are scheduled against `AudioContext.currentTime`, ahead of when they sound, on a
// timer that runs every 120 ms and books everything due in the next 400 ms. Scheduling a
// note *when* it should play — from a frame callback, say — puts every attack at the mercy
// of a frame that ran long, and a bell that arrives four milliseconds late is audible in a
// way a dropped frame is not. This is the standard Web Audio pattern and there is no other
// correct one.
//
// ## Moods
//
// A mood changes the chord, the scale, the density of notes and the filter, and it *glides*
// — a bed that cuts between states draws attention to itself, which is the one thing it may
// never do. `moodFor()` in `audio.js` decides which mood; this file only knows how to be in
// one.

import { AUDIO } from '../../core/config.js';

/**
 * The moods.
 *
 * Frequencies are written as ratios against a root rather than as note names, because the
 * root moves and a table of absolute frequencies would have to be rewritten to transpose.
 * `density` is the chance a given step gets a note — the rests are as much of the character
 * as the notes are.
 */
const MOODS = {
  calm: {
    root: 110,                                  // A2
    chord: [1, 1.5, 2.245],                     // root, fifth, minor seventh-ish
    scale: [1, 1.125, 1.335, 1.5, 1.78, 2],     // minor pentatonic + second
    cutoff: 520, q: 2.2, sweep: 0.035,
    step: 1.7, density: 0.34, octave: 4,
    padGain: 0.30, motifGain: 0.20, bassGain: 0.16, airGain: 0.05
  },
  work: {
    root: 123.5,                                // B2
    chord: [1, 1.335, 2],
    scale: [1, 1.125, 1.335, 1.5, 1.685, 2],
    cutoff: 720, q: 2.6, sweep: 0.06,
    step: 1.15, density: 0.48, octave: 4,
    padGain: 0.26, motifGain: 0.24, bassGain: 0.18, airGain: 0.06
  },
  tense: {
    root: 98,                                   // G2
    chord: [1, 1.19, 1.5],                      // a minor third in the middle — unresolved
    scale: [1, 1.06, 1.19, 1.5, 1.6, 2],
    cutoff: 380, q: 4.0, sweep: 0.11,
    step: 1.4, density: 0.30, octave: 3,
    padGain: 0.34, motifGain: 0.17, bassGain: 0.22, airGain: 0.08
  },
  combat: {
    root: 82.4,                                 // E2
    chord: [1, 1.19, 1.414],                    // tritone at the top — the only harsh one
    scale: [1, 1.06, 1.19, 1.414, 1.5, 2],
    cutoff: 900, q: 3.2, sweep: 0.22,
    step: 0.62, density: 0.62, octave: 3,
    padGain: 0.24, motifGain: 0.30, bassGain: 0.30, airGain: 0.10
  }
};

export const MOOD_KEYS = Object.keys(MOODS);

const LOOKAHEAD_MS = 120;      // how often the scheduler wakes
const HORIZON = 0.4;           // how far ahead it books, in seconds

let ctx = null, out = null;
let bed = null;
let timer = 0;
let rngState = 0x2f6e2b1;

/** A small deterministic stream, so a session's music is reproducible when it needs to be. */
function rnd() {
  rngState ^= rngState << 13; rngState >>>= 0;
  rngState ^= rngState >> 17;
  rngState ^= rngState << 5; rngState >>>= 0;
  return rngState / 4294967296;
}

/**
 * A reverb impulse: decaying noise, stereo, built once.
 *
 * Two channels with independent noise so the tail is wide rather than a mono blob in the
 * middle of the head. `decay` shapes the curve — a straight exponential sounds like a
 * gate, so it is raised to a power to lengthen the tail's quiet end, which is where the
 * sense of size actually lives.
 */
function impulse(seconds = 3.4, decay = 2.6) {
  const rate = ctx.sampleRate;
  const n = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, n, rate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < n; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
  }
  return buf;
}

/**
 * Start the bed.
 *
 * @param {AudioContext} audioCtx
 * @param {AudioNode} destination the music bus
 */
export function startBed(audioCtx, destination, mood = 'calm') {
  if (bed || !audioCtx || !destination) return bed;
  ctx = audioCtx;
  out = destination;
  const m = MOODS[mood] || MOODS.calm;
  const t = ctx.currentTime;

  // ── the graph ──
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(out);

  const dry = ctx.createGain();
  dry.gain.value = 0.62;
  dry.connect(master);

  const wet = ctx.createGain();
  wet.gain.value = 0.58;
  let verb = null;
  // A ConvolverNode is not universal and a browser without one must still get music, so
  // the wet path degrades to a plain send rather than the whole bed failing to start.
  if (typeof ctx.createConvolver === 'function') {
    verb = ctx.createConvolver();
    try { verb.buffer = impulse(); } catch (e) { verb = null; }
  }
  if (verb) { verb.connect(wet); wet.connect(master); }
  else { wet.gain.value = 0; }

  const send = node => { node.connect(dry); if (verb) node.connect(verb); };

  // ── pad: three voices, one filter, one slow breath ──
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = m.cutoff;
  padFilter.Q.value = m.q;
  const padGain = ctx.createGain();
  padGain.gain.value = m.padGain;
  padFilter.connect(padGain);
  send(padGain);

  const voices = m.chord.map((ratio, i) => {
    const o = ctx.createOscillator();
    o.type = i === 0 ? 'triangle' : 'sine';
    o.frequency.value = m.root * ratio * 2;
    // Each voice a few cents off, in a different direction, so they beat against each other
    // instead of phasing as one. This is what stops three sine waves sounding like one.
    o.detune.value = (i - 1) * 6 + (rnd() - 0.5) * 5;
    o.connect(padFilter);
    o.start(t);
    return o;
  });

  // The breath: an LFO on the pad filter. Slow enough that you notice it has moved rather
  // than hearing it move, which is the difference between atmosphere and a wobble effect.
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = m.sweep;
  lfoGain.gain.value = m.cutoff * 0.45;
  lfo.connect(lfoGain);
  lfoGain.connect(padFilter.frequency);
  lfo.start(t);

  // ── air: filtered noise, barely there ──
  let air = null, airGain = null;
  {
    const n = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    air = ctx.createBufferSource();
    air.buffer = buf;
    air.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 780;
    bp.Q.value = 0.7;
    airGain = ctx.createGain();
    airGain.gain.value = m.airGain;
    air.connect(bp); bp.connect(airGain);
    send(airGain);
    air.start(t);
  }

  bed = {
    master, dry, wet, verb, padFilter, padGain, voices, lfo, lfoGain, air, airGain,
    mood, m, nextNote: t + 0.5, step: 0, send
  };

  // Long fade in. Two and a half seconds, because the bed arriving is not an event.
  master.gain.setTargetAtTime(1, t, 2.5);
  schedule();
  timer = setInterval(schedule, LOOKAHEAD_MS);
  return bed;
}

export function stopBed() {
  if (!bed || !ctx) return;
  const t = ctx.currentTime;
  bed.master.gain.setTargetAtTime(0, t, 0.7);
  const b = bed;
  bed = null;
  if (timer) { clearInterval(timer); timer = 0; }
  setTimeout(() => {
    try {
      for (const v of b.voices) v.stop();
      b.lfo.stop();
      if (b.air) b.air.stop();
    } catch (e) { /* already stopped */ }
  }, 1600);
}

export const bedRunning = () => !!bed;
export const bedMood = () => (bed ? bed.mood : null);

/** Glide to another mood. Nothing here jumps. */
export function moveBed(mood) {
  if (!bed || !ctx || !MOODS[mood] || bed.mood === mood) return false;
  const m = MOODS[mood];
  const t = ctx.currentTime;
  bed.voices.forEach((o, i) => {
    o.frequency.setTargetAtTime(m.root * m.chord[i % m.chord.length] * 2, t, 2.0);
  });
  bed.padFilter.frequency.setTargetAtTime(m.cutoff, t, 2.4);
  bed.padFilter.Q.setTargetAtTime(m.q, t, 2.0);
  bed.padGain.gain.setTargetAtTime(m.padGain, t, 2.0);
  bed.lfo.frequency.setTargetAtTime(m.sweep, t, 3.0);
  bed.lfoGain.gain.setTargetAtTime(m.cutoff * 0.45, t, 3.0);
  if (bed.airGain) bed.airGain.gain.setTargetAtTime(m.airGain, t, 2.0);
  bed.mood = mood;
  bed.m = m;
  return true;
}

// ── the scheduler ────────────────────────────────────────────────────

function schedule() {
  if (!bed || !ctx) return;
  const m = bed.m;
  const until = ctx.currentTime + HORIZON;
  // A bounded loop, not a `while (true)`: a tab that was backgrounded for a minute comes
  // back with `currentTime` a minute ahead, and an unbounded catch-up would book a minute
  // of notes in one go and play them all at once.
  let guard = 0;
  while (bed.nextNote < until && guard++ < 16) {
    step(bed.nextNote, m);
    bed.nextNote += m.step;
    bed.step++;
  }
  // If the horizon ran away from us entirely, resync rather than crawl.
  if (bed.nextNote < ctx.currentTime) bed.nextNote = ctx.currentTime + 0.2;
}

function step(at, m) {
  // Bass on the phrase, every eight steps. It is what makes a sequence of bells feel like
  // it is in a key rather than floating.
  if (bed.step % 8 === 0) bass(at, m);
  if (rnd() > m.density) return;                       // a rest is a decision
  const degree = m.scale[Math.floor(rnd() * m.scale.length)];
  const oct = m.octave + (rnd() < 0.22 ? 1 : 0);
  bell(at, m.root * degree * Math.pow(2, oct - 3), m.motifGain * (0.6 + rnd() * 0.5), m);
}

/**
 * One bell. A sine with a fast attack and a long exponential tail, plus a quiet octave
 * above it — that second partial is the entire difference between "a sine" and "a note".
 */
function bell(at, freq, gain, m) {
  const dur = 2.2 + rnd() * 1.8;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g);
  bed.send(g);
  o.start(at);
  o.stop(at + dur + 0.05);

  const o2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  o2.type = 'sine';
  o2.frequency.setValueAtTime(freq * 2.01, at);        // slightly sharp, so it shimmers
  g2.gain.setValueAtTime(0.0001, at);
  g2.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * 0.3), at + 0.015);
  g2.gain.exponentialRampToValueAtTime(0.0001, at + dur * 0.6);
  o2.connect(g2);
  bed.send(g2);
  o2.start(at);
  o2.stop(at + dur * 0.6 + 0.05);
}

function bass(at, m) {
  const dur = m.step * 6;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 220;
  o.type = 'sine';
  o.frequency.setValueAtTime(m.root * 0.5, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, m.bassGain), at + 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(f); f.connect(g);
  bed.send(g);
  o.start(at);
  o.stop(at + dur + 0.05);
}

/** What the bed is doing. Diagnostics, and the settings panel. */
export function bedReport() {
  if (!bed) return { running: false };
  return {
    running: true,
    mood: bed.mood,
    reverb: !!bed.verb,
    voices: bed.voices.length,
    step: bed.step,
    stepSeconds: bed.m.step,
    density: bed.m.density
  };
}

/** For the suite: what a mood declares. */
export const moodSpec = k => MOODS[k] || null;

/** Reset the note stream. Between suites, and on a new game. */
export function reseedMusic(seed) {
  rngState = (seed >>> 0) || 0x2f6e2b1;
}

export const musicBusLevel = () => (AUDIO.buses.music || 0);
