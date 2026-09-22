/* LIVING GALAXY — what a rock looks like.
 *
 * Every asteroid in the game used to be the same object: one icosahedron,
 * detail 1, flat-shaded, `0x8a8178`. A belt of four hundred of them is four
 * hundred copies of one grey pebble at different sizes, and since the ore a
 * rock carries is decided by the field's own hash long before it is drawn,
 * none of that information ever reached the canopy. You could be flying
 * through a platinum vein and a carbon drift and they looked identical.
 *
 * So: the rock you see is the rock you are about to cut.
 *
 *   LOOK[oreId]         the palette and surface class for an ore
 *   rockLook(rock)      → the look for a field rock, vein lift included
 *   makeRockTexture()   → one albedo canvas per surface class
 *   makeRockBump()      → the matching height field, shared as a normal map
 *   rockShapes(THREE)   → three deformed hulls, each at two levels of detail
 *
 * Everything here is built once per session and shared by every instance —
 * the per-rock differences are carried on the instance colour and matrix, so
 * a belt is still six draw calls, not four hundred.
 */

/* Surface classes. Four ways a rock can be put together, which is about as
 * many as you can tell apart at belt distances:
 *   metal   — differentiated core stuff: dark, slightly shiny, sharp facets
 *   stone   — the ordinary run of the belt: dusty, matte, cratered
 *   carbon  — C-type: very dark, almost no specular, soft-edged
 *   ice     — dirty snowball: bright, low roughness, a little translucent
 */
export const SURFACES = ["metal", "stone", "carbon", "ice"];

/* tint is multiplied onto the shared albedo, so these read as "how this ore
 * shifts a grey rock", not as absolute colours. */
export const LOOK = {
  /* --- metal --------------------------------------------------------- */
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
  /* --- stone --------------------------------------------------------- */
  silicate:     { surface: "stone",  tint: 0x9a9186, note: "pale stone" },
  regolith:     { surface: "stone",  tint: 0x8d857a, note: "grey dust" },
  bauxite:      { surface: "stone",  tint: 0xbb7f52, note: "red earth" },
  monazite:     { surface: "stone",  tint: 0xa8895f, note: "honey grains" },
  phosphate:    { surface: "stone",  tint: 0xa9a37f, note: "dull yellow" },
  sulfur:       { surface: "stone",  tint: 0xcbb44a, note: "sulfur yellow" },
  /* --- carbon -------------------------------------------------------- */
  carbonaceous: { surface: "carbon", tint: 0x4a474a, note: "soot" },
  tholins:      { surface: "carbon", tint: 0x8a5638, note: "organic red-brown" },
  /* --- ice ----------------------------------------------------------- */
  water_ice:    { surface: "ice",    tint: 0xcfe4f0, note: "blue-white" },
  methane_ice:  { surface: "ice",    tint: 0xc6d8c6, note: "green-tinged clathrate" },
  ammonia_ice:  { surface: "ice",    tint: 0xd8d2ee, note: "violet-white" },
  nitrogen_ice: { surface: "ice",    tint: 0xdfeef2, note: "near colourless" },
  hydrogen:     { surface: "ice",    tint: 0xe2eaf4, note: "frost" },
  deuterium:    { surface: "ice",    tint: 0xd2e6f4, note: "frost" },
};

const FALLBACK = { surface: "stone", tint: 0x8f877c, note: "" };

/* The grown bodies (js/bodygen/ over the vendored js/asteroidgen/) paint ore
 * seams as an ABSOLUTE albedo on a dark class matrix, not as a shift on grey,
 * and they sort ores into mineral families (which ones stand proud of the rock,
 * which ones frost over, which clouds turn amber). Both columns are the
 * generator's own v1.01 mapping onto these ids — kept here, beside the tint,
 * so there is still exactly one table that says what an ore looks like. */
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

/* How a surface class behaves under light, before the ore's own override. The
 * generated bodies in js/bodygen/ need per-ore PBR numbers and a crystal habit
 * for their outcrops; rather than start a second mineral table for them, they
 * read this one. */
