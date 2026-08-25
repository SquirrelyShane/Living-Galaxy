// Living Galaxy — system generation. Turns a seed into a whole star system.
//
// Everything above this file used to read two hardcoded arrays: `SYSTEM_PLANETS`, twelve
// named worlds at fixed orbits, and `SYSTEM_STATIONS`, eleven named berths at fixed
// orbits. The world seed already existed and already drove rock composition, NPC rolls and
// persona memory — but the *shape* of the system it seeded was the same every time. A new
// game was a new economy in an old map.
//
// This produces a **plan**: a plain data description of a system, in the same shape the old
// tables were in, so nothing downstream had to learn a new vocabulary. `createSystem()`
// builds meshes from a plan, `createAsteroids()` builds fields from a plan, and neither
// knows or cares whether the plan was authored or generated.
//
// ## What the seed decides
//
// - The star: class, radius, colour, temperature, and a luminosity that everything else is
//   measured against.
// - How many planets there are (8–18), where they sit, and what class each one is —
//   biased by where it falls relative to that star's own habitable zone and frost line, so
//   an M-dwarf system's ice worlds start much further in than a blue giant's.
// - How many stations there are, what they are, and whether each one sits in a planet's
//   pocket or alone in a gap.
// - Where the belts are: the widest orbital gaps get them, with a mineral profile
//   interpolated from temperature rather than picked from a list.
// - Every name.
//
// ## Determinism is the whole contract
//
// Same seed in, byte-identical plan out, on any machine, at any time, forever. That is not
// a nicety: a save persists a seed and regenerates the system from it on load, and two
// players in a shared galaxy are handed the same seed by the server and have to agree
// about where Kharon is. `test/genesis.mjs` pins it.
//
// This is why the generator uses its own `makeRng` streams rather than the global `wnext()`
// the world uses at runtime, and why it draws them in a fixed order. A generator that
// consumes a shared random stream produces a different system depending on what else
// happened to draw from that stream first, which is a bug that only appears once somebody
// adds a feature three files away.

import { makeRng } from '../core/rng.js';
import { ORBIT_SCALE } from '../core/config.js';
import { PLANET_TYPES } from '../data/planetary/planets.js';
import { classifyWorld } from './taxonomy.js';
import { renderTypeFor } from '../data/worldgen/render-map.js';
import { insolation, initStar, lifespanMyr, massFromLuminosity } from './stellar.js';
import { lengthAU } from '../core/units.js';
import { initEpoch } from './epoch.js';
import { STATION_TYPES } from '../data/stations.js';
// The warp well formula, so the generator can place worlds *outside* the star's own well.
// `wellRadius` is a pure function of `{ gravity, radius }`; importing it is what stops this
// file and systems/warp.js disagreeing about how big a star is.
import { wellRadius } from '../systems/flight/warp.js';
import { SYSTEM_PLANETS } from '../data/planetary/planets.js';
import { SYSTEM_STATIONS } from '../data/stations.js';
import { BELTS } from '../data/belts.js';

/**
 * Bumped whenever the generator's output changes for an unchanged seed.
 *
 * v3 (1.02.49) — classify-by-condition. The generator no longer draws a planet's kind from
 * a weighted list; it draws a mass, and `world/taxonomy.js` derives the class from the
 * conditions that mass at that orbit actually produces. Stars also carry an age now, so a
 * given class's luminosity is no longer one fixed number. Both move every world for every
 * seed, which is exactly what this field is for.
 * v2 (1.02.34) — `innerLimit()`: planets and berths are placed outside the star's own warp
 * well. That moves the innermost orbits for every seed, so a system generated at v1 is not
 * the system that seed generates now. This is exactly what the field is for: a save records
 * the version that built its world, so the mismatch is detectable rather than a player
 * quietly waking up somewhere subtly different.
 * v1 (1.02.33) — the first generator.
 */
export const GENESIS_VERSION = 4;

// The outer wall. The nav map's radial scale is built against this and the warp planner
// assumes the system fits inside it; a generator free to place a world at 90,000 units
// would produce a chart with everything bunched at the centre and one dot on the rim.
const MAX_ORBIT = 38000 * ORBIT_SCALE;
const MIN_ORBIT = 2100 * ORBIT_SCALE;

