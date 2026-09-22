/* LIVING GALAXY — stations.
 *
 * Three ways a station exists out here:
 *   free    — its own solar orbit, beholden to nobody
 *   tethered— parked in a planet or moon's well and carried around by it
 *   pirate  — bolted to a belt asteroid, defended, and claimable once it is not
 *
 * Each carries a sector, which decides what it sells, what it pays over the
 * odds for, and what services it will let you use.
 */

import { bodyById, bodyPosition, bodyVelocity } from "./bodies.js";
import { SECTORS, SECTOR_IDS, stockFor } from "./materials.js";
import { ensureBuilt, releaseBuilt, headingFor, orientStation } from "./stationyard.js";
import { stationName, openSkyNames, reserveNames } from "./naming.js";

export const stations = [];

const PREFIX = {
  logistic: ["Depot", "Transfer", "Bond", "Waypoint", "Consignment"],
  military: ["Bastion", "Picket", "Redoubt", "Muster", "Garrison"],
  industrial: ["Forge", "Smelt", "Yard", "Kiln", "Foundry"],
  civilian: ["Haven", "Commons", "Terrace", "Quarter", "Landing"],
  agricultural: ["Grange", "Vat", "Furrow", "Harvest", "Green"],
  pirate: ["Hookfall", "Blackreach", "Sump", "The Nail", "Cutter's Rest"],
};
const SUFFIX = ["Station", "Platform", "Anchorage", "Ring", "Post", "Works", "Hold"];

const _bp = { x: 0, y: 0, z: 0 };
const _bv = { x: 0, y: 0, z: 0 };

let seq = 1;

export function resetStations() {
  for (const st of stations) releaseBuilt(st);
  stations.length = 0;
  seq = 1;
}

/* 0.3.32: ports used to be 5 sector prefixes x 7 suffixes = 35 names per
 * sector, 175 in the whole game, and across twelve systems 42% of ports
 * carried a name another port also had. js/naming.js keeps the sector word —
 * that is what tells you what kind of place you are docking at — and widens
 * everything around it to 10,350, with uniqueness inside a sky guaranteed
 * rather than hoped for. PREFIX and SUFFIX below are kept as the shapes the
 * seam is built from; it owns the composition now. */
function name(sector, rnd) {
  /* The two draws are load-bearing. The old namer took exactly two from the
   * caller's generator — one prefix, one suffix — and the roster's seeded
   * sequence runs on after it: hosts, orbits, mounts, works, and how many
   * ports the system gets at all. Dropping them shifted every later draw and
   * Sol quietly went from eight ports to eleven, which failed five suites
   * that were not about names. The words come from js/naming.js now and cost
   * the caller nothing, so the two draws are made and discarded on purpose:
   * the same sky keeps the same ports in the same places, better named. */
  rnd(); rnd();
  return stationName(sector);
}

/**
 * Builds the station roster for a system. Deterministic from the seed, so a
 * sky you come back to has the same ports in the same places.
 */
