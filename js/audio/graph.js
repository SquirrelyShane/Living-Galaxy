/* LIVING GALAXY — the audio graph.
 *
 * One AudioContext, five named buses, two reverbs and a limiter. Nothing is
 * loaded: every sound in the game is synthesised at the moment it plays, the
 * same way every hull and every world is. That is not purity for its own
 * sake — it means a new cue costs a few lines instead of a wav file, the
 * whole kit survives being served off a phone, and a sound can be tuned by
 * the thing that triggered it (how hard the rock hit, how far off the lane
 * you are) rather than picked from a handful of takes.
 *
 * The palette is Interstellar's, which is a narrow one on purpose: pipe
 * organ, sub-bass, air, wood and metal. No bright digital beeps anywhere —
 * the thing being replaced was one loud sine doing twenty different jobs.
 *
 *   BUSES   ui · world · alert · ambience · engine
 *   SENDS   room (0.9 s) · space (4.6 s)
 *   MASTER  → limiter → destination
 */

export const BUSES = ["ui", "world", "alert", "ambience", "engine"];

/* Defaults chosen so the bed sits under everything and an alert cuts. */
const DEFAULT_LEVELS = { ui: 0.55, world: 0.8, alert: 0.95, ambience: 0.6, engine: 0.5, master: 0.7 };
const LS_KEY = "lgaa.audio.mix";

/* A hard ceiling on simultaneous synthesised voices. A phone that is already
 * drawing a sky does not have the headroom for fifty oscillators, and past
 * about this many nobody can hear the difference anyway. */
const MAX_VOICES = 26;

let kit = null;
let muted = false;
let levels = { ...DEFAULT_LEVELS };
let voices = 0;

/* ---- tuning -------------------------------------------------------------
 * Every pitched sound in the game comes out of one scale, so a cue can never
 * clash with the bed underneath it. A natural minor on A: no major third
 * anywhere, which is most of why the palette reads as cold rather than
 * cheerful.
 */
export const ROOT = 55;                                  // A1
const STEPS = [0, 2, 3, 5, 7, 8, 10];                    // aeolian
export function degree(n, octave = 0) {
  const i = ((n % 7) + 7) % 7;
  const oct = octave + Math.floor(n / 7);
  return ROOT * Math.pow(2, oct + STEPS[i] / 12);
}
/** Named handles for the notes cues actually use. */
export const NOTE = {
  A0: ROOT / 2, A1: ROOT, A2: ROOT * 2, A3: ROOT * 4, A4: ROOT * 8,
  C2: degree(2, 1), D2: degree(3, 1), E2: degree(4, 1), F2: degree(5, 1), G2: degree(6, 1),
  C3: degree(2, 2), D3: degree(3, 2), E3: degree(4, 2), G3: degree(6, 2),
  C4: degree(2, 3), D4: degree(3, 3), E4: degree(4, 3),
};

/* ---- reverb -------------------------------------------------------------
 * Two impulse responses, generated rather than loaded. Noise under an
 * exponential decay is a crude reverb and an entirely convincing one at this
 * scale; the only refinements that matter are a little stereo decorrelation
 * so it opens up, and rolling the top off the tail so it does not hiss.
 */
function impulse(ctx, seconds, decay, damp) {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, decay);
      /* one-pole low pass over the noise: the tail darkens as it dies, the
       * way a real room does */
      lp += (Math.random() * 2 - 1 - lp) * damp;
      d[i] = lp * env;
    }
    /* a couple of early reflections give the short room a size */
    if (seconds < 2) {
      for (const [at, g] of [[0.011, 0.5], [0.019, 0.36], [0.029, 0.22]]) {
        const k = Math.floor(rate * (at + ch * 0.0013));
        if (k < len) d[k] += g;
      }
    }
  }
  return buf;
}

/* ---- the kit ------------------------------------------------------------ */

function readMix() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_LEVELS };
    const got = JSON.parse(raw);
    const out = { ...DEFAULT_LEVELS };
    for (const k of Object.keys(out)) if (typeof got?.[k] === "number") out[k] = Math.max(0, Math.min(1, got[k]));
    return out;
  } catch { return { ...DEFAULT_LEVELS }; }
}

