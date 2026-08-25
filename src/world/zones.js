/**
 * RADIAL ZONE MAP
 *
 * The system's layout is declared before any body is placed, as fractions
 * of the total system radius. Every orbit is allocated into a zone, which
 * makes the layout rules structural rather than emergent:
 *
 *   - planets occupy inferno → outer  (0.04 … 0.80)
 *   - the asteroid belt is the SECOND-TO-LAST zone (0.80 … 0.90)
 *   - the halo is the last zone (0.90 … 1.00) and holds comets
 *
 * Because the belt band starts above every planetary band, a belt can no
 * longer overlap planetary space no matter what the seed rolls. The
 * generator asserts this and the HUD draws the same bands behind the
 * spectral strip, so a violation is visible as well as testable.
 */

export const ZONES = [
  { id: 'corona',    f: [0.00, 0.04], color: '#ffd9a0', label: 'COR', hosts: [] },
  { id: 'inferno',   f: [0.04, 0.14], color: '#ff7a4d', label: 'INF', hosts: ['rocky'] },
  { id: 'temperate', f: [0.14, 0.38], color: '#7cf0b8', label: 'TMP', hosts: ['rocky'] },
  { id: 'frostline', f: [0.38, 0.62], color: '#56d8ff', label: 'FRS', hosts: ['rocky', 'gas'] },
  { id: 'outer',     f: [0.62, 0.80], color: '#8f9bd6', label: 'OUT', hosts: ['gas'] },
  { id: 'belt',      f: [0.80, 0.90], color: '#c9a06a', label: 'BLT', hosts: ['asteroid'] },
  { id: 'halo',      f: [0.90, 1.00], color: '#4a5a86', label: 'HAL', hosts: ['comet'] }
];

export const ZONE = Object.fromEntries(ZONES.map(z => [z.id, z]));

/** Highest radius fraction any planet may occupy. */
export const PLANET_BAND = [ZONE.inferno.f[0], ZONE.outer.f[1]];

/** Which zone a normalized radius (0..1) falls in. */
export function zoneAt(frac) {
  for (const z of ZONES) {
    if (frac >= z.f[0] && frac < z.f[1]) return z;
  }
  return ZONES[ZONES.length - 1];
}

/** Absolute radius bounds of a zone for a given system radius. */
export function zoneBounds(id, systemRadius) {
  const z = ZONE[id];
  if (!z) return null;
  return { inner: z.f[0] * systemRadius, outer: z.f[1] * systemRadius };
}

/**
 * System radius from stellar mass. A heavier star holds a wider system,
 * but sub-linearly so the extremes stay renderable on a phone.
 */
export function systemRadiusFor(starMass) {
  return 46 + Math.sqrt(starMass) * 7.5;
}

/**
 * Structural audit. Returns violations rather than throwing, so the
 * generator can reject a seed and the HUD can flag a bad system.
 */
export function auditLayout(bodies, systemRadius) {
  const violations = [];
  const rOf = b => Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z);

  let outerPlanet = 0;
  let beltInner = Infinity;
  let beltOuter = 0;

  for (const b of bodies) {
    const r = rOf(b);
    if (b.type === 'planet') {
      outerPlanet = Math.max(outerPlanet, b.el ? b.el.a * (1 + b.el.e) : r);
    }
    if (b.type === 'asteroid') {
      const peri = b.el ? b.el.a * (1 - b.el.e) : r;
      const apo = b.el ? b.el.a * (1 + b.el.e) : r;
      beltInner = Math.min(beltInner, peri);
      beltOuter = Math.max(beltOuter, apo);
    }
  }

  if (beltInner !== Infinity && beltInner <= outerPlanet) {
    violations.push({
      code: 'BELT_INSIDE_PLANETS',
      detail: `belt periapsis ${beltInner.toFixed(1)} <= outermost planet apoapsis ${outerPlanet.toFixed(1)}`
    });
  }
  if (beltOuter > 0 && systemRadius && beltOuter > ZONE.belt.f[1] * systemRadius * 1.02) {
    violations.push({
      code: 'BELT_IN_HALO',
      detail: `belt apoapsis ${beltOuter.toFixed(1)} extends past the belt zone`
    });
  }
  if (systemRadius && outerPlanet > ZONE.outer.f[1] * systemRadius * 1.02) {
    violations.push({
      code: 'PLANET_IN_BELT',
      detail: `outermost planet apoapsis ${outerPlanet.toFixed(1)} reaches the belt zone`
    });
  }

  return {
    violations,
    outerPlanet,
    beltInner: beltInner === Infinity ? null : beltInner,
    beltOuter,
    systemRadius
  };
}
