import "./controls-test.js";
import * as THREE from "../vendor/three.module.min.js";
import {
  BEACONS,
  BODIES,
  beaconPosition,
  bodyById,
  bodyPosition,
  currentSystem,
  dist3,
  scanRadius,
  starBody,
} from "./bodies.js";
import { remnantRadius } from "./scale.js";
import { makeGlowTexture, makePlanetTexture, makeRingTexture } from "./textures.js";
import { rockLook } from "./rockgen.js";
import { BAKE, rockParams, rogueParams } from "./bodygen/body.js";
import { CLASSES } from "./bodygen/classes.js";
import { mountBakedData } from "./bodygen/baked.js";
import { grow, peek, pump, cancel as cancelGrowth, growerStats } from "./bodygen/grower.js";
import { makeRockFx } from "./rockfx.js";
import { makeImpactFx } from "./impactfx.js";
import { makeHoleFx } from "./holefx.js";
import { holes } from "./holes.js";
import { acquireLock, activeWaypoint, currentShipId, pauseTick, publishHud, sensorRange, sim, spoolTime, targetPosition, tickSim, waypointPosition, wireControlsTest } from "./sim.js";
import { addLook, bindInput } from "./input.js";
import { mountAttract } from "./attract.js";
import { resumeAudioIfNeeded, tickAudio } from "./audio.js";
import { batteryCap, forwardOf, rightOf, speedOf, upOf } from "./ship.js";
import { forgeShip, tickHull } from "./shipforge.js";
import { droneFor, droneBudget, releaseDrones, releaseDrone } from "./droneforge.js";
import { probes } from "./probes.js";
import { droneOps } from "./drones/ops.js";
import { npcDrones } from "./drones/npcdrones.js";
import { DEFAULT_SHIP_ID, shipById } from "./shipdb.js";
import { inBelt, nearbyRocks, brokenRocks } from "./field.js";
import { contacts, mining, shots, turretAim } from "./turrets.js";
import { stationLane, lanePoint, laneCentre, spreadAt, beadLit, laneDistance, LANE_BEADS, LANE_DRAW_R, SUBLANES, ZONE_HALF_W, ZONE_HALF_H } from "./npc/lanes.js";
import { ensureBuilt } from "./stationyard.js";
import { tractor } from "./stationworks.js";
import { tick as tickStation } from "./stationgen/anim.js";
import { notePerf, perf } from "./perf.js";
import { contactView, hullTag, scanFocus } from "./contacts.js";
import { makeBloom } from "./postfx.js";
import { makeWarpFx } from "./warpfx.js";
import { flow } from "./npc/flow.js";
import { templateFor, warm as warmPool, instanceOf, releaseInstance, drainPool } from "./hullpool.js";
import { fightCentre } from "./npc/battles.js";
import { traffic, HOSTILE_ROLES, LAW_ROLES } from "./npc/traffic.js";
import { tickWorldSync, wireWorldSyncTest } from "./worldsync.js";
import { chunks } from "./debris.js";
import { dirFbm, dirNoise, kelvinHex } from "./cataclysm.js";
import { tickTutorial, wireTutorialTest } from "./tutorial.js";
import { impactors } from "./impactors.js";
import { stations } from "./stations.js";
import { SECTORS } from "./materials.js";
import { loadAria, wireAria } from "./aria.js";

/* The world is ~10^6 units across and the ship is 2.4 units long, so we never
 * hand absolute coordinates to the GPU. Everything renders relative to the
 * ship (the floating origin) and depth is logarithmic. */

const _f = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _right = new THREE.Vector3();
const _shipUp = new THREE.Vector3();
const _proj = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _basisX = new THREE.Vector3();
const _mouse = new THREE.Vector2();
const _ray = new THREE.Raycaster();
const _mat = new THREE.Matrix4();
const _bp = { x: 0, y: 0, z: 0 };

const NEAR = 0.4;
const FAR = 3.0e7;
const STAR_SHELL = 1.5e7;
const MAX_ROCKS = 420;
const MAX_CHUNKS = 900;
const MAX_IMPACTORS = 8;
const MAX_SHOTS = 220;

function disposeObject(root, keep = new Set()) {
  root.traverse((obj) => {
    const mesh = obj;
    if (mesh.geometry && !mesh.geometry.userData.keep) mesh.geometry.dispose();
    const mat = mesh.material;
    const list = Array.isArray(mat) ? mat : mat ? [mat] : [];
    for (const m of list) {
      if (keep.has(m) || m.userData.keep) continue;
      disposeMat(m);
    }
  });
}

function disposeMat(mat) {
  const m = mat;
  if (m.map && !m.map.userData.keep) m.map.dispose();
  if (m.emissiveMap && !m.emissiveMap.userData.keep) m.emissiveMap.dispose();
  if (m.alphaMap && !m.alphaMap.userData.keep) m.alphaMap.dispose();
  mat.dispose();
  m.__disposed = true; // a queued surface job for this material is skipped, not painted onto a dead mat
}

function hexColor(hex) {
  return new THREE.Color(hex);
}

/* Deck-plan transition: the forged hull goes to cyan wireframe and fades as
 * `t` climbs 0 → 1. Materials are the forge's own (per hull), so touching
 * them touches nothing else. */
let _dematState = -1;
function dematerialize(group, t) {
  if (t === _dematState) return;
  _dematState = t;
  group.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const m = o.material;
    if (!m.userData.solid) m.userData.solid = { transparent: m.transparent, opacity: m.opacity, wireframe: m.wireframe, emissive: m.emissive ? m.emissive.getHex() : null };
    if (t <= 0) {
      const s = m.userData.solid;
      m.transparent = s.transparent; m.opacity = s.opacity; m.wireframe = s.wireframe;
      if (m.emissive && s.emissive != null) m.emissive.setHex(s.emissive);
      m.needsUpdate = true;
      return;
    }
    m.transparent = true;
    m.opacity = Math.max(0.04, 1 - t * 1.1);
    m.wireframe = t > 0.35;
    if (m.emissive) m.emissive.setHex(t > 0.35 ? 0x2a7fb8 : (m.userData.solid.emissive ?? 0x000000));
    m.needsUpdate = true;
  });
}

function makeShipGroup(color, scale = 1, shipId = null, seed = "sol", detail = "full") {
  /* Hulls come from the fleet registry (shipdb.js) and are grown by the
   * forge (shipforge.js) over the ship generator in js/shipgen/ — same def +
   * seed is the same ship on every client. The group's real length is the
   * registry length (1 u = 10 m); `scale` stays a straight multiplier so old
   * call sites keep their footprint. `detail` is "full" for the hull you can
   * walk around in the external view and "lite" for traffic and peers: same
   * silhouette and fittings, no sub-metre clutter, one draw per material. */
  const def = shipById(shipId) ?? shipById(DEFAULT_SHIP_ID);
  const g = forgeShip(def, seed, { primary: color, detail });
  g.scale.multiplyScalar(scale);
  return g;
}

/* Generated hulls take tens of milliseconds to grow. A sky full of traffic
 * is built one hull per frame instead of all at once on arrival. */
let hullBudget = 1;
/* Hulls are drawn only inside sensor range (sim.sensorRange: 300 km, ×1.8 on a
 * pulse). Beyond it a ship is a transponder on the chart and nothing on the
 * canopy — the chart directory and its blips are how you find them. */
const drawRange = () => sensorRange();
/* What a MESH is built and drawn at, as opposed to what is known about. On a
 * device that is keeping up these are the same number. On one that is not,
 * the frame budget (perf.js) pulls the mesh radius in while leaving sensor
 * range, labels, tracks and the contact board exactly where they were: the
 * sky stops being expensive to draw without becoming harder to fly, and a
 * hull that stops being a model is still a name, a light and a target.
 *
 * This matters because the bottleneck on a phone is usually the GPU, and
 * trimming simulation detail to fix a rasteriser does nothing at all. */
const MESH_K = [0.45, 0.6, 0.8, 1];
const meshRange = () => drawRange() * (MESH_K[perf.tier] ?? 1);
/* Belt rocks resolve closer than hulls: they are drawn (and only exist for the
 * collision pass) inside this of the ship, growing in over the outer slice so
 * a cell never pops into the canopy fully formed. */
const ROCK_DRAW_R = 12000;
const ROCK_FADE = 3000;
let frameDt = 1 / 60;
/* Plume length is throttle over the normal band; overdrive pins it wide open. */
const throttleCapOf = () => 1;

/**
 * Builds a right-handed basis whose local -Z looks along the nose — the same
 * convention a three.js camera uses, so the cockpit lens can take this
 * quaternion straight. (X cross Y must equal Z or the matrix is a reflection
 * and setFromRotationMatrix quietly returns garbage.)
 */
function orientCraft(group, yaw, pitch, roll) {
  const f = forwardOf(yaw, pitch);
  _f.set(-f.x, -f.y, -f.z); // local +Z points behind
  _right.crossVectors(_up, _f);
  if (_right.lengthSq() < 1e-8) _right.set(1, 0, 0);
  else _right.normalize();
  _shipUp.crossVectors(_f, _right).normalize();
  const c = Math.cos(roll);
  const sn = Math.sin(roll);
  _basisX.set(
    _right.x * c + _shipUp.x * sn,
    _right.y * c + _shipUp.y * sn,
    _right.z * c + _shipUp.z * sn,
  ).normalize();
  _shipUp.set(
    -_right.x * sn + _shipUp.x * c,
    -_right.y * sn + _shipUp.y * c,
    -_right.z * sn + _shipUp.z * c,
  ).normalize();
  group.quaternion.setFromRotationMatrix(_mat.makeBasis(_basisX, _shipUp, _f));
}

