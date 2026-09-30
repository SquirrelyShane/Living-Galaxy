import { classFor, classOre, CLASSES, CLASS_IDS } from "../bodygen/classes.js";
import { ORES, goodName } from "./materials.js";

export const sites = new Map();
export const siteHooks = { onChange: null };
let version = 0;

export const siteVersion = () => version;

const ORE_BY_ID = new Map(ORES.map((o) => [o.id, o]));

const DRIFT_WORDS = [
  "Kestrel", "Marrow", "Hollow", "Ninepin", "Tallow", "Grist", "Sable", "Fennel", "Harrow", "Coldwater",
  "Bramble", "Larkspur", "Ossuary", "Pellet", "Quarry", "Rimefall", "Sundog", "Threadbare", "Vellum", "Winnow",
];

function hash32(s) {
  let h = 0x811c9dc5;
  s = String(s);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
const frac = (s) => hash32(s) / 4294967296;
const bearing = (from, to) => Math.round(((Math.atan2(to.x - from.x, -(to.z - from.z)) * 180) / Math.PI + 360) % 360);

export function classForOre(ore) {
  let best = "S", bestW = -1;
  for (const id of CLASS_IDS) {
    const w = CLASSES[id].ores?.[ore] ?? 0;
    if (w > bestW) { bestW = w; best = id; }
  }
  return bestW > 0 ? best : "S";
}

export function pickSpot(seed, system, st = null, opts = {}) {
  const belts = [system?.belt, system?.outerBelt].filter(Boolean);
  if (!belts.length) return null;
  const outer = opts.outer && belts.length > 1;
  const belt = outer ? belts[1] : belts[0];
  const f = (k) => frac(`${seed}:${k}`);
  const base = st ? Math.atan2(st.z, st.x) : f("a") * Math.PI * 2;
  const spread = opts.spread ?? 0.9;
  const a = base + (f("a") - 0.5) * 2 * spread;
  const rad = belt.inner + (belt.outer - belt.inner) * (0.15 + f("r") * 0.7);
  const x = Math.cos(a) * rad, z = Math.sin(a) * rad, y = (f("y") - 0.5) * 2200;
  const word = DRIFT_WORDS[Math.floor(f("w") * DRIFT_WORDS.length) % DRIFT_WORDS.length];
  const kind = f("k") < 0.34 ? "Drift" : f("k") < 0.67 ? "Reach" : "Shoal";
  const p = { x, y, z };
  return {
    x, y, z, r: opts.r ?? 2600,
    name: `the ${word} ${kind}`,
    bearing: st ? bearing(st, p) : null,
    dist: st ? Math.hypot(st.x - x, st.y - y, st.z - z) : null,
    belt: outer ? "outer" : "main",
  };
}

export function spotLine(spot, st = null) {
  if (!spot) return "";
  const d = spot.dist ?? (st ? Math.hypot(st.x - spot.x, st.y - spot.y, st.z - spot.z) : null);
  const b = spot.bearing ?? (st ? bearing(st, spot) : null);
  return `${spot.name}${d != null && st ? ` — ${Math.round(d / 100).toLocaleString("en-US")} km out from ${st.name}` : ""}${b != null ? `, bearing ${b}` : ""}`;
}

export function openSite(spec) {
  if (!spec?.id || !spec.ore) return null;
  const site = {
    id: String(spec.id),
    ore: spec.ore,
    oreName: goodName(spec.ore),
    count: Math.max(1, Math.round(spec.count ?? 8)),
    x: spec.x, y: spec.y, z: spec.z,
    r: spec.r ?? 2600,
    name: spec.name ?? "the claim",
    rich: spec.rich !== false,
    size: spec.size ?? 1,
    seed: spec.seed ?? spec.id,
    title: spec.title ?? null,
    opened: spec.at ?? 0,
  };
  sites.set(site.id, site);
  version++;
  siteHooks.onChange?.();
  return site;
}

export function closeSite(id) {
  if (!sites.delete(String(id))) return false;
  version++;
  siteHooks.onChange?.();
  return true;
}

export function clearSites() {
  if (!sites.size) return;
  sites.clear();
  version++;
  siteHooks.onChange?.();
}

export function siteById(id) { return sites.get(String(id)) ?? null; }

export function sitesNear(pos, r = 1e9) {
  const out = [];
  for (const s of sites.values()) {
    const d = Math.hypot(s.x - pos.x, s.y - pos.y, s.z - pos.z);
    if (d <= r) out.push({ site: s, d });
  }
  return out.sort((a, b) => a.d - b.d);
}

export function inSite(pos, margin = 600) {
  for (const s of sites.values()) if (Math.hypot(s.x - pos.x, s.y - pos.y, s.z - pos.z) <= s.r + margin) return s;
  return null;
}

const laid = new Map();

function layOut(site) {
  const got = laid.get(site.id);
  if (got && got.v === version && got.count === site.count) return got.rocks;
  const rocks = [];
  const cls = classForOre(site.ore);
  for (let i = 0; i < site.count; i++) {
    const f = (k) => frac(`${site.seed}:${i}:${k}`);
    const u = Math.pow(f("u"), 0.62);
    const th = f("t") * Math.PI * 2;
    const ph = Math.acos(2 * f("p") - 1);
    const rr = site.r * u;
    const x = site.x + rr * Math.sin(ph) * Math.cos(th);
    const y = site.y + rr * Math.cos(ph) * 0.35;
    const z = site.z + rr * Math.sin(ph) * Math.sin(th);
    rocks.push({
      key: `site:${site.id}:${i}`,
      x, y, z,
      r: (70 + 520 * Math.pow(f("s"), 1.8)) * site.size,
      spin: 0.05 + f("n") * 0.3,
      seed: f("h"),
      cls,
      ice: ORE_BY_ID.get(site.ore)?.found?.includes("ice") && /ice/.test(site.ore) ? true : false,
      rich: site.rich,
      ore: site.ore,
      oreName: site.oreName,
    });
  }
  laid.set(site.id, { v: version, count: site.count, rocks });
  return rocks;
}

export function siteRocksInCell(cx, cy, cz, cell, out, depleted) {
  if (!sites.size) return;
  const x0 = cx * cell, x1 = x0 + cell, y0 = cy * cell, y1 = y0 + cell, z0 = cz * cell, z1 = z0 + cell;
  for (const site of sites.values()) {
    if (site.x + site.r < x0 || site.x - site.r > x1) continue;
    if (site.y + site.r < y0 || site.y - site.r > y1) continue;
    if (site.z + site.r < z0 || site.z - site.r > z1) continue;
    for (const rk of layOut(site)) {
      if (rk.x < x0 || rk.x >= x1 || rk.y < y0 || rk.y >= y1 || rk.z < z0 || rk.z >= z1) continue;
      const worn = depleted?.get(rk.key) ?? 0;
      if (worn >= 1) continue;
      out.push({
        key: rk.key,
        bx: rk.x, bz: rk.z, px: rk.seed, pz: rk.seed,
        x: rk.x,
        y: rk.y,
        z: rk.z,
        r: rk.r, spin: rk.spin, seed: rk.seed, cls: rk.cls, ice: rk.ice, rich: rk.rich,
        ore: rk.ore, oreName: rk.oreName, worn, site: site.id,
      });
    }
  }
}

export function siteRocks(id) {
  const site = sites.get(String(id));
  return site ? layOut(site) : [];
}

export function siteRockBase(key) {
  if (typeof key !== "string" || !key.startsWith("site:")) return null;
  const cut = key.lastIndexOf(":");
  const id = key.slice(5, cut);
  return siteRocks(id).find((r) => r.key === key) ?? null;
}

export function siteReport(depleted) {
  return [...sites.values()].map((s) => {
    const rocks = layOut(s);
    const left = rocks.filter((r) => (depleted?.get(r.key) ?? 0) < 1).length;
    return { id: s.id, name: s.name, title: s.title, ore: s.ore, oreName: s.oreName, x: s.x, y: s.y, z: s.z, r: s.r, rocks: rocks.length, left };
  });
}

void classFor; void classOre;
