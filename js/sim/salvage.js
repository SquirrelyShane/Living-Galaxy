import { addCargo } from "../flight/ship.js";

export function recoveryBlocker(ship) {
  if (ship.dockedAt) return "Undock to recover salvage";
  if (!ship.salvage) return "Enable SALVAGE in SHIP systems";
  if (!ship.powered?.ops) return "Operations power required";
  return null;
}

export function recoverSite(job, ship, dt) {
  const blocked = recoveryBlocker(ship);
  if (blocked) return { recovered: 0, blocked, done: false };
  const qty = job.grant?.qty ?? job.qty;
  const id = job.grant?.good ?? job.good;
  if (!id || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(dt) || dt <= 0) return { recovered: 0, done: false };
  const have = Math.min(qty, Math.max(0, job.recovered ?? 0));
  const rate = qty / Math.max(1, job.targets?.[0]?.dwell ?? 20);
  const modifier = Math.max(0.1, Math.min(4, ship.mods?.salvage ?? 1));
  const got = addCargo(ship, id, Math.min(qty - have, rate * modifier * dt));
  job.recovered = have + got;
  const done = job.recovered >= qty - 1e-6;
  return { recovered: got, done, blocked: !got && !done ? "Hold full — unload, then return" : null };
}
