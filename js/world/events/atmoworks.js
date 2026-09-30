import { currentShipId, sim, logEvent } from "../../sim/sim.js";
import { BODIES, bodyById, bodyPosition, bodyTempK, bandFromK, dist3 } from "../bodies.js";
import { shipById } from "../../ships/shipdb.js";
import { crew } from "../../crew/ledger.js";
import { adjustStanding, corps } from "../../corp/corps.js";
import { work } from "../../flight/pilot.js";

export const ATMO_MODES = [
  { id: "off", label: "OFF", hint: "Works cold." },
  { id: "heat", label: "HEAT", hint: "Greenhouse seeding and mirror light. The world warms." },
  { id: "cool", label: "COOL", hint: "Albedo dust and radiator film. The world cools." },
];

export const ATMO_RATE = 0.5;
export const ATMO_RANGE = 2.5;
export const ATMO_LIMIT = 160;
const DRAW_KW = 22;
const BOND_BASE = 900;

export const atmoworks = {
  mode: "off",
  targetId: null,
  applied: 0,
  product: "",
};

const SOLID = new Set(["rocky", "moon", "dwarf", "terra", "ice"]);
const _p = { x: 0, y: 0, z: 0 };

export function atmoFit() {
  const def = shipById(currentShipId());
  const hullUnits = def?.complex === "terraforming" ? 2 : 0;
  const handUnits = crew.aboard.filter((m) => m.complexId === "terraforming").length;
  const units = hullUnits + handUnits;
  return {
    ok: units > 0,
    units,
    hullUnits,
    handUnits,
    why: units > 0
      ? `${hullUnits ? "atmo plant" : ""}${hullUnits && handUnits ? " + " : ""}${handUnits ? `${handUnits} terraformer${handUnits === 1 ? "" : "s"}` : ""}`
      : "No works aboard — a terraforming hull, or a terraformer in the crew.",
  };
}

export function cycleAtmoMode() {
  const fit = atmoFit();
  if (!fit.ok) {
    sim.notice = `Atmo works: ${fit.why}`;
    return atmoworks.mode;
  }
  const i = ATMO_MODES.findIndex((m) => m.id === atmoworks.mode);
  atmoworks.mode = ATMO_MODES[(i + 1) % ATMO_MODES.length].id;
  const m = ATMO_MODES.find((x) => x.id === atmoworks.mode);
  sim.notice = `Atmo works: ${m.label}. ${m.hint}`;
  logEvent(`Atmo works set to ${m.label}`, "system");
  return atmoworks.mode;
}

export function atmoTarget() {
  const ship = sim.ship;
  for (const b of BODIES) {
    if (!SOLID.has(b.kind) || b.shattered) continue;
    bodyPosition(b.id, sim.time, _p);
    if (dist3(ship.pos, _p) < b.radius * ATMO_RANGE) return b;
  }
  return null;
}

export function stepAtmoWorks(dt) {
  const ship = sim.ship;
  if (ship) ship.atmoDraw = 0;
  if (atmoworks.mode === "off") { atmoworks.targetId = null; return; }
  if (!ship.powered?.ops) { atmoworks.product = "OPS BUS COLD"; return; }
  if (ship.charge < 150) { atmoworks.product = "LOW POWER"; return; }
  const fit = atmoFit();
  if (!fit.ok) { atmoworks.mode = "off"; return; }
  const body = atmoTarget();
  if (!body) { atmoworks.targetId = null; atmoworks.product = "NO WORLD IN RANGE"; return; }
  atmoworks.targetId = body.id;

  const bandBefore = bandFromK(bodyTempK(body) - (body.thermal ?? 0));
  const dK = ATMO_RATE * fit.units * dt * (atmoworks.mode === "heat" ? 1 : -1);
  body.terraform = Math.max(-ATMO_LIMIT, Math.min(ATMO_LIMIT, (body.terraform ?? 0) + dK));
  atmoworks.applied += Math.abs(dK);
  atmoworks.product = `${body.name.toUpperCase()} ${Math.round(bodyTempK(body))} K`;
  ship.atmoDraw = DRAW_KW;
  work("terraforming", dt * 0.8);
  work("research", dt * 0.15);

  if ((atmoworks.applied | 0) % 25 === 0 && atmoworks.applied - (atmoworks.lastSave ?? 0) >= 25) {
    atmoworks.lastSave = atmoworks.applied;
    sim.requestPersist = true;
  }
  const bandAfter = bandFromK(bodyTempK(body) - (body.thermal ?? 0));
  if (bandAfter !== bandBefore) {
    logEvent(`${body.name} reads ${bandAfter.toUpperCase()} — the climate is moving`, "survey");
    sim.toast = `${body.name}: ${bandAfter.toUpperCase()}`;
    sim.lastToastAt = sim.time;
    if (bandAfter === "temperate" && !sim.terraBonds?.has(body.id)) {
      (sim.terraBonds ?? (sim.terraBonds = new Set())).add(body.id);
      const bond = Math.round(BOND_BASE + body.radius * 1.4);
      ship.credits += bond;
      for (const c of corps) if (c.tier !== "hostile") adjustStanding(c.id, 1.5, `terraformed ${body.name}`);
      const msg = `TERRAFORM BOND — ${body.name} certified temperate: +${bond} cr, the charters take note`;
      logEvent(msg, "trade");
      sim.requestPersist = true;
      sim.toast = msg;
      sim.lastToastAt = sim.time;
    }
  }
}

export function terraformSnapshot() {
  const out = {};
  for (const b of BODIES) if (Math.abs(b.terraform ?? 0) >= 1) out[b.id] = Math.round(b.terraform);
  return out;
}

export function applyTerraformSnapshot(snap, bonds = []) {
  for (const [id, dK] of Object.entries(snap ?? {})) {
    const b = bodyById(id);
    if (b) b.terraform = Math.max(-ATMO_LIMIT, Math.min(ATMO_LIMIT, Number(dK) || 0));
  }
  sim.terraBonds = new Set(bonds);
}

export function resetAtmoWorks() {
  atmoworks.mode = "off";
  atmoworks.targetId = null;
  atmoworks.applied = 0;
  atmoworks.product = "";
}

export function wireAtmoWorks() {
  if (typeof document === "undefined") return;
  const btn = document.getElementById("aux-atmo");
  const st = document.getElementById("aux-atmo-st");
  if (btn) btn.addEventListener("click", () => cycleAtmoMode());
  if (btn && st) {
    setInterval(() => {
      if (sim.phase !== "play") return;
      const m = ATMO_MODES.find((x) => x.id === atmoworks.mode);
      st.textContent = atmoworks.mode === "off" ? (atmoFit().ok ? "READY" : "NO FIT") : atmoworks.product || m.label;
      btn.classList.toggle("on", atmoworks.mode !== "off");
    }, 600);
  }
  if (globalThis.window?.__lg) window.__lg.atmoworks = { atmoworks, atmoFit, cycleAtmoMode, atmoTarget, stepAtmoWorks };
}
