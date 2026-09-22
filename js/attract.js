/* LIVING GALAXY — the attract scene.
 *
 * The title screen was already rendering the whole generated system. It just
 * looked empty, because the menu camera parked twenty-six star-radii out and
 * aimed at the barycentre: every world in the sky was there and every world
 * was sub-pixel. Nothing was missing — the shot was wrong.
 *
 * So this is a camera director, not a second scene. It picks the best body in
 * whatever sky the menu loaded, frames it near its terminator so the light
 * rakes across the limb instead of flattening it, hangs one real generated
 * hull in the foreground, and lays a nebula behind the existing starfield.
 * Everything in frame is the same asset the game flies through — the same
 * shipgen hull, the same painted surface, the same ring texture.
 *
 * It owns three things and disposes all three: the nebula shell, the hero
 * hull, and one rim light. It never touches the scene it borrows.
 *
 *   const attract = mountAttract({ scene, camera, reduced, quality });
 *   attract.place(dt, origin);   // menu branch of the floating origin
 *   attract.aim(camera);         // menu branch of the camera block
 *   attract.stop(); attract.dispose();
 */

import * as THREE from "../vendor/three.module.min.js";
import { BODIES, bodyById, bodyPosition, currentSystem } from "./bodies.js";
import { sim } from "./sim.js";
import { forgeShipScaled, tickHull, releaseHull } from "./shipforge.js";
import { shipById, SHIP_DB, DEFAULT_SHIP_ID } from "./shipdb.js";

/* Its own seeded rng rather than an import, so this file drops into a tree
 * that does not have js/names.js yet and still runs. Same mulberry the rest
 * of LIVING GALAXY uses — a sky seed gives the same nebula on every device. */
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

/* How far off the star-to-planet line the camera sits. Straight down the
 * light is a flat disc; straight across it is a sliver. This is the angle
 * where a limb reads as a sphere and the night side still has a shape. */
const TERMINATOR = 1.62;      // radians off the sun vector
const FOV_TALL = 56;
const FOV_WIDE = 48;

/* ---- the shot ----------------------------------------------------------- */

/**
 * The most photogenic thing in this sky. Rings first — a ringed giant is the
 * one silhouette that reads instantly at phone width — then the biggest
 * giant, then whatever is largest and is not the star.
 */
function heroBody() {
  const worlds = BODIES.filter((b) => b.kind !== "star" && !b.parent);
  if (!worlds.length) return null;
  const ringed = worlds.filter((b) => b.rings);
  const giants = worlds.filter((b) => b.kind === "gas" || b.kind === "ice");
  const pool = ringed.length ? ringed : giants.length ? giants : worlds;
  return pool.reduce((a, b) => (b.radius > a.radius ? b : a));
}

/** A moon of the hero, if it has one — something for the eye to find. */
function heroMoon(hero) {
  if (!hero) return null;
  const moons = BODIES.filter((b) => b.parent === hero.id);
  return moons.length ? moons.reduce((a, b) => (b.radius > a.radius ? b : a)) : null;
}

/* ---- the backdrop -------------------------------------------------------
 * A painted nebula, once, on a canvas. Two clouds in the star's own colour
 * and its complement, a dust lane between them, and a scatter of faint
 * stars underneath the real starfield so the depth does not stop dead at
 * the point sprites.
 */

