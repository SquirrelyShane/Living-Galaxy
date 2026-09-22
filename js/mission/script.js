/* LIVING GALAXY — mission scripts: the schema the autopilot flies.
 *
 * A mission is a list of steps, each one an op the autopilot knows how to fly
 * (go somewhere, dock, mine, sell, wait…), with an optional target, an
 * optional "until" condition, and per-step overrides of the thrust cap and the
 * warp policy. A loop row repeats the list ×N or until a condition holds.
 * This file is the data side only — schema, validation, conditions,
 * descriptions, presets and the per-pilot save list. run.js flies them.
 *
 * Step    { id, op, target?: Ref, args?: {}, until?: Cond, thrustCap?: 0.1..1.4, warp?: "auto"|"ask"|"never", onFail?: "abort"|"skip"|"retry" }
 * Ref     { kind: "body"|"station"|"wp"|"point"|"best-buyer"|"best-smelter"|"nearest-port"|"seam"|"here"|"locked"|"trade-source"|"trade-dest", id?, x?, y?, z?, name? }
 *         (0.3.19: trade-source / trade-dest are the two ends of the run's trade route — traderoutes.js — picked at the source dock each round)
 * Cond    { k: "hold"|"credits"|"charge"|"hull"|"time"|"docked"|"cargoOf"|"loops", op, v, id? } | { all: [] } | { any: [] } | { not: Cond }
 * Mission { id, name, steps: Step[], loop: { mode: "none"|"count"|"until", count?, until?: Cond }, defaults: { thrustCap: 1, warp: "auto" }, createdAt, runs }
 */

import * as simMod from "../sim.js";
import * as shipMod from "../ship.js";

const sim = () => simMod.sim;
const BATTERY = () => shipMod.BATTERY ?? 1600;
/** package D exports batteryCap(ship) from ship.js; until it lands the rated battery is the cap */
const batteryCap = (ship) => shipMod.batteryCap?.(ship) ?? BATTERY();

/**
 * Does this hull carry a mission computer?
 *
 * Asked as a CAPABILITY, not as an upgrade id. The gate used to read
 * `hasUpgrade("nav_core")`, and the Conn learning core (11,000 cr) declares
 * `fx: { missions: true }` with a blurb that says it "carries a mission
 * computer" — so the dearer of the two cores advertised multi-step missions
 * and then did not unlock them. Anything that grants `missions` opens the
 * editor now, which is what the fx table was for.
 */
import { hasUpgrade, fx } from "../upgrades.js";

export const missionCore = () => hasUpgrade("nav_core") || Boolean(fx("missions", false));

export const OPS = {
  GOTO:     { label: "Go to",    target: true, until: null },
  APPROACH: { label: "Approach", target: true },
  DOCK:     { label: "Dock",     target: "port|best-buyer|best-smelter|nearest-port|trade-source|trade-dest" },
  UNDOCK:   { label: "Undock" },
  MINE:     { label: "Mine",     target: "seam|point|here", until: { k: "hold", op: ">=", v: 0.9 } },
  SELL:     { label: "Sell",     args: { what: "ore" } },
  STASH:    { label: "Stash",    args: { what: "all" } },
  SMELT:    { label: "Smelt" },
  BUY:      { label: "Buy",      args: { good: null, qty: 20 } },
  CHARGE:   { label: "Charge",   until: { k: "charge", op: ">=", v: 0.85 } },
  WAIT:     { label: "Wait",     until: { k: "time", op: ">=", v: 60 } },
  SURVEY:   { label: "Survey",   target: "body" },
  HOLD:     { label: "Hold",     until: null },
  SET:      { label: "Set",      args: {} },
  REPAIR:   { label: "Repair" },
  /* 0.3.06 — what ARIA spends money on at a port it is already sitting at.
   * Both are docked-only and both name their subject in args, so a step
   * serialises and comes back without a target reference to resolve. */
  REFIT:    { label: "Refit",    args: { id: null } },
  BUILD:    { label: "Build",    args: { role: null } },
  /* 0.3.10 — put a fabrication job on the port's line and fly on; it finishes
   * on sim time and lands in that port's locker. */
  FAB:      { label: "Fabricate", args: { good: null, qty: 1 } },
};

