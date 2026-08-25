/**
 * DATABASE FACADE
 *
 * One import for the whole catalogue, plus the composition roller — the
 * function that decides which ores a specific body actually contains.
 *
 * COMPOSITION IS NOT A RANDOM DRAW
 *
 * A body's mineral suite is filtered three ways before anything is rolled:
 *
 *   TEMPERATURE  the mineral's formation band must contain the body's
 *                equilibrium temperature. This is the condensation
 *                sequence doing the work, and it is why water ice never
 *                appears on a lava world and iridium never appears in a
 *                halo comet.
 *
 *   HOST TYPE    the mineral must occur in this kind of body at all.
 *
 *   ENVIRONMENT  the mineral's formation tags must intersect the tags the
 *                body's class offers. Hydrothermal ores need circulating
 *                water; biogenic ores need a biosphere to have made them.
 *
 * Only what survives all three is weighted by rarity and drawn. The result
 * is that a body's ore list is a readable consequence of where it is and
 * what it is, rather than decoration.
 *
 * Pure module: no DOM, no three.js.
 */

export * from './atmospheres.js';
export * from './worlds.js';
export * from './minerals.js';
export * from './smallbodies.js';

import { MINERALS, candidatesFor, rarityTier } from './minerals.js';
import { WORLD } from './worlds.js';
import { ASTEROID, COMET } from './smallbodies.js';

/**
 * Roll a body's mineral composition.
 *
 * @param tempK      equilibrium temperature
 * @param hostType   'planet' | 'moon' | 'asteroid' | 'comet' | 'giant' | 'core'
 * @param tags       formation environments the host's class offers
 * @param rand       seeded 0..1 generator — determinism matters, the GD
 *                   must be able to regenerate a system from its seed
 * @param count      how many distinct minerals to surface
 * @param bias       0..1 — pushes selection toward rarer entries; a body
 *                   that has been through something unusual (a core, a
 *                   singularity's tidal field) carries a higher bias
 */
export function rollComposition({ tempK, hostType, tags, rand, count = 4, bias = 0 }) {
  const pool = candidatesFor({ tempK, hostType, tags });
  if (!pool.length) return [];

  // Weight by rarity. bias tilts the exponent so a high-bias body reaches
  // deeper into the rare tail without ever making rare things common.
  const exponent = 1 - Math.max(0, Math.min(0.9, bias));
  const weighted = pool.map(m => ({ m, w: Math.pow(Math.max(1e-4, m.rarity), exponent) }));

  const picked = [];
  const remaining = weighted.slice();
  const n = Math.min(count, remaining.length);

  for (let i = 0; i < n; i++) {
    let total = 0;
    for (const e of remaining) total += e.w;
    let roll = rand() * total;
    let idx = remaining.length - 1;
    for (let k = 0; k < remaining.length; k++) {
      roll -= remaining[k].w;
      if (roll <= 0) { idx = k; break; }
    }
    picked.push(remaining[idx].m);
    remaining.splice(idx, 1);
  }

  // Abundance: the first pick dominates, the tail thins out. Normalised so
  // a dossier can print percentages that add up.
  const shares = picked.map((_, i) => 1 / Math.pow(i + 1.6, 1.35));
  const sum = shares.reduce((a, b) => a + b, 0);

  return picked.map((m, i) => ({
    id: m.id,
    name: m.name,
    symbol: m.symbol,
    category: m.category,
    abundance: shares[i] / sum,
    rarity: rarityTier(m),
    value: m.value,
    color: m.color
  }));
}

/** Total relative worth of a composition, per unit mass. */
export function compositionValue(composition) {
  if (!composition || !composition.length) return 0;
  return composition.reduce((sum, c) => sum + c.abundance * c.value, 0);
}

/** The single most valuable entry — what a survey report leads with. */
export function headlineMineral(composition) {
  if (!composition || !composition.length) return null;
  return composition.reduce((best, c) => (!best || c.value > best.value ? c : best), null);
}

/** Resolve any body's class record, whichever catalogue it lives in. */
export function classOf(body) {
  if (!body) return null;
  if (body.classId) {
    return WORLD[body.classId] || ASTEROID[body.classId] || COMET[body.classId] || null;
  }
  return null;
}

/** Catalogue sizes — used by the boot sequence and the integrity test. */
export function dbStats() {
  return {
    minerals: MINERALS.length,
    worlds: Object.keys(WORLD).length,
    asteroids: Object.keys(ASTEROID).length,
    comets: Object.keys(COMET).length
  };
}
