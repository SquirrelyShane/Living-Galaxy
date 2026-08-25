// Living Galaxy — ARIA's reasoner. The tree she actually thinks with.
//
// ## What this replaces
//
// `autopilot.js` scored four tasks against a handful of thresholds and picked the winner.
// That is a needs model and it was the right first step, but it has a ceiling: a score is a
// single number, so a decision made from twelve inputs comes out the far side as "38" and
// there is no way to ask *why*. It also has no vocabulary for anything that is not a task —
// "vent before you shoot again", "stow the panels before you burn", "you cannot win this
// fight with this rack" are all decisions, and none of them is a place to fly to.
//
// ## The shape
//
// A tree of nodes. Each node carries a `when` — a list of comparisons against named facts
// from `facts.js` — and either a `then` branch of child nodes or a set of **directives**.
// Evaluation walks depth-first, takes the first child whose `when` holds, and accumulates
// directives on the way down. The deepest match wins, and everything above it still applies.
//
//     { id: 'threatened', when: [['threat.pressing', '>=', 1]],
//       then: [
//         { id: 'outgunned', when: [['weapon.sustain', '<', 6], ['hull.pct', '<=', 60]],
//           set: { posture: 'disengage', reason: 'we cannot hold this' } },
//         ...
//       ] }
//
// Comparators are `>`, `>=`, `<`, `<=`, `==`, `!=` and `between`. That is the entire
// language, deliberately: the moment a rule needs arbitrary code it stops being inspectable,
// and inspectable is the whole point.
//
// ## The trace is the product
//
// Every comparison that fires is recorded with the value it saw. So a decision comes back as
// "disengage — because weapon.sustain was 4.1 s (< 6) and hull.pct was 52 (<= 60)", and that
// sentence is what ARIA says when you ask her why. An assistant that can be argued with is
// worth ten that cannot.
//
// ## What it may and may not decide
//
// It emits **directives**, not actions. `posture`, `task`, `throttleCap`, `holdFire`,
// `vent`, `stowPanels`, `advise` — and `autopilot.js` decides what to do about them. The
// tree never touches the ship. That separation is what lets the whole thing be evaluated a
// hundred times in a test without a world under it.

import { read, FACTS } from './facts.js';

// ── the language ─────────────────────────────────────────────────────

