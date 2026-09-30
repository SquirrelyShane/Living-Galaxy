import { good } from "../economy/materials.js";

export const HANDLING = {
  rate: 34,
  floor: 2,
  cap: 300,
  perUnit: 0.6,
  bulkRate: 140,
  bulkCap: 45,
};

export const dockwork = { job: null };
export const dockworkHooks = { onBegin: null, onDone: null };

const massOf = (id) => good(id)?.mass ?? 1;
export const isBulk = (id) => good(id)?.tier === "ore";

export function handlingSeconds(id, qty, mods = null) {
  const n = Math.max(0, qty ?? 0);
  if (n <= 0) return 0;
  const tonnes = n * massOf(id);
  const rig = Math.max(0.35, mods?.handling ?? 1);
  const bulk = isBulk(id);
  const rate = bulk ? HANDLING.bulkRate : HANDLING.rate;
  const cap = bulk ? HANDLING.bulkCap : HANDLING.cap;
  return Math.max(HANDLING.floor, Math.min(cap, (tonnes / (rate * rig)) + (massOf(id) ? 0 : n * HANDLING.perUnit)));
}

export function bookHandling(stationId, kind, id, qty, mods = null) {
  const secs = handlingSeconds(id, qty, mods);
  if (secs <= 0 || !stationId) return 0;
  if (!dockwork.job || dockwork.job.stationId !== stationId) {
    dockwork.job = { stationId, secs: 0, left: 0, items: [] };
    dockworkHooks.onBegin?.(dockwork.job);
  }
  const j = dockwork.job;
  const room = Math.max(0, HANDLING.cap - j.left);
  const add = Math.min(secs, room);
  j.secs += add;
  j.left += add;
  j.items.push({ kind, id, qty: Math.round(qty), secs: Math.round(secs) });
  if (j.items.length > 8) j.items.shift();
  return add;
}

export function handlingLeft(stationId = null) {
  const j = dockwork.job;
  if (!j) return 0;
  if (stationId && j.stationId !== stationId) return 0;
  return Math.max(0, j.left);
}

export function handlingProgress() {
  const j = dockwork.job;
  if (!j || j.secs <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - j.left / j.secs));
}

export function handlingLine() {
  const j = dockwork.job;
  if (!j || j.left <= 0) return "";
  const last = j.items[j.items.length - 1];
  const verb = last?.kind === "buy" ? "loading" : last?.kind === "deliver" ? "signing over" : "unloading";
  return `${verb}${last ? ` ${last.qty} ${last.id.replace(/_/g, " ")}` : ""} · ${Math.ceil(j.left)} s`;
}

export function stepDockwork(dt, dockedAt = null) {
  const j = dockwork.job;
  if (!j) return;
  if (dockedAt !== j.stationId) { clearDockwork(); return; }
  j.left = Math.max(0, j.left - dt);
  if (j.left <= 0) {
    dockworkHooks.onDone?.(j);
    dockwork.job = null;
  }
}

export function clearDockwork() { dockwork.job = null; }
