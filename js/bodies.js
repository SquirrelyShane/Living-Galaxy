import {
  PERIOD_K,
  bodyStats,
  scaleOrbit,
  scaleRadius,
  scanRange,
  sphereOfInfluence,
  surfaceGravity,
  massIndex,
  mu,
  wellRadius,
  SHATTERED_MU,
} from "./scale.js";
import { archetypeById } from "./archetypes.js";
import { goodName } from "./materials.js";

export const SOL_BODIES = [
    {
        id: "sun",
        name: "Sol",
        kind: "star",
        radius: 8.4,
        orbit: 0,
        period: 1,
        phase: 0,
        inclination: 0,
        eccentricity: 0,
        spin: 0.04,
        color: "#ffb56b",
        scanHint: "Close enough to read the photosphere. Not closer.",
        blurb: "A G-type star. Everything else in this sky is a footnote to its mass.",
    },
    {
        id: "mercury",
        arch: "scorched",
        name: "Mercury",
        kind: "rocky",
        radius: 0.72,
        orbit: 18,
        period: 22,
        phase: 0.2,
        inclination: 0.05,
        eccentricity: 0.18,
        spin: 0.08,
        color: "#9a8f84",
        scanHint: "Scorched plains. No atmosphere to speak of.",
        blurb: "A cratered iron world that never quite keeps a night.",
    },
    {
        id: "venus",
        arch: "sulfuric",
        name: "Venus",
        kind: "cloud",
        radius: 1.15,
        orbit: 28,
        period: 56,
        phase: 1.1,
        inclination: 0.02,
        eccentricity: 0.01,
        spin: -0.03,
        color: "#d4b896",
        atmo: "#e8d7b0",
        scanHint: "Opaque sulfuric deck. Radar through the haze.",
        blurb: "A pressure cooker wrapped in pale cloud. Beautiful from a distance.",
    },
    {
        id: "earth",
        arch: "garden",
        name: "Earth",
        kind: "terra",
        radius: 1.22,
        orbit: 42,
        period: 92,
        phase: 0.4,
        inclination: 0,
        eccentricity: 0.02,
        spin: 0.22,
        color: "#6b9ac4",
        atmo: "#9ec4e6",
        scanHint: "Oceans, ice, weather. Home, if you still call it that.",
        blurb: "The only world in this system known to keep an open sky.",
    },
    {
        id: "moon",
        arch: "cratered",
        name: "Luna",
        kind: "moon",
        radius: 0.34,
        orbit: 3.2,
        period: 12,
        phase: 0.8,
        inclination: 0.04,
        eccentricity: 0.04,
        spin: 0.05,
        color: "#c5c0b6",
        parent: "earth",
        scanHint: "Grey maria. Old basalt. Quiet.",
        blurb: "Earth's companion. A convenient waypoint and a poor place to stay.",
    },
    {
        id: "mars",
        arch: "rust",
        name: "Mars",
        kind: "rocky",
        radius: 0.88,
        orbit: 58,
        period: 170,
        phase: 2.2,
        inclination: 0.03,
        eccentricity: 0.08,
        spin: 0.18,
        color: "#c0724a",
        atmo: "#c99a78",
        scanHint: "Iron dust, thin air, polar ice.",
        blurb: "A cold desert with the bones of a thicker atmosphere.",
    },
    {
        id: "jupiter",
        arch: "banded",
        name: "Jupiter",
        kind: "gas",
        radius: 4.4,
        orbit: 98,
        period: 420,
        phase: 0.7,
        inclination: 0.015,
        eccentricity: 0.04,
        spin: 0.45,
        color: "#c4a07a",
        atmo: "#d8c09a",
        scanHint: "Banded hydrogen. A storm older than most nations.",
        blurb: "A failed star, still generous with moons and radiation.",
    },
    {
        id: "saturn",
        arch: "banded",
        name: "Saturn",
        kind: "gas",
        radius: 3.7,
        orbit: 142,
        period: 640,
        phase: 3.1,
        inclination: 0.04,
        eccentricity: 0.05,
        spin: 0.4,
        color: "#e0cba0",
        atmo: "#efe0c0",
        rings: true,
        scanHint: "Ice rings, kilometers thin. Thread them if you dare.",
        blurb: "The system's jeweler. Most of the mass is still the planet.",
    },
    {
        id: "uranus",
        arch: "iceGiant",
        name: "Uranus",
        kind: "ice",
        radius: 2.25,
        orbit: 186,
        period: 880,
        phase: 1.6,
        inclination: 0.08,
        eccentricity: 0.04,
        spin: 0.16,
        color: "#9ad4d6",
        atmo: "#b7e4e6",
        scanHint: "Methane ice, rolled on its side.",
        blurb: "A pale giant that never quite aligned with the rest of the plane.",
    },
    {
        id: "neptune",
        arch: "iceGiant",
        name: "Neptune",
        kind: "ice",
        radius: 2.15,
        orbit: 228,
        period: 1100,
        phase: 4.2,
        inclination: 0.03,
        eccentricity: 0.02,
        spin: 0.18,
        color: "#4a6ec8",
        atmo: "#6b8ee0",
        scanHint: "The last giant. Wind like a wall.",
        blurb: "Dark, fast, and farther than it looks on the map.",
    },
    {
        id: "pluto",
        arch: "tholinDwarf",
        name: "Pluto",
        kind: "dwarf",
        radius: 0.42,
        orbit: 272,
        period: 1600,
        phase: 5.1,
        inclination: 0.14,
        eccentricity: 0.2,
        spin: 0.06,
        color: "#cbb9a8",
        scanHint: "A snowball at the edge of the chart.",
        blurb: "Not a giant. Still a destination.",
    },
];
export const PUBLIC_ROOM = "sol";
export const SOL_BEACONS = [
    { id: "inner", name: "Inner Probe", orbit: 34, period: 70, phase: 0.3, inclination: 0.12 },
    { id: "belt", name: "Belt Cache", orbit: 76, period: 240, phase: 1.8, inclination: -0.08 },
    { id: "jove", name: "Jovian Relay", orbit: 108, period: 390, phase: 2.4, inclination: 0.06 },
    { id: "ring", name: "Ring Sond", orbit: 148, period: 610, phase: 0.9, inclination: 0.1 },
    { id: "ice", name: "Iceward Buoy", orbit: 200, period: 920, phase: 4.0, inclination: -0.11 },
    { id: "edge", name: "Heliopause Tag", orbit: 250, period: 1400, phase: 5.5, inclination: 0.05 },
];
export const SOL_SYSTEM = {
    seed: PUBLIC_ROOM,
    name: "Sol",
    bodies: SOL_BODIES,
    beacons: SOL_BEACONS,
    belt: { inner: 72, outer: 84, count: 240 },
    outerBelt: { inner: 190, outer: 232, count: 260 },
};
/* ---- scaling ------------------------------------------------------------
 * Authored catalogs above are in compact "design units". Everything the sim
 * and renderer touch is the SCALED system: worlds hundreds of times the
 * ship's length, orbits hundreds of thousands of units wide, orbital periods
 * stretched to match so nothing blurs past you.
 */

