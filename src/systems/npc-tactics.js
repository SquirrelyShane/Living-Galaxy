// Living Galaxy — what an NPC decides to do about you.
//
// ── what was wrong ───────────────────────────────────────────────────
// `systems/npc-brain.js` has been filing memories since v1.00.30. It records that a ship
// watched you kill one of its own (`saw-kill-ours`), drifts that character's aggression and
// loyalty accordingly, and reads all of it back out when the ship *speaks* to you.
//
// Nothing in `entities/npcs.js` ever read a word of it. `acquire()` picked the nearest
// valid contact; `hunt()` flew the same envelope at the same target until one of them was
// dead. So the brain was a mouth: a pirate that had watched you destroy three of its
// faction charged you in exactly the same way as one that had never seen you before, and
// then made a pointed remark about it while dying.
//
// This file is where the memory becomes a decision.
//
// ── and the other asymmetry ──────────────────────────────────────────
// Ammunition (v1.00.60), thermal load (v1.00.60) and weapon groups (v1.00.70) all applied
// to the player only. An NPC gun platform could hold a trigger down forever, which meant a
// long fight was always won by whoever had more hull — there was no such thing as running
// somebody out of rounds, and no reason for an NPC to ever stop shooting.
//
// NPCs carry both budgets now. They are deliberately coarser than the player's — one
// magazine rather than per-feed, one heat pool rather than per-group — because an NPC does
// not have a fitting screen and a simulation that models what it cannot show is a
// simulation nobody can see. What matters is that the budgets exist, that they run out, and
// that running out is a *reason* rather than a silent stop.
//
// ── stances ──────────────────────────────────────────────────────────
// Four, and they are about distance and commitment rather than about targets:
//
//   press    — close and fight. The old behaviour, and still the common one.
//   hold     — fight at the edge of reach and refuse to be dragged in.
//   regroup  — break toward the nearest ally, still shooting if something is in reach.
//   flee     — disengage. Out of rounds, out of hull, or out of nerve.
//
// A stance is re-appraised on a slow cadence rather than every frame, because a ship that
// changes its mind sixty times a second is a ship that never does anything, and because a
// visible commitment is what makes an NPC read as having decided something.

import { S } from '../core/state.js';
import { NPCAI, AVATAR } from '../core/config.js';
import { personaFor } from './npc-brain.js';
import { recall } from '../npc-avatar/core/memory.js';

export const STANCES = ['press', 'hold', 'regroup', 'flee'];

/** Rounds and heat, seeded on first use so an existing save's ships arrive loaded. */
export function ordnanceOf(u) {
  if (u.rounds == null) u.rounds = magazineSize(u);
  if (u.heat == null) { u.heat = 0; u.hot = false; }
  return u;
}

/**
 * How deep an NPC's magazine is.
 *
 * Scaled off rate of fire rather than declared per hull type: a ship that fires four times
 * a second and one that fires once should both be able to hold a plausible engagement, and
 * tying the number to `pcool` means a new NPC type gets a sane magazine without anybody
 * remembering to add one. Fortifications are stationary emplacements sitting on a supply
 * line and do not run dry.
 */
export function magazineSize(u) {
  if (u.role === 'fort') return Infinity;
  const shotsPerSecond = 1 / Math.max(u.pcool || 1, 0.05);
  return Math.round(shotsPerSecond * NPCAI.magazineSeconds);
}

export const roundsLeft = u => (ordnanceOf(u).rounds);
export const magazineFraction = u => {
  const cap = magazineSize(u);
  return cap === Infinity ? 1 : Math.max(0, Math.min(1, roundsLeft(u) / cap));
};

/**
 * Spend a shot's worth of rounds and heat. Returns false when the ship physically cannot
 * fire — which is the signal `hunt()` uses, so a dry or overheated ship stops shooting
 * without anybody testing two separate conditions at the call site.
 */
export function spendShot(u) {
  ordnanceOf(u);
  if (u.hot) return false;
  if (u.rounds <= 0) return false;
  if (u.rounds !== Infinity) u.rounds--;
  u.heat += NPCAI.heatPerShot;
  if (u.heat >= NPCAI.heatCap) u.hot = true;
  return true;
}

/**
 * Heat bleeds off whether or not the ship is shooting, and the cutout clears at a lower
 * threshold than it set — the same hysteresis the player's emitters have, and for the same
 * reason: equal thresholds chatter the trigger on and off at the boundary.
 */
export function ventHeat(u, dt) {
  ordnanceOf(u);
  u.heat = Math.max(0, u.heat - NPCAI.heatVent * dt);
  if (u.hot && u.heat <= NPCAI.heatCap * NPCAI.heatResume) u.hot = false;
}

// ── what this character thinks of you ────────────────────────────────

/**
 * Wariness of the player, 0..1, read off this character's own memory.
 *
 * Every `saw-kill-ours` adds; a remembered trade or favour subtracts. This is the line that
 * makes the brain load-bearing: it is the same memory table the hail grammars read, used to
 * decide rather than to speak.
 *
 * Characters with no persona — anything unnamed, or spawned past the persona cap — return
 * 0, which is the honest answer: nobody is wary of somebody they have never met.
 */
