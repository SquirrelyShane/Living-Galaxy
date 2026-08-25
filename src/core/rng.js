// Living Galaxy — seeded PRNG (mulberry32). The world generator draws from `world`,
// so every client seeded the same builds the identical Solaris. That is what makes a
// shared multiplayer galaxy possible without ever syncing planets or rocks over the wire.
//
// 0.2 adds named streams. Drawing every new feature out of the one `world` generator
// means adding a feature *reorders everything generated after it* — same seed, different
// galaxy, and a save from last week no longer matches the system it was written in.
// `stream('npc')` gives a generator seeded from (worldSeed, name), independent of draw
// order, so a new consumer can never perturb an existing one.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** FNV-1a. Stable across runs and platforms — do not swap for anything hash-random. */
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

let seedValue = 1337;
let world = mulberry32(seedValue);
const streams = new Map();

export function seedWorld(seed) {
  seedValue = seed >>> 0;
  world = mulberry32(seedValue);
  streams.clear();          // streams are re-derived lazily from the new seed
}

export const wnext = () => world();
export const wrand = (a, b) => a + world() * (b - a);

/** The seed the world was generated from. */
export const worldSeed = () => seedValue;

/** Independent generator for anything else that needs reproducibility. */
export function makeRng(seed) {
  const r = mulberry32(seed >>> 0);
  return {
    next: r,
    range: (a, b) => a + r() * (b - a),
    int: (a, b) => Math.floor(a + r() * (b - a + 1)),
    pick: arr => arr[Math.floor(r() * arr.length)],
    chance: p => r() < p
  };
}

/**
 * Named deterministic stream off the world seed. Same seed + same name = same sequence,
 * whatever else the build generates. Cached, so repeated calls continue one sequence
 * rather than restarting it.
 */
export function stream(name) {
  let s = streams.get(name);
  if (!s) {
    s = makeRng((hashString(name) ^ Math.imul(seedValue, 0x9E3779B1)) >>> 0);
    streams.set(name, s);
  }
  return s;
}

/** Rewind one stream to its start — for reproducing a specific generation pass. */
export function resetStream(name) {
  streams.delete(name);
  return stream(name);
}

<<<<<<< HEAD
const streamNames = () => [...streams.keys()];
=======
export const streamNames = () => [...streams.keys()];
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
