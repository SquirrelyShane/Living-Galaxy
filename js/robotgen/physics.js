// robotgen/src/physics.js — mass, balance and part separation.
//
// Portable on purpose: it walks node.position / rotation / scale, which real
// three.js and the test stub expose identically, and composes its own matrices.
// That means the same code runs in the browser and in `node test/physics.js`.

/* ---------- portable forward kinematics ---------- */
function compose(p, r, s) {
  const cx = Math.cos(r.x), sx = Math.sin(r.x);
  const cy = Math.cos(r.y), sy = Math.sin(r.y);
  const cz = Math.cos(r.z), sz = Math.sin(r.z);
  const m = [
    cy * cz, -cy * sz, sy,
    sx * sy * cz + cx * sz, -sx * sy * sz + cx * cz, -sx * cy,
    -cx * sy * cz + sx * sz, cx * sy * sz + sx * cz, cx * cy
  ];
  return [
    m[0] * s.x, m[1] * s.y, m[2] * s.z, p.x,
    m[3] * s.x, m[4] * s.y, m[5] * s.z, p.y,
    m[6] * s.x, m[7] * s.y, m[8] * s.z, p.z,
    0, 0, 0, 1
  ];
}
function mul(a, b) {
  const o = new Array(16);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    let v = 0;
    for (let k = 0; k < 4; k++) v += a[r * 4 + k] * b[k * 4 + c];
    o[r * 4 + c] = v;
  }
  return o;
}
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** World matrix of `node` measured in `frame`'s space. `cache` is per-pass. */
export function matrixIn(node, frame, cache) {
  if (node === frame || !node) return IDENTITY;
  const hit = cache.get(node);
  if (hit) return hit;
  const local = compose(node.position, node.rotation, node.scale);
  const m = node.parent ? mul(matrixIn(node.parent, frame, cache), local) : local;
  cache.set(node, m);
  return m;
}
export function originIn(node, frame, cache) {
  const m = matrixIn(node, frame, cache);
  return { x: m[3], y: m[7], z: m[11] };
}
function applyPoint(m, x, y, z) {
  return {
    x: m[0] * x + m[1] * y + m[2] * z + m[3],
    y: m[4] * x + m[5] * y + m[6] * z + m[7],
    z: m[8] * x + m[9] * y + m[10] * z + m[11]
  };
}

/* ---------- mass ---------- */
// kg/m³ by material role, already scaled down: a robot is a shell over a frame,
// not a solid billet, so a hollow factor is folded in below.
const DENSITY = {
  base: 2400, second: 2500, trim: 3100, dark: 3200, rubber: 1250, belt: 2100,
  composite: 1650, ablative: 950, riot: 1500, blade: 5100,
  accent: 900, glow: 60, beam: 20, plume: 15, jet: 15, stripe: 500, decal: 500, hazard: 300
};
const HOLLOW = 0.22;   // shells, frames and voids — not solid billets

export function computeMassModel(root) {
  const parts = [];
  let total = 0;
  root.traverse((o) => {
    const g = o.geometry;
    if (!g || !g.userData || !g.userData.vol) return;
    const name = (o.material && o.material.name) || 'base';
    const density = DENSITY[name] === undefined ? 2400 : DENSITY[name];
    const mass = g.userData.vol * density * HOLLOW;
    if (!(mass > 0)) return;
    parts.push({ node: o, mass, half: g.userData.half });
    total += mass;
  });
  return { parts, totalKg: total };
}

/** Centre of mass of everything under `frame`, expressed in `frame` space. */
export function centreOfMass(model, frame) {
  const cache = new Map();
  let mx = 0, my = 0, mz = 0, m = 0;
  for (const p of model.parts) {
    if (frame && !isUnder(p.node, frame)) continue;
    const o = originIn(p.node, frame, cache);
    mx += o.x * p.mass; my += o.y * p.mass; mz += o.z * p.mass; m += p.mass;
  }
  if (m <= 0) return { x: 0, y: 0, z: 0, mass: 0 };
  return { x: mx / m, y: my / m, z: mz / m, mass: m };
}
function isUnder(node, frame) {
  for (let n = node; n; n = n.parent) if (n === frame) return true;
  return false;
}

/** Weight in newtons under a given gravity. */
export const weightN = (kg, gravity) => kg * gravity;

/* ---------- collision boxes ---------- */
/** World-space AABBs for every registered collider, in `frame` space. */
export function colliderBoxes(rig, frame) {
  const out = [];
  const cache = new Map();
  for (const c of rig.colliders) {
    const m = matrixIn(c.node, frame || rig.root, cache);
    let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < 8; i++) {
      const p = applyPoint(m,
        c.offset.x + (i & 1 ? c.half[0] : -c.half[0]),
        c.offset.y + (i & 2 ? c.half[1] : -c.half[1]),
        c.offset.z + (i & 4 ? c.half[2] : -c.half[2]));
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    out.push({ name: c.name, group: c.group, minX, minY, minZ, maxX, maxY, maxZ });
  }
  return out;
}
export function boxesOverlap(a, b, slack = 0) {
  return a.minX < b.maxX - slack && a.maxX > b.minX + slack
    && a.minY < b.maxY - slack && a.maxY > b.minY + slack
    && a.minZ < b.maxZ - slack && a.maxZ > b.minZ + slack;
}

