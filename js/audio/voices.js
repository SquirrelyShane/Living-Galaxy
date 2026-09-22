/* LIVING GALAXY — synthesis voices.
 *
 * Six primitives, and every sound in the game is made of them. They are the
 * Interstellar palette taken literally: a pipe organ, a sub, moving air,
 * struck metal, knocked wood, and a bowed swell. There is deliberately no
 * "beep" in here — if a cue needs to say something short and bright it says
 * it with a wooden knock or an organ chiff, because the moment a sine beep
 * exists somebody reaches for it.
 *
 * Everything takes an absolute start time so a cue can lay its parts out in
 * a line, and everything routes through toBus() so the node graph comes back
 * down afterwards.
 */

import { ensureAudio, toBus, claimVoice, releaseVoice, noiseBuffer } from "./graph.js";

const env = (g, t, { attack = 0.01, hold = 0, decay = 0.4, peak = 0.2, curve = "exp" }) => {
  const floor = 0.00012;
  g.gain.setValueAtTime(floor, t);
  if (curve === "lin") g.gain.linearRampToValueAtTime(peak, t + attack);
  else g.gain.exponentialRampToValueAtTime(Math.max(floor, peak), t + attack);
  const sustainEnd = t + attack + hold;
  if (hold > 0) g.gain.setValueAtTime(Math.max(floor, peak), sustainEnd);
  g.gain.exponentialRampToValueAtTime(floor, sustainEnd + decay);
  return sustainEnd + decay;
};

/* ---- 1. organ -----------------------------------------------------------
 * A drawbar stack: the fundamental plus a chosen set of harmonics, each its
 * own sine, lightly detuned against each other so the thing breathes. The
 * chiff — the puff of wind before a pipe speaks — is what stops it sounding
 * like a synth pad, so it is not optional here.
 */
export function organ(freq, {
  at = 0, dur = 1.6, gain = 0.12, bus = "world",
  harmonics = [1, 2, 3, 4, 6, 8], tilt = 1.5,
  attack = 0.06, chiff = 0.5, detune = 4,
  room = 0.18, space = 0.3, pan = 0,
} = {}) {
  const k = ensureAudio();
  if (!k || !claimVoice(1)) return 0;
  const ctx = k.ctx;
  const t = at || ctx.currentTime;

  const out = ctx.createGain();
  out.gain.value = 1;
  const panner = pan !== 0 && ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  if (panner) { panner.pan.value = Math.max(-1, Math.min(1, pan)); out.connect(panner); }

  const g = ctx.createGain();
  const end = env(g, t, { attack, hold: Math.max(0, dur - attack - 0.3), decay: Math.max(0.12, dur * 0.45), peak: gain });
  g.connect(out);

  /* Normalised: without this, `gain` means "the fundamental" and the real
   * peak is whatever the harmonic stack happens to add on top — which made a
   * six-harmonic organ twice as loud as a three-harmonic one at the same
   * nominal setting, and made every cue gain in the library a guess. */
  const weight = harmonics.reduce((a, h) => a + 1 / Math.pow(h, tilt), 0) || 1;
  const sources = [];
  harmonics.forEach((h, i) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq * h;
    o.detune.value = (i % 2 ? 1 : -1) * detune * (0.5 + i * 0.35);
    const hg = ctx.createGain();
    hg.gain.value = (1 / Math.pow(h, tilt)) / weight;
    o.connect(hg);
    hg.connect(g);
    o.start(t);
    sources.push(o);
  });

  /* the chiff: a breath of filtered air on the attack only */
  if (chiff > 0) {
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer();
    n.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = Math.min(7000, freq * 7);
    bp.Q.value = 1.1;
    const ng = ctx.createGain();
    env(ng, t, { attack: 0.006, decay: 0.09 + attack, peak: gain * chiff * 0.5 });
    n.connect(bp); bp.connect(ng); ng.connect(g);
    n.start(t);
    sources.push(n);
  }

  toBus(panner ?? out, bus, { room, space, stopAt: end + 0.1, sources });
  return end;
}

/** A chord, laid as one call. Voices are staggered slightly, as a real hand is. */
export function chord(freqs, opts = {}) {
  let end = 0;
  const spread = opts.spread ?? 0.03;
  const k = ensureAudio();
  const base = opts.at || (k ? k.ctx.currentTime : 0);
  freqs.forEach((f, i) => {
    end = Math.max(end, organ(f, { ...opts, at: base + i * spread, gain: (opts.gain ?? 0.1) / Math.sqrt(freqs.length) }));
  });
  return end;
}

/* ---- 2. sub -------------------------------------------------------------
 * The floor of the whole mix. A sine an octave or two under everything else,
 * with a slow envelope — this is what gives a warp jump or an impact its
 * weight, and it is felt more than heard on a phone speaker, which is fine:
 * it still shapes how loud everything above it seems.
 */