const scaledCache = new Map();

function scaleBody(b, parentScaled) {
  const radius = scaleRadius(b.radius);
  let orbit = scaleOrbit(b.orbit);
  if (b.parent && parentScaled) {
    /* A moon has to sit outside its world and inside its world's SOI, or it
     * is not a moon at all. */
    const lo = parentScaled.radius * 3.2 + radius * 2.4;
    const hi = Math.max(lo * 1.05, parentScaled.soi * 0.7);
    orbit = Math.min(Math.max(orbit, lo), hi);
  }
  const out = { ...b, radius, orbit, period: Math.max(6, b.period * PERIOD_K) };
  /* Worlds keep a condition now. Something can take it away. */
  out.baseRadius = radius;
  out.integrity = 1;
  out.craters = [];
  out.scarred = 0;
  out.shattered = Boolean(b.bornShattered);
  if (out.shattered) out.integrity = 0;
  out.dirty = false;
  out.thermal = 0;
  out.terraform = 0; // persistent kelvin offset the atmo works have earned
  out.stats = bodyStats(out);
  /* An archetype overrides the generic kind: it decides what the surface looks
   * like, what it is called, and what comes out of it. */
  out.arch = archetypeById(b.arch) ?? null;
  applyArchStats(out);
  if (out.arch) {
    if (out.arch.atmo && !b.atmo) out.atmo = out.arch.atmo;
    if (!out.arch.atmo) out.atmo = undefined;
  }
  /* a body that is already rubble carries the mass of rubble */
  out.mass = massIndex(out) * (out.shattered ? SHATTERED_MU : 1);
  out.mu = mu(out) * (out.shattered ? SHATTERED_MU : 1);
  out.well = wellRadius(out);
  out.scan = scanRange(out);
  out.gSurf = surfaceGravity(out);
  return out;
}

