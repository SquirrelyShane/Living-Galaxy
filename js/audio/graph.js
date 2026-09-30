export const BUSES = ["ui", "world", "alert", "ambience", "engine"];

const DEFAULT_LEVELS = { ui: 0.55, world: 0.8, alert: 0.95, ambience: 0.6, engine: 0.5, master: 0.7 };
const LS_KEY = "lgaa.audio.mix";

const MAX_VOICES = 26;

let kit = null;
let muted = false;
let levels = { ...DEFAULT_LEVELS };
let voices = 0;

export const ROOT = 55;
const STEPS = [0, 2, 3, 5, 7, 8, 10];
export function degree(n, octave = 0) {
  const i = ((n % 7) + 7) % 7;
  const oct = octave + Math.floor(n / 7);
  return ROOT * Math.pow(2, oct + STEPS[i] / 12);
}
export const NOTE = {
  A0: ROOT / 2, A1: ROOT, A2: ROOT * 2, A3: ROOT * 4, A4: ROOT * 8,
  C2: degree(2, 1), D2: degree(3, 1), E2: degree(4, 1), F2: degree(5, 1), G2: degree(6, 1),
  C3: degree(2, 2), D3: degree(3, 2), E3: degree(4, 2), G3: degree(6, 2),
  C4: degree(2, 3), D4: degree(3, 3), E4: degree(4, 3),
};

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
      lp += (Math.random() * 2 - 1 - lp) * damp;
      d[i] = lp * env;
    }
    if (seconds < 2) {
      for (const [at, g] of [[0.011, 0.5], [0.019, 0.36], [0.029, 0.22]]) {
        const k = Math.floor(rate * (at + ch * 0.0013));
        if (k < len) d[k] += g;
      }
    }
  }
  return buf;
}

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
  try { localStorage.setItem(LS_KEY, JSON.stringify(levels)); } catch {}
}

export function ensureAudio() {
  if (typeof window === "undefined") return null;
  if (kit) return kit;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;

  const ctx = new AC({ latencyHint: "interactive" });
  levels = readMix();

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

export function claimVoice(priority = 0) {
  if (voices >= MAX_VOICES && priority < 2) return false;
  if (voices >= MAX_VOICES + 8) return false;
  voices++;
  return true;
}
export function releaseVoice() { voices = Math.max(0, voices - 1); }

export function toBus(node, busName, { room = 0, space = 0, stopAt = 0, sources = [] } = {}) {
  const k = ensureAudio();
  if (!k) return;
  const out = k.bus[busName] ?? k.bus.world;
  node.connect(out);
  if (room > 0) { const g = k.ctx.createGain(); g.gain.value = room; node.connect(g); g.connect(k.sends.room); tidy(g, stopAt); }
  if (space > 0) { const g = k.ctx.createGain(); g.gain.value = space; node.connect(g); g.connect(k.sends.space); tidy(g, stopAt); }
  tidy(node, stopAt);
  for (const s of sources) {
    try { s.stop(stopAt); } catch {}
  }
  if (stopAt > 0) {
    const ms = Math.max(0, (stopAt - k.ctx.currentTime) * 1000) + 260;
    setTimeout(() => {
      for (const s of sources) { try { s.disconnect(); } catch {} }
      releaseVoice();
    }, ms);
  }
}

function tidy(node, stopAt) {
  const k = kit;
  if (!k || stopAt <= 0) return;
  const ms = Math.max(0, (stopAt - k.ctx.currentTime) * 1000) + 300;
  setTimeout(() => { try { node.disconnect(); } catch {} }, ms);
}

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
      b0 = 0.99765 * b0 + w * 0.0990460;
      b1 = 0.96300 * b1 + w * 0.2965164;
      b2 = 0.57000 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
    }
  }
  return noiseBuf;
}

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
