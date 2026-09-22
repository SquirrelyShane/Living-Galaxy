/* LIVING GALAXY — the cue library.
 *
 * Named sounds, built from the six voices. The point of the rewrite is in
 * the first three groups: the old kit had one `playWarn()` called from
 * twenty places, so "you cannot afford that" and "a rock just hit the hull"
 * were the same loud tone. They are now three separate families —
 *
 *   deny      you asked for something the game will not do. Soft, low,
 *             over in a fifth of a second. It should not startle you.
 *   caution   something needs attention but nothing is broken.
 *   alarm     something is actually wrong. Ducks everything else.
 *
 * Everything pitched here lives in the A-minor set in graph.js, so a cue
 * landing on top of the ambient bed is always in key with it.
 */

import { NOTE, degree, duck, ensureAudio } from "./graph.js";
import { organ, chord, sub, air, metal, wood, swell } from "./voices.js";

const t0 = () => { const k = ensureAudio(); return k ? k.ctx.currentTime : 0; };

/* ---- UI -----------------------------------------------------------------
 * These fire on taps, so they are the sounds the player hears ten thousand
 * times. Short, quiet, dark, and never the same shape as an alert.
 */
export const UI = {
  /** Any ordinary button. A knock, not a beep. */
  tap() {
    const t = t0();
    wood(NOTE.A3, { at: t, gain: 0.145, dur: 0.07 });
  },
  /** A control that changed something. Slightly fuller than a tap. */
  press() {
    const t = t0();
    wood(NOTE.D3, { at: t, gain: 0.168, dur: 0.09 });
    organ(NOTE.D4, { at: t + 0.008, dur: 0.3, gain: 0.049, bus: "ui", harmonics: [1, 2, 4], attack: 0.012, chiff: 0.25, space: 0.18 });
  },
  /** A panel opening: the console drawing breath. */
  panel() {
    const t = t0();
    air({ at: t, dur: 0.5, gain: 0.08, bus: "ui", from: 500, to: 2000, attack: 0.06, space: 0.3 });
    chord([NOTE.A2, NOTE.E2 * 2, NOTE.C3], { at: t + 0.02, dur: 0.9, gain: 0.08, bus: "ui", attack: 0.09, chiff: 0.35, space: 0.4 });
  },
  /** And closing: the same shape, falling. */
  close() {
    const t = t0();
    air({ at: t, dur: 0.42, gain: 0.099, bus: "ui", from: 1700, to: 380, attack: 0.03, space: 0.25 });
    organ(NOTE.A2, { at: t, dur: 0.5, gain: 0.088, bus: "ui", harmonics: [1, 2, 3], attack: 0.02, chiff: 0.2, space: 0.3 });
  },
  /** Moving between tabs inside a panel. */
  tab() {
    const t = t0();
    wood(NOTE.E2 * 2, { at: t, gain: 0.135, dur: 0.06 });
    organ(NOTE.E3, { at: t + 0.01, dur: 0.22, gain: 0.0504, bus: "ui", harmonics: [1, 3], attack: 0.01, chiff: 0.2, space: 0.2 });
  },
  toggleOn() {
    const t = t0();
    wood(NOTE.A2, { at: t, gain: 0.078, dur: 0.07 });
    wood(NOTE.E3, { at: t + 0.045, gain: 0.0624, dur: 0.06 });
  },
  toggleOff() {
    const t = t0();
    wood(NOTE.E3, { at: t, gain: 0.0702, dur: 0.06 });
    wood(NOTE.A2, { at: t + 0.045, gain: 0.0702, dur: 0.08 });
  },
  /** A real commitment — hire, buy, launch, accept. */
  commit() {
    const t = t0();
    wood(NOTE.A2, { at: t, gain: 0.136, dur: 0.1 });
    chord([NOTE.A2, NOTE.E3, NOTE.A3], { at: t + 0.02, dur: 1.1, gain: 0.0952, bus: "ui", attack: 0.05, space: 0.45 });
    sub(NOTE.A1, { at: t, dur: 0.7, gain: 0.136, bus: "ui" });
  },
  /** Typing, ticking a list, a value stepping. Barely there by design. */
  tick() {
    wood(degree(4, 3), { at: t0(), gain: 0.045, dur: 0.04, room: 0.05 });
  },
};

