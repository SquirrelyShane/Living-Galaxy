import * as THREE from "../../vendor/three.module.min.js";
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
} from "../world/bodies.js";
import { remnantRadius } from "../world/scale.js";
import { makeGlowTexture, makePlanetTexture, makeRingTexture, planetPainter } from "../world/textures.js";
import { rockLook } from "../world/rockgen.js";
import { BAKE, rogueParams } from "../bodygen/body.js";
import { CLASSES } from "../bodygen/classes.js";
import { mountBakedData, bakedMaterial } from "../bodygen/baked.js";
import { grow, peek, pump, cancel as cancelGrowth, growerStats } from "../bodygen/grower.js";
import { makeRockFx } from "./rockfx.js";
import { makeImpactFx } from "./impactfx.js";
import { makeHoleFx } from "./holefx.js";
import { holes } from "../world/events/holes.js";
import { acquireLock, activeWaypoint, currentShipId, pauseTick, publishHud, sensorRange, sim, spoolTime, targetPosition, tickSim, waypointPosition, wireControlsTest } from "../sim/sim.js";
import { addLook, bindInput } from "../core/input.js";
import { mountAttract } from "./attract.js";
import { resumeAudioIfNeeded, tickAudio } from "../audio/index.js";
import { batteryCap, forwardOf, rightOf, speedOf, upOf } from "../flight/ship.js";
import { forgeShip, tickHull } from "../ships/shipforge.js";
import { droneFor, droneBudget, releaseDrones, releaseDrone } from "../drones/droneforge.js";
import { probes } from "../flight/probes.js";
import { droneOps } from "../drones/ops.js";
import { npcDrones } from "../drones/npcdrones.js";
import { DEFAULT_SHIP_ID, shipById } from "../ships/shipdb.js";
import { inBelt, nearbyRocks, brokenRocks } from "../world/field.js";
import { contacts, mining, shots, turretAim } from "../flight/turrets.js";
import { stationLane, lanePoint, laneCentre, spreadAt, beadLit, laneDistance, LANE_BEADS, LANE_DRAW_R, SUBLANES, ZONE_HALF_W, ZONE_HALF_H } from "../npc/lanes.js";
import { ensureBuilt } from "../station/stationyard.js";
import { tractor } from "../station/stationworks.js";
import { tick as tickStation } from "../stationgen/anim.js";
import { notePerf, perf } from "../core/perf.js";
import { contactView, hullTag, scanFocus } from "../flight/contacts.js";
import { makeBloom } from "./postfx.js";
import { makeWarpFx } from "./warpfx.js";
import { flow } from "../npc/flow.js";
import { templateFor, warm as warmPool, instanceOf, releaseInstance, drainPool } from "./hullpool.js";
import { fightCentre } from "../npc/battles.js";
import { traffic, HOSTILE_ROLES, LAW_ROLES } from "../npc/traffic.js";
import { tickWorldSync, wireWorldSyncTest } from "../net/worldsync.js";
import { chunks } from "../world/debris.js";
import { hulks, hulkById, HULK, HULK_PARTS } from "../world/hulks.js";
import { rig } from "../flight/rig.js";
import { dirFbm, dirNoise, kelvinHex } from "../world/events/cataclysm.js";
import { tickTutorial, wireTutorialTest } from "../ui/tutorial.js";
import { impactors } from "../world/events/impactors.js";
import { stations } from "../station/stations.js";
import { SECTORS } from "../economy/materials.js";
import { loadAria, wireAria } from "../aria/aria.js";

const _f = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _right = new THREE.Vector3();
const _shipUp = new THREE.Vector3();
const _proj = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _wbox = new THREE.Box3();
const _wc = new THREE.Vector3();
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
const MAX_SCRAP = 160;
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
  m.__disposed = true;
}

function hexColor(hex) {
  return new THREE.Color(hex);
}

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
  const def = shipById(shipId) ?? shipById(DEFAULT_SHIP_ID);
  const g = forgeShip(def, seed, { primary: color, detail });
  g.scale.multiplyScalar(scale);
  return g;
}

const PART_IDS = new Set(Object.values(HULK_PARTS).flat());
let hullBudget = 1;
const drawRange = () => sensorRange();
const MESH_K = [0.45, 0.6, 0.8, 1];
const meshRange = () => drawRange() * (MESH_K[perf.tier] ?? 1);
const ROCK_DRAW_R = 12000;
const ROCK_FADE = 3000;
let frameDt = 1 / 60;
const throttleCapOf = () => 1;

