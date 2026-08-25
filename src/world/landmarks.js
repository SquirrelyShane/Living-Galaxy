// Living Galaxy — every place in this system a job can point at.
//
// The contract board had four verbs and almost no geography. A bounty said "Raiders in the
// lanes. Destroy them; the board does not care where." A survey said "Resolve detail on
// bodies nobody has bothered to look at properly." Neither named a place, because neither
// had any way to ask what places existed — so every bounty in the galaxy was the same
// bounty and every survey was the same survey, and a board of four offers refreshing every
// ninety seconds showed you the same four jobs forever.
//
// Meanwhile the system knew an enormous amount. After the world catalogue landed, every
// planet carries a class, an atmosphere, a surface pressure, a gravity, a temperature and a
// rolled mineral composition — twenty-four fields describing somewhere specific. There are
// belts with their own mineral profiles, stations with types and neighbours, Lagrange points
// with one-shot anomalies. None of it was reachable from the board.
//
// This is the join. One function, `landmarks()`, returns every place in the live system in
// **one uniform shape**, so a mission template can say what kind of place it needs and be
// matched against reality instead of inventing a destination out of nothing.
//
// ## The shape, and why it is uniform
//
// A landmark is `{ id, kind, name, tags, at(), … }`. The important field is `tags` — a Set
// of plain words describing what is true about the place: `volatile`, `hostile`, `crewed`,
// `charted`, `airless`, `ringed`, `deep`, `wreckage`. Mission templates filter on tags
// rather than on kinds, because the interesting question is almost never "is this a planet"
// — it is "is this somewhere a survey would pay for", and the answer to that involves a
// moon, a Lagrange point and an uncharted gas giant equally.
//
// Uniform shape also means a template written today keeps working when a new kind of place
// is added tomorrow. When moons arrive, they arrive as landmarks with `airless` and
// `charted` tags and every existing survey template can already target them.
//
// ## Derived live, never stored
//
// Landmarks are computed from `S.world` on demand. Positions come from `at()`, which reads
// the live body — a station is on an orbit and a Lagrange point tracks a moving parent, so
// a landmark that cached a position would be pointing at where things used to be.
//
// The one exception is the graveyards, which do not exist in `S.world` at all. Those are
// derived from the world seed exactly the way `systems/lagrange.js` derives its anomalies:
// same seed, same wrecks, same place, on every client, with nothing written down but which
// fields have been worked.

import { S } from '../core/state.js';
import { makeRng, hashString } from '../core/rng.js';
import { lagrangePoints, anomalyAt, charted as lpCharted } from '../systems/flight/lagrange.js';
import {
  BATTLE_KINDS, BATTLE_KEYS, candidateBattles, FIELD_HEAD, FIELD_TAIL, eraTextFor
} from '../data/worldgen/battles.js';
import { POWERS, POWER_KEYS, relationOf } from '../data/factions.js';

// ── graveyards ───────────────────────────────────────────────────────

/** How many debris fields a system can hold, and how they are placed. */
export const GRAVEYARD = {
  count: [1, 4],            // per system, drawn from the seed
  searchRange: 900,         // how close you must be to work a field, world units
  radiusBase: 2200,         // base debris spread before the kind's own multiplier
  minSeparation: 4000       // fields are not allowed to overlap each other
};

/**
 * The debris fields in this system.
 *
 * Sited against real features rather than at random radii, which is what makes the history
 * readable: a siege is off a station because that is what was besieged, a claim war is in a
 * belt because that is what was being claimed, and a lost expedition is out past everything
 * because that is what makes it lost.
 *
 * The site is chosen *first* and the kind of battle second, from only those kinds whose
 * declared envelope the site satisfies. Doing it the other way round — roll a battle, then
 * find somewhere to put it — is how you end up with a boarding action in empty space.
 */
