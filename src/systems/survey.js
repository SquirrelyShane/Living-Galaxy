// Living Galaxy — planetary survey and asteroid assay. All numbers derive from the
// world seed and the body's name, so every client (and every session on the same
// seed) reads the same planet the same way.
//
// ── what was wrong ───────────────────────────────────────────────────
// `planetInfo()` branched on `'rocky'`, `'terrestrial'`, `'ice'` and `'gas'`. Three of
// those four have not been planet type keys since the twenty-type table landed: the keys
// are `barren`, `gasGiant`, `methaneGiant` and seventeen others. So seventeen of twenty
// world classes fell through every branch into the default, a gas giant reported the
// volatile content of a rock, and the orbital scan disagreed with the extraction rate the
// planetary layer would actually give you on the same ground.
//
// It is rebuilt on the tables the rest of the game already uses. Minerals, volatiles and
// biosigns are now *summaries of `PLANET_RESOURCES`* — the same numbers a site on that
// world extracts against. The scan cannot drift from the ground again, because it is
// reading the ground.
//
// Temperature comes from `body.userData.tempC`, which `world/system.js` already rolled
// from the type's real temperature band. It used to be re-rolled here from a second,
// different band, so a world's scan temperature and its actual temperature were unrelated
// numbers that happened to share a name.

