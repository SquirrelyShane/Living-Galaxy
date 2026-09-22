/* LIVING GALAXY experimental — the neural core.
 *
 * A very small network that runs live beside the game and learns two ways:
 *
 *   1. Imitation. While you hold the conn, every few seconds the core looks at
 *      the world the way the captain would (`features()`), notes what you are
 *      doing (`labelFromPlay()`), and nudges its weights toward doing that in
 *      that situation. Fly cautious and it learns cautious.
 *   2. Outcome. While an NPC holds the conn, each decision is scored later
 *      by what happened to the ship — hull, credits, cargo, heat — and the
 *      weights move toward choices that paid and away from ones that hurt.
 *
 * It is not the whole captain. `captain.js` pairs it with a deterministic
 * forecaster (roll each candidate goal 60 s forward) and, optionally, a local
 * SLM through `provider` (see Docs/EXPERIMENTAL_NEURAL_CORE.md). The core is
 * the fast reflex; the forecaster is the arithmetic; the SLM is the voice.
 *
 * Plain arrays, no dependencies, serialises to JSON so it rides in the
 * CRADLE record of whoever it belongs to.
 */

export const ACTIONS = ["hold", "dock", "mine", "survey", "evade", "engage"];
export const N_FEATURES = 16;
const N_HIDDEN = 12;

/* The net underneath is not specific to flying a ship. an earlier build puts a second one
 * on the deck (js/crew/learn.js) over what a watch decides to do with itself,
 * so the shapes are parameters now rather than constants. A brain written
 * before this change has no `nf`/`nh`/`acts` on it and reads back as the
 * original 16 × 12 × 6 conn core, which is what it is. */
const shapeOf = (b) => ({ nf: b.nf ?? N_FEATURES, nh: b.nh ?? N_HIDDEN, acts: b.acts ?? ACTIONS });