export function graveyards() {
  const plan = S.systemPlan;
  if (!plan || !plan.star) return [];
  if (_graveCache && _graveCache.seed === S.seed && _graveCache.sys === plan.star.name) {
    return _graveCache.list;
  }

  const rng = makeRng((S.seed ^ hashString('graves:' + plan.star.name)) >>> 0);
  const n = GRAVEYARD.count[0] +
    Math.floor(rng.next() * (GRAVEYARD.count[1] - GRAVEYARD.count[0] + 1));

  const outer = plan.planets.length ? plan.planets[plan.planets.length - 1].orbit : 20000;
  const list = [];

  for (let attempt = 0; attempt < n * 6 && list.length < n; attempt++) {
    const i = list.length;
    // ── choose the site ──
    const roll = rng.next();
    let orbit, nearStation = false, nearBelt = false, deepSpace = false, anchor = null;

    if (roll < 0.34 && plan.stations.length) {
      const st = plan.stations[Math.floor(rng.next() * plan.stations.length)];
      orbit = Math.round(st.orbit * (0.90 + rng.next() * 0.20));
      nearStation = true; anchor = st.name;
    } else if (roll < 0.58 && plan.belts.length) {
      const b = plan.belts[Math.floor(rng.next() * plan.belts.length)];
      orbit = Math.round(b.inner + b.width * rng.next());
      nearBelt = true; anchor = b.name;
    } else if (roll < 0.80) {
      deepSpace = true;
      orbit = Math.round(outer * (1.10 + rng.next() * 0.55));
    } else if (plan.planets.length) {
      const p = plan.planets[Math.floor(rng.next() * plan.planets.length)];
      orbit = Math.round(p.orbit * (0.93 + rng.next() * 0.14));
      anchor = p.name;
    } else {
      deepSpace = true;
      orbit = Math.round(outer * 1.2);
    }

    // Fields do not stack. A system with two graveyards on top of each other reads as one
    // graveyard with a bookkeeping error.
    // Fields do not stack. A retry rather than a skip, because dropping the attempt would
    // make a system's field count a function of how unlucky the first draws were rather than
    // of what the seed asked for.
    if (list.some(g => Math.abs(g.orbit - orbit) < GRAVEYARD.minSeparation)) continue;

    // ── how long ago ──
    // Log-distributed: recent fights are common and ancient ones are rare, which is both
    // what a real frontier looks like and what makes an eight-hundred-year-old wreck field
    // worth the trip when you find one.
    const ageYears = Math.round(Math.exp(Math.log(1.5) + rng.next() * (Math.log(700) - Math.log(1.5))));

    const site = { nearStation, nearBelt, deepSpace, ageYears };

    // ── what kind of fight ──
    const fits = candidateBattles(site);
    if (!fits.length) continue;                  // no kind suits this site; leave it empty
    const kindKey = fits[Math.floor(rng.next() * fits.length)];
    const kind = BATTLE_KINDS[kindKey];

    // ── who fought ──
    // Two powers that actually dislike each other, so the field is a fact about the corp
    // war rather than two names drawn from a hat.
    const [aKey, bKey] = pickBelligerents(rng);

    const scale = kind.scale[0] + rng.next() * (kind.scale[1] - kind.scale[0]);
    const spread = kind.spread[0] + rng.next() * (kind.spread[1] - kind.spread[0]);
    const name = FIELD_HEAD[Math.floor(rng.next() * FIELD_HEAD.length)] + ' ' +
                 FIELD_TAIL[Math.floor(rng.next() * FIELD_TAIL.length)];

    list.push({
      key: `grave:${plan.star.name}:${i}`,
      name, kindKey, kind: kind.name,
      orbit,
      angle: rng.next() * Math.PI * 2,
      radius: Math.round(GRAVEYARD.radiusBase * spread),
      ageYears,
      eraText: eraTextFor(ageYears),
      belligerents: [aKey, bKey],
      belligerentNames: [POWERS[aKey].short || POWERS[aKey].name,
                         POWERS[bKey].short || POWERS[bKey].name],
      anchor, nearStation, nearBelt, deepSpace,
      scale, hazard: kind.hazard,
      blurb: kind.blurb,
      yields: kind.yields
    });
  }

  _graveCache = { seed: S.seed, sys: plan.star.name, list };
  return list;
}

