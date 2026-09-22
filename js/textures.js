import * as THREE from "../vendor/three.module.min.js";

/* LIVING GALAXY — surface painting.
 *
 * One painter per archetype surface. They all draw into an equirectangular
 * canvas that gets wrapped onto the sphere, so `v` is latitude and `u` is
 * longitude. Latitude is used for ice caps and banding; longitude wraps, so
 * noise is sampled on a cylinder to avoid a visible seam.
 */

/* Integer hash. The old sin-based one was costing seconds per system: a
 * 512x256 surface runs tens of millions of these. */
function hash(i, j, seed) {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 2246822519)) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

/* Raw fbm clusters hard around 0.5, which paints everything the middle of its
 * palette. Stretch it so a surface actually uses the colours it was given. */
function stretch(v, amp) {
  return Math.max(0, Math.min(1, (v - 0.5) * amp + 0.5));
}

function fbm(x, y, seed, oct = 4) {
  let v = 0;
  let a = 0.5;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    v += a * noise(x * f, y * f, seed + i * 19);
    norm += a;
    a *= 0.5;
    f *= 2;
  }
  return stretch(v / norm, 2.1);
}

/** Ridged noise — good for canyons, fractures and lava cracks. */
function ridge(x, y, seed, oct = 3) {
  let v = 0;
  let a = 0.5;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    v += a * (1 - Math.abs(noise(x * f, y * f, seed + i * 31) * 2 - 1));
    norm += a;
    a *= 0.5;
    f *= 2;
  }
  return stretch(v / norm, 1.7);
}

