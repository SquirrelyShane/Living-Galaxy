/* Flight performance — first-order aerodynamics and propulsion figures for the hull on the cradle.
 *
 * Regimes span continuum to free-molecular flow. Drag uses a shape-family base coefficient with a
 * regime multiplier (Newtonian blunt-body limit at hypersonic Mach, C_D → ~2.2 free-molecular) plus
 * appendage drag area from every mounted part that presents a face to the flow. Heating is the
 * Sutton–Graves stagnation-point estimate. Propulsion sums the drive pods: Isp, thrust, T/W, Δv
 * (Tsiolkovsky, propellant from fitted stores), and propulsive efficiency 2/(1+Ve/V) at the
 * regime speed. Stability is centre-of-pressure vs centre-of-mass along the hull. */
import * as THREE from "three";
import { DRIVE_TYPES } from "./drives.js";
const _c = new THREE.Vector3();

export const REGIMES = {
  launch:  { label: "Launch ascent",       alt: 5,    rho: 0.74,     v: 700,   mach: 2.2,  kn: 1e-8, note: "continuum, supersonic" },
  reentry: { label: "Hypersonic re-entry", alt: 60,   rho: 3.1e-4,   v: 7000,  mach: 22,   kn: 2e-4, note: "continuum, thermochemical" },
  vleo:    { label: "VLEO station-keeping",alt: 200,  rho: 2.5e-10,  v: 7780,  mach: 27,   kn: 4,    note: "free-molecular (DSMC)" },
  deep:    { label: "Deep space cruise",   alt: null, rho: 0,        v: 30000, mach: null, kn: Infinity, note: "vacuum — propulsion only" }
};

/* Design regimes — what the hull is built FOR. Chosen per class (or overridden in Drydock) and read by
 * the builder: proportions, nose, fairings, heat shield, conformal sensors, edgewise arrays, mount rules. */
export const DESIGN_REGIMES = {
  atmo:    { label: "Atmospheric / launch", analysis: "launch",  fineness: 1.25, nose: "ogive",  fairings: true,  heatShield: false, conformal: true,  edgewise: false, noVentral: false, deploy: 0,
             note: "streamlined: high fineness, ogive nose, faired superstructure, flush sensors, arrays stowed" },
  reentry: { label: "Re-entry capable",     analysis: "reentry", fineness: 0.92, nose: "blunt",  fairings: true,  heatShield: true,  conformal: true,  edgewise: false, noVentral: true,  deploy: 0,
             note: "blunt forebody, ventral heat shield, nothing hangs below the shield line" },
  vleo:    { label: "VLEO operations",      analysis: "vleo",    fineness: 1.15, nose: null,     fairings: false, heatShield: false, conformal: true,  edgewise: true,  noVentral: false, deploy: 1,
             note: "low frontal area, conformal sensors, arrays deployed edge-on to the flow" },
  deep:    { label: "Deep space",           analysis: "deep",    fineness: 1.0,  nose: null,     fairings: false, heatShield: false, conformal: false, edgewise: false, noVentral: false, deploy: 1,
             note: "no aerodynamic constraint: trusses, wings and radiators anywhere" }
};

/* base drag coefficient by hull family at supersonic continuum, referenced to frontal area */
export const HULL_CD = {
  needle: 0.28, sleek: 0.42, wedge: 0.45, curved: 0.5, science: 0.7, war: 0.72, layered: 0.8, capital: 0.85,
  drum: 0.62, sphere: 0.47, tanks: 0.9, deck: 1.0, boxy: 1.05, industrial: 1.05, jagged: 1.0, cargo: 1.1, ring: 1.25
};
/* nose bluntness → effective nose radius as a fraction of beam (drives stagnation heating) */
const NOSE_R = { spike: 0.04, cockpit: 0.12, cabin: 0.2, bridge: 0.22, armored: 0.28, blunt: 0.45, sensor: 0.3, industrial: 0.4 };

function regimeCd(base, R) {
  if (R.kn >= 1) return 2.1 + (base - 0.4) * 0.5;          // free-molecular: everything is a flat plate, shape barely matters
  if (R.mach && R.mach > 5) return 0.9 + base * 0.85;      // hypersonic Newtonian: bluntness dominates
  return base;
}

