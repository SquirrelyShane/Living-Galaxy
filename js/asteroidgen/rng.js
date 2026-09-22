/** Seeded PRNG, hashing, and 3D gradient / fractal noise. */

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class RNG {
  constructor(seed) {
    this.s = seed >>> 0 || 1;
  }

  next() {
    this.s += 0x6d2b79f5;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(a, b) {
    return a + this.next() * (b - a);
  }

  int(a, b) {
    return Math.floor(this.range(a, b + 1));
  }

  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }

  signed() {
    return this.next() * 2 - 1;
  }
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Gradient dot product for one lattice corner — allocation-free (hot path). */
function gdot(ix, iy, iz, seed, dx, dy, dz) {
  let n = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 1274126177) ^ seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n = (n ^ (n >>> 16)) >>> 0;
  const gx = (n & 1 ? 1 : -1) * (((n >> 1) & 3) / 3);
  const gy = (n & 4 ? 1 : -1) * (((n >> 3) & 3) / 3);
  const gz = (n & 16 ? 1 : -1) * (((n >> 5) & 3) / 3);
  return gx * dx + gy * dy + gz * dz;
}

export function valueNoise3(x, y, z, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const rx = x - ix;
  const ry = y - iy;
  const rz = z - iz;
  const fx = fade(rx);
  const fy = fade(ry);
  const fz = fade(rz);

  const n000 = gdot(ix, iy, iz, seed, rx, ry, rz);
  const n100 = gdot(ix + 1, iy, iz, seed, rx - 1, ry, rz);
  const n010 = gdot(ix, iy + 1, iz, seed, rx, ry - 1, rz);
  const n110 = gdot(ix + 1, iy + 1, iz, seed, rx - 1, ry - 1, rz);
  const n001 = gdot(ix, iy, iz + 1, seed, rx, ry, rz - 1);
  const n101 = gdot(ix + 1, iy, iz + 1, seed, rx - 1, ry, rz - 1);
  const n011 = gdot(ix, iy + 1, iz + 1, seed, rx, ry - 1, rz - 1);
  const n111 = gdot(ix + 1, iy + 1, iz + 1, seed, rx - 1, ry - 1, rz - 1);

  const nx00 = lerp(n000, n100, fx);
  const nx10 = lerp(n010, n110, fx);
  const nx01 = lerp(n001, n101, fx);
  const nx11 = lerp(n011, n111, fx);
  const nxy0 = lerp(nx00, nx10, fy);
  const nxy1 = lerp(nx01, nx11, fy);
  return lerp(nxy0, nxy1, fz);
}

export function fbm(x, y, z, seed, octaves = 5, lacunarity = 2, gain = 0.5) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise3(x * freq, y * freq, z * freq, seed + i * 1013);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

export function ridged(x, y, z, seed, octaves = 4) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(valueNoise3(x * freq, y * freq, z * freq, seed + i * 773));
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5;
    freq *= 2.05;
  }
  return sum / norm;
}

export function randomSeedString(rng = Math.random) {
  const words = [
    'Nyx', 'Vesta', 'Pallas', 'Hygiea', 'Davida', 'Interamnia', 'Europa',
    'Eunomia', 'Juno', 'Psyche', 'Eros', 'Itokawa', 'Bennu', 'Ryugu',
    'Ceres', 'Iris', 'Hebe', 'Fortuna', 'Thisbe', 'Egeria', 'Aurora',
    'Metis', 'Harmonia', 'Themis', 'Euphrosyne', 'Cybele', 'Hektor',
  ];
  const a = words[Math.floor(rng() * words.length)];
  const b = words[Math.floor(rng() * words.length)];
  const n = Math.floor(rng() * 9000 + 1000);
  return `${a}-${b}-${n}`;
}

/** Power-law sample for N(>D) ∝ D^-alpha between dMin and dMax. */
export function powerLaw(rng, dMin, dMax, alpha = 2.3) {
  const u = rng.next();
  const a = Math.pow(dMin, -alpha);
  const b = Math.pow(dMax, -alpha);
  return Math.pow(a - u * (a - b), -1 / alpha);
}

/** Box–Muller gaussian (one sample). */
export function gauss(rng) {
  const u = Math.max(1e-9, rng.next());
  const v = rng.next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Uniform unit vector as [x, y, z]. */
export function unitVec(rng) {
  const z = rng.next() * 2 - 1;
  const t = rng.next() * Math.PI * 2;
  const s = Math.sqrt(1 - z * z);
  return [s * Math.cos(t), s * Math.sin(t), z];
}
