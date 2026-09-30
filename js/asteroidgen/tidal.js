import { RNG, hashString, unitVec } from './rng.js';
import { isco, horizon } from './kerr.js';
import { WELL_PRESETS } from './debris.js';
import { fractureGeometry, createFractureUniforms, applyFracture, makeFractureDepthMaterial, FRACTURE_MAX } from './fracture.js';

export const TIDAL = {
  breakupSeconds: 14,
  soften: 0.15,
  burnR: 0.75,
  captureR: 0.3,
  burnSeconds: 2.2,
  dragZone: 1.5,
  drag: 0.12,
  inflow: 0.3,
  escapeR: 16,
  restitution: 0.3,
  iscoScale: 1,
  horizonScale: 1,
};

export function setTidalSpin(a) {
  TIDAL.iscoScale = isco(a) / 6;
  TIDAL.horizonScale = horizon(a) / 2;
}

const ss = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);

export function rocheRadius(density = 2000, base = 3.4) {
  return base * Math.cbrt(2000 / Math.max(300, density));
}

export function gravity(p, hole, gm, soft = TIDAL.soften) {
  const rx = p[0] - hole[0], ry = p[1] - hole[1], rz = p[2] - hole[2];
  const r2 = rx * rx + ry * ry + rz * rz + soft * soft;
  const inv = gm / (r2 * Math.sqrt(r2));
  return [-rx * inv, -ry * inv, -rz * inv];
}

export function periapsis(r, v, gm) {
  const R = len3(r[0], r[1], r[2]);
  const hx = r[1] * v[2] - r[2] * v[1], hy = r[2] * v[0] - r[0] * v[2], hz = r[0] * v[1] - r[1] * v[0];
  const h2 = hx * hx + hy * hy + hz * hz;
  const E = 0.5 * (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) - gm / R;
  const e = Math.sqrt(Math.max(0, 1 + (2 * E * h2) / (gm * gm)));
  return { rp: h2 / (gm * (1 + e)), E, e };
}

export function aimFlyby(rel, { gm = 5, rp = 1.2, speedShare = 0.62, incline = 0.1 } = {}) {
  const R = len3(rel[0], rel[1], rel[2]);
  const v = speedShare * Math.sqrt((2 * gm) / R);
  const er = [rel[0] / R, rel[1] / R, rel[2] / R];
  let tx = -er[2], tz = er[0];
  const tl = Math.hypot(tx, tz) || 1;
  const et = [(tx / tl) * Math.cos(incline), Math.sin(incline), (tz / tl) * Math.cos(incline)];
  const at = (vt) => {
    const vr = -Math.sqrt(Math.max(0, v * v - vt * vt));
    return [er[0] * vr + et[0] * vt, er[1] * vr + et[1] * vt, er[2] * vr + et[2] * vt];
  };
  let lo = 0, hi = v;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (periapsis(rel, at(mid), gm).rp < rp) lo = mid;
    else hi = mid;
  }
  return at((lo + hi) / 2);
}

export class Trajectory {
  constructor(pos, vel) {
    this.p = pos;
    this.v = vel.slice();
    this.absorbed = false;
  }

  distanceTo(hole) {
    return len3(this.p.x - hole[0], this.p.y - hole[1], this.p.z - hole[2]);
  }

  update(dt, hole, gm, absorbR = 0.3, holeVel = [0, 0, 0]) {
    if (this.absorbed) return;
    const n = Math.max(1, Math.ceil(dt / 0.01));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const f = h * (i + 0.5 - n);
      const a = gravity([this.p.x, this.p.y, this.p.z], [hole[0] + holeVel[0] * f, hole[1] + holeVel[1] * f, hole[2] + holeVel[2] * f], gm, 0.3);
      this.v[0] += a[0] * h;
      this.v[1] += a[1] * h;
      this.v[2] += a[2] * h;
      this.p.x += this.v[0] * h;
      this.p.y += this.v[1] * h;
      this.p.z += this.v[2] * h;
    }
    if (this.distanceTo(hole) < absorbR) this.absorbed = true;
  }
}

