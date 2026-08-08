// Living Galaxy — the Solaris system: star, planets (typed bodies), moons, stations.
// Planets are SOLID: the surface writes depth and is fully opaque; only the thin
// atmosphere shell above it is translucent.

import { scene } from './scene.js';
import { S } from '../core/state.js';
import { register as registerLod, resetLod } from './lod.js';
import { LOD } from '../core/config.js';
import { TAU } from '../core/utils.js';
import { wrand, wnext, makeRng } from '../core/rng.js';
import { STAR, ORBITAL_V } from '../core/config.js';
import { PLANET_TYPES, SYSTEM_PLANETS } from '../data/planets.js';
import { MOON_TYPES, moonClassFor } from '../data/moons.js';
import { STATION_TYPES, STATION_MODULES, MODULE_BONUS, SYSTEM_STATIONS, baseServices } from '../data/stations.js';
import { planetTexture, cloudTexture, glowTexture } from './textures.js';

const corona = [];
let starGlare = null;

export function createSystem() {
  resetLod();
  createStar();
  SYSTEM_PLANETS.forEach(createPlanet);
  SYSTEM_STATIONS.forEach(createStation);
}

function createStar() {
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(STAR.radius, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0xfff0a0, fog: false })
  );
  sun.userData = { kind: 'star', name: 'Solaris Prime', radius: STAR.radius, orbitRadius: 0, gravity: 12 };
  [[420, 0.22, 0xffcc55], [560, 0.10, 0xff8822], [STAR.corona, 0.05, 0xff5500]].forEach(([r, o, c]) => {
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(r, 40, 40),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o,
        side: THREE.BackSide, fog: false, depthWrite: false })
    );
    corona.push({ mesh: shell, radius: r });
    sun.add(shell);
  });
  // Bloom without a post-processing pass: a screen-locked additive sprite whose
  // size tracks how close the star is. Cheap, and it reads as glare on a phone GPU
  // where an EffectComposer chain would not hold frame rate.
  starGlare = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(),
    color: 0xffd98a, transparent: true, opacity: 0.5, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, fog: false, sizeAttenuation: false
  }));
  starGlare.scale.setScalar(0.09);
  starGlare.renderOrder = 2;
  sun.add(starGlare);

  scene.add(sun);
  scene.add(new THREE.PointLight(0xfff2c8, 2.8, 200000, 1));
  scene.add(new THREE.AmbientLight(0x2a3c60, 0.5));
  S.world.bodies.push(sun);
}

