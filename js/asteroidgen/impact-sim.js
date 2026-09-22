/**
 * Impact Lab rigid-body simulation — pure (no DOM, no GPU), deterministic, fixed step.
 *
 * Every body and fragment is a rigid piece with mass, a collision radius and a
 * principal inertia tensor (from its re-formed shape, or the body's vertex spread).
 *
 *  - Mutual (softened) gravity: slow pieces fall back, graze, and settle on each other.
 *  - Torque-free rotation: angular momentum L is conserved in the world and
 *    ω = R·I⁻¹·Rᵀ·L, so elongated pieces tumble and precess instead of spinning
 *    on one axis.
 *  - Sphere contacts between armed pairs (pairs start armed only once apart, so
 *    neighbours inside the broken body do not explode): normal impulse with
 *    restitution (0 below the stick speed — rubble comes to rest on rubble),
 *    Coulomb friction, and the friction torque on both pieces.
 *  - Hard contacts become events → secondary debris (dust, ice, small rocks)
 *    sprayed around the contact at the pair's local velocity.
 *  - Shedding: while fragments are young they shed dust from their surfaces at
 *    v + ω × r, so the tumbling of each piece draws its own curling swirl lines.
 *
 * Emitted particles are queued in sim.emitted (drained by the renderer). Linear
 * momentum is conserved exactly (pairwise gravity + equal/opposite impulses);
 * angular momentum is conserved up to positional correction.
 */
import { RNG, hashString, unitVec } from './rng.js';

export const SIM = {
  G: 0.35, // escape speed ≈ 0.75 u/s from a unit asteroid, ≈ 1.4 from the planet
  dt: 1 / 60,
  storeEvery: 2, // 30 Hz track
  restitution: 0.22,
  friction: 0.35,
  stick: 0.14,
  eventSpeed: 0.18,
  shedSeconds: 9,
  shedRate: 70, // dust per second per unit surface (decays)
  eventDust: 420, // dust per unit contact energy
};

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export function quatToRows(q) {
  const [x, y, z, w] = q;
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
}
export function quatMul(a, b) {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}
export const quatConj = (q) => [-q[0], -q[1], -q[2], q[3]];
export function quatRotate(q, v) {
  const R = quatToRows(q);
  return [dot(R[0], v), dot(R[1], v), dot(R[2], v)];
}
function integrateQuat(q, w, dt) {
  const wl = Math.hypot(w[0], w[1], w[2]);
  if (wl < 1e-9) return q;
  const half = 0.5 * wl * dt, s = Math.sin(half) / wl;
  const r = quatMul([w[0] * s, w[1] * s, w[2] * s, Math.cos(half)], q);
  const l = Math.hypot(r[0], r[1], r[2], r[3]);
  return [r[0] / l, r[1] / l, r[2] / l, r[3] / l];
}

/**
 * Principal inertia of an ellipsoid (semi-axes a) of mass m, axes given as unit vectors
 * in the piece's local frame. Returns { moments, basis } with I = B·diag(moments)·Bᵀ.
 */
export function ellipsoidInertia(m, axes, basis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
  const [a, b, c] = axes.map((x) => x * x);
  return { moments: [(m * (b + c)) / 5, (m * (a + c)) / 5, (m * (a + b)) / 5], basis };
}