// The star's own warp well, as a floor on the innermost orbit.
//
// `WARP.well` caps a well "relative to the body's own size, so a star can't project a well
// that swallows its own inner planets" — and that cap was tuned against the only star that
// used to exist, a 320-unit yellow dwarf. An 820-unit blue supergiant carries the same
// `gravity: 12` and projects a well several thousand units across, which on a generated
// system swallowed the entire inner system: every berth inside it, every hull crawling
// between them at cruise because a bubble will not hold in a well.
//
// Measured on seed 20260814 before this: **80% of every hauler's flight time** was spent
// inside Xanium Prime's well at 15 u/s. The fix is not to shrink the well — the well is a
// real rule the player obeys too — it is to stop generating worlds inside it.
const STAR_WELL_MARGIN = 1.35;
function innerLimit(star) {
  const well = wellRadius({ gravity: 12, radius: star.radius });
  return Math.max(MIN_ORBIT, (star.radius + well) * STAR_WELL_MARGIN);
}

// ── star classes ─────────────────────────────────────────────────────
// Real-ish spectral classes, weighted the way the galaxy actually is: M-dwarfs are most of
// the sky and O-types essentially never happen. `lum` is what moves the habitable zone, so
// it is the single number that decides what kind of system this turns out to be.
export const STAR_CLASSES = [
  { key: 'M', name: 'Red dwarf',      weight: 34, radius: 200, color: 0xff7a4a, temp: 3200,  lum: 0.22 },
  { key: 'K', name: 'Orange dwarf',   weight: 24, radius: 260, color: 0xffa050, temp: 4600,  lum: 0.55 },
  { key: 'G', name: 'Yellow dwarf',   weight: 18, radius: 320, color: 0xfff0a0, temp: 5700,  lum: 1.00 },
  { key: 'F', name: 'Yellow-white',   weight: 11, radius: 380, color: 0xfff8d8, temp: 6800,  lum: 1.80 },
  { key: 'A', name: 'White star',     weight: 7,  radius: 450, color: 0xdcecff, temp: 8600,  lum: 3.20 },
  { key: 'B', name: 'Blue giant',     weight: 4,  radius: 620, color: 0x9fc4ff, temp: 16000, lum: 6.50 },
  { key: 'O', name: 'Blue supergiant',weight: 1,  radius: 820, color: 0x8fb0ff, temp: 32000, lum: 11.0 },
  // The one that is not a main-sequence star. A carbon star is dim, enormous and deep red,
  // and a system around one is an outer system all the way in — which is a different place
  // to work rather than a worse one.
  { key: 'C', name: 'Carbon star',    weight: 3,  radius: 700, color: 0xd04820, temp: 2800,  lum: 0.35 }
];

// ── planet class by temperature band ─────────────────────────────────
// Each band is "how hot is this orbit, relative to the star's habitable distance". Keys are
// the same `PLANET_TYPES` the renderer already knows how to draw, so a class added to that
// table becomes generatable by listing it here and nowhere else.
//
// Bands overlap deliberately. A hard cut produces systems that read as a sorted list —
// lava, lava, desert, terrestrial, ice, ice — where the overlap gives you the occasional
// iron world sitting where you expected an ocean, which is what makes a system worth
// looking at rather than parsing.
// ── how massive a world at this orbit is ─────────────────────────────
//
// The BANDS table that used to live here is gone, and what replaced it is the point of this
// whole slice.
//
// It was a list of orbit ratios, each naming a weighted set of planet types. A world's kind
// came out of a uniform draw from whichever band it landed in. That is the shape of bug the
// world catalogue exists to kill: the label and the physics were two unrelated systems
// printed next to each other, so a `crystalline` world could sit anywhere its band allowed
// with nothing checking whether crystals could exist there, and every world of a given type
// was identical to every other because the type WAS the description.
//
// Now the generator decides only what it is actually entitled to decide — **where a world
// is and how heavy it is** — and `world/taxonomy.js` derives what that makes it. A class is
// selected only from classes whose declared envelope contains the body's computed
// insolation, mass, temperature and volatile inventory, so a frozen world in an inferno
// orbit is not unlikely, it is *unrepresentable*.
//
// The mass ladder below is the one thing left that is a table, and it is a real one: inner
// worlds are small and rocky, the frost line is where accretion gets cheap and giants form,
// and the far outer system runs to ice giants. Bands overlap so the boundary is not visible
// as a wall.
const MASS_BANDS = [
  { max: 0.30, mass: [0.04, 1.6],  giant: 0 },      // scorched inner rock
  { max: 0.75, mass: [0.15, 3.2],  giant: 0 },
  { max: 1.40, mass: [0.30, 6.0],  giant: 0 },      // the habitable band
  { max: 2.20, mass: [0.20, 4.0],  giant: 0.05 },
  { max: 3.60, mass: [0.40, 12 ],  giant: 0.45 },   // frost line: giants become likely
  { max: 7.00, mass: [8,    900],  giant: 0.70 },
  { max: Infinity, mass: [3,  240], giant: 0.55 }   // outer system: ice giants
];