export function analyzeFlight(builder, regimeKey = "vleo", opts = {}) {
  const R = REGIMES[regimeKey] || REGIMES.vleo;
  const size = builder.size, L = size.z, B = size.x, H = size.y;
  const cls = builder.cls, D = DRIVE_TYPES[builder.drive] || DRIVE_TYPES.fusion;
  const g0 = 9.80665;

  /* ---- mass ---- */
  // structure: ~55% of the bounding box is enclosed volume at ~180 kg/m³ (pressurised spacecraft class)
  const hullMass = (opts.hullMassKg ?? size.x * size.y * size.z * 0.55 * 180);
  const fittedMass = builder.mounted.reduce((s, m) => s + m.part.mass * 1000, 0);
  const propMass = builder.mounted.filter(m => m.part.tags.includes("fluids") && m.part.prefab !== "hatch").reduce((s, m) => s + m.part.mass * 1000 * 6, 0);   // stores carry ~6× their dry mass
  const mass = hullMass + fittedMass + propMass;

  /* ---- drag ---- */
  const frontal = Math.PI * 0.25 * B * H * (HULL_CD[cls.body] > 1 ? 1.15 : 0.85);   // boxy hulls fill their bounding rectangle
  let appendage = 0; const deployed = opts.deployed !== false;
  for (const m of builder.mounted) {
    const b = m.box, w = b.max.x - b.min.x, h = b.max.y - b.min.y;
    let a = w * h;                                                   // frontal projection of the footprint box
    if (m.part.tags.includes("deploy") && m.part.prefab === "array") a *= deployed ? 1 : 0.15;
    appendage += a;
  }
  const cdHull = regimeCd(HULL_CD[cls.body] ?? 0.8, R);
  const cdApp = R.kn >= 1 ? 2.2 : 1.2;
  const dragArea = cdHull * frontal + cdApp * appendage;
  const cd = dragArea / (frontal + appendage);
  const q = 0.5 * R.rho * R.v * R.v;
  const dragN = q * dragArea;
  const beta = mass / dragArea;                                        // ballistic coefficient kg/m²
  // orbital lifetime at 200 km: time to fall one scale height
  const mu = 3.986e14, a = 6.371e6 + 200e3, Hs = 37e3;
  const lifetimeDays = Hs / (2.5e-10 * (dragArea / mass) * Math.sqrt(mu * a)) / 86400;

  /* ---- heating (Sutton–Graves) at the re-entry point ---- */
  const Rn = Math.max(0.15, B * (NOSE_R[cls.nose] ?? 0.2));
  const heatWcm2 = 1.74e-4 * Math.sqrt(3.1e-4 / Rn) * Math.pow(7000, 3) / 1e4;

  /* ---- propulsion ---- */
  const pods = builder.enginePods || [];
  const exitArea = pods.reduce((s, e) => s + Math.PI * e.r * e.r, 0);
  const thrustN = D.kNm2 * exitArea * 1000;
  const ve = isFinite(D.isp) ? D.isp * g0 : Infinity;
  const tw = thrustN / (mass * g0);
  const dv = isFinite(ve) && propMass > 0 ? ve * Math.log(mass / (mass - propMass)) : (isFinite(ve) ? 0 : Infinity);
  const etaP = isFinite(ve) ? 2 / (1 + ve / R.v) : 1;
  const accelG = thrustN / mass / g0;
  const burnS = isFinite(ve) && thrustN > 0 ? propMass / (thrustN / ve) : Infinity;

  /* ---- plume impingement: any mounted part inside a drive cone ---- */
  const impinged = [];
  for (const e of pods) {
    const tanA = Math.tan((D.halfAngle || 12) * Math.PI / 180);
    for (const m of builder.mounted) {
      const c = m.box.getCenter(_c);
      const dz = c.z - e.exitZ; if (dz <= 0 || dz > e.len * 4) continue;
      const rad = Math.hypot(c.x - e.x, c.y - e.y), cone = e.r * 1.1 + dz * tanA;
      if (rad < cone) impinged.push(m.part.name);
    }
  }

  /* ---- stability: pressure centre vs mass centre along the hull (nose-first flight) ---- */
  // lateral (side) area distribution drives the weathercock: fins and drive pods aft, nose volume forward
  let cpZ = 0, cpA = 0, cgZ = 0, cgM = 0;
  for (const v of builder.hullVols) { const A = v.h * v.d; cpZ += v.z * A; cpA += A; cgZ += v.z * (v.w * v.h * v.d); cgM += v.w * v.h * v.d; }
  const hullVol = cgM || 1;
  cgZ = cgZ / hullVol * hullMass; cgM = hullMass;
  for (const m of builder.mounted) { const c = m.box.getCenter(_c); const A = (m.box.max.y - m.box.min.y) * (m.box.max.z - m.box.min.z);
    cpZ += c.z * A; cpA += A; cgZ += c.z * m.part.mass * 1000; cgM += m.part.mass * 1000; }
  for (const e of pods) { const A = e.r * 2 * e.len * 1.2; cpZ += (e.z + e.len * 0.3) * A; cpA += A; cgZ += e.z * 4000; cgM += 4000; }
  for (const [wx, wy, wz] of builder.wingTips || []) { const A = B * 0.25 * L * 0.18; cpZ += wz * A; cpA += A; }
  const zCp = cpA ? cpZ / cpA : 0, zCg = cgM ? cgZ / cgM : 0;
  const staticMargin = (zCp - zCg) / (L || 1);     // +: CP aft of CG → weathercock-stable nose first

  /* ---- verdicts ---- */
  const notes = [];
  if (R.kn >= 1 && deployed && appendage > frontal * 0.5 && builder.mounted.some(m => m.part.prefab === "array" && m.part.tags.includes("deploy"))) notes.push("Deployed wings dominate VLEO drag — stow arrays for station-keeping.");
  if (R.rho > 1e-6 && !D.atmo) notes.push(`${D.label} cannot light in atmosphere — this regime needs a chemical stage.`);
  if (impinged.length) notes.push(`Plume impingement on ${[...new Set(impinged)].slice(0, 4).join(", ")}${impinged.length > 4 ? "…" : ""}.`);
  if (staticMargin < 0.02 && R.rho > 0) notes.push("Static margin too small — CP ahead of CG; add fins / move mass aft or rely on RCS.");
  if (heatWcm2 > 150 && regimeKey === "reentry") notes.push(`Sharp nose: ${Math.round(heatWcm2)} W/cm² stagnation heating — needs ablator or a blunter forebody.`);
  if (tw < 1 && regimeKey === "launch") notes.push("Thrust-to-weight below 1: cannot lift off — a launch stage is required.");
  if (R.kn < 1 && R.kn > 1e-3) notes.push("Transitional Knudsen number: continuum CFD and DSMC both needed here.");

  return { regime: R, regimeKey, mass, hullMass, fittedMass, propMass, frontal, appendage, cdHull, cd, dragArea, dragN, q, beta, lifetimeDays,
    Rn, heatWcm2, isp: D.isp, ve, thrustN, tw, dv, etaP, accelG, burnS, pods: pods.length, exitArea, impinged: [...new Set(impinged)], zCp, zCg, staticMargin, notes };
}