function quatMul(a, b) {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}
export function integrateQuat(q, w, dt) {
  const wl = len3(w[0], w[1], w[2]);
  if (wl < 1e-9) return q;
  const half = 0.5 * wl * dt, s = Math.sin(half) / wl;
  const r = quatMul([w[0] * s, w[1] * s, w[2] * s, Math.cos(half)], q);
  const l = Math.hypot(r[0], r[1], r[2], r[3]);
  return [r[0] / l, r[1] / l, r[2] / l, r[3] / l];
}

export class TidalBody {
  constructor(mesh, opts = {}) {
    this.mesh = mesh;
    this.name = opts.name || mesh.name || 'body';
    this.rocheBase = opts.roche ?? 3.4;
    this.rocheScale = opts.rocheScale ?? 0.62;
    this.roche = this.rocheBase * this.rocheScale;
    this.canBreak = opts.canBreak || (() => true);
    this.mass = opts.mass ?? 0.06;
    this.onDetach = opts.onDetach || null;
    this.morph = !!opts.morph;
    this.reform = opts.reform || [3, 6];
    this.keep = Math.max(0.05, Math.min(1, opts.keep ?? 1));
    this.info = fractureGeometry(mesh.geometry, { chunks: Math.min(FRACTURE_MAX, opts.chunks ?? 24), seed: opts.seed ?? this.name, crust: opts.crust || null, mantle: opts.mantle || null, morph: this.morph });
    this.uniforms = createFractureUniforms();
    applyFracture(mesh.material, this.uniforms, { morph: this.morph });
    mesh.customDepthMaterial = makeFractureDepthMaterial(this.uniforms, { morph: this.morph });

    const rng = new RNG(hashString(String(opts.seed ?? this.name) + ':tidal'));
    const V = Math.max(1, this.info.counts.reduce((s, n) => s + n, 0));
    this.chunks = this.info.centroids.map((c, k) => {
      const ax = unitVec(rng);
      const spin = rng.range(0.2, 1.1);
      return {
        k,
        c,
        seed: rng.next(),
        noise: rng.next(),
        mass: (this.mass * this.info.counts[k]) / V,
        size: this.info.radius * Math.cbrt(this.info.counts[k] / V),
        empty: this.info.counts[k] === 0,
        state: 'attached',
        t0: -1,
        p: [0, 0, 0],
        v: [0, 0, 0],
        q: [0, 0, 0, 1],
        w: [ax[0] * spin, ax[1] * spin, ax[2] * spin],
        heat: 0,
        vis: 1,
        S: 1,
        reformAt: 0,
        burnT: 0,
        eatR: 0,
        escaped: false,
        hits: 0,
        armed: false,
        hitT: -1e9,
      };
    });
    const live = this.chunks.filter((c) => !c.empty);
    this.limit = this.keep >= 1 ? live.length : Math.max(1, Math.round(live.length * this.keep));
    this.progress = 0;
    this.detached = 0;
    this.stress = 0;
    this.lastDetach = -1;
    this.done = false;
    this.started = false;
    this.primed = false;
    this.hitCount = 0;
    this.bhMass = 1;
  }

  setBHMass(m) {
    this.bhMass = Math.max(this.bhMass, m);
    this.roche = Math.max(this.roche, this.rocheBase * this.rocheScale * Math.cbrt(Math.max(1, m)));
  }

  get total() {
    return this.chunks.filter((c) => !c.empty).length;
  }
  get survivors() {
    return this.chunks.filter((c) => c.state === 'free').length;
  }
  get escaped() {
    return this.chunks.filter((c) => c.state === 'free' && c.escaped).length;
  }
  get burning() {
    return this.chunks.filter((c) => c.state === 'burning').length;
  }
  get consumed() {
    return this.chunks.filter((c) => c.state === 'eaten').length;
  }
  get smashed() {
    return this.chunks.filter((c) => c.state === 'smashed').length;
  }
  get remnant() {
    return this.detached < this.total || this.chunks.some((c) => c.state === 'free' || c.state === 'burning');
  }

  shedAll() {
    this.limit = this.total;
    this.progress = this.total;
  }

