// Living Galaxy — the ephemeris.
//
// Every orbit in Solaris is circular, coplanar in xz, and advanced by a constant rate in
// `world/system.js`. That is a rendering decision, and until now it was *only* a rendering
// decision: nothing in the game could answer "where will Obscura be when I get there?"
// even though the answer is one cosine away.
//
// This file makes those orbits legible to navigation. Three things fall out of it:
//
//   **Lead, not pursuit.** Warp used to aim at the destination's *current* position every
//   frame. That converges — a pursuit curve always does — but it converges by flying an
//   arc behind a body that is moving at up to 0.45 units/s, which on a 30,000-unit
//   crossing is a measurable detour for no reason. Aiming at the intercept point is a
//   straight line.
//
//   **Transfer windows.** Two circular orbits have an exact synodic period and an exact
//   time to their next conjunction. Solaris is small enough that these are minutes, not
//   months, which makes "wait four minutes and the crossing is a third as long" an actual
//   decision a pilot can make rather than an astronomy fact.
//
//   **Honest arrival ranges.** The nav map can say what the range will be on arrival
//   instead of what it is now.
//
// Everything here is analytic. No sampling, no integration, no per-frame cost beyond a
// handful of trig calls, because the motion model is closed-form and pretending otherwise
// would be slower and less accurate at the same time.

import { S } from '../../core/state.js';
import { TAU, fmtKm } from '../../core/utils.js';

const _a = { x: 0, y: 0, z: 0 };
const _b = { x: 0, y: 0, z: 0 };

/** Heliocentric angular rate of whatever this body is carried by, rad/s. */
export function rateOf(body) {
  const u = body && body.userData;
  if (!u) return 0;
  if (u.kind === 'moon') return u.parent ? rateOf(u.parent) : 0;
  return u.orbitSpeed || 0;
}

/** Distance of this body from the star, in units. Moons take their primary's. */
export function orbitRadiusOf(body) {
  const u = body && body.userData;
  if (!u) return 0;
  if (u.kind === 'moon') return u.parent ? orbitRadiusOf(u.parent) : 0;
  return u.orbitRadius || 0;
}

/** Heliocentric phase now, radians. */
function phaseOf(body) {
  const u = body && body.userData;
  if (!u) return 0;
  if (u.kind === 'moon') return u.parent ? phaseOf(u.parent) : 0;
  return u.angle || 0;
}

/**
 * Where `body` will be `t` seconds from now, written into `out`.
 *
 * The motion here must stay in step with `updateSystem()` — including the moon's shallow
 * vertical wobble, which is not decoration: a moon at the top of its wobble is 12% of its
 * orbital radius above the plane, and a course plotted without it arrives off by that much.
 */
export function predict(body, t, out = { x: 0, y: 0, z: 0 }) {
  const u = body && body.userData;
  const p = body && body.position;
  if (!u || !p) { out.x = out.y = out.z = 0; return out; }

  if (u.kind === 'moon' && u.parent) {
    predict(u.parent, t, _a);
    const a = (u.angle || 0) + (u.orbitSpeed || 0) * t;
    const r = u.orbitRadius || 0;
    out.x = _a.x + Math.cos(a) * r;
    out.y = _a.y + Math.sin(a * 0.65) * r * 0.12;
    out.z = _a.z + Math.sin(a) * r;
    return out;
  }

  const r = u.orbitRadius || 0;
  if (!r || !u.orbitSpeed) { out.x = p.x; out.y = p.y; out.z = p.z; return out; }
  const a = (u.angle || 0) + u.orbitSpeed * t;
  out.x = Math.cos(a) * r;
  out.y = p.y;
  out.z = Math.sin(a) * r;
  return out;
}

const dist3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/**
 * Where to point so that a ship leaving `from` at `speed` and the body arrive together.
 *
 * Fixed-point iteration rather than the quadratic: the closed form assumes a body moving
 * in a straight line, which is exactly what an orbiting body does not do. Four passes
 * settles a Solaris-scale crossing to well under a kilometre, and the loop exits early the
 * moment the estimate stops moving.
 */
export function intercept(from, body, speed, iterations = 4) {
  const out = { x: 0, y: 0, z: 0 };
  predict(body, 0, out);
  if (!(speed > 0)) return { t: 0, point: out, dist: dist3(from, out), converged: false };

  let t = dist3(from, out) / speed;
  let converged = false;
  for (let i = 0; i < iterations; i++) {
    predict(body, t, out);
    const next = dist3(from, out) / speed;
    if (Math.abs(next - t) < 0.05) { t = next; converged = true; break; }
    t = next;
  }
  predict(body, t, out);
  return { t, point: out, dist: dist3(from, out), converged };
}

