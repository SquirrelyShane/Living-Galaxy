// Living Galaxy — physical traits, derived rather than declared.
//
// The planet table in data/planets.js describes how a world *looks and behaves*: radius,
// colour, gravity, temperature, atmosphere. It says nothing about whether you can stand on
// it, and the planetary industry needs to know.
//
// These are derived from the existing fields rather than added as a second set of flags,
// because two hand-maintained descriptions of the same twenty worlds will disagree the
// first time anyone edits one of them. A gas giant is a gas giant because its type name
// says so and its gravity is enormous, not because someone remembered to tick a box.

import { PLANET_TYPES } from '../planets.js';

const GAS_TYPES = new Set(['gasGiant', 'heliumGiant', 'methaneGiant']);
const LIQUID_TYPES = new Set(['ocean', 'methaneSea']);

/** Everything the industry layer needs to know about the ground under a site. */
export function traitsOf(type) {
  const t = PLANET_TYPES[type];
  if (!t) return null;
  const [lo, hi] = t.temp || [0, 0];
  const mid = (lo + hi) / 2;
  return {
    gas: GAS_TYPES.has(type),
    liquid: LIQUID_TYPES.has(type),
    solid: !GAS_TYPES.has(type),
    // A sea counts as water you can work; so does an ice world, once you melt it.
    water: type === 'ocean' || type === 'ice' || type === 'tundra' || type === 'terrestrial' ||
           type === 'superEarth',
    atmo: !!t.atmo,
    gravity: t.gravity || 1,
    // "Temperate" means people can work here without the whole site being a pressure
    // vessel. It is a range test, not a list, so a new world type answers it for free.
    temperate: mid > -60 && mid < 60 && !GAS_TYPES.has(type),
    tempMid: mid
  };
}

/** Cached, because canBuild() is called for every facility in a list. */
const cache = new Map();
export function traits(type) {
  if (!cache.has(type)) cache.set(type, traitsOf(type));
  return cache.get(type);
}

export const isGas = type => !!(traits(type) && traits(type).gas);
export const isSolid = type => !!(traits(type) && traits(type).solid);
