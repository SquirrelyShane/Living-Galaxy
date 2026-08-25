/**
 * TAXONOMY — CLASSIFICATION BY CONDITION
 *
 * The rule this module exists to enforce, in one line:
 *
 *   A BODY'S TYPE IS DERIVED FROM ITS ORBIT, NEVER DRAWN INDEPENDENTLY.
 *
 * The old generator rolled `kind` from a flat list with a uniform random
 * draw. Nothing tied the label to the orbit, so the inferno zone could and
 * did produce Ice worlds. The label was decoration printed beside a
 * physics engine that disagreed with it.
 *
 * Here, classification is a filter, not a draw. The pipeline is:
 *
 *   1. insolation      S = L / d^2, from the star's actual luminosity
 *   2. candidate set   every class whose declared envelope contains S,
 *                      the body's mass, and its equilibrium temperature
 *   3. weighted pick   among the survivors only
 *   4. atmosphere      walk the class's candidates and take the first the
 *                      world can physically RETAIN, by Jeans escape
 *   5. derived state   physical radius, gravity, pressure, composition
 *
 * Step 2 is the fix. A class declaring `S: [0, 0.16]` cannot be selected
 * at S = 60 because it is filtered out before any random number is drawn.
 * The bad outcome is not made unlikely; it is made unreachable.
 *
 * RECLASSIFICATION
 *
 * Insolation is not constant. The star brightens through its main
 * sequence, jumps three orders of magnitude as a red giant, and collapses
 * to almost nothing as a white dwarf. So a class assigned at generation
 * expires. `reclassify()` re-runs the same filter against current
 * conditions and returns a transition record when a world crosses out of
 * its envelope — which is how an Ocean World becomes a Steam World and
 * then a Scorched Rock, on camera, as the star dies.
 *
 * The one asymmetry: volatiles ablate permanently (see stellar.js). A
 * world cooked once cannot go back to Ocean when the star cools, because
 * the volatile inventory that made it an ocean is gone. Classification
 * respects that by filtering on volatiles as well as temperature.
 *
 * Pure module: no DOM, no three.js.
 */

import {
  TERRESTRIAL, GIANTS, MOON_CLASSES, WORLD, LEGACY_KIND, fitsInsolation, fitsMass
} from '../data/worldgen/worlds.js';
import { ATMOSPHERE, atmosphereById } from '../data/worldgen/atmospheres.js';
import { ASTEROID_CLASSES, COMET_CLASSES, asteroidsAt, cometsFor } from '../data/worldgen/smallbodies.js';
import { rollComposition } from '../data/worldgen/index.js';
import {
  massEarths, physicalRadiusKm, giantRadiusKm, gravityG, escapeVelocityKms,
  equilibriumTempK, retainsGas, surfacePressureBar,
  radiusInBand, gravityGFromRadius, escapeKmsFromRadius, massFromRadiusKg
} from '../core/units.js';
import { BODY_MASS } from '../core/config.js';
import { surfaceState } from './stellar.js';

/**
 * Starting volatile inventory from insolation alone.
 *
 * This has to be known BEFORE the class is chosen, not after. Several
 * classes are defined by what a world has lost rather than by where it
 * sits — Barren, Iron, Shattered — and they are only reachable when the
 * inventory is genuinely low. Rolling the class first and the volatiles
 * second would make those classes appear at any orbit, which is the same
 * category of error as the one this module was written to fix, wearing a
 * different hat.
 *
 * The bands match `initialVolatiles` in epoch.js, plus a seeded spread so
 * two worlds at the same orbit are not identical. The spread is what lets
 * a Barren World occur inside the temperate zone — a world that outgassed
 * badly, or was stripped by an impact — without it becoming the norm.
 */
export function initialVolatilesFor(S, rand) {
  let base;
  if (S > 4) base = 0.05;
  else if (S > 1.5) base = 0.35;
  else if (S < 0.12) base = 0.95;
  else base = 0.80;
  const spread = 0.55 + rand() * 0.75;             // 0.55x .. 1.30x
  return Math.max(0, Math.min(1, base * spread));
}

/* ── weighted selection ──────────────────────────────────────────── */

function pickWeighted(list, rand) {
  if (!list.length) return null;
  let total = 0;
  for (const c of list) total += (c.weight || 1);
  let roll = rand() * total;
  for (const c of list) {
    roll -= (c.weight || 1);
    if (roll <= 0) return c;
  }
  return list[list.length - 1];
}

