/* Living Galaxy — the DECK BRAIN: a hand learning what works for them.
 *
 * `npc/brain.js` already taught an NPC captain how to fly, two ways: imitation
 * while you hold the conn, and outcome once they do. Nothing taught anybody
 * how to *live* on a ship. an earlier patch changed that by accident — deckmind writes a
 * full record of every decision, which is exactly a training pair: the
 * situation that was observed, the kind of thing that was done about it, and
 * what measurably happened next.
 *
 * So this is the same small net over a different question. Nine needs, morale,
 * the hull and the room, in; nine categories of thing-to-do, out. It is
 * trained purely by outcome, from the deltas the effect table actually
 * applied — not from a designer's opinion about what a good watch looks like.
 * A hand who found that arguing always went badly argues less. A hand who
 * found that a drink fixed the watch keeps drinking.
 *
 * It is a PRIOR, never a decision. The graph still decides; this only leans on
 * the weights, and only in proportion to how much the person has actually
 * lived through (`confidenceOf`). A brand-new hand behaves exactly as they did
 * earlier, because a net with no outcomes on it multiplies everything by one.
 *
 * The corpus it learns from is also the corpus a real model would want:
 * `trainingCorpus()` writes it out as JSONL for the llama.cpp side of the
 * house (`llamaCaptainProvider`, Docs/EXPERIMENTAL_NEURAL_CORE.md).
 *
 */

import { createNet, think, learnOutcome } from "../npc/brain.js";
import { cradle } from "../npc/cradle.js";

/** The categories the deck graph's actions fall into. Must cover ACTION_META. */
export const DECK_KINDS = ["duty", "care", "rest", "social", "mate", "study", "idle", "survival", "combat"];
export const N_DECK_FEATURES = 16;

/** How much lived experience before the prior is trusted completely. */
export const FULL_CONFIDENCE = 40;
/** The furthest a fully-trained prior may move an option's weight. */
export const PRIOR_SPAN = [0.55, 1.8];

const nets = new Map();     // member id → net
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const r4 = (v) => Math.round(v * 10000) / 10000;

/* ---- the net -------------------------------------------------------------- */

/** This hand's deck brain, restored from the ledger if they have one on file. */
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
    /* temperament as the starting prior: the same idea brain.js uses for the
     * conn, pointed at the deck. Nobody starts blank — they start themselves. */
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

/** 0..1 — how much this hand has actually lived through. */
export function confidenceOf(m) {
  const net = nets.get(m.id) ?? (cradle.get(m.id)?.deckBrain ?? m?.deckBrain);
  return clamp01((net?.outcomes ?? 0) / FULL_CONFIDENCE);
}

export function forgetBrain(id) { if (id) nets.delete(id); else nets.clear(); }

/* ---- what the net looks at ------------------------------------------------ */

/** 16 numbers in [0,1]. The situation, as a hand on a deck perceives it. */
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

/* ---- the prior ------------------------------------------------------------ */

/**
 * A multiplier for one option's weight, given what this hand has learned.
 * Uniform (1) until they have lived through something; never outside
 * PRIOR_SPAN, so a learned habit bends a decision and never makes it.
 */
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

/* ---- learning from what happened ------------------------------------------ */

/**
 * How well that went, roughly −1…1. Everything here comes off the record's own
 * deltas — the effect table's numbers, not a judgement about the action.
 *
 *   what it did to them          morale or condition, and relief on the need
 *                                that was loudest going in
 *   what it cost them            stress picked up
 *   what it did to the room      rapport moved, either way
 *   whether it worked at all     a blocked action is a small negative
 */
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
  /* standing with the captain is a real payoff to a hand, and it is the only
   * thing that makes a watch worth more than an hour in the mess */
  const st = rec.effectOnHoldings?.standing;
  if (st) v += (st.delta ?? 0) / 5;
  if (rec.action?.blocked) v -= 0.35;
  return Math.round(Math.max(-1, Math.min(1, v)) * 1000) / 1000;
}

/**
 * One training step from one filed record. Called by deckmind the moment the
 * record is written, so the pair is the situation that was actually observed
 * and the effect that was actually applied.
 */
export function learnFromRecord(ctx, rec) {
  if (!ctx?.m || !rec?.action?.kind) return 0;
  const net = brainOf(ctx.m);
  if (!net) return 0;
  const x = ctx._deckX ?? deckFeatures(ctx);
  const reward = scoreRecord(rec);
  /* Learn against the person's own running average, not against zero. Almost
   * everything a hand does on a good ship pays a little, so an uncentred
   * reward pushes every category up and the net stays flat and useless. What
   * matters is whether THIS went better than their days usually go. */
  net.mean = net.mean == null ? reward : net.mean + (reward - net.mean) * 0.06;
  const advantage = reward - net.mean;
  if (advantage) learnOutcome(net, x, rec.action.kind, advantage * 2.2);
  mirror(ctx.m, net);
  return reward;
}

/* Weights ride in the CRADLE record of whoever they belong to, the same way
 * the conn core does — but only for people who are actually on the ledger. A
 * provisional NPC hand's brain lives and dies with the run, which is the
 * right trade: it costs nothing and nobody will ever ask about it. */
function mirror(m, net) {
  const rec = cradle.get(m.id);
  if (!rec) { m.deckBrain = net; return; }
  if ((net.outcomes ?? 0) % 8) return;             /* not every step — this serialises */
  rec.deckBrain = {
    ...net,
    W1: net.W1.map(r4), b1: net.b1.map(r4),
    W2: net.W2.map(r4), b2: net.b2.map(r4),
  };
  cradle.put(rec);
}

/* ---- reading it back ------------------------------------------------------ */

/** [{ kind, p }] — what this hand has come to believe, most likely first. */
export function habitsLearned(m, ctx = null) {
  const net = brainOf(m);
  if (!net) return [];
  const x = ctx ? deckFeatures(ctx) : new Array(N_DECK_FEATURES).fill(0.4);
  return think(net, x).map((o) => ({ kind: o.action, p: Math.round(o.p * 1000) / 1000 }));
}

/** One line of it, for the crew sheet. */
export function learnedLine(m) {
  const conf = confidenceOf(m);
  if (conf < 0.1) return "Too new to have learned anything yet.";
  const top = habitsLearned(m)[0];
  const word = { duty: "works", care: "looks after people", rest: "rests", social: "talks", mate: "is with somebody", study: "studies", idle: "keeps out of the way", survival: "braces", combat: "fights" }[top.kind] ?? top.kind;
  return `Has learned that, left alone, ${word} — ${Math.round(conf * 100)}% settled.`;
}

/**
 * The whole corpus as JSONL, one filed decision per line. This is the shape a
 * local model wants: the observation, the label, the reward, and the sentence
 * a person would have written. Feed it to the llama.cpp side, or read it
 * yourself — it is the only honest account of what the crew have been doing.
 */
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

/** The same 16 numbers, recovered from a record rather than a live context. */
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