function writeMix() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(levels)); } catch { /* private mode */ }
}

export function ensureAudio() {
  if (typeof window === "undefined") return null;
  if (kit) return kit;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;

  const ctx = new AC({ latencyHint: "interactive" });
  levels = readMix();

  /* A limiter, not a compressor doing limiter duty: a hard knee up near 0 dB
   * so a burst of cues on top of the bed never clips, and nothing below it is
   * touched. The old kit had no protection at all, which is part of why one
   * tone read as "loud". */
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.16;

  const master = ctx.createGain();
  master.gain.value = muted ? 0 : levels.master;

  const room = ctx.createConvolver();
  room.buffer = impulse(ctx, 0.9, 2.4, 0.35);
  const space = ctx.createConvolver();
  space.buffer = impulse(ctx, 4.6, 2.0, 0.18);

  const roomSend = ctx.createGain(); roomSend.gain.value = 1;
  const spaceSend = ctx.createGain(); spaceSend.gain.value = 1;
  const roomOut = ctx.createGain(); roomOut.gain.value = 0.5;
  const spaceOut = ctx.createGain(); spaceOut.gain.value = 0.42;

  roomSend.connect(room); room.connect(roomOut); roomOut.connect(master);
  spaceSend.connect(space); space.connect(spaceOut); spaceOut.connect(master);

  const bus = {};
  const duckGain = {};
  for (const name of BUSES) {
    const g = ctx.createGain();
    g.gain.value = levels[name];
    /* Ducking rides on its own node so the player's level and the duck never
     * fight over the same AudioParam — the old single-gain approach is how
     * you end up with a bus stuck at 30% after an alert. */
    const d = ctx.createGain();
    d.gain.value = 1;
    g.connect(d);
    d.connect(master);
    bus[name] = g;
    duckGain[name] = d;
  }

  master.connect(limiter);
  limiter.connect(ctx.destination);

  kit = { ctx, master, limiter, bus, duckGain, sends: { room: roomSend, space: spaceSend }, roomOut, spaceOut };
  return kit;
}

export const audio = {
  get ctx() { return kit?.ctx ?? null; },
  get ready() { return Boolean(kit) && kit.ctx.state === "running"; },
  get muted() { return muted; },
  get voices() { return voices; },
};

export function busNode(name) {
  const k = ensureAudio();
  return k ? (k.bus[name] ?? k.bus.world) : null;
}
export function sendNode(which) {
  const k = ensureAudio();
  return k ? k.sends[which] ?? null : null;
}
export function now() {
  const k = ensureAudio();
  return k ? k.ctx.currentTime : 0;
}

/* ---- mix ---------------------------------------------------------------- */

export function setMuted(v) {
  muted = Boolean(v);
  if (!kit) return;
  kit.master.gain.setTargetAtTime(muted ? 0 : levels.master, kit.ctx.currentTime, 0.05);
}

export function setBusLevel(name, value) {
  const v = Math.max(0, Math.min(1, Number(value) || 0));
  if (!(name in levels)) return;
  levels[name] = v;
  writeMix();
  if (!kit) return;
  const t = kit.ctx.currentTime;
  if (name === "master") { if (!muted) kit.master.gain.setTargetAtTime(v, t, 0.04); }
  else kit.bus[name]?.gain.setTargetAtTime(v, t, 0.04);
}

export function busLevels() { return { ...levels }; }
export function resetMix() { for (const k of Object.keys(DEFAULT_LEVELS)) setBusLevel(k, DEFAULT_LEVELS[k]); }

/**
 * Pull everything except alerts down for a moment. A warning that arrives
 * under a full engine bed and a station hum is a warning nobody hears, and
 * turning the alert up instead is how you get the thing being replaced here.
 */
export function duck(depth = 0.45, holdMs = 700) {
  const k = kit;
  if (!k) return;
  const t = k.ctx.currentTime;
  const d = Math.max(0, Math.min(1, depth));
  for (const name of BUSES) {
    if (name === "alert") continue;
    const g = k.duckGain[name].gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(1 - d, t, 0.03);
    g.setTargetAtTime(1, t + holdMs / 1000, 0.22);
  }
}