function mulberry(seedStr) {
  let n = 0;
  for (let i = 0; i < seedStr.length; i++) n = Math.imul(n ^ seedStr.charCodeAt(i), 2654435761) >>> 0;
  let s = n || 7;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A fresh net of any shape, seeded so the same person starts with the same
 * instincts. `acts` is the label set; `nf`/`nh` the input and hidden widths.
 */
export function createNet({ acts = ACTIONS, nf = N_FEATURES, nh = N_HIDDEN, seed = "core", lr = 0.02, tag = "brain" } = {}) {
  const rnd = mulberry(`${tag}:${seed}`);
  const w = (n) => Array.from({ length: n }, () => (rnd() - 0.5) * 0.4);
  return {
    v: 1,
    seed,
    acts: acts.slice(),
    nf, nh,
    W1: w(nf * nh),
    b1: w(nh),
    W2: w(nh * acts.length),
    b2: new Array(acts.length).fill(0),
    steps: 0,
    outcomes: 0,
    lr,
  };
}

/** Fresh weights, seeded so the same person starts with the same instincts. Traits bias the output layer. */
export function createBrain(seed = "core", traits = {}) {
  const b = createNet({ seed });
  /* personality as prior: caution → evade/dock, greed → mine/engage, curiosity → survey */
  const t = traits ?? {};
  b.b2[ACTIONS.indexOf("evade")] += ((t.caution ?? 0.5) - 0.5) * 0.8;
  b.b2[ACTIONS.indexOf("dock")] += ((t.caution ?? 0.5) - 0.5) * 0.4;
  b.b2[ACTIONS.indexOf("mine")] += ((t.greed ?? 0.5) - 0.5) * 0.8;
  b.b2[ACTIONS.indexOf("engage")] += ((t.greed ?? 0.5) - 0.5) * 0.3 + ((t.grit ?? 0.5) - 0.5) * 0.5;
  b.b2[ACTIONS.indexOf("survey")] += ((t.curiosity ?? 0.5) - 0.5) * 0.9;
  return b;
}

function forward(b, x) {
  const { nf, nh, acts } = shapeOf(b);
  const h = new Array(nh);
  for (let j = 0; j < nh; j++) {
    let s = b.b1[j];
    for (let i = 0; i < nf; i++) s += x[i] * b.W1[i * nh + j];
    h[j] = Math.tanh(s);
  }
  const z = new Array(acts.length);
  for (let k = 0; k < acts.length; k++) {
    let s = b.b2[k];
    for (let j = 0; j < nh; j++) s += h[j] * b.W2[j * acts.length + k];
    z[k] = s;
  }
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const sum = e.reduce((a, v) => a + v, 0);
  return { h, p: e.map((v) => v / sum) };
}

/** Action probabilities for a feature vector, most likely first. */
export function think(b, x) {
  const { p } = forward(b, x);
  return shapeOf(b).acts.map((a, i) => ({ action: a, p: p[i] })).sort((u, v) => v.p - u.p);
}

/** One SGD step toward `label` (imitation) or scaled by `reward` (outcome, may be negative). */
function update(b, x, k, scale) {
  if (!x.every(Number.isFinite)) return; // a bad snapshot must never poison the weights
  const { nf, nh, acts } = shapeOf(b);
  const { h, p } = forward(b, x);
  const lr = b.lr * scale;
  /* dL/dz = p - onehot */
  const dz = p.map((v, i) => v - (i === k ? 1 : 0));
  const dh = new Array(nh).fill(0);
  for (let j = 0; j < nh; j++) {
    for (let i = 0; i < acts.length; i++) {
      dh[j] += dz[i] * b.W2[j * acts.length + i];
      b.W2[j * acts.length + i] -= lr * dz[i] * h[j];
    }
  }
  for (let i = 0; i < acts.length; i++) b.b2[i] -= lr * dz[i];
  for (let j = 0; j < nh; j++) {
    const g = dh[j] * (1 - h[j] * h[j]);
    for (let i = 0; i < nf; i++) b.W1[i * nh + j] -= lr * g * x[i];
    b.b1[j] -= lr * g;
  }
}

export function learnImitation(b, x, action) {
  const k = shapeOf(b).acts.indexOf(action);
  if (k < 0) return;
  update(b, x, k, 1);
  b.steps++;
}

/** reward in roughly [-1, 1]; positive pulls toward the action taken, negative pushes away. */
export function learnOutcome(b, x, action, reward) {
  const k = shapeOf(b).acts.indexOf(action);
  if (k < 0 || !reward) return;
  update(b, x, k, Math.max(-1, Math.min(1, reward)) * 0.6);
  b.outcomes++;
}

/* ---- the captain's view of the world ------------------------------------ */

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * 16 numbers in [0,1] (or [-1,1]) the core reasons over. Built from the
 * snapshot `captain.js` assembles: ship state, nearest port, threats, belt.
 */
export function features(s) {
  return [
    clamp01(s.hull / 100),
    clamp01(s.o2 / 100),
    clamp01(s.battery),
    clamp01(s.cargoFill),
    clamp01(s.heat),
    s.docked ? 1 : 0,
    s.port ? clamp01(1 - s.port.dist / 60000) : 0,
    s.port ? (s.port.hostile ? 1 : 0) : 0,
    s.port ? clamp01((s.port.standing + 100) / 200) : 0.5,
    clamp01(s.hostiles / 4),
    s.nearestHostile ? clamp01(1 - s.nearestHostile / 12000) : 0,
    s.inBelt ? 1 : 0,
    clamp01(s.rocks / 8),
    s.unsurveyed ? clamp01(1 - s.unsurveyed / 200000) : 0,
    clamp01(s.threatEta ? 1 - s.threatEta / 300 : 0),
    clamp01(s.credits / 20000),
  ];
}

/** What the player is doing right now, as one of ACTIONS — the imitation label. */
export function labelFromPlay(s) {
  if (s.docked || (s.port && s.port.dist < 900 && s.throttle > 0.05 && !s.port.hostile)) return "dock";
  if (s.firing && s.hostiles > 0) return "engage";
  if (s.hostiles > 0 && s.nearestHostile < 6000 && s.throttle > 0.4 && !s.firing) return "evade";
  if (s.mining) return "mine";
  if (s.warping || s.lockKind === "body") return "survey";
  return "hold";
}