/* ---- refusals and warnings ---------------------------------------------- */

export const WARN = {
  /**
   * "No." Nothing is wrong, you just asked for something impossible — no
   * charge, no port in range, nothing under the reticle. This used to be the
   * same alarm as a hull breach, which is why the game felt like it was
   * shouting at you.
   */
  deny() {
    const t = t0();
    wood(NOTE.A2, { at: t, gain: 0.1413, dur: 0.11, bus: "ui" });
    organ(degree(1, 1), { at: t + 0.01, dur: 0.34, gain: 0.0785, bus: "ui", harmonics: [1, 2], attack: 0.012, chiff: 0.15, space: 0.2 });
  },
  /** Worth looking at. A lane warning, a warp aborted, a contract expiring. */
  caution() {
    const t = t0();
    duck(0.22, 420);
    organ(NOTE.D3, { at: t, dur: 0.42, gain: 0.075, bus: "alert", harmonics: [1, 2, 3], attack: 0.014, chiff: 0.3, space: 0.3 });
    organ(NOTE.D3, { at: t + 0.3, dur: 0.5, gain: 0.07, bus: "alert", harmonics: [1, 2, 3], attack: 0.014, chiff: 0.3, space: 0.35 });
    sub(NOTE.A1, { at: t, dur: 0.6, gain: 0.09, bus: "alert" });
  },
  /** Something is wrong now — hostiles, a breach, an inbound rock. */
  alarm() {
    const t = t0();
    duck(0.5, 1500);
    sub(NOTE.A0, { at: t, dur: 1.9, gain: 0.28, bus: "alert" });
    for (let i = 0; i < 3; i++) {
      chord([degree(1, 1), degree(5, 1)], {
        at: t + i * 0.36, dur: 0.5, gain: 0.1, bus: "alert",
        harmonics: [1, 2, 3, 5], attack: 0.01, chiff: 0.45, space: 0.4,
      });
    }
    air({ at: t, dur: 1.6, gain: 0.05, bus: "alert", from: 1800, to: 300, attack: 0.02, space: 0.4 });
  },
  /**
   * The one that means the ship may not survive the next minute. Held, not
   * repeated — a klaxon you cannot think through is a klaxon the player
   * mutes, and then they never hear any of the others either.
   */
  critical() {
    const t = t0();
    duck(0.68, 3200);
    sub(NOTE.A0, { at: t, dur: 3.4, gain: 0.34, bus: "alert" });
    swell(degree(1, 1), { at: t, dur: 2.6, gain: 0.09, bus: "alert", cut: 1600, space: 0.5 });
    for (let i = 0; i < 4; i++) {
      chord([degree(1, 1), degree(4, 1), degree(6, 1)], {
        at: t + i * 0.55, dur: 0.62, gain: 0.1, bus: "alert",
        harmonics: [1, 2, 3, 4, 6], attack: 0.008, chiff: 0.55, space: 0.45,
      });
    }
  },
};

/* ---- navigation and flight ---------------------------------------------- */