export const REF_KINDS = ["body", "station", "wp", "point", "best-buyer", "best-smelter", "nearest-port", "seam", "here", "locked", "trade-source", "trade-dest"];
export const COND_KEYS = ["hold", "credits", "charge", "hull", "time", "docked", "cargoOf", "loops"];
export const COND_OPS = [">=", "<=", ">", "<", "==", "!="];
export const WARP_POLICIES = ["auto", "ask", "never"];
export const ON_FAIL = ["abort", "skip", "retry"];
/** which target kinds each op accepts (null = no target) */
const TARGETS_FOR = {
  GOTO: REF_KINDS, APPROACH: REF_KINDS, SURVEY: ["body", "locked"],
  DOCK: ["station", "best-buyer", "best-smelter", "nearest-port", "locked", "trade-source", "trade-dest"],
  MINE: ["seam", "point", "here", "wp", "locked"],
};

let _n = 0;
const uid = (p) => `${p}${Date.now().toString(36)}${(++_n).toString(36)}`;
const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o, infOut), infIn));
const infOut = (k, v) => (v === Infinity ? "Infinity" : v);
const infIn = (k, v) => (v === "Infinity" ? Infinity : v);

/** ids and defaults filled */
export function makeMission(partial = {}) {
  const m = {
    id: uid("m"),
    name: "Mission",
    steps: [],
    loop: { mode: "none" },
    defaults: { thrustCap: 1, warp: "auto" },
    createdAt: 0,
    runs: 0,
    ...partial,
  };
  m.loop = { mode: "none", ...(partial.loop ?? {}) };
  m.defaults = { thrustCap: 1, warp: "auto", ...(partial.defaults ?? {}) };
  m.steps = (partial.steps ?? []).map((s) => ({ ...s, id: s.id ?? uid("s"), target: s.target ?? null }));
  return m;
}

export function makeStep(op, target = null, extra = {}) {
  const spec = OPS[op] ?? {};
  const s = { id: uid("s"), op, target };
  if (spec.until && extra.until === undefined) s.until = clone(spec.until);
  if (spec.args && extra.args === undefined) s.args = clone(spec.args);
  return { ...s, ...extra };
}

/** mission with one step, loop none — what HUD/chart buttons build */
export function oneStep(op, target, defaults = {}) {
  const name = target?.name ? `${OPS[op]?.label ?? op} ${target.name}` : OPS[op]?.label ?? op;
  return makeMission({ name, steps: [makeStep(op, target)], defaults: { thrustCap: 1, warp: "auto", ...defaults }, builtin: true });
}

/* ---- validation ----------------------------------------------------------- */

function condErrors(c, where, out) {
  if (c == null) return;
  if (typeof c !== "object") { out.push({ step: where, msg: "condition is not an object" }); return; }
  if (Array.isArray(c.all)) { c.all.forEach((x) => condErrors(x, where, out)); return; }
  if (Array.isArray(c.any)) { c.any.forEach((x) => condErrors(x, where, out)); return; }
  if (c.not !== undefined) { condErrors(c.not, where, out); return; }
  if (!COND_KEYS.includes(c.k)) out.push({ step: where, msg: `unknown condition "${c.k}"` });
  if (!COND_OPS.includes(c.op)) out.push({ step: where, msg: `unknown comparison "${c.op}"` });
  if (c.k === "docked") { if (typeof c.v !== "boolean") out.push({ step: where, msg: "docked compares to true/false" }); }
  else if (typeof c.v !== "number" || !isFinite(c.v)) out.push({ step: where, msg: `"${c.k}" needs a number` });
  if (c.k === "cargoOf" && !c.id) out.push({ step: where, msg: "cargoOf needs a good id" });
}

