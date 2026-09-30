import { createNet, think, learnOutcome } from "../npc/brain.js";
import { cradle } from "../npc/cradle.js";

export const DECK_KINDS = ["duty", "care", "rest", "social", "mate", "study", "idle", "survival", "combat"];
export const N_DECK_FEATURES = 16;

export const FULL_CONFIDENCE = 40;
export const PRIOR_SPAN = [0.55, 1.8];

const nets = new Map();
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const r4 = (v) => Math.round(v * 10000) / 10000;

export function brainOf(m) {
  if (!m?.id) return null;
  let net = nets.get(m.id);
  if (net) return net;
  const rec = cradle.get(m.id);
  const stored = rec?.deckBrain ?? m.deckBrain ?? null;
  if (stored?.W1?.length) {
    net = stored;
    net.acts ??= DECK_KINDS.slice();
    net.nf ??= N_DECK_FEATURES;
  } else {
    net = createNet({ acts: DECK_KINDS, nf: N_DECK_FEATURES, nh: 12, seed: m.id, tag: "deck", lr: 0.03 });
    const t = m.traits ?? {};
    const bias = (kind, v) => { const i = DECK_KINDS.indexOf(kind); if (i >= 0) net.b2[i] += v; };
    bias("duty", ((t.loyalty ?? 0.5) - 0.5) * 0.7);
    bias("idle", ((t.loyalty ?? 0.5) - 0.5) * -0.6);
    bias("social", ((t.curiosity ?? 0.5) - 0.5) * 0.5);
    bias("study", ((t.curiosity ?? 0.5) - 0.5) * 0.8);
    bias("rest", ((t.grit ?? 0.5) - 0.5) * -0.5);
    bias("combat", ((t.grit ?? 0.5) - 0.5) * 0.8);
  }
  nets.set(m.id, net);
  return net;
}

export function confidenceOf(m) {
  const net = nets.get(m.id) ?? (cradle.get(m.id)?.deckBrain ?? m?.deckBrain);
  return clamp01((net?.outcomes ?? 0) / FULL_CONFIDENCE);
}

export function forgetBrain(id) { if (id) nets.delete(id); else nets.clear(); }

export function deckFeatures(ctx) {
  const n = ctx.needs ?? {};
  const s = ctx.ship ?? {};
  return [
    clamp01(n.fatigue ?? 0), clamp01(n.hunger ?? 0), clamp01(n.social ?? 0),
    clamp01(n.stress ?? 0), clamp01(n.intimacy ?? 0), clamp01(n.play ?? 0),
    clamp01(n.grievance ?? 0), clamp01(n.purpose ?? 0), clamp01(n.upkeep ?? 0),
    clamp01((ctx.vitals?.health ?? 70) / 100),
    clamp01(s.wear ?? 0),
    clamp01((s.hull ?? 100) / 100),
    s.docked ? 1 : 0,
    s.alarm ? 1 : 0,
    clamp01((ctx.phase ?? 0) / 2),
    clamp01((ctx.others?.length ?? 0) / 4),
  ];
}

export function kindPrior(ctx, kind) {
  if (!kind || !ctx?.m) return 1;
  const conf = confidenceOf(ctx.m);
  if (conf <= 0) return 1;
  const net = brainOf(ctx.m);
  if (!net) return 1;
  let x = ctx._deckX;
  if (!x) { x = deckFeatures(ctx); ctx._deckX = x; }
  let ps = ctx._deckP;
  if (!ps) { ps = new Map(think(net, x).map((o) => [o.action, o.p])); ctx._deckP = ps; }
  const p = ps.get(kind);
  if (p == null) return 1;
  const raw = Math.max(PRIOR_SPAN[0], Math.min(PRIOR_SPAN[1], p * DECK_KINDS.length));
  return 1 + (raw - 1) * conf;
}

export function scoreRecord(rec) {
  if (!rec) return 0;
  const self = rec.effectOnSelf ?? {};
  const drive = rec.observedSelf?.dominantDrive;
  let v = 0;
  if (self.health) v += (self.health.delta ?? 0) / 4;
  if (drive && self[drive]) v += -(self[drive].delta ?? 0) * 1.2;
  if (self.stress) v -= Math.max(0, self.stress.delta ?? 0) * 1.5;
  for (const e of rec.effectOnOthers ?? []) {
    v += (e.changes?.rapport?.delta ?? 0) / 30;
    v += (e.changes?.morale?.delta ?? 0) / 40;
  }
  const st = rec.effectOnHoldings?.standing;
  if (st) v += (st.delta ?? 0) / 5;
  if (rec.action?.blocked) v -= 0.35;
  return Math.round(Math.max(-1, Math.min(1, v)) * 1000) / 1000;
}