  update(t, dt, hole, body) {
    const u = this.uniforms;
    u.uTime.value = t;
    const M = this.bhMass;
    const sq = Math.sqrt(M);
    const W = [hole.pos[0] - body.pos[0], hole.pos[1] - body.pos[1], hole.pos[2] - body.pos[2]];
    const D = Math.max(1e-4, len3(W[0], W[1], W[2]));
    u.uBHLocal.value = W;
    u.uStressDir.value = [W[0] / D, W[1] / D, W[2] / D];
    const allowed = this.canBreak();
    const target = ss(this.roche, this.roche * 0.45, D) * (allowed ? 1 : 0.2);
    this.stress += (Math.max(target, (this.detached / Math.max(1, this.total)) * 0.35) - this.stress) * (1 - Math.exp(-dt * 3));
    u.uStress.value = this.stress;
    u.uCoreHeat.value = Math.min(1, this.stress * 0.7 + (this.detached / Math.max(1, this.total)) * 0.5);
    if (target > 0.02) this.started = true;

    if (allowed) {
      if (!this.primed && this.stress > 0.12) {
        this.primed = true;
        this.progress = Math.max(this.progress, 0.95);
      }
      const deep = D < this.roche * 0.5 ? 2.5 : 1;
      this.progress += (this.total / TIDAL.breakupSeconds) * this.stress * deep * dt;
    }
    if (D < TIDAL.burnR * TIDAL.iscoScale * sq * 0.9) this.shedAll();
    const want = Math.min(this.limit, Math.floor(this.progress));
    while (this.detached < want) this.detachNext(t, hole, body, W, D);

    this.integrate(t, dt, hole);
    this.upload(body);

    if (this.detached >= this.limit && !this.done && t - this.lastDetach > 25 && !this.burning) this.done = true;
  }

  detachNext(t, hole, body, W, D) {
    const dir = [W[0] / D, W[1] / D, W[2] / D];
    let best = null, bestScore = -1;
    for (const ch of this.chunks) {
      if (ch.state !== 'attached' || ch.empty) continue;
      const l = len3(ch.c[0], ch.c[1], ch.c[2]) || 1;
      const facing = Math.abs((ch.c[0] * dir[0] + ch.c[1] * dir[1] + ch.c[2] * dir[2]) / l);
      const score = facing * 0.7 * Math.min(1, l / (this.info.radius * 0.6)) + ch.noise * 0.3;
      if (score > bestScore) {
        bestScore = score;
        best = ch;
      }
    }
    if (!best) return;
    const ch = best;
    ch.state = 'free';
    ch.t0 = t;
    ch.p = [body.pos[0] + ch.c[0], body.pos[1] + ch.c[1], body.pos[2] + ch.c[2]];
    const rx = body.pos[0] - hole.pos[0], ry = body.pos[1] - hole.pos[1], rz = body.pos[2] - hole.pos[2];
    const vx = body.vel[0] - hole.vel[0], vy = body.vel[1] - hole.vel[1], vz = body.vel[2] - hole.vel[2];
    const r2 = Math.max(1e-6, rx * rx + ry * ry + rz * rz);
    const lock = 0.5;
    const Om = [(lock * (ry * vz - rz * vy)) / r2, (lock * (rz * vx - rx * vz)) / r2, (lock * (rx * vy - ry * vx)) / r2];
    ch.v = [
      body.vel[0] + Om[1] * ch.c[2] - Om[2] * ch.c[1],
      body.vel[1] + Om[2] * ch.c[0] - Om[0] * ch.c[2],
      body.vel[2] + Om[0] * ch.c[1] - Om[1] * ch.c[0],
    ];
    ch.w = [ch.w[0] + Om[0], ch.w[1] + Om[1], ch.w[2] + Om[2]];
    this.uniforms.uChunkA.value.set([ch.c[0], ch.c[1], ch.c[2], t], ch.k * 4);
    this.uniforms.uChunkB.value[ch.k * 4 + 3] = ch.seed;
    this.detached++;
    this.lastDetach = t;
    if (this.onDetach) {
      const l = len3(ch.c[0], ch.c[1], ch.c[2]) || 1;
      this.onDetach({ body: this, chunk: ch.k, position: ch.p.slice(), normal: [ch.c[0] / l, ch.c[1] / l, ch.c[2] / l], color: this.info.colors[ch.k], mass: ch.mass, fraction: this.detached / this.total });
    }
  }