export function scaleSystem(sys) {
  const hit = scaledCache.get(sys.seed);
  if (hit && hit.src === sys) return hit.out;
  /* Star first, then planets (SOI against the star), then moons (SOI against
   * their planet) — each level needs the one above it already sized. */
  const scaledById = new Map();
  const order = [
    ...sys.bodies.filter((b) => b.kind === "star"),
    ...sys.bodies.filter((b) => b.kind !== "star" && !b.parent),
    ...sys.bodies.filter((b) => b.kind !== "star" && b.parent),
  ];
  const star = sys.bodies.find((b) => b.kind === "star");
  const bodies = [];
  for (const b of order) {
    const parentScaled = b.parent ? scaledById.get(b.parent) : null;
    const out = scaleBody(b, parentScaled);
    const host = parentScaled ?? (b.kind === "star" ? null : scaledById.get(star?.id));
    out.soi = b.kind === "star" ? Infinity : sphereOfInfluence(out.orbit, out.mass, host?.mass ?? 1);
    out.host = b.kind === "star" ? null : (b.parent ?? star?.id ?? null);
    scaledById.set(b.id, out);
    bodies.push(out);
  }
  /* keep the authored order so menus and maps read the same as before */
  bodies.sort((a, z) => sys.bodies.findIndex((b) => b.id === a.id) - sys.bodies.findIndex((b) => b.id === z.id));
  const beacons = sys.beacons.map((b) => ({
    ...b,
    orbit: scaleOrbit(b.orbit),
    period: Math.max(6, b.period * PERIOD_K),
  }));
  const belt = sys.belt
    ? {
        inner: scaleOrbit(sys.belt.inner),
        outer: scaleOrbit(sys.belt.outer),
        count: sys.belt.count,
      }
    : null;
  const outerBelt = sys.outerBelt
    ? {
        inner: scaleOrbit(sys.outerBelt.inner),
        outer: scaleOrbit(sys.outerBelt.outer),
        count: sys.outerBelt.count,
      }
    : null;
  const out = { ...sys, bodies, beacons, belt, outerBelt, scaled: true };
  scaledCache.set(sys.seed, { src: sys, out });
  return out;
}

export let BODIES = scaleSystem(SOL_SYSTEM).bodies;
export let BEACONS = scaleSystem(SOL_SYSTEM).beacons;
export let currentSystem = scaleSystem(SOL_SYSTEM);

export function applySystem(sys) {
  const scaled = sys.scaled ? sys : scaleSystem(sys);
  currentSystem = scaled;
  BODIES = scaled.bodies;
  BEACONS = scaled.beacons;
  return scaled;
}

export function surveyIds() {
  return BODIES.map((b) => b.id);
}

export const SHIP_COLORS = ["#d7dee8", "#9eb6c9", "#a8b4c8", "#c4b7a5", "#8faa9b", "#b9a8a2"];

export function hashHue(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return SHIP_COLORS[h % SHIP_COLORS.length];
}

/* id → body index. BODIES is only ever reassigned (applySystem), so the map is
 * keyed on the array identity and rebuilt when the sky changes. */
let _byIdFor = null, _byId = null;
export function bodyById(id) {
  if (_byIdFor !== BODIES) { _byIdFor = BODIES; _byId = new Map(BODIES.map((b) => [b.id, b])); }
  return _byId.get(id);
}

function orbitInto(o, orbit, period, phase, inclination, eccentricity, time) {
  if (orbit === 0) { o.x = 0; o.y = 0; o.z = 0; return o; }
  const a = (time / Math.max(period, 0.001)) * Math.PI * 2 + phase;
  const r = orbit * (1 + eccentricity * Math.cos(a));
  o.x = Math.cos(a) * r;
  o.z = Math.sin(a) * r;
  o.y = Math.sin(a) * r * inclination;
  return o;
}

export function orbitPosition(orbit, period, phase, inclination, eccentricity, time) {
  return orbitInto({ x: 0, y: 0, z: 0 }, orbit, period, phase, inclination, eccentricity, time);
}

/* One scratch per nesting level (moon → planet → star); the recursion never
 * goes deeper than the parent chain, so no two live calls share a slot. */
const _parent = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }];

export function bodyPosition(id, time, out, depth = 0) {
  const body = bodyById(id);
  const o = out ?? { x: 0, y: 0, z: 0 };
  if (!body) {
    o.x = 0;
    o.y = 0;
    o.z = 0;
    return o;
  }
  orbitInto(o, body.orbit, body.period, body.phase, body.inclination, body.eccentricity, time);
  if (body.parent && depth < _parent.length) {
    const p = bodyPosition(body.parent, time, _parent[depth], depth + 1);
    o.x += p.x;
    o.y += p.y;
    o.z += p.z;
  }
  return o;
}

const _v0 = { x: 0, y: 0, z: 0 };
const _v1 = { x: 0, y: 0, z: 0 };

