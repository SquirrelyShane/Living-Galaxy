// Living Galaxy — the galactic chart.
//
// Fifty thousand stars in one draw call, in 3D, with the same shader the particle pool and the
// well shells use. Drag to orbit, pinch or scroll to zoom, tap a star to read its file, jump.
//
// ## Why it is its own scene
//
// It renders into the existing `WebGLRenderer` but builds its own `THREE.Scene` and camera, and
// while it is open `main.js` skips the world render entirely — the same gate the command deck
// has used since v1.02.31. The alternative, putting the galaxy in the world scene and moving
// the flight camera fifty thousand units away, would mean the fog, the light rig, the LOD
// registry and every `frustumCulled` decision in the game were being asked questions about a
// map. Two scenes, one renderer, one gate.
//
// ## The stars are the particle layer
//
// `world/particle-shader.js` already gives per-vertex size and alpha with distance attenuation,
// which is exactly what a star chart wants: near stars large and bright, far ones small and
// faint, one draw call for the lot. Reusing it means the chart cannot drift from the look of
// the rest of the game, and it means `tools/shader-check.html` already covers this screen's
// GLSL.
//
// Three clouds, drawn back to front:
//
//   **dust**   a haze along the arms, dim and large, so the disc reads as a *structure* rather
//              than as scattered dots. This is the single biggest difference between "a point
//              cloud" and "a galaxy".
//   **core**   a dense bulge, warm, additive — the bright middle every spiral has.
//   **stars**  the real nodes, coloured by star class from `data` rather than by taste.
//
// ## What is honest about it
//
// Every star drawn is a real node: tapping it gives the designation, the class and the seed
// that `generateSystem()` will turn into the system you arrive in. There is no decorative
// starfield mixed in with the navigable ones — a chart with unreachable pretty dots on it is a
// chart that lies, and this codebase has spent six patches removing exactly that.

import { S } from '../core/state.js';
import { GALAXY } from '../core/config.js';
import { $, el, clamp } from '../core/utils.js';
import { renderer } from '../world/scene.js';
import { PARTICLE_VERT, PARTICLE_FRAG, particleUniforms } from '../world/particle-shader.js';
import { nodeAt, designation, jumpCost, nodesNear, GALAXY_VERSION } from '../world/galaxy.js';
import { generateSystem, STAR_CLASSES } from '../world/genesis.js';
import { currentNode, jumpBlocker, costTo, jumpTo } from '../systems/flight/jump.js';
import { makeRng } from '../core/rng.js';
import { sfx } from '../systems/platform/audio.js';

let overlay, canvasHost, panel, headEl;
let scene = null, camera = null;
let starPts = null, corePts = null, dustPts = null, markPts = null;
let nodeIndex = [];          // draw order -> node, for picking
let selected = null;
let restore = null;
let open = false;

// Camera as spherical coordinates about a focus. A chart is looked *at*, not flown, and
// orbit-and-zoom is the control scheme every star map converges on for that reason.
let yaw = 0.6, pitch = 0.55, dist = GALAXY.radius * 1.5;
const focus = { x: 0, y: 0, z: 0 };

const TAU = Math.PI * 2;
const rgb = hex => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];

// ── build ────────────────────────────────────────────────────────────

/**
 * The chart's own scale reference.
 *
 * This is the number that was missing, and its absence is why the chart drew black. The
 * shader sizes a point as `aSize.x * (uRef / depth)`, and `uRef` used to be a hardcoded 300
 * — correct for combat sparks a few hundred units away, and catastrophic here, where the
 * camera sits 78,000 units off the focus because the disc is 52,000 light-years across.
 * `chartStarSize: 7` was rendering at 0.027 of a pixel.
 *
 * Set to the chart's nominal viewing distance, so a star at the focus renders at exactly the
 * pixel size the config authored. Zooming in still grows it and zooming out still shrinks it
 * — the attenuation is intact, it is simply anchored to this scene's scale instead of to
 * another scene's.
 */
const CHART_REF = GALAXY.radius * 1.5;

function shaderMat(opts = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: PARTICLE_VERT, fragmentShader: PARTICLE_FRAG,
    uniforms: particleUniforms(CHART_REF),
    transparent: true, depthWrite: false, vertexColors: true,
    blending: THREE.AdditiveBlending, fog: false, ...opts
  });
}

function cloud(count, fill, order) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const siz = new Float32Array(count * 2);
  fill(pos, col, siz);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 2));
  const p = new THREE.Points(geo, shaderMat());
  p.frustumCulled = false;
  p.renderOrder = order;
  scene.add(p);
  return p;
}

/**
 * How many of the fifty thousand to actually draw.
 *
 * All of them is 50,000 vertices in one draw call, which a desktop does not notice and a phone
 * does. The sample is a **stride**, not a random subset: taking every Nth index keeps the arms,
 * the density gradient and the class mix intact, where a random subset of a spiral still looks
 * like a spiral but a *cached* random subset would change shape every time the chart opened.
 */