export function mountGame(canvas) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* How much the title screen is allowed to spend. A forged hull costs tens
   * of milliseconds once and a couple of thousand triangles a frame, and the
   * nebula is one 2048x1024 canvas — cheap on a modern phone, not on a five
   * year old one. The player can force it either way; otherwise it is judged
   * on cores and whether the OS has been asked for less motion. */
  const attractQuality = (() => {
    const forced = (() => {
      try { return localStorage.getItem("lgaa.attract"); } catch { return null; }
    })();
    if (forced === "off" || forced === "low" || forced === "full" || forced === "high") return forced;
    if (reduced) return "low";
    const cores = navigator.hardwareConcurrency ?? 4;
    const mem = navigator.deviceMemory ?? 4;
    if (cores <= 3 || mem <= 2) return "low";
    if (cores >= 8 && mem >= 8 && (window.devicePixelRatio ?? 1) <= 3) return "high";
    return "full";
  })();
  sim.reducedMotion = reduced;
  wireControlsTest();
  wireTutorialTest();
  loadAria();
  wireAria();
  wireWorldSyncTest();
  const unbind = bindInput(window);
  canvas.tabIndex = 0;
  canvas.style.outline = "none";

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
    logarithmicDepthBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.setClearColor(0x030407, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, 1, NEAR, FAR);

  /* Origin of the rendered world, in sim coordinates. */
  const origin = { x: 0, y: 0, z: 0 };
  const rel = (x, y, z, obj) => obj.position.set(x - origin.x, y - origin.y, z - origin.z);

  const ambient = new THREE.HemisphereLight(0x9fb2cc, 0x0a0d14, 0.16);
  scene.add(ambient);
  const fill = new THREE.AmbientLight(0x8f9bb0, 0.075);
  scene.add(fill);
  /* One directional light standing in for the star: at these distances a
   * point light's falloff is unusable, but the rays are parallel anyway. */
  const sunLight = new THREE.DirectionalLight(0xffe8cc, 2.7);
  sunLight.position.set(1, 0.4, 0);
  scene.add(sunLight);
  scene.add(sunLight.target);

  /* --- star shell: parented to nothing, always centred on the camera --- */
  const starGeo = new THREE.BufferGeometry();
  const starCount = 5200;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = STAR_SHELL * (0.8 + Math.random() * 0.2);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      color: 0xe8eef6,
      size: STAR_SHELL * 0.0024,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  );
  scene.add(stars);

  /* The warp layers reuse the shell's own star positions, so the streaks smear
   * the sky that is actually there rather than a second one laid over it. */
  const warpFx = makeWarpFx(scene, starPos, STAR_SHELL);
  const bloom = makeBloom(renderer, scene, camera);

  const glowTex = makeGlowTexture();
  glowTex.userData.keep = true;
  const ringTex = makeRingTexture(7);
  ringTex.userData.keep = true;

  const sunGroup = new THREE.Group();
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffc07a });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), sunMat);
  sun.userData.bodyId = "sun";
  const corona = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffc090,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  sunGroup.add(sun, corona);
  scene.add(sunGroup);

  const worldRoot = new THREE.Group();
  scene.add(worldRoot);

  const pickables = [];
  const planets = [];
  const beacons = [];

  /* --- asteroid field ------------------------------------------------------
   *
   * Every rock in the belt is the asteroid generator's (0.3.02). The field used
   * to be three hand-deformed icosahedra from js/rockgen.js wearing a tint, and
   * the generator only ever reached the handful of rocks close aboard — at 7–12
   * cells a face, where its craters and veins fall between the vertices.
   *
   * Now each taxonomic class has two PROTOTYPES grown by the generator at its
   * own survey resolution and baked (js/bodygen/bake.js): a 768-triangle hull
   * whose shading reads the full 32-cell surface — craters, grooves, frost,
   * seams — from an atlas. Hundreds of rocks draw as instances of eighteen
   * prototypes, one draw call each, the ore riding on a per-instance tint. The
   * rocks close aboard still get their OWN grown body (below). Prototypes grow
   * in the worker at launch; a class whose prototype has not landed yet simply
   * does not draw for that second.
   */
  const PROTO_VARIANTS = 2;
  const rockBuckets = [];
  const protoIndex = new Map();
  let engineDisposed = false;
  for (const cls of Object.keys(CLASSES)) {
    for (let v = 0; v < PROTO_VARIANTS; v++) {
      const bucket = { cls, v, key: `proto:${cls}:${v}:${BAKE.proto.H}`, mesh: null, lods: [], counts: [0, 0, 0], mount: null, unitR: 1.65, cap: MAX_ROCKS, n: 0 };
      rockBuckets.push(bucket);
      protoIndex.set(`${cls}:${v}`, bucket);
      grow(bucket.key, { seed: `belt-prototype:${cls}:${v}`, classId: cls, radiusM: 700 + v * 900, H: BAKE.proto.H, L: BAKE.proto.L })
        .then((d) => {
          if (engineDisposed) return;
          const mb = mountBakedData(THREE, d);
          mb.material.userData.keep = true;
          for (const g of mb.geometries) g.userData.keep = true;
          const inst = (geo) => {
            const m = new THREE.InstancedMesh(geo, mb.material, bucket.cap);
            m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(bucket.cap * 3).fill(1), 3);
            m.instanceColor.setUsage(THREE.DynamicDrawUsage);
            m.count = 0;
            m.frustumCulled = false;
            scene.add(m);
            return m;
          };
          bucket.mount = mb;
          bucket.lods = [0, 1, 2].map((i) => inst(mb.geometries[i] ?? mb.geometries[mb.geometries.length - 1]));
          bucket.mesh = bucket.lods[0];
          bucket.unitR = d.meta.meshRadius;
          bucket.shape = d.meta.shape;
        }, () => { /* reset or cancelled — a relaunch files it again */ });
    }
  }
  /* the old single-mesh handle the console and the smokes reach for; `count`
   * is the whole field so "are there rocks on screen" still answers */
  const asteroids = { get count() { return rockBuckets.reduce((s, b) => s + b.lods.reduce((n, m) => n + m.count, 0), 0); }, buckets: rockBuckets };
  /* angular radius (radius / distance) under which a rock drops to the next
   * lattice: on a phone-width canopy about eighty pixels across, then about twenty-five */
  const PROTO_LOD_ANG = [0.1, 0.03];

  /* Dust. Belt haze was cut in the chart patch because a static Points band
   * read as fog; this is the opposite idea — a small parallax cloud that only
   * exists within a few hundred units of the hull, so it reads as speed
   * through the rocks rather than as weather. */
  /* --- grown bodies -------------------------------------------------------
   *
   * The instanced field above draws four hundred rocks for thirty thousand
   * triangles, which is what makes a belt a belt on a phone. It is also a lie
   * up close: every rock in it is one of three hulls wearing a tint.
   *
   * So the handful you are actually near get GROWN — Shane's asteroid
   * generator (vendored at js/asteroidgen/, asked through js/bodygen/body.js)
   * on Living Galaxy's ores: one of seven body kinds, aged craters and basins,
   * vein networks, frost in the cold traps, metal standing proud of the
   * matrix, outcrops where a seam breaks the surface — and, on the rock you
   * are working, seated boulders and a halo of chips (js/rockfx.js). At most
   * one is grown per frame and they are cached by rock key; a rock is
   * deterministic, so a body built once is right forever.
   *
   * 0.3.02: grown in the worker at the generator's own resolution and baked
   * (js/bodygen/grower.js, bake.js); mounted one per frame. The outcrop
   * crystals, the seated rubble and the ice clouds are gone — the seams are in
   * the surface now, and a stationary rock does not wear a debris ring.
   */
  const grown = new Set();
  const near = [];
  const BODY_R = 3400;           // grow a body inside this of the hull
  const BODY_MIN_R = 55;         // …and only for rocks big enough to look at
  /* 0.3.28 — hysteresis on the grown set.
   *
   * A grown body is the rock's OWN geometry; everything else in the belt draws
   * as one of a handful of class prototypes. So a rock crossing the budget
   * boundary does not fade — it changes shape. The set used to be recomputed
   * by rank every frame with a hard cut at the budget, and on a phone the
   * budget is four: drifting through the belt at 220 u/s, nine different rocks
   * fought over those four slots and swapped ten times in two and a half
   * seconds. Sitting still was fine. Moving at all made the belt boil.
   *
   * An incumbent now carries a handicap — it is treated as `KEEP` nearer than
   * it is — so a challenger has to be properly closer to take the slot, not a
   * metre closer for one frame. It also keeps its body out to `FAR` rather
   * than losing it the moment it passes BODY_R, so the swap happens out at the
   * edge of the range where a rock subtends a few pixels, instead of at arm's
   * length where you are looking at it. And a body that has just been mounted
   * is not evicted for `HOLD` seconds, so a burst of arrivals cannot evict
   * each other in turn. */
  const BODY_KEEP = 0.34;        // an incumbent ranks as this much of BODY_R nearer than it is
  const BODY_FAR = 1.45;         // …and keeps its body until this multiple of BODY_R
  const BODY_HOLD = 1.5;         // s a fresh mount is safe from eviction
  const bodies = new Map();      // rock key → { group, unit, mesh, mount, assay, cls, used }
  let bodyBudget = rockQuality();
  const rockFx = makeRockFx({ scene, origin, camera, renderer, budget: bodyBudget });
  const impactFx = makeImpactFx({ scene, origin, camera, renderer });
  const holeFx = makeHoleFx({ scene, origin, camera, renderer, reduced });

  const DUST_N = 420;
  const DUST_BOX = 900;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST_N * 3);
  for (let i = 0; i < DUST_N * 3; i++) dustPos[i] = (Math.random() - 0.5) * DUST_BOX * 2;
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  dustGeo.userData.keep = true;
  /* soft round motes: a bare PointsMaterial draws a square, and close to the hull those read as white tiles */
  const dustMat = new THREE.PointsMaterial({ map: glowTex, color: 0x9d968b, size: 3, sizeAttenuation: true, transparent: true, opacity: 0.38, depthWrite: false });
  dustMat.userData.keep = true;
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  dust.visible = false;
  scene.add(dust);

  const beaconGeo = new THREE.OctahedronGeometry(34, 0);
  beaconGeo.userData.keep = true;
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xc9d2dc,
    emissive: 0xc9d2dc,
    emissiveIntensity: 0.9,
    metalness: 0.4,
    roughness: 0.25,
  });
  beaconMat.userData.keep = true;
  const keepMats = new Set([dustMat, beaconMat, sunMat, corona.material]);

  /* --- ordnance --- */
  const shotGeo = new THREE.BufferGeometry();
  const shotPos = new Float32Array(MAX_SHOTS * 3);
  shotGeo.setAttribute("position", new THREE.BufferAttribute(shotPos, 3));
  const shotMesh = new THREE.Points(
    shotGeo,
    new THREE.PointsMaterial({ color: 0xffd08a, size: 3.4, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false }),
  );
  shotMesh.frustumCulled = false;
  scene.add(shotMesh);

  /* --- mining laser ------------------------------------------------------
   * A segmented cutter beam from the emitter under the lens to the rock,
   * chips flying off the cut, a dust plume drifting away from it — and when
   * the cutter drops out, the beam breaks into its sections and each one
   * shrinks to nothing in turn instead of just blinking off.
   */
  const BEAM_SEGS = 8;
  const beamSegGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  beamSegGeo.rotateX(Math.PI / 2); // axis along +Z so lookAt aims it
  beamSegGeo.userData.keep = true;
  const beamGroup = new THREE.Group();
  beamGroup.visible = false;
  scene.add(beamGroup);
  const beamSegs = [];
  for (let i = 0; i < BEAM_SEGS; i++) {
    const outer = new THREE.Mesh(beamSegGeo, new THREE.MeshBasicMaterial({ color: 0xff7a36, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    /* the core is drawn normally, not additively, so it still reads against a sunlit face */
    const core = new THREE.Mesh(beamSegGeo, new THREE.MeshBasicMaterial({ color: 0xfff6e2, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }));
    core.scale.set(0.34, 0.34, 1.001);
    outer.add(core);
    outer.frustumCulled = false;
    core.frustumCulled = false;
    beamGroup.add(outer);
    beamSegs.push({ outer, core });
  }
  const laser = { on: false, fade: 0, t: 0, from: { x: 0, y: 0, z: 0 }, to: { x: 0, y: 0, z: 0 }, hit: { x: 0, y: 0, z: 0 }, dir: { x: 0, y: 0, z: 1 } };

  /* chips: a pool of points flying off the cut */
  const MAX_CHIPS = 160;
  const chipPos = new Float32Array(MAX_CHIPS * 3);
  const chipVel = new Float32Array(MAX_CHIPS * 3);
  const chipAge = new Float32Array(MAX_CHIPS).fill(-1); // <0 = free
  const chipLife = new Float32Array(MAX_CHIPS);
  const chipGeo = new THREE.BufferGeometry();
  chipGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_CHIPS * 3), 3));
  const chipMesh = new THREE.Points(chipGeo, new THREE.PointsMaterial({ color: 0xe8b07a, size: 2.6, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false }));
  chipMesh.frustumCulled = false;
  chipMesh.visible = false;
  scene.add(chipMesh);
  let chipAcc = 0;

  /* dust: a few soft puffs that swell and thin out */
  const MAX_PUFFS = 14;
  const puffs = [];
  for (let i = 0; i < MAX_PUFFS; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9a918a, transparent: true, opacity: 0, depthWrite: false }));
    sp.visible = false;
    scene.add(sp);
    puffs.push({ sp, age: -1, life: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 });
  }
  let puffAcc = 0;

  /* --- debris --- */
  const chunkGeo = new THREE.IcosahedronGeometry(1, 0);
  chunkGeo.userData.keep = true;
  const chunkMat = new THREE.MeshStandardMaterial({ color: 0x6f6862, roughness: 0.98, metalness: 0.05, flatShading: true });
  chunkMat.userData.keep = true;
  const debrisMesh = new THREE.InstancedMesh(chunkGeo, chunkMat, MAX_CHUNKS);
  debrisMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  /* per-instance colour allocated up front so fresh, still-glowing rubble can
   * be tinted without forcing a shader recompile mid-catastrophe */
  debrisMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_CHUNKS * 3).fill(1), 3);
  debrisMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  debrisMesh.count = 0;
  debrisMesh.frustumCulled = false;
  scene.add(debrisMesh);

  /* --- super asteroids -----------------------------------------------------
   *
   * The rogue rocks were the one thing the rock rebuild missed. They were an
   * 80-face IcosahedronGeometry(1, 1) in flat brown, drawn eight at a time
   * through an InstancedMesh — which is why a named body big enough to end a
   * moon read as a paper bag from 290 km out, while the pebbles in the belt
   * beside it had craters and ore in them.
   *
   * Instancing bought nothing here: there are never more than three alive
   * (impactors.js, MAX_LIVE) and you fly at them one at a time. So each rogue
   * gets its OWN grown body off the same generator the belt uses — a real
   * taxonomic class, craters, a per-vertex mineral assay, metal standing proud
   * of the matrix, outcrops where a seam breaks the surface. Three bodies at
   * detail 4 is 1,500 faces, which is cheaper than the belt's far bucket.
   *
   * They are grown one per frame and cached by id, so the ~30 ms of growth is
   * paid once per rock per session and never in a burst. Until a body exists —
   * and at the quality floor, where none are grown — the rock wears a shared
   * placeholder hull that is at least deformed and textured rather than round.
   */
  const impBodies = new Map();   // impactor id → { group, unit, mesh, mount, assay, cls, r }

  /* A rogue arrives from outside the system, so it is not drawn from a belt
   * band's shortlist — it can be anything, weighted the way the sky's rock
   * population is. Deterministic on the rock's own seed, so the thing you
   * catalogued as a metal body is still a metal body next time you see it. */
  const ROGUE_CLASSES = ["S", "S", "S", "C", "C", "C", "M", "M", "X", "B", "V", "P", "D", "E"];
  const rogueClass = (m) => m.cls ?? ROGUE_CLASSES[Math.min(ROGUE_CLASSES.length - 1, Math.floor((m.seed ?? 0.5) * ROGUE_CLASSES.length))];

  /* No stand-in hull any more: a rogue's body is requested the moment the rock
   * exists (tens of kilometres out) and lands from the worker in well under the
   * time it takes to fly close enough to see it. */

  /* --- stations: STATIONGEN hulls, grown once per port by the yard --- */
  const _seenDrone = new Set();      // reused eviction scratch, see syncContactMeshes
  const _seenProbe = new Set();
  const stationMeshes = new Map();
  const flowMeshes = new Map(); // port heartbeat boats (hull pool instances), see syncFlow
  /* running lights: a strobe per hull on the board, sized so it never drops under a few pixels — a
   * 30 m boat is a sub-pixel speck at 2 km, but its anti-collision light is not */
  const navLights = new Map();  // id → { sprite, phase }
  let navMat = null;
  function navLightFor(id, color) {
    let L = navLights.get(id);
    if (L) return L;
    if (!navMat) navMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 1, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending });
    const sprite = new THREE.Sprite(navMat.clone());
    sprite.material.color.set(color ?? "#cfe6ff");
    sprite.material.userData.keep = false;
    scene.add(sprite);
    let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    L = { sprite, phase: (h % 1000) / 1000 * Math.PI * 2 };
    navLights.set(id, L);
    return L;
  }
  function placeNavLight(L, x, y, z, t, d) {
    const sz = Math.max(3.5, d * 0.011);
    L.sprite.position.set(x - origin.x, y - origin.y, z - origin.z);
    L.sprite.scale.set(sz, sz, 1);
    const s = Math.sin(t * 5.5 + L.phase);
    L.sprite.material.opacity = s > 0.7 ? 1 : 0.28;
  }
  function dropNavLight(id) {
    const L = navLights.get(id);
    if (!L) return;
    scene.remove(L.sprite);
    L.sprite.material.dispose();
    navLights.delete(id);
  }
  /* A port's own lighting: full inside LAMP_FULL_R, out by LAMP_OUT_R. The
   * curve is eased so the last of it goes rather than lingering as a dim
   * smudge, and LAMP_OUT_R sits inside sensor range on purpose — past it a
   * port is a contact and a silhouette, not a light source. */
  const LAMP_FULL_R = 6000;
  const LAMP_OUT_R = 24000;
  const lampLevel = (d) => {
    if (d <= LAMP_FULL_R) return 1;
    if (d >= LAMP_OUT_R) return 0;
    const u = 1 - (d - LAMP_FULL_R) / (LAMP_OUT_R - LAMP_FULL_R);
    return u * u;
  };
  const STATION_ANIM_R = 45000;   // rings spin, lamps blink, drones sortie inside this
  const STATION_DRAW_R = 400000;
  function makeStation(st) {
    const holder = new THREE.Group();
    holder.name = `port:${st.id}`;
    const gen = ensureBuilt(st, sim.skySeed);
    holder.add(gen.root);
    /* what a tap hits: an unseen sphere the size of the hull */
    const proxy = new THREE.Mesh(new THREE.SphereGeometry(Math.max(20, st.radius), 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    proxy.userData.stationId = st.id;
    holder.add(proxy);
    holder.userData = { stationId: st.id, proxy };
    return holder;
  }
  /* the tap sphere is the engine's own: freed with the holder, and off the pick list */
  function dropProxy(holder) {
    const proxy = holder.userData?.proxy;
    if (!proxy) return;
    proxy.geometry.dispose();
    proxy.material.dispose();
    const i = pickables.indexOf(proxy);
    if (i >= 0) pickables.splice(i, 1);
  }

  /* --- traffic lanes: the funnel out of the primary hangar mouth. Two strings of
   * beads per lane along the zone's edges, a runner chasing along each (out on
   * the exit lane, in on the entry lane), a translucent wedge per lane with its
   * three ways ruled inside, gate rings at the mouth and the far end. Built in
   * the hull's own frame and turned with it. */
  const laneRigs = new Map();
  const LANE_COL = { entry: new THREE.Color(0x4fd8b8), exit: new THREE.Color(0xffa040) };
  const LANE_STEPS = 18;
  const LANE_SHOW_R = LANE_DRAW_R;       // the rig is drawn only inside this of the lane itself (5 km), brightening as you close
  const LANE_FULL_R = LANE_DRAW_R * 0.6;
  function makeLanes(st) {
    const g = new THREE.Group();
    const col = new THREE.Color(SECTORS[st.sector]?.colour ?? "#9aa4b2");
    /* the rig lives in the unrotated hull frame; updateLanes yaws it with the port */
    const origin0 = { x: 0, y: 0, z: 0, seed: st.seed, radius: st.radius, port: st.portLocal ?? null, portVersion: 0 };
    const f = stationLane(origin0);
    const lanes = ["exit", "entry"];
    const _pt = { x: 0, y: 0, z: 0 }, _c = { x: 0, y: 0, z: 0 };
    const edge = (which, u, latK, vertK, out) => {
      laneCentre(f, which, u, _c);
      const sp = spreadAt(f, u);
      const halfW = f.port ? Math.max(ZONE_HALF_W * sp.k, f.mouth.halfW * 0.5) : ZONE_HALF_W;
      const halfH = f.port ? Math.max(ZONE_HALF_H * sp.h, f.mouth.halfH) : ZONE_HALF_H;
      out.x = _c.x + f.side.x * halfW * latK + f.up.x * halfH * vertK;
      out.y = _c.y + f.side.y * halfW * latK + f.up.y * halfH * vertK;
      out.z = _c.z + f.side.z * halfW * latK + f.up.z * halfH * vertK;
      return out;
    };
    /* marker beads: two strings per lane, along the zone's outer edges */
    const strings = [];   // { which, lat }
    for (const which of lanes) for (const lat of [-1, 1]) strings.push({ which, lat });
    const n = strings.length * LANE_BEADS;
    const pos = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    strings.forEach((sd, k) => {
      for (let i = 0; i < LANE_BEADS; i++) {
        edge(sd.which, i / (LANE_BEADS - 1), sd.lat, 0, _pt);
        const j = (k * LANE_BEADS + i) * 3;
        pos[j] = _pt.x; pos[j + 1] = _pt.y; pos[j + 2] = _pt.z;
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 48, map: glowTex, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 1,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    pts.frustumCulled = false;
    g.add(pts);
    /* the coloured zones: a translucent wedge per lane, three ways ruled inside */
    for (const which of lanes) {
      const zc = LANE_COL[which];
      const verts = [], idx = [];
      for (let i = 0; i <= LANE_STEPS; i++) {
        const u = i / LANE_STEPS;
        for (const [lk, vk] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { edge(which, u, lk, vk, _pt); verts.push(_pt.x, _pt.y, _pt.z); }
        if (i > 0) { const a = (i - 1) * 4, b = i * 4; for (let e = 0; e < 4; e++) { const e2 = (e + 1) % 4; idx.push(a + e, b + e, b + e2, a + e, b + e2, a + e2); } }
      }
      const wg = new THREE.BufferGeometry();
      wg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts), 3));
      wg.setIndex(idx);
      const wedge = new THREE.Mesh(wg, new THREE.MeshBasicMaterial({ color: zc, transparent: true, opacity: 0.075, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      wedge.frustumCulled = false;
      wedge.userData.baseOpacity = 0.075;
      g.add(wedge);
      const linePos = [];
      for (let k = 0; k < SUBLANES; k++) {
        for (let i = 0; i < LANE_STEPS; i++) {
          lanePoint(origin0, which, i / LANE_STEPS, _pt, k); linePos.push(_pt.x, _pt.y, _pt.z);
          lanePoint(origin0, which, (i + 1) / LANE_STEPS, _pt, k); linePos.push(_pt.x, _pt.y, _pt.z);
        }
      }
      const lg = new THREE.BufferGeometry();
      lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePos), 3));
      const ln = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: zc, transparent: true, opacity: 0.35, depthWrite: false }));
      ln.userData.baseOpacity = 0.35;
      g.add(ln);
    }
    /* gates: a ring at the mouth end and at the far end of each lane, sized to the zone there */
    const yaw = Math.atan2(f.dir.x, f.dir.z);
    for (const which of lanes) for (const u of [0.02, 1]) {
      const sp = spreadAt(f, u);
      const rw = f.port ? Math.max(ZONE_HALF_W * 0.9 * sp.k, f.mouth.halfW * 0.48) : ZONE_HALF_W * 0.9;
      const rh = f.port ? Math.max(ZONE_HALF_H * sp.h, f.mouth.halfH) : ZONE_HALF_H;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rw, Math.max(1.2, rw * 0.05), 6, 28), new THREE.MeshBasicMaterial({ color: LANE_COL[which], transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
      ring.userData.baseOpacity = 0.5;
      laneCentre(f, which, u, _pt);
      ring.position.set(_pt.x, _pt.y, _pt.z);
      ring.rotation.y = yaw;
      ring.scale.y = rh / rw;
      g.add(ring);
    }
    g.userData = { colors, strings, col, dim: { entry: LANE_COL.entry.clone().multiplyScalar(0.5), exit: LANE_COL.exit.clone().multiplyScalar(0.5) }, lit: { entry: LANE_COL.entry.clone().lerp(new THREE.Color(0xffffff), 0.5).multiplyScalar(2.2), exit: LANE_COL.exit.clone().lerp(new THREE.Color(0xffffff), 0.5).multiplyScalar(2.2) } };
    return g;
  }
  function updateLanes(t) {
    /* the lane rigs are a chart overlay now (CMD › Flight › Lane rigs): port control flies the
     * lane for you, so by default nothing is drawn — the geometry still steers the autopilot */
    if (!sim.ui?.lanesDrawn) { for (const [, g] of laneRigs) g.visible = false; return; }
    for (const [id, g] of laneRigs) {
      const st = stations.find((s) => s.id === id);
      if (!st) continue;
      rel(st.x, st.y, st.z, g);
      g.rotation.y = st.yaw ?? 0;
      /* the lanes are an approach aid, not a landmark: nothing past LANE_SHOW_R of the lane itself, fading in from there */
      const d = laneDistance(st, sim.ship.pos);
      g.visible = d < LANE_SHOW_R;
      if (!g.visible) continue;
      const fade = THREE.MathUtils.clamp(1 - (d - LANE_FULL_R) / (LANE_SHOW_R - LANE_FULL_R), 0, 1);
      for (const c of g.children) if (c.userData.baseOpacity != null) c.material.opacity = c.userData.baseOpacity * fade;
      g.children[0].material.opacity = fade;
      const { colors, strings, dim, lit } = g.userData;
      strings.forEach((sd, k) => {
        const D = dim[sd.which], L = lit[sd.which];
        for (let i = 0; i < LANE_BEADS; i++) {
          const w = beadLit(t, sd.which, i);
          const j = (k * LANE_BEADS + i) * 3;
          colors[j] = D.r + (L.r - D.r) * w;
          colors[j + 1] = D.g + (L.g - D.g) * w;
          colors[j + 2] = D.b + (L.b - D.b) * w;
        }
      });
      g.children[0].geometry.attributes.color.needsUpdate = true;
    }
  }

  function updateStations(dt) {
    for (const st of stations) {
      let m = stationMeshes.get(st.id);
      if (!m) {
        m = makeStation(st);
        scene.add(m);
        stationMeshes.set(st.id, m);
        pickables.push(m.userData.proxy);
        const lanes = makeLanes(st);
        scene.add(lanes);
        laneRigs.set(st.id, lanes);
      }
      rel(st.x, st.y, st.z, m);
      m.rotation.y = st.yaw ?? 0;
      const d = dist3(sim.ship.pos, st);
      m.visible = d < STATION_DRAW_R;
      /* The hull is a shape out to STATION_DRAW_R; its LIGHTING is not. A port's
       * gate lamps, roof floods, chase beads and mouth strips read at full
       * strength on the approach and are gone well before sensor range, so a
       * station stops being a smear of white dots visible from the far side of
       * the system and becomes something you have to get close to to read. */
      if (m.visible && st.gen) {
        const k = lampLevel(d);
        if (k > 0 && d < STATION_ANIM_R) tickStation(st.gen.anim, dt, sim.time, k);
        else if (!st.gen.anim.dark) tickStation(st.gen.anim, dt, sim.time, 0);
      }
    }
    for (const [id, m] of stationMeshes) {
      if (!stations.some((s) => s.id === id)) {
        scene.remove(m);
        dropProxy(m);
        stationMeshes.delete(id);
        const l = laneRigs.get(id);
        if (l) { scene.remove(l); disposeObject(l); laneRigs.delete(id); }
      }
    }
    updateLanes(sim.time);
  }

  /* --- hull floodlights --- */
  const floods = new THREE.PointLight(0xdfe8f5, 0, 4200, 1.4);
  scene.add(floods);

  /* --- contacts (drones) --- */
  /* (The shared tetrahedron and cone that used to stand in for a drone whose
   * design had not grown are gone — see syncContactMeshes. Nothing that flies
   * is an abstract shape any more.) */
  const droneMeshes = new Map();
  const probeMeshes = new Map();   // your survey probes in flight (droneforge "probe" design)
  const workMeshes = new Map();    // your work drones (drones/ops.js), one robot per drone
  /* declared up here so clearWorld can empty them: the FX sections below fill them */
  const activeFX = [];             // impact FX, see spawnImpactFX
  const eventRigs = new Map();     // staged cataclysm rigs, see buildEventRig
  const bodyRings = new Map();     // the rings debris settles into, see stepBodyRings

  function clearWorld() {
    /* station ids restart at st1 every sky — never let a stale mesh answer to a new id.
     * The hulls themselves are the yard's: stations.js releases them with the roster. */
    for (const [, m] of stationMeshes) { scene.remove(m); dropProxy(m); }
    stationMeshes.clear();
    /* FX are parented to planet groups that are about to go: nothing may keep pointing at them */
    for (const fx of activeFX) for (const part of fx.parts) { fx.group.remove(part.mesh); if (part.mesh.material) { part.mesh.material.map = null; part.mesh.material.dispose(); } }
    activeFX.length = 0;
    for (const rig of [...eventRigs.values()]) disposeRig(rig);
    /* body ids repeat across skies: a ring built for the last sky's radii must not answer to this one's */
    for (const [, m] of bodyRings) { m.parent?.remove(m); m.geometry.dispose(); m.material.dispose(); }
    bodyRings.clear();
    /* drones are clones of per-port designs (droneforge.js): out of the scene first, then free the designs */
    for (const [, m] of droneMeshes) scene.remove(m);
    droneMeshes.clear();
    for (const [, m] of probeMeshes) scene.remove(m);
    probeMeshes.clear();
    for (const [, w] of workMeshes) { scene.remove(w.mesh); if (w.beam) { scene.remove(w.beam); w.beam.geometry.dispose(); } }
    workMeshes.clear();
    releaseDrones();
    for (const [, l] of laneRigs) { scene.remove(l); disposeObject(l, keepMats); }
    for (const id of [...navLights.keys()]) dropNavLight(id);
    laneRigs.clear();
    disposeObject(worldRoot, keepMats);
    while (worldRoot.children.length) worldRoot.remove(worldRoot.children[0]);
    texQueue.length = 0;
    texTotal = 0;
    planets.length = 0;
    beacons.length = 0;
    pickables.length = 0;
  }

  function applyStar(star) {
    sun.geometry.dispose();
    sun.geometry = new THREE.SphereGeometry(star.radius, 48, 32);
    sun.userData.bodyId = star.id;
    sunMat.map?.dispose();
    sunMat.map = makePlanetTexture("star", star.color, star.name.length * 13 + star.radius, 160);
    sunMat.color.copy(hexColor(star.color));
    sunMat.needsUpdate = true;
    corona.material.color.copy(hexColor(star.color));
    const glow = star.radius * 4.2;
    corona.scale.set(glow, glow, 1);
    sunLight.color.copy(hexColor(star.color)).lerp(new THREE.Color(0xffe6c0), 0.4);
  }

  /* Surfaces are expensive to paint, so the world comes up flat-shaded and
   * each body gets its real skin over the following frames. */
  const texQueue = [];
  let texTotal = 0;

  /* Deterministic per-vertex jitter, hashed off the QUANTIZED surface normal so
   * the sphere's UV seam (duplicated vertices at the same position) jags the
   * same way on both sides and never cracks open. */
  function surfJag(seed, nx, ny, nz) {
    /* kept as the low-frequency roughness term, but SMOOTH now: the old
     * version hashed every vertex independently, so neighbouring vertices got
     * uncorrelated displacement and every damaged world grew a coat of
     * spikes. dirNoise interpolates a lattice over the direction vector, so
     * neighbours move together — rough, not hairy — and it is still a pure
     * function of the unit normal, so duplicated UV-seam vertices agree. */
    /* freq 4 puts ~3-4 vertices inside every noise cell at the damaged-world
     * mesh density (96 segments), which is the difference between a rough
     * rim and a pincushion */
    return dirNoise(seed, nx, ny, nz, 4);
  }

  /* Real crater geometry: every recorded strike digs a bowl with a rough floor
   * and a thrown-up rim, and scorches the ground it dug — so a hit world stops
   * being a perfect sphere and big hits read as missing pieces on the limb. */
  function deformCratered(geo, b, drawR) {
    const craters = b.craters ?? [];
    if (!craters.length) return false;
    const pos = geo.attributes.position;
    const shade = new Float32Array(pos.count * 3).fill(1);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const len = Math.hypot(x, y, z) || 1;
      const nx = x / len, ny = y / len, nz = z / len;
      let disp = 0;
      let scorch = 0;
      for (const c of craters) {
        const dot = Math.max(-1, Math.min(1, nx * c.nx + ny * c.ny + nz * c.nz));
        const ang = Math.acos(dot);
        const angR = Math.max(0.07, (c.r ?? drawR * 0.1) / drawR);
        const u = ang / angR;
        if (u >= 1.4) continue;
        const depth = c.depth ?? 0.12;
        /* how sharp this basin still is — a slumped one is smooth */
        const rough = c.rough ?? 1;
        const j = surfJag(c.seed ?? 7, nx, ny, nz) * rough;
        if (u < 1) {
          /* the bowl: parabolic floor, roughened, deepest at the middle */
          disp -= (1 - u * u) * depth * (1 + j * 0.3);
          scorch += (1 - u * 0.8) * Math.min(1, depth * 5);
        } else {
          /* the thrown-up rim just past the lip, fading out. Smooth noise
           * only — this term used to be per-vertex white noise, which is what
           * turned a hard-hit world into a pincushion. */
          const w = 1 - (u - 1) / 0.4;
          const lip = Math.sin(w * Math.PI * 0.5);
          disp += depth * 0.22 * lip * (0.7 + j * 0.6);
          scorch += w * 0.25 * Math.min(1, depth * 5);
        }
      }
      if (disp !== 0) {
        /* overlapping basins used to stack without limit and chew a world
         * down to 0.4 R in places. A body can lose a bite, not evaporate. */
        disp = Math.max(-0.42, Math.min(0.16, disp));
        const rr = drawR * (1 + disp);
        pos.setXYZ(i, nx * rr, ny * rr, nz * rr);
      }
      if (scorch > 0) {
        const s = Math.max(0.16, 1 - scorch * 0.9);
        shade[i * 3] = s;
        shade[i * 3 + 1] = s * 0.94;
        shade[i * 3 + 2] = s * 0.88;
      }
    }
    pos.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(shade, 3));
    geo.computeVertexNormals();
    return true;
  }

  /* A shattered remnant is a shard, not a ball: three octaves of seam-safe
   * noise tear the core into an irregular lump. */
  function deformShatteredCore(geo, b, drawR) {
    const pos = geo.attributes.position;
    const seed = (b.id.length * 2749 + Math.round(b.baseRadius ?? b.radius)) >>> 0;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const len = Math.hypot(x, y, z) || 1;
      const nx = x / len, ny = y / len, nz = z / len;
      const d =
        0.82 +
        dirFbm(seed, nx, ny, nz, 2.2) * 0.5 +
        dirNoise(seed + 7, nx, ny, nz, 4.6) * 0.16;
      const rr = drawR * Math.max(0.45, d);
      pos.setXYZ(i, nx * rr, ny * rr, nz * rr);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  function buildPlanet(b, keepMap = null) {
    const group = new THREE.Group();
    const cratered = !b.shattered && (b.craters?.length ?? 0) > 0 && b.kind !== "gas";
    const mat = new THREE.MeshStandardMaterial({
      roughness: b.kind === "gas" || b.kind === "ice" ? 0.55 : 0.88,
      metalness: 0.03,
      emissive: hexColor(b.color),
      emissiveIntensity: 0.07,
      color: hexColor(b.arch?.palette?.[2] ?? b.color),
    });
    /* a rebuild hands the painted skin across: craters are vertex colour, the surface is the same */
    if (keepMap) {
      mat.map = keepMap;
    } else {
      texQueue.push({ b, mat });
      texTotal = Math.max(texTotal, texQueue.length);
      sim.texLoad = { done: texTotal - texQueue.length, total: texTotal };
    }
    /* a damaged world earns a denser mesh so the bowls resolve */
    const seg = cratered || b.shattered ? 96 : b.radius > 1600 ? 64 : 44;
    /* A shattered world is a core in a cloud, not a sphere. */
    const drawR = remnantRadius(b);
    if (b.scarred) {
      mat.color.multiplyScalar(Math.max(0.45, 1 - b.scarred * 0.35));
      mat.roughness = Math.min(1, mat.roughness + b.scarred * 0.2);
    }
    if (keepMap) mat.color.setRGB(1, 1, 1); // the painted skin carries its own colour, as the surface job leaves it
    const geo = new THREE.SphereGeometry(drawR, seg, Math.round(seg * 0.7));
    if (b.shattered) {
      deformShatteredCore(geo, b, drawR);
      mat.flatShading = true;
    } else if (cratered && deformCratered(geo, b, drawR)) {
      mat.vertexColors = true;
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.bodyId = b.id;
    group.add(mesh);
    pickables.push(mesh);

    /* gas giants take no crater — the strike leaves a dark storm bruise instead */
    if (b.kind === "gas") {
      for (const c of b.craters ?? []) {
        const disc = new THREE.Mesh(
          new THREE.CircleGeometry(Math.min(c.r, drawR * 0.8), 24),
          new THREE.MeshBasicMaterial({ color: 0x140f0c, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
        );
        disc.position.set(c.nx * drawR * 1.002, c.ny * drawR * 1.002, c.nz * drawR * 1.002);
        disc.lookAt(c.nx * drawR * 3, c.ny * drawR * 3, c.nz * drawR * 3);
        group.add(disc);
      }
    }
    if (b.atmo) {
      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(b.radius * 1.045, 32, 24),
        new THREE.MeshBasicMaterial({
          color: b.atmo,
          transparent: true,
          opacity: 0.16,
          side: THREE.BackSide,
          depthWrite: false,
        }),
      );
      group.add(atmo);
    }
    if (b.rings) {
      const rings = new THREE.Mesh(
        new THREE.RingGeometry(b.radius * 1.35, b.radius * 2.35, 96),
        new THREE.MeshBasicMaterial({
          map: ringTex,
          color: 0xddd4c4,
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false,
        }),
      );
      rings.rotation.x = Math.PI / 2.15;
      group.add(rings);
    }
    worldRoot.add(group);
    planets.push({ id: b.id, group, spin: b.spin, radius: b.radius, mat, baseEmissive: mat.emissive.getHex(), baseIntensity: mat.emissiveIntensity ?? 0.07, hot: false });
  }

  function buildOrbits() {
    for (const b of BODIES) {
      if (b.orbit === 0 || b.parent) continue;
      const pts = [];
      for (let i = 0; i <= 160; i++) {
        const a = (i / 160) * Math.PI * 2;
        const r = b.orbit * (1 + b.eccentricity * Math.cos(a));
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * b.inclination, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({ color: 0x8a8f9a, transparent: true, opacity: 0.11 }),
      );
      line.userData.orbit = true;
      worldRoot.add(line);
    }
  }

  function buildBeacons() {
    for (const b of BEACONS) {
      const mesh = new THREE.Mesh(beaconGeo, beaconMat);
      mesh.userData.beaconId = b.id;
      worldRoot.add(mesh);
      /* carry the definition on the record: BEACONS.find() per beacon per
       * frame is loop-invariant work in the render loop */
      beacons.push({ id: b.id, mesh, def: b });
    }
  }

  /** Rebuilds one world in place after it has been hit. */
  function rebuildBody(id) {
    const idx = planets.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const old = planets[idx];
    worldRoot.remove(old.group);
    /* FX riding the old group step off it before it is disposed and onto the new one after */
    for (const fx of activeFX) if (fx.group === old.group) for (const part of fx.parts) old.group.remove(part.mesh);
    for (const rig of eventRigs.values()) if (rig.host === old.group) old.group.remove(rig.group);
    const ring = bodyRings.get(id);
    if (ring && ring.parent === old.group) old.group.remove(ring); // stepBodyRings re-parents it
    /* the painted skin survives the rebuild: only the mesh changes */
    const keepMap = old.mat.map;
    old.mat.map = null;
    disposeObject(old.group, keepMats);
    for (let i = pickables.length - 1; i >= 0; i--) {
      if (pickables[i].userData.bodyId === id) pickables.splice(i, 1);
    }
    planets.splice(idx, 1);
    for (let i = texQueue.length - 1; i >= 0; i--) {
      if (texQueue[i].b.id === id) texQueue.splice(i, 1);
    }
    const b = BODIES.find((x) => x.id === id);
    if (b) buildPlanet(b, keepMap);
    const next = planets.find((p) => p.id === id);
    const host = next ? next.group : worldRoot;
    for (const fx of activeFX) if (fx.group === old.group) { for (const part of fx.parts) host.add(part.mesh); fx.group = host; }
    for (const rig of eventRigs.values()) if (rig.host === old.group) { host.add(rig.group); rig.host = host; }
  }

  function rebuildWorld() {
    clearWorld();
    const star = starBody();
    if (star) {
      applyStar(star);
      pickables.push(sun);
    }
    for (const b of BODIES) {
      if (b.kind === "star") continue;
      buildPlanet(b);
    }
    buildOrbits();
    buildBeacons();
    buildBeltHaze();
    drainPool();
    for (const [, obj] of flowMeshes) { scene.remove(obj.group); releaseInstance(obj.group); }
    flowMeshes.clear();
  }

  /* --- belt haze: the belts as a band you can see from anywhere ---------
   * A cloud of faint points in each belt annulus, seeded per sky. Rocks
   * proper are diced out of field.js when you are inside; this is the
   * far view, so the belt reads as a place before you reach it. */
  let beltHaze = null;
  /* Off by default: the belt is no longer a band you can see from anywhere.
   * Rocks resolve inside ROCK_DRAW_R and the chart carries the annulus. Set
   * sim.showBeltHaze = true before a sky loads to get the far view back. */
  function buildBeltHaze() {
    if (beltHaze) { scene.remove(beltHaze); beltHaze.geometry.dispose(); beltHaze.material.dispose(); beltHaze = null; }
    if (!sim.showBeltHaze) return;
    const belts = [currentSystem.belt, currentSystem.outerBelt].filter(Boolean);
    if (!belts.length) return;
    const per = 4200;
    const pos = new Float32Array(belts.length * per * 3);
    let k = 0;
    let seed = 0x9e3779b9;
    const rnd = () => { seed = (Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d) + 0x1b873593) >>> 0; return seed / 4294967296; };
    for (const b of belts) {
      for (let i = 0; i < per; i++) {
        const a = rnd() * Math.PI * 2;
        const r = b.inner + (b.outer - b.inner) * Math.sqrt(rnd());
        pos[k++] = Math.cos(a) * r;
        pos[k++] = (rnd() - 0.5) * 2 * 3200 * (0.4 + 0.6 * rnd());
        pos[k++] = Math.sin(a) * r;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    beltHaze = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x8c8477, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.42, depthWrite: false }));
    beltHaze.frustumCulled = false;
    scene.add(beltHaze);
  }
  rebuildWorld();
  sim.onSystemChange = rebuildWorld;

  /* Own hull — only drawn in the external camera mode. Forged from the
   * pilot's issued hull, seeded by callsign, and re-forged on promotion. */
  let shipId = currentShipId();
  let ship = makeShipGroup("#d7dee8", 0.5, shipId, sim.callsign || "sol");
  scene.add(ship);
  function refreshOwnHull() {
    const id = currentShipId();
    if (id === shipId) return;
    shipId = id;
    const next = makeShipGroup("#d7dee8", 0.5, shipId, sim.callsign || "sol");
    next.position.copy(ship.position);
    next.quaternion.copy(ship.quaternion);
    scene.remove(ship);
    disposeObject(ship);
    ship = next;
    scene.add(ship);
    _dematState = -1;
  }
  const remotes = new Map();
  const npcMeshes = new Map();

  const pulseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.94, 1, 64),
    new THREE.MeshBasicMaterial({ color: 0xc9d2dc, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  );
  scene.add(pulseRing);

  /* ---- impact destruction FX --------------------------------------------
   * The sim queues strikes (sim.impactFX); this drains them into animated
   * meshes parented to the planet's own group, so the waves ride the spin:
   * a flash at the site, shock rings walking outward across the surface, a
   * blast dome for the cataclysms, and a glowing scar that cools into the
   * dark crater the rebuild draws. Shared unit geometry, per-FX materials.
   */
  const fxRingGeo = new THREE.RingGeometry(0.88, 1, 64);
  fxRingGeo.userData.keep = true;
  const fxDiscGeo = new THREE.CircleGeometry(1, 40);
  fxDiscGeo.userData.keep = true;
  const fxDomeGeo = new THREE.SphereGeometry(1, 24, 16);
  fxDomeGeo.userData.keep = true;
  function fxMat(color, opacity) {
    return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  }

  function placeOnSurface(mesh, b, n, lift) {
    mesh.position.set(n.x * b.radius * lift, n.y * b.radius * lift, n.z * b.radius * lift);
    mesh.lookAt(n.x * b.radius * 3, n.y * b.radius * 3, n.z * b.radius * 3);
  }

  function spawnImpactFX(ev) {
    const p = planets.find((x) => x.id === ev.bodyId);
    const b = bodyById(ev.bodyId);
    if (!p || !b || activeFX.length > 9) return;
    const parts = [];
    const add = (mesh, anim) => { p.group.add(mesh); parts.push({ mesh, anim }); };

    /* the flash — every strike gets one */
    const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff1d6, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }));
    flash.position.set(ev.n.x * b.radius * 1.03, ev.n.y * b.radius * 1.03, ev.n.z * b.radius * 1.03);
    add(flash, (t) => {
      const u = t / 2.2;
      const s = b.radius * (0.25 + ev.sev * 1.6) * (0.4 + Math.min(1, u * 3));
      flash.scale.set(s, s, 1);
      flash.material.opacity = Math.max(0, 1 - u) * 0.95;
      return u < 1;
    });

    if (ev.tier !== "minor") {
      /* shock rings walking the surface, staggered */
      const rings = ev.tier === "cataclysm" ? 3 : 2;
      for (let i = 0; i < rings; i++) {
        const ring = new THREE.Mesh(fxRingGeo, fxMat(i === 0 ? 0xffd9a8 : 0xff8a4a, 0.85));
        placeOnSurface(ring, b, ev.n, 1.012 + i * 0.004);
        const delay = i * 0.9;
        const dur = 5 + ev.sev * 18;
        const max = b.radius * (0.9 + ev.sev * 2.2);
        add(ring, (t) => {
          const u = (t - delay) / dur;
          if (u < 0) { ring.visible = false; return true; }
          ring.visible = true;
          const s = Math.max(1, max * easeOut(u));
          ring.scale.set(s, s, 1);
          ring.material.opacity = Math.max(0, 0.85 * (1 - u));
          return u < 1;
        });
      }
      /* the glowing scar that cools into the crater */
      const scar = new THREE.Mesh(fxDiscGeo, fxMat(0xff6a2a, 0.85));
      placeOnSurface(scar, b, ev.n, 1.006);
      const scarR = Math.min(b.radius * 0.6, ev.r * 2.8);
      scar.scale.set(scarR, scarR, 1);
      const scarDur = 30 + ev.sev * 80;
      add(scar, (t) => {
        scar.material.opacity = Math.max(0, 0.85 * (1 - t / scarDur));
        return t < scarDur;
      });
    }

    /* a cataclysm now gets the full staged rig (stepEventFX) instead of the
     * one-shot dome — this branch only still fires for the legacy path */
    if (ev.tier === "cataclysm" && !ev.outcome) {
      /* the blast dome */
      const dome = new THREE.Mesh(fxDomeGeo, fxMat(0xffb36a, 0.4));
      dome.material.side = THREE.BackSide;
      dome.position.set(ev.n.x * b.radius, ev.n.y * b.radius, ev.n.z * b.radius);
      const domeDur = 7 + ev.sev * 6;
      add(dome, (t) => {
        const u = t / domeDur;
        const s = b.radius * (0.15 + easeOut(u) * (1.6 + ev.sev));
        dome.scale.set(s, s, s);
        dome.material.opacity = Math.max(0, 0.4 * (1 - u));
        return u < 1;
      });
      /* the world flinches: emissive spike rides on top of the thermal glow */
      const mat = p.mat;
      add(new THREE.Group(), (t) => {
        const u = t / 4;
        if (u < 1) mat.emissiveIntensity = Math.max(mat.emissiveIntensity, (p.baseIntensity ?? 0.07) + (1 - u) * 1.1);
        return u < 1;
      });
    }
    activeFX.push({ parts, t: 0, group: p.group });
  }

  function easeOut(u) {
    return 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 2.4);
  }

  function stepImpactFX(dtSim) {
    while (sim.impactFX.length) spawnImpactFX(sim.impactFX.shift());
    for (let i = activeFX.length - 1; i >= 0; i--) {
      const fx = activeFX[i];
      fx.t += dtSim;
      let alive = false;
      for (const part of fx.parts) if (part.anim(fx.t)) alive = true;
      if (!alive) {
        for (const part of fx.parts) {
          fx.group.remove(part.mesh);
          if (part.mesh.material) { part.mesh.material.map = null; part.mesh.material.dispose(); }
        }
        activeFX.splice(i, 1);
      }
    }
  }

  /* ---- staged cataclysms & the lit sky ------------------------------------
   * sim.events carries the live curve (see js/cataclysm.js); this turns each
   * one into geometry that lives for the whole event rather than a one-shot
   * puff: an incandescent core, a vapour plume that balloons and cools, a
   * fresnel-rimmed blast shell, an ejecta curtain, supernova shock pulses,
   * and the ring the debris settles into.
   *
   * It also lights the rest of the sky from the event. Three recycled point
   * lights follow the brightest events, so a world dying BEHIND you rim-lights
   * your hull from behind and the exposure lifts — you see it happen without
   * seeing it. That is what a real transient does to a real eye.
   */

  const SHELL_VERT = `
    varying vec3 vN; varying vec3 vV;
    void main() {
      vN = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`;
  const SHELL_FRAG = `
    uniform vec3 uColor; uniform float uOpacity; uniform float uPower;
    varying vec3 vN; varying vec3 vV;
    void main() {
      float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower);
      gl_FragColor = vec4(uColor * (0.35 + f * 1.9), uOpacity * (0.14 + f));
    }`;

  function shellMat(hex, opacity, power) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(hex) },
        uOpacity: { value: opacity },
        uPower: { value: power },
      },
      vertexShader: SHELL_VERT,
      fragmentShader: SHELL_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }

  const evRingGeo = new THREE.RingGeometry(0.86, 1, 96);
  evRingGeo.userData.keep = true;
  const evShellGeo = new THREE.SphereGeometry(1, 40, 26);
  evShellGeo.userData.keep = true;

  function buildEventRig(ev) {
    const p = planets.find((x) => x.id === ev.bodyId);
    const group = new THREE.Group();
    (p ? p.group : worldRoot).add(group);
    const rig = { id: ev.id, group, host: p ? p.group : worldRoot, parts: {} };

    /* the incandescent core — the hottest, brightest thing in the event */
    const core = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffffff, transparent: true, opacity: 1,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    group.add(core);
    rig.parts.core = core;

    /* the vapour plume: opaque and incandescent, then optically thin */
    const plume = new THREE.Mesh(evShellGeo, shellMat(0xfff0d8, 0.55, 1.6));
    group.add(plume);
    rig.parts.plume = plume;

    /* the blast shell — a rimmed bubble racing away from the site */
    const shell = new THREE.Mesh(evShellGeo, shellMat(0xffc07a, 0.9, 3.2));
    group.add(shell);
    rig.parts.shell = shell;

    if (ev.kind === "supernova") {
      rig.parts.pulses = [];
      for (let i = 0; i < 3; i++) {
        const r = new THREE.Mesh(evRingGeo, shellMat(0xcad8ff, 0.9, 1.2));
        r.material.side = THREE.DoubleSide;
        group.add(r);
        rig.parts.pulses.push(r);
      }
    }
    eventRigs.set(ev.id, rig);
    return rig;
  }

  function disposeRig(rig) {
    rig.host.remove(rig.group);
    disposeObject(rig.group, keepMats);
    eventRigs.delete(rig.id);
  }

  const _liveRigs = new Set();
  const _deadRigs = [];
  function stepEventFX() {
    const live = _liveRigs;
    live.clear();
    for (const ev of sim.events ?? []) {
      live.add(ev.id);
      const b = bodyById(ev.bodyId);
      if (!b) continue;
      let rig = eventRigs.get(ev.id);
      if (!rig) rig = buildEventRig(ev);
      const hex = kelvinHex(ev.kelvin ?? 3000);
      const R = b.radius;
      const n = ev.n ?? { x: 0, y: 1, z: 0 };
      const sn = ev.kind === "supernova";
      const site = sn ? { x: 0, y: 0, z: 0 } : { x: n.x * R * 1.02, y: n.y * R * 1.02, z: n.z * R * 1.02 };

      const core = rig.parts.core;
      core.position.set(site.x, site.y, site.z);
      core.material.color.setHex(hex);
      const coreS = R * (sn ? 3 + ev.shell * 5 : 0.45 + ev.sev * 1.4) * (0.35 + ev.lum);
      core.scale.set(coreS, coreS, 1);
      core.material.opacity = Math.min(1, ev.lum * 1.5);

      /* the plume balloons out and thins — never a hard-edged ball */
      const plume = rig.parts.plume;
      const pS = R * (sn ? 1.4 + ev.shell * 2.2 : 0.4 + ev.shell * (1.6 + ev.sev * 2.4));
      plume.scale.setScalar(Math.max(0.001, pS));
      plume.position.set(site.x * 0.5, site.y * 0.5, site.z * 0.5);
      plume.material.uniforms.uColor.value.setHex(hex);
      plume.material.uniforms.uOpacity.value = Math.max(0, ev.lum * 0.75 * (1 - ev.shell * 0.55));
      plume.visible = plume.material.uniforms.uOpacity.value > 0.004;

      const shell = rig.parts.shell;
      const sS = R * (sn ? 2 + ev.shell * 9 : 0.5 + ev.shell * (2.6 + ev.sev * 3.4));
      shell.scale.setScalar(Math.max(0.001, sS));
      shell.position.set(site.x * 0.35, site.y * 0.35, site.z * 0.35);
      shell.material.uniforms.uColor.value.setHex(hex);
      shell.material.uniforms.uOpacity.value = Math.max(0, (1 - ev.shell) * Math.min(1, ev.lum + 0.25) * 0.9);
      shell.visible = shell.material.uniforms.uOpacity.value > 0.004;

      if (rig.parts.pulses) {
        /* shock pulses walking out of the photosphere, staggered a third of a
         * cycle apart so there is always one on its way out */
        rig.parts.pulses.forEach((ring, i) => {
          const u = ((ev.pulse ?? 0) + i / 3) % 1;
          const rr = R * (2 + u * 26);
          ring.scale.set(rr, rr, 1);
          ring.lookAt(camera.position.clone().sub(rig.group.getWorldPosition(_bpv)));
          ring.material.uniforms.uColor.value.setHex(hex);
          ring.material.uniforms.uOpacity.value = Math.max(0, (1 - u) * 0.7 * ev.lum);
        });
      }
    }
    for (const rig of eventRigs.values()) if (!live.has(rig.id)) _deadRigs.push(rig);
    while (_deadRigs.length) disposeRig(_deadRigs.pop());
  }

  /* ---- rings the debris settles into ------------------------------------ */
  function stepBodyRings() {
    for (const b of BODIES) {
      if (!b.ring) continue;
      let m = bodyRings.get(b.id);
      /* the star is not in planets: its supernova remnant ring rides the sun group */
      const p = b.kind === "star" ? { group: sunGroup } : planets.find((x) => x.id === b.id);
      if (!p) continue;
      if (!m) {
        m = new THREE.Mesh(
          new THREE.RingGeometry(b.ring.inner, b.ring.outer, 128),
          new THREE.MeshBasicMaterial({
            map: ringTex, color: 0xb9ada0, side: THREE.DoubleSide,
            transparent: true, opacity: 0, depthWrite: false,
          }),
        );
        m.rotation.x = Math.PI / 2;
        p.group.add(m);
        bodyRings.set(b.id, m);
      }
      if (m.parent !== p.group) { m.parent?.remove(m); p.group.add(m); }
      /* invisible while it is still a chaotic torus, resolving into a sheet
       * only as the out-of-plane motion damps out */
      const st = b.ring.settle ?? 0;
      m.material.opacity = Math.max(0, (st - 0.25) / 0.75) * 0.5;
      m.visible = m.material.opacity > 0.01;
    }
  }

  /* ---- the sky lights up ------------------------------------------------- */
  const eventLights = [];
  for (let i = 0; i < 3; i++) {
    const l = new THREE.PointLight(0xffffff, 0, 0, 1.6);
    l.visible = false;
    scene.add(l);
    eventLights.push(l);
  }
  const _bpv = new THREE.Vector3();
  const baseExposure = 1.06;
  const baseAmbient = ambient.intensity;

  const _glareV = new THREE.Vector3();
  const _ambTint = new THREE.Color();
  const _glows = [];
  function stepSkyLight() {
    const glows = _glows;
    glows.length = 0;
    for (const g of sim.skyGlow ?? []) glows.push(g);
    if (glows.length > 1) glows.sort((a, b) => b.lum - a.lum);
    for (let i = 0; i < eventLights.length; i++) {
      const g = glows[i];
      const l = eventLights[i];
      if (!g) { l.visible = false; l.intensity = 0; continue; }
      l.visible = true;
      l.color.setHex(g.hex);
      l.position.set(g.x - origin.x, g.y - origin.y, g.z - origin.z);
      /* generous reach — the point of this light is that it reaches YOU */
      l.distance = Math.max(g.radius * 900, 400000);
      l.intensity = g.lum * (g.kind === "supernova" ? 22 : 8);
      l.decay = 1.15;
    }
    /* exposure and fill rise with the sky, then come back down like an eye.
     * Deliberately restrained: the canopy white-out is a separate thing, and
     * blowing the whole frame out hides the event instead of selling it. */
    const lift = sim.skyLift ?? 0;
    renderer.toneMappingExposure = baseExposure * (1 + lift * 0.3);
    ambient.intensity = baseAmbient + lift * 0.28;
    if (glows[0]) {
      _ambTint.setHex(glows[0].hex);
      ambient.color.setHex(0x9fb2cc).lerp(_ambTint, Math.min(0.7, lift));
    } else if (ambient.color.getHex() !== 0x9fb2cc) {
      ambient.color.setHex(0x9fb2cc);
    }

    /* Where the light is coming from, in screen terms. With nothing in frame
     * to catch a rim light, this is what tells you an event is off to your
     * left, or squarely behind you: glare washing in from that edge. */
    const g0 = glows[0];
    if (!g0 || lift < 0.005) {
      sim.glare = null;
    } else {
      _glareV.set(g0.x - origin.x, g0.y - origin.y, g0.z - origin.z).applyMatrix4(camera.matrixWorldInverse);
      const behind = _glareV.z > 0;
      const lat = Math.hypot(_glareV.x, _glareV.y) || 1e-6;
      /* 0 = dead ahead, 1 = square on the beam, back to 0 = dead astern */
      const off = Math.atan2(lat, -_glareV.z) / Math.PI;
      const ux = _glareV.x / lat;
      const uy = _glareV.y / lat;
      /* push the hot spot to the canopy edge as the source leaves the frame,
       * and let it fall back to an even wash once it is properly astern */
      const reach = Math.min(1, off * 2.1);
      const centre = behind ? 1 - Math.min(1, (off - 0.5) * 2.4) : 1;
      sim.glare = {
        x: 50 + ux * 62 * reach * centre,
        y: 50 - uy * 62 * reach * centre,
        hex: g0.hex,
        /* squarely behind you reads as a general lift, not a hot edge */
        lum: lift * (behind ? 0.55 : 0.85),
      };
    }
  }

  /* Where the player is, as the bed understands it. wellDepth is the one
   * that earns its keep: it turns falling toward something enormous into a
   * drone that sags, which is mass made audible without a single number on
   * screen. */
  function audioState() {
    const s0 = sim.ship;
    /* sim.dominant is the body itself and sim.domDist the range to its
     * centre — the well is how far inside nine radii you have fallen. */
    const dom = sim.dominant;
    let wellDepth = 0;
    if (dom && sim.domDist > 0) {
      const r = dom.radius || 1;
      wellDepth = Math.max(0, Math.min(1, 1 - (sim.domDist - r) / (r * 9)));
    }
    const e = sim.engagement;
    const docked = Boolean(s0?.dockedAt);
    return {
      phase: sim.phase,
      interior: sim.interiorOpen === true,
      docked,
      warp: sim.warp?.state === "run" || sim.warp?.state === "spool",
      combat: Boolean(e?.joined && sim.time < e.end && !docked),
      inBelt: inBelt(s0.pos),
      wellDepth,
      speed: speedOf(s0, sim.frameVel),
      throttle: s0?.throttle ?? 0,
      charge: Math.max(0, Math.min(1, (s0?.charge ?? 0) / batteryCap(s0))),
      alarm: Math.max(0, Math.min(1, sim.trauma ?? 0)),
    };
  }

  const clock = { last: performance.now() };
  let hudAcc = 0;
  let running = true;
  let warpStrength = 0;
  const flashEl = document.getElementById("warp-flash");
  let camTheta = 0.7;
  let camMode = 0; // 0 = cockpit FPV, 1 = external

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let dragId = null;
  let lastPx = 0;
  let lastPy = 0;
  let dragDist = 0;
  let downX = 0;
  let downY = 0;

  /* --- external camera: orbit / pan / zoom around the hull ---------------
   * One finger (or the mouse) orbits, the wheel or a pinch zooms, two
   * fingers together pan the point the camera looks at. Angles are in the
   * hull's own frame so the view rides the ship through a turn. */
  const ext = { yaw: 0.55, pitch: 0.22, dist: 4.2, panX: 0, panY: 0 };
  const EXT_MIN = 1.4;
  const EXT_MAX = 40;
  const extPointers = new Map();
  let pinchD = 0;
  let pinchDist = 0;
  let pinchMid = null;
  function extZoom(f) {
    ext.dist = Math.max(EXT_MIN, Math.min(EXT_MAX, ext.dist * f));
  }
  function extOrbit(dx, dy) {
    ext.yaw -= dx * 0.0062;
    ext.pitch = Math.max(-1.35, Math.min(1.35, ext.pitch + dy * 0.0052));
  }
  function extPan(dx, dy) {
    const k = ext.dist * 0.0022;
    ext.panX = Math.max(-8, Math.min(8, ext.panX - dx * k));
    ext.panY = Math.max(-8, Math.min(8, ext.panY + dy * k));
  }
  function extReset() {
    ext.yaw = 0.55; ext.pitch = 0.22; ext.dist = 4.2; ext.panX = 0; ext.panY = 0;
  }
  canvas.addEventListener("wheel", (e) => {
    if (sim.phase !== "play" || camMode !== 1) return;
    e.preventDefault();
    extZoom(e.deltaY > 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });
  canvas.addEventListener("dblclick", () => { if (camMode === 1) extReset(); });

  function pickAt(clientX, clientY) {
    if (sim.phase !== "play") return;
    const rect = canvas.getBoundingClientRect();
    _mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    _ray.setFromCamera(_mouse, camera);
    const hits = _ray.intersectObjects(pickables, false);
    if (hits[0]) {
      const stId = hits[0].object.userData.stationId;
      if (stId) {
        // A tap on a port starts a signature lock on it (same as P-LOCK with it under the reticle).
        acquireLock({ kind: "station", id: stId });
        return;
      }
      const id = hits[0].object.userData.bodyId;
      if (id) {
        // A tap on a world is the same act as putting the reticle on it: one
        // lock, one nav target. (It used to set the nav target on its own,
        // which is how a stale planet outlived the lock that chose it.)
        acquireLock({ kind: "body", id });
      }
    }
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    if (sim.phase === "play" && camMode === 1) {
      extPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (extPointers.size === 2) {
        const [a, b] = [...extPointers.values()];
        pinchD = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        pinchDist = ext.dist;
        pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      }
    }
    dragId = e.pointerId;
    lastPx = e.clientX;
    lastPy = e.clientY;
    downX = e.clientX;
    downY = e.clientY;
    dragDist = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.focus();
  }
  function onPointerMove(e) {
    if (camMode === 1 && extPointers.has(e.pointerId)) {
      const prev = extPointers.get(e.pointerId);
      const now = { x: e.clientX, y: e.clientY };
      extPointers.set(e.pointerId, now);
      if (extPointers.size >= 2) {
        const [a, b] = [...extPointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        ext.dist = Math.max(EXT_MIN, Math.min(EXT_MAX, pinchDist * (pinchD / d)));
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (pinchMid) extPan(mid.x - pinchMid.x, mid.y - pinchMid.y);
        pinchMid = mid;
        dragDist += 20;
        return;
      }
      if (dragId === e.pointerId) {
        const dx = now.x - prev.x;
        const dy = now.y - prev.y;
        dragDist += Math.hypot(dx, dy);
        extOrbit(dx, dy);
        lastPx = now.x;
        lastPy = now.y;
      }
      return;
    }
    if (dragId !== e.pointerId) return;
    const dx = e.clientX - lastPx;
    const dy = e.clientY - lastPy;
    lastPx = e.clientX;
    lastPy = e.clientY;
    dragDist += Math.hypot(dx, dy);
    if (sim.phase === "play") addLook(dx, dy);
  }
  function onPointerUp(e) {
    extPointers.delete(e.pointerId);
    if (extPointers.size < 2) pinchMid = null;
    if (dragId !== e.pointerId) return;
    dragId = null;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (sim.phase === "play" && dragDist < 7) pickAt(downX, downY);
  }
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  const _rcol = new THREE.Color();

  /**
   * How many grown bodies this device will carry.
   *
   * Same shape as the attract screen's gate and overridable the same way
   * (localStorage "lgaa.rocks" → off | low | full | high), because a belt is
   * exactly where a phone is already working hardest.
   */
  function rockQuality() {
    let want = "full";
    try {
      const set = globalThis.localStorage?.getItem("lgaa.rocks");
      if (set) want = set;
      else {
        const cores = navigator?.hardwareConcurrency ?? 4;
        const mem = navigator?.deviceMemory ?? 4;
        const slow = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        want = slow ? "off" : cores <= 4 || mem <= 3 ? "low" : cores >= 8 && mem >= 8 ? "high" : "full";
      }
    } catch { want = "full"; }
    return { off: 0, low: 4, full: 10, high: 18 }[want] ?? 10;
  }

  function releaseBody(key) {
    const b = bodies.get(key);
    if (!b) return;
    rockFx.detach(b);
    scene.remove(b.group);
    b.mount.dispose();
    bodies.delete(key);
  }

  /* The bake tier off the same budget that decides how many bodies there are:
   * a device carrying four gets coarser ones than a device carrying eighteen. */
  const bakeTier = bodyBudget >= 18 ? "high" : bodyBudget >= 10 ? "full" : bodyBudget > 0 ? "low" : "off";
  const beltBake = BAKE.belt[bakeTier];
  const rogueBake = BAKE.rogue[bakeTier];
  const bodyDetail = beltBake.H;
  const beltKey = (rock) => `belt:${rock.key}:${beltBake.H}`;
  const rogueKey = (m) => `rogue:${m.id}:${Math.round(m.r)}:${rogueBake.H}`;

  /**
   * The body for this rock, or null while it grows. The first ask files the
   * request with the worker; the rock keeps drawing as its class prototype until
   * the bake lands, then the next frame mounts it.
   */
  function bodyFor(rock, dist = Infinity, now = 0) {
    const have = bodies.get(rock.key);
    if (have) return have;
    const d = peek(beltKey(rock));
    if (!d) {
      grow(beltKey(rock), { ...rockParams(rock), favour: rock.ice ? null : rock.ore, H: beltBake.H, L: beltBake.L });
      return null;
    }
    if (bodies.size >= bodyBudget) {
      /* 0.3.28: evict the one that has been out of sight longest AND is
       * further away than the rock asking for its slot — never the rock under
       * the lock or the cutter, and never one mounted moments ago, or a burst
       * of arrivals evicts each other in turn and the belt boils. */
      let victim = null, worst = -Infinity;
      for (const [k, b] of bodies) {
        if (k === sim.lock?.id || k === mining.key) continue;
        if (now - (b.born ?? -Infinity) < BODY_HOLD) continue;
        const bd = b.rock ? Math.hypot(b.rock.x - sim.ship.pos.x, b.rock.y - sim.ship.pos.y, b.rock.z - sim.ship.pos.z) : Infinity;
        if (bd <= dist) continue;                       // it is nearer than the challenger: it keeps the slot
        const score = (now - b.used) * 1000 + bd;       // unseen longest first, then furthest
        if (score > worst) { worst = score; victim = k; }
      }
      if (!victim) return null;                          // nothing worth displacing: the rock waits its turn
      releaseBody(victim);
    }
    const rec = mountBody(d, rock.r);
    rec.used = now;
    rec.born = now;
    rec.rock = { key: rock.key, r: rock.r, x: rock.x, y: rock.y, z: rock.z, ore: rock.ore, cls: rock.cls };
    bodies.set(rock.key, rec);
    return rec;
  }

  /**
   * A grown body in the scene. Two groups: the outer one is where the rock is
   * (position, spin, and the shrink as it is cut); the inner one is the
   * generator's unit frame scaled up to the rock's radius, which the mesh and
   * any shatter field share.
   */
  function mountBody(d, radius) {
    const mb = mountBakedData(THREE, d);
    const built = mb.built;
    const group = new THREE.Group();
    const unit = new THREE.Group();
    unit.scale.setScalar(built.scale);
    group.add(unit);
    const mesh = new THREE.Mesh(mb.geometries[0], mb.material);
    mesh.frustumCulled = false;
    unit.add(mesh);
    scene.add(group);
    return { group, unit, mesh, mount: mb, assay: built, built, cls: built.cls, shape: built.shape, r: radius, used: 0 };
  }

  /** The assay for a rock, if a body has been grown for it. For the survey card. */
  function assayFor(key) {
    return bodies.get(key)?.assay ?? null;
  }

  function clearRockBuckets() {
    for (const b of rockBuckets) { b.counts.fill(0); for (const m of b.lods) m.count = 0; }
    dust.visible = false;
    for (const key of [...bodies.keys()]) releaseBody(key);
  }

  const _dressed = [];

  /** Cut-out rocks go up as shatter fields in their own colours — if we grew them. */
  function drainBrokenRocks() {
    while (brokenRocks.length) {
      const key = brokenRocks.shift();
      const b = bodies.get(key);
      if (!b) continue;
      rockFx.shatter(b);
      releaseBody(key);
    }
  }

  const _wantKeys = new Set();
  function updateAsteroids(t) {
    /* no worker (or it failed): grow one queued body on this thread a frame */
    pump();
    drainBrokenRocks();
    if (!inBelt(sim.ship.pos)) {
      clearRockBuckets();
      cancelGrowth((key) => !key.startsWith("belt:"));
      return;
    }
    const rocks = nearbyRocks(sim.ship.pos, t, 2);
    const sp = sim.ship.pos;
    for (const b of rockBuckets) b.counts.fill(0);
    let drawn = 0;
    /* Who gets grown: the nearest big rocks, plus whatever is locked or under
     * the cutter — that one is the rock you are looking at, so it is never the
     * one left as a prototype. One mounted per frame, no more. */
    grown.clear();
    _wantKeys.clear();
    if (bodyBudget > 0) {
      near.length = 0;
      for (const r of rocks) {
        if (r.r < BODY_MIN_R) continue;
        const d = Math.hypot(r.x - sp.x, r.y - sp.y, r.z - sp.z);
        const held = bodies.has(r.key);
        /* enter the set at BODY_R; leave it only well outside, so the change
         * of shape happens far away rather than in front of you */
        if (d > (held ? BODY_R * BODY_FAR : BODY_R)) continue;
        const pin = sim.lock?.id === r.key || mining.key === r.key;
        near.push({ r, d, rank: d - (pin ? 1e6 : 0) - (held ? BODY_R * BODY_KEEP : 0) });
      }
      near.sort((a, b) => a.rank - b.rank);
      let built = 0;
      for (const { r, d } of near.slice(0, bodyBudget)) {
        _wantKeys.add(beltKey(r));
        const had = bodies.has(r.key);
        if (!had && built >= 1) { if (!peek(beltKey(r))) grow(beltKey(r), { ...rockParams(r), favour: r.ice ? null : r.ore, H: beltBake.H, L: beltBake.L }); continue; }
        const body = bodyFor(r, d, t);
        if (!body) continue;
        if (!had) built++;
        body.used = t;
        body.rock.x = r.x; body.rock.y = r.y; body.rock.z = r.z;
        body.group.position.set(r.x - origin.x, r.y - origin.y, r.z - origin.z);
        body.group.rotation.set(t * r.spin * 0.1, t * r.spin * 0.14, r.seed * 6.28);
        body.group.scale.setScalar(1 - r.worn * 0.45);
        body.group.visible = true;
        grown.add(r.key);
      }
      /* 0.3.28 — a body that is mounted STAYS drawn while its rock is still in
       * range, even if this frame's ranking put it outside the top slice. It
       * used to be hidden the moment it lost its rank, which turned a
       * one-frame reordering into a rock visibly changing shape and changing
       * back. The pool is already capped at the budget, so keeping them all
       * drawn costs nothing that was not already paid for. */
      for (const { r } of near) {
        if (grown.has(r.key)) continue;
        const b = bodies.get(r.key);
        if (!b) continue;
        b.rock.x = r.x; b.rock.y = r.y; b.rock.z = r.z;
        b.group.position.set(r.x - origin.x, r.y - origin.y, r.z - origin.z);
        b.group.rotation.set(t * r.spin * 0.1, t * r.spin * 0.14, r.seed * 6.28);
        b.group.scale.setScalar(1 - r.worn * 0.45);
        b.group.visible = true;
        grown.add(r.key);
      }
      /* and one that really has left the range goes back to the field */
      for (const [key, b] of bodies) if (!grown.has(key) && b.group.visible) { b.group.visible = false; rockFx.detach(b); }
      /* a rock flown past before its body grew is not worth the worker's time */
      cancelGrowth((key) => !key.startsWith("belt:") || _wantKeys.has(key));
    }

    for (const r of rocks) {
      if (drawn >= MAX_ROCKS) break;
      const d = Math.hypot(r.x - sp.x, r.y - sp.y, r.z - sp.z);
      if (d > ROCK_DRAW_R) continue;
      if (grown.has(r.key)) { drawn++; continue; }   // it has a real body; the instance would sit inside it
      const cls = CLASSES[r.cls] ? r.cls : "S";
      const v = Math.floor((r.seed ?? 0.5) * 9973) % PROTO_VARIANTS;
      const bucket = protoIndex.get(`${cls}:${v}`);
      if (!bucket?.mesh) continue;
      const ang = r.r / Math.max(1, d);
      const lod = ang >= PROTO_LOD_ANG[0] ? 0 : ang >= PROTO_LOD_ANG[1] ? 1 : 2;
      if (bucket.counts[lod] >= bucket.cap) continue;
      /* grow in across the outer slice of the range: nothing pops */
      const k = Math.min(1, (ROCK_DRAW_R - d) / ROCK_FADE);
      _dummy.position.set(r.x - origin.x, r.y - origin.y, r.z - origin.z);
      _dummy.rotation.set(t * r.spin * 0.1, t * r.spin * 0.14, r.seed * 6.28);
      _dummy.scale.setScalar((r.r * (1 - r.worn * 0.45) * (0.15 + 0.85 * k)) / bucket.unitR);
      _dummy.updateMatrix();
      /* the prototype carries the class's surface; the instance carries THIS
       * rock: a lightness jitter off its seed and a lean toward its ore, so the
       * rock you can see is the rock you are about to cut */
      const look = rockLook(r);
      const lum = Math.max(0.05, (look.r + look.g + look.b) / 3);
      const j = 0.84 + ((r.seed * 7919) % 1) * 0.3;
      const lean = r.rich ? 0.45 : 0.25;
      _rcol.setRGB(j * (1 - lean + lean * look.r / lum), j * (1 - lean + lean * look.g / lum), j * (1 - lean + lean * look.b / lum));
      const lm = bucket.lods[lod];
      lm.setColorAt(bucket.counts[lod], _rcol);
      lm.setMatrixAt(bucket.counts[lod]++, _dummy.matrix);
      drawn++;
    }
    for (const b of rockBuckets) {
      if (!b.mesh) continue;
      b.lods.forEach((m, i) => {
        m.count = b.counts[i];
        if (m.count) { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }
      });
    }

    /* the dust box follows the hull in whole-box steps, so motes stream past
     * instead of being dragged along with you */
    dust.visible = drawn > 0;
    if (dust.visible) {
      dust.position.set(
        Math.round((sp.x - origin.x) / DUST_BOX) * DUST_BOX,
        Math.round((sp.y - origin.y) / DUST_BOX) * DUST_BOX,
        Math.round((sp.z - origin.z) / DUST_BOX) * DUST_BOX,
      );
    }
  }

  const _dcol = new THREE.Color();
  function updateDebris(t) {
    let n = 0;
    let anyHot = false;
    for (const c of chunks) {
      if (n >= MAX_CHUNKS) break;
      /* a rock's own pieces are drawn by its fractured body while the impact run holds them */
      if (c.driven && c.fractured != null) continue;
      _dummy.position.set(c.x - origin.x, c.y - origin.y, c.z - origin.z);
      _dummy.rotation.set(t * c.spin, t * c.spin * 0.7, c.seed * 6.28);
      _dummy.scale.setScalar(c.r);
      _dummy.updateMatrix();
      /* rubble thrown off a strike is still incandescent — it cools through
       * the same blackbody curve the parent body does */
      const h = c.hot ?? 0;
      if (h > 0) {
        anyHot = true;
        _dcol.setHex(kelvinHex(900 + h * 1500)).multiplyScalar(0.55 + h * 0.9);
      } else {
        _dcol.setRGB(1, 1, 1);
      }
      debrisMesh.setColorAt(n, _dcol);
      debrisMesh.setMatrixAt(n++, _dummy.matrix);
    }
    debrisMesh.count = n;
    if (n) debrisMesh.instanceMatrix.needsUpdate = true;
    if (n && (anyHot || debrisMesh.userData.wasHot)) {
      debrisMesh.instanceColor.needsUpdate = true;
      debrisMesh.userData.wasHot = anyHot;
    }
  }

  function releaseImpactorBody(id) {
    const b = impBodies.get(id);
    if (!b) return;
    rockFx.detach(b);
    scene.remove(b.group);
    b.mount.dispose();
    impBodies.delete(id);
  }

  /** The grown body for one rogue rock, the cached one, or null while it grows. */
  function impactorBody(m) {
    const have = impBodies.get(m.id);
    /* a mirrored rock can have its radius corrected by the host; a body built
     * at the old size would sit visibly inside or outside its own collision */
    if (have && Math.abs(have.r - m.r) < have.r * 0.02) return have;
    const key = rogueKey(m);
    const d = peek(key);
    if (!d) { grow(key, { ...rogueParams(m, rogueClass(m)), H: rogueBake.H, L: rogueBake.L }); return have ?? null; }
    if (have) releaseImpactorBody(m.id);
    const rec = mountBody(d, m.r);
    impBodies.set(m.id, rec);
    return rec;
  }

  /** The assay for a rogue rock, if its body has been grown. For the survey card. */
  function rogueAssay(id) {
    return impBodies.get(id)?.assay ?? null;
  }

  function updateImpactors(t) {
    const live = new Set();
    let mounted = 0;
    for (const m of impactors) {
      live.add(m.id);
      /* one mount a frame, same rule the belt plays by */
      const had = impBodies.get(m.id);
      const fresh = !had || Math.abs(had.r - m.r) >= had.r * 0.02;
      const body = !fresh || mounted < 1 ? impactorBody(m) : had ?? null;
      if (fresh && body && body !== had) mounted++;
      if (!body) continue;
      body.group.position.set(m.x - origin.x, m.y - origin.y, m.z - origin.z);
      body.group.rotation.set(t * m.spin, t * m.spin * 0.6, (m.seed ?? 0.5) * 6.28);
      body.group.visible = true;
    }
    /* a rock that struck, or drifted past the despawn rim, takes its body with it */
    if (impBodies.size) for (const id of [...impBodies.keys()]) if (!live.has(id)) releaseImpactorBody(id);
  }

  function updateShots() {
    let n = 0;
    for (const s of shots) {
      if (n >= MAX_SHOTS) break;
      shotPos[n * 3] = s.x - origin.x;
      shotPos[n * 3 + 1] = s.y - origin.y;
      shotPos[n * 3 + 2] = s.z - origin.z;
      n++;
    }
    shotGeo.setDrawRange(0, n);
    shotGeo.attributes.position.needsUpdate = true;
    shotMesh.visible = n > 0;
  }

  function spawnChip(vx0, vy0, vz0) {
    for (let i = 0; i < MAX_CHIPS; i++) {
      if (chipAge[i] >= 0) continue;
      const h = laser.hit;
      chipPos[i * 3] = h.x; chipPos[i * 3 + 1] = h.y; chipPos[i * 3 + 2] = h.z;
      /* off the face, away from the beam, with a tangential kick */
      const sp = 22 + Math.random() * 50;
      const rx = Math.random() - 0.5, ry = Math.random() - 0.5, rz = Math.random() - 0.5;
      chipVel[i * 3] = vx0 + (-laser.dir.x * 0.8 + rx * 1.4) * sp;
      chipVel[i * 3 + 1] = vy0 + (-laser.dir.y * 0.8 + ry * 1.4) * sp;
      chipVel[i * 3 + 2] = vz0 + (-laser.dir.z * 0.8 + rz * 1.4) * sp;
      chipAge[i] = 0;
      chipLife[i] = 0.7 + Math.random() * 1.1;
      return;
    }
  }

  function spawnPuff(vx0, vy0, vz0) {
    const p = puffs.find((q) => q.age < 0);
    if (!p) return;
    const h = laser.hit;
    p.x = h.x; p.y = h.y; p.z = h.z;
    p.vx = vx0 + (-laser.dir.x + (Math.random() - 0.5)) * 9;
    p.vy = vy0 + (-laser.dir.y + (Math.random() - 0.5)) * 9;
    p.vz = vz0 + (-laser.dir.z + (Math.random() - 0.5)) * 9;
    p.age = 0;
    p.life = 1.5 + Math.random() * 0.9;
    p.sp.visible = true;
  }

  function updateMiningFX(dt) {
    const s = sim.ship;
    laser.t += dt;
    if (mining.active && sim.phase === "play") {
      /* the emitter sits under and to the right of the lens, on the hull */
      const f = forwardOf(s.yaw, s.pitch);
      const u = upOf(s.yaw, s.pitch);
      const r = rightOf(s.yaw);
      /* far enough off the lens axis that the beam reads as a streak from the
       * bottom-right of the canopy to the cut, not a dot on the reticle */
      laser.from.x = s.pos.x + f.x * 1.6 + r.x * 1.6 - u.x * 1.2;
      laser.from.y = s.pos.y + f.y * 1.6 + r.y * 1.6 - u.y * 1.2;
      laser.from.z = s.pos.z + f.z * 1.6 + r.z * 1.6 - u.z * 1.2;
      let dx = mining.x - laser.from.x, dy = mining.y - laser.from.y, dz = mining.z - laser.from.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      dx /= d; dy /= d; dz /= d;
      laser.dir.x = dx; laser.dir.y = dy; laser.dir.z = dz;
      /* the cut lands on the near face, not the centre */
      const reach = Math.max(1, d - (mining.r ?? 0) * 0.9);
      laser.hit.x = laser.from.x + dx * reach;
      laser.hit.y = laser.from.y + dy * reach;
      laser.hit.z = laser.from.z + dz * reach;
      laser.to.x = laser.hit.x; laser.to.y = laser.hit.y; laser.to.z = laser.hit.z;
      laser.on = true;
      laser.fade = 0;
      /* what comes off the face rides the rock's own drift, if it has one */
      const tv = mining.vx ?? 0, tvy = mining.vy ?? 0, tvz = mining.vz ?? 0;
      chipAcc += dt * (mining.heat > 0.6 ? 46 : 30);
      while (chipAcc >= 1) { chipAcc -= 1; spawnChip(tv, tvy, tvz); }
      puffAcc += dt;
      if (puffAcc > 0.14) { puffAcc = 0; spawnPuff(tv, tvy, tvz); }
    } else if (laser.on) {
      laser.fade += dt;
      if (laser.fade > 2.2) laser.on = false;
    }

    /* beam segments */
    beamGroup.visible = laser.on;
    if (laser.on) {
      const fx = laser.from.x - origin.x, fy = laser.from.y - origin.y, fz = laser.from.z - origin.z;
      const len = Math.hypot(laser.to.x - laser.from.x, laser.to.y - laser.from.y, laser.to.z - laser.from.z);
      const segLen = len / BEAM_SEGS;
      const flicker = 0.75 + 0.25 * Math.sin(laser.t * 38) * Math.sin(laser.t * 7.3);
      const rad = (0.7 + (mining.heat ?? 0) * 0.6) * flicker + Math.min(2.6, len * 0.0016);
      for (let i = 0; i < BEAM_SEGS; i++) {
        const seg = beamSegs[i];
        /* two-beat die-off: first the line breaks into dashes — every section
         * pulls in on its centre and gaps open — then the dashes go out one by
         * one from the cut back toward the emitter, the bright near ones last */
        let keep = 1;
        if (laser.fade > 0) {
          const f = laser.fade;
          if (f < 0.6) keep = 1 - 0.45 * (f / 0.6);
          else keep = 0.55 * (1 - Math.min(1, Math.max(0, (f - 0.6 - (BEAM_SEGS - 1 - i) * 0.12) / 0.5)));
        }
        if (keep <= 0.001) { seg.outer.visible = false; continue; }
        seg.outer.visible = true;
        const mid = (i + 0.5) * segLen;
        seg.outer.position.set(fx + laser.dir.x * mid, fy + laser.dir.y * mid, fz + laser.dir.z * mid);
        seg.outer.lookAt(seg.outer.position.x + laser.dir.x, seg.outer.position.y + laser.dir.y, seg.outer.position.z + laser.dir.z);
        /* thin at the emitter, full width by the cut — a taper, stepped per section */
        const taper = 0.22 + 0.78 * ((i + 0.5) / BEAM_SEGS);
        const rr = rad * taper * (0.6 + keep * 0.4);
        seg.outer.scale.set(rr, rr, Math.max(0.01, segLen * keep * 0.98));
        seg.outer.material.opacity = 0.55 * keep * flicker;
        seg.core.material.opacity = 0.95 * keep;
      }
    }

    /* chips */
    let live = 0;
    const cp = chipGeo.attributes.position.array;
    for (let i = 0; i < MAX_CHIPS; i++) {
      if (chipAge[i] < 0) { cp[i * 3 + 1] = 1e9; continue; }
      chipAge[i] += dt;
      if (chipAge[i] > chipLife[i]) { chipAge[i] = -1; cp[i * 3 + 1] = 1e9; continue; }
      chipPos[i * 3] += chipVel[i * 3] * dt;
      chipPos[i * 3 + 1] += chipVel[i * 3 + 1] * dt;
      chipPos[i * 3 + 2] += chipVel[i * 3 + 2] * dt;
      cp[i * 3] = chipPos[i * 3] - origin.x;
      cp[i * 3 + 1] = chipPos[i * 3 + 1] - origin.y;
      cp[i * 3 + 2] = chipPos[i * 3 + 2] - origin.z;
      live++;
    }
    chipGeo.attributes.position.needsUpdate = true;
    chipMesh.visible = live > 0;

    /* dust */
    for (const p of puffs) {
      if (p.age < 0) continue;
      p.age += dt;
      if (p.age > p.life) { p.age = -1; p.sp.visible = false; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.sp.position.set(p.x - origin.x, p.y - origin.y, p.z - origin.z);
      const u = p.age / p.life;
      const sc = 3 + u * 22;
      p.sp.scale.set(sc, sc, 1);
      p.sp.material.opacity = 0.32 * (1 - u) * Math.min(1, u * 6);
    }
  }

  /* a port's interceptors: a blue dart with a plume, nose along its velocity */
  const sdroneGlow = new THREE.SpriteMaterial({ map: glowTex, color: 0x7df0ff, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  sdroneGlow.userData.keep = true;
  /* the tractor: a pulsing beam from the mouth to the hull while port control has the helm */
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x7fe0ff, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  beamMat.userData.keep = true;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1, true), beamMat);
  beam.geometry.userData.keep = true;
  beam.visible = false;
  scene.add(beam);
  const beamGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9ff0ff, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  beamGlow.material.userData.keep = true;
  beamGlow.visible = false;
  scene.add(beamGlow);
  const _bA = new THREE.Vector3(), _bB = new THREE.Vector3(), _bUp = new THREE.Vector3(0, 1, 0);
  function updateTractorBeam(t) {
    const on = tractor.active;
    beam.visible = on; beamGlow.visible = on;
    if (!on) return;
    const st = stations.find((x) => x.id === tractor.stId);
    const m = st?.hangars?.[tractor.hangar];
    if (!st || !m) { beam.visible = beamGlow.visible = false; return; }
    _bA.set(st.x + m.x - origin.x, st.y + m.y - origin.y, st.z + m.z - origin.z);
    _bB.set(sim.ship.pos.x - origin.x, sim.ship.pos.y - origin.y, sim.ship.pos.z - origin.z);
    const L = _bA.distanceTo(_bB);
    beam.position.copy(_bA).add(_bB).multiplyScalar(0.5);
    beam.scale.set(3 + Math.sin(t * 9) * 0.6, Math.max(1, L), 3 + Math.sin(t * 9) * 0.6);
    beam.quaternion.setFromUnitVectors(_bUp, _bB.clone().sub(_bA).normalize());
    beamMat.opacity = 0.16 + 0.1 * (0.5 + 0.5 * Math.sin(t * 6));
    beamGlow.position.copy(_bA);
    const g = 26 + Math.sin(t * 5) * 6;
    beamGlow.scale.set(g, g, 1);
  }

  /* Remote drones are robots (droneforge.js over js/robotgen/): a port's interceptors and gun
   * drones are its own line's design, seeded by the port's name. A contact flies the old
   * placeholder for the frame or two until its design is grown, then swaps. */
  const _dLook = new THREE.Vector3();
  function droneDesign(c) {
    const st = c.stationId ? stations.find((x) => x.id === c.stationId) : null;
    const kind = c.kind === "sdrone" ? "sdrone" : "guard";
    const seed = st ? st.name : `rogue-${(c.id.length + c.id.charCodeAt(c.id.length - 1)) % 4}`;
    return droneFor(kind, seed, st?.sector ?? "pirate");
  }
  /* Everything that flies has a real hull: a generated ship or a generated
   * drone, and nothing else. There used to be a fallback here — a red
   * tetrahedron, tumbling on two axes, stood in for any drone whose design
   * had not grown yet or that was out of mesh range, and because the swap
   * only happened when `droneDesign` finally returned something, a contact
   * beyond mesh range kept the blob for as long as it existed.
   *
   * So a lump of abstract geometry was a permanent flying object in a game
   * where every other hull is built by a generator. It is gone. A drone
   * whose design is still growing, or that is too far out for a mesh, draws
   * NOTHING for those frames — exactly as an NPC ship at the same distance
   * already did. The design keeps being requested every frame until the
   * budget grows it, so the gap is a frame or two, not a state. */
  function syncContactMeshes() {
    droneBudget(2);
    for (const c of contacts) {
      if (c.kind !== "drone" && c.kind !== "sdrone") continue;
      let m = droneMeshes.get(c.id);
      if (!m) {
        const bot = dist3(sim.ship.pos, c) < meshRange() ? droneDesign(c) : null;
        if (!bot) continue;          // no real hull yet: draw nothing at all
        if (c.kind === "sdrone") { const sp = new THREE.Sprite(sdroneGlow); sp.scale.set(5, 5, 1); sp.position.z = 4.5; bot.add(sp); }
        m = bot;
        scene.add(m);
        droneMeshes.set(c.id, m);
      }
      rel(c.x, c.y, c.z, m);
      if (c.kind === "sdrone") { m.rotation.set(c.pitch ?? 0, c.yaw ?? 0, 0, "YXZ"); continue; }
      /* a gun drone keeps its optics on you, with a slow station-keeping bob */
      _dLook.set(sim.ship.pos.x - origin.x, sim.ship.pos.y - origin.y, sim.ship.pos.z - origin.z);
      m.lookAt(_dLook);
      m.rotateY(Math.PI);
      m.rotateZ(Math.sin(sim.time * 0.7 + c.id.length) * 0.08);
    }
    /* the eviction sweep: `contacts.some()` per mesh is O(meshes × contacts)
     * with a closure allocated per mesh, every frame — 40 meshes against a
     * 120-entry board is 4,800 comparisons a frame. One pass to mark what is
     * live, one to drop what is not, same as syncWorkDrones already does. */
    _seenDrone.clear();
    for (const c of contacts) _seenDrone.add(c.id);
    for (const [id, m] of droneMeshes) {
      if (!_seenDrone.has(id)) {
        scene.remove(m);
        droneMeshes.delete(id);
      }
    }
    syncProbeMeshes();
    syncWorkDrones();
  }

  /* Your work drones: drawn inside draw range and off the clamps; a cutter beam while mining. */
  const workBeamMat = new THREE.LineBasicMaterial({ color: 0xffa24a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  workBeamMat.userData.keep = true;
  const _seenWork = new Set();
  function syncWorkDrones() {
    const seen = _seenWork;
    seen.clear();
    for (const list of [droneOps.units, npcDrones.units]) for (const u of list) {
      if ((u.dockedAt && !u.bay) || u.state === "setup") continue;   // 0.3.15: a drone in its bay run is on the board
      if (dist3(sim.ship.pos, u) > meshRange()) continue;
      seen.add(u.id);
      let w = workMeshes.get(u.id);
      if (!w) {
        const mesh = droneFor(u.role, u.seed, u.corpId ? u.sector : null);
        if (!mesh) continue;
        const sp = new THREE.Sprite(sdroneGlow); sp.scale.set(5, 5, 1); sp.position.z = 5; mesh.add(sp);
        scene.add(mesh);
        w = { mesh, beam: null };
        workMeshes.set(u.id, w);
      }
      rel(u.x, u.y, u.z, w.mesh);
      w.mesh.rotation.set(u.pitch ?? 0, u.yaw ?? 0, 0, "YXZ");
      const cutting = u.cut && sim.time - (u.cutting ?? -1e9) < 1.2;
      if (cutting) {
        if (!w.beam) {
          const g = new THREE.BufferGeometry();
          g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
          w.beam = new THREE.Line(g, workBeamMat);
          w.beam.frustumCulled = false;
          scene.add(w.beam);
        }
        const a = w.beam.geometry.attributes.position;
        a.setXYZ(0, u.x - origin.x, u.y - origin.y, u.z - origin.z);
        a.setXYZ(1, u.cut.x - origin.x, u.cut.y - origin.y, u.cut.z - origin.z);
        a.needsUpdate = true;
        w.beam.visible = true;
        workBeamMat.opacity = 0.55 + 0.35 * Math.sin(sim.wall * 30);
      } else if (w.beam) w.beam.visible = false;
    }
    for (const [id, w] of workMeshes) {
      if (seen.has(id)) continue;
      scene.remove(w.mesh);
      if (w.beam) { scene.remove(w.beam); w.beam.geometry.dispose(); }
      workMeshes.delete(id);
      /* the last unit flying a design frees the design (droneFor's key: kind|seed|sector) */
      const key = w.mesh.userData?.template;
      if (key && !unitsUseDrone(key)) releaseDrone?.(key);
    }
  }
  function unitsUseDrone(key) {
    for (const list of [droneOps.units, npcDrones.units]) for (const u of list) {
      if (`${u.role}|${u.seed}|${(u.corpId ? u.sector : null) ?? ""}` === key) return true;
    }
    return false;
  }

  /* Your survey probes: drawn while they are in flight and inside draw range. */
  const _pDir = new THREE.Vector3();
  function syncProbeMeshes() {
    for (const pr of probes) {
      let m = probeMeshes.get(pr.id);
      const live = !pr.done && dist3(sim.ship.pos, pr) < drawRange();
      if (!live) { if (m) { scene.remove(m); probeMeshes.delete(pr.id); } continue; }
      if (!m) {
        m = droneFor("probe", sim.callsign || "probe", null);
        if (!m) continue;
        const sp = new THREE.Sprite(sdroneGlow); sp.scale.set(4, 4, 1); sp.position.z = 3; m.add(sp);
        scene.add(m);
        probeMeshes.set(pr.id, m);
      }
      rel(pr.x, pr.y, pr.z, m);
      _pDir.set(pr.tx - pr.sx, pr.ty - pr.sy, pr.tz - pr.sz);
      if (_pDir.lengthSq() > 1e-6) { _pDir.normalize(); m.lookAt(m.position.x - _pDir.x, m.position.y - _pDir.y, m.position.z - _pDir.z); }
    }
    _seenProbe.clear();
    for (const p of probes) _seenProbe.add(p.id);
    for (const [id, m] of probeMeshes) {
      if (!_seenProbe.has(id)) { scene.remove(m); probeMeshes.delete(id); }
    }
  }

  function syncRemotes() {
    for (const [id, data] of sim.remotes) {
      let obj = remotes.get(id);
      if (obj && obj.shipId !== (data.ship ?? DEFAULT_SHIP_ID)) {
        scene.remove(obj.group);
        disposeObject(obj.group);
        remotes.delete(id);
        obj = null;
      }
      if (!obj) {
        if (hullBudget <= 0) continue;
        hullBudget--;
        const shipDefId = data.ship ?? DEFAULT_SHIP_ID;
        const group = makeShipGroup(data.color, 1, shipDefId, id, "lite");
        scene.add(group);
        obj = { id, group, shipId: shipDefId };
        remotes.set(id, obj);
      }
      rel(data.x, data.y, data.z, obj.group);
      orientCraft(obj.group, data.yaw, data.pitch, 0);
      tickHull(obj.group, frameDt, sim.time, { throttle: 0.55 });
    }
    for (const [id, obj] of remotes) {
      if (!sim.remotes.has(id)) {
        scene.remove(obj.group);
        disposeObject(obj.group);
        remotes.delete(id);
      }
    }
  }

  const _liveNpc = new Set();
  function syncTraffic() {
    const live = _liveNpc;
    live.clear();
    for (const n of traffic) {
      live.add(n.id);
      let obj = npcMeshes.get(n.id);
      if (n.visible === false) { // inside a ring or in a lane: nothing to draw, but the hull is kept for when it comes out
        if (obj) obj.group.visible = false;
        dropNavLight(n.id);
        continue;
      }
      if (obj && obj.shipId !== (n.ship ?? DEFAULT_SHIP_ID)) {
        scene.remove(obj.group);
        disposeObject(obj.group);
        npcMeshes.delete(n.id);
        obj = null;
      }
      /* a hull 80 km out is a sub-pixel dot: keep its label and its strobe, skip its mesh */
      const dn = dist3(sim.ship.pos, n);
      const far = dn > meshRange();
      if (far && dn < drawRange() * 1.3) placeNavLight(navLightFor(n.id, HOSTILE_ROLES.has(n.role) ? "#ff6a4a" : LAW_ROLES.has(n.role) ? "#8fd6ff" : "#dfe9ff"), n.x, n.y, n.z, sim.time, dn);
      else if (far) dropNavLight(n.id); // past 1.3× draw range the strobe goes too
      if (!obj) {
        if (far || hullBudget <= 0) continue;
        hullBudget--;
        const shipDefId = n.ship ?? DEFAULT_SHIP_ID;
        const group = makeShipGroup(n.color ?? "#8aa0b8", 1, shipDefId, n.id, "lite");
        scene.add(group);
        obj = { id: n.id, group, shipId: shipDefId };
        npcMeshes.set(n.id, obj);
      }
      obj.group.visible = !far;
      if (far) continue;
      rel(n.x, n.y, n.z, obj.group);
      orientCraft(obj.group, n.yaw ?? 0, n.pitch ?? 0, 0);
      tickHull(obj.group, frameDt, sim.time, { throttle: n.job === "docked" || n.job === "hold" ? 0.05 : Math.min(1, 0.25 + (n.speed ?? 0) / 40) });
      placeNavLight(navLightFor(n.id, HOSTILE_ROLES.has(n.role) ? "#ff6a4a" : LAW_ROLES.has(n.role) ? "#8fd6ff" : "#dfe9ff"), n.x, n.y, n.z, sim.time, dist3(sim.ship.pos, n));
    }
    for (const [id] of navLights) if (id.startsWith("npc:") && !live.has(id)) dropNavLight(id);
    for (const [id, obj] of npcMeshes) {
      if (!live.has(id)) {
        scene.remove(obj.group);
        disposeObject(obj.group);
        npcMeshes.delete(id);
      }
    }
  }

  /* The flow: port heartbeat boats, drawn from the hull pool. An instance
   * shares its template's geometry — never run the disposer on one. */
  const _liveFlow = new Set();
  function syncFlow() {
    const live = _liveFlow;
    live.clear();
    const R = meshRange();
    for (const n of flow) {
      if (!n.visible) continue;
      if (dist3(sim.ship.pos, n) > R) continue;
      live.add(n.id);
      let obj = flowMeshes.get(n.id);
      if (!obj) {
        const tpl = templateFor(n.ship, n.variant, n.color);
        if (!tpl) { if (hullBudget > 0) { hullBudget -= warmPool(1); } continue; }
        const group = instanceOf(tpl, n.scale);
        scene.add(group);
        obj = { id: n.id, group };
        flowMeshes.set(n.id, obj);
      }
      rel(n.x, n.y, n.z, obj.group);
      orientCraft(obj.group, n.yaw ?? 0, n.pitch ?? 0, 0);
      tickHull(obj.group, frameDt, sim.time, { throttle: n.job === "approach" ? 0.35 : 0.9 });
      placeNavLight(navLightFor(n.id, n.color), n.x, n.y, n.z, sim.time, dist3(sim.ship.pos, n));
    }
    for (const [id, obj] of flowMeshes) {
      if (!live.has(id)) {
        scene.remove(obj.group);
        releaseInstance(obj.group);
        flowMeshes.delete(id);
        dropNavLight(id);
      }
    }
  }

  /* Off-screen candidates, reused each HUD pass. There is no far-contact
   * buffer any more: the canopy names nothing it cannot see on sensors, so
   * there is no tier beyond `drawRange()` to rank. */
  const edgeBuf = [];
  const _relById = new Map();  // contact id → relation, rebuilt per HUD pass
  const EDGE_M = 7;            // % inset of an off-screen marker from the edge
  const EDGE_NEAR_R = 70000;   // and anything this close gets one whatever it is
  const _mk = { x: 0, y: 0, on: false, edge: false, a: 0, behind: false };

  /**
   * Project a world point to canopy percentages, and when it falls off the
   * screen — or behind the camera — clamp it to the edge with the bearing to
   * turn toward. `projectPoint` has always computed `behind` and nothing has
   * ever read it; this is what it was for.
   */
  function projectMark(x, y, z) {
    _proj.set(x - origin.x, y - origin.y, z - origin.z).project(camera);
    let nx = _proj.x, ny = _proj.y;
    const behind = _proj.z >= 1;
    /* behind the camera the projection mirrors through the origin, so a
     * contact over your shoulder reads as being in front and on the wrong
     * side. Flip it back, then treat it as off-screen by construction. */
    if (behind) { nx = -nx; ny = -ny; }
    _mk.behind = behind;
    _mk.on = !behind && nx > -0.99 && nx < 0.99 && ny > -0.95 && ny < 0.95;
    if (_mk.on) {
      _mk.edge = false;
      _mk.a = 0;
      _mk.x = (nx * 0.5 + 0.5) * 100;
      _mk.y = (-ny * 0.5 + 0.5) * 100;
      return _mk;
    }
    const m = Math.max(Math.abs(nx), Math.abs(ny));
    const k = m > 1e-6 ? 1 / m : 0;
    const ex = nx * k, ey = ny * k;
    _mk.edge = true;
    _mk.a = Math.atan2(-ey, ex) * 180 / Math.PI;
    _mk.x = Math.min(100 - EDGE_M, Math.max(EDGE_M, (ex * 0.5 + 0.5) * 100));
    _mk.y = Math.min(100 - EDGE_M, Math.max(EDGE_M, (-ey * 0.5 + 0.5) * 100));
    return _mk;
  }

  function projectPoint(x, y, z) {
    _proj.set(x - origin.x, y - origin.y, z - origin.z).project(camera);
    const visible = _proj.z < 1 && _proj.x > -0.99 && _proj.x < 0.99 && _proj.y > -0.95 && _proj.y < 0.95;
    return { x: (_proj.x * 0.5 + 0.5) * 100, y: (-_proj.y * 0.5 + 0.5) * 100, visible, behind: _proj.z >= 1 };
  }

  /** Projects a direction as a point far ahead of the ship. */
  function projectDir(dx, dy, dz) {
    const k = 1e5;
    return projectPoint(origin.x + dx * k, origin.y + dy * k, origin.z + dz * k);
  }

  function tick(timestamp) {
    if (!running) return;
    const now = timestamp || performance.now();
    const raw = now - clock.last;
    const dt = Math.min(raw / 1000, 0.1);
    clock.last = now;
    /* what the last frame actually cost, before anything in this one runs.
     * perf.js keeps a median of these and hands the sky a detail tier, so a
     * device that cannot carry a hundred and thirty hulls at full fidelity
     * sheds the far field rather than the frame rate. */
    notePerf(raw, dt);
    resumeAudioIfNeeded();

    if (sim.phase === "pause") pauseTick();
    else tickSim(dt);

    /* The ambient bed reads the game once a frame and rate-limits itself
     * internally. Everything it needs is gathered here rather than reached
     * for from inside the audio module, so what the sound reacts to is one
     * readable object instead of a web of imports. */
    tickAudio(audioState(), dt);
    tickTutorial(dt);
    tickWorldSync();

    const s = sim.ship;
    const playing = sim.phase !== "menu";

    /* ---- floating origin ---- */
    if (playing) {
      origin.x = s.pos.x;
      origin.y = s.pos.y;
      origin.z = s.pos.z;
    } else if (!attract.place(dt, origin)) {
      /* No world worth framing, or the attract scene is off on a weak
       * device: the old slow circle around the star. */
      const star = starBody();
      const r = (star?.radius ?? 4000) * 26;
      camTheta += dt * (reduced ? 0.01 : 0.03);
      origin.x = Math.cos(camTheta) * r;
      origin.y = r * 0.28;
      origin.z = Math.sin(camTheta) * r;
    }
    if (!playing) attract.step(dt);
    else if (attract.active) attract.stop();

    /* ---- world transforms ---- */
    sun.rotation.y += dt * 0.0012;
    const star = starBody();
    if (star) {
      rel(0, 0, 0, sunGroup);
      const dx = -origin.x;
      const dy = -origin.y;
      const dz = -origin.z;
      const dl = Math.hypot(dx, dy, dz) || 1;
      sunLight.position.set((dx / dl) * 1000, (dy / dl) * 1000, (dz / dl) * 1000);
      sunLight.target.position.set(0, 0, 0);
      sunLight.intensity = 2.7;
    }
    /* a world that took a hit gets rebuilt with its new shape — before the FX of
     * the hit are parented to it, so this frame's spawn lands on the group that stays */
    for (const b of BODIES) {
      if (b.dirty) {
        b.dirty = false;
        rebuildBody(b.id);
      }
    }
    stepImpactFX(playing && sim.phase === "play" ? dt * (sim.timeScale ?? 1) : 0);
    stepEventFX();
    stepBodyRings();
    stepSkyLight();
    for (const p of planets) {
      bodyPosition(p.id, sim.time, _bp);
      rel(_bp.x, _bp.y, _bp.z, p.group);
      /* Axial spin you can notice over an hour, not over a minute. */
      p.group.rotation.y += dt * p.spin * 0.006;
      /* impact heat glows ember-orange and fades as the world radiates it
       * away; a resurfaced world glows from the inside at its own temperature
       * and walks the blackbody curve down as it cools */
      const bb = bodyById(p.id);
      const th = bb?.thermal ?? 0;
      const molten = bb?.moltenGlow ?? 0;
      if (molten > 0.02) {
        p.hot = true;
        const k = 900 + molten * 1400;
        p.mat.emissive.setHex(kelvinHex(k));
        /* enough to read as molten from orbit, not enough to flatten the
         * globe into a featureless disc */
        p.mat.emissiveIntensity = p.baseIntensity + molten * 0.62;
      } else if (th > 10) {
        p.hot = true;
        p.mat.emissive.setHex(0xff5426);
        p.mat.emissiveIntensity = p.baseIntensity + Math.min(0.85, th / 500);
      } else if (p.hot) {
        p.hot = false;
        p.mat.emissive.setHex(p.baseEmissive);
        p.mat.emissiveIntensity = p.baseIntensity;
      }
    }
    for (const c of worldRoot.children) {
      if (c.userData.orbit) rel(0, 0, 0, c);
    }
    for (const b of beacons) {
      const got = sim.beaconsGot.has(b.id);
      b.mesh.visible = !got;
      if (got) continue;
      if (!b.def) continue;
      const p = beaconPosition(b.def, sim.time);
      rel(p.x, p.y, p.z, b.mesh);
      b.mesh.rotation.y += dt * 1.4;
    }
    /* one surface per frame — the sky is flyable while they resolve */
    if (texQueue.length) {
      const job = texQueue.shift();
      sim.texLoad = { done: texTotal - texQueue.length, total: texTotal };
      if (job.mat && !job.mat.__disposed) {
        job.mat.map = makePlanetTexture(
          job.b.kind,
          job.b.color,
          job.b.id.length * 17 + job.b.orbit * 0.003,
          job.b.radius > 1400 ? 384 : 256,
          job.b.arch,
        );
        job.mat.color.setRGB(1, 1, 1);
        job.mat.needsUpdate = true;
      }
    }
    updateStations(dt);
    updateAsteroids(sim.time);
    rockFx.update(frameDt, bodies.values());
    impactFx.update(frameDt);
    holeFx.update(frameDt);
    updateDebris(sim.time);
    updateImpactors(sim.time);
    updateShots();
    updateMiningFX(dt);
    syncContactMeshes();
    updateTractorBeam(sim.time);
    hullBudget = 1;
    frameDt = dt;
    syncRemotes();
    syncTraffic();
    syncFlow();

    stars.position.set(0, 0, 0);

    if (beltHaze) rel(0, 0, 0, beltHaze);
    floods.intensity = sim.ship.lights && sim.ship.powered.ops && playing ? 3.4 : 0;
    if (floods.intensity > 0) {
      const ff = forwardOf(s.yaw, s.pitch);
      floods.position.set(ff.x * 3, ff.y * 3, ff.z * 3);
    }

    /* ---- camera ---- */
    if (playing) camMode = sim.cameraMode ?? camMode;
    ship.visible = playing && camMode === 1;
    if (ship.visible) tickHull(ship, dt, sim.time, { throttle: Math.max(0.04, Math.abs(s.throttle) / Math.max(1e-6, throttleCapOf())) });
    dematerialize(ship, sim.hullFade ?? 0);
    if (playing) {
      orientCraft(ship, s.yaw, s.pitch, s.roll);
      ship.position.set(0, 0, 0);
      if (camMode === 1) {
        /* orbit in the hull frame: forward/right/up of the nose, then the
         * pilot's own yaw/pitch around it, then a pan of the look point */
        const f = forwardOf(s.yaw, s.pitch);
        const u = upOf(s.yaw, s.pitch);
        const r = rightOf(s.yaw);
        const cp = Math.cos(ext.pitch);
        const bx = -Math.cos(ext.yaw) * cp;   // behind the hull at yaw 0
        const bz = Math.sin(ext.yaw) * cp;    // around the side
        const by = Math.sin(ext.pitch);
        const ox = ext.panX, oy = ext.panY;
        const lx = r.x * ox + u.x * oy, ly = r.y * ox + u.y * oy, lz = r.z * ox + u.z * oy;
        camera.position.set(
          lx + (f.x * bx + r.x * bz + u.x * by) * ext.dist,
          ly + (f.y * bx + r.y * bz + u.y * by) * ext.dist,
          lz + (f.z * bx + r.z * bz + u.z * by) * ext.dist,
        );
        camera.up.set(u.x, u.y, u.z);
        camera.lookAt(lx, ly, lz);
        camera.up.set(0, 1, 0);
      } else {
        /* Seat-mounted lens: the camera IS bolted to the hull, a little above
         * and ahead of the centre of mass, so the nose is your line of sight. */
        const f = forwardOf(s.yaw, s.pitch);
        const u = upOf(s.yaw, s.pitch);
        camera.position.set(f.x * 0.38 + u.x * 0.14, f.y * 0.38 + u.y * 0.14, f.z * 0.38 + u.z * 0.14);
        /* The lens is bolted to the hull, so it simply wears the hull's
         * attitude — roll included. Where you look is where the nose is. */
        camera.quaternion.copy(ship.quaternion);
      }
      if (sim.trauma > 0 && !reduced) {
        const sh = sim.trauma * sim.trauma;
        camera.position.x += (Math.random() - 0.5) * sh * 0.5;
        camera.position.y += (Math.random() - 0.5) * sh * 0.5;
      }
      const sp = speedOf(s, sim.frameVel);
      const warping = sim.warp.state === "run";
      const targetFov = warping ? 92 : 62 + Math.min(14, sp * 0.012) + (s.throttle > 1 ? 5 : 0) + (sim.warp.state === "spool" ? -4 : 0);
      camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-3 * dt));
      camera.updateProjectionMatrix();
    } else if (!attract.aim(camera)) {
      camera.position.set(0, 0, 0);
      camera.lookAt(-origin.x, -origin.y, -origin.z);
      camera.fov = 62;
      camera.updateProjectionMatrix();
    }

    /* ---- warp ----
     * After the camera is posed, and deliberately so. The near tunnel layer is
     * parented to the camera's own position and orientation, and at 55,000
     * units a second a frame-old camera leaves it nearly a kilometre astern —
     * which looks exactly like what it is, the tunnel sliding off the back of
     * the ship.
     *
     * `warpStrength` is the core's own progress, eased: spool builds it to a
     * quarter so the sky has visibly begun to move before the core lets go,
     * the run takes it the rest of the way, and a dropout drains it. Every
     * visual below hangs off that one number. */
    const wState = sim.warp.state;
    const wantWarp = wState === "run"
      ? 1
      : wState === "spool"
        ? 0.26 * Math.min(1, sim.warp.t / Math.max(0.001, spoolTime()))
        : 0;
    warpStrength += (wantWarp - warpStrength) * Math.min(1, dt * (wantWarp > warpStrength ? 2.6 : 3.8));
    if (warpStrength < 0.0005) warpStrength = 0;
    camera.updateMatrixWorld(true);
    warpFx.update(dt, camera, warpStrength, wState, perf.tier >= 3 ? 1 : perf.tier === 2 ? 0.7 : 0.4);
    /* the resting point-sky gives way to its own streaks rather than sitting
     * underneath them as a second set of heads */
    stars.material.opacity = 0.9 * (1 - Math.min(1, warpStrength * 2.2));
    stars.visible = stars.material.opacity > 0.02;
    /* a hull under lane drive leaves a wake whether or not YOU are warping:
     * it is how traffic crossing the system reads at a glance */
    warpFx.updateWakes(traffic, origin);
    if (flashEl) flashEl.style.opacity = warpFx.flash > 0.002 ? String(warpFx.flash * 0.8) : "0";

    /* ---- survey pulse ---- */
    if (sim.pulse > 0 && sim.selected) {
      const body = bodyById(sim.selected);
      bodyPosition(sim.selected, sim.time, _bp);
      const sc = (body?.radius ?? 100) * (1.6 + (1 - sim.pulse) * 4);
      rel(_bp.x, _bp.y, _bp.z, pulseRing);
      pulseRing.scale.setScalar(sc);
      pulseRing.quaternion.copy(camera.quaternion);
      pulseRing.material.opacity = sim.pulse * 0.5;
      pulseRing.visible = true;
    } else {
      pulseRing.visible = false;
    }

    /* ---- HUD ---- */
    camera.updateMatrixWorld(true);
    hudAcc += dt;
    if (hudAcc > 0.07) {
      hudAcc = 0;
      refreshOwnHull();
      const labels = [];
      if (playing) {
        for (const b of BODIES) {
          bodyPosition(b.id, sim.time, _bp);
          const d = dist3(s.pos, _bp);
          const show = b.id === sim.selected || d < scanRadius(b) * 14;
          if (!show) continue;
          const pr = projectPoint(_bp.x, _bp.y + b.radius * 1.15, _bp.z);
          if (!pr.visible) continue;
          labels.push({ id: b.id, name: b.name, x: pr.x, y: pr.y, kind: "body", dist: d });
        }
        for (const r of sim.remotes.values()) {
          const d = dist3(s.pos, r);
          const pr = projectPoint(r.x, r.y + 8, r.z);
          if (!pr.visible || d > 95000) continue;
          labels.push({ id: r.id, name: r.name, x: pr.x, y: pr.y, kind: "peer", dist: d });
        }
        for (const c of contacts) {
          if (c.kind !== "drone") continue;
          const d = dist3(s.pos, c);
          if (d > 14000) continue;
          const pr = projectPoint(c.x, c.y + 14, c.z);
          if (!pr.visible) continue;
          labels.push({ id: c.id, name: `${c.name} ${Math.round(d)}u`, x: pr.x, y: pr.y, kind: "hostile", dist: d });
        }
        /* ---- the working sky, and what the canopy may say about it ----
         *
         * The canopy is the ship's own smart HUD: the scanner and the comms
         * array, drawn on the glass. So it reports what those two actually
         * have, and nothing else. It used to read the roster directly and
         * name every hull in range whether or not you had ever looked at one.
         *
         * The scanner (contacts.js) runs two beams at once and the canopy
         * shows both:
         *
         *   BROAD   everything in range, immediately: a relation colour, the
         *           hull class once it has one, and the kind bracket. Never a
         *           name — the wide sweep is capped below identification.
         *   FOCUS   one contact at a time, wherever you are pointing. That is
         *           the only thing that turns "freighter" into a name, and a
         *           hull stays named afterwards for as long as it is in range.
         *
         * A contact the scanner has nothing on gets nothing drawn. That is
         * the point: an empty canopy means the array has not found anything,
         * not that the sky is empty.
         */
        edgeBuf.length = 0;
        const nameR = drawRange();
        /* relation comes off the contact board, which already resolves role,
         * corp standing and any flag you set by hand into one word. Every hull
         * the canopy can label is inside CONTACT_R, so it is always there. */
        _relById.clear();
        for (const c of contacts) if (c.relation) _relById.set(c.id, c.relation);
        const beam = scanFocus();

        for (const n of traffic) {
          if (n.visible === false) continue;
          const d = dist3(s.pos, n);
          if (d > nameR) continue;
          const view = contactView(n.id);
          if (!view) continue;                       // the array has nothing on it yet

          const rel = _relById.get(n.id)
            ?? (HOSTILE_ROLES.has(n.role) ? "hostile" : LAW_ROLES.has(n.role) ? "ally" : "neutral");
          const kind = rel === "hostile" ? "hostile" : rel === "ally" ? "allied" : "neutral";
          const fighting = n.job === "engaged" || n.job === "fleeing" || n.job === "responding" || n.job === "hunting";
          const tag = hullTag(n);

          const pr = projectMark(n.x, n.y + 12, n.z);
          if (pr.on) {
            /* a named contact earns its range readout; an unnamed return is
             * just a class, and putting a precise distance on something you
             * cannot even identify reads as knowing more than you do */
            const range = view.named ? ` · ${d < 10000 ? `${Math.round(d)} u` : `${Math.round(d / 100)} km`}` : "";
            labels.push({
              id: n.id,
              name: `${view.label}${fighting && view.level >= 2 ? " ⚔" : ""}${range}`,
              tag,
              x: pr.x, y: pr.y, dist: d,
              kind: `${kind}${view.named ? "" : " faint"}${view.focused ? " beam" : ""}`,
            });
            continue;
          }
          if (kind === "hostile" || fighting || d < EDGE_NEAR_R || sim.lock?.id === n.id) {
            edgeBuf.push({
              id: n.id, name: view.named ? n.name.split(" ")[0] : view.label, tag,
              x: pr.x, y: pr.y, a: pr.a, kind: `edge ${kind}`, dist: d,
              rank: (sim.lock?.id === n.id ? 4000 : 0) + (kind === "hostile" ? 900 : 0) + (fighting ? 700 : 0) - d / 2000,
            });
          }
        }
        /* The rim is 412 pixels wide on the device this is played on. Twenty
         * arrows around it is not situational awareness, it is a border — so
         * only the few that would change what you do next get one. */
        edgeBuf.sort((a, b) => b.rank - a.rank);
        const edgeCap = perf.tier >= 2 ? 7 : 4;
        for (let i = 0; i < edgeBuf.length && i < edgeCap; i++) labels.push(edgeBuf[i]);
        /* your drones by name and what they are doing; the corporations' by flag */
        for (const u of droneOps.units) {
          if ((u.dockedAt && !u.bay) || u.state === "setup") continue;
          const d = dist3(s.pos, u);
          if (d > drawRange()) continue;
          const pr = projectPoint(u.x, u.y + 10, u.z);
          if (!pr.visible) continue;
          labels.push({ id: u.id, name: `▹ ${u.name} · ${u.note}${d < 20000 ? ` · ${Math.round(d)} u` : ""}`, x: pr.x, y: pr.y, kind: "drone", dist: d });
        }
        for (const u of npcDrones.units) {
          if (u.dockedAt && !u.bay) continue;
          const d = dist3(s.pos, u);
          if (d > drawRange() * 0.6) continue;
          const pr = projectPoint(u.x, u.y + 10, u.z);
          if (!pr.visible) continue;
          labels.push({ id: u.id, name: `▹ ${u.name}${d < 8000 ? ` · ${u.note}` : ""}`, x: pr.x, y: pr.y, kind: u.hostile ? "hostile" : "cdrone", dist: d });
        }
        /* the heartbeat: a boat on the board is a ship with a name; its manifest reads inside 1.5 km */
        /* Port shuttles. Two rules they did not used to obey:
         *
         *   - a boat is only labelled if it HAS A HULL DRAWN. `syncFlow` skips
         *     the mesh when the pool has not warmed yet, and the label loop
         *     did not care — so a port ringed with boats showed a crowd of
         *     names with nothing under them. If there is no hull, there is no
         *     label; the array is reporting what is there, not what the sim
         *     knows about.
         *   - and they go through the scanner like everything else. A shuttle
         *     is `[D]`: it belongs to its port, it flies a fixed loop, it goes
         *     home, and nobody is filed as its captain. */
        for (const n of flow) {
          if (!n.visible) continue;
          if (!flowMeshes.has(n.id)) continue;
          const d = dist3(s.pos, n);
          if (d > 6000) continue;
          const pr = projectPoint(n.x, n.y + 10, n.z);
          if (!pr.visible) continue;
          const view = contactView(n.id);
          if (!view) continue;
          const near = d < 1500 && view.named;
          const range = view.named ? ` · ${d < 1000 ? `${Math.round(d)} u` : `${(d / 100).toFixed(1)} km`}` : "";
          labels.push({
            id: n.id,
            name: `▹ ${view.named ? n.name : view.label}${near ? ` · ${n.hullName} · ${n.manifest}` : ""}${range}`,
            tag: "D",
            x: pr.x, y: pr.y, dist: d,
            kind: `${near ? "flow near" : "flow"}${view.named ? "" : " faint"}${view.focused ? " beam" : ""}`,
          });
        }
        /* a live engagement: marked wherever it is, so you can go and join it */
        const eng = sim.engagement;
        if (eng && sim.time < eng.end) {
          const fc = fightCentre(eng);
          const d = dist3(s.pos, fc);
          const pr = projectPoint(fc.x, fc.y + 120, fc.z);
          if (pr.visible) labels.push({ id: eng.id, name: `⚔ ENGAGEMENT · ${eng.victimName} · ${Math.round(d / 100)} km${eng.joined ? " · YOU ARE IN IT" : ""}`, x: pr.x, y: pr.y, kind: "fight", dist: d });
        }
        for (const st of stations) {
          const d = dist3(s.pos, st);
          if (d > (sim.time < sim.pulseUntil ? 260000 : 60000)) continue;
          const pr = projectPoint(st.x, st.y + st.radius * 1.6, st.z);
          if (!pr.visible) continue;
          labels.push({
            id: st.id,
            name: `${st.name} · ${Math.round(d / 100)} km`,
            x: pr.x, y: pr.y,
            kind: st.hostile ? "hostile" : "port",
            dist: d,
          });
        }
        /* a collapsed star is labelled from anywhere in the system: it is the one
         * thing out there you most need to know the direction of */
        for (const h of holes) {
          const d = dist3(s.pos, h);
          const pr = projectPoint(h.x, h.y + h.rs * 6, h.z);
          if (!pr.visible) continue;
          labels.push({ id: h.id, name: `◉ ${h.name} · ${Math.round(d / 100)} km`, x: pr.x, y: pr.y, kind: "hostile", dist: d });
        }
        for (const m of impactors) {
          const d = dist3(s.pos, m);
          if (d > 90000) continue;
          const pr = projectPoint(m.x, m.y + m.r * 1.2, m.z);
          if (!pr.visible) continue;
          labels.push({ id: m.id, name: `${m.name} · ${Math.round(d / 100)} km`, x: pr.x, y: pr.y, kind: "rock", dist: d });
        }
        for (const b of BEACONS) {
          if (sim.beaconsGot.has(b.id)) continue;
          const p = beaconPosition(b, sim.time);
          const d = dist3(s.pos, p);
          if (d > 22000) continue;
          const pr = projectPoint(p.x, p.y + 60, p.z);
          if (!pr.visible) continue;
          labels.push({ id: b.id, name: b.name, x: pr.x, y: pr.y, kind: "beacon", dist: d });
        }
      }

      /* Flight markers: prograde, retrograde, commanded heading, target. */
      const markers = [];
      if (playing && camMode === 0) {
        const fv = sim.frameVel;
        const rvx = s.vel.x - fv.x;
        const rvy = s.vel.y - fv.y;
        const rvz = s.vel.z - fv.z;
        const sp = Math.hypot(rvx, rvy, rvz);
        if (sp > 0.6) {
          const pg = projectDir(rvx / sp, rvy / sp, rvz / sp);
          if (pg.visible) markers.push({ kind: "prograde", x: pg.x, y: pg.y });
          const rg = projectDir(-rvx / sp, -rvy / sp, -rvz / sp);
          if (rg.visible) markers.push({ kind: "retrograde", x: rg.x, y: rg.y });
        }
        const af = forwardOf(s.aimYaw, s.aimPitch);
        const am = projectDir(af.x, af.y, af.z);
        if (am.visible) markers.push({ kind: "aim", x: am.x, y: am.y });
        if (turretAim.combat) {
          const tp = projectPoint(turretAim.combat.x, turretAim.combat.y, turretAim.combat.z);
          if (tp.visible) markers.push({ kind: turretAim.hasTarget ? "engaged" : "tracked", x: tp.x, y: tp.y });
        }
        if (mining.active) {
          const mp = projectPoint(mining.x, mining.y, mining.z);
          if (mp.visible) markers.push({ kind: "mining", x: mp.x, y: mp.y });
        }
        if (sim.lock.id) {
          const lp = { x: 0, y: 0, z: 0 };
          if (targetPosition(sim.lock.kind, sim.lock.id, lp)) {
            const lm = projectPoint(lp.x, lp.y, lp.z);
            if (lm.visible) {
              markers.push({ kind: "lock", x: lm.x, y: lm.y, pct: sim.lock.locked ? null : sim.lock.progress });
            }
          }
        }
        const wp = activeWaypoint();
        if (wp) {
          waypointPosition(wp, _bp);
          const wpp = projectPoint(_bp.x, _bp.y, _bp.z);
          if (wpp.visible) markers.push({ kind: "waypoint", x: wpp.x, y: wpp.y });
        }
      }

      const plots = BODIES.filter((b) => !b.parent).map((b) => {
        bodyPosition(b.id, sim.time, _bp);
        return { id: b.id, x: _bp.x, z: _bp.z, r: b.orbit || (starBody()?.radius ?? 4000) };
      });
      publishHud(labels, plots);
      window.__lgMarkers = markers;
    }

    /* Bloom only while there is something to bloom. Idle, this is byte for
     * byte the plain render it always was; in a tunnel it is two extra
     * full-screen passes, and perf.js decides whether the device can have
     * them at all. */
    bloom.setThreshold(warpStrength > 0.05 ? 0.42 : 0.62, 0.65);
    /* a lensed disk is the one thing outside a warp tunnel that wants to bleed */
    const lensPass = holeFx.lens();
    bloom.render(Math.max(Math.min(1.35, warpFx.bloom * 1.35), lensPass ? 0.55 : 0), lensPass);
  }

  /* dev handle — handy when the sky looks wrong */
  window.__lgGL = { scene, camera, renderer, worldRoot, sunGroup, sun, planets, origin, asteroids, rockBuckets, dust, bodies, assayFor, impBodies, rogueAssay, rockQuality, growerStats, stars, rockFx, impactFx, holeFx, bloom, get bodyDetail() { return bodyDetail; } };

  /* The title card used to look out on an empty starfield: the menu camera sat
   * twenty-six star-radii out and aimed at the barycentre, so every world in
   * the sky rendered at under a pixel. The attract director reframes that same
   * scene onto the best world in it and hangs one real forged hull in the
   * foreground. It owns only what it adds, and it comes down the moment the
   * sim launches. */
  const attract = mountAttract({ scene, camera, canvas, worldRoot, reduced, quality: attractQuality, shellRadius: STAR_SHELL });
  window.__lgAttract = attract;

  renderer.setAnimationLoop(tick);

  return () => {
    running = false;
    renderer.setAnimationLoop(null);
    unbind();
    if (sim.onSystemChange === rebuildWorld) sim.onSystemChange = () => {};
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    ro.disconnect();
    attract.dispose();
    if (window.__lgAttract === attract) delete window.__lgAttract;
    disposeObject(scene);
    glowTex.dispose();
    ringTex.dispose();
    engineDisposed = true;
    for (const b of rockBuckets) { for (const m of b.lods) m.dispose(); b.mount?.dispose(); }
    dustGeo.dispose();
    for (const key of [...bodies.keys()]) releaseBody(key);
    for (const id of [...impBodies.keys()]) releaseImpactorBody(id);
    rockFx.dispose();
    impactFx.dispose();
    holeFx.dispose();
    beaconGeo.dispose();
    chunkGeo.dispose();
    renderer.dispose();
    if (window.__lg) delete window.__lg;
  };
}