function createPlanet(pd) {
  const t = PLANET_TYPES[pd.type];
  const rng = makeRng((S.seed ^ hash(pd.name)) >>> 0);
  const radius = t.r[0] + rng.next() * (t.r[1] - t.r[0]);
  const g = new THREE.Group();

  g.userData = {
    kind: 'planet', name: pd.name, ptype: pd.type, typeName: t.name,
    radius, gravity: t.gravity,
    tempC: Math.round(t.temp[0] + rng.next() * (t.temp[1] - t.temp[0])),
    atmo: !!t.atmo, baseR: radius,
    // How much of a scanner return this world's air eats, 0 (airless) to ~0.7.
    //
    // Derived from the shell the renderer already draws rather than declared a second
    // time, so a world that *looks* like a greenhouse scans like one. The one correction
    // is for giants: `thick` is the visible shell, and a giant's shell is thin on screen
    // precisely because the whole body is atmosphere — reading depth off it would make
    // Titanus the clearest read in the outer system. See systems/scanner.js.
    atmoDensity: t.atmo ? (t.bands ? t.atmo.opacity * 2
                                   : t.atmo.opacity * (0.8 + (t.atmo.thick - 1) * 3)) : 0,
    orbitRadius: pd.orbit, orbitSpeed: ORBITAL_V.planet / pd.orbit, angle: wrand(0, TAU),
    spin: 0.04 + rng.next() * 0.08
  };

  // ── solid core underlayer — pure depth writer so nothing punches through ──
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.995, 32, 24),
    new THREE.MeshBasicMaterial({
      color: t.color,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
      fog: false
    })
  );
  g.add(core);

  // ── surface: opaque textured shell. MeshBasicMaterial is always fully lit
  // and never goes translucent, which is what made distant gas giants look hollow.
  const map = planetTexture(pd.type, t, rng);
  // One material, four shells. Sharing the material matters: a separate one per level
  // would mean four texture bindings per planet and four shader compiles, which costs
  // more than the vertices the whole system saves.
  const surfMat = new THREE.MeshBasicMaterial({
    map,
    color: 0xffffff,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    depthTest: true,
    fog: false
  });
  const surf = new THREE.Group();
  const surfLevels = LOD.segments.map((seg, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(radius, seg, Math.max(6, seg * 0.75)), surfMat);
    m.visible = (i === 0);
    surf.add(m);
    return m;
  });
  surf.rotation.y = rng.next() * TAU;
  g.add(surf);
  g.userData.surf = surf;

  // ── moving cloud / gas deck — thin, FrontSide only, never writes depth
  if (t.atmo || t.bands) {
    const cMap = cloudTexture(pd.type, t, rng);
    const cloudR = radius * (t.atmo ? Math.min(t.atmo.thick, 1.035) : 1.008);
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(cloudR, 48, 32),
      new THREE.MeshBasicMaterial({
        map: cMap,
        color: 0xffffff,
        transparent: true,
        opacity: t.bands ? 0.28 : 0.22,
        depthWrite: false,
        depthTest: true,
        side: THREE.FrontSide,
        fog: false
      })
    );
    clouds.rotation.y = rng.next() * TAU;
    g.add(clouds);
    g.userData.clouds = clouds;
    g.userData.cloudSpin = 0.06 + rng.next() * 0.12;
  }

  // ── thin atmosphere limb glow (BackSide only — never covers the disk)
  if (t.atmo) {
    const a = new THREE.Mesh(
      new THREE.SphereGeometry(radius * Math.min(t.atmo.thick, 1.08) * 1.01, 32, 32),
      new THREE.MeshBasicMaterial({
        color: t.atmo.color,
        transparent: true,
        opacity: Math.min((t.atmo.opacity || 0.2) * 0.45, 0.18),
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: true,
        fog: false,
        blending: THREE.AdditiveBlending
      })
    );
    g.add(a);
  }

  if (t.rings && rng.next() < t.rings) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.4, radius * 2.2, 72),
      new THREE.MeshBasicMaterial({
        color: tint(0xc8b080, rng, 0.15),
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false
      })
    );
    ring.rotation.x = Math.PI / 2.15 + (rng.next() - 0.5) * 0.4;
    g.add(ring);
    g.userData.rings = true;
  }

  const beacon = mkBeacon(t.color, 0.012);
  g.add(beacon);
  g.userData.beacon = beacon;

  place(g);
  scene.add(g);
  // The whole planet group is registered, with the surface shells as its levels. The
  // clouds, atmosphere and beacon ride along inside the group, so culling the planet
  // culls all of it in one flag rather than four.
  registerLod(g, radius, surfLevels);
  S.world.bodies.push(g);

  // moons — solid, depth-writing
  const nMoons = t.moons[0] + Math.floor(rng.next() * (t.moons[1] - t.moons[0] + 1));
  const parentTempMid = (t.temp[0] + t.temp[1]) / 2;
  for (let m = 0; m < nMoons; m++) {
    // A moon is a world now, not a grey sphere. It gets a class from its primary's
    // temperature and its own depth in that primary's well, and through the class it gets
    // a `ptype` — which is the field the whole planetary-industry layer keys off. Without
    // it `foundSite()` accepted moons and then refused every command centre, because
    // `worlds.includes(undefined)` is false for all of them.
    const mkey = moonClassFor(pd.type, parentTempMid, m, rng);
    const mt = MOON_TYPES[mkey];
    const mr = radius * (0.10 + rng.next() * 0.16) * mt.size;
    const orbitR = radius * (2.3 + m * 1.5 + rng.next() * 0.6);
    const mg = new THREE.Group();
    mg.userData = {
      kind: 'moon', name: `${pd.name} ${romanize(m + 1)}`, radius: mr, parent: g,
      mclass: mkey, ptype: mt.ptype, typeName: mt.name,
      tempC: Math.round(mt.temp[0] + rng.next() * (mt.temp[1] - mt.temp[0])),
      atmo: false, atmoDensity: 0,
      gravity: mt.gravity, baseR: mr,
      orbitRadius: orbitR,
      orbitSpeed: wrand(ORBITAL_V.moon[0], ORBITAL_V.moon[1]) / orbitR,
      angle: wrand(0, TAU)
    };
    const mc = tint(mt.color, rng, 0.18);
    const mMat = new THREE.MeshBasicMaterial({
      color: mc, transparent: false, opacity: 1,
      depthWrite: true, depthTest: true, fog: false
    });
    const mLevels = [24, 12, 8].map((seg, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(mr, seg, seg), mMat);
      m.visible = (i === 0);
      mg.add(m);
      return m;
    });
    const mb = mkBeacon(mc, 0.008);
    mg.add(mb);
    mg.userData.beacon = mb;
    registerLod(mg, mr, mLevels);
    // Seat the moon on its orbit immediately. It used to be left at the origin until
    // the first updateSystem(), which meant every moon in the system briefly shared a
    // position with the star — and anything that read the world before that first
    // frame (a course plan, a headless test, a save loaded at boot) planned against a
    // phantom obstacle sitting on top of Solaris Prime.
    mg.position.set(
      g.position.x + Math.cos(mg.userData.angle) * orbitR,
      g.position.y + Math.sin(mg.userData.angle * 0.65) * orbitR * 0.12,
      g.position.z + Math.sin(mg.userData.angle) * orbitR
    );
    scene.add(mg);
    S.world.bodies.push(mg);
  }
}