const SURFACE_PBR = {
  metal:  { metal: 0.82, rough: 0.3,  glow: 0,    crystal: "nugget" },
  stone:  { metal: 0.12, rough: 0.78, glow: 0,    crystal: "block" },
  carbon: { metal: 0.05, rough: 0.86, glow: 0,    crystal: "block" },
  ice:    { metal: 0.24, rough: 0.22, glow: 0.06, crystal: "prism" },
};

/* The handful of ores whose behaviour is not their class's. */
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

/**
 * Everything the renderer needs to know about one ore, in one call: its tint,
 * its surface family, how it takes light, whether it glows, and what shape it
 * grows in when it breaks the surface as an outcrop.
 */
export function oreLook(id) {
  const base = LOOK[id] ?? FALLBACK;
  const pbr = SURFACE_PBR[base.surface] ?? SURFACE_PBR.stone;
  const [albedo, category] = ALBEDO[id] ?? [base.tint, "ore"];
  return { id, ...pbr, ...(PBR_OVERRIDE[id] ?? {}), surface: base.surface, tint: base.tint, note: base.note, albedo, category };
}

/**
 * Which surface texture a GROWN body wears, off its taxonomic class: the
 * differentiated classes are metal, the stony ones stone, the primitive dark
 * ones carbon, and a primitive body carrying real ice reads as a dirty
 * snowball. Same four textures the instanced field uses, so a rock keeps its
 * surface when it swaps from an instance to a grown body.
 */
export function bodySurface(cls, iceAffinity = 0) {
  if (cls === "M" || cls === "X") return "metal";
  if (cls === "S" || cls === "V" || cls === "E") return "stone";
  return iceAffinity >= 0.9 ? "ice" : "carbon";
}

/** 0xRRGGBB → { r, g, b } in 0..1. */
export function hexToRgb(hex) {
  return { r: ((hex >> 16) & 255) / 255, g: ((hex >> 8) & 255) / 255, b: (hex & 255) / 255 };
}

/**
 * The look for one field rock.
 *
 * A rich rock is not a different rock, it is the same rock with the ore
 * showing: the tint is pushed toward the ore's own colour and lifted, so a
 * vein reads as a brighter, more saturated version of its neighbours rather
 * than a magic glowing object. Depletion goes the other way — a rock you have
 * cut most of the way through is bare and grey.
 */
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
    /* toward the bare grey of the host rock */
    const t = worn * 0.65, grey = 132;
    r += (grey - r) * t; g += (grey - g) * t; b += (grey - b) * t;
  }
  return { surface, r: r / 255, g: g / 255, b: b / 255, rich: Boolean(rock?.rich) };
}

/* ---- procedural surfaces -------------------------------------------------
 * Same integer hash as textures.js, kept local so this module has no imports
 * and can be measured on its own.
 */
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

/* Craters are what makes a rock read as a rock rather than a lump of noise.
 * A ring of rim brightening around a darkened floor is the whole trick, and
 * two dozen of them at mixed sizes is enough at any range you can see one. */
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
  /* [grain frequency, grain contrast, crater count, crater depth, base level] */
  metal:  [7.5, 0.42, 16, 0.85, 0.60],
  stone:  [5.0, 0.34, 30, 0.70, 0.68],
  carbon: [3.6, 0.22, 14, 0.55, 0.42],
  ice:    [4.2, 0.30, 20, 0.50, 0.86],
};

/**
 * An albedo canvas for one surface class. Wraps in u (longitude), so the seam
 * on a sphere-mapped hull does not show.
 */