// Station archetypes and how common each is. The guarantees below matter more than the
// weights: a system with no shipyard is a system where the executive career cannot
// commission a hull, which is a soft-lock produced by a dice roll.
const STATION_WEIGHTS = [
  ['tradeHub', 5], ['depot', 5], ['refinery', 4], ['foundry', 3],
  ['habitat', 4], ['fortress', 3], ['relay', 2]
];
const STATION_GUARANTEE = ['tradeHub', 'foundry', 'refinery', 'fortress', 'depot'];

const STATION_COLORS = {
  tradeHub: 0xff66ff, depot: 0x55ee77, refinery: 0xee9922, foundry: 0xffaa22,
  habitat: 0x88ccff, fortress: 0xff4455, relay: 0x99ddff
};

// ── names ────────────────────────────────────────────────────────────
// Syllable assembly rather than a fixed list, because a fixed list of 200 names runs out
// and starts repeating within one system once the planet count can reach 18.
const HEAD = ['Ae', 'Ar', 'Bel', 'Cal', 'Cor', 'Dra', 'El', 'Fen', 'Gal', 'Hal', 'Ic', 'Jor',
  'Kar', 'Kro', 'Lys', 'Mer', 'Nyx', 'Ob', 'Or', 'Pyr', 'Quel', 'Rhe', 'Sol', 'Tal', 'Thr',
  'Ur', 'Vel', 'Vor', 'Xan', 'Yl', 'Zeph'];
const TAIL = ['ara', 'is', 'on', 'us', 'yx', 'ia', 'or', 'eth', 'an', 'ex', 'ium', 'ade',
  'ora', 'yn', 'ess', 'aris', 'una', 'ide', 'ynth', 'ova'];
const STATION_HEAD = ['Anvil', 'Bastion', 'Cradle', 'Drift', 'Ember', 'Forge', 'Gate',
  'Harbour', 'Iron', 'Keel', 'Lantern', 'Marrow', 'Nadir', 'Orchard', 'Pillar', 'Quarry',
  'Rampart', 'Spindle', 'Tally', 'Vault', 'Warden'];
