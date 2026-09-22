/* Seeded PRNG — every station is reproducible from its seed string. */
export class RNG {
  constructor(seed) {
    let n = 0;
    if (typeof seed === "number") n = seed >>> 0;
    else {
      const s = String(seed ?? "1701");
      for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 2654435761) >>> 0;
    }
    this.s = n || 1701;
  }
  next() {
    this.s |= 0;
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + this.next() * (b - a); }
  int(a, b) { return Math.floor(this.range(a, b + 1 - 1e-9)); }
  pick(arr) { return arr[this.int(0, arr.length - 1)]; }
  chance(p) { return this.next() < p; }
  sign() { return this.next() < 0.5 ? -1 : 1; }
}

/* Extras the station builder leans on. */
RNG.prototype.gauss = function (mean = 0, sd = 1) {
  const u = 1 - this.next(), v = this.next();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
RNG.prototype.shuffle = function (arr) {
  for (let i = arr.length - 1; i > 0; i--) { const j = this.int(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
};
RNG.prototype.weighted = function (pairs) {
  const total = pairs.reduce((s, p) => s + p[1], 0);
  let r = this.next() * total;
  for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; }
  return pairs[pairs.length - 1][0];
};
