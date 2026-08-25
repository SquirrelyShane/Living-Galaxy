// Living Galaxy — one particle pool for the whole game.
//
// ## Why one
//
// There were three particle systems before this file and they had nothing to do with each
// other: combat kept 720 sparks in `systems/combat.js`, the player's thrusters kept their own
// `THREE.Points` in `entities/player.js`, and mining drew a `THREE.Line` and no debris at all.
// Each allocated its own buffer, each was its own draw call, each had its own idea of how big
// a particle is, and none of them could be turned down when the frame budget got tight — the
// quality system has exposed `effectScale()` since v1.00.95 and not one of them read it.
//
// This is one pool, one buffer, one draw call, and one place where "how much of this can we
// afford" is answered. Everything that wants particles asks this file.
//
// ## Particles are information, not decoration
//
// The rule this file is written against, and the reason it is worth the code: **a particle
// says something the HUD would otherwise have to.** A pilot looking through the canopy should
// be able to tell what just hit them, what kind of rock they are cutting and how good it is,
// and whether their drive is over temperature, without reading a number.
//
//   - **Hue is categorical and exclusive.** Damage types own three colours; commodities own
//     three more; nothing else in this file uses those six. If a spark is amber it is thermal,
//     every time. That is the same rule the dossier screen carries for faction colour, and it
//     only works if nothing decorative borrows the palette.
//   - **Count is magnitude.** A big hit throws more sparks than a small one, and a rich seam
//     throws more chips than a poor one. So "is this rock worth staying on" is answerable by
//     looking at it, which it was not before.
//   - **Age is legible.** Size and alpha both decay, so a dense bright cluster means *just now*
//     and a thin dim one means *a second ago*. Motion without that reads as noise.
//
// ## Shape of the thing
//
// Struct-of-arrays over a fixed allocation, made once. No per-emit allocation, no garbage, no
// object churn — the whole point of a pool is that a firefight does not produce work for the
// collector at the exact moment the frame is tightest.
//
// Live particles are kept **contiguous** in `[0, live)` by swapping the last one into any slot
// that dies. That is what lets the draw range be a single `setDrawRange(0, live)` rather than a
// buffer full of holes with dead particles hidden by zero alpha — which is what the combat
// system did, and it meant paying for 720 vertices to see nine sparks.

import { S } from '../core/state.js';
import { PARTICLES } from '../core/config.js';
import { effectScale } from './quality.js';
// GLSL lives in its own dependency-free module so `tools/shader-check.html` can compile it in
// a real WebGL context without three.js and without booting the game.
import { PARTICLE_VERT as VERT, PARTICLE_FRAG as FRAG, particleUniforms } from './particle-shader.js';

// ── the palette ──────────────────────────────────────────────────────
//
// Six reserved hues, and the comment above is the contract: nothing decorative may use them.
// Damage colours match the ones `systems/damage.js` already names, so the spark and the
// readout cannot disagree about what a hit was.
export const PALETTE = {
  kinetic: [1.00, 0.86, 0.55],   // struck metal — pale gold
  thermal: [1.00, 0.42, 0.14],   // burn — orange
  em:      [0.55, 0.78, 1.00],   // discharge — cold blue
  ore:     [0.78, 0.66, 0.42],   // rock dust
  salvage: [0.40, 1.00, 0.80],   // cut alloy
  // Violet rather than the blue it started as. `em` and `data` were 0.08 apart in RGB — two
  // reserved hues that nothing could tell apart is the same as having five, and the whole
  // value of a categorical palette is that a glance decides.
  data:    [0.66, 0.42, 1.00],   // shattered core
  // Not categorical — these are physical, and deliberately outside the six.
  shield:  [0.42, 0.90, 1.00],
  smoke:   [0.30, 0.30, 0.34],
  plume:   [0.55, 0.85, 1.00],
  hot:     [1.00, 0.55, 0.20]
};

// ── the pool ─────────────────────────────────────────────────────────

const CAP = PARTICLES.capacity;

const px = new Float32Array(CAP), py = new Float32Array(CAP), pz = new Float32Array(CAP);
const vx = new Float32Array(CAP), vy = new Float32Array(CAP), vz = new Float32Array(CAP);
const life = new Float32Array(CAP), span = new Float32Array(CAP);
const s0 = new Float32Array(CAP), s1 = new Float32Array(CAP);
const cr = new Float32Array(CAP), cg = new Float32Array(CAP), cb = new Float32Array(CAP);
const a0 = new Float32Array(CAP), drag = new Float32Array(CAP), grav = new Float32Array(CAP);