const STATION_TAIL = ['Station', 'Reach', 'Post', 'Yard', 'Halt', 'Works', 'Hold', 'Nexus',
  'Terminal', 'Platform', 'Relay', 'Complex', 'Ring'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// What a berth on a field is called. Deliberately *derived from the belt* rather than drawn
// from the general station namer: a station called "Meridian Quarry" tells a pilot which
// field it is on before they have opened anything, and "Vault Terminal" sitting at 11,300
// tells them nothing. The belt already has a name the generator chose; this borrows its
// head and says what the place does.
const BERTH_METAL = ['Quarry', 'Works', 'Smelter', 'Cut', 'Foundry Halt', 'Slag Yard'];
const BERTH_ICE   = ['Icehouse', 'Cold Store', 'Rime Depot', 'Frost Halt', 'Cistern'];

function beltBerthName(beltName, volatile, rng) {
  const head = String(beltName).split(' ')[0];
  const table = volatile ? BERTH_ICE : BERTH_METAL;
  return head + ' ' + table[Math.floor(rng.next() * table.length)];
}

/** Weighted pick from `[[value, weight], ...]`. Deterministic given the rng. */
function weighted(rng, table) {
  let total = 0;
  for (const row of table) total += row[1];
  let r = rng.next() * total;
  for (const row of table) { r -= row[1]; if (r <= 0) return row[0]; }
  return table[table.length - 1][0];
}

/** A name factory that will not hand out the same name twice. */
function namer(rng, heads, tails, join = '') {
  const used = new Set();
  return () => {
    for (let i = 0; i < 200; i++) {
      const n = heads[Math.floor(rng.next() * heads.length)] + join +
                tails[Math.floor(rng.next() * tails.length)];
      if (!used.has(n)) { used.add(n); return n; }
    }
    // Exhausting 600-odd combinations is not realistic, but a name generator that can
    // return undefined is a crash three files away rather than an ugly name here.
    let n, k = 2;
    do { n = heads[0] + join + tails[0] + ' ' + ROMAN[Math.min(k++, ROMAN.length - 1)]; }
    while (used.has(n) && k < 40);
    used.add(n);
    return n;
  };
}

// ── the plan ─────────────────────────────────────────────────────────

/**
 * Generate a system from a seed.
 *
 * @param {number} seed
 * @param {object} [opts]
 * @param {number} [opts.density] multiplier on how much is in the system — worlds, berths
 *   and fields. Applied *after* each count is drawn, never to the stream itself, so a
 *   density of 1 reproduces every seed byte for byte. See `GEN` in `config/world.js` for
 *   why that property matters more than it looks.
 * @returns {object} plan — { version, seed, layout, star, planets, stations, belts }
 */
export function generateSystem(seed, opts) {
  // Clamped rather than trusted: this arrives from a slider, from a save, and from the
  // network, and a density of zero is a system with no worlds in it.
  const density = Math.max(0.4, Math.min(3, (opts && opts.density) || 1));
  // Four independent streams, drawn in a fixed order. Separate streams mean adding a
  // station rule later cannot shift every planet in every existing seed.
  const rStar = makeRng((seed ^ 0x51a2) >>> 0);
  const rPlanet = makeRng((seed ^ 0x9e37) >>> 0);
  const rStation = makeRng((seed ^ 0x2f1b) >>> 0);
  const rBelt = makeRng((seed ^ 0x7c4d) >>> 0);
  const rName = makeRng((seed ^ 0x1d0f) >>> 0);

  const bodyName = namer(rName, HEAD, TAIL);
  const stationName = namer(rName, STATION_HEAD, STATION_TAIL, ' ');

  // ── the star ──
  const cls = weighted(rStar, STAR_CLASSES.map(c => [c, c.weight]));
  const star = {
    name: bodyName() + ' Prime',
    class: cls.key,
    className: cls.name,
    radius: Math.round(cls.radius * (0.9 + rStar.next() * 0.2)),
    color: cls.color,
    tempK: cls.temp,
    lum: cls.lum
  };
  star.corona = Math.round(star.radius * 2.44);

  // ── how old is it ──────────────────────────────────────────────────
  //
  // `cls.lum` from the table is the star's **zero-age** luminosity. `initStar` rolls it
  // forward to the age below and writes the evolved value back into `star.lum`, so every
  // consumer — the habitable-zone maths on the next line, the classifier, the light rig,
  // the nav chart — reads the star as it is now without learning a new field name.
  //
  // The age is drawn as a fraction of the star's own main-sequence lifetime rather than in
  // absolute years, because those lifetimes span four orders of magnitude: eight billion
  // years is a middle-aged K-dwarf and several times the entire life of a B-type. Drawing
  // in absolute years would make every massive star in the galaxy a corpse.
  //
  // The band stops at 0.92 on purpose. Past 1.0 a star leaves the main sequence and starts
  // swallowing its inner system, and a galaxy where one system in ten greets the player with
  // a red giant and four surviving worlds is a worse place to play than it sounds. Deep time
  // past that point is reachable — `advanceEpoch` will take a system all the way to a white
  // dwarf, and the tests do exactly that — it is simply not where systems *start*.
  const ageFrac = 0.06 + rStar.next() * 0.86;
  initStar(star, lifespanMyr(massFromLuminosity(cls.lum)) * ageFrac);
  star.ageFrac = ageFrac;

  // Where water freezes, and where it does not boil. Everything about planet class is
  // measured against this one distance, which is why a dim star's whole system is
  // compressed inward rather than simply colder.
  const habitable = 9000 * Math.sqrt(star.lum) * ORBIT_SCALE;

  // ── planets ──
  // Bode-like geometric spacing with jitter: each orbit is a multiplier on the last, so
  // the inner system is tight and the outer system is sparse, which is both what real
  // systems look like and what makes the square-root nav chart readable.
  const wanted = Math.max(3, Math.min(30,
    Math.round((8 + Math.floor(rPlanet.next() * 11)) * density)));   // 8..18 at density 1
  const planets = [];
  const floorR = innerLimit(star);
  let orbit = floorR * (1.0 + rPlanet.next() * 0.35);
  for (let i = 0; i < wanted; i++) {
    if (orbit > MAX_ORBIT) break;
    // How far out this orbit is in units of "where liquid water would sit". Below 1 is
    // inside the habitable zone and hot, above 1 is outside it and cold.
    const ratio = orbit / habitable;
    const band = MASS_BANDS.find(b => ratio <= b.max) || MASS_BANDS[MASS_BANDS.length - 1];

    // The generator's whole remaining say in what a world is: where, and how heavy. Mass is
    // drawn log-uniformly because the interesting span runs from a Mercury to a Jupiter and
    // a linear draw in that range is a Jupiter almost every time.
    const giant = rPlanet.next() < band.giant;
    const [m0, m1] = band.mass;
    const massEarth = Math.exp(Math.log(m0) + rPlanet.next() * (Math.log(m1) - Math.log(m0)));

    const at = Math.round(orbit);
    const rand = () => rPlanet.next();
    const S = insolation(star.lum, lengthAU(at));
    const c = classifyWorld({ simMass: massEarth, S, rand, giant });

    // `type` is still here, still a `PLANET_TYPES` key, and still the only thing the
    // renderer reads. Everything downstream — the mesh builder, the nav chart, the survey
    // panel, every save ever written — kept working through this change because the field it
    // depends on did not move. What changed is where the value comes from: it is now a
    // projection of a classification rather than a draw from a bag.
    planets.push(Object.assign({
      name: bodyName(),
      type: renderTypeFor(c.classId),
      orbit: at,
      massEarth
    }, c));
    orbit *= 1.16 + rPlanet.next() * 0.30;                    // 1.16x .. 1.46x
  }
  // A system with nothing in it is not a system. Cannot happen with the numbers above, but
  // the generator should not be one tuning pass away from producing an empty map.
  if (!planets.length) {
    const at = Math.round(floorR);
    const rand = () => rPlanet.next();
    const c = classifyWorld({ simMass: 1, S: insolation(star.lum, lengthAU(at)), rand });
    planets.push(Object.assign({ name: bodyName(), type: renderTypeFor(c.classId),
                                 orbit: at, massEarth: 1 }, c));
  }

  // ── stations ──
  // Placed relative to planets rather than at arbitrary radii: a berth in a planet's pocket
  // is somewhere you can see a reason for, and it makes the nav map read as a system with
  // traffic instead of as two unrelated rings of dots.
  const stationCount = Math.max(STATION_GUARANTEE.length,
    Math.min(26, Math.round((6 + Math.floor(rStation.next() * 8)) * density)));  // 7..14 at density 1
  const stations = [];
  const types = STATION_GUARANTEE.slice();
  while (types.length < stationCount) types.push(weighted(rStation, STATION_WEIGHTS));
  // Shuffle so the guaranteed five are not always the innermost five. Fisher–Yates on a
  // seeded stream, so it is still reproducible.
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(rStation.next() * (i + 1));
    const t = types[i]; types[i] = types[j]; types[j] = t;
  }
  for (const type of types) {
    if (!STATION_TYPES[type]) continue;
    const anchor = planets[Math.floor(rStation.next() * planets.length)];
    // Just inside or just outside the anchor's orbit, never exactly on it.
    const side = rStation.next() < 0.5 ? -1 : 1;
    const off = anchor.orbit * (0.06 + rStation.next() * 0.16) * side;
    // Never inside the star's well either — a berth in there is a berth every hull has to
    // crawl to and from.
    const at = Math.round(Math.max(floorR, Math.min(MAX_ORBIT, anchor.orbit + off)));
    stations.push({
      name: stationName(), type, orbit: at,
      color: STATION_COLORS[type] || 0xb0c4d8,
      near: anchor.name
    });
  }
  stations.sort((a, b) => a.orbit - b.orbit);

  // ── belts ──
  // The widest gaps between consecutive planets, because that is where rock survives: a
  // field close to a world gets swept up by it. Composition is interpolated from the gap's
  // temperature rather than chosen from a list — metal in close, volatiles out past the
  // frost line, and a genuine mixed field in between.
  const gaps = [];
  for (let i = 0; i < planets.length - 1; i++) {
    const lo = planets[i].orbit, hi = planets[i + 1].orbit;
    gaps.push({ lo, hi, span: hi - lo, mid: (lo + hi) / 2 });
  }
  gaps.sort((a, b) => b.span - a.span);
  const beltCount = Math.min(gaps.length,
    Math.max(1, Math.round((2 + Math.floor(rBelt.next() * 3)) * density)));   // 2..4 at density 1
  const belts = [];
  for (let i = 0; i < beltCount; i++) {
    const g = gaps[i];
    // Same measure the planet bands use, inverted: >1 is hotter than the habitable zone.
    const heat = habitable / Math.max(1, g.mid);
    const inner = Math.round(g.lo + g.span * (0.22 + rBelt.next() * 0.20));
    const width = Math.round(g.span * (0.24 + rBelt.next() * 0.26));
    belts.push({
      key: `belt-${i}`,
      name: bodyName() + ' ' + (heat > 1.2 ? 'Belt' : heat > 0.45 ? 'Reach' : 'Rime'),
      inner, width,
      count: Math.round(90 + rBelt.next() * 220),
      rockR: [3.5, 12 + rBelt.next() * 11],
      hue: heat > 0.6 ? 0.06 + rBelt.next() * 0.05 : 0.5 + rBelt.next() * 0.08,
      sat: 0.10 + rBelt.next() * 0.12,
      light: [0.20 + rBelt.next() * 0.16, 0.42 + rBelt.next() * 0.20],
      mix: mixFor(heat, rBelt)
    });
  }
  belts.sort((a, b) => a.inner - b.inner);

  // Somewhere in this system has to sell volatiles.
  //
  // A hot star pushes its frost line past the outermost gap, so every field comes back
  // metal-rich and the volatile economy — crew rations, coolant, half the crafting tree —
  // has no source at all in that system. That is not a hard system, it is a broken one: an
  // entire commodity with no origin. The outermost field is re-rolled cold if nothing else
  // is, which is also physically the right place for it.
  if (belts.length && !belts.some(b => b.mix.volatiles > 15)) {
    const outer = belts[belts.length - 1];
    outer.mix = mixFor(0.25, rBelt);
    outer.name = outer.name.replace(/ (Belt|Reach)$/, ' Rime');
    outer.hue = 0.5 + rBelt.next() * 0.08;
  }

  // ── berths on the belts ──
  //
  // Stations were placed against *planets* only, which produced systems where the mining
  // fields — the places a pilot actually spends their hours — had nothing in them. You
  // warped out to a field, cut rock until the hold was full, and then flew all the way
  // back to a planet's pocket to sell it, every single run. The field was a resource, not
  // a place.
  //
  // A berth on the belt is what turns it into one: somewhere to sell without leaving,
  // somewhere for a pirate to raid, and a name on the chart at the radius where the work
  // happens. It also gives the two industrial classes a reason to exist that is not "the
  // generator rolled one" — a refinery belongs next to ore.
  //
  // What each field gets follows what is in it. A metal field gets a refinery or a foundry
  // — smelting is done where the mass is, because hauling slag is the thing nobody wants
  // to pay for. A volatile field gets a depot: ice is stored and shipped, not refined.
  for (const belt of belts) {
    const volatile = (belt.mix.volatiles || 0) > 25;
    const type = volatile ? 'depot' : (rStation.next() < 0.4 ? 'foundry' : 'refinery');
    // On the mid-orbit, slightly off it, so a berth is inside the field it works rather
    // than parked at its edge — and so two berths on the same field are not co-located.
    const mid = belt.inner + belt.width * (0.35 + rStation.next() * 0.3);
    stations.push({
      name: beltBerthName(belt.name, volatile, rStation),
      type,
      orbit: Math.round(Math.max(floorR, Math.min(MAX_ORBIT, mid))),
      color: STATION_COLORS[type] || 0xb0c4d8,
      near: belt.name,
      // Which field this berth works. `world/system.js` does not need it, but the market
      // does — a refinery sitting in a titanium field should not be surprised by titanium
      // — and a chart that can say "the berth on the Meridian Belt" is worth the field.
      belt: belt.key
    });
  }
  stations.sort((a, b) => a.orbit - b.orbit);

  return {
    version: GENESIS_VERSION,
    seed: seed >>> 0,
    layout: 'procedural',
    star, planets, stations, belts,
    habitable: Math.round(habitable),
    // The inner wall this system was laid out against, so the suite can assert it and a
    // future generator version can be compared against it.
    innerLimit: Math.round(floorR)
  };
}

