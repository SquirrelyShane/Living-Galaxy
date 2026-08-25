// Living Galaxy — deep time.
//
// The clock this file runs on is not the game's. `core/clock.js` counts seconds and drives
// the frame loop; this counts **years**, in steps of millions, and nothing calls it on a
// frame. It is called twice in a system's life: once at generation, to place the system at
// the age its seed rolled, and once per step by whatever asks to see the system's future.
//
// ## Why a system needs an age at all
//
// A star's luminosity is the single number every world in the system is measured against —
// it decides the habitable zone, and the habitable zone decides what each world *is*. Before
// this, `STAR_CLASSES` gave one luminosity per spectral class, forever. Every G-type in the
// galaxy was the same G-type. Two yellow-dwarf systems differed only in where the dice put
// the orbits, never in what kind of place the star made them.
//
// A main-sequence star brightens roughly forty percent across its life. A young G-type's
// habitable zone sits meaningfully further in than an old one's, and the world that was an
// ocean when the system formed is a desert by the time the star leaves the main sequence.
// Giving each system an age makes that difference real and free: it costs one number in the
// seed and it makes the class table stop being a lookup.
//
// ## Order is the whole design
//
// Evolution touches **orbital elements and body attributes — never positions**. That
// separation is what makes a million-year step safe to take in one jump. A star can shed
// half its mass and every orbit expands smoothly, because expansion is a change to `a`, not
// a force applied to a moving body. There is no integrator here to destabilise.
//
//   1. the star            — it changes the mass and luminosity everything else reads
//   2. orbits respond      — adiabatic expansion, a ∝ 1/M
//   3. engulfment          — an expanding envelope swallows what it reaches
//   4. surfaces            — volatiles ablate or recondense at the new insolation
//   5. classes             — worlds are re-asked what they are, against conditions that now hold
//
// ## The asymmetry that makes stellar death readable
//
// Volatile loss is **one-way**. Ablated volatiles go to space and the reservoir cap goes
// down with the inventory, so a world cooked during the red-giant phase does not become an
// ocean again when the star settles into a white dwarf and the system goes cold. It becomes
// a frozen rock with no air.
//
// That is not flavour, it is the reason a dying system is legible from outside: the outer
// worlds go barren first as the star dims, and the inner ones are already gone. A model
// where volatiles recovered would show a system that simply cools and re-freezes, which
// looks like nothing happened.
//
// Pure module: no DOM, no three.js.

import { makeRng } from '../core/rng.js';
import { lengthAU, auToUnits } from '../core/units.js';
import { reclassify } from './taxonomy.js';
import {
  advanceStar, refreshStar, initStar, photosphereAU, insolation, surfaceState,
  volatileRate, habitableZone, PHASE, PHASE_TEXT, SURFACE, SURFACE_COLOR, TERMINAL
} from './stellar.js';

/** A planet is engulfed once the photosphere reaches this fraction of its orbit. */
const ENGULF_MARGIN = 1.05;

/**
 * Advance a system plan by `dtYears`.
 *
 * Returns `{ events, engulfed, reclassified, surfaceChanges, phaseChanged }`. Nothing is
 * logged or rendered here — the caller decides what a five-hundred-million-year step means
 * to it, which for the generator is "nothing, this is just how old the system is" and for
 * the chronicle is a list of things that happened.
 */
export function advanceEpoch(plan, dtYears) {
  const out = { events: [], engulfed: [], reclassified: [], surfaceChanges: [], phaseChanged: null };
  if (!plan || !plan.star || dtYears <= 0) return out;

  const star = plan.star;
  if (!star.lifespanMyr) return out;

  plan.epochYears = (plan.epochYears || 0) + dtYears;

  // ── 1. the star ────────────────────────────────────────────────────
  const { events: stellarEvents, massLossFactor } = advanceStar(star, dtYears / 1e6);
  for (const e of stellarEvents) {
    out.events.push(e);
    out.phaseChanged = e.phase;
  }

  // ── 2. orbits respond adiabatically ────────────────────────────────
  //
  // a ∝ 1/M. Expressed as a multiplier on the stored orbit rather than as a force, which is
  // why a step of any size is safe: there is nothing to integrate and nothing to blow up.
  if (Math.abs(massLossFactor - 1) > 1e-12) {
    for (const p of plan.planets) p.orbit = Math.round(p.orbit * massLossFactor);
    if (plan.stations) for (const s of plan.stations) s.orbit = Math.round(s.orbit * massLossFactor);
    if (plan.belts) for (const b of plan.belts) b.inner = Math.round(b.inner * massLossFactor);
    if (massLossFactor > 1.0001) {
      out.events.push({
        type: 'mass_loss',
        text: `stellar winds shed mass — every orbit expanding by ${((massLossFactor - 1) * 100).toFixed(1)}%`,
        factor: massLossFactor
      });
    }
  }

  // ── 3. engulfment ──────────────────────────────────────────────────
  const photoUnits = auToUnits(photosphereAU(star));
  if (photoUnits > star.radius) star.radius = Math.round(photoUnits);
  const survivors = [];
  for (const p of plan.planets) {
    if (p.orbit < photoUnits * ENGULF_MARGIN) {
      out.engulfed.push({ name: p.name, kind: p.kind || p.type, orbit: p.orbit });
      out.events.push({
        type: 'engulfment',
        text: `${p.name} swallowed by the expanding envelope`,
        name: p.name
      });
      continue;
    }
    survivors.push(p);
  }
  if (out.engulfed.length) plan.planets = survivors;

  // ── 4 & 5. surfaces, then classes ──────────────────────────────────
  const surf = updateSurfaces(plan, dtYears);
  out.surfaceChanges = surf.changed;
  out.reclassified = surf.reclassified;
  for (const t of surf.reclassified) {
    out.events.push({
      type: 'reclassified',
      name: t.name, from: t.from, to: t.to,
      text: `${t.name} is no longer ${t.fromLabel} — now ${t.toLabel}`
    });
  }

  return out;
}