/**
 * Push limbs out of the torso and out of each other. Arms abduct at the
 * shoulder; legs add splay at the hip. Both relax back when clear, so a robot
 * that is not colliding keeps the pose the animation asked for.
 */
export function resolveSeparation(rig, dt, iterations = 3) {
  const torso = rig.torso;
  if (!torso || !rig.hull) return 0;
  const H = rig.hull;
  let worst = 0;
  const decay = Math.max(0, 1 - dt * 6);

  for (const arm of rig.arms) {
    arm.abduct = (arm.abduct || 0) * decay;
    const outward = arm.side.charAt(0) === 'L' ? -1 : 1;
    for (let it = 0; it < iterations; it++) {
      arm.shoulder.rotation.z = arm.abduct;
      const cache = new Map();
      let pen = 0;
      for (const seg of [arm.upper, arm.fore, arm.wrist]) {
        const m = matrixIn(seg, torso, cache);
        const L = seg === arm.wrist ? 0 : arm.len * 0.5;
        for (const t of [0, 0.5, 1]) {
          const p = applyPoint(m, 0, -L * t, 0);
          const r = arm.radius;
          const inX = H.half[0] + r - Math.abs(p.x);
          const inY = H.half[1] + r * 0.5 - Math.abs(p.y - H.offset.y);
          const inZ = H.half[2] + r - Math.abs(p.z);
          if (inX > 0 && inY > 0 && inZ > 0) pen = Math.max(pen, Math.min(inX, inZ));
        }
      }
      worst = Math.max(worst, pen);
      if (pen <= 0) break;
      arm.abduct += outward * Math.min(0.35, pen / Math.max(0.05, arm.len) * 1.6 + 0.02);
      arm.abduct = Math.max(-0.85, Math.min(0.85, arm.abduct));
    }
    arm.shoulder.rotation.z = arm.abduct;
  }

  // legs: keep left and right out of each other
  if (rig.legs.length === 2) {
    const [a, b] = rig.legs;
    a.splayExtra = (a.splayExtra || 0) * decay;
    b.splayExtra = (b.splayExtra || 0) * decay;
    for (let it = 0; it < iterations; it++) {
      a.hip.rotation.z = (a.hipBase || 0) - a.splayExtra;
      b.hip.rotation.z = (b.hipBase || 0) + b.splayExtra;
      const cache = new Map();
      const pa = applyPoint(matrixIn(a.shin, torso, cache), 0, -a.seg.shin, 0);
      const pb = applyPoint(matrixIn(b.shin, torso, cache), 0, -b.seg.shin, 0);
      const need = a.radius + b.radius;
      const gap = Math.abs(pa.x - pb.x);
      const pen = need - gap;
      worst = Math.max(worst, pen);
      if (pen <= 0) break;
      const step = Math.min(0.2, pen / Math.max(0.05, a.len) * 0.9 + 0.01);
      const left = pa.x <= pb.x ? a : b, right = pa.x <= pb.x ? b : a;
      left.splayExtra = Math.min(0.5, (left.splayExtra || 0) + step);
      right.splayExtra = Math.min(0.5, (right.splayExtra || 0) + step);
    }
    a.hip.rotation.z = (a.hipBase || 0) - a.splayExtra;
    b.hip.rotation.z = (b.hipBase || 0) + b.splayExtra;
  }
  return worst;
}

/* ---------- gravity ---------- */
export const EARTH_G = 9.81;
/**
 * How the walk changes with the pull it is under. Step rate follows the
 * pendulum relation (√g), swing gets floatier as g drops, and the stance
 * crouches deeper as g rises because the legs carry more weight.
 */
export function gravityProfile(gravity) {
  const g = Math.max(0.05, gravity);
  const r = g / EARTH_G;
  return {
    gravity: g,
    ratio: r,
    freq: Math.sqrt(r),
    swing: Math.min(1.35, Math.max(0.7, Math.pow(r, -0.32))),
    // heavier pull, deeper stance. Below Earth there is nothing to brace against,
    // so the crouch simply goes away rather than hyperextending the knee.
    crouch: Math.max(0, Math.min(0.5, 0.3 * (r - 1) / (1 + 0.35 * Math.abs(r - 1)))),
    sway: Math.min(2.2, Math.max(0.4, Math.pow(r, -0.4))),
    settle: Math.min(6, Math.max(0.8, 2.4 * Math.sqrt(r)))
  };
}
