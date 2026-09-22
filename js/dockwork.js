/* LIVING GALAXY — cargo handling: the crane is not instant.
 *
 * 0.3.25. Every trade in the game settled in one frame. A hundred and sixty
 * girders left the hold, the credits landed, and the clamps let go on the same
 * tick — so a trade run's only real cost was flying, and a hold's worth of
 * anything cost the same to move as a crate. It also made ARIA's numbers a
 * lie: her credits-per-minute counted the flying and not the loading, so the
 * bench measured a game nobody plays.
 *
 * The till is still instant — you agree a price and the money moves. The CRANE
 * is not. A consignment books HANDLING time at the berth: the clamps stay on
 * and the port will not release you until the last pallet is aboard or ashore.
 * It is the same rule for a player and for a bot, which is the point: what the
 * bench measures is what you experience.
 *
 * Handling is per-berth and cumulative — buy, sell and deliver in one port
 * call and you wait for all of it — and it scales with TONNAGE, not with
 * units, so eight shield coils are quick and eight hundred rations are not.
 * A hull with a better cargo rig works it off faster (`mods.handling`).
 *
 * Undocking is what enforces it (sim.js toggleDock), so nothing else has to
 * know: the autopilot's own undock, the mission executor's, and the deck
 * button all hit the same refusal and wait it out.
 */

import { good } from "./materials.js";

export const HANDLING = {
  rate: 34,            // tonnes a second at the berth, before the hull's rig
  floor: 2,            // s: even one crate is a pallet, a signature and a scan
  cap: 300,            // s: a port does not take more than five minutes on one call
  perUnit: 0.6,        // s a unit, for goods with no mass on the books
};

/** The berth's clock: { stationId, secs, left, done, items: [...] } or null. */
export const dockwork = { job: null };
export const dockworkHooks = { onBegin: null, onDone: null };

const massOf = (id) => good(id)?.mass ?? 1;

/** Seconds a lot of `id` takes over the side, for a hull with this rig. */
export function handlingSeconds(id, qty, mods = null) {
  const n = Math.max(0, qty ?? 0);
  if (n <= 0) return 0;
  const tonnes = n * massOf(id);
  const rig = Math.max(0.35, mods?.handling ?? 1);
  return Math.max(HANDLING.floor, Math.min(HANDLING.cap, (tonnes / (HANDLING.rate * rig)) + n * 0 + (massOf(id) ? 0 : n * HANDLING.perUnit)));
}

/**
 * Book handling for a lot at a berth. Cumulative within one port call: a buy
 * and a sell on the same visit wait for both. Returns the seconds added.
 */
export function bookHandling(stationId, kind, id, qty, mods = null) {
  const secs = handlingSeconds(id, qty, mods);
  if (secs <= 0 || !stationId) return 0;
  if (!dockwork.job || dockwork.job.stationId !== stationId) {
    dockwork.job = { stationId, secs: 0, left: 0, items: [] };
    dockworkHooks.onBegin?.(dockwork.job);
  }
  const j = dockwork.job;
  j.secs += secs;
  j.left += secs;
  j.items.push({ kind, id, qty: Math.round(qty), secs: Math.round(secs) });
  if (j.items.length > 8) j.items.shift();
  return secs;
}

/** Seconds still to run at this berth (0 when there is nothing on the crane). */
export function handlingLeft(stationId = null) {
  const j = dockwork.job;
  if (!j) return 0;
  if (stationId && j.stationId !== stationId) return 0;
  return Math.max(0, j.left);
}

/** 0…1 through the current port call, for a bar. */
export function handlingProgress() {
  const j = dockwork.job;
  if (!j || j.secs <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - j.left / j.secs));
}

/** "loading 120 Girder · 38 s" */
export function handlingLine() {
  const j = dockwork.job;
  if (!j || j.left <= 0) return "";
  const last = j.items[j.items.length - 1];
  const verb = last?.kind === "buy" ? "loading" : last?.kind === "deliver" ? "signing over" : "unloading";
  return `${verb}${last ? ` ${last.qty} ${last.id.replace(/_/g, " ")}` : ""} · ${Math.ceil(j.left)} s`;
}

/** The sim tick works it off. Only while the hull is actually at that berth. */
export function stepDockwork(dt, dockedAt = null) {
  const j = dockwork.job;
  if (!j) return;
  if (dockedAt !== j.stationId) { clearDockwork(); return; }   // left the berth: the crane is somebody else's problem
  j.left = Math.max(0, j.left - dt);
  if (j.left <= 0) {
    dockworkHooks.onDone?.(j);
    dockwork.job = null;
  }
}

export function clearDockwork() { dockwork.job = null; }