export class ImpactSim {
  /**
   * @param {object} opts
   *   pieces: [{ kind, body, k, mass, radius, pos, vel, q (world, local→world), spin (world ω),
   *             inertia: { moments, basis (local unit vectors) }, color, ice, heat, cool, shed }]
   *   G, collide (false pre-impact), seed, t (start time since impact)
   */
  constructor({ pieces, G = SIM.G, collide = true, seed = 'sim', t = 0 }) {
    this.G = G;
    this.collide = collide;
    this.rng = new RNG(hashString(String(seed) + ':sim'));
    this.t = t;
    this.steps = 0;
    this.pieces = pieces.map((p, i) => {
      const P = { ...p, i, pos: p.pos.slice(), vel: p.vel.slice(), q: p.q.slice(), heatBump: 0, lastShed: 0 };
      P.invMass = 1 / Math.max(1e-9, p.mass);
      P.invMoments = p.inertia.moments.map((x) => 1 / Math.max(1e-9, x));
      P.L = this.inertiaApply(P, p.spin, false);
      return P;
    });
    const N = this.pieces.length;
    this.armed = new Uint8Array(N * N);
    this.lastEvent = new Float32Array(N * N).fill(-1e9);
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++) {
        const a = this.pieces[i], b = this.pieces[j];
        // pieces of the two different bodies collide from the start (no tunnelling through the target);
        // neighbours within one broken body only once they have separated
        if (a.body !== b.body || Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b.pos[2]) > a.radius + b.radius) this.armed[i * N + j] = 1;
      }
    this.events = [];
    this.emitted = [];
    this.frames = []; // Float32Array per stored frame: N × 7 (pos, quat)
    this.frameT = [];
    this.store();
  }

  /** I·x (world) when inverse = false, I⁻¹·x when true, for the piece's current orientation. */
  inertiaApply(P, x, inverse) {
    const R = quatToRows(P.q);
    const B = P.inertia.basis;
    // world → local → principal
    const l = [R[0][0] * x[0] + R[1][0] * x[1] + R[2][0] * x[2], R[0][1] * x[0] + R[1][1] * x[1] + R[2][1] * x[2], R[0][2] * x[0] + R[1][2] * x[1] + R[2][2] * x[2]];
    const m = inverse ? P.invMoments : P.inertia.moments;
    const pr = [dot(B[0], l) * m[0], dot(B[1], l) * m[1], dot(B[2], l) * m[2]];
    const back = [B[0][0] * pr[0] + B[1][0] * pr[1] + B[2][0] * pr[2], B[0][1] * pr[0] + B[1][1] * pr[1] + B[2][1] * pr[2], B[0][2] * pr[0] + B[1][2] * pr[1] + B[2][2] * pr[2]];
    return [dot(R[0], back), dot(R[1], back), dot(R[2], back)];
  }

  omega(P) {
    return this.inertiaApply(P, P.L, true);
  }

  store() {
    const N = this.pieces.length;
    const f = new Float32Array(N * 7);
    this.pieces.forEach((P, i) => {
      f.set(P.pos, i * 7);
      f.set(P.q, i * 7 + 3);
    });
    this.frames.push(f);
    this.frameT.push(this.t);
  }

  step() {
    const dt = SIM.dt;
    const ps = this.pieces;
    const N = ps.length;
    const acc = new Float64Array(N * 3);
    if (this.G > 0) {
      for (let i = 0; i < N; i++)
        for (let j = i + 1; j < N; j++) {
          const a = ps[i], b = ps[j];
          const dx = b.pos[0] - a.pos[0], dy = b.pos[1] - a.pos[1], dz = b.pos[2] - a.pos[2];
          const eps = 0.5 * (a.radius + b.radius);
          const r2 = dx * dx + dy * dy + dz * dz + eps * eps;
          const f = this.G / (r2 * Math.sqrt(r2));
          acc[i * 3] += dx * f * b.mass; acc[i * 3 + 1] += dy * f * b.mass; acc[i * 3 + 2] += dz * f * b.mass;
          acc[j * 3] -= dx * f * a.mass; acc[j * 3 + 1] -= dy * f * a.mass; acc[j * 3 + 2] -= dz * f * a.mass;
        }
    }
    for (let i = 0; i < N; i++) {
      const P = ps[i];
      P.vel[0] += acc[i * 3] * dt; P.vel[1] += acc[i * 3 + 1] * dt; P.vel[2] += acc[i * 3 + 2] * dt;
      P.pos[0] += P.vel[0] * dt; P.pos[1] += P.vel[1] * dt; P.pos[2] += P.vel[2] * dt;
      P.q = integrateQuat(P.q, this.omega(P), dt);
      P.heatBump *= Math.exp(-dt * 1.2);
    }
    if (this.collide) this.contacts();
    this.t += dt;
    this.steps++;
    if (this.collide) this.shed();
    if (this.steps % SIM.storeEvery === 0) this.store();
  }

  contacts() {
    const ps = this.pieces;
    const N = ps.length;
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++) {
        const a = ps[i], b = ps[j];
        const dx = b.pos[0] - a.pos[0], dy = b.pos[1] - a.pos[1], dz = b.pos[2] - a.pos[2];
        const dist = Math.hypot(dx, dy, dz);
        const rs = a.radius + b.radius;
        const key = i * N + j;
        if (dist > rs) {
          this.armed[key] = 1;
          continue;
        }
        if (!this.armed[key] || dist < 1e-6) continue;
        const n = [dx / dist, dy / dist, dz / dist];
        // push apart (mass-weighted)
        const im = a.invMass + b.invMass;
        const corr = ((rs - dist) * 0.8) / im;
        for (let k = 0; k < 3; k++) {
          a.pos[k] -= n[k] * corr * a.invMass;
          b.pos[k] += n[k] * corr * b.invMass;
        }
        const ra = [n[0] * a.radius, n[1] * a.radius, n[2] * a.radius];
        const rb = [-n[0] * b.radius, -n[1] * b.radius, -n[2] * b.radius];
        const wa = this.omega(a), wb = this.omega(b);
        const va = cross(wa, ra), vb = cross(wb, rb);
        const rv = [b.vel[0] + vb[0] - a.vel[0] - va[0], b.vel[1] + vb[1] - a.vel[1] - va[1], b.vel[2] + vb[2] - a.vel[2] - va[2]];
        const vn = dot(rv, n);
        if (vn >= 0) continue;
        const e = -vn < SIM.stick ? 0 : SIM.restitution;
        const jn = (-(1 + e) * vn) / im;
        const vt = [rv[0] - n[0] * vn, rv[1] - n[1] * vn, rv[2] - n[2] * vn];
        const vtl = Math.hypot(vt[0], vt[1], vt[2]);
        const jt = vtl > 1e-9 ? Math.min(SIM.friction * jn, vtl / im) : 0;
        // impulse on b (a gets the opposite)
        const J = [n[0] * jn - (vt[0] / (vtl || 1)) * jt, n[1] * jn - (vt[1] / (vtl || 1)) * jt, n[2] * jn - (vt[2] / (vtl || 1)) * jt];
        for (let k = 0; k < 3; k++) {
          a.vel[k] -= J[k] * a.invMass;
          b.vel[k] += J[k] * b.invMass;
        }
        const ta = cross(ra, [-J[0], -J[1], -J[2]]), tb = cross(rb, J);
        for (let k = 0; k < 3; k++) {
          a.L[k] += ta[k];
          b.L[k] += tb[k];
        }
        const speed = -vn;
        const bump = Math.min(0.6, speed * 0.5);
        a.heatBump = Math.max(a.heatBump, bump);
        b.heatBump = Math.max(b.heatBump, bump);
        if (speed > SIM.eventSpeed && this.t - this.lastEvent[key] > 0.5) {
          this.lastEvent[key] = this.t;
          const mu = 1 / im;
          const point = [a.pos[0] + n[0] * a.radius, a.pos[1] + n[1] * a.radius, a.pos[2] + n[2] * a.radius];
          const ev = { t: this.t, point, normal: n, speed, energy: 0.5 * mu * speed * speed, a: i, b: j };
          this.events.push(ev);
          this.secondary(ev, a, b);
        }
      }
  }

  /** Secondary debris: dust sheet ⟂ the contact normal + ice + a few rocks, carried at the pair's velocity. */
  secondary(ev, a, b) {
    const rng = this.rng;
    const M = a.mass + b.mass;
    const base = [(a.vel[0] * a.mass + b.vel[0] * b.mass) / M, (a.vel[1] * a.mass + b.vel[1] * b.mass) / M, (a.vel[2] * a.mass + b.vel[2] * b.mass) / M];
    const n = ev.normal;
    const up = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let t1 = cross(n, up);
    const l = Math.hypot(...t1);
    t1 = t1.map((x) => x / l);
    const t2 = cross(n, t1);
    const dust = Math.min(90, Math.round(8 + ev.energy * SIM.eventDust));
    const ice = Math.max(a.ice || 0, b.ice || 0);
    const rocks = Math.min(8, Math.floor(ev.energy * 40 + rng.next()));
    const spray = (count, kind) => {
      for (let i = 0; i < count; i++) {
        const ang = rng.range(0, Math.PI * 2);
        const lift = rng.signed() * 0.45;
        const d = [t1[0] * Math.cos(ang) + t2[0] * Math.sin(ang) + n[0] * lift, t1[1] * Math.cos(ang) + t2[1] * Math.sin(ang) + n[1] * lift, t1[2] * Math.cos(ang) + t2[2] * Math.sin(ang) + n[2] * lift];
        const sp = ev.speed * rng.range(0.15, 1.1);
        const src = rng.next() < 0.5 ? a : b;
        const isIce = kind === 0 && rng.next() < ice * 0.5;
        this.emitted.push({
          kind: kind === 3 ? 3 : isIce ? 1 : 0,
          t0: this.t,
          pos: [ev.point[0] + d[0] * 0.08, ev.point[1] + d[1] * 0.08, ev.point[2] + d[2] * 0.08],
          vel: [base[0] + d[0] * sp, base[1] + d[1] * sp, base[2] + d[2] * sp],
          size: kind === 3 ? rng.range(0.03, 0.09) : isIce ? rng.range(0.04, 0.09) : rng.range(0.06, 0.22),
          seed: rng.next(),
          heat: Math.min(1, ev.speed * 0.6),
          color: isIce ? [0.8, 0.92, 1.0] : src.color,
        });
      }
    };
    spray(dust, 0);
    spray(rocks, 3);
  }

  /** Young fragments shed surface dust at v + ω × r: each tumbling piece draws its own swirl. */
  shed() {
    const rng = this.rng;
    const dt = SIM.dt;
    for (const P of this.pieces) {
      if (!P.shed || this.t > SIM.shedSeconds) continue;
      const rate = SIM.shedRate * P.shed * P.radius * P.radius * Math.exp(-this.t / 2.8);
      P.lastShed += rate * dt;
      if (P.lastShed < 1) continue;
      const w = this.omega(P);
      while (P.lastShed >= 1) {
        P.lastShed -= 1;
        const u = unitVec(rng);
        const r = [u[0] * P.radius, u[1] * P.radius, u[2] * P.radius];
        const rim = cross(w, r);
        const kick = rng.range(0.02, 0.16) * (1 + (P.heat || 0));
        const isIce = rng.next() < (P.ice || 0) * 0.3;
        this.emitted.push({
          kind: isIce ? 1 : 0,
          t0: this.t,
          pos: [P.pos[0] + r[0], P.pos[1] + r[1], P.pos[2] + r[2]],
          vel: [P.vel[0] + rim[0] + u[0] * kick, P.vel[1] + rim[1] + u[1] * kick, P.vel[2] + rim[2] + u[2] * kick],
          size: isIce ? rng.range(0.04, 0.08) : rng.range(0.05, 0.13), // fine grains: the swirl lines stay readable
          seed: rng.next(),
          heat: (P.heat || 0) * Math.exp(-this.t * (P.cool || 0.4)) * 0.8,
          color: isIce ? [0.82, 0.93, 1.0] : P.color,
        });
      }
    }
  }

  /** Step until sim time ≥ t (at most maxSteps per call, so a slow frame never stalls). */
  advance(t, maxSteps = 240) {
    let n = 0;
    while (this.t < t && n < maxSteps) {
      this.step();
      n++;
    }
    return n;
  }

  /** Interpolated { pos, q } for piece i at time t (clamped to the stored track). */
  stateAt(i, t) {
    const T = this.frameT;
    if (!T.length) return { pos: this.pieces[i].pos, q: this.pieces[i].q };
    let lo = 0, hi = T.length - 1;
    if (t <= T[0]) hi = 0;
    else if (t >= T[hi]) lo = hi;
    else {
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (T[mid] <= t) lo = mid;
        else hi = mid;
      }
    }
    const fa = this.frames[lo], fb = this.frames[hi];
    const s = hi === lo ? 0 : (t - T[lo]) / (T[hi] - T[lo]);
    const o = i * 7;
    const pos = [fa[o] + (fb[o] - fa[o]) * s, fa[o + 1] + (fb[o + 1] - fa[o + 1]) * s, fa[o + 2] + (fb[o + 2] - fa[o + 2]) * s];
    let qb = [fb[o + 3], fb[o + 4], fb[o + 5], fb[o + 6]];
    const qa = [fa[o + 3], fa[o + 4], fa[o + 5], fa[o + 6]];
    if (qa[0] * qb[0] + qa[1] * qb[1] + qa[2] * qb[2] + qa[3] * qb[3] < 0) qb = qb.map((x) => -x);
    const q = qa.map((x, k) => x + (qb[k] - x) * s);
    const l = Math.hypot(...q) || 1;
    return { pos, q: q.map((x) => x / l) };
  }

  momentum() {
    const P = [0, 0, 0];
    for (const p of this.pieces) for (let k = 0; k < 3; k++) P[k] += p.vel[k] * p.mass;
    return P;
  }

  angularMomentum() {
    const L = [0, 0, 0];
    for (const p of this.pieces) {
      const orb = cross(p.pos, [p.vel[0] * p.mass, p.vel[1] * p.mass, p.vel[2] * p.mass]);
      for (let k = 0; k < 3; k++) L[k] += orb[k] + p.L[k];
    }
    return L;
  }

  energy() {
    let E = 0;
    const ps = this.pieces;
    for (const p of ps) E += 0.5 * p.mass * dot(p.vel, p.vel) + 0.5 * dot(this.omega(p), p.L);
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j];
        const eps = 0.5 * (a.radius + b.radius);
        E -= (this.G * a.mass * b.mass) / Math.sqrt((a.pos[0] - b.pos[0]) ** 2 + (a.pos[1] - b.pos[1]) ** 2 + (a.pos[2] - b.pos[2]) ** 2 + eps * eps);
      }
    return E;
  }

  /** Centre of mass position / velocity of all pieces. */
  centre() {
    const c = [0, 0, 0], v = [0, 0, 0];
    let M = 0;
    for (const p of this.pieces) {
      M += p.mass;
      for (let k = 0; k < 3; k++) {
        c[k] += p.pos[k] * p.mass;
        v[k] += p.vel[k] * p.mass;
      }
    }
    return { pos: c.map((x) => x / M), vel: v.map((x) => x / M), mass: M };
  }

  /** escaping: positive energy relative to the rest of the cluster and already well out. */
  fates() {
    const C = this.centre();
    const Rc = Math.max(...this.pieces.filter((p) => p.kind === 'survivor').map((p) => p.radius), 1);
    const out = { escaping: [], bound: [] };
    for (const p of this.pieces) {
      if (p.kind !== 'fragment') continue;
      const dv = [p.vel[0] - C.vel[0], p.vel[1] - C.vel[1], p.vel[2] - C.vel[2]];
      let E = 0.5 * dot(dv, dv);
      for (const q of this.pieces) if (q !== p) E -= (this.G * q.mass) / Math.max(q.radius + p.radius, Math.hypot(p.pos[0] - q.pos[0], p.pos[1] - q.pos[1], p.pos[2] - q.pos[2]));
      const far = Math.hypot(p.pos[0] - C.pos[0], p.pos[1] - C.pos[1], p.pos[2] - C.pos[2]) > 3 * Rc;
      (E > 0 && far ? out.escaping : out.bound).push({ body: p.body, k: p.k, size: p.radius, speed: Math.hypot(...dv), index: p.i });
    }
    return out;
  }

  /** Groups of ≥ 2 pieces resting on each other (touching, slow relative motion). */
  clumps() {
    const ps = this.pieces;
    const parent = ps.map((_, i) => i);
    const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j];
        const d = Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b.pos[2]);
        if (d > (a.radius + b.radius) * 1.06) continue;
        if (Math.hypot(a.vel[0] - b.vel[0], a.vel[1] - b.vel[1], a.vel[2] - b.vel[2]) > 0.25) continue;
        parent[find(i)] = find(j);
      }
    const groups = new Map();
    ps.forEach((_, i) => {
      const r = find(i);
      groups.set(r, (groups.get(r) || 0) + 1);
    });
    return [...groups.values()].filter((n) => n >= 2).sort((a, b) => b - a);
  }
}