/** Distance from S to a class's band — 0 when inside. Used only for fallback. */
function bandDistance(cls, S) {
  if (S < cls.S[0]) return cls.S[0] - S;
  if (S > cls.S[1]) return S - cls.S[1];
  return 0;
}

/**
 * Candidate classes for a set of conditions, in descending strictness.
 *
 * Returns the FIRST non-empty tier, so a fully-constrained match is always
 * preferred and the relaxations only apply when reality is at an awkward
 * corner of the parameter space. The final tier is nearest-band, which
 * cannot be empty — so this function never fails to classify, and no
 * caller ever needs a random-kind fallback.
 */
export function candidateClasses({ S, massEarth, tempK, volatiles, giant, moon }) {
  let pool = giant ? GIANTS : TERRESTRIAL.slice();
  if (moon && !giant) pool = pool.concat(MOON_CLASSES);

  const inS = pool.filter(c => fitsInsolation(c, S));

  // The surface this world will actually compute, given where it is and
  // what it has left. This is the single strongest constraint available,
  // because it is the exact question the audit asks afterwards: a class
  // whose reachable surface set excludes this surface is a class that will
  // be flagged the moment it is assigned. Filtering on it here means the
  // selector and its auditor are asking one question, not two similar
  // ones — which is what stops a tolerance on some other field (a volatile
  // band widened by a fudge factor, say) from quietly admitting a world
  // whose label contradicts its own surface.
  const surface = volatiles === undefined ? undefined : surfaceState(S, volatiles);
  const surfaceFits = c => surface === undefined || !c.surfaces.length ||
    c.surfaces.includes(surface);

  const massFits = c => fitsMass(c, massEarth);
  const tempFits = c => tempK === undefined || !c.Tsurf ||
    (tempK >= c.Tsurf[0] && tempK <= c.Tsurf[1]);

  // tier 1 — everything agrees
  const strict = inS.filter(c =>
    massFits(c) && tempFits(c) && surfaceFits(c) &&
    (volatiles === undefined || (volatiles >= c.volatiles[0] * 0.5 &&
                                 volatiles <= Math.min(1, c.volatiles[1] * 1.5 + 0.05)))
  );
  if (strict.length) return strict;

  // tier 2 — drop the volatile band, but NOT the surface it implies
  const noVol = inS.filter(c => massFits(c) && tempFits(c) && surfaceFits(c));
  if (noVol.length) return noVol;

  // tier 2b — drop the temperature gate, still honouring the surface
  const surfOnly = inS.filter(c => massFits(c) && surfaceFits(c));
  if (surfOnly.length) return surfOnly;

  // tier 3 — drop temperature too; insolation and mass still hold
  const massOnly = inS.filter(c => fitsMass(c, massEarth));
  if (massOnly.length) return massOnly;

  // tier 4 — insolation alone. Still cannot produce an ice world in an
  // inferno, which is the invariant that matters.
  if (inS.length) return inS;

  // tier 5 — nothing matched S at all (a mass far outside every band).
  // Take the classes whose band is nearest, so the result is still the
  // closest physically sensible answer rather than an arbitrary one.
  let best = Infinity;
  for (const c of pool) best = Math.min(best, bandDistance(c, S));
  return pool.filter(c => bandDistance(c, S) === best);
}

/**
 * Pick the atmosphere a world can actually keep.
 *
 * Walks the class's candidate list in order — thickest and most
 * characteristic first — and returns the first archetype that passes both
 * gates: the temperature is inside the archetype's stability band, and the
 * escape velocity is enough to retain its lightest significant gas against
 * Jeans escape. A small hot world therefore loses its hydrogen envelope
 * and falls through to something heavier, exactly as a real one does.
 */
export function selectAtmosphere(cls, { tempK, escapeKms }) {
  const list = cls.atmosphere || ['none'];
  for (const id of list) {
    const atm = ATMOSPHERE[id];
    if (!atm) continue;
    if (id === 'none') return atm;
    if (tempK < atm.T[0] || tempK > atm.T[1]) continue;
    const light = atm.lightest;
    if (!atm.unbound && light && !retainsGas(escapeKms, tempK, light.molar)) continue;
    return atm;
  }
  // Nothing on the list survives — the world is stripped. That is a real
  // outcome, not an error.
  return ATMOSPHERE.exosphere && escapeKms > 0.5 ? ATMOSPHERE.exosphere : ATMOSPHERE.none;
}

