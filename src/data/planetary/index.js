// Living Galaxy — planetary industry.
//
// The system already had twenty planet types with real physical differences — gravity,
// temperature, atmosphere, composition — and none of it had a consequence you could act
// on. A lava world and an ocean world were the same to a player: something to scan once
// and then fly past.
//
// This is the layer that makes the difference matter. The structure is deliberately three
// levels, in the order a player actually decides them:
//
//   Planet type  →  Command Centre  →  Branch  →  Facilities
//
// **Planet type** decides which resources are there to take and how hard the surface is
// to work. You do not choose it; it is where you are.
//
// **Command Centre** is the one thing you plant first, and it is typed to the world: an
// ocean rig is not a lava-crust anchor and neither is a gas-giant skyhook. It sets how
// many facility slots the world supports and how much power the site starts with.
//
// **Branch** is the doctrine the site is built around — military, industrial, logistic,
// economic or civilian — matching the five career paths, because a pilot who chose a
// career should find the same five words waiting for them on the ground.
//
// **Facilities** are what actually run: extractors, refineries, fabricators, farms.
//
// Each level lives in its own file. The branch files in ./branches are the ones that will
// grow, and keeping them separate means adding a facility never touches the planet table.

import { PLANET_TYPES } from '../planets.js';
import { COMMAND_CENTRES, centreFor, CENTRE_KEYS, upgradesFrom } from './centres.js';
import { BRANCHES, BRANCH_KEYS } from './branches/index.js';
import { PLANET_RESOURCES, resourcesFor, richnessOf, worldsWith } from './resources.js';
import { traits } from './traits.js';

export { PLANET_TYPES, COMMAND_CENTRES, CENTRE_KEYS, centreFor, upgradesFrom,
         BRANCHES, BRANCH_KEYS, PLANET_RESOURCES, resourcesFor, richnessOf,
         worldsWith, traits };

/** Every facility across every branch, by id. */
export const FACILITIES = {};
for (const b of BRANCH_KEYS) {
  for (const f of BRANCHES[b].facilities) {
    FACILITIES[f.id] = Object.assign({ branch: b }, f);
  }
}
export const FACILITY_KEYS = Object.keys(FACILITIES);
export const facility = id => FACILITIES[id] || null;

/** Facilities a branch offers at or below a given command-centre tier. */
export const facilitiesFor = (branch, tier = 3) =>
  (BRANCHES[branch] ? BRANCHES[branch].facilities : [])
    .filter(f => f.tier <= tier);

/**
 * Can this facility be built on this world?
 *
 * A facility declares what it needs from the ground under it — `requires` is a list of
 * conditions, not a whitelist of planet types. That matters because the planet table will
 * keep growing: a refinery that says "I need solid ground and 40 units of power" keeps
 * working when someone adds a new rock type, where one that lists eleven planet names by
 * hand quietly stops being buildable on the twelfth.
 */
export function canBuild(facilityId, planetType, site) {
  const f = FACILITIES[facilityId];
  const t = traits(planetType);
  if (!f || !t) return { ok: false, why: 'Unknown facility or world' };

  const centre = site && COMMAND_CENTRES[site.centre];
  if (!centre) return { ok: false, why: 'No command centre on this world' };
  if (f.tier > centre.tier) return { ok: false, why: `Needs a tier ${f.tier} command centre` };

  for (const req of (f.requires || [])) {
    if (req === 'solid' && !t.solid) return { ok: false, why: 'No surface to build on' };
    if (req === 'gas' && !t.gas) return { ok: false, why: 'Needs a deep atmosphere to work' };
    if (req === 'atmosphere' && !t.atmo) return { ok: false, why: 'No atmosphere here' };
    if (req === 'water' && !t.water && !t.liquid) return { ok: false, why: 'No accessible liquid' };
    if (req === 'temperate' && !t.temperate) return { ok: false, why: 'Surface conditions too extreme' };
    if (req === 'lowGravity' && t.gravity > 1.4) return { ok: false, why: 'Gravity too high' };
  }
  return { ok: true, why: null };
}

/** Headline numbers for a world, for the survey panel. */
export function planetaryProfile(planetType) {
  const t = PLANET_TYPES[planetType];
  if (!t) return null;
  const tr = traits(planetType);
  return {
    type: planetType,
    name: t.name,
    gravity: tr.gravity,
    gas: tr.gas, solid: tr.solid, liquid: tr.liquid,
    water: tr.water, temperate: tr.temperate,
    centres: centreFor(planetType),
    resources: resourcesFor(planetType)
  };
}