let _graveCache = null;

/** Drop the derived cache. Called on jump, and by the tests. */
export function resetLandmarks() { _graveCache = null; }

/**
 * Two powers with a reason to have shot at each other.
 *
 * `relationOf()` already knows — it folds each power's declared `regard` together with the
 * shared timeline in `data/factions.js`, so the corp war has an opinion about every pair
 * before this asks. Picking the *worst* relationship the first power has means a field is a
 * fact about that war rather than two names drawn from a hat, and it means the fields in a
 * system corroborate the grudges the contract board is already paying into.
 */
function pickBelligerents(rng) {
  const keys = POWER_KEYS.slice();
  const a = keys[Math.floor(rng.next() * keys.length)];

  // Every other power, worst relationship first. A tie is broken by the seeded draw rather
  // than by key order, so two systems that pick the same first power do not always produce
  // the same pairing.
  const others = keys.filter(k => k !== a)
    .map(k => ({ k, r: relationOf(a, k), jitter: rng.next() }))
    .sort((x, y) => (x.r - y.r) || (x.jitter - y.jitter));

  // Draw from the three worst rather than always the single worst, so a power with two
  // enemies has fought both.
  const pool = others.slice(0, Math.min(3, others.length));
  if (!pool.length) return [a, keys[(keys.indexOf(a) + 1) % keys.length]];
  return [a, pool[Math.floor(rng.next() * pool.length)].k];
}

/** Where a debris field sits right now. Fields do not orbit — they are a scatter, not a body. */
export function gravePosition(g, out = { x: 0, y: 0, z: 0 }) {
  out.x = Math.cos(g.angle) * g.orbit;
  out.y = 0;
  out.z = Math.sin(g.angle) * g.orbit;
  return out;
}

// ── the uniform landmark list ────────────────────────────────────────

const _v = { x: 0, y: 0, z: 0 };

/**
 * Every place in this system, in one shape.
 *
 * `tags` is the interesting field. A template asks for tags rather than for a kind, because
 * "somewhere a survey would pay for" is answered by a gas giant, an uncharted Lagrange point
 * and (when they arrive) a moon, and a template keyed on `kind === 'planet'` would miss two
 * of the three.
 */