/**
 * Classify a world and derive everything that follows from the class.
 *
 * Temperature and atmosphere are mutually dependent — the greenhouse
 * effect depends on the air, and which air is retained depends on the
 * temperature — so this resolves them in two passes: a bare equilibrium
 * temperature selects the atmosphere, then the atmosphere's greenhouse
 * multiplier corrects the temperature. Two passes is enough; the feedback
 * converges quickly and a third pass moves the answer by under a percent.
 */
export function classifyWorld({
  simMass, S, rand, giant = false, moon = false, volatiles, forceClassId, tidal = false
}) {
  const massEarth = massEarths(simMass);

  // pass 0 — provisional radius from a nominal density, to get a first
  // escape velocity. The chosen class refines it below.
  const provisionalDensity = giant ? 1.3 : 4.5;
  const provisionalR = giant ? giantRadiusKm(simMass) : physicalRadiusKm(simMass, provisionalDensity);
  const bareTemp = equilibriumTempK(S, giant ? 0.45 : 0.3, 1);

  // The inventory has to exist before the class is picked — see
  // initialVolatilesFor. Giants keep their envelopes by mass, so they are
  // exempt and always count as volatile-rich.
  const inventory = volatiles !== undefined
    ? volatiles
    : (giant ? 0.95 : initialVolatilesFor(S, rand));

  let cls = forceClassId ? WORLD[forceClassId] : null;
  if (!cls) {
    const pool = candidateClasses({ S, massEarth, tempK: bareTemp, volatiles: inventory, giant, moon });
    cls = pickWeighted(pool, rand) || (giant ? GIANTS[0] : TERRESTRIAL[0]);
  }

  // pass 1 — real radius from the class's own density
  const radiusKm = cls.giant ? giantRadiusKm(simMass) : physicalRadiusKm(simMass, cls.density);
  const g = gravityG(simMass, radiusKm);
  const escKms = escapeVelocityKms(simMass, radiusKm);

  // pass 2 — atmosphere and temperature, resolved to a fixed point.
  //
  // These are mutually dependent: the greenhouse effect depends on which
  // air the world has, and which air it can RETAIN depends on how hot it
  // is. Choosing once on a bare equilibrium temperature is not enough — a
  // thick greenhouse can lift the real temperature past the point where
  // its own lightest gas is retained, leaving the world wearing an
  // atmosphere it cannot hold. Iterating settles it: three passes is
  // ample, and the loop exits as soon as the choice stops changing.
  // Seed the iteration from the class's CHARACTERISTIC atmosphere rather
  // than from a bare airless equilibrium.
  //
  // Starting cold biases the whole fixed point toward vacuum: a world
  // whose real surface is warm only because of its greenhouse gets
  // evaluated at its airless temperature, falls outside its own
  // atmosphere's stability band, and drops through to an exosphere — and
  // then the iteration has no way back, because the airless temperature
  // keeps reconfirming the airless answer. An Ocean World with no air is
  // the visible symptom.
  //
  // Seeding with the first listed archetype's greenhouse gives the class's
  // own atmosphere a fair first evaluation. It is only a starting point:
  // if the world genuinely cannot retain that gas, the loop below still
  // strips it.
  const seedAtm = ATMOSPHERE[(cls.atmosphere || [])[0]] || ATMOSPHERE.none;
  let tempK = equilibriumTempK(S, Math.max(cls.albedo, seedAtm.albedo ?? cls.albedo),
    seedAtm.greenhouse || 1);
  let atm = selectAtmosphere(cls, { tempK, escapeKms: escKms });
  for (let pass = 0; pass < 3; pass++) {
    const next = equilibriumTempK(S, Math.max(cls.albedo, atm.albedo ?? cls.albedo), atm.greenhouse);
    const nextAtm = selectAtmosphere(cls, { tempK: next, escapeKms: escKms });
    const settled = nextAtm.id === atm.id && Math.abs(next - tempK) < 1;
    tempK = next;
    atm = nextAtm;
    if (settled) break;
  }

  // The clamp applies ONLY to a freshly rolled inventory.
  //
  // At generation the inventory is ours to choose, so pinning it into the
  // chosen class's band keeps the dossier self-consistent. But when the
  // caller supplies an inventory — which is every reclassification — that
  // number belongs to the epoch engine, and clamping it into a new class's
  // band can silently RAISE it. That would hand a cooked world back the
  // volatiles it lost, quietly undoing the one-way ablation that makes
  // stellar death irreversible, and it would do so through a line that
  // looks like tidying up. Supplied inventories pass through untouched.
  const vol = volatiles !== undefined
    ? volatiles
    : Math.max(cls.volatiles[0], Math.min(cls.volatiles[1], inventory));

  const pressureBar = surfacePressureBar(atm.columnScale, vol, g, radiusKm);

  const composition = rollComposition({
    tempK,
    hostType: cls.giant ? 'giant' : (moon ? 'moon' : 'planet'),
    tags: cls.ores,
    rand,
    count: 3 + Math.floor(rand() * 3),
    bias: (cls.ores.includes('exotic') ? 0.35 : 0) + (tidal || cls.tidal ? 0.15 : 0)
  });

  return {
    classId: cls.id,
    kind: cls.label,
    category: cls.category,
    blurb: cls.blurb,
    color: cls.color,
    density: cls.density,
    albedo: cls.albedo,
    radiusKm,
    gravityG: g,
    escapeKms: escKms,
    tempK,
    insolation: S,
    volatiles: vol,
    atmosphereId: atm.id,
    atmosphere: atm.label,
    pressureBar,
    molarMass: atm.molarMass,
    breathable: !!atm.breathable && pressureBar > 0.4 && pressureBar < 4 && tempK > 250 && tempK < 320,
    corrosive: !!atm.corrosive,
    composition,
    tidal: !!(tidal || cls.tidal),
    rings: !!cls.rings,
    tidalLocked: !!cls.tidalLocked
  };
}