/** Orbital velocity of a body, by central difference. The local frame. */
export function bodyVelocity(id, time, out) {
  const o = out ?? { x: 0, y: 0, z: 0 };
  const h = 0.05;
  bodyPosition(id, time - h, _v0);
  bodyPosition(id, time + h, _v1);
  o.x = (_v1.x - _v0.x) / (2 * h);
  o.y = (_v1.y - _v0.y) / (2 * h);
  o.z = (_v1.z - _v0.z) / (2 * h);
  return o;
}

export function beaconPosition(def, time) {
  return orbitPosition(def.orbit, def.period, def.phase, def.inclination, 0.04, time);
}

export function dist3(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Distance at which a body can be surveyed. Grows with the world. */
export function scanRadius(body) {
  return body.scan ?? scanRange(body);
}

/** Archetype-derived readout fields. Shared by the first scaling pass and refreshBody. */
function applyArchStats(out) {
  if (!out.arch) return;
  out.stats.archName = out.arch.name;
  out.stats.blurb = out.arch.blurb;
  out.stats.temp = out.arch.temp;
  out.stats.deposits = out.arch.ores.slice(0, 4).map((id) => goodName(id));
  out.oreId = out.arch.ores[0];
}

/* ---- thermal ------------------------------------------------------------ *
 * Every world sits at its band's base temperature; an impact dumps heat on
 * top as a delta that radiates away over tens of minutes. Big strikes glow.  */

export const TEMP_K = { furnace: 720, seared: 460, hot: 330, temperate: 285, cold: 180, frozen: 90 };
const THERMAL_HALFLIFE = 700; // seconds for an impact's heat to halve

/** Dump impact heat on a body (delta kelvin). */
export function heatBody(b, dK) {
  b.thermal = Math.min(1400, (b.thermal ?? 0) + Math.max(0, dK));
}

/** Radiative cooling, called from the sim tick. */
export function coolBodies(dt) {
  const k = Math.pow(0.5, dt / THERMAL_HALFLIFE);
  for (const b of BODIES) {
    if ((b.thermal ?? 0) > 0.5) b.thermal *= k;
    else b.thermal = 0;
  }
}

/** Effective surface temperature in kelvin: band base + impact heat + terraforming. */
export function bodyTempK(b) {
  return (TEMP_K[b.stats?.temp] ?? TEMP_K[b.arch?.temp] ?? 240) + (b.thermal ?? 0) + (b.terraform ?? 0);
}

/** The band a temperature reads as — a terraformed world wears its new climate. */
export function bandFromK(k) {
  if (k >= 600) return "furnace";
  if (k >= 400) return "seared";
  if (k >= 305) return "hot";
  if (k >= 250) return "temperate";
  if (k >= 140) return "cold";
  return "frozen";
}

/** "COLD · 180 K", "COLD · 407 K — IMPACT-HEATED", "TEMPERATE · 262 K — TERRAFORMED". */
export function tempLabel(b) {
  const k = Math.round(bodyTempK(b));
  const band = ((b.terraform ?? 0) !== 0 ? bandFromK(k - (b.thermal ?? 0)) : b.stats?.temp ?? b.arch?.temp ?? "—").toUpperCase();
  if ((b.thermal ?? 0) > 25) return `${band} · ${k} K — IMPACT-HEATED`;
  if (Math.abs(b.terraform ?? 0) >= 5) return `${band} · ${k} K — TERRAFORMED`;
  return `${band} · ${k} K`;
}

/**
 * Recompute the derived numbers after a world has been changed.
 *
 * Breaking a planet up takes its mass with it, and everything downstream of
 * mass has to hear about it — not just the pull, but how far out the pull is
 * still the dominant one. Leaving the sphere of influence at its old size is
 * what kept a dead world holding the local frame, and the warp core with it,
 * from a long way further out than there was anything left to hold it.
 */
export function refreshBody(b) {
  b.stats = bodyStats(b);
  applyArchStats(b);
  b.mass = massIndex(b) * (b.shattered ? SHATTERED_MU : 1);
  b.mu = mu(b) * (b.shattered ? SHATTERED_MU : 1);
  b.well = wellRadius(b);
  b.scan = scanRange(b);
  b.gSurf = surfaceGravity(b);
  if (b.kind !== "star" && b.host) {
    const host = BODIES.find((x) => x.id === b.host);
    b.soi = sphereOfInfluence(b.orbit, b.mass, host?.mass ?? 1);
  }
  b.dirty = true;
}

export function starBody() {
  return BODIES.find((b) => b.kind === "star") ?? BODIES[0];
}

/** Sorted big-to-small, used by the gravity solver so the dominant well wins. */
export function gravitySources() {
  return BODIES;
}
