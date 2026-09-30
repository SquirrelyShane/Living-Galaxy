import * as THREE from "../../vendor/three.module.min.js";
import { BODIES, bodyById, bodyPosition, currentSystem } from "../world/bodies.js";
import { sim } from "../sim/sim.js";
import { forgeShipScaled, tickHull, releaseHull } from "../ships/shipforge.js";
import { shipById, SHIP_DB, DEFAULT_SHIP_ID } from "../ships/shipdb.js";

function seeded(seedStr) {
  let n = 0;
  const k = String(seedStr ?? "");
  for (let i = 0; i < k.length; i++) n = Math.imul(n ^ k.charCodeAt(i), 2654435761) >>> 0;
  let s = n || 7;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const _p = { x: 0, y: 0, z: 0 };
const _v = new THREE.Vector3();
const _star = new THREE.Vector3();
const _aim = new THREE.Vector3();
const look = new THREE.Vector3();
const side = new THREE.Vector3();
const fwd = new THREE.Vector3();
const rightV = new THREE.Vector3();
const upV = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

const TERMINATOR = 1.62;
const FOV_TALL = 56;
const FOV_WIDE = 48;

function heroBody() {
  const worlds = BODIES.filter((b) => b.kind !== "star" && !b.parent);
  if (!worlds.length) return null;
  const ringed = worlds.filter((b) => b.rings);
  const giants = worlds.filter((b) => b.kind === "gas" || b.kind === "ice");
  const pool = ringed.length ? ringed : giants.length ? giants : worlds;
  return pool.reduce((a, b) => (b.radius > a.radius ? b : a));
}

function heroMoon(hero) {
  if (!hero) return null;
  const moons = BODIES.filter((b) => b.parent === hero.id);
  return moons.length ? moons.reduce((a, b) => (b.radius > a.radius ? b : a)) : null;
}

function nebulaTexture(seedStr, starHex) {
  const rnd = seeded(`neb:${seedStr}`);
  const W = 2048, H = 1024;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");

  g.fillStyle = "#04050b";
  g.fillRect(0, 0, W, H);

  const accent = new THREE.Color(starHex || "#ffb56b");
  const COSMIC = ["#2b4f8f", "#1d6f7a", "#5a2f7d", "#8f3358", "#25567a", "#6a3f8c"];
  const palette = [
    new THREE.Color(COSMIC[Math.floor(rnd() * COSMIC.length)]),
    new THREE.Color(COSMIC[Math.floor(rnd() * COSMIC.length)]),
    accent,
  ];

  const rgbOf = (c, a) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a.toFixed(3)})`;

  g.globalCompositeOperation = "lighter";
  const regions = 2 + Math.floor(rnd() * 2);
  for (let c = 0; c < regions; c++) {
    const cx = (c + 0.5 + (rnd() - 0.5) * 0.5) * (W / regions);
    const cy = H * (0.3 + rnd() * 0.4);
    const col = palette[c % palette.length];
    const reach = W * (0.10 + rnd() * 0.06);
    const strength = c === regions - 1 ? 0.9 : 1;
    const blobs = 110 + Math.floor(rnd() * 70);
    for (let i = 0; i < blobs; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.pow(rnd(), 0.55) * reach;
      const x = cx + Math.cos(a) * d * 1.7;
      const y = cy + Math.sin(a) * d * 0.6;
      const r = (30 + rnd() * 170) * (1 - d / (reach * 1.5));
      if (r <= 2) continue;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, rgbOf(col, (0.11 + rnd() * 0.13) * strength));
      grd.addColorStop(1, rgbOf(col, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 5; i++) {
      const x = cx + (rnd() - 0.5) * reach * 1.6;
      const y = cy + (rnd() - 0.5) * reach * 0.7;
      const r = 40 + rnd() * 90;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, rgbOf(col.clone().offsetHSL(0, -0.15, 0.26), 0.3));
      grd.addColorStop(1, rgbOf(col, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }

  g.globalCompositeOperation = "source-over";
  for (let i = 0; i < 150; i++) {
    const x = rnd() * W, y = H * (0.15 + rnd() * 0.7);
    const r = 40 + rnd() * 210;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(3,4,9,${(0.12 + rnd() * 0.24).toFixed(3)})`);
    grd.addColorStop(1, "rgba(3,4,9,0)");
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3000; i++) {
    const x = rnd() * W, y = rnd() * H;
    const a = 0.1 + Math.pow(rnd(), 3) * 0.7;
    const s = rnd() < 0.04 ? 1.8 : 0.9;
    g.fillStyle = `rgba(226,234,246,${a.toFixed(3)})`;
    g.fillRect(x, y, s, s);
  }
  g.globalCompositeOperation = "source-over";

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