function orientCraft(group, yaw, pitch, roll) {
  const f = forwardOf(yaw, pitch);
  _f.set(-f.x, -f.y, -f.z);
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

  const origin = { x: 0, y: 0, z: 0 };
  const rel = (x, y, z, obj) => obj.position.set(x - origin.x, y - origin.y, z - origin.z);

  const ambient = new THREE.HemisphereLight(0x9fb2cc, 0x0a0d14, 0.16);
  scene.add(ambient);
  const fill = new THREE.AmbientLight(0x8f9bb0, 0.075);
  scene.add(fill);
  const sunLight = new THREE.DirectionalLight(0xffe8cc, 2.7);
  sunLight.position.set(1, 0.4, 0);
  scene.add(sunLight);
  scene.add(sunLight.target);

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
        }, () => {});
    }
  }
  const asteroids = { get count() { return rockBuckets.reduce((s, b) => s + b.lods.reduce((n, m) => n + m.count, 0), 0); }, buckets: rockBuckets };
  const PROTO_LOD_ANG = [0.1, 0.03];
  const LOD_HYST = 1.2;
  const lodMemo = new Map();

  const grown = new Set();
  const near = [];
  const BODY_R = 3400;
  const BODY_MIN_R = 55;
  const BODY_KEEP = 0.34;
  const BODY_FAR = 1.45;
  const BODY_HOLD = 1.5;
  const bodies = new Map();
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

  const shotGeo = new THREE.BufferGeometry();
  const shotPos = new Float32Array(MAX_SHOTS * 3);
  shotGeo.setAttribute("position", new THREE.BufferAttribute(shotPos, 3));
  const shotMesh = new THREE.Points(
    shotGeo,
    new THREE.PointsMaterial({ color: 0xffd08a, size: 3.4, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false }),
  );
  shotMesh.frustumCulled = false;
  scene.add(shotMesh);

  const BEAM_SEGS = 8;
  const beamSegGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  beamSegGeo.rotateX(Math.PI / 2);
  beamSegGeo.userData.keep = true;
  const beamGroup = new THREE.Group();
  beamGroup.visible = false;
  scene.add(beamGroup);
  const beamSegs = [];
  for (let i = 0; i < BEAM_SEGS; i++) {
    const outer = new THREE.Mesh(beamSegGeo, new THREE.MeshBasicMaterial({ color: 0xff7a36, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const core = new THREE.Mesh(beamSegGeo, new THREE.MeshBasicMaterial({ color: 0xfff6e2, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }));
    core.scale.set(0.34, 0.34, 1.001);
    outer.add(core);
    outer.frustumCulled = false;
    core.frustumCulled = false;
    beamGroup.add(outer);
    beamSegs.push({ outer, core });
  }
  const laser = { on: false, fade: 0, t: 0, from: { x: 0, y: 0, z: 0 }, to: { x: 0, y: 0, z: 0 }, hit: { x: 0, y: 0, z: 0 }, dir: { x: 0, y: 0, z: 1 } };

  const MAX_CHIPS = 160;
  const chipPos = new Float32Array(MAX_CHIPS * 3);
  const chipVel = new Float32Array(MAX_CHIPS * 3);
  const chipAge = new Float32Array(MAX_CHIPS).fill(-1);
  const chipLife = new Float32Array(MAX_CHIPS);
  const chipGeo = new THREE.BufferGeometry();
  chipGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_CHIPS * 3), 3));
  const chipMesh = new THREE.Points(chipGeo, new THREE.PointsMaterial({ color: 0xe8b07a, size: 2.6, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false }));
  chipMesh.frustumCulled = false;
  chipMesh.visible = false;
  scene.add(chipMesh);
  let chipAcc = 0;

  const MAX_PUFFS = 14;
  const puffs = [];
  for (let i = 0; i < MAX_PUFFS; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9a918a, transparent: true, opacity: 0, depthWrite: false }));
    sp.visible = false;
    scene.add(sp);
    puffs.push({ sp, age: -1, life: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 });
  }
  let puffAcc = 0;

  const chunkGeo = new THREE.IcosahedronGeometry(1, 0);
  chunkGeo.userData.keep = true;
  const chunkMat = new THREE.MeshStandardMaterial({ color: 0x6f6862, roughness: 0.98, metalness: 0.05, flatShading: true });
  chunkMat.userData.keep = true;
  const debrisMesh = new THREE.InstancedMesh(chunkGeo, chunkMat, MAX_CHUNKS);
  debrisMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  debrisMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_CHUNKS * 3).fill(1), 3);
  debrisMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  debrisMesh.count = 0;
  debrisMesh.frustumCulled = false;
  scene.add(debrisMesh);

  const scrapGeo = new THREE.BoxGeometry(2.2, 0.16, 1.4);
  scrapGeo.userData.keep = true;
  const scrapMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.6, flatShading: true, emissive: 0x231b15, emissiveIntensity: 1 });
  scrapMat.userData.keep = true;
  const scrapMesh = new THREE.InstancedMesh(scrapGeo, scrapMat, MAX_SCRAP);
  scrapMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scrapMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_SCRAP * 3).fill(1), 3);
  scrapMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  scrapMesh.count = 0;
  scrapMesh.frustumCulled = false;
  scene.add(scrapMesh);
  const SCRAP_PLATE = new THREE.Color(0x9a8f84), SCRAP_PART = new THREE.Color(0x8fc6d6), SCRAP_CARGO = new THREE.Color(0xd9a441);

  const impBodies = new Map();

  const ROGUE_CLASSES = ["S", "S", "S", "C", "C", "C", "M", "M", "X", "B", "V", "P", "D", "E"];
  const rogueClass = (m) => m.cls ?? ROGUE_CLASSES[Math.min(ROGUE_CLASSES.length - 1, Math.floor((m.seed ?? 0.5) * ROGUE_CLASSES.length))];

  const _seenDrone = new Set();
  const _seenProbe = new Set();
  const stationMeshes = new Map();
  const flowMeshes = new Map();
  const navLights = new Map();
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
  function placeNavLight(L, x, y, z, t, d, floor = 3.5) {
    const sz = Math.max(floor, d * 0.011);
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
  const LAMP_FULL_R = 6000;
  const LAMP_OUT_R = 24000;
  const lampLevel = (d) => {
    if (d <= LAMP_FULL_R) return 1;
    if (d >= LAMP_OUT_R) return 0;
    const u = 1 - (d - LAMP_FULL_R) / (LAMP_OUT_R - LAMP_FULL_R);
    return u * u;
  };
  const STATION_ANIM_R = 45000;
  const STATION_DRAW_R = 400000;
  function makeStation(st) {
    const holder = new THREE.Group();
    holder.name = `port:${st.id}`;
    const gen = ensureBuilt(st, sim.skySeed);
    holder.add(gen.root);
    const proxy = new THREE.Mesh(new THREE.SphereGeometry(Math.max(20, st.radius), 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    proxy.userData.stationId = st.id;
    holder.add(proxy);
    holder.userData = { stationId: st.id, proxy };
    return holder;
  }
  function dropProxy(holder) {
    const proxy = holder.userData?.proxy;
    if (!proxy) return;
    proxy.geometry.dispose();
    proxy.material.dispose();
    const i = pickables.indexOf(proxy);
    if (i >= 0) pickables.splice(i, 1);
  }

  const laneRigs = new Map();
  const LANE_COL = { entry: new THREE.Color(0x4fd8b8), exit: new THREE.Color(0xffa040) };
  const LANE_STEPS = 18;
  const LANE_SHOW_R = LANE_DRAW_R;
  const LANE_FULL_R = LANE_DRAW_R * 0.6;
  function makeLanes(st) {
    const g = new THREE.Group();
    const col = new THREE.Color(SECTORS[st.sector]?.colour ?? "#9aa4b2");
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
    const strings = [];
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
    if (!sim.ui?.lanesDrawn) { for (const [, g] of laneRigs) g.visible = false; return; }
    for (const [id, g] of laneRigs) {
      const st = stations.find((s) => s.id === id);
      if (!st) continue;
      rel(st.x, st.y, st.z, g);
      g.rotation.y = st.yaw ?? 0;
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

  const floods = new THREE.PointLight(0xdfe8f5, 0, 4200, 1.4);
  scene.add(floods);

  const droneMeshes = new Map();
  const probeMeshes = new Map();
  const workMeshes = new Map();
  const activeFX = [];
  const eventRigs = new Map();
  const bodyRings = new Map();

  function clearWorld() {
    for (const [, m] of stationMeshes) { scene.remove(m); dropProxy(m); }
    stationMeshes.clear();
    for (const fx of activeFX) for (const part of fx.parts) { fx.group.remove(part.mesh); if (part.mesh.material) { part.mesh.material.map = null; part.mesh.material.dispose(); } }
    activeFX.length = 0;
    for (const rig of [...eventRigs.values()]) disposeRig(rig);
    for (const [, m] of bodyRings) { m.parent?.remove(m); m.geometry.dispose(); m.material.dispose(); }
    bodyRings.clear();
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
    dropCloseUp();
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

  const texQueue = [];
  let texTotal = 0;
  const texCache = new Map();
  let texCacheSky = null;

  const CLOSE_IN = 8, CLOSE_OUT = 11;
  const closeUp = { id: null, painter: null, tex: null, base: null };
  const _cu = { x: 0, y: 0, z: 0 };
  function dropCloseUp() {
    if (!closeUp.id) return;
    const p = planets.find((x) => x.id === closeUp.id);
    if (p && closeUp.tex && p.mat.map === closeUp.tex) { p.mat.map = closeUp.base; p.mat.needsUpdate = true; }
    closeUp.tex?.dispose();
    closeUp.id = null; closeUp.painter = null; closeUp.tex = null; closeUp.base = null;
    sim.closeUpSkin = null;
  }
  function stepCloseUp() {
    const dom = sim.phase !== "menu" && perf.tier >= 2 ? sim.dominant : null;
    let near = false;
    if (dom && dom.kind !== "star" && !dom.shattered && bodyPosition(dom.id, sim.time, _cu)) {
      const d = Math.hypot(_cu.x - sim.ship.pos.x, _cu.y - sim.ship.pos.y, _cu.z - sim.ship.pos.z) / Math.max(1, dom.radius);
      near = d < (closeUp.id === dom.id ? CLOSE_OUT : CLOSE_IN);
    }
    if (closeUp.id && (!near || closeUp.id !== dom.id)) dropCloseUp();
    if (!near || texQueue.length) return;
    const p = planets.find((x) => x.id === dom.id);
    if (!p) return;
    if (!closeUp.id) {
      const a = texArgs(dom);
      closeUp.id = dom.id;
      closeUp.painter = planetPainter(a[0], a[1], a[2], 768, a[4]);
    }
    if (closeUp.tex) return;
    sim.closeUpSkin = { id: dom.id, px: closeUp.painter.size * 2, painting: closeUp.painter.progress };
    if (closeUp.painter.step(perf.tier >= 3 ? 4 : 2)) {
      closeUp.tex = closeUp.painter.texture;
      closeUp.base = p.mat.map;
      p.mat.map = closeUp.tex;
      p.mat.color.setRGB(1, 1, 1);
      p.mat.needsUpdate = true;
      sim.closeUpSkin = { id: dom.id, px: closeUp.painter.size * 2, painting: 1 };
    }
  }
  const texArgs = (b) => [b.kind, b.color, b.id.length * 17 + b.orbit * 0.003, b.radius > 1400 ? 384 : 256, b.arch];
  const texKey = (b) => { const a = texArgs(b); return `${a[0]}|${a[1]}|${a[2]}|${a[3]}|${a[4] ? JSON.stringify(a[4]) : ""}`; };
  function texCacheFor(sky) {
    if (sky === texCacheSky) return;
    for (const t of texCache.values()) t.dispose();
    texCache.clear();
    texCacheSky = sky;
  }

  function surfJag(seed, nx, ny, nz) {
    return dirNoise(seed, nx, ny, nz, 4);
  }

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
        const rough = c.rough ?? 1;
        const j = surfJag(c.seed ?? 7, nx, ny, nz) * rough;
        if (u < 1) {
          disp -= (1 - u * u) * depth * (1 + j * 0.3);
          scorch += (1 - u * 0.8) * Math.min(1, depth * 5);
        } else {
          const w = 1 - (u - 1) / 0.4;
          const lip = Math.sin(w * Math.PI * 0.5);
          disp += depth * 0.22 * lip * (0.7 + j * 0.6);
          scorch += w * 0.25 * Math.min(1, depth * 5);
        }
      }
      if (disp !== 0) {
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
    const cachedMap = keepMap ? null : texCache.get(texKey(b));
    if (keepMap) {
      mat.map = keepMap;
    } else if (cachedMap) {
      mat.map = cachedMap;
      mat.color.setRGB(1, 1, 1);
    } else {
      texQueue.push({ b, mat });
      texTotal = Math.max(texTotal, texQueue.length);
      sim.texLoad = { done: texTotal - texQueue.length, total: texTotal };
    }
    const seg = cratered || b.shattered ? 96 : b.radius > 1600 ? 64 : 44;
    const drawR = remnantRadius(b);
    if (b.scarred) {
      mat.color.multiplyScalar(Math.max(0.45, 1 - b.scarred * 0.35));
      mat.roughness = Math.min(1, mat.roughness + b.scarred * 0.2);
    }
    if (keepMap) mat.color.setRGB(1, 1, 1);
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
      beacons.push({ id: b.id, mesh, def: b });
    }
  }

  function rebuildBody(id) {
    const idx = planets.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const old = planets[idx];
    worldRoot.remove(old.group);
    for (const fx of activeFX) if (fx.group === old.group) for (const part of fx.parts) old.group.remove(part.mesh);
    for (const rig of eventRigs.values()) if (rig.host === old.group) old.group.remove(rig.group);
    const ring = bodyRings.get(id);
    if (ring && ring.parent === old.group) old.group.remove(ring);
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
    texCacheFor(sim.skySeed);
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

  let beltHaze = null;
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

    if (ev.tier === "cataclysm" && !ev.outcome) {
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

    const core = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffffff, transparent: true, opacity: 1,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    group.add(core);
    rig.parts.core = core;

    const plume = new THREE.Mesh(evShellGeo, shellMat(0xfff0d8, 0.55, 1.6));
    group.add(plume);
    rig.parts.plume = plume;

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

  function stepBodyRings() {
    for (const b of BODIES) {
      if (!b.ring) continue;
      let m = bodyRings.get(b.id);
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
      const st = b.ring.settle ?? 0;
      m.material.opacity = Math.max(0, (st - 0.25) / 0.75) * 0.5;
      m.visible = m.material.opacity > 0.01;
    }
  }

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
      l.distance = Math.max(g.radius * 900, 400000);
      l.intensity = g.lum * (g.kind === "supernova" ? 22 : 8);
      l.decay = 1.15;
    }
    const lift = sim.skyLift ?? 0;
    renderer.toneMappingExposure = baseExposure * (1 + lift * 0.3);
    ambient.intensity = baseAmbient + lift * 0.28;
    if (glows[0]) {
      _ambTint.setHex(glows[0].hex);
      ambient.color.setHex(0x9fb2cc).lerp(_ambTint, Math.min(0.7, lift));
    } else if (ambient.color.getHex() !== 0x9fb2cc) {
      ambient.color.setHex(0x9fb2cc);
    }

    const g0 = glows[0];
    if (!g0 || lift < 0.005) {
      sim.glare = null;
    } else {
      _glareV.set(g0.x - origin.x, g0.y - origin.y, g0.z - origin.z).applyMatrix4(camera.matrixWorldInverse);
      const behind = _glareV.z > 0;
      const lat = Math.hypot(_glareV.x, _glareV.y) || 1e-6;
      const off = Math.atan2(lat, -_glareV.z) / Math.PI;
      const ux = _glareV.x / lat;
      const uy = _glareV.y / lat;
      const reach = Math.min(1, off * 2.1);
      const centre = behind ? 1 - Math.min(1, (off - 0.5) * 2.4) : 1;
      sim.glare = {
        x: 50 + ux * 62 * reach * centre,
        y: 50 - uy * 62 * reach * centre,
        hex: g0.hex,
        lum: lift * (behind ? 0.55 : 0.85),
      };
    }
  }

  function audioState() {
    const s0 = sim.ship;
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
  let camMode = 0;

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
        acquireLock({ kind: "station", id: stId });
        return;
      }
      const id = hits[0].object.userData.bodyId;
      if (id) {
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
    }
    if (sim.phase === "play" && dragDist < 7) pickAt(downX, downY);
  }
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  const _rcol = new THREE.Color();

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

  const bakeTier = bodyBudget >= 18 ? "high" : bodyBudget >= 10 ? "full" : bodyBudget > 0 ? "low" : "off";
  const beltBake = BAKE.belt[bakeTier];
  const rogueBake = BAKE.rogue[bakeTier];
  const bodyDetail = beltBake.H;
  const rogueKey = (m) => `rogue:${m.id}:${Math.round(m.r)}:${rogueBake.H}`;

  const shapes = new Map();
  const shapeKey = (b) => `shape:${b.cls}:${b.v}:${beltBake.H}`;
  const bucketOf = (rock) => protoIndex.get(`${CLASSES[rock.cls] ? rock.cls : "S"}:${Math.floor((rock.seed ?? 0.5) * 9973) % PROTO_VARIANTS}`);
  function stretchOf(rock, out) {
    const s = rock.seed ?? 0.5;
    out.x = 0.8 + ((s * 3571) % 1) * 0.2;
    out.y = 0.8 + ((s * 6007) % 1) * 0.2;
    out.z = 1;
    return out;
  }
  const _stretch = { x: 1, y: 1, z: 1 };
  function rockTint(r, out) {
    const look = rockLook(r);
    const lum = Math.max(0.05, (look.r + look.g + look.b) / 3);
    const j = 0.84 + ((r.seed * 7919) % 1) * 0.3;
    const lean = r.rich ? 0.45 : 0.25;
    return out.setRGB(j * (1 - lean + lean * look.r / lum), j * (1 - lean + lean * look.g / lum), j * (1 - lean + lean * look.b / lum));
  }

  function shapeFor(bucket) {
    if (!bucket?.mesh) return null;
    const id = `${bucket.cls}:${bucket.v}`;
    const have = shapes.get(id);
    if (have) return have;
    if (beltBake.H === BAKE.proto.H && String(beltBake.L) === String(BAKE.proto.L[0])) {
      const rec = { mount: bucket.mount, built: bucket.mount.built, unitR: bucket.unitR, owned: false };
      shapes.set(id, rec);
      return rec;
    }
    const key = shapeKey(bucket);
    const d = peek(key);
    if (!d) {
      grow(key, { seed: `belt-prototype:${bucket.cls}:${bucket.v}`, classId: bucket.cls, radiusM: 700 + bucket.v * 900, H: beltBake.H, L: beltBake.L });
      return null;
    }
    const mb = mountBakedData(THREE, d);
    mb.material.userData.keep = true;
    for (const g of mb.geometries) g.userData.keep = true;
    for (const t of mb.textures) t.userData.keep = true;
    const rec = { mount: mb, built: mb.built, unitR: bucket.unitR, owned: true };
    shapes.set(id, rec);
    return rec;
  }

  function bodyFor(rock, dist = Infinity, now = 0) {
    const have = bodies.get(rock.key);
    if (have) return have;
    const bucket = bucketOf(rock);
    const shape = shapeFor(bucket);
    if (!shape) return null;
    if (bodies.size >= bodyBudget) {
      let victim = null, worst = -Infinity;
      for (const [k, b] of bodies) {
        if (k === sim.lock?.id || k === mining.key) continue;
        if (now - (b.born ?? -Infinity) < BODY_HOLD) continue;
        const bd = b.rock ? Math.hypot(b.rock.x - sim.ship.pos.x, b.rock.y - sim.ship.pos.y, b.rock.z - sim.ship.pos.z) : Infinity;
        if (bd <= dist) continue;
        const score = (now - b.used) * 1000 + bd;
        if (score > worst) { worst = score; victim = k; }
      }
      if (!victim) return null;
      releaseBody(victim);
    }
    const rec = mountShared(shape, rock);
    rec.used = now;
    rec.born = now;
    rec.rock = { key: rock.key, r: rock.r, x: rock.x, y: rock.y, z: rock.z, ore: rock.ore, cls: rock.cls };
    bodies.set(rock.key, rec);
    return rec;
  }

  function mountShared(shape, rock) {
    const u = shape.mount.material.userData.bake;
    const material = bakedMaterial(THREE, { texA: u.tBakeA.value, texB: u.tBakeB.value, texC: u.uEmitScale.value ? u.tBakeC.value : null, emitScale: u.uEmitScale.value });
    rockTint(rock, material.color);
    const built = { ...shape.built, scale: rock.r / shape.unitR };
    const group = new THREE.Group();
    const unit = new THREE.Group();
    unit.scale.setScalar(built.scale);
    group.add(unit);
    const mesh = new THREE.Mesh(shape.mount.geometries[0], material);
    mesh.frustumCulled = false;
    unit.add(mesh);
    scene.add(group);
    return { group, unit, mesh, mount: { dispose: () => material.dispose() }, assay: built, built, cls: built.cls, shape: built.shape, shared: true, r: rock.r, used: 0 };
  }

  function poseBody(b, r, t) {
    b.rock.x = r.x; b.rock.y = r.y; b.rock.z = r.z;
    b.group.position.set(r.x - origin.x, r.y - origin.y, r.z - origin.z);
    b.group.rotation.set(t * r.spin * 0.1, t * r.spin * 0.14, r.seed * 6.28);
    const w = 1 - r.worn * 0.45;
    stretchOf(r, _stretch);
    b.group.scale.set(w * _stretch.x, w * _stretch.y, w * _stretch.z);
    b.group.visible = true;
  }

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

  function assayFor(key) {
    return bodies.get(key)?.assay ?? null;
  }

  function clearRockBuckets() {
    for (const b of rockBuckets) { b.counts.fill(0); for (const m of b.lods) m.count = 0; }
    dust.visible = false;
    for (const key of [...bodies.keys()]) releaseBody(key);
  }

  const _dressed = [];

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
    pump();
    drainBrokenRocks();
    if (!inBelt(sim.ship.pos)) {
      clearRockBuckets();
      lodMemo.clear();
      cancelGrowth((key) => !key.startsWith("belt:"));
      return;
    }
    const rocks = nearbyRocks(sim.ship.pos, t, 2);
    const sp = sim.ship.pos;
    if (lodMemo.size > 4 * MAX_ROCKS) lodMemo.clear();
    for (const b of rockBuckets) b.counts.fill(0);
    let drawn = 0;
    grown.clear();
    _wantKeys.clear();
    if (bodyBudget > 0) {
      near.length = 0;
      for (const r of rocks) {
        if (r.r < BODY_MIN_R) continue;
        const d = Math.hypot(r.x - sp.x, r.y - sp.y, r.z - sp.z);
        const held = bodies.has(r.key);
        if (d > (held ? BODY_R * BODY_FAR : BODY_R)) continue;
        const pin = sim.lock?.id === r.key || mining.key === r.key;
        near.push({ r, d, rank: d - (pin ? 1e6 : 0) - (held ? BODY_R * BODY_KEEP : 0) });
      }
      near.sort((a, b) => a.rank - b.rank);
      let built = 0;
      for (const { r, d } of near.slice(0, bodyBudget)) {
        const had = bodies.has(r.key);
        if (!had && built >= 1) { shapeFor(bucketOf(r)); continue; }
        const body = bodyFor(r, d, t);
        if (!body) continue;
        if (!had) built++;
        body.used = t;
        poseBody(body, r, t);
        grown.add(r.key);
      }
      for (const { r } of near) {
        if (grown.has(r.key)) continue;
        const b = bodies.get(r.key);
        if (!b) continue;
        poseBody(b, r, t);
        grown.add(r.key);
      }
      for (const [key, b] of bodies) if (!grown.has(key) && b.group.visible) { b.group.visible = false; rockFx.detach(b); }
      cancelGrowth((key) => !key.startsWith("belt:") || _wantKeys.has(key));
    }

    for (const r of rocks) {
      if (drawn >= MAX_ROCKS) break;
      const d = Math.hypot(r.x - sp.x, r.y - sp.y, r.z - sp.z);
      if (d > ROCK_DRAW_R) continue;
      if (grown.has(r.key)) { drawn++; continue; }
      const bucket = bucketOf(r);
      if (!bucket?.mesh) continue;
      const ang = r.r / Math.max(1, d);
      const prev = lodMemo.get(r.key);
      const raw = ang >= PROTO_LOD_ANG[0] ? 0 : ang >= PROTO_LOD_ANG[1] ? 1 : 2;
      let lod = raw;
      if (prev != null) {
        const finer = ang >= PROTO_LOD_ANG[0] * LOD_HYST ? 0 : ang >= PROTO_LOD_ANG[1] * LOD_HYST ? 1 : 2;
        const coarser = ang >= PROTO_LOD_ANG[0] / LOD_HYST ? 0 : ang >= PROTO_LOD_ANG[1] / LOD_HYST ? 1 : 2;
        lod = finer < prev ? finer : coarser > prev ? coarser : prev;
      }
      lodMemo.set(r.key, lod);
      if (bucket.counts[lod] >= bucket.cap) continue;
      const k = Math.min(1, (ROCK_DRAW_R - d) / ROCK_FADE);
      _dummy.position.set(r.x - origin.x, r.y - origin.y, r.z - origin.z);
      _dummy.rotation.set(t * r.spin * 0.1, t * r.spin * 0.14, r.seed * 6.28);
      const sc = (r.r * (1 - r.worn * 0.45) * (0.15 + 0.85 * k)) / bucket.unitR;
      stretchOf(r, _stretch);
      _dummy.scale.set(sc * _stretch.x, sc * _stretch.y, sc * _stretch.z);
      _dummy.updateMatrix();
      rockTint(r, _rcol);
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
    let m = 0;
    let anyHot = false;
    for (const c of chunks) {
      if (n >= MAX_CHUNKS) break;
      if (c.driven && c.fractured != null) continue;
      if (c.salvage) {
        if (m >= MAX_SCRAP) continue;
        const box = c.good !== HULK.plate;
        _dummy.position.set(c.x - origin.x, c.y - origin.y, c.z - origin.z);
        _dummy.rotation.set(t * c.spin * 1.3 + c.seed * 9, t * c.spin * 0.9, c.seed * 6.28);
        if (box) _dummy.scale.set(c.r * 0.45, c.r * 4.2, c.r * 0.7);
        else _dummy.scale.setScalar(c.r);
        _dummy.updateMatrix();
        scrapMesh.setColorAt(m, c.good === HULK.plate ? SCRAP_PLATE : PART_IDS.has(c.good) ? SCRAP_PART : SCRAP_CARGO);
        scrapMesh.setMatrixAt(m++, _dummy.matrix);
        continue;
      }
      _dummy.position.set(c.x - origin.x, c.y - origin.y, c.z - origin.z);
      _dummy.rotation.set(t * c.spin, t * c.spin * 0.7, c.seed * 6.28);
      _dummy.scale.setScalar(c.r);
      _dummy.updateMatrix();
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
    scrapMesh.count = m;
    if (m) { scrapMesh.instanceMatrix.needsUpdate = true; scrapMesh.instanceColor.needsUpdate = true; }
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

  function impactorBody(m) {
    const have = impBodies.get(m.id);
    if (have && Math.abs(have.r - m.r) < have.r * 0.02) return have;
    const key = rogueKey(m);
    const d = peek(key);
    if (!d) { grow(key, { ...rogueParams(m, rogueClass(m)), H: rogueBake.H, L: rogueBake.L }); return have ?? null; }
    if (have) releaseImpactorBody(m.id);
    const rec = mountBody(d, m.r);
    impBodies.set(m.id, rec);
    return rec;
  }

  function rogueAssay(id) {
    return impBodies.get(id)?.assay ?? null;
  }

  function updateImpactors(t) {
    const live = new Set();
    let mounted = 0;
    for (const m of impactors) {
      live.add(m.id);
      const had = impBodies.get(m.id);
      const fresh = !had || Math.abs(had.r - m.r) >= had.r * 0.02;
      const body = !fresh || mounted < 1 ? impactorBody(m) : had ?? null;
      if (fresh && body && body !== had) mounted++;
      if (!body) continue;
      body.group.position.set(m.x - origin.x, m.y - origin.y, m.z - origin.z);
      body.group.rotation.set(t * m.spin, t * m.spin * 0.6, (m.seed ?? 0.5) * 6.28);
      body.group.visible = true;
    }
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
      const f = forwardOf(s.yaw, s.pitch);
      const u = upOf(s.yaw, s.pitch);
      const r = rightOf(s.yaw);
      laser.from.x = s.pos.x + f.x * 1.6 + r.x * 1.6 - u.x * 1.2;
      laser.from.y = s.pos.y + f.y * 1.6 + r.y * 1.6 - u.y * 1.2;
      laser.from.z = s.pos.z + f.z * 1.6 + r.z * 1.6 - u.z * 1.2;
      let dx = mining.x - laser.from.x, dy = mining.y - laser.from.y, dz = mining.z - laser.from.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      dx /= d; dy /= d; dz /= d;
      laser.dir.x = dx; laser.dir.y = dy; laser.dir.z = dz;
      const reach = Math.max(1, d - (mining.r ?? 0) * 0.9);
      laser.hit.x = laser.from.x + dx * reach;
      laser.hit.y = laser.from.y + dy * reach;
      laser.hit.z = laser.from.z + dz * reach;
      laser.to.x = laser.hit.x; laser.to.y = laser.hit.y; laser.to.z = laser.hit.z;
      laser.on = true;
      laser.fade = 0;
      const tv = mining.vx ?? 0, tvy = mining.vy ?? 0, tvz = mining.vz ?? 0;
      chipAcc += dt * (mining.heat > 0.6 ? 46 : 30);
      while (chipAcc >= 1) { chipAcc -= 1; spawnChip(tv, tvy, tvz); }
      puffAcc += dt;
      if (puffAcc > 0.14) { puffAcc = 0; spawnPuff(tv, tvy, tvz); }
    } else if (laser.on) {
      laser.fade += dt;
      if (laser.fade > 2.2) laser.on = false;
    }

    beamGroup.visible = laser.on;
    if (laser.on) {
      const fx = laser.from.x - origin.x, fy = laser.from.y - origin.y, fz = laser.from.z - origin.z;
      const len = Math.hypot(laser.to.x - laser.from.x, laser.to.y - laser.from.y, laser.to.z - laser.from.z);
      const segLen = len / BEAM_SEGS;
      const flicker = 0.75 + 0.25 * Math.sin(laser.t * 38) * Math.sin(laser.t * 7.3);
      const rad = (0.7 + (mining.heat ?? 0) * 0.6) * flicker + Math.min(2.6, len * 0.0016);
      for (let i = 0; i < BEAM_SEGS; i++) {
        const seg = beamSegs[i];
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
        const taper = 0.22 + 0.78 * ((i + 0.5) / BEAM_SEGS);
        const rr = rad * taper * (0.6 + keep * 0.4);
        seg.outer.scale.set(rr, rr, Math.max(0.01, segLen * keep * 0.98));
        seg.outer.material.opacity = 0.55 * keep * flicker;
        seg.core.material.opacity = 0.95 * keep;
      }
    }

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

  const rigOuterMat = new THREE.MeshBasicMaterial({ color: 0x58c8ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const rigCoreMat = new THREE.MeshBasicMaterial({ color: 0xf2fbff, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide });
  const rigGeo = new THREE.CylinderGeometry(1, 0.14, 1, 6, 1, true);
  rigGeo.rotateX(Math.PI / 2);
  rigGeo.userData.keep = true;
  const rigBeam = new THREE.Mesh(rigGeo, rigOuterMat);
  const rigCore = new THREE.Mesh(rigGeo, rigCoreMat);
  rigCore.scale.set(0.3, 0.3, 1.001);
  rigBeam.add(rigCore);
  rigBeam.frustumCulled = false;
  rigCore.frustumCulled = false;
  rigBeam.visible = false;
  scene.add(rigBeam);
  const rigFlash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xbfe9ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  rigFlash.visible = false;
  scene.add(rigFlash);
  const rigFx = { on: false, t: 0, fade: 0, strip: false, fx: 0, fy: 0, fz: 0, tx: 0, ty: 0, tz: 0 };
  const RIG_FADE = 0.35;
  function updateRigFX(dt) {
    const s = sim.ship;
    rigFx.t += dt;
    if (rig.active && sim.phase === "play") {
      const f = forwardOf(s.yaw, s.pitch);
      const u = upOf(s.yaw, s.pitch);
      const r = rightOf(s.yaw);
      rigFx.fx = s.pos.x + f.x * 1.6 - r.x * 1.6 - u.x * 1.2;
      rigFx.fy = s.pos.y + f.y * 1.6 - r.y * 1.6 - u.y * 1.2;
      rigFx.fz = s.pos.z + f.z * 1.6 - r.z * 1.6 - u.z * 1.2;
      const hk = rig.key ? hulkById(rig.key) : null;
      rigFx.tx = hk?.x ?? rig.x; rigFx.ty = hk?.y ?? rig.y; rigFx.tz = hk?.z ?? rig.z;
      const wk = hk ? hulkMeshes.get(`hulk:${hk.id}`) : null;
      const part = wk?.wreck.parts[Math.max(0, wk.wreck.shown)];
      if (part) {
        _wc.set(part.x, part.y, part.z).applyQuaternion(wk.group.quaternion);
        rigFx.tx += _wc.x; rigFx.ty += _wc.y; rigFx.tz += _wc.z;
      }
      rigFx.strip = rig.mode === "strip";
      rigFx.on = true;
      rigFx.fade = 0;
    } else if (rigFx.on) {
      rigFx.fade += dt;
      if (rigFx.fade > RIG_FADE) rigFx.on = false;
    }
    rigBeam.visible = rigFx.on;
    rigFlash.visible = rigFx.on;
    if (!rigFx.on) return;
    let dx = rigFx.tx - rigFx.fx, dy = rigFx.ty - rigFx.fy, dz = rigFx.tz - rigFx.fz;
    const len = Math.hypot(dx, dy, dz) || 1;
    dx /= len; dy /= len; dz /= len;
    const keep = 1 - Math.min(1, rigFx.fade / RIG_FADE);
    const flicker = 0.7 + 0.3 * Math.sin(rigFx.t * 61) * Math.sin(rigFx.t * 11.7);
    const closeK = Math.min(1, Math.max(0.18, len / 400));
    const rad = ((rigFx.strip ? 0.35 : 0.7) * (0.8 + (rig.heat ?? 0) * 0.5) * flicker + Math.min(1.6, len * 0.0016)) * closeK;
    rigOuterMat.color.setHex(rigFx.strip ? 0x6affc8 : 0x58c8ff);
    rigOuterMat.opacity = 0.5 * keep * flicker;
    rigCoreMat.opacity = 0.95 * keep;
    rigBeam.position.set(rigFx.fx + dx * len * 0.5 - origin.x, rigFx.fy + dy * len * 0.5 - origin.y, rigFx.fz + dz * len * 0.5 - origin.z);
    rigBeam.lookAt(rigBeam.position.x + dx, rigBeam.position.y + dy, rigBeam.position.z + dz);
    rigBeam.scale.set(rad, rad, len);
    rigFlash.position.set(rigFx.tx - origin.x, rigFx.ty - origin.y, rigFx.tz - origin.z);
    const hullLen = hulkMeshes.get(`hulk:${rig.key}`)?.len ?? 6;
    const sz = Math.min((rigFx.strip ? 5 : 9) * (0.7 + 0.6 * flicker) + len * 0.004, Math.max(0.9, hullLen * 0.5) * (0.7 + 0.6 * flicker) + len * 0.004);
    rigFlash.scale.set(sz, sz, 1);
    rigFlash.material.opacity = 0.9 * keep * flicker;
  }

  const sdroneGlow = new THREE.SpriteMaterial({ map: glowTex, color: 0x7df0ff, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  sdroneGlow.userData.keep = true;
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

  const _dLook = new THREE.Vector3();
  function droneDesign(c) {
    const st = c.stationId ? stations.find((x) => x.id === c.stationId) : null;
    const kind = c.kind === "sdrone" ? "sdrone" : "guard";
    const seed = st ? st.name : `rogue-${(c.id.length + c.id.charCodeAt(c.id.length - 1)) % 4}`;
    return droneFor(kind, seed, st?.sector ?? "pirate");
  }
  function syncContactMeshes() {
    droneBudget(2);
    for (const c of contacts) {
      if (c.kind !== "drone" && c.kind !== "sdrone") continue;
      let m = droneMeshes.get(c.id);
      if (!m) {
        const bot = dist3(sim.ship.pos, c) < meshRange() ? droneDesign(c) : null;
        if (!bot) continue;
        if (c.kind === "sdrone") { const sp = new THREE.Sprite(sdroneGlow); sp.scale.set(5, 5, 1); sp.position.z = 4.5; bot.add(sp); }
        m = bot;
        scene.add(m);
        droneMeshes.set(c.id, m);
      }
      rel(c.x, c.y, c.z, m);
      if (c.kind === "sdrone") { m.rotation.set(c.pitch ?? 0, c.yaw ?? 0, 0, "YXZ"); continue; }
      _dLook.set(sim.ship.pos.x - origin.x, sim.ship.pos.y - origin.y, sim.ship.pos.z - origin.z);
      m.lookAt(_dLook);
      m.rotateY(Math.PI);
      m.rotateZ(Math.sin(sim.time * 0.7 + c.id.length) * 0.08);
    }
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

  const workBeamMat = new THREE.LineBasicMaterial({ color: 0xffa24a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  workBeamMat.userData.keep = true;
  const _seenWork = new Set();
  function syncWorkDrones() {
    const seen = _seenWork;
    seen.clear();
    for (const list of [droneOps.units, npcDrones.units]) for (const u of list) {
      if ((u.dockedAt && !u.bay) || u.state === "setup") continue;
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
      if (n.visible === false) {
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
      const dn = dist3(sim.ship.pos, n);
      const far = dn > meshRange();
      if (far && dn < drawRange() * 1.3) placeNavLight(navLightFor(n.id, HOSTILE_ROLES.has(n.role) ? "#ff6a4a" : LAW_ROLES.has(n.role) ? "#8fd6ff" : "#dfe9ff"), n.x, n.y, n.z, sim.time, dn);
      else if (far) dropNavLight(n.id);
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

  const hulkMeshes = new Map();
  const _liveHulk = new Set();
  const HULK_PAINT = "#84756a";
  const HULK_BEACON = "#ff8a2a";
  const HULK_EMBER = 0xff6a1e;
  const WRECK = { torn: 0.2, tornK: 0.45, keep: 2 };
  const hash01 = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10007) / 10007; };

  const wreckMats = new Map();
  function wreckMat(m) {
    if (!m || !m.isMeshStandardMaterial) return m;
    let w = wreckMats.get(m.uuid);
    if (!w) {
      w = m.clone();
      w.emissive = new THREE.Color(0x4f3b2b);
      w.emissiveIntensity = 1;
      w.emissiveMap = null;
      w.userData.keep = true;
      wreckMats.set(m.uuid, w);
    }
    return w;
  }

  function wreckOf(group, h) {
    const def = shipById(h.ship) ?? shipById(DEFAULT_SHIP_ID);
    const len = def.dims?.[0] ?? 3;
    group.updateMatrixWorld(true);
    const parts = [];
    group.traverse((o) => {
      if (o.userData?.plume) { o.visible = false; return; }
      if (!o.isMesh || !o.visible) return;
      o.material = Array.isArray(o.material) ? o.material.map(wreckMat) : wreckMat(o.material);
      _wbox.setFromObject(o);
      if (_wbox.isEmpty()) return;
      _wbox.getCenter(_wc);
      parts.push({ o, z: _wc.z, x: _wc.x, y: _wc.y });
    });
    parts.sort((a, b) => a.z - b.z);
    let intact = 0;
    for (const sec of h.sections) intact += sec.intact ?? 1;
    intact /= Math.max(1, h.sections.length);
    const torn = WRECK.torn + (1 - intact) * WRECK.tornK;
    const key = String(h.vessel ?? h.id);
    let gash = null;
    for (let i = WRECK.keep; i < parts.length; i++) {
      if (hash01(`${key}:${i}`) < torn) { parts[i].o.visible = false; parts[i].gone = true; gash ??= parts[i]; }
    }
    const ember = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: HULK_EMBER, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    const at = gash ?? parts[Math.floor(parts.length / 2)] ?? { x: 0, y: 0, z: 0 };
    const k = 1 / (group.scale.x || 1);
    ember.position.set(at.x * k, at.y * k, at.z * k);
    ember.scale.setScalar(len * 0.42 * k);
    group.add(ember);
    return { len, parts: parts.filter((p) => !p.gone), ember, shown: -1, phase: hash01(key) * 6.28 };
  }

  function cutBack(obj, h) {
    let all = 0, left = 0;
    for (const sec of h.sections) { all += sec.plate0; left += sec.plate; }
    const f = all > 0 ? 1 - left / all : 1;
    const n = obj.wreck.parts.length;
    const hide = Math.min(Math.max(0, n - WRECK.keep), Math.floor(f * (n - WRECK.keep) + 1e-6));
    if (hide === obj.wreck.shown) return;
    obj.wreck.shown = hide;
    for (let i = 0; i < n; i++) obj.wreck.parts[i].o.visible = i >= hide;
  }

  function syncHulks() {
    const live = _liveHulk;
    live.clear();
    const near = meshRange();
    const far = drawRange() * 1.3;
    for (const h of hulks) {
      const d = dist3(sim.ship.pos, h);
      if (d > far) continue;
      const key = `hulk:${h.id}`;
      live.add(key);
      let obj = hulkMeshes.get(key);
      if (h.sections[0]?.box) placeNavLight(navLightFor(key, HULK_BEACON), h.x, h.y, h.z, sim.time * 0.3, d, Math.max(0.5, (obj?.len ?? 6) * 0.22));
      else dropNavLight(key);
      if (obj && obj.ship !== h.ship) {
        scene.remove(obj.group);
        disposeObject(obj.group);
        hulkMeshes.delete(key);
        obj = null;
      }
      if (d > near) {
        if (obj) obj.group.visible = false;
        continue;
      }
      if (!obj) {
        if (hullBudget <= 0) continue;
        hullBudget--;
        const group = makeShipGroup(HULK_PAINT, 1, h.ship, h.vessel ?? h.id, "lite");
        const wreck = wreckOf(group, h);
        scene.add(group);
        obj = { group, ship: h.ship, wreck, len: wreck.len };
        hulkMeshes.set(key, obj);
      }
      obj.group.visible = true;
      cutBack(obj, h);
      obj.wreck.ember.material.opacity = 0.28 + 0.22 * Math.sin(sim.time * 7.3 + obj.wreck.phase) * Math.sin(sim.time * 1.9 + obj.wreck.phase * 2) + 0.12;
      rel(h.x, h.y, h.z, obj.group);
      orientCraft(obj.group, h.yaw + h.tumble, h.pitch, h.roll + h.tumble * 0.6);
    }
    for (const [key, obj] of hulkMeshes) {
      if (!live.has(key)) {
        scene.remove(obj.group);
        disposeObject(obj.group);
        hulkMeshes.delete(key);
      }
    }
    for (const [id] of navLights) if (id.startsWith("hulk:") && !live.has(id)) dropNavLight(id);
  }

  const edgeBuf = [];
  const _relById = new Map();
  const EDGE_M = 7;
  const EDGE_NEAR_R = 70000;
  const _mk = { x: 0, y: 0, on: false, edge: false, a: 0, behind: false };

  function projectMark(x, y, z) {
    _proj.set(x - origin.x, y - origin.y, z - origin.z).project(camera);
    let nx = _proj.x, ny = _proj.y;
    const behind = _proj.z >= 1;
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
    notePerf(raw, dt);
    resumeAudioIfNeeded();

    if (sim.phase === "pause") pauseTick();
    else tickSim(dt);

    tickAudio(audioState(), dt);
    tickTutorial(dt);
    tickWorldSync();

    const s = sim.ship;
    const playing = sim.phase !== "menu";

    if (playing) {
      origin.x = s.pos.x;
      origin.y = s.pos.y;
      origin.z = s.pos.z;
    } else if (!attract.place(dt, origin)) {
      const star = starBody();
      const r = (star?.radius ?? 4000) * 26;
      camTheta += dt * (reduced ? 0.01 : 0.03);
      origin.x = Math.cos(camTheta) * r;
      origin.y = r * 0.28;
      origin.z = Math.sin(camTheta) * r;
    }
    if (!playing) attract.step(dt);
    else if (attract.active) attract.stop();

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
      p.group.rotation.y += dt * p.spin * 0.006;
      const bb = bodyById(p.id);
      const th = bb?.thermal ?? 0;
      const molten = bb?.moltenGlow ?? 0;
      if (molten > 0.02) {
        p.hot = true;
        const k = 900 + molten * 1400;
        p.mat.emissive.setHex(kelvinHex(k));
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
    if (texQueue.length) {
      const job = texQueue.shift();
      sim.texLoad = { done: texTotal - texQueue.length, total: texTotal };
      if (job.mat && !job.mat.__disposed) {
        const key = texKey(job.b);
        let map = texCache.get(key);
        if (!map) {
          map = makePlanetTexture(...texArgs(job.b));
          map.userData.keep = true;
          texCache.set(key, map);
        }
        job.mat.map = map;
        job.mat.color.setRGB(1, 1, 1);
        job.mat.needsUpdate = true;
      }
    }
    stepCloseUp();
    updateStations(dt);
    updateAsteroids(sim.time);
    rockFx.update(frameDt, bodies.values());
    impactFx.update(frameDt);
    holeFx.update(frameDt);
    updateDebris(sim.time);
    updateImpactors(sim.time);
    updateShots();
    updateMiningFX(dt);
    updateRigFX(dt);
    syncContactMeshes();
    updateTractorBeam(sim.time);
    hullBudget = 1;
    frameDt = dt;
    syncRemotes();
    syncTraffic();
    syncFlow();
    syncHulks();

    stars.position.set(0, 0, 0);

    if (beltHaze) rel(0, 0, 0, beltHaze);
    floods.intensity = sim.ship.lights && sim.ship.powered.ops && playing ? 3.4 : 0;
    if (floods.intensity > 0) {
      const ff = forwardOf(s.yaw, s.pitch);
      floods.position.set(ff.x * 3, ff.y * 3, ff.z * 3);
    }

    if (playing) camMode = sim.cameraMode ?? camMode;
    ship.visible = playing && camMode === 1;
    if (ship.visible) tickHull(ship, dt, sim.time, { throttle: Math.max(0.04, Math.abs(s.throttle) / Math.max(1e-6, throttleCapOf())) });
    dematerialize(ship, sim.hullFade ?? 0);
    if (playing) {
      orientCraft(ship, s.yaw, s.pitch, s.roll);
      ship.position.set(0, 0, 0);
      if (camMode === 1) {
        const f = forwardOf(s.yaw, s.pitch);
        const u = upOf(s.yaw, s.pitch);
        const r = rightOf(s.yaw);
        const cp = Math.cos(ext.pitch);
        const bx = -Math.cos(ext.yaw) * cp;
        const bz = Math.sin(ext.yaw) * cp;
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
        const f = forwardOf(s.yaw, s.pitch);
        const u = upOf(s.yaw, s.pitch);
        camera.position.set(f.x * 0.38 + u.x * 0.14, f.y * 0.38 + u.y * 0.14, f.z * 0.38 + u.z * 0.14);
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
    stars.material.opacity = 0.9 * (1 - Math.min(1, warpStrength * 2.2));
    stars.visible = stars.material.opacity > 0.02;
    warpFx.updateWakes(traffic, origin);
    if (flashEl) flashEl.style.opacity = warpFx.flash > 0.002 ? String(warpFx.flash * 0.8) : "0";

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
        edgeBuf.length = 0;
        const nameR = drawRange();
        _relById.clear();
        for (const c of contacts) if (c.relation) _relById.set(c.id, c.relation);
        const beam = scanFocus();

        for (const n of traffic) {
          if (n.visible === false) continue;
          const d = dist3(s.pos, n);
          if (d > nameR) continue;
          const view = contactView(n.id);
          if (!view) continue;

          const rel = _relById.get(n.id)
            ?? (HOSTILE_ROLES.has(n.role) ? "hostile" : LAW_ROLES.has(n.role) ? "ally" : "neutral");
          const kind = rel === "hostile" ? "hostile" : rel === "ally" ? "allied" : "neutral";
          const fighting = n.job === "engaged" || n.job === "fleeing" || n.job === "responding" || n.job === "hunting";
          const tag = hullTag(n);

          const pr = projectMark(n.x, n.y + 12, n.z);
          if (pr.on) {
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
        edgeBuf.sort((a, b) => b.rank - a.rank);
        const edgeCap = perf.tier >= 2 ? 7 : 4;
        for (let i = 0; i < edgeBuf.length && i < edgeCap; i++) labels.push(edgeBuf[i]);
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

    bloom.setThreshold(warpStrength > 0.05 ? 0.42 : 0.62, 0.65);
    const lensPass = holeFx.lens();
    bloom.render(Math.max(Math.min(1.35, warpFx.bloom * 1.35), lensPass ? 0.55 : 0), lensPass);
  }

  window.__lgGL = { scene, camera, renderer, worldRoot, sunGroup, sun, planets, origin, asteroids, rockBuckets, dust, bodies, assayFor, impBodies, rogueAssay, rockQuality, growerStats, stars, rockFx, impactFx, holeFx, bloom, get bodyDetail() { return bodyDetail; } };

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
    for (const sh of shapes.values()) if (sh.owned) sh.mount.dispose();
    shapes.clear();
    for (const id of [...impBodies.keys()]) releaseImpactorBody(id);
    rockFx.dispose();
    impactFx.dispose();
    holeFx.dispose();
    beaconGeo.dispose();
    chunkGeo.dispose();
    scrapGeo.dispose();
    scrapMat.dispose();
    renderer.dispose();
    if (window.__lg) delete window.__lg;
  };
}