/** Principal inertia axes of a mesh (local frame) from its vertex spread: { axes (semi, local units), basis }. */
export function meshShape(positions, eigen3) {
  const V = positions.length / 3;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < V; i++) {
    cx += positions[i * 3];
    cy += positions[i * 3 + 1];
    cz += positions[i * 3 + 2];
  }
  cx /= V; cy /= V; cz /= V;
  const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < V; i++) {
    const d = [positions[i * 3] - cx, positions[i * 3 + 1] - cy, positions[i * 3 + 2] - cz];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) m[r][c] += (d[r] * d[c]) / V;
  }
  const { values, vectors } = eigen3(m);
  return { axes: values.map((l) => Math.sqrt(Math.max(1e-6, 3 * l))), basis: vectors };
}

/**
 * Rigid pieces for the post-impact sim from a plan.
 * @param {object} plan  planImpact() result
 * @param {Array} bodies [{ kind, q (world quat at impact), pos, scale, radius, mass, shape: meshShape(), fracture, ice, pieceColor(k) }]
 */
export function buildSimPieces(plan, bodies) {
  const pieces = [];
  plan.bodies.forEach((bp, bi) => {
    const b = bodies[bi];
    if (bp.massPost > 1e-6) {
      const share = bp.massPost / b.mass;
      pieces.push({
        kind: 'survivor',
        body: bi,
        k: -1,
        mass: bp.massPost,
        radius: b.radius * Math.cbrt(share) * 0.92,
        pos: b.pos.slice(),
        vel: bp.velPost.slice(),
        q: b.q.slice(),
        spin: bp.spinPost.slice(),
        inertia: ellipsoidInertia(bp.massPost, b.shape.axes.map((a) => a * b.scale * Math.cbrt(share)), b.shape.basis),
        color: b.pieceColor(-1),
        ice: b.ice || 0,
        heat: 0.3,
        cool: 0.3,
        shed: 0.35 * bp.fraction,
      });
    }
    for (const d of bp.detached) {
      const sh = b.fracture.morph?.[d.k] || b.chunkShapes?.[d.k];
      const inertia = sh ? ellipsoidInertia(d.mass, sh.axes.map((a) => a * b.scale), sh.basis) : ellipsoidInertia(d.mass, [d.size, d.size, d.size]);
      pieces.push({
        kind: 'fragment',
        body: bi,
        k: d.k,
        mass: d.mass,
        radius: d.size,
        pos: d.world.slice(),
        vel: d.velWorld.slice(),
        q: b.q.slice(),
        spin: d.spinWorld.slice(),
        inertia,
        color: b.pieceColor(d.k),
        ice: b.ice || 0,
        heat: d.heat,
        cool: d.cool,
        seed: d.seed,
        reform: d.reform,
        shed: 1,
      });
    }
  });
  return pieces;
}