  integrate(t, dt, hole) {
    const gm = hole.gm;
    const sq = Math.sqrt(this.bhMass);
    const burnR = TIDAL.burnR * TIDAL.iscoScale * sq, capR = TIDAL.captureR * TIDAL.horizonScale * sq, zone = TIDAL.dragZone * Math.max(0.5, TIDAL.iscoScale) * sq;
    const n = Math.max(1, Math.ceil(dt / 0.01));
    const h = dt / n;
    for (const ch of this.chunks) {
      if (ch.state !== 'free' && ch.state !== 'burning') continue;
      let r = 0;
      for (let i = 0; i < n; i++) {
        const f = h * (i + 0.5 - n);
        const hp = [hole.pos[0] + hole.vel[0] * f, hole.pos[1] + hole.vel[1] * f, hole.pos[2] + hole.vel[2] * f];
        const a = gravity(ch.p, hp, gm);
        const rx = ch.p[0] - hp[0], ry = ch.p[1] - hp[1], rz = ch.p[2] - hp[2];
        r = len3(rx, ry, rz);
        ch.v[0] += a[0] * h;
        ch.v[1] += a[1] * h;
        ch.v[2] += a[2] * h;
        if (r < zone) {
          const rxz = Math.max(0.05, Math.hypot(rx, rz));
          const vc = Math.sqrt(gm / Math.max(r, 0.05));
          const k = Math.min(1, TIDAL.drag * (zone / Math.max(r, 0.2)) ** 2 * h);
          const tx = hole.vel[0] - (rz / rxz) * vc - (rx / rxz) * vc * TIDAL.inflow;
          const tz = hole.vel[2] + (rx / rxz) * vc - (rz / rxz) * vc * TIDAL.inflow;
          ch.v[0] += (tx - ch.v[0]) * k;
          ch.v[1] += (hole.vel[1] - ch.v[1]) * k;
          ch.v[2] += (tz - ch.v[2]) * k;
        }
        ch.p[0] += ch.v[0] * h;
        ch.p[1] += ch.v[1] * h;
        ch.p[2] += ch.v[2] * h;
      }
      ch.q = integrateQuat(ch.q, ch.w, dt);
      const rel = [ch.p[0] - hole.pos[0], ch.p[1] - hole.pos[1], ch.p[2] - hole.pos[2]];
      r = len3(rel[0], rel[1], rel[2]);
      const tidal = (this.roche / Math.max(r, 0.05)) ** 2;
      const Sw = 1 + Math.min(6, tidal * 0.35);
      ch.S += (Sw - ch.S) * (1 - Math.exp(-dt * 1.5));
      const hw = ch.state === 'burning' ? 1.2 : Math.min(1.05, 0.08 + 0.45 * Math.max(0, Math.sqrt(tidal) - 0.55));
      ch.heat += (hw - ch.heat) * (1 - Math.exp(-dt * (ch.state === 'burning' ? 2.5 : 0.7)));
      if (ch.state === 'free') {
        if (r < capR) {
          this.eat(ch, t, rel, 0);
          continue;
        }
        if (r < burnR) {
          ch.state = 'burning';
          ch.burnT = t;
          ch.eatR = Math.hypot(rel[0], rel[2]);
        }
        const vr = [ch.v[0] - hole.vel[0], ch.v[1] - hole.vel[1], ch.v[2] - hole.vel[2]];
        const orb = periapsis(rel, vr, gm);
        ch.escaped = orb.E > 0 && r > TIDAL.escapeR * 0.5;
        if (this.morph && !ch.reformAt && t - ch.t0 > 6 && (orb.E > 0 || orb.rp > burnR * 1.8)) ch.reformAt = t - ch.t0 + this.reform[0] + (this.reform[1] - this.reform[0]) * ch.noise;
        if (r > TIDAL.escapeR * 4) ch.vis = Math.max(0, 1 - (r - TIDAL.escapeR * 4) / TIDAL.escapeR);
      } else {
        ch.vis = 1 - ss(0, TIDAL.burnSeconds, t - ch.burnT);
        if (ch.vis <= 0.001 || r < capR) this.eat(ch, t, rel, ch.eatR || Math.hypot(rel[0], rel[2]));
      }
    }
    for (const ch of this.chunks) {
      if (ch.state !== 'smashed' || ch.vis <= 0) continue;
      ch.vis = Math.max(0, 1 - (t - ch.burnT) / 0.35);
    }
  }

