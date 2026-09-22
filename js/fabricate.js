/* LIVING GALAXY — the fabrication line: rock in one end, parts out the other.
 *
 * The three tiers have been in js/materials.js since the beginning — ORES carry
 * `refine` (what a unit becomes at the smelter), MINERALS and COMPONENTS carry
 * `from` (what a unit is built out of) — and until now only the FIRST arrow was
 * ever executed. `smeltAll()` turns ore into minerals; nothing turned minerals
 * into steel, or steel into a plate, or copper and a bearing into a motor. The
 * whole top of the graph was data nobody could reach, while the ports sold the
 * very components it describes.
 *
 * So: a job is "make N of X at this port", and it resolves the WHOLE tree.
 *
 *   1x Electric motor  ← copper 4, steel 2, bearing 1
 *        bearing       ← stainless 1, bronze 1
 *        stainless     ← steel 2, chromium 1, nickel 1
 *        steel         ← iron 3, carbon 1
 *        …and every mineral that is still missing is smelted from its ore.
 *
 * Which bottoms out at 46 units of ore for one motor. That is the point: the
 * graph is checked acyclic and every component reduces to ores you can cut, so
 * a hold of rock is a genuine input to the parts economy.
 *
 * WHAT IT CONSUMES, AND IN WHAT ORDER. Always the nearest thing to the
 * finished part first. If you are holding steel, a plate takes the steel; it
 * does not smelt fresh iron and leave the steel sitting there. Only what is
 * still missing after the pool is exhausted recurses down a tier, so bringing
 * half-finished stock shortens the job instead of being ignored.
 *
 * WHAT IT IS NOT. It does not invent value, and it does not hide the price.
 * Running this graph for the first time found eleven recipes that cost more in
 * raw ore than the product sold for — a Gyroscope was 1,726 cr of ore for an
 * 1,120 cr part — because nothing had ever run the numbers. Those values were
 * raised in 0.3.11 and a test now holds the line at "nothing is worth less than
 * the rock it came out of". The margin is still reported on every job, because
 * 1.1x and 6.5x are both above water and only one of them is worth the trip.
 *
 * THIS MODULE IS A LEAF. It imports the materials table and nothing else. The
 * clock, the stock it draws on, the credits it charges and the locker it
 * delivers into are all injected by `wireFab`, which is what lets the whole
 * thing — solver and queue — run in node with no sim and no browser.
 */

import { ORES, ALL_GOODS, SECTORS, goodName, baseValue } from "./materials.js";

/** Run key — a pilot's own jobs. Filed in js/profile.js. */
export const FAB_KEY = () => `lgaa.fab.v1:${state.skySeed ?? "sky"}:${state.callsign ?? "pilot"}`;

export const FAB = {
  fee: 0.09,          // share of the finished value the works keeps
  secsPerOp: 3.5,     // sim seconds per production operation
  minSecs: 20,        // no job is instant; you leave and come back
  maxSecs: 3600,
  maxQty: 500,
  perPort: 3,         // jobs one port will run at once
  loss: 0.02,         // scrap: a fraction of each operation's input is lost
};

export const fabJobs = [];          // live jobs, every port
let seq = 1;

/* ---- the graph ------------------------------------------------------------ */

const BY_ID = new Map(ALL_GOODS.map((g) => [g.id, g]));
/* mineral id → the ore that refines into it. First ore wins; the table has one
 * ore per mineral today, and if that ever changes the cheapest is the one to
 * prefer, not the first. */
const ORE_FOR = new Map();
for (const o of ORES) {
  if (!o.refine) continue;
  const cur = ORE_FOR.get(o.refine.mineral);
  if (!cur || o.value / o.refine.per < cur.value / cur.refine.per) ORE_FOR.set(o.refine.mineral, o);
}

/**
 * How one unit of `id` is made.
 *   { kind: "make",   from: { input: qty, … } }   a recipe in the table
 *   { kind: "refine", from: { ore: qty }, ore }   smelted from its ore
 *   null                                          raw: it comes out of a rock
 */
export function recipeFor(id) {
  const g = BY_ID.get(id);
  if (!g) return null;
  if (g.from) return { kind: "make", from: { ...g.from } };
  const ore = ORE_FOR.get(id);
  if (ore) return { kind: "refine", ore: ore.id, from: { [ore.id]: 1 / ore.refine.per } };
  return null;
}

/** Everything a good is ultimately made of, in raw ore. */
export function billOfMaterials(id, qty = 1, acc = {}, depth = 0) {
  if (depth > 32) return acc;              // the graph is acyclic; this is a backstop
  const r = recipeFor(id);
  if (!r) { acc[id] = (acc[id] ?? 0) + qty; return acc; }
  for (const [k, n] of Object.entries(r.from)) billOfMaterials(k, qty * n, acc, depth + 1);
  return acc;
}

/** What a good is worth as raw ore, against what it sells for. > 1 is worth making. */
export function fabMargin(id) {
  const bom = billOfMaterials(id, 1);
  const raw = Object.entries(bom).reduce((a, [k, v]) => a + v * baseValue(k), 0);
  const out = baseValue(id);
  return { raw, out, ratio: raw > 0 ? out / raw : Infinity };
}