function drawCount() {
  return Math.min(GALAXY.count, GALAXY.chartStars);
}

function buildGalaxy() {
  const gs = (S.galaxy && S.galaxy.seed) >>> 0;
  const n = drawCount();
  const stride = Math.max(1, Math.floor(GALAXY.count / n));
  nodeIndex = [];

  // stars — every point is a place you can go
  starPts = cloud(n, (pos, col, siz) => {
    for (let k = 0; k < n; k++) {
      const node = nodeAt(gs, (k * stride) % GALAXY.count);
      nodeIndex.push(node);
      pos[k * 3] = node.x; pos[k * 3 + 1] = node.y; pos[k * 3 + 2] = node.z;
      const c = rgb(node.color);
      // Luminosity brightens the colour rather than only the size, so an O-type reads as a
      // hot pinprick and an M-type as a dim ember at the same distance.
      const b = 0.55 + Math.min(1, node.lum / 4) * 0.45;
      col[k * 3] = c[0] * b; col[k * 3 + 1] = c[1] * b; col[k * 3 + 2] = c[2] * b;
      siz[k * 2] = GALAXY.chartStarSize * (0.7 + Math.min(1.6, node.lum * 0.4));
      siz[k * 2 + 1] = 0.95;
    }
  }, 3);

  // core bulge — the bright middle. Seeded, so it is the same bulge every time the chart opens.
  const rc = makeRng((gs ^ 0xc0de) >>> 0);
  const cn = GALAXY.chartCore;
  corePts = cloud(cn, (pos, col, siz) => {
    for (let k = 0; k < cn; k++) {
      // Cubed radius bias piles it into the middle; a flat draw makes a ball, not a bulge.
      const r = Math.pow(rc.next(), 3) * GALAXY.radius * 0.28;
      const t = rc.next() * TAU;
      const ph = Math.acos(2 * rc.next() - 1);
      pos[k * 3] = Math.cos(t) * Math.sin(ph) * r;
      pos[k * 3 + 1] = Math.cos(ph) * r * 0.42;      // flattened — it is a bulge in a disc
      pos[k * 3 + 2] = Math.sin(t) * Math.sin(ph) * r;
      col[k * 3] = 1.0; col[k * 3 + 1] = 0.86; col[k * 3 + 2] = 0.62;
      siz[k * 2] = GALAXY.chartCoreSize;
      siz[k * 2 + 1] = 0.10;
    }
  }, 1);

  // dust — haze on the arms. Placed by sampling real nodes and scattering around them, so the
  // haze follows the actual spiral instead of being a second, disagreeing one.
  const rd = makeRng((gs ^ 0xd057) >>> 0);
  const dn = GALAXY.chartDust;
  dustPts = cloud(dn, (pos, col, siz) => {
    for (let k = 0; k < dn; k++) {
      const node = nodeAt(gs, Math.floor(rd.next() * GALAXY.count));
      const spread = GALAXY.radius * 0.035;
      pos[k * 3] = node.x + (rd.next() - 0.5) * spread;
      pos[k * 3 + 1] = node.y + (rd.next() - 0.5) * spread * 0.35;
      pos[k * 3 + 2] = node.z + (rd.next() - 0.5) * spread;
      // Cool at the rim, warm toward the core — the colour gradient a spiral actually has.
      const t = Math.min(1, node.r / GALAXY.radius);
      col[k * 3] = 0.34 + (1 - t) * 0.34;
      col[k * 3 + 1] = 0.30 + (1 - t) * 0.16;
      col[k * 3 + 2] = 0.52 + t * 0.22;
      siz[k * 2] = GALAXY.chartDustSize;
      siz[k * 2 + 1] = 0.055;
    }
  }, 0);

  // markers — you, and your selection. Two points, rewritten every frame.
  markPts = cloud(2, (pos, col, siz) => {
    for (let k = 0; k < 2; k++) { siz[k * 2] = 26; siz[k * 2 + 1] = 0; }
  }, 4);
}

function refreshMarkers(t) {
  if (!markPts) return;
  const a = markPts.geometry.attributes;
  const here = currentNode();
  // A slow pulse, so "you are here" is findable in a field of fifty thousand without being
  // a different colour from everything else — the chart's colours already mean star class.
  const pulse = 0.55 + Math.sin(t * 3) * 0.35;
  a.position.array[0] = here.x; a.position.array[1] = here.y; a.position.array[2] = here.z;
  a.color.array[0] = 0.45; a.color.array[1] = 1.0; a.color.array[2] = 0.72;
  a.aSize.array[0] = 30; a.aSize.array[1] = pulse;

  if (selected) {
    a.position.array[3] = selected.x; a.position.array[4] = selected.y; a.position.array[5] = selected.z;
    a.color.array[3] = 1.0; a.color.array[4] = 0.72; a.color.array[5] = 0.24;
    a.aSize.array[2] = 34; a.aSize.array[3] = 0.9;
  } else {
    a.aSize.array[3] = 0;
  }
  a.position.needsUpdate = a.color.needsUpdate = a.aSize.needsUpdate = true;
}