/**
 * Insolation-driven surface state for every world, then reclassification.
 *
 * Giants are exempt from volatile ablation — they hold their envelopes by gravity, not by
 * being cold — but they are emphatically **not** exempt from reclassification. A giant whose
 * star brightens becomes a Warm Neptune and then a Hot Jupiter, and returning early for
 * giants would leave one sitting there labelled `Gas Giant` at an insolation its own class
 * band excludes. The test for that is `classCategory`, not a label string: matching one
 * label out of eight giant classes by name is how the first version of this got it wrong.
 */
export function updateSurfaces(plan, dtYears) {
  const dtMyr = dtYears / 1e6;
  const changed = [];
  const reclassified = [];
  const star = plan.star;

  for (const p of plan.planets) {
    if (!p.classId) continue;
    const S = insolation(star.lum, lengthAU(p.orbit));
    p.insolation = S;

    if (p.classCategory === 'giant') {
      const t = reclassify(p, { S, rand: bodyRand(plan, p) });
      if (t) { reclassified.push(withName(t, p)); }
      continue;
    }

    if (p.volatiles === undefined) p.volatiles = 0.5;
    if (p.volatileCap === undefined) p.volatileCap = p.volatiles;

    const rate = volatileRate(S) * dtMyr;
    if (rate < 0) {
      // Lost to space, not banked. The cap comes down with the inventory, which is what
      // makes the loss permanent — see the module header.
      p.volatiles = Math.max(0, p.volatiles + rate);
      p.volatileCap = Math.min(p.volatileCap, p.volatiles);
    } else {
      p.volatiles = Math.min(p.volatileCap, p.volatiles + rate);
    }

    const next = surfaceState(S, p.volatiles);
    if (next !== p.surface) {
      if (p.surface) changed.push({ name: p.name, from: p.surface, to: next });
      p.surface = next;
    }

    // The class was a statement about the star as it was. The star does not stay that way,
    // so the class expires. The inventory computed just above is passed through rather than
    // re-rolled — reclassification must not hand a cooked world back the volatiles that
    // would let it be an ocean again.
    const t = reclassify(p, { S, rand: bodyRand(plan, p) });
    if (t) reclassified.push(withName(t, p));
  }

  return { changed, reclassified };
}

/**
 * A deterministic per-body random stream.
 *
 * Reclassification makes a weighted choice among candidates and it has to be reproducible:
 * a save stores a seed and promises the system regenerates from it. Seeding on the system
 * seed, the body's name and the current epoch gives a stream that is stable for a given body
 * at a given time but different for each body and each transition — so two worlds crossing
 * the same threshold in the same epoch do not both become the same thing.
 */
function bodyRand(plan, body) {
  let h = (plan.seed | 0) ^ 0x9e3779b9;
  const s = String(body.name || '');
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x85ebca6b) >>> 0;
  h = (h ^ Math.floor((plan.epochYears || 0) / 1e5)) >>> 0;
  const r = makeRng(h);
  return () => r.next();
}

function withName(t, p) {
  return Object.assign({}, t, { name: p.name });
}

/**
 * Put a freshly generated plan at its age. Safe to call twice.
 *
 * The star is initialised, then surfaces and classes are settled once at dt = 0 so a system
 * that has never been stepped is still internally consistent — a world's `surface` agrees
 * with its insolation before anything asks.
 */
export function initEpoch(plan, ageMyr) {
  plan.epochYears = plan.epochYears || 0;
  initStar(plan.star, ageMyr);
  updateSurfaces(plan, 0);
  return plan;
}

/** Habitable zone in world units, for the nav chart and the survey panel. */
export function habitableZoneUnits(star) {
  const hz = habitableZone(star.lum);
  return { inner: auToUnits(hz.inner), outer: auToUnits(hz.outer) };
}

export { PHASE, PHASE_TEXT, SURFACE, SURFACE_COLOR, TERMINAL };