function createStation(st, i) {
  const type = STATION_TYPES[st.type];
  const g = new THREE.Group();
  const size = type.size;

  g.userData = {
    kind: 'station', name: st.name, stype: st.type, typeName: type.name,
    category: type.cat, radius: size, color: st.color, baseR: size,
    slots: type.slots, modules: [], services: baseServices(st.type),
    orbitRadius: st.orbit,
    orbitSpeed: wrand(ORBITAL_V.station[0], ORBITAL_V.station[1]) / st.orbit,
    spinSpeed: wrand(0.05, 0.14),
    angle: (i / SYSTEM_STATIONS.length) * TAU + wrand(0, 0.5)
  };

  // core hull by category
  const metal = (c, m, r) => new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r,
    transparent: false, depthWrite: true });
  if (type.cat === 'military' || type.cat === 'pirate') {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(size * 1.5, size * 0.55, size), metal(st.color, .75, .30)));
  } else if (type.cat === 'industrial') {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.75, size * 1.3), metal(st.color, .55, .45)));
  } else if (type.cat === 'logistics') {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(size * 2.2, size * 0.45, size * 0.7), metal(st.color, .65, .35)));
  } else if (type.cat === 'economic') {
    g.add(new THREE.Mesh(new THREE.SphereGeometry(size * 0.55, 24, 24), metal(st.color, .45, .28)));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(size * 0.9, 2.8, 12, 44), metal(0xcce0ff, .7, .3));
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
  } else {
    const tor = new THREE.Mesh(new THREE.TorusGeometry(size * 0.72, size * 0.2, 16, 52), metal(st.color, .28, .42));
    tor.rotation.x = Math.PI / 2.4;
    g.add(tor);
  }

  // spine the modules attach to
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.08, size * 0.08, size * 2.0, 8),
    metal(0x50606a, .7, .4));
  spine.rotation.z = Math.PI / 2;
  g.add(spine);

  const lt = new THREE.PointLight(st.color, 0.7, 320);
  lt.position.y = size * 0.9;
  g.add(lt);
  const sb = mkBeacon(st.color, 0.006);
  g.add(sb);
  g.userData.beacon = sb;

  place(g, wrand(-50, 50));
  scene.add(g);
  // Stations have no geometry levels — they are built from many small parts and swapping
  // tessellation on each would cost more bookkeeping than it saves. They are registered
  // for culling only, which is where nearly all of the win is anyway.
  registerLod(g, size * 2, null);
  S.world.bodies.push(g);
  S.world.stations.push(g);

  // pre-built modules occupy the first slots
  for (const key of type.base) attachModule(g, key, true);
}