/** → [{ step, msg }] — empty when the mission can fly */
export function validate(m) {
  const out = [];
  if (!m || !Array.isArray(m.steps)) return [{ step: -1, msg: "not a mission" }];
  if (!m.steps.length) out.push({ step: -1, msg: "no steps" });
  m.steps.forEach((s, i) => {
    const spec = OPS[s.op];
    if (!spec) { out.push({ step: i, msg: `unknown op "${s.op}"` }); return; }
    if (spec.target) {
      if (!s.target || !REF_KINDS.includes(s.target.kind)) out.push({ step: i, msg: `${spec.label} needs a target` });
      else if (TARGETS_FOR[s.op] && !TARGETS_FOR[s.op].includes(s.target.kind)) out.push({ step: i, msg: `${spec.label} cannot target ${s.target.kind}` });
      else if (["body", "station", "wp"].includes(s.target.kind) && !s.target.id && s.op !== "SURVEY") out.push({ step: i, msg: `${spec.label} target has no id` });
      else if (s.target.kind === "point" && ![s.target.x, s.target.y, s.target.z].every((v) => typeof v === "number")) out.push({ step: i, msg: "point target needs x, y, z" });
    }
    condErrors(s.until, i, out);
    if (s.thrustCap != null && !(s.thrustCap >= 0.1 && s.thrustCap <= 1.4)) out.push({ step: i, msg: "thrust cap is 0.1..1.4" });
    if (s.warp != null && !WARP_POLICIES.includes(s.warp)) out.push({ step: i, msg: `warp policy "${s.warp}"` });
    if (s.onFail != null && !ON_FAIL.includes(s.onFail)) out.push({ step: i, msg: `on-fail "${s.onFail}"` });
    if (s.op === "BUY" && !(s.args?.qty > 0)) out.push({ step: i, msg: "buy needs a quantity" });
    if (s.op === "REFIT" && !s.args?.id) out.push({ step: i, msg: "refit needs an upgrade" });
    if (s.op === "BUILD" && !s.args?.role) out.push({ step: i, msg: "build needs a drone role" });
    if (s.op === "FAB" && !s.args?.good) out.push({ step: i, msg: "fabricate needs a part" });
    if (s.op === "FAB" && !(s.args?.qty > 0)) out.push({ step: i, msg: "fabricate needs a quantity" });
  });
  const L = m.loop ?? { mode: "none" };
  if (!["none", "count", "until"].includes(L.mode)) out.push({ step: -1, msg: `loop mode "${L.mode}"` });
  if (L.mode === "count" && !(L.count >= 1)) out.push({ step: -1, msg: "loop count must be 1 or more" });
  if (L.mode === "until") { if (!L.until) out.push({ step: -1, msg: "loop until needs a condition" }); else condErrors(L.until, -1, out); }
  const d = m.defaults ?? {};
  if (d.thrustCap != null && !(d.thrustCap >= 0.1 && d.thrustCap <= 1.4)) out.push({ step: -1, msg: "default thrust cap is 0.1..1.4" });
  if (d.warp != null && !WARP_POLICIES.includes(d.warp)) out.push({ step: -1, msg: `default warp policy "${d.warp}"` });
  return out;
}

/* ---- conditions ------------------------------------------------------------ */

/** → { hold, credits, charge, hull, time, docked, cargoOf(id), loops }; run.js passes its clock and loop count */
export function snapshot({ stepStartedAt = 0, loops = 0 } = {}) {
  const S = sim();
  const ship = S.ship;
  const total = shipMod.cargoTotal(ship);
  const cap = ship.cargoCap || 1;
  return {
    hold: Math.max(0, Math.min(1, total / cap)),
    credits: ship.credits ?? 0,
    charge: Math.max(0, Math.min(1, (ship.charge ?? 0) / batteryCap(ship))),
    hull: ship.hull ?? 0,
    time: S.time - stepStartedAt,
    docked: Boolean(ship.dockedAt),
    cargoOf: (id) => ship.hold?.[id] ?? 0,
    loops,
  };
}

const CMP = {
  ">=": (a, b) => a >= b, "<=": (a, b) => a <= b, ">": (a, b) => a > b, "<": (a, b) => a < b,
  "==": (a, b) => a === b, "!=": (a, b) => a !== b,
};