/** Apply a classification result onto a body in place. */
export function applyClassification(body, c) {
  body.classId = c.classId;
  body.kind = c.kind;
  body.classCategory = c.category;
  body.blurb = c.blurb;
  body.color = c.color;
  body.density = c.density;
  body.albedo = c.albedo;
  body.radiusKm = c.radiusKm;          // PHYSICAL radius — not body.radius
  body.gravityG = c.gravityG;
  body.escapeKms = c.escapeKms;
  body.tempK = c.tempK;
  body.insolation = c.insolation;
  body.volatiles = c.volatiles;
  body.atmosphereId = c.atmosphereId;
  body.atmosphere = c.atmosphere;
  body.pressureBar = c.pressureBar;
  body.molarMass = c.molarMass;
  body.breathable = c.breathable;
  body.corrosive = c.corrosive;
  body.composition = c.composition;
  body.rings = c.rings;
  body.tidalLocked = c.tidalLocked;
  return body;
}

/**
 * Re-run classification against current conditions.
 *
 * Returns null when the body is still inside its class envelope — the
 * common case, and it must be cheap because deep time calls this for every
 * world on every epoch step. Returns a transition record when the class
 * has changed, which the chronicle logs and the renderer recolours from.
 *
 * `volatiles` is passed through rather than re-rolled: the epoch engine
 * owns that number and its one-way ablation is what makes stellar death
 * irreversible. Reclassification must not quietly hand a world back
 * volatiles it already lost.
 */
export function reclassify(body, { S, rand, force = false }) {
  const cls = WORLD[body.classId];
  const giant = !!(cls && cls.giant);
  const moon = body.type === 'moon';

  // A class expires two ways, not one.
  //
  // Insolation is the obvious one: the star brightens, and a world leaves
  // the band its class declares. The other is volatile loss. A world can
  // sit still at a constant orbit and still stop being an Archipelago
  // World, because the ocean that made it one has boiled off. Checking
  // only insolation leaves that world wearing a label its own surface
  // state contradicts — which is the audit's SURFACE_CLASS_MISMATCH, and
  // is the same class of bug as the one this module exists to prevent,
  // arriving by a different route.
  //
  // So the trigger is: does the class still contain the surface the world
  // actually computes? That is exactly what the audit asks, so the engine
  // and its auditor cannot disagree.
  const surfaceOk = !cls || !cls.surfaces.length ||
    cls.surfaces.includes(surfaceState(S, body.volatiles ?? 0));

  if (!force && cls && fitsInsolation(cls, S) && surfaceOk) {
    // still valid — refresh the cheap derived numbers and stop
    body.insolation = S;
    const atm = atmosphereById(body.atmosphereId);
    body.tempK = equilibriumTempK(S, Math.max(cls.albedo, atm.albedo ?? cls.albedo), atm.greenhouse);
    body.pressureBar = surfacePressureBar(atm.columnScale, body.volatiles ?? 0, body.gravityG ?? 1, body.radiusKm ?? 1);
    return null;
  }

  const from = body.classId;
  const fromLabel = body.kind;
  const c = classifyWorld({
    simMass: body.mass, S, rand, giant, moon,
    volatiles: body.volatiles,
    tidal: body.tidal
  });
  if (c.classId === from && !force && surfaceOk) {
    body.insolation = S;
    return null;
  }
  applyClassification(body, c);
  return { id: body.id, name: body.name, from, fromLabel, to: c.classId, toLabel: c.kind, S };
}