export const OPS = {
  '>':  (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<':  (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  // Inclusive both ends. `['heat.pct','between',[40,80]]` reads better than two rules and
  // means the trace can report the band rather than half of it.
  'between': (a, b) => Array.isArray(b) && a >= b[0] && a <= b[1]
};

export const OP_KEYS = Object.keys(OPS);

/**
 * Test one comparison.
 *
 * A `null` reading never satisfies anything. That is the rule that makes an unknown fact
 * safe: a mistyped key produces a rule that declines rather than a rule that throws, and
 * the suite catches the typo separately by asserting every key exists.
 */
function test(rule, facts) {
  const [key, op, want] = rule;
  const fn = OPS[op];
  if (!fn) return { ok: false, key, op, want, got: null, bad: 'unknown operator' };
  const got = key in facts ? facts[key] : (facts[key] = read(key));
  if (got === null || got === undefined) {
    return { ok: false, key, op, want, got: null, bad: 'unknown fact' };
  }
  return { ok: fn(got, want), key, op, want, got };
}

/** All of them, or none — `when` is a conjunction. Or-ing is what sibling nodes are for. */
function testAll(when, facts, trace) {
  if (!when || !when.length) return true;
  const results = when.map(r => test(r, facts));
  const ok = results.every(r => r.ok);
  // Only a firing clause goes in the trace. A node that did not match is not part of the
  // explanation, and recording every miss would bury the reason in the near-misses.
  if (ok) for (const r of results) trace.push(r);
  return ok;
}

// ── the tree ─────────────────────────────────────────────────────────
//
// Ordered most urgent first at every level, because evaluation takes the first match. The
// ordering IS the priority: nothing weights or scores, a node higher in a sibling list
// simply matters more than one below it, which is far easier to reason about than a pile of
// tuned coefficients.

export const TREE = [

  // ── 0. the ship cannot fly ───────────────────────────────────────
  {
    id: 'disabled',
    when: [['hull.disabled', '==', 1]],
    set: { posture: 'adrift', task: null, holdFire: false,
           reason: 'the drives are out — nothing to fly with' }
  },

  // ── 1. installations that pin the ship in place ──────────────────
  //
  // Ahead of the fight, and that is not a mistake. A ship with its arrays out cannot
  // manoeuvre at all, so "should we be fighting" is not answerable until the answer to
  // "can we move" is yes. See `systems/industry/habitat.js`.
  {
    id: 'pinned',
    when: [['panels.state', '>=', 1]],
    then: [
      {
        id: 'pinned.threatened',
        when: [['threat.pressing', '>=', 1]],
        set: { posture: 'evade', stowPanels: true, holdFire: false, throttleCap: 0,
               urgent: true, reason: 'arrays are out and something is inside reach — stowing' }
      },
      {
        id: 'pinned.closing',
        when: [['threat.closing', '>=', 1], ['threat.tti', '<=', 90]],
        set: { posture: 'wary', stowPanels: true, throttleCap: 0,
               reason: 'something is closing while the arrays are out' }
      },
      {
        id: 'pinned.charging',
        when: [['panels.state', '==', 2], ['energy.pct', '<', 92]],
        set: { posture: 'hold', task: 'charge', throttleCap: 0,
               reason: 'arrays deployed and the bank is still filling' }
      },
      {
        id: 'pinned.full',
        when: [['panels.state', '==', 2], ['energy.pct', '>=', 92]],
        set: { posture: 'hold', stowPanels: true, throttleCap: 0,
               reason: 'bank is full — stowing the arrays' }
      },
      {
        id: 'pinned.moving',
        when: [['panels.state', '==', 1]],
        set: { posture: 'hold', throttleCap: 0,
               reason: 'arrays are in motion — the drive is locked out until they are home' }
      }
    ]
  },

  // ── 2. something is shooting ─────────────────────────────────────
  {
    id: 'contact',
    when: [['threat.count', '>=', 1]],
    then: [

      // Can we even fight? Asked before anything about how to fight.
      {
        id: 'contact.unarmed',
        when: [['weapon.count', '==', 0], ['threat.pressing', '>=', 1]],
        set: { posture: 'disengage', task: 'run', holdFire: true, urgent: true,
               advise: 'weapons',
               reason: 'nothing fitted to shoot back with' }
      },
      {
        id: 'contact.dry',
        when: [['ammo.dry', '==', 1], ['threat.pressing', '>=', 1]],
        set: { posture: 'disengage', task: 'service', holdFire: true, urgent: true,
               advise: 'ammunition',
               reason: 'the racks are empty' }
      },

      // Hurt. The order here is the order a pilot would use: how bad, then how many.
      {
        id: 'contact.critical',
        when: [['hull.pct', '<=', 28], ['threat.pressing', '>=', 1]],
        set: { posture: 'disengage', task: 'service', holdFire: true, urgent: true,
               throttleCap: 1, reason: 'the hull will not take another exchange' },
        then: [
          {
            id: 'contact.critical.cornered',
            when: [['threat.tti', '<=', 12]],
            set: { posture: 'evade', holdFire: false,
                   reason: 'hull is critical and it is already on top of us — fighting out' }
          }
        ]
      },
      {
        id: 'contact.outmatched',
        when: [['threat.outnumbered', '==', 1], ['hull.pct', '<=', 60]],
        set: { posture: 'disengage', task: 'run', urgent: true,
               reason: 'outnumbered and already hurt' }
      },
      {
        id: 'contact.nosustain',
        when: [['weapon.sustain', '<', 5], ['threat.pressing', '>=', 2]],
        set: { posture: 'disengage', task: 'run', advise: 'power',
               reason: 'the bank cannot feed this rack long enough to win' }
      },

      // Fighting, and how to fight well. All three of these are things a good pilot does
      // and no autopilot in this project could previously express.
      {
        id: 'contact.engage',
        when: [['threat.pressing', '>=', 1]],
        set: { posture: 'engage', task: null, reason: 'inside its reach — trading' },
        then: [
          {
            id: 'engage.cutout',
            when: [['heat.cutout', '==', 1]],
            set: { holdFire: true, vent: true, posture: 'evade',
                   reason: 'thermal cutout — the guns are offline until she cools' }
          },
          {
            id: 'engage.hot',
            when: [['heat.pct', '>=', 82]],
            set: { holdFire: true, vent: true,
                   reason: 'holding fire to stay under the cutout' }
          },
          {
            id: 'engage.thermal',
            when: [['heat.seconds', '<=', 3], ['heat.pct', '>=', 55]],
            set: { holdFire: true, vent: true,
                   reason: 'this rack will trip the cutout in seconds — pacing it' }
          },
          {
            id: 'engage.bank',
            when: [['energy.pct', '<=', 22], ['weapon.drain', '>', 0]],
            set: { holdFire: true, throttleCap: 0.4,
                   reason: 'bank is nearly out — saving what is left for the drive' }
          },
          {
            id: 'engage.shieldgap',
            when: [['shield.pct', '<=', 5], ['armor.pct', '<=', 30]],
            set: { posture: 'evade', throttleCap: 1,
                   reason: 'shields down and armour thin — breaking the solution' }
          }
        ]
      },

      // Contacts that exist but cannot reach us. Not a fight; a reason to be somewhere else.
      {
        id: 'contact.standoff',
        when: [['threat.closing', '>=', 1], ['threat.tti', '<=', 45]],
        set: { posture: 'wary', throttleCap: 0.7,
               reason: 'not in reach yet, but closing' }
      },
      {
        id: 'contact.distant',
        when: [],
        set: { posture: 'wary', reason: 'hostiles on the array, none committed' }
      }
    ]
  },

  // ── 3. our own hulls are being shot at ───────────────────────────
  {
    id: 'fleet.underfire',
    when: [['ours.underfire', '>=', 1]],
    set: { posture: 'wary', task: 'assist',
           reason: 'a hull we are paying for is under fire' }
  },

  // ── 4. nothing hostile: the state of the ship ────────────────────
  {
    id: 'quiet',
    when: [],
    then: [
      // ── a yard is only an answer if we can pay it ─────────────────
      //
      // The first version of this branch sent her to a berth whenever the hull was hurt or
      // the racks were dry, which is right about *what is wrong* and silent about whether
      // anything at a station could fix it. On a hull with eight hundred credits it produced
      // the loop this slice exists to end: dock, walk a checklist where every line is a
      // purchase, undock, re-score, conclude the hull still needs a yard, turn round.
      //
      // "We are short of money" is now a fact (`broke`), and it comes first — because when
      // it is true, *earning* is the task and everything else is a thing to do afterwards.
      {
        id: 'quiet.broke.mine',
        when: [['broke', '==', 1], ['cargo.free', '>', 50], ['field.nearest', '<', 40000]],
        set: { posture: 'cruise', task: 'mine',
               reason: 'we cannot buy our way out of this — going to cut some rock' }
      },
      {
        id: 'quiet.broke.hunt',
        when: [['broke', '==', 1], ['weapon.count', '>=', 1], ['ammo.dry', '==', 0],
               ['hull.pct', '>=', 55], ['threat.nearest', '<', 5200]],
        set: { posture: 'engage', task: 'hunt',
               reason: 'there is a price on something in range and we need the money' }
      },
      {
        id: 'quiet.broke.board',
        when: [['broke', '==', 1], ['contracts.held', '==', 0], ['berth.nearest', '<', 30000]],
        set: { posture: 'cruise', task: 'service',
               reason: 'nothing to cut and nothing to shoot — reading a board for paid work' }
      },
      {
        id: 'quiet.wrecked',
        when: [['hull.pct', '<=', 55], ['repair.affordable', '==', 1]],
        set: { posture: 'cruise', task: 'service', reason: 'the hull needs a yard' }
      },
      {
        id: 'quiet.dry',
        when: [['ammo.dry', '==', 1], ['broke', '==', 0]],
        set: { posture: 'cruise', task: 'service', reason: 'the racks are empty' }
      },
      {
        id: 'quiet.full',
        when: [['cargo.pct', '>=', 82]],
        set: { posture: 'cruise', task: 'sell', reason: 'the hold is full' }
      },
      {
        id: 'quiet.delivery',
        when: [['contracts.held', '>=', 1]],
        set: { posture: 'cruise', task: 'deliver', reason: 'we are carrying work' }
      },
      // Power before profit. A ship that mines itself flat is a ship that cannot warp home.
      {
        id: 'quiet.flat',
        when: [['energy.pct', '<=', 30], ['panels.state', '==', 0], ['threat.count', '==', 0]],
        set: { posture: 'hold', task: 'charge', deployPanels: true,
               reason: 'the bank is low and it is quiet — putting the arrays out' }
      },
      {
        id: 'quiet.hungry',
        when: [['crew.count', '>=', 1], ['farm.low', '==', 1]],
        set: { posture: 'cruise', task: 'service', advise: 'galley',
               reason: 'the galley is nearly out and the farm is not keeping up' }
      },
      {
        id: 'quiet.salvage',
        when: [['wreck.nearest', '<', 6000], ['cargo.pct', '<', 60]],
        set: { posture: 'cruise', task: 'salvage', reason: 'an unworked field within reach' }
      },
      {
        id: 'quiet.mine',
        when: [['cargo.free', '>', 50], ['field.nearest', '<', 40000]],
        set: { posture: 'cruise', task: 'mine', reason: 'the hold has room and there is rock' }
      },
      // ── the quiet is when she notices the fit ────────────────────
      //
      // Deliberately below every task: a bottleneck is worth mentioning when there is
      // nothing more pressing, and never mid-fight. `advisor.js` rate-limits on top of
      // this, so reaching one of these nodes is a request to raise a case, not a promise.
      {
        id: 'quiet.blind',
        when: [['sensor.tier', '==', 0], ['field.nearest', '>', 20000]],
        set: { posture: 'cruise', task: 'mine', advise: 'sensors',
               reason: 'we are hunting rock with the bare hull array' }
      },
      {
        id: 'quiet.thermal',
        when: [['weapon.count', '>=', 1], ['heat.seconds', '<=', 4]],
        set: { posture: 'cruise', task: 'service', advise: 'heat',
               reason: 'this rack cooks itself faster than it can shoot' }
      },
      {
        id: 'quiet.smallhold',
        when: [['cargo.pct', '>=', 95], ['field.nearest', '<', 8000]],
        set: { posture: 'cruise', task: 'sell', advise: 'cargo',
               reason: 'we fill up long before the field runs out' }
      },
      {
        id: 'quiet.idle',
        when: [],
        set: { posture: 'cruise', task: 'service', reason: 'nothing pressing — reading a board' }
      }
    ]
  }
];

// ── evaluation ───────────────────────────────────────────────────────

/** What a decision looks like before any node has spoken. */
function blank() {
  return {
    posture: 'cruise',
    task: null,
    holdFire: false,
    vent: false,
    urgent: false,
    throttleCap: null,
    deployPanels: false,
    stowPanels: false,
    advise: null,
    reason: 'no opinion',
    path: [],
    trace: []
  };
}

/**
 * Walk the tree.
 *
 * @param {Array} [tree] override, for the suite
 * @returns {object} the accumulated directives, the path of node ids that produced them,
 *   and the trace of every comparison that fired — with the value it actually saw.
 */
export function decide(tree) {
  const d = blank();
  const facts = {};                 // memoised per evaluation: `threat.level` walks the sweep
  walk(tree || TREE, d, facts);
  d.facts = facts;
  return d;
}

function walk(nodes, d, facts) {
  for (const node of nodes) {
    const before = d.trace.length;
    if (!testAll(node.when, facts, d.trace)) continue;

    d.path.push(node.id);
    if (node.set) {
      // A deeper node overrides a shallower one field by field, so a parent can set the
      // posture and a child can amend just the trigger discipline without restating it.
      for (const k in node.set) d[k] = node.set[k];
    }
    if (node.then) walk(node.then, d, facts);
    return true;                    // first match at this level wins — order is priority
  }
  return false;
}

// ── explaining it ────────────────────────────────────────────────────

const fmt = v => {
  if (v === Infinity) return '∞';
  if (typeof v !== 'number') return String(v);
  return Math.abs(v) >= 100 ? String(Math.round(v)) : (Math.round(v * 10) / 10).toString();
};

/**
 * The decision, as a sentence with its evidence in it.
 *
 * This is what makes the tree worth having over a scoring function: not that it decides
 * better, but that it can be disagreed with. "Disengage" is an order; "disengage, because
 * the bank feeds this rack for four seconds and we are at 52% hull" is an argument.
 */
export function explain(d = decide()) {
  if (!d.trace.length) return d.reason;
  const seen = new Set();
  const clauses = [];
  for (const t of d.trace) {
    if (seen.has(t.key)) continue;
    seen.add(t.key);
    const want = Array.isArray(t.want) ? `${fmt(t.want[0])}–${fmt(t.want[1])}` : fmt(t.want);
    clauses.push(`${t.key} ${fmt(t.got)} ${t.op} ${want}`);
  }
  return `${d.reason} (${clauses.slice(0, 4).join('; ')})`;
}

/** Every fact a rule anywhere in the tree mentions. `test/reasoner.mjs` asserts they exist. */
export function referencedFacts(tree = TREE, out = new Set()) {
  for (const node of tree) {
    for (const r of (node.when || [])) out.add(r[0]);
    if (node.then) referencedFacts(node.then, out);
  }
  return out;
}

/** Every node id, for the suite and for a coverage check. */
export function nodeIds(tree = TREE, out = []) {
  for (const node of tree) {
    out.push(node.id);
    if (node.then) nodeIds(node.then, out);
  }
  return out;
}

/** How big the tree is. Diagnostics, and a number worth watching. */
export function treeReport() {
  const ids = nodeIds();
  return {
    nodes: ids.length,
    facts: referencedFacts().size,
    available: Object.keys(FACTS).length,
    operators: OP_KEYS.length
  };
}
