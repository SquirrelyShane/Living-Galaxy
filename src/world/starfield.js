// Living Galaxy — 360° sky. Two layers:
//   1. a procedural nebula skybox painted to a canvas and mapped inside a huge sphere,
//   2. the point-cloud starfield on top for crisp near stars.
// Both are self-lit (fog:false, MeshBasicMaterial) and tuned dark enough that distant
// planets and their beacons still read against them, but detailed enough to see.

import { scene } from './scene.js';
import { makeRng } from '../core/rng.js';
import { S } from '../core/state.js';

let stars, skybox, sky = makeRng(1);
let dust = null, dustPos = null;

// Near-field dust. The old sky sold distance but not *motion* — everything real was
// thousands of km away, so at 2 km/s the view barely changed. A small cloud of motes
// that stays wrapped around the ship gives parallax at cockpit scale, and brightens
// inside a belt so the fields feel like somewhere rather than a scatter of rocks.
const DUST_COUNT = 420;
const DUST_BOX = 900;

const SKY_RADIUS = 300000;   // just inside the camera far plane, behind every real body

export function createSkybox() {
  sky = makeRng((S.seed ^ 0x5b0b) >>> 0);
  const tex = paintNebula(2048);
  skybox = new THREE.Mesh(
    new THREE.SphereGeometry(SKY_RADIUS, 64, 48),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false,
      depthWrite: false, depthTest: false })
  );
  skybox.renderOrder = -1;     // always drawn first, behind everything
  scene.add(skybox);
  return skybox;
}

// Paint a seamless-ish nebula + starfield to an offscreen canvas. Seeded, so every
// client on the same world seed gets the same sky.
function paintNebula(size) {
  const cv = (typeof document !== 'undefined' && document.createElement)
    ? document.createElement('canvas') : null;
  const g = cv && cv.getContext ? cv.getContext('2d') : null;
  if (!g) {
    // headless / no 2d context: hand back a stub texture so tests don't crash
    return new THREE.Texture();
  }
  cv.width = size; cv.height = size;

  // deep base
  g.fillStyle = '#02030a';
  g.fillRect(0, 0, size, size);

  // soft nebula clouds — a few large radial gradients in cold/warm hues
  const hues = [[40, 90, 200], [120, 60, 180], [200, 70, 120], [60, 40, 150]];
  const clouds = 14;
  for (let i = 0; i < clouds; i++) {
    const x = sky.next() * size, y = sky.next() * size;
    const r = sky.range(size * 0.12, size * 0.42);
    const [cr, cg, cb] = hues[Math.floor(sky.next() * hues.length)];
    const a = sky.range(0.025, 0.075);
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
  }

  // dust mottling so the clouds aren't too smooth
  const img = g.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (sky.next() - 0.5) * 10;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);

  const tex = new THREE.Texture(cv);
  tex.needsUpdate = true;
  return tex;
}

export function createStarfield(count = 9000) {
  const rng = makeRng((S.seed ^ 0x57a7) >>> 0);
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const r = 40000 + rng.next() * 80000;          // between the system and the skybox
    const th = rng.next() * Math.PI * 2;
    const ph = Math.acos(2 * rng.next() - 1);
    pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);

    const t = rng.next();
    if (t < 0.70)      { col[i*3] = 0.90; col[i*3+1] = 0.92; col[i*3+2] = 1.00; }
    else if (t < 0.90) { col[i*3] = 1.00; col[i*3+1] = 0.95; col[i*3+2] = 0.70; }
    else               { col[i*3] = 1.00; col[i*3+1] = 0.55; col[i*3+2] = 0.45; }
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  // sizeAttenuation off keeps every star a fixed small screen dot — with it on,
  // the nearer shells rendered as blobs larger than in-system planets.
  stars = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 1.6, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.9, depthWrite: false, fog: false
  }));
  scene.add(stars);
  return stars;
}

export function createDust() {
  const rng = makeRng((S.seed ^ 0xd057) >>> 0);
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(DUST_COUNT * 3);
  for (let i = 0; i < DUST_COUNT * 3; i++) pos[i] = (rng.next() - 0.5) * DUST_BOX;
  dustPos = new THREE.BufferAttribute(pos, 3);
  geo.setAttribute('position', dustPos);
  dust = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x9fc4dc, size: 1.4, sizeAttenuation: true,
    transparent: true, opacity: 0.0, depthWrite: false, fog: false
  }));
  dust.frustumCulled = false;
  scene.add(dust);
  return dust;
}

/** True when the ship is inside one of the named belt annuli. */
function inBelt(r) {
  // Heliocentric belts only. A ring's `inner`/`width` are radii from its planet, so
  // testing them against a distance from the star would put belt dust in a band that has
  // nothing in it.
  for (const b of (S.world.belts || []))
    if (!b.parentName && r >= b.inner && r <= b.inner + b.width) return true;
  return false;
}

export function updateStarfield(dt) {
  if (stars) stars.rotation.y += 0.0006 * dt;
  if (skybox) skybox.rotation.y += 0.00012 * dt;   // barely perceptible parallax
  if (!dust || !dustPos) return;

  // Wrap every mote that falls out of the box back to the opposite face, so the
  // cloud is effectively infinite for the cost of 420 points.
  const p = S.player.position;
  const a = dustPos.array;
  const half = DUST_BOX / 2;
  for (let i = 0; i < a.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const axis = k === 0 ? p.x : k === 1 ? p.y : p.z;
      let d = a[i + k] - axis;
      if (d > half) a[i + k] -= DUST_BOX;
      else if (d < -half) a[i + k] += DUST_BOX;
    }
  }
  dustPos.needsUpdate = true;

  const belt = inBelt(Math.hypot(p.x, p.z));
  const warping = S.warp.state === 'warping';
  const want = warping ? 0.85 : belt ? 0.5 : 0.13;
  const m = dust.material;
  m.opacity += (want - m.opacity) * Math.min(1, dt * 2.2);
  m.size = warping ? 2.6 : belt ? 1.9 : 1.3;
  if (m.color && m.color.setHex) m.color.setHex(belt ? 0xd8bb84 : 0x9fc4dc);
}
