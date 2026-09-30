import { ORES, ALL_GOODS, SECTORS, goodName, baseValue } from "./materials.js";

export const FAB_KEY = () => `lgaa.fab.v1:${state.skySeed ?? "sky"}:${state.callsign ?? "pilot"}`;

export const FAB = {
  fee: 0.09,
  secsPerOp: 3.5,
  minSecs: 20,
  maxSecs: 3600,
  maxQty: 500,
  perPort: 3,
  loss: 0.02,
};

export const fabJobs = [];
let seq = 1;

const BY_ID = new Map(ALL_GOODS.map((g) => [g.id, g]));
const ORE_FOR = new Map();
for (const o of ORES) {
  if (!o.refine) continue;
  const cur = ORE_FOR.get(o.refine.mineral);
  if (!cur || o.value / o.refine.per < cur.value / cur.refine.per) ORE_FOR.set(o.refine.mineral, o);
}

export function recipeFor(id) {
  const g = BY_ID.get(id);
  if (!g) return null;
  if (g.from) return { kind: "make", from: { ...g.from } };
  const ore = ORE_FOR.get(id);
  if (ore) return { kind: "refine", ore: ore.id, from: { [ore.id]: 1 / ore.refine.per } };
  return null;
}

export function billOfMaterials(id, qty = 1, acc = {}, depth = 0) {
  if (depth > 32) return acc;
  const r = recipeFor(id);
  if (!r) { acc[id] = (acc[id] ?? 0) + qty; return acc; }
  for (const [k, n] of Object.entries(r.from)) billOfMaterials(k, qty * n, acc, depth + 1);
  return acc;
}

export function fabMargin(id) {
  const bom = billOfMaterials(id, 1);
  const raw = Object.entries(bom).reduce((a, [k, v]) => a + v * baseValue(k), 0);
  const out = baseValue(id);
  return { raw, out, ratio: raw > 0 ? out / raw : Infinity };
}

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

  const produce = (want, n, depth) => {
    if (n <= 1e-9 || depth > 32) return;
    const have = pool[want] ?? 0;
    const off = Math.min(have, n);
    if (off > 0) { pool[want] = have - off; use[want] = (use[want] ?? 0) + off; }
    let rem = n - off;
    if (rem <= 1e-9) return;
    const r = recipeFor(want);
    if (!r) { short[want] = (short[want] ?? 0) + rem; return; }
    const batches = rem * (1 + FAB.loss);
    for (const [k, per] of Object.entries(r.from)) produce(k, per * batches, depth + 1);
    steps.push({ id: want, qty: rem, kind: r.kind });
    ops += batches;
  };
  produce(id, qty, 0);

  const need = {};
  for (const [k, v] of Object.entries(short)) need[k] = Math.ceil(v * 100) / 100;

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

export function canFabAt(st, id = null) {
  if (!st || (st.hostile && !st.claimed)) return false;
  const sec = SECTORS[st.sector] ?? null;
  const services = sec?.services ?? [];
  const anything = services.includes("fabricate");
  if (!id) return anything || Object.keys(sec?.sells ?? {}).length > 0;
  if (anything) return true;
  return Boolean(sec?.sells && id in sec.sells);
}

export function fabMenuAt(st) {
  if (!st) return [];
  const out = [];
  for (const g of ALL_GOODS) {
    if (g.tier === "ore") continue;
    if (!canFabAt(st, g.id)) continue;
    const m = fabMargin(g.id);
    out.push({ id: g.id, name: g.name, tier: g.tier, value: g.value, ratio: m.ratio, raw: Math.round(m.raw) });
  }
  return out.sort((a, b) => b.ratio - a.ratio);
}

const state = {
  now: () => 0,
  stockAt: () => ({}),
  consume: () => {},
  deliver: () => {},
  pay: () => "no payer",
  log: () => {},
  skySeed: null,
  callsign: null,
};

export function fabQueueAt(stId) { return fabJobs.filter((j) => j.stId === stId); }
export function fabJobById(jid) { return fabJobs.find((j) => j.id === jid) ?? null; }

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

export function cancelFab(jid) {
  const i = fabJobs.findIndex((j) => j.id === jid);
  if (i < 0) return { ok: false, why: "No such job" };
  const [job] = fabJobs.splice(i, 1);
  for (const [k, v] of Object.entries(job.used ?? {})) state.deliver(job.stId, job.by, k, v);
  state.log(`${job.stName}: ${job.name} pulled off the line — materials back in the locker`, job);
  save();
  return { ok: true, job };
}

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

export function save() {
  try {
    globalThis.localStorage?.setItem(FAB_KEY(), JSON.stringify({ v: 1, seq, jobs: fabJobs }));
  } catch {}
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

export function wireFab(hooks = {}) {
  Object.assign(state, hooks);
  return state;
}

export default fabJobs;