export function buildStations(system, rnd, skySeed = system?.name ?? "sky") {
  resetStations();
  /* one namer per sky, seeded off it: the same system always grows the same
   * ports, and no two of them can share a name */
  openSkyNames(skySeed);
  const planets = system.bodies.filter((b) => !b.parent && b.kind !== "star");
  const moons = system.bodies.filter((b) => b.parent);

  /* tethered ports: parked in somebody's well */
  const hosts = [...planets, ...moons].filter(() => rnd() < 0.42).slice(0, 6);
  for (const host of hosts) {
    const sector = SECTOR_IDS[Math.floor(rnd() * SECTOR_IDS.length)];
    stations.push(make(sector, "tethered", rnd, { hostId: host.id, alt: host.radius * (2.2 + rnd() * 3.4) }));
  }

  /* free ports: their own orbit around the star */
  const freeCount = 1 + Math.floor(rnd() * 3);
  const maxOrbit = Math.max(...planets.map((b) => b.orbit), 100000);
  for (let i = 0; i < freeCount; i++) {
    const sector = SECTOR_IDS[Math.floor(rnd() * SECTOR_IDS.length)];
    stations.push(
      make(sector, "free", rnd, {
        orbit: maxOrbit * (0.15 + rnd() * 0.8),
        phase: rnd() * Math.PI * 2,
        incl: (rnd() - 0.5) * 0.1,
        period: 60000 + rnd() * 400000,
      }),
    );
  }

  /* free ports of the other kind */
  const belt = system.belt ?? system.outerBelt;
  if (belt) {
    const n = 1 + Math.floor(rnd() * 2);
    for (let i = 0; i < n; i++) {
      stations.push(
        make("pirate", "pirate", rnd, {
          orbit: belt.inner + rnd() * (belt.outer - belt.inner),
          phase: rnd() * Math.PI * 2,
          incl: (rnd() - 0.5) * 0.06,
          period: 300000 + rnd() * 400000,
          guards: 2 + Math.floor(rnd() * 3),
        }),
      );
    }
  }
  /* the GNN station: one newsroom per sky, on its own draw so the other ports keep their seeds */
  const family = (id) => { const b = system.bodies.find((x) => x.id === id); return b?.parent ?? id; };
  const taken = new Set(stations.filter((s) => s.hostId).map((s) => family(s.hostId)));
  stations.push(gnnStationFor(system, planets.filter((b) => !taken.has(b.id)), moons.filter((b) => !taken.has(b.parent)), skySeed, planets));
  /* grow every port now: the lanes, the mounts and the works all read off the build */
  for (const st of stations) ensureBuilt(st, skySeed);
  return stations;
}

/* One newsroom, many relays — but eight words meant two systems apart could
 * both host "GNN Herald Station", which is a navigation problem rather than a
 * branding one. Widened in 0.3.32 alongside the port names. */
const GNN_WORDS = ["Meridian", "Candor", "Herald", "Lantern", "Parallax", "Wirehouse", "Signal", "Dispatch",
  "Bellwether", "Plumbline", "Clarion", "Longwave", "Ledger", "Watchtower", "Bulletin", "Tidings",
  "Crosstalk", "Vantage", "Waypoint", "Sounding", "Almanac", "Chronicle", "Compass", "Beacon"];
/* the newsroom takes a world nobody else is parked at (or a moon of one), so its approaches
 * never overlap another port's lanes; if every world is taken it flies its own orbit */
function gnnStationFor(system, planets, moons, skySeed, allPlanets = planets) {
  let h = 0x811c9dc5;
  for (const c of `${skySeed}:gnn`) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193); }
  let a = h >>> 0;
  const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const word = GNN_WORDS[Math.floor(rnd() * GNN_WORDS.length)];
  const opts = { gnn: true, archetype: "relay", radius: 95 + rnd() * 40 };
  const hosts = [...planets, ...moons];
  if (hosts.length && rnd() < 0.5) {
    const host = hosts[Math.floor(rnd() * hosts.length)];
    Object.assign(opts, { hostId: host.id, alt: host.radius * (2.6 + rnd() * 3) });
    const st = make("civilian", "tethered", rnd, opts);
    st.name = `GNN ${word} Relay`;
    reserveNames([st.name]);
    return st;
  }
  const maxOrbit = Math.max(...allPlanets.map((b) => b.orbit), 100000);
  Object.assign(opts, { orbit: maxOrbit * (0.2 + rnd() * 0.7), phase: rnd() * Math.PI * 2, incl: (rnd() - 0.5) * 0.08, period: 90000 + rnd() * 300000 });
  const st = make("civilian", "free", rnd, opts);
  st.name = `GNN ${word} Station`;
  reserveNames([st.name]);
  return st;
}

function make(sector, mount, rnd, opts) {
  const radius = 60 + rnd() * 140;
  return {
    id: `st${seq++}`,
    name: sector === "pirate" ? name("pirate", rnd) : name(sector, rnd),
    sector,
    mount,
    radius,
    /* live position, filled by stepStations */
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    spin: 0.02 + rnd() * 0.05,
    seed: rnd(),
    docked: false,
    /* pirate holds */
    guards: opts.guards ?? 0,
    hostile: sector === "pirate",
    claimed: false,
    stock: stockFor(sector, rnd),
    credits: 20000 + Math.round(rnd() * 60000),
    ...opts,
  };
}

