/* LIVING GALAXY — remote scans and survey probes.
 *
 * The chart lets you point at any spot in the sky and ask what is there.
 * Two answers: a REMOTE SCAN is instant but only reaches a few sensor
 * ranges out; a PROBE is a small drone the ship throws at the point — it
 * flies there at a fixed speed, assays the cell on arrival, drops a saved
 * location with the findings and calls it in. Both write a scan report the
 * chart sheet and the log can read back.
 */

import { BODIES, bodyPosition, currentSystem, dist3 } from "./bodies.js";
import { bandAt, BAND_METAL, BAND_CARBON, CELL, inBelt, nearbyRocks } from "./field.js";
import { traffic } from "./npc/traffic.js";
import { flow } from "./npc/flow.js";
import { stations } from "./stations.js";
import { addWaypointAt, logEvent, sensorRange, sim } from "./sim.js";
import { NAV, WARN } from "./audio.js";
import { shipFx } from "./ship.js";

export const probes = [];
export const PROBE_SPEED = 9000;      // u/s straight-line
export const PROBE_CHARGE = 90;
export const SCAN_CHARGE = 60;
export const SCAN_REACH = 5;          // remote scan reaches this many sensor ranges
let seq = 1;
let reportSeq = 1;
const _p = { x: 0, y: 0, z: 0 };

export function resetProbes() {
  probes.length = 0;
  seq = 1;
  reportSeq = 1;
}

function fmtKm(u) {
  const km = u / 100;
  return km < 1000 ? `${Math.round(km)} km` : `${Math.round(km).toLocaleString()} km`;
}

/** Which belt (if any) a radius sits in, and which band of it. */
export function beltBandAt(x, z) {
  const rad = Math.hypot(x, z);
  for (const [belt, label] of [[currentSystem.belt, "belt"], [currentSystem.outerBelt, "outer belt"]]) {
    if (!belt) continue;
    if (rad < belt.inner - CELL || rad > belt.outer + CELL) continue;
    if (belt === currentSystem.outerBelt) return { belt, label, band: "icy outer belt — frost, clathrates" };
    const table = bandAt(belt, rad);
    const band = table === BAND_METAL ? "metal rim — heavy cores" : table === BAND_CARBON ? "carbon rim — tholins, frost pockets" : "stony commons";
    return { belt, label, band };
  }
  return null;
}

/** Everything the sensors can say about a point: rocks, hulls, the nearest world. */
export function assayPoint(x, y, z) {
  const at = { x, y, z };
  const lines = [];
  const band = beltBandAt(x, z);
  let title = "Open space";
  let topOre = null;
  if (band) {
    title = band.label === "belt" ? "Belt" : "Outer belt";
    lines.push(band.band);
    const rocks = inBelt(at) ? nearbyRocks(at, sim.time, 1) : [];
    if (rocks.length) {
      const tally = new Map();
      let rich = 0, ice = 0, biggest = 0;
      for (const r of rocks) {
        tally.set(r.oreName, (tally.get(r.oreName) ?? 0) + 1);
        if (r.rich) rich++;
        if (r.ice) ice++;
        if (r.r > biggest) biggest = r.r;
      }
      const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      topOre = top[0]?.[0] ?? null;
      lines.push(`${rocks.length} rocks in the cell · largest ${Math.round(biggest)} u`);
      lines.push(top.map(([n, c]) => `${n} ×${c}`).join(" · "));
      if (rich) lines.push(`${rich} RICH VEIN rock${rich > 1 ? "s" : ""} — call it in`);
      if (ice) lines.push(`${ice} ice rock${ice > 1 ? "s" : ""} — melt for water`);
    } else lines.push("No rock in this cell — thin patch.");
  } else {
    lines.push("No belt here. Nothing to cut.");
  }
  /* hulls with transponders near the point */
  const near = [];
  for (const n of traffic) if (n.visible !== false && dist3(at, n) < 20000) near.push(n.name);
  for (const n of flow) if (n.visible && dist3(at, n) < 20000) near.push(n.name);
  if (near.length) lines.push(`Hulls within 200 km: ${near.slice(0, 4).join(", ")}${near.length > 4 ? ` +${near.length - 4}` : ""}`);
  /* the closest world and port, for bearings */
  let best = null, bestD = Infinity;
  for (const b of BODIES) {
    bodyPosition(b.id, sim.time, _p);
    const d = dist3(at, _p);
    if (d < bestD) { bestD = d; best = b; }
  }
  if (best) lines.push(`${fmtKm(bestD)} from ${best.name}`);
  let port = null, portD = Infinity;
  for (const st of stations) { const d = dist3(at, st); if (d < portD) { portD = d; port = st; } }
  if (port) lines.push(`${fmtKm(portD)} from ${port.name}`);
  return { title, lines, topOre, rocks: band ? true : false, x, y, z };
}