/**
 * A belt's mineral profile from how hot it is.
 *
 * The four authored belts in `data/belts.js` were four hand-tuned mixes on a temperature
 * gradient — hot metal, balanced workhorse, rare-metal trojan field, cold volatile rime.
 * This is that gradient as a function, so a generated system gets the same *economics*
 * (there is always somewhere cheap to cut iron and somewhere expensive to cut volatiles)
 * without the same four fields.
 */
function mixFor(heat, rng) {
  // t: 0 = far outside the frost line, 1 = right up against the star.
  const t = Math.max(0, Math.min(1, (heat - 0.25) / 1.6));
  const j = () => 0.85 + rng.next() * 0.3;
  const lerp = (a, b) => a + (b - a) * t;
  return {
    iron:      +(lerp(11, 44) * j()).toFixed(2),
    silicate:  +(lerp(14, 33) * j()).toFixed(2),
    nickel:    +(lerp(5, 16) * j()).toFixed(2),
    copper:    +(lerp(3, 9) * j()).toFixed(2),
    // Rares peak in the middle band, which is what makes the trojan field worth the trip
    // rather than "the outer belt is simply better".
    titanium:  +(lerp(4, 6) * (1 + 2.4 * Math.sin(Math.PI * t)) * j()).toFixed(2),
    platinum:  +(lerp(1.2, 1.6) * (1 + 4.0 * Math.sin(Math.PI * t)) * j()).toFixed(2),
    iridium:   +(lerp(0.4, 0.5) * (1 + 6.0 * Math.sin(Math.PI * t)) * j()).toFixed(2),
    volatiles: +(lerp(60, 0.2) * j()).toFixed(2)
  };
}

