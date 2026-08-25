// Living Galaxy — NPCs talking to each other.
//
// ── what was missing ─────────────────────────────────────────────────
// `systems/comms.js` is a *player-facing log*. `transmit()` appends to the panel the player
// reads, `inRange()` measures distance from the player, and every line an NPC has ever
// spoken was spoken at the player. Two ships a hundred kilometres apart with the player
// elsewhere in the system could not exchange a word, because there was no representation of
// a word passing between two characters.
//
// The memory layer was closer than it looked. `npc-avatar/core/memory.js` has always taken
// a fact as `{ type, subject, ... }` and its own comment says subject may be "a player id, a
// faction, **another NPC's id**". That clause has been true and unused since v1.00.30: every
// fact in this game had `subject: 'player'`. The data model could already hold "Kestrel 04
// owes me a favour" and nothing had ever written one.
//
// ── the constraint this file is built under ──────────────────────────
// The cheap version of NPC chat is a presentation feature: pick two ships in range, print a
// plausible line, done. That is a screensaver. An exchange counts here only if it **changes
// state that outlives it** — a memory on both sides, with the other character as the
// subject, so the second conversation between two ships is not the first one again.
//
// Everything below is in service of that: relationships are derived from those memories
// rather than stored in a parallel table, and the topic table declares what each side keeps.
//
// ── and it runs whether or not anyone is watching ────────────────────
// Propagation is by range between the two speakers, not by proximity to the player. The
// player *overhears* traffic that happens to be within their own comms range, on the
// channels that already exist — which is the v1.00.70 lesson applied: if the only evidence
// of a social layer is that the code has one, it is not in the game.

import { S } from '../core/state.js';
import { NPCCOMMS, AVATAR } from '../core/config.js';
import { stream } from '../core/rng.js';
import { personaFor, noteEvent } from './npc-brain.js';
import { wariness } from './npc-tactics.js';
import { transmit } from './comms.js';
import { recall } from '../npc-avatar/core/memory.js';
import { TOPICS, availableTopics, utter } from '../data/npc-topics.js';
import { propose, dealValue } from './deals.js';
import { COMMODITIES, DEALS } from '../core/config.js';
import { recordDialogue } from '../data/npc-kb/index.js';

/**
 * Turn a haul offer into a real obligation. The miner picks a destination and names a fee;
 * the hauler decides on its own terms whether that is worth flying.
 */
function offerHaul(a, b) {
  const stations = S.world.stations;
  if (!stations.length) return null;
  const dest = stations[Math.floor(roll() * stations.length)].userData.name;
  const kg = Math.round(400 + roll() * 1600);
  const spec = { kind: 'haul', commodity: 'ore', kg, dest };
  // The miner offers a shade over the acceptance floor, jittered — so some offers land and
  // some are refused, which is what makes the negotiation mean anything.
  spec.pay = Math.round(dealValue(spec) * (DEALS.baseBar * (0.85 + roll() * 0.55)));
  return propose(a, b, spec);
}

// `stream()` hands back an rng *object*, not a bare function — `.next()` is the draw.
//
// Fetch the stream per draw rather than caching it. Two reasons, both bugs that were live:
// caching meant any path into `exchange()` that did not come through the sweep drew from
// `Math.random()` instead of the world seed, and `seedWorld()` clears the stream table, so a
// cached object would keep generating from the *previous* world after a reseed. `stream()`
// is a Map lookup — this is the same shape orders.js and contracts.js already use.
const roll = () => stream('npc-comms').next();
let sweepT = 0;

const clock = () => (S.npcComms = S.npcComms || { pairs: {}, exchanges: 0 });

/** Stable key for an unordered pair, so a cooldown is a property of the pair. */
const pairKey = (a, b) => (a.name < b.name ? a.name + '\u0001' + b.name
                                           : b.name + '\u0001' + a.name);

// ── relationships ────────────────────────────────────────────────────

/**
 * What `a` knows about `b`, derived from `a`'s own memory rather than kept in a second
 * table.
 *
 * Deriving matters. A parallel relationship store would be a second source of truth that
 * has to be migrated, bounded and kept in step with the memory it duplicates — and the
 * persona table is already capped and already culls. Reading it out means a character that
 * forgets somebody forgets them completely, which is the honest behaviour for a bounded
 * memory.
 *
 *   exchanges  how many times a has filed anything about b
 *   warmth     favours and help, minus friction
 *   familiar   has this pair spoken at all
 */