/** Per-chunk principal shapes (for pieces that do not re-form): { axes, basis } by chunk id. */
export function chunkShapes(geometry, count, eigen3) {
  const pos = geometry.attributes.position.array, ch = geometry.attributes.aChunk.array;
  const buckets = Array.from({ length: count }, () => []);
  for (let i = 0; i < ch.length; i++) {
    const k = ch[i];
    if (k < count) buckets[k].push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  }
  return buckets.map((b) => (b.length >= 12 ? meshShape(b, eigen3) : null));
}

/** Fixed-capacity GPU-ready dust / ice sprite buffer (unemitted slots stay hidden: t0 = 1e6). */
export class DustBuffer {
  constructor(cap) {
    this.cap = cap;
    this.count = 0;
    this.pos = new Float32Array(cap * 3);
    this.vel = new Float32Array(cap * 3);
    this.data = new Float32Array(cap * 4);
    this.color = new Float32Array(cap * 3);
    this.t0 = new Float32Array(cap).fill(1e6);
    this.dirty = true;
  }
  push(r) {
    if (this.count >= this.cap) return false;
    const i = this.count++;
    this.pos.set(r.pos, i * 3);
    this.vel.set(r.vel, i * 3);
    this.data.set([r.size, r.seed, r.heat, r.kind === 1 ? 1 : 0], i * 4);
    this.color.set([Math.min(1, r.color[0] * 1.25), Math.min(1, r.color[1] * 1.25), Math.min(1, r.color[2] * 1.25)], i * 3);
    this.t0[i] = r.t0;
    this.dirty = true;
    return true;
  }
  /** planEjecta() dust block, emitted at t0. */
  pushBlast(D, t0 = 0) {
    const n = D.pos.length / 3;
    for (let i = 0; i < n && this.count < this.cap; i++) {
      const j = this.count++;
      this.pos.set(D.pos.subarray(i * 3, i * 3 + 3), j * 3);
      this.vel.set(D.vel.subarray(i * 3, i * 3 + 3), j * 3);
      this.data.set(D.data.subarray(i * 4, i * 4 + 4), j * 4);
      this.color.set(D.color.subarray(i * 3, i * 3 + 3), j * 3);
      this.t0[j] = t0;
    }
    this.dirty = true;
  }
}