export const NAV = {
  /** A signature lock takes. Rising fifth — the sound of something closing. */
  lock() {
    const t = t0();
    organ(NOTE.A2, { at: t, dur: 0.34, gain: 0.1029, bus: "world", harmonics: [1, 2, 4], attack: 0.012, chiff: 0.3, space: 0.3 });
    organ(NOTE.E3, { at: t + 0.11, dur: 0.55, gain: 0.1103, bus: "world", harmonics: [1, 2, 4], attack: 0.012, chiff: 0.3, space: 0.4 });
  },
  unlock() {
    const t = t0();
    organ(NOTE.E3, { at: t, dur: 0.24, gain: 0.0919, bus: "world", harmonics: [1, 2], attack: 0.01, chiff: 0.2, space: 0.25 });
    organ(NOTE.A2, { at: t + 0.1, dur: 0.4, gain: 0.0835, bus: "world", harmonics: [1, 2], attack: 0.01, chiff: 0.2, space: 0.3 });
  },
  /** A survey ping going out. Long tail — the sky is big. */
  ping() {
    const t = t0();
    organ(NOTE.E4, { at: t, dur: 0.24, gain: 0.204, bus: "world", harmonics: [1, 2, 3.01, 5.4], tilt: 1.9, attack: 0.006, chiff: 0.2, space: 0.75, room: 0.1 });
    metal(NOTE.E4 * 2, { at: t, dur: 0.5, gain: 0.119, bus: "world", bright: 1.3, space: 0.6, room: 0.15 });
  },
  /** The ping came back with something on it. */
  contact() {
    const t = t0();
    organ(NOTE.C4, { at: t, dur: 0.3, gain: 0.12, bus: "world", harmonics: [1, 2, 4], attack: 0.008, chiff: 0.25, space: 0.55 });
    organ(NOTE.E4, { at: t + 0.13, dur: 0.42, gain: 0.11, bus: "world", harmonics: [1, 2, 4], attack: 0.008, chiff: 0.25, space: 0.6 });
  },
  /** Charge building before a jump. Call once; it runs itself. */
  spool(seconds = 2.6) {
    const t = t0();
    swell(NOTE.A1, { at: t, dur: seconds, gain: 0.1, bus: "world", to: NOTE.A2, cut: 2600, space: 0.5 });
    air({ at: t, dur: seconds, gain: 0.06, bus: "world", from: 200, to: 2600, attack: seconds * 0.7, space: 0.4 });
    sub(NOTE.A1, { at: t, dur: seconds, gain: 0.16, bus: "world", attack: seconds * 0.6 });
  },
  /** The jump itself. */
  jump() {
    const t = t0();
    duck(0.3, 900);
    sub(NOTE.A2, { at: t, dur: 1.8, gain: 0.34, bus: "world", slideTo: NOTE.A0, attack: 0.008 });
    air({ at: t, dur: 1.3, gain: 0.11, bus: "world", from: 4200, to: 180, attack: 0.01, space: 0.55 });
    chord([NOTE.A2, NOTE.E3, NOTE.A3], { at: t, dur: 1.6, gain: 0.09, bus: "world", attack: 0.01, chiff: 0.6, space: 0.6 });
  },
  /** Dropping out the far side. */
  arrive() {
    const t = t0();
    sub(NOTE.A1, { at: t, dur: 1.6, gain: 0.2, bus: "world", attack: 0.02 });
    chord([NOTE.A2, NOTE.C3, NOTE.E3], { at: t + 0.03, dur: 2.0, gain: 0.075, bus: "world", attack: 0.12, chiff: 0.3, space: 0.7 });
    air({ at: t, dur: 1.5, gain: 0.06, bus: "world", from: 900, to: 220, attack: 0.05, space: 0.5 });
  },
  /** Warp broken off — falling, not alarming. */
  dropout() {
    const t = t0();
    sub(NOTE.A2, { at: t, dur: 1.0, gain: 0.18, bus: "world", slideTo: NOTE.A1 * 0.7 });
    air({ at: t, dur: 0.8, gain: 0.07, bus: "world", from: 2600, to: 260, attack: 0.02, space: 0.4 });
  },
};

/* ---- the ship and the port ---------------------------------------------- */