export function fileReport(kind, name, a) {
  const rep = { id: `rep${reportSeq++}`, kind, name, x: a.x, y: a.y, z: a.z, at: sim.time, title: a.title, lines: a.lines, topOre: a.topOre };
  sim.scanReports.unshift(rep);
  if (sim.scanReports.length > 24) sim.scanReports.length = 24;
  return rep;
}

/**
 * Instant long-range look at a point. Costs charge; refuses beyond reach.
 * Returns the report, or null with the reason in sim.notice.
 */
export function remoteScan(x, y, z, name = "Remote scan") {
  const ship = sim.ship;
  const d = dist3(ship.pos, { x, y, z });
  const reach = sensorRange() * SCAN_REACH * shipFx.fx("probeRange", 1);
  if (d > reach) {
    sim.notice = `Out of scan reach — ${fmtKm(d)} out, sensors resolve ${fmtKm(reach)}. Send a probe.`;
    WARN.deny();
    return null;
  }
  if (ship.charge < SCAN_CHARGE) {
    sim.notice = "Not enough charge for a remote scan.";
    WARN.deny();
    return null;
  }
  ship.charge -= SCAN_CHARGE;
  const a = assayPoint(x, y, z);
  const rep = fileReport("scan", name, a);
  sim.notice = `${a.title}: ${a.lines.slice(0, 2).join(" · ")}`;
  logEvent(`Remote scan ${fmtKm(d)} out — ${a.title}: ${a.lines.join("; ")}`, "system");
  NAV.ping();
  return rep;
}

/** Throw a probe at a point. It reports on arrival and drops a saved location. */
export function launchProbe(x, y, z, name) {
  const ship = sim.ship;
  if (ship.charge < PROBE_CHARGE) {
    sim.notice = "Not enough charge to launch a probe.";
    WARN.deny();
    return null;
  }
  ship.charge -= PROBE_CHARGE;
  const d = dist3(ship.pos, { x, y, z });
  const pr = {
    id: `probe${seq++}`,
    name: name || `Probe ${seq - 1}`,
    x: ship.pos.x, y: ship.pos.y, z: ship.pos.z,
    sx: ship.pos.x, sy: ship.pos.y, sz: ship.pos.z,
    tx: x, ty: y, tz: z,
    t0: sim.time,
    eta: Math.max(2, d / PROBE_SPEED),
    done: false,
  };
  probes.push(pr);
  sim.notice = `${pr.name} away — ${fmtKm(d)}, ${Math.round(pr.eta)} s to the drop.`;
  logEvent(`${pr.name} launched toward a point ${fmtKm(d)} out`, "probe");
  NAV.ping();
  return pr;
}

export function stepProbes(_dt) {
  for (const pr of probes) {
    if (pr.done) continue;
    const u = Math.min(1, (sim.time - pr.t0) / pr.eta);
    pr.x = pr.sx + (pr.tx - pr.sx) * u;
    pr.y = pr.sy + (pr.ty - pr.sy) * u;
    pr.z = pr.sz + (pr.tz - pr.sz) * u;
    if (u >= 1) {
      pr.done = true;
      pr.doneAt = sim.time;
      const a = assayPoint(pr.tx, pr.ty, pr.tz);
      const rep = fileReport("probe", pr.name, a);
      const wp = addWaypointAt(`${pr.name}${a.topOre ? ` · ${a.topOre}` : ""}`, pr.tx, pr.ty, pr.tz);
      wp.probe = pr.id;
      rep.waypoint = wp.id;
      sim.notice = `${pr.name} down — ${a.title}: ${a.lines.slice(0, 2).join(" · ")}. Location saved.`;
      sim.toast = `${pr.name} reporting`;
      sim.lastToastAt = sim.time;
      logEvent(`${pr.name} report — ${a.title}: ${a.lines.join("; ")}`, "probe");
      NAV.ping();
    }
  }
  /* spent probes fall off the board after a while */
  for (let i = probes.length - 1; i >= 0; i--) if (probes[i].done && sim.time - probes[i].doneAt > 120) probes.splice(i, 1);
}