/* ── small bodies ────────────────────────────────────────────────── */

/** Classify an asteroid from its temperature. Belts sort themselves. */
export function classifyAsteroid({ simMass, tempK, rand, huge = false }) {
  let pool = asteroidsAt(tempK);
  if (!pool.length) pool = ASTEROID_CLASSES;
  // A named large rock has to belong to a class that can actually get
  // large — a monolith class topping out at 12 km cannot be the system's
  // Ceres.
  if (huge) {
    const big = pool.filter(a => a.radiusKm[1] >= 60);
    if (big.length) pool = big;
  }
  const cls = pickWeighted(pool, rand) || ASTEROID_CLASSES[0];
  // Catalogue-authoritative size — see radiusInBand in units.js
  const range = huge ? BODY_MASS.hugeAsteroid : BODY_MASS.asteroid;
  const radiusKm = radiusInBand(simMass, range, cls.radiusKm,
    huge ? [0.35, 1.0] : [0, 0.12]);
  return {
    classId: cls.id, kind: cls.label, spectral: cls.spectral, blurb: cls.blurb,
    color: cls.color, density: cls.density, albedo: cls.albedo,
    radiusKm,
    gravityG: gravityGFromRadius(radiusKm, cls.density),
    escapeKms: escapeKmsFromRadius(radiusKm, cls.density),
    massKg: massFromRadiusKg(radiusKm, cls.density),
    tempK,
    fragile: !!cls.fragile,
    composition: rollComposition({
      tempK, hostType: 'asteroid', tags: cls.ores, rand,
      count: 2 + Math.floor(rand() * 3),
      bias: cls.ores.includes('exotic') ? 0.4 : 0
    })
  };
}

/** Classify a comet from its eccentricity and remaining volatiles. */
export function classifyComet({ simMass, e, volatiles, tempK, rand }) {
  let pool = cometsFor(e, volatiles);
  if (!pool.length) pool = cometsFor(e);
  if (!pool.length) pool = COMET_CLASSES;
  const cls = pickWeighted(pool, rand) || COMET_CLASSES[0];
  const radiusKm = radiusInBand(simMass, BODY_MASS.comet, cls.radiusKm, [0, 0.7]);
  return {
    classId: cls.id, kind: cls.label, blurb: cls.blurb,
    color: cls.color, density: cls.density, albedo: cls.albedo,
    radiusKm,
    gravityG: gravityGFromRadius(radiusKm, cls.density),
    escapeKms: escapeKmsFromRadius(radiusKm, cls.density),
    massKg: massFromRadiusKg(radiusKm, cls.density),
    tempK, volatiles,
    tailStrength: cls.tailStrength,
    doomed: !!cls.doomed, unbound: !!cls.unbound, fragile: !!cls.fragile,
    composition: rollComposition({
      tempK, hostType: 'comet', tags: cls.ores, rand,
      count: 2 + Math.floor(rand() * 3),
      bias: 0.2
    })
  };
}

/**
 * Fill in a body's survey detail on first inspection.
 *
 * A belt holds hundreds of rocks and generating a full composition for
 * every one of them is wasted work — nobody will ever look at most of
 * them. So the generator gives anonymous belt particles a spectral class
 * (which is cheap, and which is what makes the belt visibly sorted by
 * temperature) and nothing else. This fills in the rest the first time a
 * body is actually selected, and is a no-op every time after.
 *
 * The seed is derived from the body's id, so the answer is stable: tapping
 * the same rock twice gives the same survey, and a system reloaded from
 * the Galactic Database surveys identically to the one that was saved.
 */