export function relation(a, b) {
  const p = personaFor(a);
  const blank = { exchanges: 0, warmth: 0, familiar: false, facts: [] };
  if (!p || !b || !b.name) return blank;
  const facts = recall(p.memory, { subject: b.name }, 8, S.time, NPCCOMMS.memoryHalfLife);
  if (!facts.length) return blank;
  let warmth = 0;
  for (const f of facts) {
    const w = f.weight || 1;
    if (f.type === 'owed-favour' || f.type === 'was-asked-help') warmth += w;
    else if (f.type === 'owes-favour' || f.type === 'got-tip') warmth += w * 0.5;
    else if (f.type === 'traded-words') warmth -= w;
  }
  return {
    exchanges: facts.length,
    warmth,
    familiar: true,
    facts
  };
}

/** Has `a` filed a fact of this type about `b`? The gate several topics read. */
export function recallBetween(a, b, type) {
  const p = personaFor(a);
  if (!p || !b || !b.name) return false;
  return recall(p.memory, { type, subject: b.name }, 1, S.time, NPCCOMMS.memoryHalfLife).length > 0;
}

/** Everyone this character has an opinion about, for the mind panel and for tests. */
export function acquaintances(u) {
  const p = personaFor(u);
  if (!p) return [];
  const names = new Set();
  for (const f of p.memory.facts) if (f.subject && f.subject !== 'player') names.add(f.subject);
  return [...names];
}

// ── the exchange ─────────────────────────────────────────────────────

const ctxFor = () => ({
  warinessOf: wariness,
  gossipThreshold: NPCCOMMS.gossipThreshold,
  recallBetween
});

/**
 * Run one exchange between two characters. Returns the record, or null if nothing was
 * available or the pair is inside a cooldown.
 *
 * Order is deliberate: state first, then text. The memories are filed whether or not the
 * player is anywhere near enough to hear it, and the transmission is a *consequence* of the
 * exchange rather than the exchange itself. Building it the other way round is how you end
 * up with a system that only works when observed.
 */
export function exchange(an, bn, topicKey) {
  const a = an.userData, b = bn.userData;
  if (!a || !b || !a.name || !b.name || a === b) return null;
  if (a.hp <= 0 || b.hp <= 0) return null;

  const c = clock();
  const key = pairKey(a, b);
  const seen = c.pairs[key] || (c.pairs[key] = {});

  const ctx = ctxFor();
  const options = topicKey ? [topicKey] : availableTopics(a, b, ctx);
  const fresh = options.filter(k => S.time - (seen[k] || -1e9) >= TOPICS[k].cooldown);
  if (!fresh.length) return null;

  // Weighted pick from what is actually on the table.
  let total = 0;
  for (const k of fresh) total += TOPICS[k].weight || 1;
  let draw = roll() * total;
  let pick = fresh[fresh.length - 1];
  for (const k of fresh) { draw -= (TOPICS[k].weight || 1); if (draw <= 0) { pick = k; break; } }

  const topic = TOPICS[pick];
  seen[pick] = S.time;
  c.exchanges++;

  const rel = relation(a, b);
  const relBack = relation(b, a);

  // ── state first ──
  // `subject` defaults to the other character — that is the whole point of this layer —
  // but a topic may override it, which is how gossip about the player files against the
  // player rather than against the ship that carried it.
  file(a, b, topic.filesFrom);
  file(b, a, topic.filesTo);

  // ── then obligations ──
  // A topic that offers work puts it on the ledger. The listener may decline, in which case
  // the conversation still happened and both parties still remember it — a refusal is an
  // exchange, not a failed one.
  let deal = null;
  if (topic.offers === 'haul') deal = offerHaul(a, b);

  // ── then text ──
  // Both sides go through utter(), which prefers the generated path and falls back to a
  // topic's legacy `lines` if it still has them. Passing the seeded stream through means
  // the radio is reproducible: the same world says the same things in the same order.
  const rng = stream('npc-comms');
  const open = safeSay(pick, 0, { a, b, rel, rng });
  const back = safeSay(pick, 1, { a: b, b: a, rel: relBack, rng });

  const heard = overheard(an) || overheard(bn);
  if (heard) {
    if (open) transmit({ from: a.name, faction: a.faction, channel: topic.channel,
                         kind: 'chatter', speaker: a.name, text: open });
    if (back) transmit({ from: b.name, faction: b.faction, channel: topic.channel,
                         kind: 'chatter', speaker: b.name, text: back });
  }

  // High-detail diagnostic trail for ARIA / future self-training. Cheap, bounded.
  if (open) {
    recordDialogue(a.name, pick, `${a.name}: ${open}`, null, null, S.time);
  }
  if (back) {
    recordDialogue(b.name, pick + ':reply', `${b.name}: ${back}`, null, null, S.time);
  }

  return { topic: pick, from: a.name, to: b.name, channel: topic.channel,
           lines: [open, back], overheard: heard, deal };
}