export function landmarks() {
  const out = [];
  const world = S.world;
  if (!world) return out;

  // ── planets ──
  for (const b of (world.bodies || [])) {
    const u = b.userData;
    if (u.kind !== 'planet') continue;
    const tags = new Set(['body', 'planet']);
    if (u.rings) tags.add('ringed');
    if (u.classCategory === 'giant') tags.add('giant');
    if (!u.pressureBar || u.pressureBar < 1e-4) tags.add('airless');
    if (u.pressureBar > 4) tags.add('thick-atmosphere');
    if (u.corrosive) tags.add('corrosive');
    if (u.breathable) tags.add('breathable');
    if (u.tempK > 600) tags.add('hot');
    if (u.tempK < 150) tags.add('frozen');
    if ((u.volatiles || 0) > 0.6) tags.add('volatile');
    if ((u.gravityG || 1) > 2.2) tags.add('high-gravity');
    if (((S.scans && S.scans[u.name]) || 0) > 0) tags.add('charted');
    else tags.add('uncharted');
    out.push({
      id: 'planet:' + u.name, kind: 'planet', name: u.name,
      label: u.kind2 || u.typeName || 'world',
      detail: u.classKind || u.typeName || '',
      orbit: u.orbitRadius || 0, tags, obj: b,
      at: (o) => { const p = b.position; (o = o || {}).x = p.x; o.y = p.y; o.z = p.z; return o; }
    });
  }

  // ── stations ──
  for (const st of (world.stations || [])) {
    const u = st.userData;
    const tags = new Set(['station', 'crewed', 'charted', 'dockable']);
    if (u.category) tags.add(u.category);
    if (u.category === 'pirate') tags.add('hostile');
    out.push({
      id: 'station:' + u.name, kind: 'station', name: u.name,
      label: u.typeName || 'station', detail: u.typeName || '',
      orbit: u.orbitRadius || 0, tags, obj: st,
      at: (o) => { const p = st.position; (o = o || {}).x = p.x; o.y = p.y; o.z = p.z; return o; }
    });
  }

  // ── belts ──
  const plan = S.systemPlan;
  for (const b of ((plan && plan.belts) || [])) {
    const tags = new Set(['belt', 'field', 'mineral', 'charted']);
    if (b.mix && b.mix.volatiles > 0.3) tags.add('volatile');
    out.push({
      id: 'belt:' + b.key, kind: 'belt', name: b.name,
      label: 'rock field', detail: 'rock field',
      orbit: b.inner + b.width / 2, tags, belt: b,
      at: (o) => { (o = o || {}).x = b.inner + b.width / 2; o.y = 0; o.z = 0; return o; }
    });
  }

  // ── Lagrange points ──
  for (const lp of lagrangePoints()) {
    const tags = new Set(['lagrange', 'quiet']);
    const known = lpCharted(lp);
    tags.add(known ? 'charted' : 'uncharted');
    const an = known ? null : anomalyAt(lp);
    if (an) tags.add('anomaly');
    out.push({
      id: 'lp:' + lp.key, kind: 'lagrange', name: lp.name,
      label: 'libration point', detail: 'libration point',
      orbit: (lp.parent && lp.parent.userData.orbitRadius) || 0, tags, lp,
      at: (o) => { const p = lp.parent && lp.parent.position; (o = o || {});
        if (!p) { o.x = o.y = o.z = 0; return o; }
        const a = (lp.parent.userData.angle || 0) + lp.lead;
        const r = lp.parent.userData.orbitRadius || 0;
        o.x = Math.cos(a) * r; o.y = p.y; o.z = Math.sin(a) * r; return o; }
    });
  }

  // ── graveyards ──
  for (const g of graveyards()) {
    const tags = new Set(['graveyard', 'wreckage', 'searchable', 'salvage']);
    if (g.deepSpace) tags.add('deep');
    // `in-belt`, not `belt`. A field that happens to sit inside a rock field is not itself
    // somewhere you cut ore, and tagging it `belt` had the extraction templates posting
    // "Ore quota — Widow Litter" against a debris field. Tags are a claim about what a place
    // *is*, not about what it is near.
    if (g.nearBelt) tags.add('in-belt');
    if (g.nearStation) tags.add('near-station');
    if (g.hazard > 1.2) tags.add('hazardous');
    if (g.ageYears > 200) tags.add('ancient');
    if ((g.yields.relic || 0) >= 1.5) tags.add('relics');
    if ((g.yields.data || 0) >= 1.5) tags.add('records');
    out.push({
      id: g.key, kind: 'graveyard', name: g.name,
      label: g.kind.toLowerCase(), detail: g.kind,
      orbit: g.orbit, tags, grave: g,
      at: (o) => gravePosition(g, o || {})
    });
  }

  return out;
}

/** Landmarks carrying every tag asked for. The primary query mission templates run. */
export function landmarksWith(tags, list) {
  const want = Array.isArray(tags) ? tags : [tags];
  return (list || landmarks()).filter(l => want.every(t => l.tags.has(t)));
}

/** Landmarks carrying at least one of these tags. */
export function landmarksAny(tags, list) {
  const want = Array.isArray(tags) ? tags : [tags];
  return (list || landmarks()).filter(l => want.some(t => l.tags.has(t)));
}

/** How far a landmark is from a point, right now. */
export function landmarkDistance(l, from) {
  l.at(_v);
  return Math.hypot(_v.x - from.x, _v.y - from.y, _v.z - from.z);
}

/** One landmark by id, or null. */
export const landmarkById = (id, list) => (list || landmarks()).find(l => l.id === id) || null;