export function ensureSurveyed(body, tempKHint) {
  if (!body || body.composition) return body;

  const cls = ASTEROID_CLASSES.find(c => c.id === body.classId);
  if (!cls) return body;

  const rand = (seed => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })(Math.imul(body.id | 0, 0x9E3779B1));

  const tempK = body.tempK ?? tempKHint ?? (cls.T[0] + cls.T[1]) / 2;
  const huge = body.type === 'huge_asteroid';
  const range = huge ? BODY_MASS.hugeAsteroid : BODY_MASS.asteroid;
  const radiusKm = radiusInBand(body.mass, range, cls.radiusKm,
    huge ? [0.35, 1.0] : [0, 0.12]);

  body.kind = cls.label;
  body.spectral = cls.spectral;
  body.blurb = cls.blurb;
  body.albedo = cls.albedo;
  body.radiusKm = radiusKm;
  body.gravityG = gravityGFromRadius(radiusKm, cls.density);
  body.escapeKms = escapeKmsFromRadius(radiusKm, cls.density);
  body.massKg = massFromRadiusKg(radiusKm, cls.density);
  body.tempK = tempK;
  body.composition = rollComposition({
    tempK, hostType: 'asteroid', tags: cls.ores, rand,
    count: 2 + Math.floor(rand() * 3),
    bias: cls.ores.includes('exotic') ? 0.4 : 0
  });
  return body;
}

/* ── audit ───────────────────────────────────────────────────────── */

export const VIOLATION = {
  CLASS_INSOLATION: 'CLASS_INSOLATION_MISMATCH',
  CLASS_UNKNOWN: 'CLASS_UNKNOWN',
  SURFACE_CLASS: 'SURFACE_CLASS_MISMATCH',
  ATMOSPHERE_UNRETAINED: 'ATMOSPHERE_UNRETAINED',
  MINERAL_TEMP: 'MINERAL_TEMPERATURE_MISMATCH',
  GRAVITY_INSANE: 'GRAVITY_OUT_OF_RANGE'
};

/**
 * Structural audit of a system's classification, mirroring `auditLayout`
 * in zones.js. Returns violations rather than throwing, so the generator
 * can reject a seed and the HUD can flag a bad system rather than crash.
 *
 * The headline check is the one this whole module was written for: no
 * body's class may declare an insolation band that excludes the
 * insolation it is actually receiving.
 */
export function auditClassification(system, opts = {}) {
  const violations = [];
  const star = system.bodies.find(b => b.id === system.starId);
  if (!star) return { violations, checked: 0 };

  let checked = 0;

  for (const b of system.bodies) {
    if (b._dead) continue;
    if (b.type !== 'planet' && b.type !== 'moon') continue;
    if (!b.classId) continue;
    checked++;

    const cls = WORLD[b.classId];
    if (!cls) {
      violations.push({ code: VIOLATION.CLASS_UNKNOWN, id: b.id, name: b.name,
        detail: `unknown class '${b.classId}'` });
      continue;
    }

    const S = b.insolation;
    if (S !== undefined && !fitsInsolation(cls, S)) {
      violations.push({
        code: VIOLATION.CLASS_INSOLATION, id: b.id, name: b.name,
        detail: `${b.name} is ${cls.label} (S band ${cls.S[0]}–${cls.S[1]}) at S=${S.toFixed(3)}`
      });
    }

    if (b.surface && cls.surfaces.length && !cls.surfaces.includes(b.surface)) {
      violations.push({
        code: VIOLATION.SURFACE_CLASS, id: b.id, name: b.name,
        detail: `${b.name} is ${cls.label} but its surface reads '${b.surface}'`
      });
    }

    if (b.gravityG !== undefined && (!Number.isFinite(b.gravityG) || b.gravityG <= 0 || b.gravityG > 5000)) {
      violations.push({
        code: VIOLATION.GRAVITY_INSANE, id: b.id, name: b.name,
        detail: `${b.name} reports ${b.gravityG} g`
      });
    }

    if (opts.deep && b.atmosphereId && b.atmosphereId !== 'none') {
      const atm = atmosphereById(b.atmosphereId);
      const light = atm.lightest;
      if (!atm.unbound && light && b.escapeKms && b.tempK &&
          !retainsGas(b.escapeKms, b.tempK, light.molar)) {
        violations.push({
          code: VIOLATION.ATMOSPHERE_UNRETAINED, id: b.id, name: b.name,
          detail: `${b.name} cannot hold ${light.gas} at ${Math.round(b.tempK)} K`
        });
      }
    }
  }

  return { violations, checked };
}

/** Resolve a pre-database `kind` string onto a modern class id. */
export function resolveLegacyKind(kind) {
  return LEGACY_KIND[kind] || null;
}