let live = 0;
let points = null, aPos = null, aCol = null, aSize = null;
let dropped = 0;              // emissions refused for want of room, since boot

/** How many particles may exist right now — the quality budget, not the allocation. */
export const budget = () => Math.max(24, Math.floor(CAP * effectScale()));

export const particleCount = () => live;
export const particleStats = () => ({
  live, capacity: CAP, budget: budget(), dropped,
  load: live / Math.max(1, budget())
});

/**
 * Claim a slot.
 *
 * Returns -1 when the budget is full, and **the caller does not need to care**. A refused
 * particle is the correct behaviour under load: the alternative is either growing the buffer
 * mid-frame or overwriting a particle somebody is still looking at, and both are worse than
 * a slightly thinner spray during the busiest second of a fight.
 */
function claim() {
  if (live >= budget()) { dropped++; return -1; }
  return live++;
}

/** Kill by swapping the last live particle into the hole, so `[0, live)` stays dense. */
function kill(i) {
  const last = --live;
  if (i === last) return;
  px[i] = px[last]; py[i] = py[last]; pz[i] = pz[last];
  vx[i] = vx[last]; vy[i] = vy[last]; vz[i] = vz[last];
  life[i] = life[last]; span[i] = span[last];
  s0[i] = s0[last]; s1[i] = s1[last];
  cr[i] = cr[last]; cg[i] = cg[last]; cb[i] = cb[last];
  a0[i] = a0[last]; drag[i] = drag[last]; grav[i] = grav[last];
}

/**
 * The one emit primitive. Everything public below is a preset over this.
 *
 * @param p     {x,y,z} origin
 * @param v     {x,y,z} velocity
 * @param color [r,g,b] 0..1
 * @param o     { life, size, endSize, alpha, drag, gravity }
 */
export function emit(p, v, color, o = {}) {
  const i = claim();
  if (i < 0) return false;
  px[i] = p.x; py[i] = p.y; pz[i] = p.z;
  vx[i] = v.x || 0; vy[i] = v.y || 0; vz[i] = v.z || 0;
  span[i] = life[i] = o.life || 0.7;
  s0[i] = o.size || 6;
  s1[i] = o.endSize != null ? o.endSize : s0[i] * 0.25;
  cr[i] = color[0]; cg[i] = color[1]; cb[i] = color[2];
  a0[i] = o.alpha != null ? o.alpha : 1;
  drag[i] = o.drag != null ? o.drag : PARTICLES.drag;
  grav[i] = o.gravity || 0;
  return true;
}

/** Clear everything — a new world, a load, a wipe. */
export function resetParticles() { live = 0; dropped = 0; }

// ── the step ─────────────────────────────────────────────────────────
//
// Deliberately split from the GPU write below. This half is arithmetic over typed arrays and
// runs identically in the headless suite; the other half touches `THREE` and does not. That
// split is the only reason a particle system can be tested at all.

export function stepParticles(dt) {
  if (dt <= 0) return live;
  for (let i = live - 1; i >= 0; i--) {
    life[i] -= dt;
    if (life[i] <= 0) { kill(i); continue; }
    // Exponential drag, integrated exactly.
    //
    // A spark should shed most of its speed in the first instant and then drift — that is
    // what makes an impact read as an impact rather than as a firework. The obvious way to
    // write it is `v *= exp(-k·dt)` followed by `p += v·dt`, and that is wrong in a way a
    // suite catches and an eye does not: it is only accurate as dt → 0. Measured on one
    // particle at 100 u/s with k=3, a single 1-second frame moved it **4.98 units** and sixty
    // 1/60-second frames moved it **30.89** — the same second of game time producing a
    // sixfold difference in where the effect ended up, worst on the slow phone where frames
    // are longest and the budget is tightest.
    //
    // The closed form of ∫v₀·e^(-k·t) dt over the frame is v₀·(1 − e^(-k·dt))/k, which is
    // exact at any frame length. Same cost, one extra divide.
    const k = drag[i];
    const decay = Math.exp(-k * dt);
    const travel = k > 1e-6 ? (1 - decay) / k : dt;
    px[i] += vx[i] * travel; py[i] += vy[i] * travel; pz[i] += vz[i] * travel;
    vx[i] *= decay; vy[i] *= decay; vz[i] *= decay;
    vy[i] -= grav[i] * dt;
  }
  return live;
}

// ── the GPU half ─────────────────────────────────────────────────────