export function makeRockTexture(surface, size = 128, seed = 1) {
  const [freq, contrast, nCrater, cDepth, level] = SURFACE_MIX[surface] ?? SURFACE_MIX.stone;
  const w = size * 2, h = size;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);
  const craters = craterField(seed, nCrater);
  for (let j = 0; j < h; j++) {
    const v = j / h;
    /* latitude squash so craters near the poles are not smeared into stripes */
    const lat = Math.sin(v * Math.PI);
    for (let i = 0; i < w; i++) {
      const u = i / w;
      /* sample on a cylinder so u wraps seamlessly */
      const a = u * Math.PI * 2;
      const nx = Math.cos(a) * freq, ny = Math.sin(a) * freq;
      let t = level + (fbm(nx + 40, ny + v * freq * 2, seed, 4) - 0.5) * contrast * 2;
      /* fine grit on top, mostly visible close in */
      t += (hash(i, j, seed + 3) - 0.5) * 0.07;
      for (const c of craters) {
        let du = Math.abs(u - c.x); if (du > 0.5) du = 1 - du;
        const dv = (v - c.y) * 1.4;
        const d = Math.hypot(du * lat * 1.6, dv) / Math.max(1e-4, c.r);
        if (d < 1.32) {
          if (d < 0.86) t -= (1 - d / 0.86) * c.d * cDepth * 0.5;        // floor in shadow
          else t += (1 - Math.abs(d - 1.05) / 0.27) * 0.16 * c.d;        // bright rim
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

/**
 * The roughness map for a surface class, derived from the same noise so the
 * shine sits where the geometry says it should: crater floors hold dust and
 * go rough, exposed faces are the shiny part on a metal rock and the dull
 * part on ice.
 */
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

/**
 * A crater height field that tiles on BOTH axes, for grown bodies.
 *
 * The belt textures above wrap in longitude only (they are sphere-mapped onto
 * instanced hulls). A grown body samples its detail triplanar in object space,
 * which tiles in every direction, so this one is built on a torus: lattice
 * noise with a wrapped period, and craters measured by wrapped distance. Grey =
 * height (0.5 is datum): dark floors, bright rims, a little grit. One canvas per
 * session; ~40 ms at 384².
 */
export function makeCraterDetail(size = 384, seed = 7, count = 46) {
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(size, size);
  const P = 8;                                     // noise lattice period
  const lat = (i, j, sd) => hash(((i % P) + P) % P, ((j % P) + P) % P, sd);
  const vnoise = (x, y, sd) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lat(xi, yi, sd) * (1 - u) * (1 - v) + lat(xi + 1, yi, sd) * u * (1 - v) + lat(xi, yi + 1, sd) * (1 - u) * v + lat(xi + 1, yi + 1, sd) * u * v;
  };
  const craters = [];
  for (let i = 0; i < count; i++) {
    /* power-law sizes: a few big bowls, many pits */
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
        if (d < 1) v -= (1 - d * d) * 0.34 * c.d;                                   // bowl
        v += Math.exp(-Math.pow((d - 1) * 4.5, 2)) * 0.17 * c.d;                        // rim
      }
      h[j * size + i] = v;
    }
  }
  for (let k = 0; k < h.length; k++) {
    /* grit last, per texel, so it does not tile with the lattice */
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
  /* headless: OffscreenCanvas if the runtime has one, else a stub so tests can
   * still call the palette side of this module */
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  throw new Error("rockgen: no canvas available");
}

/* ---- shapes ---------------------------------------------------------------
 * One sphere is one rock. Three deformed hulls at two detail levels each is
 * the smallest set where a field stops looking like a bag of identical
 * marbles: at belt speeds you read silhouette and spin, not surface.
 *
 * The deformation is low-frequency lobes plus a couple of flat cleaves, which
 * is roughly what a rubble pile or a fragment actually looks like. Vertices
 * are welded by position first so the lobes do not tear the mesh open.
 */
export function deformGeometry(geo, seed, strength = 0.34) {
  const pos = geo.attributes.position;
  const n = pos.count;
  /* three lobe axes and two cleave planes, all off the same seed */
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
    /* lumpy high-frequency skin, seeded on the direction so it is stable */
    r += (hash(Math.round(ux * 57), Math.round(uy * 57 + uz * 31), seed) - 0.5) * strength * 0.5;
    /* flat cleaves: anything past the plane gets pulled back onto it */
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

/**
 * `THREE` is passed in rather than imported so this module stays loadable in
 * the node suites, which have no WebGL and no need for geometry.
 */
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

/** Which shape variant a rock uses — off its own seed, so it never changes. */
export function shapeOf(rock, variants = 3) {
  const s = rock?.seed ?? 0;
  return Math.min(variants - 1, Math.floor(s * variants * 0.999999));
}
