/* LIVING GALAXY experimental — the atmo works.
 *
 * The first industry that changes a sky instead of hauling it. A terraforming
 * hull (or terraforming hands aboard any hull) can park inside two and a half
 * radii of a solid world and run the works: HEAT seeds greenhouse gas and
 * mirror light, COOL seeds albedo dust and radiator film. The world's
 * temperature moves — for real, persistently, saved with the sky — and its
 * climate band moves with it: warm a frozen moon 110 K and the readout stops
 * saying FROZEN.
 *
 * The payday: the first time a world's band is brought to TEMPERATE by
 * terraforming, the charter pays a **terraform bond** — scaled by the world's
 * size — and every corporation in the sky remembers who did it.
 *
 * Fit: the hull's own trade (terraforming complex, any tier — it carries an
 * Atmo Plant), plus one unit of rate per terraforming-complex hand aboard.
 * Runs off the ops bus; AUX 5 (ATMO) cycles OFF → HEAT → COOL.
 */

import { currentShipId, sim, logEvent } from "./sim.js";
import { BODIES, bodyById, bodyPosition, bodyTempK, bandFromK, dist3 } from "./bodies.js";
import { shipById } from "./shipdb.js";
import { crew } from "./crew.js";
import { adjustStanding, corps } from "./corps.js";
import { work } from "./pilot.js";

export const ATMO_MODES = [
  { id: "off", label: "OFF", hint: "Works cold." },
  { id: "heat", label: "HEAT", hint: "Greenhouse seeding and mirror light. The world warms." },
  { id: "cool", label: "COOL", hint: "Albedo dust and radiator film. The world cools." },
];

export const ATMO_RATE = 0.5;      // kelvin per second per unit of works
export const ATMO_RANGE = 2.5;     // body radii
export const ATMO_LIMIT = 160;     // |terraform| clamp, kelvin
const DRAW_KW = 22;                // battery drain while seeding
const BOND_BASE = 900;             // terraform bond floor

export const atmoworks = {
  mode: "off",
  targetId: null,     // body being worked (the nearest solid world in range)
  applied: 0,         // kelvin moved this session
  product: "",        // AUX readout
};

const SOLID = new Set(["rocky", "moon", "dwarf", "terra", "ice"]);
const _p = { x: 0, y: 0, z: 0 };

/** Units of works aboard: the hull's own trade counts double, each terraforming hand is one. */
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

/** The solid world in working range, or null. */
export function atmoTarget() {
  const ship = sim.ship;
  for (const b of BODIES) {
    if (!SOLID.has(b.kind) || b.shattered) continue;
    bodyPosition(b.id, sim.time, _p);
    if (dist3(ship.pos, _p) < b.radius * ATMO_RANGE) return b;
  }
  return null;
}

/** Called from the sim tick (sim seconds). */
export function stepAtmoWorks(dt) {
  const ship = sim.ship;
  /* billed on the ops board by stepPower next tick — never straight off the battery */
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

  /* save the earned kelvin with the sky every so often */
  if ((atmoworks.applied | 0) % 25 === 0 && atmoworks.applied - (atmoworks.lastSave ?? 0) >= 25) {
    atmoworks.lastSave = atmoworks.applied;
    sim.requestPersist = true;
  }
  const bandAfter = bandFromK(bodyTempK(body) - (body.thermal ?? 0));
  if (bandAfter !== bandBefore) {
    logEvent(`${body.name} reads ${bandAfter.toUpperCase()} — the climate is moving`, "survey");
    sim.toast = `${body.name}: ${bandAfter.toUpperCase()}`;
    sim.lastToastAt = sim.time;
    /* the bond: first time the works bring a world to temperate */
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

/* ---- persistence: the sky keeps what the works earned --------------------- */

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

/** Dash AUX wiring + console access. */
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