// ── picking ──────────────────────────────────────────────────────────
//
// Screen-space nearest, not a raycast. `Raycaster` against a 50,000-point cloud with additive
// blending and no depth write gives you whatever it hits first, which on a chart is usually a
// star behind the one you meant. Projecting and taking the closest within a tap radius is both
// cheaper and the answer a player expects.
function pick(px, py, rect) {
  if (!nodeIndex.length) return null;
  const v = new THREE.Vector3();
  let best = null, bestD = GALAXY.chartTapRadius;
  for (const node of nodeIndex) {
    v.set(node.x, node.y, node.z).project(camera);
    if (v.z > 1) continue;                       // behind the camera
    const sx = (v.x * 0.5 + 0.5) * rect.width;
    const sy = (-v.y * 0.5 + 0.5) * rect.height;
    const d = Math.hypot(sx - px, sy - py);
    if (d < bestD) { bestD = d; best = node; }
  }
  return best;
}

// ── the screen ───────────────────────────────────────────────────────

export function initGalaxyMap() {
  overlay = $('galaxy-overlay');
  if (!overlay) return;
  canvasHost = $('galaxy-view');
  panel = $('galaxy-panel');
  headEl = $('galaxy-head');

  const close = $('galaxy-close');
  if (close) close.addEventListener('click', () => closeGalaxyMap());

  const jump = $('galaxy-jump');
  if (jump) {
    jump.addEventListener('click', () => {
      if (!selected) return;
      const arrived = jumpTo(selected);
      if (arrived) {
        sfx.ui();
        selected = null;
        focus.x = arrived.x; focus.y = arrived.y; focus.z = arrived.z;
        closeGalaxyMap();
      }
    });
  }

  const home = $('galaxy-home');
  if (home) home.addEventListener('click', () => { sfx.ui(); centreOnPlayer(); });

  bindPointer();
}

function centreOnPlayer() {
  const here = currentNode();
  focus.x = here.x; focus.y = here.y; focus.z = here.z;
  dist = GALAXY.jumpRange * 3.2;
}

export const galaxyMapOpen = () => open;

export function openGalaxyMap(opts = {}) {
  if (!overlay) return;
  restore = opts.returnTo || null;

  if (!scene) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(58, 1, 1, GALAXY.radius * 8);
    buildGalaxy();
  }
  // Rebuilt if the galaxy seed changed under us — a different galaxy is a different chart.
  if (starPts && starPts.userData.gs !== ((S.galaxy && S.galaxy.seed) >>> 0)) {
    disposeGalaxy();
    buildGalaxy();
  }
  if (starPts) starPts.userData.gs = (S.galaxy && S.galaxy.seed) >>> 0;

  selected = null;
  centreOnPlayer();
  overlay.classList.remove('hidden');
  // Lift the shared renderer's canvas over the flight HUD. See the note in css/exec.css:
  // the chart is drawn into #game-canvas, and without this it is drawn *underneath*
  // everything the cockpit puts on screen.
  if (typeof document !== 'undefined' && document.body && document.body.classList) {
    document.body.classList.add('galaxy-open');
  }
  open = true;
  renderPanel();
}

function disposeGalaxy() {
  for (const p of [starPts, corePts, dustPts, markPts]) {
    if (!p) continue;
    scene.remove(p);
    p.geometry.dispose();
    p.material.dispose();
  }
  starPts = corePts = dustPts = markPts = null;
}

export function closeGalaxyMap() {
  if (!overlay) return;
  overlay.classList.add('hidden');
  if (typeof document !== 'undefined' && document.body && document.body.classList) {
    document.body.classList.remove('galaxy-open');
  }
  open = false;
  const r = restore; restore = null;
  if (r) r();
}

// ── input ────────────────────────────────────────────────────────────