export function evalCond(cond, snap) {
  if (!cond || typeof cond !== "object") return false;
  if (Array.isArray(cond.all)) return cond.all.every((c) => evalCond(c, snap));
  if (Array.isArray(cond.any)) return cond.any.some((c) => evalCond(c, snap));
  if (cond.not !== undefined) return !evalCond(cond.not, snap);
  const cmp = CMP[cond.op];
  if (!cmp) return false;
  const a = cond.k === "cargoOf" ? snap.cargoOf?.(cond.id) ?? 0 : snap[cond.k];
  if (a === undefined) return false;
  return cmp(a, cond.v);
}

/* ---- descriptions ----------------------------------------------------------- */

const OPSYM = { ">=": "≥", "<=": "≤", ">": ">", "<": "<", "==": "=", "!=": "≠" };
const FRAC = new Set(["hold", "charge"]);

export function describeCond(c) {
  if (!c) return "";
  if (Array.isArray(c.all)) return c.all.map(describeCond).join(" and ");
  if (Array.isArray(c.any)) return `(${c.any.map(describeCond).join(" or ")})`;
  if (c.not !== undefined) return `not ${describeCond(c.not)}`;
  const v = FRAC.has(c.k) ? `${Math.round(c.v * 100)}%` : c.k === "time" ? `${c.v}s` : c.k === "credits" ? `${Math.round(c.v).toLocaleString()} cr` : String(c.v);
  const k = c.k === "cargoOf" ? (c.id ?? "cargo").replace(/_/g, " ") : c.k;
  return `${k} ${OPSYM[c.op] ?? c.op} ${v}`;
}

export function describeRef(r) {
  if (!r) return "";
  if (r.name) return r.name;
  switch (r.kind) {
    case "best-buyer": return "best buyer";
    case "best-smelter": return "best smelter";
    case "nearest-port": return "nearest port";
    case "trade-source": return "the route's source";
    case "trade-dest": return "the route's buyer";
    case "seam": return "the seam";
    case "here": return "here";
    case "locked": return "locked target";
    case "point": return `${Math.round(r.x / 100)},${Math.round(r.z / 100)} km`;
    case "body": return r.id ? String(r.id) : "nearest unsurveyed";
    default: return r.id ? String(r.id) : r.kind;
  }
}

/** → "MINE the seam until hold ≥ 90% · ≤75% · warp ask" */
export function describeStep(step) {
  if (!step) return "";
  const parts = [step.op];
  const t = describeRef(step.target);
  if (t) parts[0] += ` ${t}`;
  if (step.op === "SELL" || step.op === "STASH") parts[0] += ` ${(step.args?.what ?? "ore").replace(/_/g, " ")}`;
  if (step.op === "BUY") parts[0] += step.args?.good === "route" ? " the route's cargo" : ` ${step.args?.qty ?? 0} ${(step.args?.good ?? "best margin").replace(/_/g, " ")}`;
  if (step.op === "SET") parts[0] += ` ${Object.entries(step.args ?? {}).map(([k, v]) => `${k}=${typeof v === "object" ? `${v.key}:${v.on ? "on" : "off"}` : v}`).join(" ") || "—"}`;
  if (step.until) parts[0] += ` until ${describeCond(step.until)}`;
  if (step.thrustCap != null) parts.push(`≤${Math.round(step.thrustCap * 100)}%`);
  if (step.warp) parts.push(`warp ${step.warp}`);
  if (step.onFail && step.onFail !== "abort") parts.push(`on fail ${step.onFail}`);
  return parts.join(" · ");
}

/* ---- serialize --------------------------------------------------------------- */

export function serialize(m) {
  return JSON.stringify(m ?? null, infOut);
}

/** → Mission (validated, defaults re-applied) or null when it cannot be read */
export function deserialize(json) {
  try {
    const o = typeof json === "string" ? JSON.parse(json, infIn) : clone(json);
    if (!o || typeof o !== "object" || !Array.isArray(o.steps)) return null;
    const m = makeMission(o);
    return validate(m).some((e) => /not a mission|unknown op/.test(e.msg)) ? null : m;
  } catch {
    return null;
  }
}