function nebulaTexture(seedStr, starHex) {
  const rnd = seeded(`neb:${seedStr}`);
  const W = 2048, H = 1024;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");

  g.fillStyle = "#04050b";
  g.fillRect(0, 0, W, H);

  /* Most of a sky has to stay black or none of it reads as space. The first
   * pass washed the whole sphere in the star's own colour and the result was
   * a flat olive fog — so the clouds are confined to two or three regions
   * now, drawn cool with the star's hue as an accent rather than the theme,
   * and everything between them is left alone. */
  const accent = new THREE.Color(starHex || "#ffb56b");
  const COSMIC = ["#2b4f8f", "#1d6f7a", "#5a2f7d", "#8f3358", "#25567a", "#6a3f8c"];
  const palette = [
    new THREE.Color(COSMIC[Math.floor(rnd() * COSMIC.length)]),
    new THREE.Color(COSMIC[Math.floor(rnd() * COSMIC.length)]),
    accent,
  ];

  const rgbOf = (c, a) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a.toFixed(3)})`;

  /* Clouds: soft radial blooms stacked additively, which is what gives the
   * fibrous look a single gradient never does. Painted a little hotter than
   * looks right on the raw canvas, because ACES tone mapping is brutal to
   * the low end and eats anything subtle. */
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
    /* A few bright cores, so the cloud has somewhere the eye lands. */
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

  /* Dust: the dark half of a nebula is what makes the bright half read. */
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

  /* Field stars, under the real ones, so depth does not stop dead at the
   * point sprites. */
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

/* ---- the director ------------------------------------------------------- */

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
  /* Whether anything of ours is currently in the scene, as opposed to
   * whether the director is switched on at all. The engine asks every frame
   * so it can stop us the moment the sim launches; it must not keep asking
   * after we have already come down. */
  let up = false;

  /* On a weak device "low" keeps the reframed camera — which is free, and is
   * most of what was wrong with the old title screen — and skips the two
   * things that actually cost: the nebula canvas and the forged hull. */

  /* The backdrop sits outside the starfield shell so the real points stay in
   * front of it, and it never writes depth — everything in the system draws
   * over it regardless of the numbers. */
  function buildSky() {
    if (sky || !active || quality === "low") return;
    if (typeof document === "undefined") return;
    const star = BODIES.find((b) => b.kind === "star");
    const tex = nebulaTexture(currentSystem?.seed ?? "sol", star?.color);
    const geo = new THREE.SphereGeometry(shellRadius * 1.7, 32, 20);
    /* Opaque, not transparent: three draws the transparent list after the
     * opaque one and depthTest:false would then paint the nebula over the
     * whole system. As an opaque mesh with a very low renderOrder and no
     * depth write it goes down first and everything else paints on top —
     * the classic skybox order. The fade-in rides on material colour
     * instead of opacity, for the same reason. */
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

  /* One real hull out of the forge — the same call the sky's traffic uses,
   * at lite detail because nothing here is closer than six units and the
   * greeble would cost frames nobody sees. */
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
    /* Measure it rather than trusting dims: the forge normalises length, but
     * a three-quarter pose projects its beam as much as its length, and the
     * registry figure is the hull alone without masts or vanes. */
    const box = new THREE.Box3().setFromObject(hull);
    const size = box.getSize(new THREE.Vector3());
    hullLen = Math.max(size.x, size.y, size.z) || def.dims?.[0] || 2.4;
    scene.add(hull);
    hullAnim = hull.userData?.gen?.anim ?? null;

    /* The scene's one directional light stands in for the star, which leaves
     * the hull's near side black at this angle. A dim cool fill from the
     * opposite quarter is what makes it read as metal rather than a
     * silhouette — and it is the only light this module adds. */
    rim = new THREE.DirectionalLight(0x9fc8ff, 1.5);
    rim.position.set(-3, 2, 4);
    rim.target.position.set(0, 0, 0);
    scene.add(rim);
    scene.add(rim.target);
    up = true;
  }

  /** Rebuild the shot when the menu changes sky. */
  function retarget() {
    const key = currentSystem?.seed ?? "sol";
    if (key === seedKey && hero && bodyById(hero.id)) return;
    seedKey = key;
    hero = heroBody();
    moon = heroMoon(hero);
    if (sky) {
      /* a new sky gets a new nebula */
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

  /**
   * Place the floating origin. The menu branch used to walk a circle around
   * the star; it now walks a slow arc around the hero world, holding the
   * terminator angle so the light stays raking however far round it gets.
   */
  function place(dt, origin) {
    if (!active) return false;
    retarget();
    if (!hero) return false;

    buildSky();
    buildHull();

    theta += dt * (reduced ? 0.004 : 0.013);
    drift += dt;

    bodyPosition(hero.id, sim.time, _p);
    _star.set(-_p.x, -_p.y, -_p.z).normalize();       // planet -> star

    /* A frame perpendicular to the star vector, so the camera can swing
     * around the terminator without ever crossing the poles. */
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

    /* How far back to stand is a framing decision, not a constant: it is
     * whatever puts the hero at the size the band can hold. */
    const shot = band(camera);
    const half = Math.tan(((camera.aspect < 1 ? FOV_TALL : FOV_WIDE) * Math.PI) / 360);
    const standOff = Math.min(14, Math.max(2.6, 1 / Math.max(0.04, shot.worldFill * half)));
    const dist = hero.radius * standOff;
    origin.x = _p.x + dir.x * dist;
    origin.y = _p.y + dir.y * dist;
    origin.z = _p.z + dir.z * dist;

    /* The camera sits at the floating origin, so everything it is told to
     * look at has to be expressed relative to that origin — not in absolute
     * world coordinates. The hero is exactly `dist` back down `dir`. */
    look.copy(dir).multiplyScalar(-dist);
    /* "Up" means the director is driving the menu, not that it has built
     * props: at low quality it builds nothing and still owns the camera and
     * the orbit lines, and the engine needs to know to stop us on launch or
     * the lines never come back. */
    up = true;
    return true;
  }

  /**
   * Aim, and hang the hull. The camera is at the origin in menu, so the
   * hull is positioned in camera space and then pushed into world space —
   * it is a foreground prop, not part of the floating-origin world.
   */
  /**
   * Where the shot can actually put things.
   *
   * The start card is not in a fixed place: it is bottom-centred on a phone
   * and a full-height left rail in landscape, and either could move again the
   * next time the CSS changes. Guessing produced a wide shot with the hero
   * world entirely behind the card. So measure it — find the largest band of
   * canvas the card does not cover, and compose inside that.
   *
   * Cheap, but not free, so it is cached: the card does not move between
   * frames.
   */
  function band(cam) {
    const now = drift;
    if (bandCache && now - bandAt < 0.5) return bandCache;
    bandAt = now;

    /* NDC: x and y both run -1 (left, bottom) to +1 (right, top). */
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
        { cx: (R + 1) / 2, cy: 0, w: Math.max(0, 1 - R), h: 2 },      // right of the card
        { cx: (L - 1) / 2, cy: 0, w: Math.max(0, L + 1), h: 2 },      // left of it
        { cx: 0, cy: (T + 1) / 2, w: 2, h: Math.max(0, 1 - T) },      // above it
        { cx: 0, cy: (B - 1) / 2, w: 2, h: Math.max(0, B + 1) },      // below it
      ];
      b = bands.reduce((a, x) => (x.w * x.h > a.w * a.h ? x : a));
      /* A sliver is not a composition; fall back to the whole frame. */
      if (b.w < 0.5 || b.h < 0.5) b = { cx: 0, cy: 0, w: 2, h: 2 };
    }

    /* The hero sits off-centre in its band, the hull opposite it, both
     * inset so nothing important touches an edge. */
    /* "Wide" is about the band's shape on screen, not its shape in NDC —
     * NDC is always 2x2 for a full frame however wide the window is. */
    const wide = b.w * cam.aspect > b.h;
    const hx = wide ? -0.30 : -0.22, hy = wide ? 0.16 : 0.26;
    bandCache = {
      world: [b.cx + hx * b.w, b.cy + hy * b.h],
      hull: [b.cx - hx * b.w * 0.9, b.cy - hy * b.h * 0.85],
      /* how much of the band's shorter side each subject fills */
      worldFill: Math.min(b.w * cam.aspect, b.h) * 0.23,
      hullFill: Math.min(b.w * cam.aspect, b.h) * 0.15,
    };
    return bandCache;
  }

  const tanHalf = (cam) => Math.tan((cam.fov * Math.PI) / 360);

  /** A point `dist` ahead of the camera that lands on (nx, ny) on screen. */
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

    /* Aim straight at the hero first, so the camera basis is settled, then
     * push the aim point the opposite way to slide the world into its
     * corner of the frame. */
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
      /* Distance is solved from how wide the hull should read on screen, not
       * fixed in world units — a hero that works on a phone is a speck on a
       * tablet otherwise. */
      const halfLen = (hullLen || 2.4) * 0.5;
      const wantY = shot.hullFill;                          // half-extent, NDC-y units
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

  /* Orbit lines are a navigation aid. At this camera they are meaningless
   * straight scratches across the sky, and they read as a rendering fault in
   * a still. Hidden while the shot is up, put back the moment it comes down —
   * their own builder owns them, this only toggles a flag. */
  function orbitLines(on) {
    if (!worldRoot) return;
    for (const o of worldRoot.children) if (o.userData && o.userData.orbit) o.visible = on;
  }

  /** Props that animate on their own — plumes, running lights. */
  function step(dt) {
    if (!active) return;
    orbitLines(false);
    if (sky && sky.material.color.r < 1) {
      /* fade the backdrop up, so the menu does not pop on first paint */
      sky.material.color.setScalar(Math.min(1, sky.material.color.r + dt * 0.8));
    }
    if (hull && hullAnim) {
      try { tickHull(hull, dt, drift, { throttle: 0.32 }); } catch { /* a hull that will not animate still renders */ }
    }
  }

  /** The game launched. Everything here is menu dressing — take it down. */
  function stop() {
    if (hull) {
      scene.remove(hull);
      try { releaseHull(hull); } catch { /* already gone */ }
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