export function mountAttract({ scene, camera, canvas = null, worldRoot = null, reduced = false, quality = "full", shellRadius = 1.5e7 }) {
  const owned = [];
  let sky = null;
  let hull = null;
  let hullAnim = null;
  let rim = null;
  let theta = 0.55;
  let drift = 0;
  let active = quality !== "off";
  let hero = null;
  let moon = null;
  let seedKey = null;
  let hullLen = 2.4;
  let bandCache = null;
  let bandAt = -99;
  let up = false;

  function buildSky() {
    if (sky || !active || quality === "low") return;
    if (typeof document === "undefined") return;
    const star = BODIES.find((b) => b.kind === "star");
    const tex = nebulaTexture(currentSystem?.seed ?? "sol", star?.color);
    const geo = new THREE.SphereGeometry(shellRadius * 1.7, 32, 20);
    const mat = new THREE.MeshBasicMaterial({
      map: tex, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    });
    mat.color.setScalar(0);
    sky = new THREE.Mesh(geo, mat);
    sky.renderOrder = -1000;
    sky.frustumCulled = false;
    scene.add(sky);
    owned.push(geo, mat, tex);
    up = true;
  }

  function buildHull() {
    if (hull || !active || quality === "low") return;
    const ids = Object.keys(SHIP_DB ?? {});
    const rnd = seeded(`hero:${currentSystem?.seed ?? "sol"}`);
    const id = ids.length ? ids[Math.floor(rnd() * ids.length)] : DEFAULT_SHIP_ID;
    const def = shipById(id) ?? shipById(DEFAULT_SHIP_ID);
    if (!def) return;
    try {
      hull = forgeShipScaled(def, `attract:${currentSystem?.seed ?? "sol"}`, {
        detail: quality === "high" ? "full" : "lite",
        analyze: false,
        pointLights: false,
      });
    } catch (err) {
      console.warn("[attract] hull", err);
      hull = null;
      return;
    }
    hull.frustumCulled = false;
    hull.renderOrder = 10;
    hull.userData.attract = true;
    const box = new THREE.Box3().setFromObject(hull);
    const size = box.getSize(new THREE.Vector3());
    hullLen = Math.max(size.x, size.y, size.z) || def.dims?.[0] || 2.4;
    scene.add(hull);
    hullAnim = hull.userData?.gen?.anim ?? null;

    rim = new THREE.DirectionalLight(0x9fc8ff, 1.5);
    rim.position.set(-3, 2, 4);
    rim.target.position.set(0, 0, 0);
    scene.add(rim);
    scene.add(rim.target);
    up = true;
  }

  function retarget() {
    const key = currentSystem?.seed ?? "sol";
    if (key === seedKey && hero && bodyById(hero.id)) return;
    seedKey = key;
    hero = heroBody();
    moon = heroMoon(hero);
    if (sky) {
      const i = owned.indexOf(sky.material.map);
      sky.material.map?.dispose();
      if (i >= 0) owned.splice(i, 1);
      const star = BODIES.find((b) => b.kind === "star");
      const tex = nebulaTexture(key, star?.color);
      sky.material.map = tex;
      sky.material.needsUpdate = true;
      owned.push(tex);
    }
  }

  function place(dt, origin) {
    if (!active) return false;
    retarget();
    if (!hero) return false;

    buildSky();
    buildHull();

    theta += dt * (reduced ? 0.004 : 0.013);
    drift += dt;

    bodyPosition(hero.id, sim.time, _p);
    _star.set(-_p.x, -_p.y, -_p.z).normalize();

    _v.set(0, 1, 0);
    if (Math.abs(_star.y) > 0.94) _v.set(1, 0, 0);
    const right = new THREE.Vector3().crossVectors(_star, _v).normalize();
    const upAxis = new THREE.Vector3().crossVectors(right, _star).normalize();

    const swing = Math.sin(theta * 0.37) * 0.5;
    const tilt = 0.22 + Math.sin(theta * 0.21) * 0.16;
    const dir = new THREE.Vector3()
      .addScaledVector(_star, Math.cos(TERMINATOR))
      .addScaledVector(right, Math.sin(TERMINATOR) * Math.cos(swing))
      .addScaledVector(upAxis, Math.sin(TERMINATOR) * Math.sin(swing) + tilt)
      .normalize();

    const shot = band(camera);
    const half = Math.tan(((camera.aspect < 1 ? FOV_TALL : FOV_WIDE) * Math.PI) / 360);
    const standOff = Math.min(14, Math.max(2.6, 1 / Math.max(0.04, shot.worldFill * half)));
    const dist = hero.radius * standOff;
    origin.x = _p.x + dir.x * dist;
    origin.y = _p.y + dir.y * dist;
    origin.z = _p.z + dir.z * dist;

    look.copy(dir).multiplyScalar(-dist);
    up = true;
    return true;
  }

  function band(cam) {
    const now = drift;
    if (bandCache && now - bandAt < 0.5) return bandCache;
    bandAt = now;

    let b = { cx: 0, cy: 0, w: 2, h: 2 };
    const cv = canvas?.getBoundingClientRect?.();
    const cardEl = typeof document !== "undefined" ? document.querySelector(".start-card") : null;
    const shown = cardEl && (cardEl.offsetWidth > 0 || cardEl.offsetHeight > 0);
    const card = shown ? cardEl.getBoundingClientRect() : null;
    if (cv && cv.width > 0 && cv.height > 0 && card && card.width > 0 && card.height > 0) {
      const nx = (px) => (2 * (px - cv.left)) / cv.width - 1;
      const ny = (py) => 1 - (2 * (py - cv.top)) / cv.height;
      const L = nx(card.left), R = nx(card.right), T = ny(card.top), B = ny(card.bottom);
      const bands = [
        { cx: (R + 1) / 2, cy: 0, w: Math.max(0, 1 - R), h: 2 },
        { cx: (L - 1) / 2, cy: 0, w: Math.max(0, L + 1), h: 2 },
        { cx: 0, cy: (T + 1) / 2, w: 2, h: Math.max(0, 1 - T) },
        { cx: 0, cy: (B - 1) / 2, w: 2, h: Math.max(0, B + 1) },
      ];
      b = bands.reduce((a, x) => (x.w * x.h > a.w * a.h ? x : a));
      if (b.w < 0.5 || b.h < 0.5) b = { cx: 0, cy: 0, w: 2, h: 2 };
    }

    const wide = b.w * cam.aspect > b.h;
    const hx = wide ? -0.30 : -0.22, hy = wide ? 0.16 : 0.26;
    bandCache = {
      world: [b.cx + hx * b.w, b.cy + hy * b.h],
      hull: [b.cx - hx * b.w * 0.9, b.cy - hy * b.h * 0.85],
      worldFill: Math.min(b.w * cam.aspect, b.h) * 0.23,
      hullFill: Math.min(b.w * cam.aspect, b.h) * 0.15,
    };
    return bandCache;
  }

  const tanHalf = (cam) => Math.tan((cam.fov * Math.PI) / 360);

  function atNDC(nx, ny, dist, cam, out) {
    const k = tanHalf(cam) * dist;
    fwd.set(0, 0, -1).applyQuaternion(cam.quaternion);
    rightV.set(1, 0, 0).applyQuaternion(cam.quaternion);
    upV.set(0, 1, 0).applyQuaternion(cam.quaternion);
    return out.set(0, 0, 0)
      .addScaledVector(fwd, dist)
      .addScaledVector(rightV, nx * k * cam.aspect)
      .addScaledVector(upV, ny * k);
  }

  function aim(cam) {
    if (!active || !hero || look.lengthSq() === 0) return false;

    const shot = band(cam);
    cam.fov = cam.aspect < 1 ? FOV_TALL : FOV_WIDE;
    cam.position.set(0, 0, 0);

    cam.lookAt(look.x, look.y, look.z);
    cam.updateProjectionMatrix();

    const len = look.length() || 1;
    const k = tanHalf(cam) * len;
    fwd.set(0, 0, -1).applyQuaternion(cam.quaternion);
    rightV.set(1, 0, 0).applyQuaternion(cam.quaternion);
    upV.set(0, 1, 0).applyQuaternion(cam.quaternion);
    _aim.copy(look)
      .addScaledVector(rightV, -shot.world[0] * k * cam.aspect)
      .addScaledVector(upV, -shot.world[1] * k);
    cam.lookAt(_aim.x, _aim.y, _aim.z);
    cam.updateProjectionMatrix();

    if (hull) {
      const halfLen = (hullLen || 2.4) * 0.5;
      const wantY = shot.hullFill;
      const dist = Math.max(3, halfLen / Math.max(0.02, wantY * tanHalf(cam)));

      const t = drift * (reduced ? 0.03 : 0.09);
      const sway = Math.sin(t * 0.7), rise = Math.sin(t * 0.43 + 1.1);
      atNDC(shot.hull[0] + sway * 0.06, shot.hull[1] + rise * 0.04, dist, cam, hull.position);
      hull.quaternion.copy(cam.quaternion);
      hull.rotateY(-0.78 + sway * 0.12);
      hull.rotateX(0.14 + rise * 0.06);
      hull.rotateZ(sway * 0.05);
    }
    return true;
  }

  function orbitLines(on) {
    if (!worldRoot) return;
    for (const o of worldRoot.children) if (o.userData && o.userData.orbit) o.visible = on;
  }

  function step(dt) {
    if (!active) return;
    orbitLines(false);
    if (sky && sky.material.color.r < 1) {
      sky.material.color.setScalar(Math.min(1, sky.material.color.r + dt * 0.8));
    }
    if (hull && hullAnim) {
      try { tickHull(hull, dt, drift, { throttle: 0.32 }); } catch {}
    }
  }

  function stop() {
    if (hull) {
      scene.remove(hull);
      try { releaseHull(hull); } catch {}
      hull = null;
      hullAnim = null;
    }
    if (rim) {
      scene.remove(rim.target);
      scene.remove(rim);
      rim.dispose?.();
      rim = null;
    }
    if (sky) {
      scene.remove(sky);
      sky = null;
    }
    for (const o of owned.splice(0)) o.dispose?.();
    bandCache = null;
    up = false;
    orbitLines(true);
  }

  function dispose() {
    stop();
    active = false;
  }

  return {
    place, aim, step, stop, dispose,
    get active() { return active && up; },
    get hero() { return hero?.name ?? null; },
    get moon() { return moon?.name ?? null; },
  };
}
