export const SURFACES = ["metal", "stone", "carbon", "ice"];

export const LOOK = {
  iron_ore:     { surface: "metal",  tint: 0xb4795a, note: "rust streaks" },
  nickel_ore:   { surface: "metal",  tint: 0xb9c2bd, note: "pale grey-green" },
  chromite:     { surface: "metal",  tint: 0x6f7480, note: "blue-black" },
  ilmenite:     { surface: "metal",  tint: 0x5d5a63, note: "iron-titanium black" },
  pentlandite:  { surface: "metal",  tint: 0xc0a173, note: "bronze" },
  galena:       { surface: "metal",  tint: 0x9aa3ad, note: "lead-grey, cubic cleavage" },
  platinum_ore: { surface: "metal",  tint: 0xdcdfe4, note: "bright white metal" },
  iridium_ore:  { surface: "metal",  tint: 0xc8d4dc, note: "cold silver" },
  uraninite:    { surface: "metal",  tint: 0x4e5b45, note: "pitchblende, greenish" },
  copper_ore:   { surface: "metal",  tint: 0x9ec4a8, note: "malachite green" },
  cassiterite:  { surface: "metal",  tint: 0x8a6f56, note: "resin brown" },
  sphalerite:   { surface: "metal",  tint: 0xa08154, note: "amber-brown" },
  silicate:     { surface: "stone",  tint: 0x9a9186, note: "pale stone" },
  regolith:     { surface: "stone",  tint: 0x8d857a, note: "grey dust" },
  bauxite:      { surface: "stone",  tint: 0xbb7f52, note: "red earth" },
  monazite:     { surface: "stone",  tint: 0xa8895f, note: "honey grains" },
  phosphate:    { surface: "stone",  tint: 0xa9a37f, note: "dull yellow" },
  sulfur:       { surface: "stone",  tint: 0xcbb44a, note: "sulfur yellow" },
  carbonaceous: { surface: "carbon", tint: 0x4a474a, note: "soot" },
  tholins:      { surface: "carbon", tint: 0x8a5638, note: "organic red-brown" },
  water_ice:    { surface: "ice",    tint: 0xcfe4f0, note: "blue-white" },
  methane_ice:  { surface: "ice",    tint: 0xc6d8c6, note: "green-tinged clathrate" },
  ammonia_ice:  { surface: "ice",    tint: 0xd8d2ee, note: "violet-white" },
  nitrogen_ice: { surface: "ice",    tint: 0xdfeef2, note: "near colourless" },
  hydrogen:     { surface: "ice",    tint: 0xe2eaf4, note: "frost" },
  deuterium:    { surface: "ice",    tint: 0xd2e6f4, note: "frost" },
};

const FALLBACK = { surface: "stone", tint: 0x8f877c, note: "" };

const ALBEDO = {
  iron_ore:     [0x6b4030, "oxide"],     nickel_ore:   [0x8b9197, "sulfide"],
  silicate:     [0x8a7b63, "silicate"],  bauxite:      [0xa86a3a, "oxide"],
  copper_ore:   [0x2f6b4a, "sulfide"],   cassiterite:  [0x4a3a32, "oxide"],
  chromite:     [0x2a2c2e, "oxide"],     ilmenite:     [0x3a2e32, "oxide"],
  pentlandite:  [0x6a6340, "sulfide"],   sphalerite:   [0x5a4830, "sulfide"],
  galena:       [0x6a6e74, "sulfide"],   monazite:     [0xb48a4a, "phosphate"],
  platinum_ore: [0xb8c0c6, "PGE"],       iridium_ore:  [0x9aa0aa, "PGE"],
  uraninite:    [0x3a4630, "radioactive"], water_ice:  [0xc8d8e8, "ice"],
  methane_ice:  [0xb7c9c0, "ice"],       ammonia_ice:  [0xd0dce4, "ice"],
  nitrogen_ice: [0xc4d0e6, "ice"],       sulfur:       [0xd2c04a, "native"],
  phosphate:    [0xc2b48a, "phosphate"], carbonaceous: [0x2a2420, "organic"],
  regolith:     [0x7a7064, "silicate"],  tholins:      [0x6a3020, "organic"],
  helium3:      [0xd8e8ff, "volatile"],  hydrogen:     [0xe8eef8, "volatile"],
  metallic_h:   [0xc8d0dc, "volatile"],  deuterium:    [0xb8c8e0, "volatile"],
};