export const SHIP = {
  /** Tractor takes the helm. Something much larger than you has hold of it. */
  tractor() {
    const t = t0();
    sub(NOTE.A1, { at: t, dur: 2.2, gain: 0.16, bus: "world", attack: 0.5 });
    swell(degree(3, 1), { at: t, dur: 2.0, gain: 0.06, bus: "world", cut: 1100, space: 0.5 });
  },
  /** Clamps. The most physical sound in the game. */
  clamp() {
    const t = t0();
    metal(180, { at: t, dur: 0.5, gain: 0.16, bus: "world", bright: 1, room: 0.4, space: 0.2 });
    metal(240, { at: t + 0.07, dur: 0.9, gain: 0.11, bus: "world", bright: 0.8, room: 0.45, space: 0.3 });
    sub(NOTE.A1, { at: t, dur: 0.9, gain: 0.2, bus: "world", attack: 0.004 });
  },
  release() {
    const t = t0();
    metal(300, { at: t, dur: 0.35, gain: 0.144, bus: "world", bright: 1.2, room: 0.35 });
    air({ at: t + 0.04, dur: 0.7, gain: 0.112, bus: "world", from: 2200, to: 600, attack: 0.02, space: 0.3 });
  },
  /** Docked, all secure. The one genuinely warm sound in the kit. */
  docked() {
    const t = t0();
    metal(200, { at: t, dur: 0.6, gain: 0.1, bus: "world", room: 0.4 });
    chord([NOTE.A2, NOTE.C3, NOTE.E3, NOTE.A3], { at: t + 0.05, dur: 2.2, gain: 0.075, bus: "world", attack: 0.1, chiff: 0.3, space: 0.65 });
    sub(NOTE.A1, { at: t, dur: 1.4, gain: 0.14, bus: "world" });
  },
  /** Cargo aboard. */
  collect() {
    const t = t0();
    wood(NOTE.D3, { at: t, gain: 0.15, dur: 0.09, bus: "world" });
    organ(NOTE.D4, { at: t + 0.02, dur: 0.36, gain: 0.075, bus: "world", harmonics: [1, 2, 4], attack: 0.01, chiff: 0.3, space: 0.35 });
  },
  /** Money moved. */
  trade() {
    const t = t0();
    wood(NOTE.G2 * 2, { at: t, gain: 0.08, dur: 0.07, bus: "ui" });
    wood(NOTE.C3, { at: t + 0.06, gain: 0.08, dur: 0.07, bus: "ui" });
    organ(NOTE.C4, { at: t + 0.07, dur: 0.5, gain: 0.045, bus: "ui", harmonics: [1, 2, 3], attack: 0.012, chiff: 0.25, space: 0.4 });
  },
  /** Something hit us. `sev` 0..1 decides how much of the hull you feel. */
  impact(sev = 0.5) {
    const t = t0();
    const s = Math.max(0.05, Math.min(1, sev));
    duck(0.3 + s * 0.3, 900 + s * 900);
    sub(NOTE.A0, { at: t, dur: 1.2 + s * 1.6, gain: 0.2 + s * 0.2, bus: "world", attack: 0.004 });
    metal(90 + s * 80, { at: t, dur: 0.9 + s, gain: 0.1 + s * 0.1, bus: "world", bright: 0.7 + s * 0.7, room: 0.5, space: 0.35 });
    air({ at: t, dur: 0.9 + s, gain: 0.05 + s * 0.07, bus: "world", from: 3000, to: 200, attack: 0.006, space: 0.45 });
  },
  /** Mining cutter biting in, and letting go. */
  cutStart() {
    const t = t0();
    air({ at: t, dur: 0.5, gain: 0.102, bus: "world", from: 400, to: 1500, q: 3, attack: 0.12, space: 0.2 });
    organ(degree(1, 1), { at: t, dur: 0.6, gain: 0.085, bus: "world", harmonics: [1, 2, 3, 5], attack: 0.15, chiff: 0.2, space: 0.2 });
  },
  cutStop() {
    const t = t0();
    air({ at: t, dur: 0.45, gain: 0.11, bus: "world", from: 1400, to: 260, q: 2.4, attack: 0.02, space: 0.25 });
  },
};

/* ---- people ------------------------------------------------------------- */