export function wariness(u) {
  const p = personaFor(u);
  if (!p) return 0;
  const seen = recall(p.memory, { subject: 'player' }, 8, S.time, NPCAI.memoryHalfLife);
  let w = 0;
  for (const f of seen) {
    if (f.type === 'saw-kill-ours') w += NPCAI.warinessPerKill * (f.weight || 1);
    else if (f.type === 'saw-kill-theirs') w -= NPCAI.warinessPerFavour;
    else if (f.type === 'traded') w -= NPCAI.warinessPerFavour * 0.5;
  }
  return Math.max(0, Math.min(1, w));
}

/** Has this character personally got a reason to come looking for you? */
export const holdsGrudge = u => wariness(u) >= NPCAI.grudgeThreshold;

/**
 * Nerve: how much punishment this character will take before it stops being brave.
 *
 * Traits are the whole point. A high-aggression pirate presses an attack a cautious hauler
 * would have run from twenty seconds earlier, so two ships in identical hulls at identical
 * hull fractions can make opposite calls — which is the difference between a faction and a
 * spawn table.
 */
export function nerve(u) {
  const p = personaFor(u);
  const aggression = p ? p.traits.aggression : 0.5;
  const loyalty = p ? p.traits.loyalty : 0.5;
  return NPCAI.baseNerve + aggression * NPCAI.nerveFromAggression
                         + loyalty * NPCAI.nerveFromLoyalty;
}

// ── support ──────────────────────────────────────────────────────────

/** Friendly hulls within call range, and the nearest one's position. */
export function support(n, u) {
  let count = 0, nearest = null, nd = Infinity;
  for (const o of S.world.npcs) {
    const ou = o.userData;
    if (o === n || ou.hp <= 0 || ou.faction !== u.faction) continue;
    const d = n.position.distanceToSquared(o.position);
    if (d > NPCAI.callRange * NPCAI.callRange) continue;
    count++;
    if (d < nd) { nd = d; nearest = o; }
  }
  return { count, nearest };
}

/**
 * Shout for help. Everyone of the same faction in call range who is not already busy
 * switches to whatever is shooting at the caller.
 *
 * This is the cheapest thing in this file and probably the one a player notices most: it is
 * the difference between picking off a patrol one at a time and having a patrol arrive.
 */
export function callForHelp(n, u, threat) {
  if (!threat) return 0;
  if (S.time - (u.lastCall || -99) < NPCAI.callCooldown) return 0;
  u.lastCall = S.time;
  let answered = 0;
  for (const o of S.world.npcs) {
    const ou = o.userData;
    if (o === n || ou.hp <= 0 || ou.faction !== u.faction) continue;
    if (ou.role === 'fort') continue;              // emplacements do not come running
    if (n.position.distanceToSquared(o.position) > NPCAI.callRange * NPCAI.callRange) continue;
    if (ou.target && ou.target.isPlayer) continue; // already on it
    ou.target = threat;
    ou.stance = 'press';
    ou.stanceAt = S.time;
    answered++;
    if (answered >= NPCAI.maxAnswerCall) break;
  }
  return answered;
}

// ── the decision ─────────────────────────────────────────────────────

/**
 * Re-appraise this ship's stance. Called on a cadence from `updateNpcs`, not per frame.
 *
 * The order of these tests is the design. Physical facts first — no rounds, no hull — then
 * nerve, then the social read. A ship out of ammunition does not need an opinion about you
 * to know it should leave.
 */
export function appraise(n, u, dt) {
  ordnanceOf(u);
  ventHeat(u, dt);

  // Emplacements and working roles have no tactical life: a mining barge is not deciding
  // whether to press an attack, it is deciding whether to keep cutting.
  if (u.role === 'fort') { u.stance = 'press'; return u.stance; }

  if (S.time - (u.stanceAt || -99) < NPCAI.appraiseEvery) return u.stance || 'press';
  u.stanceAt = S.time;

  const hullFrac = u.hp / Math.max(1, u.maxHp);
  const mag = magazineFraction(u);
  const { count } = support(n, u);

  // Out of rounds is not a mood. Nothing else in here can override it, because a ship with
  // an empty magazine has nothing to contribute to a fight it stays in.
  if (mag <= 0) return (u.stance = 'flee');

  // Nerve is spent by damage and refunded by company. A lone ship breaks earlier than the
  // same ship in a group, which is what makes numbers matter beyond raw damage output.
  const courage = nerve(u) + Math.min(count, NPCAI.supportCap) * NPCAI.nervePerAlly;
  if (hullFrac < NPCAI.fleeHull * (1 - courage * NPCAI.courageScale)) {
    return (u.stance = count > 0 ? 'regroup' : 'flee');
  }

  // Low on rounds: stop trading shots at close range and make the ones left count.
  if (mag <= NPCAI.conserveMagazine) return (u.stance = 'hold');

  // The social read, and the only place the persona's memory of *you* changes the plan.
  // A character who has watched you kill its own does not walk into your guns alone; it
  // holds off and waits for company. With company, the grudge is why it comes at all.
  if (u.target && u.target.isPlayer && holdsGrudge(u)) {
    return (u.stance = count >= NPCAI.grudgeSupport ? 'press' : 'hold');
  }

  return (u.stance = 'press');
}

/**
 * The engagement band multiplier for the current stance, applied on top of the hull's own
 * `ENGAGE` profile. `press` is 1 — the profile unchanged — so a ship that has decided
 * nothing behaves exactly as it did before this slice.
 */
export const bandScale = u => NPCAI.bandScale[u.stance] || 1;

export const isDisengaging = u => u.stance === 'flee' || u.stance === 'regroup';