const SURFACE_PBR = {
  metal:  { metal: 0.82, rough: 0.3,  glow: 0,    crystal: "nugget" },
  stone:  { metal: 0.12, rough: 0.78, glow: 0,    crystal: "block" },
  carbon: { metal: 0.05, rough: 0.86, glow: 0,    crystal: "block" },
  ice:    { metal: 0.24, rough: 0.22, glow: 0.06, crystal: "prism" },
};

const PBR_OVERRIDE = {
  platinum_ore: { metal: 0.95, rough: 0.18, crystal: "nugget" },
  iridium_ore:  { metal: 0.95, rough: 0.16, crystal: "nugget" },
  uraninite:    { metal: 0.4,  rough: 0.44, glow: 0.55, crystal: "octahedron" },
  galena:       { metal: 0.68, rough: 0.24, crystal: "cube" },
  chromite:     { metal: 0.6,  rough: 0.36, crystal: "octahedron" },
  ilmenite:     { metal: 0.52, rough: 0.4,  crystal: "hex" },
  monazite:     { metal: 0.22, rough: 0.42, glow: 0.12, crystal: "prism" },
  sphalerite:   { metal: 0.3,  rough: 0.3,  crystal: "tetrahedron" },
  cassiterite:  { metal: 0.45, rough: 0.34, crystal: "prism" },
  sulfur:       { metal: 0.02, rough: 0.52, glow: 0.1,  crystal: "prism" },
  tholins:      { metal: 0.03, rough: 0.9,  crystal: "block" },
  helium3:      { metal: 0.1,  rough: 0.3,  glow: 0.35, crystal: "hex" },
  deuterium:    { metal: 0.1,  rough: 0.3,  glow: 0.3,  crystal: "hex" },
  water_ice:    { glow: 0.1,   crystal: "prism" },
  methane_ice:  { glow: 0.14,  crystal: "prism" },
  ammonia_ice:  { glow: 0.12,  crystal: "prism" },
  nitrogen_ice: { glow: 0.1,   crystal: "prism" },
};

export function oreLook(id) {
  const base = LOOK[id] ?? FALLBACK;
  const pbr = SURFACE_PBR[base.surface] ?? SURFACE_PBR.stone;
  const [albedo, category] = ALBEDO[id] ?? [base.tint, "ore"];
  return { id, ...pbr, ...(PBR_OVERRIDE[id] ?? {}), surface: base.surface, tint: base.tint, note: base.note, albedo, category };
}

export function bodySurface(cls, iceAffinity = 0) {
  if (cls === "M" || cls === "X") return "metal";
  if (cls === "S" || cls === "V" || cls === "E") return "stone";
  return iceAffinity >= 0.9 ? "ice" : "carbon";
}

export function hexToRgb(hex) {
  return { r: ((hex >> 16) & 255) / 255, g: ((hex >> 8) & 255) / 255, b: (hex & 255) / 255 };
}

export function rockLook(rock) {
  const base = LOOK[rock?.ore] ?? FALLBACK;
  const surface = rock?.ice ? (LOOK[rock.ore]?.surface === "ice" ? "ice" : "ice") : base.surface;
  let r = (base.tint >> 16) & 255, g = (base.tint >> 8) & 255, b = base.tint & 255;
  if (rock?.rich) {
    const k = 1.22;
    r = Math.min(255, r * k); g = Math.min(255, g * k); b = Math.min(255, b * k);
  }
  const worn = rock?.worn ?? 0;
  if (worn > 0) {
    const t = worn * 0.65, grey = 132;
    r += (grey - r) * t; g += (grey - g) * t; b += (grey - b) * t;
  }
  return { surface, r: r / 255, g: g / 255, b: b / 255, rich: Boolean(rock?.rich) };
}