/* ---- voices -------------------------------------------------------------
 * A claim/release pair rather than a pool of pre-built nodes: Web Audio
 * sources are single-use by design, so pooling them buys nothing. What is
 * worth having is the cap and the priority, so a click cannot starve an
 * alarm.
 */
export function claimVoice(priority = 0) {
  if (voices >= MAX_VOICES && priority < 2) return false;
  if (voices >= MAX_VOICES + 8) return false;      // even alerts have a ceiling
  voices++;
  return true;
}
export function releaseVoice() { voices = Math.max(0, voices - 1); }

/**
 * Wire a voice's output and schedule its own teardown. Everything that makes
 * a sound goes through here, which is the only reason the node count comes
 * back down: a forgotten disconnect in a game that plays a cue per tap is a
 * leak with a stopwatch on it.
 */
export function toBus(node, busName, { room = 0, space = 0, stopAt = 0, sources = [] } = {}) {
  const k = ensureAudio();
  if (!k) return;
  const out = k.bus[busName] ?? k.bus.world;
  node.connect(out);
  if (room > 0) { const g = k.ctx.createGain(); g.gain.value = room; node.connect(g); g.connect(k.sends.room); tidy(g, stopAt); }
  if (space > 0) { const g = k.ctx.createGain(); g.gain.value = space; node.connect(g); g.connect(k.sends.space); tidy(g, stopAt); }
  tidy(node, stopAt);
  for (const s of sources) {
    try { s.stop(stopAt); } catch { /* already stopped */ }
  }
  if (stopAt > 0) {
    const ms = Math.max(0, (stopAt - k.ctx.currentTime) * 1000) + 260;
    setTimeout(() => {
      for (const s of sources) { try { s.disconnect(); } catch { /* gone */ } }
      releaseVoice();
    }, ms);
  }
}

function tidy(node, stopAt) {
  const k = kit;
  if (!k || stopAt <= 0) return;
  const ms = Math.max(0, (stopAt - k.ctx.currentTime) * 1000) + 300;
  setTimeout(() => { try { node.disconnect(); } catch { /* gone */ } }, ms);
}

/* ---- noise --------------------------------------------------------------
 * One shared noise buffer. Air, hull rumble, thruster wash, metal strikes
 * and the reverb tails all start life here, so it is built once and looped
 * rather than allocated per cue.
 */
let noiseBuf = null;
export function noiseBuffer() {
  const k = ensureAudio();
  if (!k) return null;
  if (noiseBuf && noiseBuf.sampleRate === k.ctx.sampleRate) return noiseBuf;
  const len = Math.floor(k.ctx.sampleRate * 2.5);
  noiseBuf = k.ctx.createBuffer(2, len, k.ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = noiseBuf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      /* Pinked: white noise reads as hiss, and there is no hiss anywhere in
       * this palette. Cheap three-pole approximation. */
      b0 = 0.99765 * b0 + w * 0.0990460;
      b1 = 0.96300 * b1 + w * 0.2965164;
      b2 = 0.57000 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
    }
  }
  return noiseBuf;
}

/* ---- lifecycle ---------------------------------------------------------- */

let resuming = false;
export function unlock() {
  const k = ensureAudio();
  if (!k) return;
  if (k.ctx.state === "suspended") void k.ctx.resume();
}
export function resumeIfNeeded() {
  const k = kit;
  if (!k || resuming) return;
  if (k.ctx.state === "suspended") {
    resuming = true;
    const done = () => { resuming = false; };
    try { k.ctx.resume().then(done, done); } catch { resuming = false; }
  }
}

/** Tests and the audition lab drive an OfflineAudioContext through here. */
export function _installContext(ctx) {
  kit = null;
  voices = 0;
  const saved = { ...levels };
  const AC = function () { return ctx; };
  const w = typeof window !== "undefined" ? window : null;
  if (!w) return null;
  const prev = w.AudioContext;
  w.AudioContext = AC;
  const k = ensureAudio();
  w.AudioContext = prev;
  levels = saved;
  return k;
}
export function _teardown() { kit = null; voices = 0; noiseBuf = null; }