export function sub(freq, { at = 0, dur = 1.4, gain = 0.3, bus = "world", slideTo = 0, attack = 0.03, space = 0.1 } = {}) {
  const k = ensureAudio();
  if (!k || !claimVoice(1)) return 0;
  const ctx = k.ctx;
  const t = at || ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, t);
  if (slideTo > 0) o.frequency.exponentialRampToValueAtTime(Math.max(8, slideTo), t + dur * 0.9);
  const g = ctx.createGain();
  const end = env(g, t, { attack, hold: dur * 0.25, decay: dur * 0.75, peak: gain });
  o.connect(g);
  o.start(t);
  toBus(g, bus, { space, stopAt: end + 0.1, sources: [o] });
  return end;
}

/* ---- 3. air -------------------------------------------------------------
 * Filtered noise. Hull wash, thruster breath, atmosphere, the rush under a
 * warp. The filter sweep is the whole character — static noise is a hiss,
 * moving noise is weather.
 */
export function air({
  at = 0, dur = 1.2, gain = 0.09, bus = "world",
  from = 300, to = 1200, q = 0.9, type = "bandpass",
  attack = 0.2, room = 0.1, space = 0.25,
} = {}) {
  const k = ensureAudio();
  if (!k || !claimVoice(0)) return 0;
  const ctx = k.ctx;
  const t = at || ctx.currentTime;
  const n = ctx.createBufferSource();
  n.buffer = noiseBuffer();
  n.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(Math.max(20, from), t);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
  const g = ctx.createGain();
  /* Pink noise through a band pass measures well under a sine at the same
   * nominal gain; this is the trim that puts them on the same scale. */
  const end = env(g, t, { attack, hold: Math.max(0, dur - attack - 0.2), decay: Math.max(0.15, dur * 0.4), peak: gain * 2.1, curve: "lin" });
  n.connect(f); f.connect(g);
  n.start(t);
  toBus(g, bus, { room, space, stopAt: end + 0.1, sources: [n] });
  return end;
}

/* ---- 4. metal -----------------------------------------------------------
 * A struck plate: a noise burst through a bank of sharp resonant bands whose
 * ratios are deliberately inharmonic. Clamps, hull strikes, the docking
 * clunk. Ratios are not integer multiples, which is the difference between
 * metal and a bell.
 */
/* Inharmonic ratios — integer multiples would be a bell, and a bell is the
 * one thing a hull strike must not sound like.
 *
 * MAKEUP is measured, not guessed: a bank of high-Q bandpass filters passes a
 * tiny slice of broadband noise, so the raw output of this voice came back at
 * half a percent of its nominal gain. tools/audiobake.mjs prints the number
 * these are trimmed against. */
const PLATE = [1, 1.61, 2.29, 3.11, 4.03];
const METAL_MAKEUP = 55;
export function metal(freq, { at = 0, dur = 0.7, gain = 0.16, bus = "world", bright = 1, room = 0.3, space = 0.2 } = {}) {
  const k = ensureAudio();
  if (!k || !claimVoice(1)) return 0;
  const ctx = k.ctx;
  const t = at || ctx.currentTime;
  const n = ctx.createBufferSource();
  n.buffer = noiseBuffer();
  const g = ctx.createGain();
  const end = env(g, t, { attack: 0.002, decay: dur, peak: gain, curve: "lin" });
  const mix = ctx.createGain();
  mix.gain.value = METAL_MAKEUP / PLATE.length;
  PLATE.forEach((r, i) => {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = Math.min(12000, freq * r * bright);
    bp.Q.value = 7 + i * 5;
    const bg = ctx.createGain();
    bg.gain.value = 1 / (1 + i * 0.7);
    n.connect(bp); bp.connect(bg); bg.connect(mix);
  });
  mix.connect(g);
  n.start(t);
  toBus(g, bus, { room, space, stopAt: end + 0.1, sources: [n] });
  return end;
}

/* ---- 5. wood ------------------------------------------------------------
 * The click. A very short pitched thud with almost no tail — this is what a
 * button press is, instead of a beep. Two of them a few milliseconds apart
 * reads as a switch throwing.
 */
/* A 1.8 ms attack sounds right on paper and measured at nine percent of
 * nominal: at these pitches the envelope had already fallen most of the way
 * before the waveform reached its first peak. 4 ms is still a click. */
const WOOD_MAKEUP = 3.9;
export function wood(freq = 220, { at = 0, gain = 0.13, bus = "ui", dur = 0.09, room = 0.12 } = {}) {
  const k = ensureAudio();
  if (!k || !claimVoice(0)) return 0;
  const ctx = k.ctx;
  const t = at || ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(freq * 1.9, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.85), t + 0.035);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = Math.min(6000, freq * 9);
  const g = ctx.createGain();
  const end = env(g, t, { attack: 0.004, decay: dur, peak: gain * WOOD_MAKEUP, curve: "lin" });
  o.connect(lp); lp.connect(g);
  o.start(t);
  toBus(g, bus, { room, stopAt: end + 0.06, sources: [o] });
  return end;
}

