// Living Galaxy — Lagrange points, and what collects in them.
//
// L4 and L5 sit sixty degrees ahead of and behind a planet on its own orbit. They are the
// only two places in a two-body system where a third thing can sit still without spending
// anything to stay, which is why debris accumulates there and why they are the natural home
// for the deep-space sites this slice adds.
//
// Three design decisions worth recording:
//
//   **A Lagrange point is derived, never stored.** Its position is the parent's phase plus
//   sixty degrees at the parent's radius — one cosine, exactly like `systems/ephemeris.js`.
//   Nothing is generated at world build, nothing is persisted, and a client that joins a
//   shared world computes the same points from the same seed without a packet.
//
//   **What is *at* a point is seeded; whether you have worked it is saved.** The anomaly is
//   a function of the world seed and the point's name, so it costs nothing to know and
//   cannot desync. The one bit that is genuinely player state — did you already take it —
//   is a single flag, which is the whole of schema 10.
//
//   **Only real primaries have them.** L4/L5 are only stable when the primary dominates its
//   secondary, and in-game the equivalent rule is a mass floor. Without it, every 7 km
//   moonlet would post two more places on the nav map and the outer system would be a list
//   rather than a destination.
//
// The synthetic-target seam is the one `systems/fields.js` established for belts and rings:
// there is no mesh here, so anything that wants to lock, warp to or scan a Lagrange point
// asks this file for an object with a live position rather than building one itself.