function file(speaker, listener, spec) {
  if (!spec) return;
  noteEvent(speaker, {
    type: spec.type,
    // A topic may name its own subject — gossip about the player is filed against the
    // player, not against the ship that passed it on.
    subject: spec.subject || listener.name,
    weight: spec.weight || 1,
    meta: { via: listener.name }
  }, spec.drift ? { driftAxis: spec.drift, driftAmount: spec.driftAmount || 0.02 } : undefined);
}

function safeLine(fn, args) {
  if (typeof fn !== 'function') return null;
  try { return String(fn(args) || '').slice(0, 200); } catch (e) { return null; }
}

/** Is this ship close enough to the player for the player to pick it up? */
const overheard = n =>
  n.position.distanceToSquared(S.player.position) <= NPCCOMMS.overhearRange * NPCCOMMS.overhearRange;

// ── the sweep ────────────────────────────────────────────────────────

/**
 * Pick a pair and let them talk. Runs on a slow cadence over a bounded sample rather than
 * over every pair in the system: with sixty ships aboard there are seventeen hundred pairs,
 * and a social layer that costs O(n²) per frame is a social layer that gets deleted the
 * first time somebody profiles the game on a phone.
 */
export function updateNpcComms(dt) {
  sweepT += dt;
  if (sweepT < NPCCOMMS.sweepEvery) return 0;
  sweepT = 0;

  const npcs = S.world.npcs;
  if (npcs.length < 2) return 0;

  let ran = 0;
  for (let attempt = 0; attempt < NPCCOMMS.attemptsPerSweep; attempt++) {
    const an = npcs[Math.floor(roll() * npcs.length)];
    if (!an || an.userData.hp <= 0 || !an.userData.name) continue;

    // The partner is chosen from whoever is actually within radio reach of the *speaker*.
    const bn = nearestListener(an, npcs);
    if (!bn) continue;
    if (exchange(an, bn)) ran++;
    if (ran >= NPCCOMMS.maxPerSweep) break;
  }
  return ran;
}

function nearestListener(an, npcs) {
  const reach = NPCCOMMS.range * NPCCOMMS.range;
  let best = null, bd = reach;
  // Bounded scan from a random offset: over a long session every ship gets sampled, and no
  // single frame walks the whole population.
  const start = Math.floor(roll() * npcs.length);
  for (let i = 0; i < npcs.length && i < NPCCOMMS.scanCap; i++) {
    const o = npcs[(start + i) % npcs.length];
    if (o === an) continue;
    const ou = o.userData;
    if (!ou || ou.hp <= 0 || !ou.name) continue;
    const d = an.position.distanceToSquared(o.position);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}

export const npcCommsReport = () => {
  const c = clock();
  return { exchanges: c.exchanges, pairs: Object.keys(c.pairs).length };
};

// ── persistence ──────────────────────────────────────────────────────
// Only the pair cooldowns. Everything a character actually *knows* lives in its persona
// memory, which `npc-brain.js` already serialises — this is the transient bookkeeping that
// keeps two ships from repeating themselves, and an absent payload just means everybody is
// free to speak.
export const serializeNpcComms = () => ({ pairs: clock().pairs, exchanges: clock().exchanges });
export function restoreNpcComms(d) {
  S.npcComms = {
    pairs: (d && typeof d.pairs === 'object') ? d.pairs : {},
    exchanges: (d && d.exchanges) || 0
  };
  return true;
}


/**
 * Never let a bad clause in the topic table take the frame down. A silent exchange is a
 * missing line of chatter; a thrown exception is a stopped game.
 */
function safeSay(key, turn, ctx) {
  try { return utter(key, turn, ctx) || ''; } catch (e) { return ''; }
}