export const CREW = {
  /** An incoming hail, far away. */
  hail() {
    const t = t0();
    organ(NOTE.E3, { at: t, dur: 0.5, gain: 0.08, bus: "world", harmonics: [1, 3, 5], attack: 0.04, chiff: 0.2, space: 0.8, room: 0.05 });
    organ(NOTE.A3, { at: t + 0.18, dur: 0.7, gain: 0.072, bus: "world", harmonics: [1, 3, 5], attack: 0.04, chiff: 0.2, space: 0.85, room: 0.05 });
  },
  /** A line of dialogue arriving. Under everything, almost subliminal. */
  line() {
    wood(degree(2, 3), { at: t0(), gain: 0.04, dur: 0.045, bus: "ui", room: 0.08 });
  },
  /** Something good happened between two people. */
  bond() {
    const t = t0();
    chord([NOTE.A2, NOTE.C3, NOTE.E3, NOTE.G3], { at: t, dur: 2.4, gain: 0.075, bus: "world", attack: 0.2, chiff: 0.2, space: 0.7 });
  },
  /** And something bad. Same chord, flattened. */
  rift() {
    const t = t0();
    chord([NOTE.A2, degree(1, 2), NOTE.E3], { at: t, dur: 1.8, gain: 0.055, bus: "world", attack: 0.18, chiff: 0.2, space: 0.6 });
    sub(NOTE.A1, { at: t, dur: 1.2, gain: 0.09, bus: "world", attack: 0.15 });
  },
  /** Somebody born aboard. */
  birth() {
    const t = t0();
    chord([NOTE.A2, NOTE.E3, NOTE.A3, NOTE.C4], { at: t, dur: 3.2, gain: 0.06, bus: "world", attack: 0.5, chiff: 0.15, space: 0.85 });
    sub(NOTE.A1, { at: t, dur: 2.4, gain: 0.1, bus: "world", attack: 0.6 });
  },
};

/* ---- viewpoints ---------------------------------------------------------
 * A change of place should be audible, because the bed underneath is about
 * to change and an unmarked crossfade reads as a glitch.
 */
export const VIEW = {
  /** Into the hull — the sky cuts off. */
  interiorIn() {
    const t = t0();
    air({ at: t, dur: 0.8, gain: 0.08, bus: "world", from: 2600, to: 320, attack: 0.04, space: 0.2, room: 0.35 });
    sub(NOTE.A1, { at: t, dur: 1.0, gain: 0.12, bus: "world", attack: 0.06 });
  },
  /** And back out. */
  interiorOut() {
    const t = t0();
    air({ at: t, dur: 0.9, gain: 0.1088, bus: "world", from: 340, to: 2800, attack: 0.12, space: 0.55 });
  },
  /** Cockpit ↔ external camera. */
  camera() {
    const t = t0();
    wood(NOTE.A2, { at: t, gain: 0.1295, dur: 0.07, bus: "ui" });
    air({ at: t, dur: 0.35, gain: 0.074, bus: "ui", from: 900, to: 2400, attack: 0.02, space: 0.3 });
  },
  /** The chart opening over the world. */
  map() {
    const t = t0();
    chord([NOTE.A3, NOTE.E4], { at: t, dur: 0.9, gain: 0.0855, bus: "ui", attack: 0.06, chiff: 0.2, space: 0.6 });
  },
};

/** Every cue in the kit, flat, for the audition lab and the test suite. */
export const CUES = {
  ...Object.fromEntries(Object.entries(UI).map(([k, v]) => [`ui.${k}`, v])),
  ...Object.fromEntries(Object.entries(WARN).map(([k, v]) => [`warn.${k}`, v])),
  ...Object.fromEntries(Object.entries(NAV).map(([k, v]) => [`nav.${k}`, v])),
  ...Object.fromEntries(Object.entries(SHIP).map(([k, v]) => [`ship.${k}`, v])),
  ...Object.fromEntries(Object.entries(CREW).map(([k, v]) => [`crew.${k}`, v])),
  ...Object.fromEntries(Object.entries(VIEW).map(([k, v]) => [`view.${k}`, v])),
};

/** Fire a cue by name. Unknown names are ignored, never thrown. */
export function cue(name, ...args) {
  const fn = CUES[name];
  if (typeof fn !== "function") return false;
  try { fn(...args); } catch (err) { console.warn("[audio]", name, err); }
  return true;
}