/* ---- 6. swell -----------------------------------------------------------
 * A bowed string-ish rise: two saws through a moving low pass, slow in and
 * slow out. Used where something is building — a warp spool, an alarm that
 * has not resolved, a panel coming up.
 */
export function swell(freq, { at = 0, dur = 2.2, gain = 0.1, bus = "world", to = 0, cut = 2400, space = 0.4 } = {}) {
  const k = ensureAudio();
  if (!k || !claimVoice(1)) return 0;
  const ctx = k.ctx;
  const t = at || ctx.currentTime;
  const g = ctx.createGain();
  const end = env(g, t, { attack: dur * 0.55, hold: 0, decay: dur * 0.5, peak: gain * 1.7, curve: "lin" });
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(cut * 0.35, t);
  lp.frequency.exponentialRampToValueAtTime(cut, t + dur * 0.7);
  lp.Q.value = 0.8;
  const sources = [];
  for (const d of [-7, 7]) {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(freq, t);
    if (to > 0) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    o.detune.value = d;
    const og = ctx.createGain();
    og.gain.value = 0.5;
    o.connect(og); og.connect(lp);
    o.start(t);
    sources.push(o);
  }
  lp.connect(g);
  toBus(g, bus, { space, stopAt: end + 0.12, sources });
  return end;
}

/* ---- held voices --------------------------------------------------------
 * Everything above is fire-and-forget. The ambient bed needs the opposite: a
 * voice that starts, is held for as long as a place lasts, has its level
 * moved from outside, and is stopped by hand. It gets its own shape rather
 * than an option on the others, because a held voice that leaks is a leak
 * that lasts the whole session.
 */
export function heldDrone(freq, { bus = "ambience", gain = 0, harmonics = [1, 2, 3, 5], type = "sine", cut = 900, space = 0.5 } = {}) {
  const k = ensureAudio();
  if (!k) return null;
  const ctx = k.ctx;
  const t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.value = gain;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = cut;
  lp.Q.value = 0.6;
  const dWeight = harmonics.reduce((a, h) => a + 1 / Math.pow(h, 1.6), 0) || 1;
  const sources = [];
  harmonics.forEach((h, i) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq * h;
    o.detune.value = (i % 2 ? 1 : -1) * (2 + i * 2.5);
    const og = ctx.createGain();
    og.gain.value = (1 / Math.pow(h, 1.6)) / dWeight;
    o.connect(og); og.connect(lp);
    o.start(t);
    sources.push(o);
  });
  lp.connect(g);
  g.connect(k.bus[bus] ?? k.bus.ambience);
  if (space > 0) { const s = ctx.createGain(); s.gain.value = space; g.connect(s); s.connect(k.sends.space); }
  return {
    gain: g.gain,
    set(v, ms = 600) { g.gain.setTargetAtTime(Math.max(0, v), ctx.currentTime, Math.max(0.02, ms / 3000)); },
    freq(v, ms = 900) { for (let i = 0; i < sources.length; i++) sources[i].frequency.setTargetAtTime(v * harmonics[i], ctx.currentTime, Math.max(0.02, ms / 3000)); },
    cutoff(v, ms = 600) { lp.frequency.setTargetAtTime(Math.max(40, v), ctx.currentTime, Math.max(0.02, ms / 3000)); },
    stop(ms = 700) {
      const t0 = ctx.currentTime;
      g.gain.setTargetAtTime(0, t0, Math.max(0.02, ms / 3000));
      setTimeout(() => {
        for (const s of sources) { try { s.stop(); s.disconnect(); } catch { /* gone */ } }
        try { lp.disconnect(); g.disconnect(); } catch { /* gone */ }
      }, ms + 400);
    },
  };
}

/** Held filtered noise — hull wash, room tone, the belt. */
export function heldAir({ bus = "ambience", gain = 0, freq = 400, q = 0.7, type = "bandpass", space = 0.3 } = {}) {
  const k = ensureAudio();
  if (!k) return null;
  const ctx = k.ctx;
  const n = ctx.createBufferSource();
  n.buffer = noiseBuffer();
  n.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = gain;
  n.connect(f); f.connect(g);
  g.connect(k.bus[bus] ?? k.bus.ambience);
  if (space > 0) { const s = ctx.createGain(); s.gain.value = space; g.connect(s); s.connect(k.sends.space); }
  n.start(ctx.currentTime);
  return {
    set(v, ms = 800) { g.gain.setTargetAtTime(Math.max(0, v), ctx.currentTime, Math.max(0.02, ms / 3000)); },
    cutoff(v, ms = 800) { f.frequency.setTargetAtTime(Math.max(30, v), ctx.currentTime, Math.max(0.02, ms / 3000)); },
    stop(ms = 700) {
      const t0 = ctx.currentTime;
      g.gain.setTargetAtTime(0, t0, Math.max(0.02, ms / 3000));
      setTimeout(() => {
        try { n.stop(); n.disconnect(); f.disconnect(); g.disconnect(); } catch { /* gone */ }
      }, ms + 400);
    },
  };
}

export { releaseVoice };