/**
 * The authored Solaris system, in plan shape.
 *
 * Kept, and kept exact, for two reasons that are both about not breaking things that
 * already exist. A save written before this patch describes a world by name — the scans it
 * has archived, the surveys it has run, the station its company is registered at, the
 * berths its haulers are running between — and regenerating that save's seed procedurally
 * would dangle every one of those references. And the suite has twenty years of assertions
 * about Gaia, Titanus and Obscura in it.
 *
 * So: migrated saves and the default bootstrap get this. New games get a generated one.
 */
export function solarisPlan() {
  return {
    version: GENESIS_VERSION,
    seed: 0,
    layout: 'solaris',
    star: {
      name: 'Solaris Prime', class: 'G', className: 'Yellow dwarf',
      radius: 320, corona: 780, color: 0xfff0a0, tempK: 5700, lum: 1.0
    },
    planets: SYSTEM_PLANETS.map(p => ({ name: p.name, type: p.type, orbit: p.orbit })),
    stations: SYSTEM_STATIONS.map(s => ({ name: s.name, type: s.type, orbit: s.orbit,
                                          color: s.color, near: null })),
    belts: BELTS.map(b => Object.assign({}, b)),
    habitable: 9000
  };
}

/**
 * Resolve a plan for a seed and a layout choice.
 *
 * `layout` is persisted in the save rather than inferred, because "which system am I in"
 * has to survive a generator change. If v2 of this file places stations differently, a
 * save that says `procedural` and carries `version: 1` can be detected and told so, rather
 * than silently loading into a system that is subtly not the one it was written in.
 */
export function planFor(seed, layout, opts) {
  return layout === 'solaris' ? solarisPlan() : generateSystem(seed, opts);
}

/** One line for the boot screen and the nav chart header. */
export function systemLine(plan) {
  if (!plan) return '';
  const p = plan.planets.length, s = plan.stations.length, b = plan.belts.length;
  // The designation, when the plan has been placed. Attached by the boot path rather than
  // computed here, because this module must not depend on the galaxy — genesis says what a
  // system *is*, the galaxy says where it is, and the arrow between them points one way only.
  const where = plan.designation ? `${plan.designation} · ` : '';
  return `${where}${plan.star.name} · ${plan.star.className} · ` +
         `${p} world${p === 1 ? '' : 's'} · ${s} station${s === 1 ? '' : 's'} · ` +
         `${b} field${b === 1 ? '' : 's'}`;
}