/* Drag optimiser: random search over seeds × proportions for the current class, keeping volume within
 * `volFloor` of the baseline. Returns the best config and the report line. `build(cfg)` must build without
 * touching the scene (a scratch StarshipBuilder). */
export function optimizeDrag(build, baseCfg, regimeKey, { samples = 24, volFloor = 0.9, rng = Math.random } = {}) {
  // build(cfg) must return the StarshipBuilder that built cfg
  const evalCfg = (cfg) => { const b = build(cfg); const f = analyzeFlight(b, regimeKey); const vol = b.size.x * b.size.y * b.size.z; return { cfg, dragArea: f.dragArea, vol, cd: f.cd }; };
  const base = evalCfg(baseCfg);
  let best = base; const tried = [base];
  for (let i = 0; i < samples; i++) {
    const cfg = { ...baseCfg, seed: baseCfg.seed + "-o" + i, lengthBias: +(baseCfg.lengthBias * (0.85 + rng() * 0.5)).toFixed(2), beamBias: +(baseCfg.beamBias * (0.7 + rng() * 0.5)).toFixed(2) };
    const r = evalCfg(cfg); tried.push(r);
    if (r.vol >= base.vol * volFloor && r.dragArea < best.dragArea) best = r;
  }
  return { base, best, tried, gain: 1 - best.dragArea / base.dragArea };
}