/** Fixed-capacity instanced ejecta-rock buffer, one slot range per rock variant. */
export class RockBuffer {
  constructor(cap, variants = 4) {
    this.cap = cap;
    this.variants = variants;
    this.per = Math.ceil(cap / variants);
    this.counts = new Array(variants).fill(0);
    const n = this.per * variants;
    this.matrix = new Float32Array(n * 16);
    this.vel = new Float32Array(n * 3);
    this.spin = new Float32Array(n * 4);
    this.spin2 = new Float32Array(n * 4);
    this.heat = new Float32Array(n * 2);
    this.color = new Float32Array(n * 3);
    this.t0 = new Float32Array(n).fill(1e6);
    this.next = 0;
    this.dirty = true;
  }
  slot() {
    for (let tries = 0; tries < this.variants; tries++) {
      const v = (this.next + tries) % this.variants;
      if (this.counts[v] < this.per) {
        this.next = (v + 1) % this.variants;
        return { v, i: v * this.per + this.counts[v]++ };
      }
    }
    return null;
  }
  write(i, { matrix, vel, spin, spin2, heat, color, t0 }) {
    this.matrix.set(matrix, i * 16);
    this.vel.set(vel, i * 3);
    this.spin.set(spin, i * 4);
    this.spin2.set(spin2, i * 4);
    this.heat.set(heat, i * 2);
    this.color.set(color, i * 3);
    this.t0[i] = t0;
    this.dirty = true;
  }
  /** planEjecta() rocks block (t0 = 0). */
  pushBlast(K, t0 = 0) {
    for (let r = 0; r < K.variant.length; r++) {
      const s = this.slot();
      if (!s) return;
      this.write(s.i, { matrix: K.matrix.subarray(r * 16, r * 16 + 16), vel: K.vel.subarray(r * 3, r * 3 + 3), spin: K.spin.subarray(r * 4, r * 4 + 4), spin2: K.spin2.subarray(r * 4, r * 4 + 4), heat: K.heat.subarray(r * 2, r * 2 + 2), color: K.color.subarray(r * 3, r * 3 + 3), t0 });
    }
  }
  /** sim record (kind 3). */
  push(rec) {
    const s = this.slot();
    if (!s) return false;
    const a = unitVecFrom(rec.seed * 97.3), b = unitVecFrom(rec.seed * 13.1 + 5);
    const m = new Float32Array(16);
    const sc = rec.size;
    m[0] = sc; m[5] = sc; m[10] = sc; m[15] = 1;
    m[12] = rec.pos[0]; m[13] = rec.pos[1]; m[14] = rec.pos[2];
    const c = rec.color;
    this.write(s.i, { matrix: m, vel: rec.vel, spin: [a[0], a[1], a[2], 0.6 + rec.seed * 3], spin2: [b[0], b[1], b[2], 0.15 + rec.seed * 0.8], heat: [rec.heat, rec.seed], color: [Math.min(1, c[0] * 1.3), Math.min(1, c[1] * 1.3), Math.min(1, c[2] * 1.3)], t0: rec.t0 });
    return true;
  }
}

function unitVecFrom(x) {
  const z = Math.sin(x * 12.9898) * 0.999;
  const t = x * 78.233;
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(t), z, r * Math.sin(t)];
}

/** Local chunk transform for the fracture shader: centre and orientation in the mesh's frame. */
export function chunkLocal(meshPos, meshQ, scale, piecePos, pieceQ) {
  const inv = quatConj(meshQ);
  const d = quatRotate(inv, [piecePos[0] - meshPos[0], piecePos[1] - meshPos[1], piecePos[2] - meshPos[2]]);
  return { centre: [d[0] / scale, d[1] / scale, d[2] / scale], q: quatMul(inv, pieceQ) };
}