export function initParticles(scene) {
  if (!scene || points) return points;
  const geo = new THREE.BufferGeometry();
  aPos = new THREE.BufferAttribute(new Float32Array(CAP * 3), 3);
  aCol = new THREE.BufferAttribute(new Float32Array(CAP * 3), 3);
  aSize = new THREE.BufferAttribute(new Float32Array(CAP * 2), 2);
  if (aPos.setUsage) {
    aPos.setUsage(THREE.DynamicDrawUsage);
    aCol.setUsage(THREE.DynamicDrawUsage);
    aSize.setUsage(THREE.DynamicDrawUsage);
  }
  geo.setAttribute('position', aPos);
  geo.setAttribute('color', aCol);
  geo.setAttribute('aSize', aSize);
  geo.setDrawRange(0, 0);

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: particleUniforms(),          // world scale — see particle-shader.js
    transparent: true, depthWrite: false, vertexColors: true,
    blending: THREE.AdditiveBlending, fog: false
  });

  points = new THREE.Points(geo, mat);
  // The pool spans the whole system by definition, so a bounding sphere is meaningless and
  // culling it would blink the entire effect layer out whenever the origin left the frustum.
  points.frustumCulled = false;
  points.renderOrder = 3;
  scene.add(points);
  return points;
}

/** Push the pool into the buffers. Called once a frame, after `stepParticles`. */
export function syncParticles() {
  if (!points) return 0;
  const pa = aPos.array, ca = aCol.array, sa = aSize.array;
  for (let i = 0; i < live; i++) {
    pa[i * 3] = px[i]; pa[i * 3 + 1] = py[i]; pa[i * 3 + 2] = pz[i];
    ca[i * 3] = cr[i]; ca[i * 3 + 1] = cg[i]; ca[i * 3 + 2] = cb[i];
    // One normalised age drives both size and alpha, so they cannot drift apart and produce
    // a full-size invisible particle.
    const t = 1 - life[i] / span[i];
    sa[i * 2] = s0[i] + (s1[i] - s0[i]) * t;
    sa[i * 2 + 1] = a0[i] * (1 - t * t);        // quadratic: holds bright, then goes quickly
  }
  aPos.needsUpdate = aCol.needsUpdate = aSize.needsUpdate = true;
  points.geometry.setDrawRange(0, live);
  return live;
}

/** One call for the frame loop. */
export function updateParticles(dt) {
  stepParticles(dt);
  return syncParticles();
}

// ── presets ──────────────────────────────────────────────────────────
//
// Every one of these is "what does this event look like", in one place, so the answer is the
// same wherever the event is raised from — the player's guns, an NPC's, or a company hull's
// working three hundred kilometres away.

const _tmp = { x: 0, y: 0, z: 0 };
const spread = (out, dir, speed, cone) => {
  // A cone around `dir`, cheaply: jitter each axis and renormalise. Not a uniform spherical
  // distribution and it does not need to be — it needs to look like something was struck.
  const jx = (Math.random() - 0.5) * cone, jy = (Math.random() - 0.5) * cone,
        jz = (Math.random() - 0.5) * cone;
  let x = (dir.x || 0) + jx, y = (dir.y || 0) + jy, z = (dir.z || 0) + jz;
  const len = Math.hypot(x, y, z) || 1;
  const s = speed * (0.55 + Math.random() * 0.9);
  out.x = x / len * s; out.y = y / len * s; out.z = z / len * s;
  return out;
};

/**
 * Something was hit.
 *
 * @param type    kinetic | thermal | em — decides the colour, and the colour is the readout.
 * @param amount  damage, which decides how many. Magnitude you can see.
 */
export function impact(pos, dir, type = 'kinetic', amount = 10) {
  const col = PALETTE[type] || PALETTE.kinetic;
  const n = Math.min(PARTICLES.impactMax,
                     PARTICLES.impactMin + Math.round(amount * PARTICLES.impactPerDamage));
  for (let i = 0; i < n; i++) {
    emit(pos, spread(_tmp, dir, PARTICLES.impactSpeed, 1.4), col,
         { life: 0.28 + Math.random() * 0.5, size: 7, endSize: 1.5, alpha: 1, drag: 2.2 });
  }
  // Thermal keeps burning after the flash — a little smoke, which is also what tells the two
  // apart at a glance when the flash itself has gone.
  if (type === 'thermal') {
    for (let i = 0; i < 3; i++) {
      emit(pos, spread(_tmp, dir, 12, 2.2), PALETTE.smoke,
           { life: 1.4, size: 14, endSize: 34, alpha: 0.28, drag: 1.1 });
    }
  }
}