export function learnFromRecord(ctx, rec) {
  if (!ctx?.m || !rec?.action?.kind) return 0;
  const net = brainOf(ctx.m);
  if (!net) return 0;
  const x = ctx._deckX ?? deckFeatures(ctx);
  const reward = scoreRecord(rec);
  net.mean = net.mean == null ? reward : net.mean + (reward - net.mean) * 0.06;
  const advantage = reward - net.mean;
  if (advantage) learnOutcome(net, x, rec.action.kind, advantage * 2.2);
  mirror(ctx.m, net);
  return reward;
}

export const COACH_STEPS = 4;
export function coach(m, ctx, kind, reward) {
  const net = brainOf(m);
  if (!net || !DECK_KINDS.includes(kind)) return false;
  const x = ctx?._deckX ?? deckFeatures(ctx);
  const at = net.outcomes ?? 0;
  for (let i = 0; i < COACH_STEPS; i++) learnOutcome(net, x, kind, reward);
  net.outcomes = at + 1;
  mirror(m, net, true);
  return true;
}

function mirror(m, net, force = false) {
  const rec = cradle.get(m.id);
  if (!rec) { m.deckBrain = net; return; }
  if (!force && (net.outcomes ?? 0) % 8) return;
  rec.deckBrain = {
    ...net,
    W1: net.W1.map(r4), b1: net.b1.map(r4),
    W2: net.W2.map(r4), b2: net.b2.map(r4),
  };
  cradle.put(rec);
}

export function habitsLearned(m, ctx = null) {
  const net = brainOf(m);
  if (!net) return [];
  const x = ctx ? deckFeatures(ctx) : new Array(N_DECK_FEATURES).fill(0.4);
  return think(net, x).map((o) => ({ kind: o.action, p: Math.round(o.p * 1000) / 1000 }));
}

export function learnedLine(m) {
  const conf = confidenceOf(m);
  if (conf < 0.1) return "Too new to have learned anything yet.";
  const top = habitsLearned(m)[0];
  const word = { duty: "works", care: "looks after people", rest: "rests", social: "talks", mate: "is with somebody", study: "studies", idle: "keeps out of the way", survival: "braces", combat: "fights" }[top.kind] ?? top.kind;
  return `Has learned that, left alone, ${word} — ${Math.round(conf * 100)}% settled.`;
}

export function trainingCorpus(records, { pretty = false } = {}) {
  const lines = [];
  for (const rec of records ?? []) {
    if (!rec?.action) continue;
    const row = {
      agent: rec.agent?.id,
      name: rec.agent?.name,
      cycle: rec.cycle,
      features: featuresFromRecord(rec),
      kind: rec.action.kind,
      action: rec.action.id,
      reward: Math.round(scoreRecord(rec) * 1000) / 1000,
      reasoning: rec.whatMadeMeActThis?.reasoning ?? [],
      summary: rec.summary,
    };
    lines.push(pretty ? JSON.stringify(row, null, 1) : JSON.stringify(row));
  }
  return lines.join("\n");
}

export function featuresFromRecord(rec) {
  const n = rec.observedSelf?.needs ?? {};
  const s = rec.observedSurroundings ?? {};
  const hs = s.hullState ?? {};
  return [
    clamp01(n.fatigue ?? 0), clamp01(n.hunger ?? 0), clamp01(n.social ?? 0),
    clamp01(n.stress ?? 0), clamp01(n.intimacy ?? 0), clamp01(n.play ?? 0),
    clamp01(n.grievance ?? 0), clamp01(n.purpose ?? 0), clamp01(n.upkeep ?? 0),
    clamp01((rec.observedSelf?.vitals?.health ?? 70) / 100),
    clamp01(hs.wear ?? 0),
    clamp01((hs.hull ?? 100) / 100),
    s.docked ? 1 : 0,
    s.alarm ? 1 : 0,
    clamp01(["on watch", "mess", "quarters"].indexOf(rec.observedSelf?.phase ?? "on watch") / 2),
    clamp01((s.present?.length ?? 0) / 4),
  ].map((v) => Math.round(v * 1000) / 1000);
}