/** Exact separation between two bodies `t` seconds from now. */
export function separationAt(a, b, t) {
  predict(a, t, _a);
  predict(b, t, _b);
  return dist3(_a, _b);
}

/**
 * The transfer relationship between two heliocentric bodies.
 *
 * Both orbits are circles at constant rate, so the angle between them is linear in time
 * and the whole thing is exact:
 *
 *   min separation  |Ra − Rb|   at relative phase 0        (conjunction)
 *   max separation   Ra + Rb    at relative phase π        (opposition)
 *   synodic period   2π / |Δω|
 *
 * `next` is the wait until the next conjunction, in seconds. A pair with equal rates —
 * two moons of the same planet, a station and its own primary — never closes, and gets
 * `Infinity` rather than a divide-by-zero.
 */
export function transfer(a, b) {
  const ra = orbitRadiusOf(a), rb = orbitRadiusOf(b);
  const dw = rateOf(a) - rateOf(b);
  const min = Math.abs(ra - rb);
  const max = ra + rb;
  if (!dw) return { min, max, synodic: Infinity, next: Infinity, nextOpp: Infinity, locked: true };

  const synodic = TAU / Math.abs(dw);
  // Relative phase now, and how long until it is next zero.
  const phi = ((phaseOf(a) - phaseOf(b)) % TAU + TAU) % TAU;
  const toZero = dw > 0 ? (TAU - phi) % TAU : phi;
  const next = toZero / Math.abs(dw);
  const opp = ((dw > 0 ? Math.PI - phi : phi - Math.PI) % TAU + TAU) % TAU;
  return { min, max, synodic, next, nextOpp: opp / Math.abs(dw), locked: false };
}

/**
 * Is the gap between two bodies opening or closing right now? Returns units per second,
 * negative while closing. Differentiated over a short window rather than analytically —
 * the derivative of the law of cosines is correct but the finite difference is two lines
 * and cannot disagree with `separationAt`, which is what the readout actually shows.
 */
export function closingRate(a, b, h = 20) {
  return (separationAt(a, b, h) - separationAt(a, b, 0)) / h;
}

/**
 * The reference body a pilot is currently flying *from*: the station they are docked at,
 * or the world they are in orbit around. Transfer windows are only meaningful between two
 * things on orbits, and a free-flying ship is not on one.
 */
function referenceBody() {
  if (S.docked) return S.docked;
  if (S.orbit && S.orbit.body) return S.orbit.body;
  return null;
}

/**
 * The navigation readout for a destination. Rows are `[label, value]` pairs in the same
 * shape `systems/scanner.js` already emits, so the nav map and the target panel render
 * this without either of them learning what an ephemeris is.
 */
export function transferRows(body, fromPos, speed) {
  const rows = [];
  if (!body || !body.userData) return rows;
  const u = body.userData;
  if (u.kind === 'star') return rows;

  const ref = referenceBody();
  if (speed > 0) {
    const ic = intercept(fromPos, body, speed);
    const now = dist3(fromPos, body.position);
    // Only worth saying when the lead is big enough to change how you fly.
    if (Math.abs(ic.dist - now) > Math.max(80, now * 0.02)) {
      rows.push(['Range at arrival', fmtKm(ic.dist)]);
    }
    rows.push(['Transit', fmtT(ic.t)]);
  }

  if (ref && ref !== body) {
    const tr = transfer(ref, body);
    if (!tr.locked && isFinite(tr.next)) {
      const sep = separationAt(ref, body, 0);
      // Already inside a fifth of the way from best to worst? Then this *is* the window,
      // and telling someone to wait 6 minutes for a 3% improvement is bad advice.
      const span = Math.max(1, tr.max - tr.min);
      if ((sep - tr.min) / span < 0.2) rows.push(['Window', 'open now']);
      else rows.push(['Next window', `${fmtT(tr.next)} · ${fmtKm(tr.min)}`]);
    }
  }
  return rows;
}

function fmtT(s) {
  if (!isFinite(s)) return '—';
  if (s < 90) return Math.round(s) + ' s';
  if (s < 5400) return Math.floor(s / 60) + 'm ' + String(Math.round(s % 60)).padStart(2, '0') + 's';
  return (s / 3600).toFixed(1) + ' h';
}