  eat(ch, t, rel, rEat) {
    ch.state = 'eaten';
    ch.vis = 0;
    ch.eatR = rEat || Math.hypot(rel[0], rel[2]);
    ch.eatT = t;
  }

  upload(body) {
    const u = this.uniforms;
    for (const ch of this.chunks) {
      if (ch.state === 'attached' || ch.empty) continue;
      const o = ch.k * 4;
      u.uChunkB.value.set([ch.p[0] - body.pos[0], ch.p[1] - body.pos[1], ch.p[2] - body.pos[2], ch.seed], o);
      u.uChunkC.value.set([ch.heat, ch.state === 'eaten' ? 0 : ch.vis, ch.S, ch.reformAt], o);
      u.uChunkD.value.set(ch.q, o);
    }
  }

  collide(t, bodyPos, radius, bodyVel = [0, 0, 0]) {
    const hits = [];
    if (this.detached >= this.total) return hits;
    for (const ch of this.chunks) {
      if (ch.state !== 'free') continue;
      const dx = ch.p[0] - bodyPos[0], dy = ch.p[1] - bodyPos[1], dz = ch.p[2] - bodyPos[2];
      const d = len3(dx, dy, dz);
      const reach = radius * 0.95 + ch.size * 0.6;
      if (d > reach + 0.4) ch.armed = true;
      if (!ch.armed || d > reach || t - ch.hitT < 1.5) continue;
      const n = [dx / (d || 1), dy / (d || 1), dz / (d || 1)];
      const rv = [ch.v[0] - bodyVel[0], ch.v[1] - bodyVel[1], ch.v[2] - bodyVel[2]];
      const vn = rv[0] * n[0] + rv[1] * n[1] + rv[2] * n[2];
      if (vn >= 0) continue;
      const speed = Math.hypot(rv[0], rv[1], rv[2]);
      const destroyed = ch.hits > 0 || ch.size < 0.5 * radius * 0.35 || -vn > 1.2;
      ch.hits++;
      ch.hitT = t;
      this.hitCount++;
      if (destroyed) {
        ch.state = 'smashed';
        ch.burnT = t;
      } else {
        const j = -(1 + TIDAL.restitution) * vn;
        ch.v = [ch.v[0] + n[0] * j, ch.v[1] + n[1] * j, ch.v[2] + n[2] * j];
        ch.p = [bodyPos[0] + n[0] * (reach + 0.02), bodyPos[1] + n[1] * (reach + 0.02), bodyPos[2] + n[2] * (reach + 0.02)];
        const tv = [rv[0] - n[0] * vn, rv[1] - n[1] * vn, rv[2] - n[2] * vn];
        const kick = 1 / Math.max(0.1, ch.size);
        ch.w = [ch.w[0] + (n[1] * tv[2] - n[2] * tv[1]) * kick, ch.w[1] + (n[2] * tv[0] - n[0] * tv[2]) * kick, ch.w[2] + (n[0] * tv[1] - n[1] * tv[0]) * kick];
        ch.heat = Math.min(1.2, ch.heat + 0.6);
        ch.armed = false;
      }
      hits.push({ chunk: ch.k, point: [bodyPos[0] + n[0] * radius, bodyPos[1] + n[1] * radius, bodyPos[2] + n[2] * radius], normal: n, color: this.info.colors[ch.k], destroyed, speed, size: ch.size });
    }
    return hits;
  }

  accretion() {
    const out = [];
    const p = WELL_PRESETS.bh;
    for (const ch of this.chunks) {
      if (ch.state !== 'eaten' && ch.state !== 'burning') continue;
      const r = Math.max(p.diskMin, Math.min(p.diskMax, ch.eatR * 1.6));
      out.push({ r, mass: ch.mass * (ch.state === 'eaten' ? 1 : 1 - ch.vis), total: ch.mass });
    }
    return out;
  }

  dispose() {
    this.mesh.customDepthMaterial?.dispose();
  }
}

export function cloudCapture(age, seconds = WELL_PRESETS.bh.captureSeconds) {
  return Math.min(1, Math.max(0, age) / seconds);
}