/** Where every station is this instant. Tethered ones ride their host. */
export function stepStations(time) {
  for (const st of stations) {
    if (st.mount === "tethered") {
      const host = bodyById(st.hostId);
      if (!host) continue;
      bodyPosition(host.id, time, _bp);
      bodyVelocity(host.id, time, _bv);
      const a = (time / Math.max(st.period ?? 40000, 1)) * Math.PI * 2 + (st.phase ?? 0);
      const r = st.alt;
      st.x = _bp.x + Math.cos(a) * r;
      st.y = _bp.y + Math.sin(a) * r * 0.12;
      st.z = _bp.z + Math.sin(a) * r;
      /* good enough: the host's motion dominates the tether's own circling */
      st.vx = _bv.x;
      st.vy = _bv.y;
      st.vz = _bv.z;
      /* the hull turns with its tether so the hangar mouth and the lanes face open sky */
      if (st.portLocal) orientStation(st, headingFor(st, a));
    } else {
      const a = (time / Math.max(st.period, 1)) * Math.PI * 2 + st.phase;
      const r = st.orbit;
      st.x = Math.cos(a) * r;
      st.z = Math.sin(a) * r;
      st.y = Math.sin(a) * r * st.incl;
      const w = (Math.PI * 2) / st.period;
      st.vx = -Math.sin(a) * r * w;
      st.vz = Math.cos(a) * r * w;
      st.vy = Math.cos(a) * r * st.incl * w;
    }
  }
}

export function nearestStation(pos, range = Infinity) {
  let best = null;
  let bestD = range;
  for (const st of stations) {
    const d = Math.hypot(st.x - pos.x, st.y - pos.y, st.z - pos.z);
    if (d < bestD) {
      bestD = d;
      best = st;
    }
  }
  return best ? { station: best, dist: bestD } : null;
}

export function stationById(id) {
  return stations.find((s) => s.id === id);
}

/** Docking wants you near a hangar mouth, slow enough for the tractor to take you, and not being shot at. */
export const TRACTOR_R = 250;       // how far off a mouth port control will reach out for you (2.5 km: inside the lane funnel)
export const TRACTOR_V = 60;        // and how fast you may be moving when it does
export function dockCheck(st, shipPos, relSpeed) {
  const d = Math.hypot(st.x - shipPos.x, st.y - shipPos.y, st.z - shipPos.z);
  const m = st.port;
  const range = m ? TRACTOR_R : st.radius * 4 + 220;
  const dm = m ? Math.hypot(st.x + m.x - shipPos.x, st.y + m.y - shipPos.y, st.z + m.z - shipPos.z) : d;
  if (dm > range) return { ok: false, why: m ? `Close to ${Math.round(range)} u of the hangar mouth` : `Close to ${Math.round(range)} u`, dist: d, mouth: dm, range };
  const vmax = m ? TRACTOR_V : 12;
  if (relSpeed > vmax) return { ok: false, why: `Slow to ${vmax} u/s (${relSpeed.toFixed(0)})`, dist: d, mouth: dm, range };
  if (st.hostile && !st.claimed) return { ok: false, why: `${st.guards} guns still active`, dist: d, mouth: dm, range };
  return { ok: true, why: m ? "Tractor lock available" : "Cleared to dock", dist: d, mouth: dm, range };
}

export function sectorOf(st) {
  return SECTORS[st.sector];
}

export function describeStation(st) {
  const s = SECTORS[st.sector];
  const mount =
    st.mount === "tethered"
      ? `tethered · ${bodyById(st.hostId)?.name ?? "?"}`
      : st.mount === "pirate"
        ? st.claimed ? "claimed free port" : "hostile free port"
        : "free orbit";
  return { sector: s.name, blurb: s.blurb, mount, services: s.services, colour: s.colour };
}