function bindPointer() {
  const host = canvasHost;
  if (!host) return;
  let dragging = false, lx = 0, ly = 0, moved = 0, pinch = 0;

  const down = (x, y) => { dragging = true; moved = 0; lx = x; ly = y; };
  const move = (x, y) => {
    if (!dragging) return;
    const dx = x - lx, dy = y - ly;
    moved += Math.abs(dx) + Math.abs(dy);
    lx = x; ly = y;
    yaw -= dx * 0.006;
    pitch = clamp(pitch + dy * 0.006, -1.45, 1.45);
  };
  const up = (x, y, rect) => {
    // A tap, not a drag. Six pixels of slop, because a finger never lands perfectly still.
    if (dragging && moved < 8 && rect) select(pick(x - rect.left, y - rect.top, rect));
    dragging = false;
  };

  host.addEventListener('pointerdown', e => down(e.clientX, e.clientY));
  addEventListener('pointermove', e => move(e.clientX, e.clientY));
  addEventListener('pointerup', e => up(e.clientX, e.clientY, host.getBoundingClientRect()));

  host.addEventListener('wheel', e => {
    e.preventDefault();
    zoom(Math.sign(e.deltaY) * 0.14);
  }, { passive: false });

  // Two-finger pinch. Handled here rather than through a gesture library because it is nine
  // lines and the alternative is a dependency for one screen.
  host.addEventListener('touchmove', e => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                         e.touches[0].clientY - e.touches[1].clientY);
    if (pinch) zoom((pinch - d) * 0.004);
    pinch = d;
  }, { passive: false });
  host.addEventListener('touchend', () => { pinch = 0; });
}

function zoom(f) {
  dist = clamp(dist * (1 + f), GALAXY.jumpRange * 0.6, GALAXY.radius * 3);
}

function select(node) {
  selected = node;
  sfx.ui();
  renderPanel();
}

// ── the readout ──────────────────────────────────────────────────────

function renderPanel() {
  if (!panel) return;
  const here = currentNode();

  if (headEl) {
    headEl.innerHTML =
      `<b>${designation(here)}</b> · ${GALAXY.count.toLocaleString()} systems · ` +
      `drive reaches ${GALAXY.jumpRange} ly`;
  }

  if (!selected) {
    panel.innerHTML =
      '<div class="gx-empty">Tap a star.<br>' +
      '<span>Drag to turn the disc · pinch or scroll to zoom</span></div>';
    setJump(null, 'SELECT A STAR');
    return;
  }

  // Generated on selection, not on draw. One system out of fifty thousand costs nothing;
  // fifty thousand systems to draw a chart would be the stall this design exists to avoid.
  const sys = generateSystem(selected.seed);
  const cls = STAR_CLASSES.find(c => c.key === selected.cls) || STAR_CLASSES[0];
  const d = Math.hypot(selected.x - here.x, selected.y - here.y, selected.z - here.z);
  const cost = costTo(selected);
  const why = jumpBlocker(selected);
  const hex = '#' + (selected.color >>> 0).toString(16).padStart(6, '0');

  panel.innerHTML =
    `<div class="gx-name" style="color:${hex}">${designation(selected)}</div>` +
    `<div class="gx-sub">${sys.star.name} · ${cls.name}</div>` +
    `<div class="gx-rows">` +
      row('Distance', `${Math.round(d)} ly`) +
      row('Jump cost', `${cost} charge`, why ? 'bad' : 'good') +
      row('Worlds', String(sys.planets.length)) +
      row('Berths', String(sys.stations.length)) +
      row('Fields', String(sys.belts.length)) +
      row('Arm', String(selected.arm + 1)) +
    `</div>` +
    (why ? `<div class="gx-why">${why}</div>` : '');

  setJump(why, why ? 'CANNOT JUMP' : `JUMP · ${cost}`);
}

const row = (k, v, cls = '') =>
  `<div class="gx-row"><span>${k}</span><b class="${cls}">${v}</b></div>`;

function setJump(why, label) {
  const b = $('galaxy-jump');
  if (!b) return;
  b.textContent = label;
  b.disabled = !!why || !selected;
}

// ── the frame ────────────────────────────────────────────────────────

let t = 0;
export function tickGalaxyMap(dt) {
  if (!open || !scene || !renderer) return;
  t += dt;

  const host = canvasHost;
  const w = host ? host.clientWidth : window.innerWidth;
  const h = host ? host.clientHeight : window.innerHeight;
  if (w < 2 || h < 2) return;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  camera.position.set(
    focus.x + Math.cos(pitch) * Math.sin(yaw) * dist,
    focus.y + Math.sin(pitch) * dist,
    focus.z + Math.cos(pitch) * Math.cos(yaw) * dist
  );
  camera.lookAt(focus.x, focus.y, focus.z);

  refreshMarkers(t);

  // Render into the shared renderer. The world render is skipped while this is up — see the
  // gate in main.js — so there is exactly one scene drawn per frame, never two.
  renderer.setSize(w, h, false);
  renderer.render(scene, camera);
}

/** Everything a test or the console wants to know without opening the screen. */
export function galaxyMapReport() {
  return {
    open,
    built: !!scene,
    drawn: nodeIndex.length,
    total: GALAXY.count,
    selected: selected ? designation(selected) : null,
    here: designation(currentNode()),
    version: GALAXY_VERSION
  };
}