/** Spawn a brand-new station at runtime (construction completing, pirate bastion). */
export function addStation(spec) {
  const typeKey = spec.type || (spec.cat === 'pirate' ? 'bastion'
    : spec.cat === 'military' ? 'fortress'
    : spec.cat === 'industrial' ? 'refinery'
    : spec.cat === 'logistics' ? 'depot'
    : spec.cat === 'economic' ? 'tradeHub' : 'habitat');
  const entry = { name: spec.name, type: typeKey, orbit: spec.orbit, color: spec.color || 0x99ddff };
  const i = S.world.stations.length;
  createStation(entry, i);
  const st = S.world.stations[S.world.stations.length - 1];
  if (spec.angle != null) {
    st.userData.angle = spec.angle;
    st.position.set(Math.cos(spec.angle) * spec.orbit, 0, Math.sin(spec.angle) * spec.orbit);
  }
  return st;
}

/** Build a module mesh into the next free slot and apply its bonus. */
export function attachModule(station, key, silent) {
  const u = station.userData;
  if (u.modules.length >= u.slots) return false;
  const def = STATION_MODULES[key];
  if (!def) return false;

  const idx = u.modules.length;
  const size = u.radius;
  const along = (idx - (u.slots - 1) / 2) * (size * 0.34);
  const side = idx % 2 ? 1 : -1;

  const mesh = moduleMesh(key, size, u.color);
  mesh.position.set(along, side * size * 0.42, 0);
  station.add(mesh);

  u.modules.push({ key, mesh });
  const bonus = MODULE_BONUS[key];
  if (bonus) bonus(u.services);
  u.services.power += def.power;
  return true;
}

function moduleMesh(key, size, color) {
  const s = size * 0.2;
  const mat = (c, m = 0.7, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r,
    transparent: false, depthWrite: true });
  switch (key) {
    case 'reactor':    return new THREE.Mesh(new THREE.CylinderGeometry(s * .8, s * .8, s * 1.8, 10), mat(0x66ffcc, .8, .25));
    case 'solar':      return new THREE.Mesh(new THREE.BoxGeometry(s * 3.2, s * .12, s * 1.4), mat(0x2b3f7a, .5, .5));
    case 'atmosphere': return new THREE.Mesh(new THREE.SphereGeometry(s * .8, 14, 14), mat(0x88ccff, .4, .4));
    case 'gravity':    { const m = new THREE.Mesh(new THREE.TorusGeometry(s * 1.1, s * .22, 10, 26), mat(0xaad0ff, .5, .4)); m.rotation.x = Math.PI / 2; return m; }
    case 'shield':     { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s * .95, 0), mat(0x55aaff, .6, .3)); return m; }
    case 'radBaffle':  return new THREE.Mesh(new THREE.BoxGeometry(s * .3, s * 2.2, s * 2.0), mat(0x77776a, .6, .55));
    case 'turret':     return new THREE.Mesh(new THREE.CylinderGeometry(s * .28, s * .42, s * 1.3, 8), mat(0x99a0a8, .85, .25));
    case 'cargo':      return new THREE.Mesh(new THREE.BoxGeometry(s * 1.9, s * .85, s * .85), mat(0xc08a3a, .6, .5));
    case 'landingPad': return new THREE.Mesh(new THREE.BoxGeometry(s * 2.0, s * .16, s * 1.6), mat(0x50606a, .6, .5));
    case 'droneBay':   return new THREE.Mesh(new THREE.BoxGeometry(s * 1.5, s * 1.0, s * 1.0), mat(0x6a7a55, .6, .45));
    case 'market':     return new THREE.Mesh(new THREE.BoxGeometry(s * 1.6, s * 1.2, s * 1.0), mat(0xd070d0, .5, .4));
    case 'refinery':   return new THREE.Mesh(new THREE.CylinderGeometry(s * .55, s * .75, s * 2.0, 8), mat(0xd08a30, .7, .4));
    case 'shipyard':   return new THREE.Mesh(new THREE.BoxGeometry(s * 2.4, s * 1.2, s * 1.2), mat(0x8894a0, .8, .3));
    case 'sensor':     { const m = new THREE.Mesh(new THREE.ConeGeometry(s * .7, s * 1.2, 10), mat(0xaaddff, .6, .3)); m.rotation.x = -Math.PI / 2; return m; }
    default:           return new THREE.Mesh(new THREE.BoxGeometry(s, s, s), mat(color || 0x889, .6, .4));
  }
}

