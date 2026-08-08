// Living Galaxy — moon classes.
//
// Moons used to be grey spheres with a name and a radius. `systems/planetary.js` has
// accepted `kind === 'moon'` as a valid site body since v1.00.20, but a moon carried no
// `ptype`, so `COMMAND_CENTRES[key].worlds.includes(undefined)` was false for every centre
// and *no moon in the game could ever be built on*. The layer said yes and the data said
// nothing.
//
// The fix is not a `worlds` special case. It is to give a moon the same physical identity
// a planet has, so that every system that already knows how to read a world — resources,
// traits, centres, facilities, the assay, the scanner — reads a moon for free and keeps
// reading it as those tables grow.
//
// Each class therefore maps onto an existing `PLANET_TYPES` key rather than inventing a
// parallel vocabulary. `ptype` is what the industry sees; `name` is what the pilot sees.
// A Cryovolcanic Moon is a `methaneIce` world to the extractor and a cryovolcanic moon on
// the panel, and nobody has to maintain two descriptions of the same rock.
//
// Selection is physical, not random-with-a-table: what a moon is made of depends on how
// hot its primary is and how deep in that primary's well it sits. The innermost moon of a
// giant is tidally kneaded and volcanic; the outer ones are ice. That is why a gas giant
// you cannot land on is a better destination than a terrestrial you can — four moons, and
// they are not the same four.

/**
 * `ptype` — the PLANET_TYPES key this moon behaves as. Must exist in PLANET_TYPES or the
 *   trait derivation in data/planetary/traits.js returns null and the site layer refuses.
 * `size` — multiplier on the moon radius the parent would otherwise have given it.
 * `tidal` — true if this class only makes sense close in to a massive primary.
 */
export const MOON_TYPES = {
  regolith: {
    name: 'Regolith moon', ptype: 'barren', color: 0xa8a49c, size: 1.00, gravity: 0.22,
    temp: [-180, 90],
    desc: 'Airless, cratered, and dust all the way down. The cheapest ground in the system ' +
          'and the reason a survey outpost costs what it does.'
  },
  metallic: {
    name: 'Metallic fragment', ptype: 'ironCore', color: 0x9a8f80, size: 0.78, gravity: 0.34,
    temp: [-150, 140],
    desc: 'The stripped core of something that lost an argument. Dense, magnetic, and ' +
          'nearly solid nickel-iron.'
  },
  carbonaceous: {
    name: 'Carbonaceous moon', ptype: 'carbon', color: 0x3a3a42, size: 0.92, gravity: 0.18,
    temp: [-190, 40],
    desc: 'Captured, dark as soot, and never part of this system to begin with. Carbon and ' +
          'organics without the biology.'
  },
  tidal: {
    name: 'Tidal volcanic moon', ptype: 'sulfur', color: 0xd8c050, size: 0.95, gravity: 0.26,
    temp: [-60, 220], tidal: true,
    desc: 'Kneaded by its primary until the interior never cools. Sulfur plains, standing ' +
          'plumes, and an extraction rate nothing on a cold rock will match.'
  },
  molten: {
    name: 'Molten moonlet', ptype: 'lava', color: 0xff6a30, size: 0.70, gravity: 0.28,
    temp: [400, 1100], tidal: true,
    desc: 'Too close to a hot primary and too small to hold heat anywhere but the surface. ' +
          'A lava field with an orbit.'
  },
  ice: {
    name: 'Ice moon', ptype: 'ice', color: 0xd8ecf4, size: 1.05, gravity: 0.20,
    temp: [-220, -80],
    desc: 'Water ice over a rock core, bright enough to find from the inner system. The ' +
          'volatile supply the outer worlds run on.'
  },
  cryo: {
    name: 'Cryovolcanic moon', ptype: 'methaneIce', color: 0x86bcd8, size: 1.00, gravity: 0.23,
    temp: [-200, -120],
    desc: 'Nitrogen and methane erupting cold. Clathrates near enough to the surface to ' +
          'cut rather than drill.'
  },
  subOcean: {
    name: 'Subsurface ocean', ptype: 'ocean', color: 0xa8ccd8, size: 1.08, gravity: 0.25,
    temp: [-180, -40],
    desc: 'A shell of ice over liquid water kept warm by tide. Wherever this has been ' +
          'looked at properly, something has been living in it.'
  },
  vitrified: {
    name: 'Vitrified moon', ptype: 'crystalline', color: 0xa080d0, size: 0.85, gravity: 0.21,
    temp: [-140, 60],
    desc: 'Shock-glassed by an impact that should have destroyed it. Quartz and rare earths ' +
          'sitting on the surface where the melt froze.'
  }
};

export const MOON_KEYS = Object.keys(MOON_TYPES);

/** Gas and ice giants: massive enough to tidally heat what orbits closest. */
const GIANTS = new Set(['gasGiant', 'heliumGiant', 'methaneGiant', 'superEarth']);

/**
 * Weighted candidates for a moon of `parentType` at orbital index `index` (0 = innermost).
 *
 * Two inputs and no lookup table: the primary's mid temperature, and whether this moon is
 * close enough in to a massive primary to be tidally worked. Adding planet type twenty-one
 * needs no edit here — it gets moons from its temperature like everything else.
 */
export function moonCandidates(parentType, parentTempMid, index) {
  const giant = GIANTS.has(parentType);
  const inner = index === 0;
  const w = {};
  const add = (k, n) => { w[k] = (w[k] || 0) + n; };

  // Baseline: every primary can hold a plain rock or a stripped core.
  add('regolith', 10);
  add('metallic', 4);

  if (parentTempMid > 250) {
    // Hot primary — nothing volatile survives, and the innermost moonlet is molten.
    add('regolith', 8);
    add('vitrified', 3);
    if (inner) add('molten', 12);
  } else if (parentTempMid > -60) {
    // Temperate — dry rock, captured debris, the occasional glassed impact.
    add('carbonaceous', 6);
    add('vitrified', 4);
    add('ice', 2);
  } else {
    // Cold — ice dominates, and the outer moons of a cold primary are the volatile fields.
    add('ice', 14);
    add('cryo', 8);
    add('carbonaceous', 5);
  }

  if (giant) {
    // Tidal heating falls off hard with distance, so it is the inner moons that get it —
    // and a subsurface ocean needs a heat source that is not the star.
    if (inner) { add('tidal', 14); add('molten', parentTempMid > 250 ? 6 : 2); }
    if (index <= 1) add('subOcean', 10);
    if (index >= 2) { add('ice', 8); add('cryo', 5); }
  }
  return w;
}

/** Pick one class deterministically from the weights. `rng` is a seeded stream. */
export function moonClassFor(parentType, parentTempMid, index, rng) {
  const w = moonCandidates(parentType, parentTempMid, index);
  let total = 0;
  for (const k in w) total += w[k];
  let roll = rng.next() * total;
  for (const k in w) {
    roll -= w[k];
    if (roll <= 0) return k;
  }
  return 'regolith';
}