/** A round stopped by the shield rather than the hull — a splash, not a spray. */
export function shieldSplash(pos, dir, amount = 10) {
  const n = Math.min(20, 6 + Math.round(amount * 0.25));
  for (let i = 0; i < n; i++) {
    // Wide cone and slow: it spreads across a surface instead of coming off it, which is the
    // whole visual difference between "absorbed" and "penetrated".
    emit(pos, spread(_tmp, dir, PARTICLES.impactSpeed * 0.45, 3.0), PALETTE.shield,
         { life: 0.3 + Math.random() * 0.35, size: 10, endSize: 3, alpha: 0.85, drag: 4.5 });
  }
}

/**
 * A rock giving up material.
 *
 * `richness` is the seam's yield, 0..1, and it sets the count — so a good rock visibly throws
 * more, and choosing which rock to stay on stops being a panel-reading exercise.
 */
export function debris(pos, dir, commodity = 'ore', richness = 0.5) {
  const col = PALETTE[commodity] || PALETTE.ore;
  const n = PARTICLES.debrisMin +
            Math.round(richness * (PARTICLES.debrisMax - PARTICLES.debrisMin));
  for (let i = 0; i < n; i++) {
    emit(pos, spread(_tmp, dir, PARTICLES.debrisSpeed, 1.9), col,
         { life: 0.5 + Math.random() * 0.8, size: 5, endSize: 2, alpha: 0.95, drag: 1.4 });
  }
}

/** Something died. */
export function bloom(pos, size = 1) {
  const n = Math.round(PARTICLES.bloomCount * Math.min(2.5, size));
  for (let i = 0; i < n; i++) {
    emit(pos, spread(_tmp, { x: 0, y: 0, z: 0 }, PARTICLES.bloomSpeed * size, 4),
         i % 3 === 0 ? PALETTE.thermal : PALETTE.kinetic,
         { life: 0.5 + Math.random() * 1.1, size: 12 * size, endSize: 2, alpha: 1, drag: 1.6 });
  }
  for (let i = 0; i < Math.round(6 * size); i++) {
    emit(pos, spread(_tmp, { x: 0, y: 0, z: 0 }, 26 * size, 4), PALETTE.smoke,
         { life: 1.8 + Math.random(), size: 26 * size, endSize: 70 * size, alpha: 0.3, drag: 0.9 });
  }
}

/**
 * Drive plume.
 *
 * Colour carries drive temperature, which is a number the pilot otherwise has to look away
 * from the canopy to read: cold blue at nominal, shifting toward orange as heat climbs. The
 * count follows throttle, so an idling ship does not emit a full plume.
 */
export function plume(pos, back, throttle = 1, heat = 0) {
  if (throttle <= 0.05) return;
  const n = Math.max(1, Math.round(PARTICLES.plumeRate * throttle));
  const h = Math.min(1, Math.max(0, heat));
  const col = [
    PALETTE.plume[0] + (PALETTE.hot[0] - PALETTE.plume[0]) * h,
    PALETTE.plume[1] + (PALETTE.hot[1] - PALETTE.plume[1]) * h,
    PALETTE.plume[2] + (PALETTE.hot[2] - PALETTE.plume[2]) * h
  ];
  for (let i = 0; i < n; i++) {
    emit(pos, spread(_tmp, back, PARTICLES.plumeSpeed * (0.6 + throttle * 0.6), 0.35), col,
         { life: 0.18 + Math.random() * 0.22, size: 7 + throttle * 5, endSize: 1,
           alpha: 0.55 + throttle * 0.35, drag: 3.4 });
  }
}

/** Warp core spooling, and the moment it lets go. */
export function warpFlash(pos, dir, strength = 1) {
  for (let i = 0; i < Math.round(PARTICLES.warpCount * strength); i++) {
    emit(pos, spread(_tmp, dir, PARTICLES.warpSpeed, 0.8), PALETTE.em,
         { life: 0.25 + Math.random() * 0.45, size: 4, endSize: 22, alpha: 0.9, drag: 0.5 });
  }
}

/** Cargo taken aboard — a short inward glint, coloured by what it was. */
export function scoop(pos, toward, commodity = 'salvage') {
  const col = PALETTE[commodity] || PALETTE.salvage;
  for (let i = 0; i < 8; i++) {
    emit(pos, spread(_tmp, toward, 40, 0.9), col,
         { life: 0.3, size: 6, endSize: 1, alpha: 1, drag: 0.8 });
  }
}