// ── helpers ──────────────────────────────────────────────────────────
function mkBeacon(color, scale) {
  const b = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(),
    color, transparent: true, opacity: 0.85, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, fog: false, sizeAttenuation: false
  }));
  b.scale.setScalar(scale);
  return b;
}

function tint(hex, rng, amt) {
  const c = new THREE.Color(hex);
  const f = 1 + (rng.next() - 0.5) * amt * 2;
  c.r = Math.min(1, c.r * f); c.g = Math.min(1, c.g * f); c.b = Math.min(1, c.b * f);
  return c.getHex();
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII'];
const romanize = n => ROMAN[n - 1] || String(n);

function place(g, y = 0) {
  const u = g.userData;
  g.position.set(Math.cos(u.angle) * u.orbitRadius, y, Math.sin(u.angle) * u.orbitRadius);
}

function updateBeacons() {
  const pp = S.player.position;
  for (const b of S.world.bodies) {
    const bc = b.userData.beacon;
    if (!bc) continue;
    const d = b.position.distanceTo(pp);
    const base = b.userData.baseR || 20;
    const apparent = base / Math.max(d, 1);
    // fade the halo in only once the body itself is too small to read
    const k = apparent > 0.05 ? 0 : Math.max(0, (0.05 - apparent) / 0.05);
    bc.material.opacity = 0.10 + 0.75 * k;
    bc.visible = k > 0.02;
    bc.scale.setScalar(0.003 + Math.min(d / 260000, 1) * 0.03);
  }
}

export function updateSystem(dt) {
  const fromStar = S.player.position.length();
  for (const c of corona) c.mesh.visible = fromStar > c.radius * 1.02;

  if (starGlare) {
    // Falls off with range but never vanishes — Solaris should be the brightest
    // thing in the sky from anywhere in charted space.
    const k = Math.min(1, 9000 / Math.max(fromStar, 400));
    starGlare.scale.setScalar(0.04 + k * 0.20);
    starGlare.material.opacity = 0.18 + k * 0.42;
    starGlare.visible = fromStar > 340;
  }

  updateBeacons();

  for (const b of S.world.bodies) {
    const u = b.userData;
    if (u.kind === 'planet' || u.kind === 'station') {
      u.angle += u.orbitSpeed * dt;
      b.position.x = Math.cos(u.angle) * u.orbitRadius;
      b.position.z = Math.sin(u.angle) * u.orbitRadius;
      if (u.kind === 'station') b.rotation.y += u.spinSpeed * dt;
      // axial spin + differential cloud rotation for living atmosphere
      if (u.kind === 'planet') {
        if (u.surf) u.surf.rotation.y += (u.spin || 0.05) * dt;
        if (u.clouds) u.clouds.rotation.y += (u.cloudSpin || 0.1) * dt;
      }
    } else if (u.kind === 'moon') {
      u.angle += u.orbitSpeed * dt;
      const p = u.parent.position;
      b.position.set(
        p.x + Math.cos(u.angle) * u.orbitRadius,
        p.y + Math.sin(u.angle * 0.65) * u.orbitRadius * 0.12,
        p.z + Math.sin(u.angle) * u.orbitRadius
      );
    }
  }
}