/* ---- planning a job -------------------------------------------------------- */

/**
 * Work out a job against the stock actually on hand.
 *
 * `stock` is a plain { goodId: qty } of everything reachable — the hold and the
 * port's locker, merged by the caller. Nothing here mutates it.
 *
 * → { ok, steps, use, short, ops, secs, fee, outValue, margin, mass }
 *     steps  productions in dependency order (inputs before the things they feed)
 *     use    what comes off the shelf, by id
 *     short  what is missing even after cascading all the way down to ore
 */
export function planJob(id, qty = 1, stock = {}) {
  const g = BY_ID.get(id);
  if (!g) return { ok: false, why: `no such good: ${id}` };
  if (!(qty > 0)) return { ok: false, why: "quantity must be positive" };
  if (qty > FAB.maxQty) return { ok: false, why: `${FAB.maxQty} is the most one job will run` };

  const pool = { ...stock };
  const use = {};
  const short = {};
  const steps = [];
  let ops = 0;

  /* Post-order: a step is pushed only once everything it needs has been
   * planned, so running `steps` front to back never reaches for something that
   * does not exist yet. */
  const produce = (want, n, depth) => {
    if (n <= 1e-9 || depth > 32) return;
    const have = pool[want] ?? 0;
    const off = Math.min(have, n);
    if (off > 0) { pool[want] = have - off; use[want] = (use[want] ?? 0) + off; }
    let rem = n - off;
    if (rem <= 1e-9) return;
    const r = recipeFor(want);
    if (!r) { short[want] = (short[want] ?? 0) + rem; return; }
    /* scrap: ask the line for a little more than the arithmetic needs */
    const batches = rem * (1 + FAB.loss);
    for (const [k, per] of Object.entries(r.from)) produce(k, per * batches, depth + 1);
    steps.push({ id: want, qty: rem, kind: r.kind });
    ops += batches;
  };
  produce(id, qty, 0);

  /* What to actually BRING. `billOfMaterials` is the arithmetic; this is the
   * arithmetic plus scrap, minus whatever the pool already covered — i.e. the
   * shopping list. Without it a pilot who brings exactly the bill is told the
   * job is short by 2% and has no idea why. */
  const need = {};
  for (const [k, v] of Object.entries(short)) need[k] = Math.ceil(v * 100) / 100;

  /* One line per good rather than one per branch: steel gets produced twice in
   * a motor (once for the hull, once inside the stainless) and a list that says
   * so twice reads like a bug. */
  const merged = new Map();
  for (const st of steps) {
    const cur = merged.get(st.id);
    if (cur) cur.qty += st.qty; else merged.set(st.id, { ...st });
  }
  const summary = [...merged.values()];

  const outValue = baseValue(id) * qty;
  const secs = Math.max(FAB.minSecs, Math.min(FAB.maxSecs, Math.round(ops * FAB.secsPerOp)));
  const usedMass = Object.entries(use).reduce((a, [k, v]) => a + v * (BY_ID.get(k)?.mass ?? 0), 0);
  const m = fabMargin(id);
  return {
    ok: Object.keys(short).length === 0,
    id, qty, steps, summary, use, short, need,
    ops: Math.round(ops),
    secs,
    fee: Math.round(outValue * FAB.fee),
    outValue: Math.round(outValue),
    margin: m.ratio,
    mass: Math.round(usedMass),
    why: Object.keys(short).length
      ? `short ${Object.entries(short).map(([k, v]) => `${Math.ceil(v)} ${goodName(k)}`).join(", ")}`
      : "",
  };
}

/**
 * The most of `id` this stock will actually run, for the MAX rung on the
 * quantity control. Binary search rather than arithmetic, because the cascade
 * reuses part-finished stock: ten plates do not cost ten times one plate when
 * you are already holding steel, so dividing a bill by a stock level gets the
 * wrong answer in exactly the case the pilot cares about.
 *
 * `planJob` is cheap (a few dozen nodes), so ~9 probes costs nothing.
 */
export function maxRunnable(id, stock = {}, cap = FAB.maxQty) {
  if (!planJob(id, 1, stock).ok) return 0;
  let lo = 1, hi = cap;
  if (planJob(id, hi, stock).ok) return hi;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (planJob(id, mid, stock).ok) lo = mid; else hi = mid - 1;
  }
  return lo;
}

/* ---- which ports will run it ----------------------------------------------- */

/**
 * A port fabricates what it is known for, and an industrial yard fabricates
 * anything. That is `services` and `sells` from the SECTORS table doing the
 * gating rather than a second list invented here and left to drift.
 */
export function canFabAt(st, id = null) {
  if (!st || (st.hostile && !st.claimed)) return false;
  const sec = SECTORS[st.sector] ?? null;
  const services = sec?.services ?? [];
  const anything = services.includes("fabricate");
  if (!id) return anything || Object.keys(sec?.sells ?? {}).length > 0;
  if (anything) return true;
  return Boolean(sec?.sells && id in sec.sells);
}

