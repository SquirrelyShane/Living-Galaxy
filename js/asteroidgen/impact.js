/**
 * Impact physics for the collision demo — pure functions (no DOM, no GPU).
 *
 * Disruption uses a specific-energy criterion: Q = ½·μ·v² / m_body against a
 * size-dependent strength Q* = Q0 · m^0.4 (bigger bodies are gravity-bound and
 * harder to disperse). The destroyed fraction f = clamp(Q / Q*) decides how
 * many Voronoi chunks, nearest the contact point first, break away.
 *
 * v1.8: no rails. Each fragment leaves with its parent's velocity, the parent's
 * spin (ω × r — bodies tumble on arbitrary axes) and an ejection kick away from
 * the contact whose speed falls with fragment mass (∝ m^-1/6: big pieces are
 * slow). Survivors take whatever momentum is left, so total momentum is exactly
 * conserved. From there impact-sim.js integrates everything (mutual gravity,
 * piece-on-piece collisions, torque-free tumbling). Ejecta here is only the
 * instantaneous blast; shedding and secondary-impact debris come from the sim.
 */
import { RNG, hashString, powerLaw, gauss, unitVec } from './rng.js';

export const IMPACT = { Q0: 0.9, drag: 0.25, massExp: -0.25, eject: [0.05, 0.32], jitter: 0.05 };

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.sqrt(dot(a, a));
const norm = (a) => mul(a, 1 / (len(a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Earliest t ≥ 0 at which two spheres moving linearly touch (null if never). */
export function contactTime(pA, vA, pB, vB, R) {
  const d = sub(pB, pA);
  const w = sub(vB, vA);
  const a = dot(w, w);
  const b = 2 * dot(d, w);
  const c = dot(d, d) - R * R;
  if (c <= 0) return 0;
  const disc = b * b - 4 * a * c;
  if (a < 1e-9 || disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 ? t : null;
}

/**
 * Initial states so two bodies meet at `impactAt` seconds.
 * drift: common velocity of the pair (the whole encounter moves; nothing is parked at the origin).
 * @param {object} p { speed, angleDeg, rA, rB, mA, mB, impactAt, drift }
 */
export function setupApproach({ speed = 1.6, angleDeg = 20, rA = 1.9, rB = 1.9, mA = 1, mB = 1, impactAt = 3, drift = [0, 0, 0] }) {
  const R = rA + rB;
  const b = R * Math.sin((Math.max(0, Math.min(75, angleDeg)) * Math.PI) / 180) * 0.92; // impact parameter
  const M = mA + mB;
  const vA = add([speed * (mB / M), 0, 0], drift);
  const vB = add([-speed * (mA / M), 0, 0], drift);
  const sx = Math.sqrt(Math.max(0, R * R - b * b));
  const cA = [-sx * (mB / M), 0, b * (mB / M)];
  const cB = [sx * (mA / M), 0, -b * (mA / M)];
  return { pA: sub(cA, mul(vA, impactAt)), pB: sub(cB, mul(vB, impactAt)), vA, vB, R, b };
}

export function rotate(R, v) {
  return [dot(R[0], v), dot(R[1], v), dot(R[2], v)];
}
export function rotateT(R, v) {
  return [R[0][0] * v[0] + R[1][0] * v[1] + R[2][0] * v[2], R[0][1] * v[0] + R[1][1] * v[1] + R[2][1] * v[2], R[0][2] * v[0] + R[1][2] * v[1] + R[2][2] * v[2]];
}

/**
 * Plan the break-up at the moment of contact.
 * @param {object} A,B { pos, vel, spin (world ω), mass, radius, scale, rot (3×3 rows, world = rot·local),
 *                       fracture: { centroids, counts, morph? }, strength? (Q* multiplier), reform? [min,max] s }
 * @returns {{ contact, normal, energy, relativeSpeed, cm, momentum, bodies: [{ fraction, detached, velPost, spinPost, massPost, totalChunks }] }}
 */
export function planImpact(A, B, { speed = 1.6, seed = 'impact' } = {}) {
  const rng = new RNG(hashString(String(seed) + ':impact'));
  const n = norm(sub(B.pos, A.pos));
  const contact = add(A.pos, mul(sub(B.pos, A.pos), A.radius / (A.radius + B.radius)));
  const vrel = len(sub(A.vel, B.vel)) || speed;
  const M = A.mass + B.mass;
  const mu = (A.mass * B.mass) / M;
  const energy = 0.5 * mu * vrel * vrel;
  const cm = mul(add(mul(A.vel, A.mass), mul(B.vel, B.mass)), 1 / M);

  const plan = (body, sign) => {
    const Q = energy / body.mass;
    const Qs = IMPACT.Q0 * (body.strength ?? 1) * Math.pow(body.mass, 0.4);
    let fraction = Math.max(0.08, Math.min(1, Q / Qs));
    if (fraction > 0.92) fraction = 1;
    const cs = body.fracture.centroids;
    const counts = body.fracture.counts;
    const V = Math.max(1, counts.reduce((s, c) => s + c, 0));
    const live = cs.map((c, k) => k).filter((k) => counts[k] > 0);
    const world = (c) => add(body.pos, rotate(body.rot, mul(c, body.scale)));
    live.sort((a, b) => len(sub(world(cs[a]), contact)) - len(sub(world(cs[b]), contact)));
    const count = fraction >= 1 ? live.length : Math.max(1, Math.round(fraction * live.length));
    const spin = body.spin || [0, 0, 0];
    const meanMass = body.mass / live.length;
    const detached = [];
    for (let i = 0; i < count; i++) {
      const k = live[i];
      const w = world(cs[k]);
      const mass = (body.mass * counts[k]) / V;
      const closeness = 1 - i / Math.max(1, live.length);
      let dir = norm(sub(w, contact));
      dir = norm(add(dir, mul(n, -sign * 0.35))); // away from the other body, no tunnelling
      // bigger pieces leave slower
      const sp = vrel * (IMPACT.eject[0] + IMPACT.eject[1] * closeness) * rng.range(0.6, 1.3) * Math.pow(mass / meanMass, IMPACT.massExp);
      const jitter = mul(unitVec(rng), vrel * IMPACT.jitter);
      const rim = cross(spin, sub(w, body.pos)); // the parent's tumble flings its surface
      const velWorld = add(add(add(body.vel, rim), mul(dir, sp)), jitter);
      const size = body.fracture.morph?.[k] ? body.scale * Math.cbrt((3 * body.fracture.morph[k].volume) / (4 * Math.PI)) : 0.8 * body.radius * Math.cbrt(counts[k] / V);
      // the kick also spins the piece up: multi-axis, faster for small pieces
      const kick = mul(unitVec(rng), (sp / Math.max(0.15, size)) * rng.range(0.15, 0.45));
      detached.push({
        k,
        world: w,
        mass,
        size,
        velWorld,
        spinWorld: add(spin, kick),
        eject: sp,
        heat: Math.max(0.1, Math.min(1.2, 0.25 + closeness * Math.min(1.4, vrel / 1.6))),
        cool: rng.range(0.25, 0.6),
        seed: rng.next(),
        reform: body.reform ? rng.range(body.reform[0], body.reform[1]) : 0,
      });
    }
    // survivors keep the rest of the parent's momentum exactly
    const massPost = body.mass - detached.reduce((s, p) => s + p.mass, 0);
    let pLeft = mul(body.vel, body.mass);
    for (const p of detached) pLeft = sub(pLeft, mul(p.velWorld, p.mass));
    const velPost = massPost > 1e-6 ? mul(pLeft, 1 / massPost) : body.vel.slice();
    if (massPost <= 1e-6) {
      // nothing left to absorb the balance: share it out so momentum still closes
      const tot = detached.reduce((s, p) => s + p.mass, 0);
      for (const p of detached) p.velWorld = add(p.velWorld, mul(pLeft, 1 / tot));
    }
    const hitSide = sub(contact, body.pos);
    const spinPost = add(spin, mul(cross(hitSide, mul(n, -sign * vrel)), (0.35 * fraction) / Math.max(0.5, body.radius * body.radius)));
    return { fraction, detached, velPost, spinPost, massPost: Math.max(0, massPost), totalChunks: live.length };
  };
  const bodies = [plan(A, 1), plan(B, -1)];
  const momentum = mul(cm, M);
  return { contact, normal: n, energy, relativeSpeed: vrel, cm, momentum, bodies };
}

/** Total linear momentum of a plan's pieces + survivors. */
export function planMomentum(plan) {
  let P = [0, 0, 0];
  for (const bp of plan.bodies) {
    P = add(P, mul(bp.velPost, bp.massPost));
    for (const d of bp.detached) P = add(P, mul(d.velWorld, d.mass));
  }
  return P;
}

/**
 * Instantaneous blast: dust sheet (mostly ⟂ impact normal), sparks, meshed rocks.
 * base velocity = the pair's centre-of-mass velocity plus the local surface motion,
 * so the sheet is carried along and skewed by the bodies' tumble.
 * Every particle carries t0 = 0 (emitted at impact); impact-sim adds later waves.
 */
export function planEjecta({ contact, normal, relativeSpeed, cm = [0, 0, 0] }, paletteA, paletteB, { dust = 1600, sparks = 900, rocks = 260, seed = 'ejecta', surfaceVel = [0, 0, 0], ice = 0 } = {}) {
  const rng = new RNG(hashString(String(seed) + ':ejecta'));
  const up = Math.abs(normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const t1 = norm(cross(normal, up));
  const t2 = cross(normal, t1);
  const v = Math.max(0.4, relativeSpeed);
  const base = add(cm, surfaceVel);
  const pick = () => {
    const pal = rng.next() < 0.5 ? paletteA : paletteB;
    return pal[Math.floor(rng.next() * pal.length)] || [0.4, 0.37, 0.33];
  };
  const sheetDir = (normalSpread) => {
    const a = rng.range(0, Math.PI * 2);
    return norm(add(add(mul(t1, Math.cos(a)), mul(t2, Math.sin(a))), mul(normal, gauss(rng) * normalSpread)));
  };
  const D = { pos: new Float32Array(dust * 3), vel: new Float32Array(dust * 3), data: new Float32Array(dust * 4), color: new Float32Array(dust * 3) };
  for (let i = 0; i < dust; i++) {
    const dir = sheetDir(0.45);
    const sp = v * powerLaw(rng, 0.15, 2.8, 1.6);
    const j = mul(unitVec(rng), 0.25);
    D.pos.set(add(contact, j), i * 3);
    D.vel.set(add(base, mul(dir, sp)), i * 3);
    const isIce = rng.next() < ice * 0.35;
    const c = isIce ? [0.78, 0.9, 1.0] : pick();
    const g = rng.range(0.9, 1.6);
    D.color.set([Math.min(1, c[0] * g), Math.min(1, c[1] * g), Math.min(1, c[2] * g)], i * 3);
    D.data.set([isIce ? rng.range(0.04, 0.1) : rng.next() < 0.6 ? rng.range(0.05, 0.12) : rng.range(0.2, 0.6), rng.next(), Math.max(0, 1.1 - sp / (v * 2.2)) * Math.min(1.2, v / 1.4), isIce ? 1 : 0], i * 4);
  }
  const S = { pos: new Float32Array(sparks * 3), vel: new Float32Array(sparks * 3), data: new Float32Array(sparks * 4), color: new Float32Array(sparks * 3) };
  for (let i = 0; i < sparks; i++) {
    const dir = sheetDir(0.8);
    const sp = v * rng.range(1.2, 4.2);
    S.pos.set(contact, i * 3);
    S.vel.set(add(base, mul(dir, sp)), i * 3);
    S.color.set([1, 0.8, 0.5], i * 3);
    S.data.set([rng.range(0.04, 0.12), rng.next(), rng.range(0.7, 1.2), 2], i * 4);
  }
  const K = { matrix: new Float32Array(rocks * 16), vel: new Float32Array(rocks * 3), spin: new Float32Array(rocks * 4), spin2: new Float32Array(rocks * 4), heat: new Float32Array(rocks * 2), color: new Float32Array(rocks * 3), variant: new Uint8Array(rocks) };
  for (let i = 0; i < rocks; i++) {
    const dir = sheetDir(0.6);
    const s = powerLaw(rng, 0.03, 0.22, 2.0);
    const sp = v * powerLaw(rng, 0.3, 2.4, 1.4) * Math.pow(s / 0.06, -0.5); // bigger rocks slower
    const p = add(contact, mul(unitVec(rng), 0.35));
    composeAxisAngle(K.matrix, i * 16, p, unitVec(rng), rng.range(0, Math.PI * 2), s);
    K.vel.set(add(base, mul(dir, sp)), i * 3);
    const ax = unitVec(rng), ax2 = unitVec(rng);
    K.spin.set([ax[0], ax[1], ax[2], rng.range(0.5, 4)], i * 4);
    K.spin2.set([ax2[0], ax2[1], ax2[2], rng.range(0.1, 1.2)], i * 4); // precession: tumble axis wanders
    K.heat.set([Math.max(0.05, 1.1 - sp / (v * 2)) * Math.min(1.2, v / 1.3), rng.next()], i * 2);
    const c = pick();
    K.color.set([Math.min(1, c[0] * 1.3), Math.min(1, c[1] * 1.3), Math.min(1, c[2] * 1.3)], i * 3);
    K.variant[i] = Math.floor(rng.next() * 4);
  }
  return { dust: D, sparks: S, rocks: K, basis: { t1, t2 } };
}

export function composeAxisAngle(te, o, p, axis, ang, s) {
  const [x, y, z] = axis;
  const c = Math.cos(ang), si = Math.sin(ang), t = 1 - c;
  te[o] = (t * x * x + c) * s; te[o + 1] = (t * x * y + si * z) * s; te[o + 2] = (t * x * z - si * y) * s; te[o + 3] = 0;
  te[o + 4] = (t * x * y - si * z) * s; te[o + 5] = (t * y * y + c) * s; te[o + 6] = (t * y * z + si * x) * s; te[o + 7] = 0;
  te[o + 8] = (t * x * z + si * y) * s; te[o + 9] = (t * y * z - si * x) * s; te[o + 10] = (t * z * z + c) * s; te[o + 11] = 0;
  te[o + 12] = p[0]; te[o + 13] = p[1]; te[o + 14] = p[2]; te[o + 15] = 1;
}

/**
 * The biggest escaping piece leaves for the survey deck as a new asteroid —
 * its own seed (parent seed + chunk), the parent's class, a size from its volume share.
 * @param {Array<{ body, k, size, speed }>} escaping  from ImpactSim.fates()
 */
export function rogueHandoff(escaping, bodyInfo /* [{ seed, classId, radiusM, kind, fracture }] */) {
  let best = null;
  for (const e of escaping) if (!best || e.size > best.size) best = e;
  if (!best) return null;
  const b = bodyInfo[best.body];
  const counts = b.fracture.counts;
  const share = counts[best.k] / Math.max(1, counts.reduce((s, c) => s + c, 0));
  const radiusM = Math.max(25, Math.min(800, Math.round((b.radiusM * Math.cbrt(share)) / 5) * 5));
  return {
    seed: `${b.seed}-R${String(best.k).padStart(2, '0')}`,
    classId: b.classId,
    radiusM,
    shape: 'fragment',
    parent: b.seed,
    kind: b.kind,
    speed: +best.speed.toFixed(2),
  };
}

/** Sample a small palette from a vertex-colour attribute array. */
export function samplePalette(colorArray, n = 24, seed = 'pal') {
  const rng = new RNG(hashString(String(seed)));
  const V = colorArray.length / 3;
  const out = [];
  for (let i = 0; i < n; i++) {
    const v = Math.floor(rng.next() * V);
    out.push([colorArray[v * 3], colorArray[v * 3 + 1], colorArray[v * 3 + 2]]);
  }
  return out;
}