/** Seamless in longitude: sample the noise around a cylinder. */
function wrapped(u, v, scale, seed, fn = fbm) {
  const a = u * Math.PI * 2;
  return fn(Math.cos(a) * scale + scale, Math.sin(a) * scale + v * scale * 0.5, seed);
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Sample a 4-stop palette at t in 0..1. */
function ramp(pal, t) {
  const x = Math.max(0, Math.min(0.999, t)) * (pal.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = pal[i];
  const b = pal[i + 1] ?? pal[i];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

function mix(c, r, g, b, k) {
  c[0] += (r - c[0]) * k;
  c[1] += (g - c[1]) * k;
  c[2] += (b - c[2]) * k;
}

/* ---- painters ----------------------------------------------------------- */
/* Each returns [r,g,b] for one texel. u,v in 0..1; lat is -1..1.             */

const PAINT = {
  lava(u, v, lat, pal, seed) {
    const base = fbm(u * 8, v * 5, seed);
    const cracks = ridge(u * 14, v * 9, seed + 7, 5);
    const c = ramp(pal, base * 0.5);
    if (cracks > 0.72) {
      const heat = (cracks - 0.72) / 0.28;
      mix(c, 255, 140 + heat * 80, 40, Math.min(1, heat * 1.4));
    }
    return c;
  },

  barren(u, v, lat, pal, seed) {
    const n = fbm(u * 9, v * 7, seed);
    const c = ramp(pal, 0.25 + n * 0.7);
    /* impact basins */
    const cr = fbm(u * 22, v * 16, seed + 3, 3);
    if (cr > 0.7) mix(c, c[0] * 0.62, c[1] * 0.62, c[2] * 0.62, 1);
    return c;
  },

  metallic(u, v, lat, pal, seed) {
    const n = wrapped(u, v, 6, seed);
    const c = ramp(pal, 0.2 + n * 0.75);
    const sheen = ridge(u * 18, v * 12, seed + 5, 3);
    if (sheen > 0.68) mix(c, 220, 214, 200, (sheen - 0.68) * 1.6);
    return c;
  },

  desert(u, v, lat, pal, seed) {
    const dunes = fbm(u * 5, v * 12, seed) * 0.6 + Math.sin(v * 60 + fbm(u * 4, v * 4, seed) * 8) * 0.12;
    const c = ramp(pal, 0.28 + dunes * 0.85);
    if (Math.abs(lat) > 0.84) mix(c, 226, 232, 236, (Math.abs(lat) - 0.84) * 5);
    return c;
  },

  canyon(u, v, lat, pal, seed) {
    const r = ridge(u * 7, v * 5, seed, 5);
    const c = ramp(pal, 0.3 + r * 0.8);
    if (r < 0.32) mix(c, 24, 16, 12, (0.32 - r) * 2.4);
    return c;
  },

  salt(u, v, lat, pal, seed) {
    const n = fbm(u * 6, v * 5, seed);
    const flats = fbm(u * 3, v * 2.5, seed + 11);
    const c = ramp(pal, flats > 0.52 ? 0.72 + n * 0.28 : 0.15 + n * 0.4);
    return c;
  },

  ocean(u, v, lat, pal, seed) {
    const land = (fbm(u * 5, v * 4, seed) * 0.74 + fbm(u * 11, v * 9, seed + 4) * 0.26);
    const c = [];
    if (land > 0.5) {
      /* continents: shore, plain, upland */
      const h = (land - 0.5) / 0.5;
      const t = 0.45 + h * 0.5;
      const p = ramp(pal, t);
      c[0] = p[0];
      c[1] = p[1];
      c[2] = p[2];
      if (h > 0.72) mix(c, 210, 208, 196, (h - 0.72) * 2.2);
      /* arid belts either side of the equator */
      const arid = Math.exp(-Math.pow((Math.abs(lat) - 0.28) * 6, 2));
      mix(c, 178, 150, 96, arid * 0.45);
    } else {
      const deep = land / 0.5;
      const p = ramp(pal, deep * 0.34);
      c[0] = p[0];
      c[1] = p[1];
      c[2] = p[2];
    }
    /* ice caps and cloud */
    const capEdge = 0.8 - fbm(u * 8, 1, seed + 9) * 0.1;
    if (Math.abs(lat) > capEdge) mix(c, 236, 242, 246, Math.min(1, (Math.abs(lat) - capEdge) * 7));
    const cloud = fbm(u * 7, v * 5, seed + 21) + fbm(u * 15, v * 11, seed + 22) * 0.4;
    if (cloud > 0.78) mix(c, 244, 246, 250, Math.min(0.85, (cloud - 0.78) * 3));
    return c;
  },

  jungle(u, v, lat, pal, seed) {
    const land = fbm(u * 4, v * 3.4, seed);
    const c = ramp(pal, land > 0.5 ? 0.5 + (land - 0.5) * 1.4 : land * 0.6);
    const canopy = fbm(u * 18, v * 14, seed + 6);
    if (land > 0.5) mix(c, 40, 92, 44, canopy * 0.5);
    const cloud = fbm(u * 6, v * 4, seed + 30);
    if (cloud > 0.7) mix(c, 232, 238, 232, (cloud - 0.7) * 2.4);
    return c;
  },

  steppe(u, v, lat, pal, seed) {
    const land = fbm(u * 4, v * 3, seed);
    const c = ramp(pal, 0.3 + land * 0.8);
    if (land < 0.34) mix(c, 46, 84, 108, (0.34 - land) * 3);
    if (Math.abs(lat) > 0.82) mix(c, 232, 238, 242, (Math.abs(lat) - 0.82) * 6);
    return c;
  },

  tundra(u, v, lat, pal, seed) {
    const land = fbm(u * 5, v * 4, seed);
    const c = ramp(pal, 0.25 + land * 0.7);
    if (land < 0.42) mix(c, 32, 60, 78, (0.42 - land) * 2.2);
    const frost = Math.max(0, Math.abs(lat) - 0.42) * 1.7 + fbm(u * 9, v * 7, seed + 13) * 0.2;
    mix(c, 236, 244, 248, Math.min(0.95, frost));
    return c;
  },

  dying(u, v, lat, pal, seed) {
    const land = fbm(u * 5, v * 4, seed);
    const c = ramp(pal, 0.3 + land * 0.75);
    /* dry seabeds ringed with salt */
    const basin = fbm(u * 3, v * 2.6, seed + 8);
    if (basin < 0.4) {
      mix(c, 196, 186, 158, (0.4 - basin) * 2.2);
      if (basin > 0.34) mix(c, 232, 228, 210, 0.5);
    }
    return c;
  },

  sulfur(u, v, lat, pal, seed) {
    const deck = fbm(u * 4, v * 9, seed) + Math.sin(v * 26 + fbm(u * 3, v * 3, seed) * 6) * 0.16;
    const c = ramp(pal, 0.35 + deck * 0.7);
    const swirl = ridge(u * 9, v * 18, seed + 4, 3);
    mix(c, 244, 226, 168, swirl * 0.22);
    return c;
  },

  haze(u, v, lat, pal, seed) {
    const n = fbm(u * 3, v * 6, seed);
    const c = ramp(pal, 0.4 + n * 0.55);
    mix(c, 226, 214, 184, 0.25);
    return c;
  },

  storm(u, v, lat, pal, seed) {
    const band = Math.sin(v * Math.PI * 9 + fbm(u * 3, v * 3, seed) * 5) * 0.5 + 0.5;
    const cyc = fbm(u * 10, v * 16, seed + 2);
    const c = ramp(pal, 0.25 + band * 0.5 + cyc * 0.3);
    /* one great storm, parked off the equator */
    const sx = 0.32;
    const sy = 0.42;
    const du = Math.min(Math.abs(u - sx), 1 - Math.abs(u - sx)) * 3.4;
    const dv = (v - sy) * 7;
    const d = Math.hypot(du, dv);
    if (d < 1) {
      const k = (1 - d) * (1 - d);
      mix(c, 226, 128, 92, k * 0.8);
    }
    return c;
  },

  bands(u, v, lat, pal, seed) {
    /* Belts and zones, sheared by longitude so they look like they are moving. */
    const shear = fbm(u * 3, v * 2, seed) * 0.06;
    const y = v + shear;
    const band = Math.sin(y * Math.PI * 16) * 0.5 + 0.5;
    const fine = Math.sin(y * Math.PI * 44 + fbm(u * 6, v * 5, seed + 3) * 6) * 0.5 + 0.5;
    const turb = fbm(u * 14, v * 22, seed + 7);
    const c = ramp(pal, 0.2 + band * 0.55 + fine * 0.15 + turb * 0.15);
    /* white ammonia zones near the tropics */
    if (Math.abs(lat) < 0.5 && fine > 0.8) mix(c, 240, 232, 214, (fine - 0.8) * 2);
    /* a storm oval */
    const du = Math.min(Math.abs(u - 0.62), 1 - Math.abs(u - 0.62)) * 4.4;
    const dv = (v - 0.6) * 13;
    const d = Math.hypot(du, dv);
    if (d < 1) mix(c, 214, 120, 84, (1 - d) * 0.75);
    return c;
  },

  methane(u, v, lat, pal, seed) {
    const land = fbm(u * 5, v * 4, seed);
    const c = ramp(pal, 0.3 + land * 0.7);
    /* hydrocarbon lakes toward the poles */
    const lake = fbm(u * 9, v * 7, seed + 5);
    if (Math.abs(lat) > 0.4 && lake < 0.36) mix(c, 26, 30, 22, (0.36 - lake) * 3);
    mix(c, 214, 168, 96, 0.18);
    return c;
  },

  glacier(u, v, lat, pal, seed) {
    const sheet = fbm(u * 6, v * 5, seed);
    const c = ramp(pal, 0.4 + sheet * 0.6);
    const frac = ridge(u * 16, v * 12, seed + 9, 4);
    if (frac > 0.74) mix(c, 120, 168, 190, (frac - 0.74) * 2.4);
    return c;
  },

  cratered(u, v, lat, pal, seed) {
    const base = fbm(u * 7, v * 6, seed);
    const c = ramp(pal, 0.3 + base * 0.6);
    /* maria: big dark flood basalt patches */
    const maria = fbm(u * 3, v * 2.6, seed + 2);
    if (maria > 0.56) mix(c, c[0] * 0.48, c[1] * 0.48, c[2] * 0.5, Math.min(1, (maria - 0.56) * 6));
    /* craters at three sizes */
    for (const [sc, k] of [[9, 0.62], [19, 0.66], [38, 0.7]]) {
      const cr = fbm(u * sc, v * sc * 0.8, seed + sc, 2);
      if (cr > k + 0.08) {
        /* floor */
        mix(c, c[0] * 0.6, c[1] * 0.6, c[2] * 0.62, 1);
      } else if (cr > k) {
        /* bright rim and ejecta */
        mix(c, 236, 232, 222, (cr - k) * 7);
      }
    }
    return c;
  },

  iceshell(u, v, lat, pal, seed) {
    const n = fbm(u * 6, v * 5, seed);
    const c = ramp(pal, 0.5 + n * 0.5);
    /* the characteristic tangle of fractures */
    const f1 = ridge(u * 9, v * 7, seed + 4, 3);
    const f2 = ridge(u * 17, v * 13, seed + 8, 3);
    if (f1 > 0.76) mix(c, 150, 106, 78, (f1 - 0.76) * 3.4);
    if (f2 > 0.8) mix(c, 176, 132, 96, (f2 - 0.8) * 3);
    return c;
  },

  sulfurmoon(u, v, lat, pal, seed) {
    const n = fbm(u * 8, v * 6, seed);
    const c = ramp(pal, 0.3 + n * 0.7);
    const vents = fbm(u * 20, v * 16, seed + 6, 3);
    if (vents > 0.78) mix(c, 60, 40, 20, (vents - 0.78) * 4);
    if (vents < 0.2) mix(c, 250, 236, 160, (0.2 - vents) * 3);
    return c;
  },

  carbon(u, v, lat, pal, seed) {
    const n = fbm(u * 10, v * 8, seed);
    const c = ramp(pal, 0.15 + n * 0.6);
    const cr = fbm(u * 24, v * 18, seed + 3, 3);
    if (cr > 0.74) mix(c, c[0] * 0.6, c[1] * 0.6, c[2] * 0.6, 1);
    return c;
  },

  tholin(u, v, lat, pal, seed) {
    const n = fbm(u * 5, v * 4, seed);
    const c = ramp(pal, 0.25 + n * 0.75);
    const patch = fbm(u * 11, v * 9, seed + 4);
    if (patch > 0.66) mix(c, 236, 226, 214, (patch - 0.66) * 2);
    if (Math.abs(lat) > 0.7) mix(c, 226, 232, 236, (Math.abs(lat) - 0.7) * 2.6);
    return c;
  },

  rubble(u, v, lat, pal, seed) {
    const n = fbm(u * 14, v * 11, seed, 4);
    const c = ramp(pal, 0.2 + n * 0.75);
    const grain = fbm(u * 40, v * 32, seed + 9, 2);
    mix(c, c[0] * 0.8, c[1] * 0.8, c[2] * 0.8, grain > 0.6 ? 0.5 : 0);
    return c;
  },

  star(u, v, lat, pal, seed) {
    const gran = fbm(u * 26, v * 20, seed, 4);
    const cell = fbm(u * 60, v * 46, seed + 5, 2);
    const c = ramp(pal, 0.45 + gran * 0.5 + cell * 0.15);
    /* spots */
    const sp = fbm(u * 7, v * 5, seed + 12);
    if (sp > 0.79) mix(c, c[0] * 0.55, c[1] * 0.5, c[2] * 0.5, (sp - 0.79) * 4);
    return c;
  },
};

/* Fallback painters when a body has no archetype (hand-built Sol, mostly). */
const KIND_SURFACE = {
  star: "star",
  gas: "bands",
  ice: "bands",
  cloud: "sulfur",
  terra: "ocean",
  rocky: "barren",
  moon: "cratered",
  dwarf: "tholin",
};

/** Builds a 4-stop palette around a base colour when an archetype has none. */
function paletteFrom(hex) {
  const [r, g, b] = hexToRgb(hex);
  return [
    [r * 0.28, g * 0.28, b * 0.3],
    [r * 0.62, g * 0.62, b * 0.64],
    [r, g, b],
    [Math.min(255, r * 1.35 + 26), Math.min(255, g * 1.35 + 26), Math.min(255, b * 1.35 + 26)],
  ];
}

/**
 * @param kind    body kind, used when there is no archetype
 * @param baseHex fallback colour
 * @param seed    stable per body
 * @param size    texture edge
 * @param arch    archetype record from archetypes.js, if the body has one
 */
export function makePlanetTexture(kind, baseHex, seed, size = 256, arch = null) {
  const canvas = document.createElement("canvas");
  canvas.width = size * 2;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(size * 2, size);

  const surface = arch?.surface ?? KIND_SURFACE[kind] ?? "barren";
  seed = Math.round(seed) | 0;
  const paint = PAINT[surface] ?? PAINT.barren;
  const pal = arch?.palette ? arch.palette.map(hexToRgb) : paletteFrom(baseHex);
  const w = size * 2;

  for (let y = 0; y < size; y++) {
    const v = y / size;
    const lat = v * 2 - 1;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const c = paint(u, v, lat, pal, seed);
      /* Poles converge on the sphere, so soften the pinch a little. */
      const pinch = 1 - Math.pow(Math.abs(lat), 8) * 0.35;
      const i = (y * w + x) * 4;
      img.data[i] = Math.max(0, Math.min(255, c[0] * pinch));
      img.data[i + 1] = Math.max(0, Math.min(255, c[1] * pinch));
      img.data[i + 2] = Math.max(0, Math.min(255, c[2] * pinch));
      img.data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function makeRingTexture(seed = 1) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(size, 8);
  for (let x = 0; x < size; x++) {
    const u = x / size;
    /* several gaps, and fine structure between them */
    let a = 0.3 + Math.sin(u * 90 + seed) * 0.16 + Math.sin(u * 23 + seed * 2) * 0.12 + fbm(u * 40, 0.5, seed, 3) * 0.2;
    for (const [g, wgap] of [[0.36, 0.018], [0.62, 0.03], [0.78, 0.012]]) {
      if (Math.abs(u - g) < wgap) a *= 0.08;
    }
    if (u < 0.06 || u > 0.97) a = 0;
    const tint = 200 + fbm(u * 18, 0.2, seed + 5, 2) * 46;
    for (let y = 0; y < 8; y++) {
      const i = (y * size + x) * 4;
      img.data[i] = tint;
      img.data[i + 1] = tint * 0.95;
      img.data[i + 2] = tint * 0.84;
      img.data[i + 3] = Math.max(0, Math.min(235, a * 235));
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeGlowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, "rgba(255, 230, 180, 0.95)");
  g.addColorStop(0.25, "rgba(255, 180, 90, 0.35)");
  g.addColorStop(1, "rgba(255, 140, 40, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeNameSprite(text, color = "#eceef2") {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9 });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(6, 1.5, 1);
  return sprite;
}