/* ---- presets ------------------------------------------------------------------ */

const C = (k, op, v, id) => (id ? { k, op, v, id } : { k, op, v });

/** MINE LOOP, TRADE RUN, SURVEY SWEEP, PATROL — fresh copies each call.
 *
 * All four are `builtin`, which is the flag `startMission` checks before it
 * asks for a Mission core. They were not, and the effect was that a pilot with
 * no core could not fly ANY multi-step plan — not even the four the game ships
 * and shows at the top of the editor. The core is meant to gate missions you
 * WRITE, not the stock loops; `fresh()` in the editor strips the flag, so the
 * moment a preset is copied out to be edited it becomes yours and is gated
 * like anything else you build. */
export function presets() {
  return [
    makeMission({
      id: "preset-mine", name: "MINE LOOP", preset: true, builtin: true,
      steps: [
        makeStep("MINE", { kind: "seam" }, { until: C("hold", ">=", 0.9) }),
        makeStep("DOCK", { kind: "best-buyer" }),
        makeStep("SELL", null, { args: { what: "ore" } }),
        makeStep("CHARGE", null, { until: C("charge", ">=", 0.85) }),
      ],
      loop: { mode: "until", until: C("credits", ">=", 50000) },
    }),
    /* 0.3.19 — TRADE RUN flies a ROUTE (traderoutes.js): at the top of each
     * round it picks the best buy-here-sell-there run from where the hull is,
     * with the hold and the purse it has, docks at the source, buys the
     * route's cargo (all the hold and purse allow), docks at the buyer, sells
     * exactly that and nothing it was carrying for anyone else. It used to
     * dock at the nearest port, buy the cheapest thing on the shelf, "fly" to
     * a best buyer that was almost always the same port, and sell it straight
     * back below what it paid — a guaranteed loss every round. */
    makeMission({
      id: "preset-trade", name: "TRADE RUN", preset: true, builtin: true,
      steps: [
        makeStep("DOCK", { kind: "trade-source" }),
        makeStep("BUY", null, { args: { good: "route", qty: 9999 } }),
        makeStep("DOCK", { kind: "trade-dest" }),
        makeStep("SELL", null, { args: { what: "route" } }),
        makeStep("CHARGE", null, { until: C("charge", ">=", 0.85) }),
      ],
      loop: { mode: "count", count: 5 },
    }),
    makeMission({
      id: "preset-survey", name: "SURVEY SWEEP", preset: true, builtin: true,
      steps: [makeStep("SURVEY", { kind: "body", name: "nearest unsurveyed" })],
      loop: { mode: "count", count: 3 },
      defaults: { thrustCap: 1, warp: "auto" },
    }),
    makeMission({
      id: "preset-patrol", name: "PATROL", preset: true, builtin: true,
      steps: [
        makeStep("GOTO", { kind: "locked" }),
        makeStep("HOLD", null, { until: C("time", ">=", 90) }),
        makeStep("GOTO", { kind: "here", name: "the start" }),
        makeStep("HOLD", null, { until: C("time", ">=", 90) }),
      ],
      loop: { mode: "count", count: Infinity },
      defaults: { thrustCap: 0.75, warp: "never" },
    }),
  ];
}

/* ---- the per-pilot save list --------------------------------------------------- */

export const MISSIONS_KEY = () => `lgaa.missions.v1:${sim().callsign || "pilot"}`;

export function loadMissions() {
  try {
    const raw = globalThis.localStorage?.getItem(MISSIONS_KEY());
    if (!raw) return [];
    const list = JSON.parse(raw, infIn);
    return Array.isArray(list) ? list.map((m) => deserialize(m)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function saveMissions(list) {
  try {
    globalThis.localStorage?.setItem(MISSIONS_KEY(), JSON.stringify((list ?? []).filter((m) => m && Array.isArray(m.steps)), infOut));
    return null;
  } catch (e) {
    return String(e?.message ?? e);
  }
}