import { makeRng } from '../core/rng.js';
import { S, cargoFree } from '../core/state.js';
import { PLANET_TYPES } from '../data/planets.js';
import { traits } from '../data/planetary/traits.js';
import { PLANET_RESOURCES } from '../data/planetary/resources.js';
import { MATERIALS } from '../data/crafting/index.js';
import { FEATURES, eligibleFeatures } from '../data/features.js';
import { CELESTIAL } from '../core/config.js';
import { toast } from '../ui/toast.js';
import { sfx } from './audio.js';
import { fileFindings } from './research.js';

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) { h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ── what a resource counts as ────────────────────────────────────────
// Derived from the material catalogue's own category field rather than a list of ids kept
// here. When someone adds RAW-026 it lands in the right column on its own.
const GROUP = {
  'Metallic Ore': 'minerals', 'Silicate': 'minerals', 'Radioactive Ore': 'minerals',
  'Carbon': 'minerals', 'Chemical': 'minerals',
  'Volatile': 'volatiles', 'Gas': 'volatiles', 'Gas / Isotope': 'volatiles',
  'Organic': 'bio', 'Biotech': 'bio'
};

/** Saturating 0-100 read of a summed richness. Three good entries reads ~85%, not 300%. */
const band = sum => 100 * (1 - Math.exp(-0.63 * sum));

/**
 * The physical descriptor a feature's requirements are checked against, and the one place
 * that knows a moon and a planet answer the same questions.
 */
export function worldOf(body) {
  const u = (body && body.userData) || {};
  const type = u.ptype && PLANET_TYPES[u.ptype] ? u.ptype : 'barren';
  const t = traits(type) || {};
  return {
    type,
    typeName: u.typeName || (PLANET_TYPES[type] && PLANET_TYPES[type].name) || 'unclassified',
    name: u.name || 'body',
    tempC: typeof u.tempC === 'number' ? u.tempC : Math.round(t.tempMid || 0),
    gravity: u.gravity || t.gravity || 1,
    solid: !!t.solid, liquid: !!t.liquid, gas: !!t.gas,
    water: !!t.water, atmo: !!t.atmo, temperate: !!t.temperate,
    moon: u.kind === 'moon',
    rings: !!u.rings,
    atmoDensity: u.atmoDensity || 0
  };
}

/**
 * Which features this world actually has. Deterministic from the seed and the name, so
 * every client on a shared world finds the same things in the same places.
 *
 * Zero to three, and the count is weighted low: a system where every rock has three
 * remarkable things on it has no remarkable rocks.
 */
export function featuresOf(body) {
  const w = worldOf(body);
  const pool = eligibleFeatures(w);
  if (!pool.length) return [];
  const rng = makeRng((S.seed ^ hash('feat:' + w.name)) >>> 0);
  const roll = rng.next();
  const n = Math.min(pool.length, roll < CELESTIAL.featureNone ? 0
                                : roll < CELESTIAL.featureOne ? 1
                                : roll < CELESTIAL.featureTwo ? 2 : 3);
  const picks = [];
  const bag = pool.slice();
  for (let i = 0; i < n && bag.length; i++) {
    picks.push(bag.splice(Math.floor(rng.next() * bag.length), 1)[0]);
  }
  return picks;
}

/** Best resolution ever archived on this body. Read straight from state rather than
 *  imported from scanner.js, which imports this file — a static cycle between the two
 *  would leave whichever loaded second half-initialised. */
const archivedTier = name => (S.scans && S.scans[name]) || 0;
export const surveyLevel = name => (S.survey && S.survey[name]) || 0;

/**
 * The features you have actually found. A probe on the ground finds everything; a scan
 * from orbit finds whatever its resolution reaches. This is *derived* from two things the
 * save already persists, which is why v1.00.40 needs no schema bump and why a save from
 * v1.00.34 arrives already knowing what it earned.
 */
export function knownFeatures(body) {
  const u = (body && body.userData) || {};
  const name = u.name;
  const probed = surveyLevel(name) >= 2;
  const tier = archivedTier(name);
  return featuresOf(body).filter(k => {
    const f = FEATURES[k];
    if (f.probe === true) return probed;      // only telemetry from the ground finds these
    return probed || tier >= (f.tier || 4);
  });
}

/** Permanent assay bonus this world's *discovered* features contribute. */
export function featureAssay(body) {
  return knownFeatures(body).reduce((s, k) => s + (FEATURES[k].assay || 0), 0);
}

/** Net scan clarity these features give (positive) or cost (negative). */
export function featureScan(body) {
  return knownFeatures(body).reduce((s, k) => s + (FEATURES[k].scan || 0), 0);
}

export function planetInfo(body) {
  const w = worldOf(body);
  const res = PLANET_RESOURCES[w.type] || {};
  const sums = { minerals: 0, volatiles: 0, bio: 0 };
  for (const id in res) {
    const mat = MATERIALS[id];
    const g = mat && GROUP[mat.category];
    if (g) sums[g] += res[id];
  }
  // A deterministic wobble so two worlds of the same class are not identical readouts --
  // small enough that the class is still legible through it.
  const rng = makeRng((S.seed ^ hash(w.name)) >>> 0);
  const jit = () => 0.92 + rng.next() * 0.16;

  const minerals = Math.round(Math.min(99, band(sums.minerals) * jit()));
  const volatiles = Math.round(Math.min(99, band(sums.volatiles) * jit()));
  const bio = Math.round(Math.min(99, band(sums.bio) * jit()));
  const features = featuresOf(body);
  const anomaly = features.some(k => FEATURES[k].anomaly);

  return {
    type: w.type, typeName: w.typeName, tempC: w.tempC, gravity: w.gravity,
    minerals, volatiles, bio, anomaly, features,
    atmoDensity: w.atmoDensity,
    richness: (minerals + volatiles) / 2
  };
}

export function scanPlanet(body) {
  if (!S.orbit || S.orbit.body !== body) {
    toast('Achieve stable orbit before scanning'); sfx.deny(); return null;
  }
  const name = body.userData.name;
  S.survey[name] = Math.max(1, surveyLevel(name));
  sfx.pickup();
  toast(`Orbital scan complete — ${name}`);
  return planetInfo(body);
}

export function probePlanet(body) {
  if (!S.orbit || S.orbit.body !== body) {
    toast('Achieve stable orbit before launching probes'); sfx.deny(); return null;
  }
  if (S.probes < 1) {
    toast('No probes aboard — resupply at any station'); sfx.deny(); return null;
  }
  const info = planetInfo(body);
  const name = body.userData.name;
  // Features are the reason a second world of the same class can be worth twice the first.
  const mult = info.features.reduce((m, k) => m * (FEATURES[k].probe || 1), 1);
  const kg = Math.min(
    Math.round((30 + info.richness * 1.1 + (info.anomaly ? 60 : 0)) * mult),
    cargoFree());
  if (kg <= 0) { toast('Cargo hold full — no room for telemetry'); sfx.deny(); return null; }
  S.probes--;
  S.survey[name] = 2;
  // A probe is now the supply line for research, not just a cargo of telemetry to sell.
  // Once per body: probing the same moon eight times has not taught you eight times as
  // much about cold. See systems/research.js.
  fileFindings(body, 'probe');
  S.cargo.data += kg;
  sfx.pickup();
  // The probe is what turns a class into a place: everything on the ground is now known.
  const found = info.features.length;
  toast(found
    ? `Probe down on ${name} — +${kg} kg telemetry · ${found} surface feature${found > 1 ? 's' : ''}`
    : `Probe down on ${name} — +${kg} kg survey data`);
  return { info, kg, features: info.features };
}

/** Bodies are addressed by name outside the render layer — a planetary site holds a
 *  world's name, not its mesh. */
export const bodyNamed = name =>
  ((S.world && S.world.bodies) || []).find(b => b.userData && b.userData.name === name) || null;

/** Feature assay for a world addressed by name, bounded so findings stack but do not run
 *  away. Extraction pays on this on top of whatever a survey crew has raised. */
export function featureAssayOf(name) {
  const b = bodyNamed(name);
  return b ? Math.min(CELESTIAL.maxFeatureAssay, featureAssay(b)) : 0;
}

export function asteroidDetail(rec) {
  const rng = makeRng((S.seed ^ hash(rec.name)) >>> 0);
  const fe = rng.range(35, 70), ni = rng.range(8, 30), pt = rng.range(0, 8);
  return {
    iron: Math.round(fe), nickel: Math.round(ni),
    platinum: +pt.toFixed(1), silicates: Math.max(0, Math.round(100 - fe - ni - pt)),
    est: Math.round(rec.ore * (1 + pt * 0.4))
  };
}