/** What this port will build, best margin first. */
export function fabMenuAt(st) {
  if (!st) return [];
  const out = [];
  for (const g of ALL_GOODS) {
    if (g.tier === "ore") continue;               // ore is cut, not built
    if (!canFabAt(st, g.id)) continue;
    const m = fabMargin(g.id);
    out.push({ id: g.id, name: g.name, tier: g.tier, value: g.value, ratio: m.ratio, raw: Math.round(m.raw) });
  }
  return out.sort((a, b) => b.ratio - a.ratio);
}

/* ---- the queue -------------------------------------------------------------- */

const state = {
  now: () => 0,
  stockAt: () => ({}),        // (stId, by) → { id: qty } the job may draw on
  consume: () => {},          // (stId, by, { id: qty })
  deliver: () => {},          // (stId, by, id, qty)
  pay: () => "no payer",      // (by, credits, why) → null | why not
  log: () => {},              // (text, job)
  skySeed: null,
  callsign: null,
};

export function fabQueueAt(stId) { return fabJobs.filter((j) => j.stId === stId); }
export function fabJobById(jid) { return fabJobs.find((j) => j.id === jid) ?? null; }

/**
 * Put a job on a port's line.
 * `by` is "player" (your credits, you must be docked) or "company" (the
 * treasury, and it runs while you are somewhere else).
 * → { ok: true, job } | { ok: false, why }
 */
export function orderFab({ st, id, qty = 1, by = "player" } = {}) {
  if (!st) return { ok: false, why: "No port" };
  if (!canFabAt(st, id)) return { ok: false, why: `${st.name} has no line for ${goodName(id)}` };
  if (fabQueueAt(st.id).length >= FAB.perPort) return { ok: false, why: `${st.name}'s lines are full` };
  const stock = state.stockAt(st.id, by) ?? {};
  const plan = planJob(id, qty, stock);
  if (!plan.ok) return { ok: false, why: plan.why || "Cannot plan that job" };
  const why = state.pay(by, plan.fee, `${qty} × ${goodName(id)} at ${st.name}`);
  if (why) return { ok: false, why };
  state.consume(st.id, by, plan.use);
  const now = state.now();
  const job = {
    jid: `f${seq}`, id: `f${seq}`, n: seq++, stId: st.id, stName: st.name,
    good: id, name: goodName(id), qty, by,
    start: now, done: now + plan.secs, secs: plan.secs,
    fee: plan.fee, ops: plan.ops, used: plan.use,
  };
  fabJobs.push(job);
  state.log(`${st.name}: ${qty} × ${goodName(id)} on the line — ${plan.secs} s, ${plan.fee.toLocaleString()} cr`, job);
  save();
  return { ok: true, job, plan };
}

/** Pull a job and hand back nothing — the materials are already in it. */
export function cancelFab(jid) {
  const i = fabJobs.findIndex((j) => j.id === jid);
  if (i < 0) return { ok: false, why: "No such job" };
  const [job] = fabJobs.splice(i, 1);
  /* what went in comes back: a cancelled job has not been run */
  for (const [k, v] of Object.entries(job.used ?? {})) state.deliver(job.stId, job.by, k, v);
  state.log(`${job.stName}: ${job.name} pulled off the line — materials back in the locker`, job);
  save();
  return { ok: true, job };
}

/** Called from the sim tick. Finishes whatever is due. → how many landed */
export function stepFab(now = state.now()) {
  let done = 0;
  for (let i = fabJobs.length - 1; i >= 0; i--) {
    const j = fabJobs[i];
    if (j.done > now) continue;
    fabJobs.splice(i, 1);
    state.deliver(j.stId, j.by, j.good, j.qty);
    state.log(`${j.stName}: ${j.qty} × ${j.name} off the line — in the locker`, j);
    done++;
  }
  if (done) save();
  return done;
}

export function fabReport() {
  const now = state.now();
  return fabJobs.map((j) => ({
    id: j.id, port: j.stName, stId: j.stId, good: j.good, name: j.name, qty: j.qty, by: j.by,
    left: Math.max(0, Math.round(j.done - now)),
    frac: j.secs > 0 ? Math.min(1, Math.max(0, (now - j.start) / j.secs)) : 1,
  }));
}

/* ---- persistence -------------------------------------------------------------- */

export function save() {
  try {
    globalThis.localStorage?.setItem(FAB_KEY(), JSON.stringify({ v: 1, seq, jobs: fabJobs }));
  } catch { /* storage is a convenience */ }
}

export function loadFab() {
  try {
    const raw = globalThis.localStorage?.getItem(FAB_KEY());
    if (!raw) return 0;
    const j = JSON.parse(raw);
    if (!Array.isArray(j?.jobs)) return 0;
    fabJobs.length = 0;
    fabJobs.push(...j.jobs);
    seq = Number(j.seq) || fabJobs.length + 1;
    return fabJobs.length;
  } catch { return 0; }
}

export function resetFab() {
  fabJobs.length = 0;
  seq = 1;
}

/** sim.js injects the world; nothing above this line knows what a station is. */
export function wireFab(hooks = {}) {
  Object.assign(state, hooks);
  return state;
}

export default fabJobs;