import { S } from '../core/state.js';
import { LAGRANGE } from '../core/config.js';
import { TAU } from '../core/utils.js';
import { makeRng } from '../core/rng.js';
import { ANOMALY_TYPES, rollAnomaly } from '../data/anomalies.js';
import { addMaterial } from './crafting.js';
import { practice } from './character.js';
import { crewEvent } from './crew.js';
import { cargoFree } from '../core/state.js';
import { toast, status } from '../ui/toast.js';
import { sfx } from './audio.js';
import { fileExotic } from './research.js';

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) { h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Mass proxy, same one `wellRadius()` uses: surface gravity times radius squared. */
export const massOf = u => (u.gravity || 0) * (u.radius || 0) * (u.radius || 0);

/** Does this body dominate its neighbourhood enough to hold trojans? */
export const holdsTrojans = u =>
  u && u.kind === 'planet' && massOf(u) >= LAGRANGE.massFloor;

/**
 * Every Lagrange point in the system, derived from the bodies currently loaded.
 *
 * Cheap enough to call per frame, but the contact scan calls it once and reuses the list,
 * so it allocates a small array rather than trying to be clever about pooling.
 */
export function lagrangePoints() {
  const out = [];
  for (const b of (S.world.bodies || [])) {
    const u = b.userData;
    if (!holdsTrojans(u)) continue;
    for (const side of [4, 5]) {
      out.push({
        key: `L${side}:${u.name}`,
        name: `${u.name} L${side}`,
        parentName: u.name,
        parent: b,
        side,
        // L4 leads, L5 trails. Sign matches the direction the parent travels, which is
        // increasing angle in world/system.js.
        lead: (side === 4 ? 1 : -1) * (Math.PI / 3)
      });
    }
  }
  return out;
}

const _p = { x: 0, y: 0, z: 0 };

/** Where a Lagrange point is right now. Derived live — its parent is moving. */
export function pointPosition(lp, out = { x: 0, y: 0, z: 0 }) {
  const u = lp.parent && lp.parent.userData;
  if (!u) { out.x = out.y = out.z = 0; return out; }
  const a = (u.angle || 0) + lp.lead;
  const r = u.orbitRadius || 0;
  out.x = Math.cos(a) * r;
  out.y = lp.parent.position.y;
  out.z = Math.sin(a) * r;
  return out;
}

/** Where it will be `t` seconds from now — the ephemeris rule, one term further along. */
export function pointPositionAt(lp, t, out = { x: 0, y: 0, z: 0 }) {
  const u = lp.parent && lp.parent.userData;
  if (!u) { out.x = out.y = out.z = 0; return out; }
  const a = (u.angle || 0) + (u.orbitSpeed || 0) * t + lp.lead;
  const r = u.orbitRadius || 0;
  out.x = Math.cos(a) * r;
  out.y = lp.parent.position.y;
  out.z = Math.sin(a) * r;
  return out;
}

export function pointDistance(lp, from) {
  pointPosition(lp, _p);
  return Math.hypot(_p.x - from.x, _p.y - from.y, _p.z - from.z);
}

// ── what is there ────────────────────────────────────────────────────

export const worked = () => (S.anomalies = S.anomalies || {});
export const isWorked = key => !!worked()[key];

/**
 * The anomaly sitting at this point. Seeded from the world seed and the point's name, so
 * it is the same on every client and survives a reload without being stored.
 *
 * Returns null once it has been worked — a one-shot place that regenerates is a belt with
 * extra steps.
 */
export function anomalyAt(lp) {
  if (isWorked(lp.key)) return null;
  const rng = makeRng((S.seed ^ hash('anom:' + lp.key)) >>> 0);
  // Not every point holds something. An empty point still charts, because knowing a place
  // is empty is worth the same trip as knowing it is not.
  if (rng.next() > LAGRANGE.occupied) return null;
  const key = rollAnomaly(rng);
  return { key, def: ANOMALY_TYPES[key], rng };
}

/** Have we resolved what is here? Reuses the scan archive rather than a second store. */
export const charted = lp => ((S.scans && S.scans[lp.name]) || 0) >= LAGRANGE.chartTier;

/**
 * A synthetic target for the drive, the reticle and the contact list. Same shape as
 * `fieldTarget()` in systems/fields.js — no mesh, a live position, and a `userData` the
 * scanner already knows how to read.
 */
export function lagrangeTarget(lp) {
  pointPosition(lp, _p);
  return {
    position: new THREE.Vector3(_p.x, _p.y, _p.z),
    userData: {
      kind: 'lagrange', name: lp.name, radius: 0,
      lagrangeKey: lp.key, parentName: lp.parentName, side: lp.side,
      // Deliberately no gravity: a Lagrange point is a place, not a body, and giving it a
      // well would have the warp core drop out short of somewhere with nothing in it.
      gravity: 0
    }
  };
}

/** Keep an existing synthetic target on the point as it and the ship move. */
export function refreshLagrangeTarget(obj) {
  const u = obj && obj.userData;
  if (!u || !u.lagrangeKey) return false;
  const lp = lagrangePoints().find(x => x.key === u.lagrangeKey);
  if (!lp) return false;
  pointPosition(lp, _p);
  obj.position.set(_p.x, _p.y, _p.z);
  return true;
}

/** Every Lagrange point with its current distance, nearest first. */
export function lagrangeContacts(from, maxDist = Infinity) {
  const out = [];
  for (const lp of lagrangePoints()) {
    const d = pointDistance(lp, from);
    if (d > maxDist) continue;
    out.push({ point: lp, d, obj: lagrangeTarget(lp), name: lp.name, kind: 'lagrange' });
  }
  return out.sort((a, b) => a.d - b.d);
}

// ── working a site ───────────────────────────────────────────────────

const span = (rng, pair) => pair ? Math.round(pair[0] + rng.next() * (pair[1] - pair[0])) : 0;

/**
 * Work the anomaly at a point. One shot: the flag goes down whether the haul was worth it
 * or not, because "try again until it rolls well" is not a decision.
 *
 * Materials go to the hold's material stock, salvage and data to cargo. A full hold does
 * not lose you the site — it refuses before anything is consumed, which is the same rule
 * `probePlanet()` follows.
 */
export function investigate(lp) {
  if (!lp) return null;
  const dist = pointDistance(lp, S.player.position);
  if (dist > LAGRANGE.workRange) {
    toast(`Too far from ${lp.name} — close to ${Math.round(LAGRANGE.workRange)} km`);
    sfx.deny(); return null;
  }
  if (!charted(lp)) {
    toast(`${lp.name} unresolved — sweep it first`); sfx.deny(); return null;
  }
  if (isWorked(lp.key)) { toast(`${lp.name} has already been worked`); sfx.deny(); return null; }

  const a = anomalyAt(lp);
  worked()[lp.key] = true;
  if (!a) {
    status(`${lp.name} — nothing on station`);
    toast(`${lp.name} swept — empty`);
    practice('sensors', 6);
    return { key: null, salvage: 0, data: 0, credits: 0, materials: {} };
  }

  const { def, rng } = a;
  const free = cargoFree();
  let salvage = span(rng, def.salvage);
  let data = span(rng, def.data);
  // Cargo is the binding constraint, and salvage yields to data rather than the other way
  // round: telemetry is the thing you cannot come back for.
  if (data > free) data = Math.max(0, Math.floor(free));
  if (salvage > free - data) salvage = Math.max(0, Math.floor(free - data));

  const credits = span(rng, def.credits);
  const materials = {};
  for (const id in (def.materials || {})) {
    const n = span(rng, def.materials[id]);
    if (n > 0) { materials[id] = n; addMaterial(id, n); }
  }

  S.cargo.salvage += salvage;
  S.cargo.data += data;
  S.credits += credits;
  practice('sensors', 22);
  // Anomalies are the only source of exotic findings — which is what makes a Lagrange
  // point worth the trip rather than a curiosity on the chart.
  fileExotic(def.name);
  crewEvent('scan', 'survey', 1.5);
  sfx.pickup();

  const bits = [];
  if (salvage) bits.push(`${salvage} kg salvage`);
  if (data) bits.push(`${data} kg telemetry`);
  if (credits) bits.push(`${credits} cr`);
  const mats = Object.keys(materials).length;
  if (mats) bits.push(`${mats} material${mats > 1 ? 's' : ''}`);
  status(`${lp.name} — ${def.name}`);
  toast(bits.length ? `${def.name} worked — ${bits.join(' · ')}`
                    : `${def.name} worked — nothing recoverable`, 4500);
  return { key: a.key, salvage, data, credits, materials };
}

// ── persistence ──────────────────────────────────────────────────────
// One flag per worked site. Everything else about an anomaly is seeded, so this is the
// entire schema-10 payload.
export const serializeAnomalies = () => Object.assign({}, worked());
export function restoreAnomalies(d) {
  S.anomalies = (d && typeof d === 'object') ? Object.assign({}, d) : {};
  return true;
}