function hash(i, j, seed) {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 2246822519)) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function fbm(x, y, seed, oct = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += noise(x * f, y * f, seed + i * 91) * amp; amp *= 0.5; f *= 2; }
  return v;
}

function craterField(seed, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: hash(i, 7, seed),
      y: hash(i, 13, seed + 5),
      r: 0.012 + Math.pow(hash(i, 19, seed + 11), 3) * 0.1,
      d: 0.35 + hash(i, 23, seed + 17) * 0.65,
    });
  }
  return out;
}

const SURFACE_MIX = {
  metal:  [7.5, 0.42, 16, 0.85, 0.60],
  stone:  [5.0, 0.34, 30, 0.70, 0.68],
  carbon: [3.6, 0.22, 14, 0.55, 0.42],
  ice:    [4.2, 0.30, 20, 0.50, 0.86],
};

export function makeRockTexture(surface, size = 128, seed = 1) {
  const [freq, contrast, nCrater, cDepth, level] = SURFACE_MIX[surface] ?? SURFACE_MIX.stone;
  const w = size * 2, h = size;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);
  const craters = craterField(seed, nCrater);
  for (let j = 0; j < h; j++) {
    const v = j / h;
    const lat = Math.sin(v * Math.PI);
    for (let i = 0; i < w; i++) {
      const u = i / w;
      const a = u * Math.PI * 2;
      const nx = Math.cos(a) * freq, ny = Math.sin(a) * freq;
      let t = level + (fbm(nx + 40, ny + v * freq * 2, seed, 4) - 0.5) * contrast * 2;
      t += (hash(i, j, seed + 3) - 0.5) * 0.07;
      for (const c of craters) {
        let du = Math.abs(u - c.x); if (du > 0.5) du = 1 - du;
        const dv = (v - c.y) * 1.4;
        const d = Math.hypot(du * lat * 1.6, dv) / Math.max(1e-4, c.r);
        if (d < 1.32) {
          if (d < 0.86) t -= (1 - d / 0.86) * c.d * cDepth * 0.5;
          else t += (1 - Math.abs(d - 1.05) / 0.27) * 0.16 * c.d;
        }
      }
      t = Math.max(0.04, Math.min(1, t));
      const o = (j * w + i) * 4;
      const g = Math.round(t * 255);
      img.data[o] = g;
      img.data[o + 1] = g;
      img.data[o + 2] = g;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function makeRockRough(surface, size = 64, seed = 1) {
  const [freq, , , , ] = SURFACE_MIX[surface] ?? SURFACE_MIX.stone;
  const w = size * 2, h = size;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);
  const invert = surface === "ice";
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const a = (i / w) * Math.PI * 2;
      const n = fbm(Math.cos(a) * freq * 0.7 + 11, Math.sin(a) * freq * 0.7 + (j / h) * freq, seed + 61, 3);
      let r = surface === "metal" ? 0.42 + n * 0.5 : surface === "ice" ? 0.2 + n * 0.35 : 0.72 + n * 0.28;
      if (invert) r = 1 - r * 0.6;
      const g = Math.round(Math.max(0, Math.min(1, r)) * 255);
      const o = (j * w + i) * 4;
      img.data[o] = g; img.data[o + 1] = g; img.data[o + 2] = g; img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function makeCraterDetail(size = 384, seed = 7, count = 46) {
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(size, size);
  const P = 8;
  const lat = (i, j, sd) => hash(((i % P) + P) % P, ((j % P) + P) % P, sd);
  const vnoise = (x, y, sd) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lat(xi, yi, sd) * (1 - u) * (1 - v) + lat(xi + 1, yi, sd) * u * (1 - v) + lat(xi, yi + 1, sd) * (1 - u) * v + lat(xi + 1, yi + 1, sd) * u * v;
  };
  const craters = [];
  for (let i = 0; i < count; i++) {
    const r = 0.018 + Math.pow(hash(i, 3, seed), 2.6) * 0.16;
    craters.push({ x: hash(i, 5, seed), y: hash(i, 9, seed), r, d: 0.5 + hash(i, 13, seed) * 0.5 });
  }
  const h = new Float32Array(size * size);
  for (let j = 0; j < size; j++) {
    const y = j / size;
    for (let i = 0; i < size; i++) {
      const x = i / size;
      let v = 0.5 + (vnoise(x * P, y * P, seed + 1) - 0.5) * 0.22 + (vnoise(x * P * 2, y * P * 2, seed + 2) - 0.5) * 0.1;
      for (const c of craters) {
        let dx = Math.abs(x - c.x); if (dx > 0.5) dx = 1 - dx;
        let dy = Math.abs(y - c.y); if (dy > 0.5) dy = 1 - dy;
        const d = Math.hypot(dx, dy) / c.r;
        if (d >= 1.5) continue;
        if (d < 1) v -= (1 - d * d) * 0.34 * c.d;
        v += Math.exp(-Math.pow((d - 1) * 4.5, 2)) * 0.17 * c.d;
      }
      h[j * size + i] = v;
    }
  }
  for (let k = 0; k < h.length; k++) {
    const g = Math.round(Math.max(0, Math.min(1, h[k] + (hash(k, 77, seed) - 0.5) * 0.05)) * 255);
    img.data[k * 4] = g; img.data[k * 4 + 1] = g; img.data[k * 4 + 2] = g; img.data[k * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function makeCanvas(w, h) {
  if (typeof document !== "undefined" && document.createElement) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c;
  }
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  throw new Error("rockgen: no canvas available");
}

export function deformGeometry(geo, seed, strength = 0.34) {
  const pos = geo.attributes.position;
  const n = pos.count;
  const ax = [];
  for (let i = 0; i < 3; i++) {
    const t = hash(i, 3, seed) * Math.PI * 2, p = hash(i, 9, seed + 2) * Math.PI - Math.PI / 2;
    ax.push([Math.cos(p) * Math.cos(t), Math.sin(p), Math.cos(p) * Math.sin(t), 0.55 + hash(i, 17, seed) * 0.9]);
  }
  const cleaves = [];
  for (let i = 0; i < 2; i++) {
    const t = hash(i, 31, seed + 7) * Math.PI * 2, p = hash(i, 37, seed + 11) * Math.PI - Math.PI / 2;
    cleaves.push([Math.cos(p) * Math.cos(t), Math.sin(p), Math.cos(p) * Math.sin(t), 0.62 + hash(i, 41, seed) * 0.3]);
  }
  for (let i = 0; i < n; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const len = Math.hypot(x, y, z) || 1;
    const ux = x / len, uy = y / len, uz = z / len;
    let r = 1;
    for (const [dx, dy, dz, w] of ax) {
      const d = ux * dx + uy * dy + uz * dz;
      r += (d * d * d) * strength * w * 0.5;
    }
    r += (hash(Math.round(ux * 57), Math.round(uy * 57 + uz * 31), seed) - 0.5) * strength * 0.5;
    for (const [dx, dy, dz, at] of cleaves) {
      const d = ux * dx + uy * dy + uz * dz;
      if (d > at) r = Math.min(r, at / d);
    }
    r = Math.max(0.45, r);
    pos.setXYZ(i, ux * r, uy * r, uz * r);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

export function rockShapes(THREE, variants = 3) {
  const out = [];
  for (let i = 0; i < variants; i++) {
    out.push({
      near: deformGeometry(new THREE.IcosahedronGeometry(1, 2), 1000 + i * 37, 0.36),
      far: deformGeometry(new THREE.IcosahedronGeometry(1, 1), 1000 + i * 37, 0.36),
    });
  }
  return out;
}

export function shapeOf(rock, variants = 3) {
  const s = rock?.seed ?? 0;
  return Math.min(variants - 1, Math.floor(s * variants * 0.999999));
}
