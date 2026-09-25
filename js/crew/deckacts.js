/* Living Galaxy — DECK ACTIONS: what a decision actually costs and buys.
 *
 * The deck graph (deckgraph.js) decides; this is the one place that says what
 * happens next. Every terminal in the graph has exactly one entry in ACTIONS,
 * and the verification suite fails if a graph action has no implementation or
 * an implementation has no node — the two cannot drift apart.
 *
 *   self     needs moved, 0..1, negative is relief
 *   vitals   morale for a person, condition for a machine
 *   trust    standing with the captain — work earns it, slacking spends it
 *   ship     the hull: wear, hull points, the drill and stow flags
 *   other    the person it was aimed at: rapport, morale
 *   eff(c)   0..1, how well this body does this thing
 *
 * Reductions are scaled by efficacy, costs are not: a tired hand pays the
 * same fatigue for a watch and gets less out of it.
 *
 */

import { firstName, rapportBetween } from "../crew.js";
import { cradle } from "../npc/cradle.js";
import { adjustMorale, adjustTrust } from "../family.js";
import { adjustRapport, tieBetween, makeRivals } from "./bonds.js";
import { diffOf } from "./journal.js";
import { learningBonus, houseSkills } from "./heritage.js";
import { sim } from "../sim.js";
import { moment, makePartners, bond, breakOff, privateNight, actOnJealousy, canPropose, canBond } from "./romance.js";

/* An ordinary evening is how most of it actually happens. These are the
 * everyday actions that also move a pair's spark, so a relationship grows out
 * of a shared watch and a game of cards rather than out of a dedicated
 * "romance" mode nobody would ever open. */
const EVERYDAY_MOMENT = {
  TALK_TO: "talk", SHARE_MEAL: "meal", PLAY_CARDS: "cards", VENT_TO: "vent",
  MEND_FENCES: "mend", HELP_OTHER: "confide", ARGUE: "row", GOSSIP: "talk",
  SIT_WITH: "confide", DRINK: "cards",
};

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** The nine needs, in the order the journal prints them. */
export const NEED_KEYS = ["fatigue", "hunger", "social", "stress", "intimacy", "play", "grievance", "purpose", "upkeep"];

/* ---- what actions actually do --------------------------------------------
 * Every terminal in the graph has exactly one entry here. `self` moves needs,
 * `vitals` moves morale or condition, `ship` moves the hull, `other` moves the
 * person it was aimed at. Efficacy scales the lot: a tired hand with the wrong
 * genes for the job still does the job, just not well.
 */
const A = (spec) => spec;
export const ACTIONS = {
  STAND_WATCH: A({ self: { fatigue: +0.12, purpose: -0.35 }, vitals: +0.5, eff: (c) => 0.4 + c.pheno.intellect * 0.3 + c.pheno.endurance * 0.3, ship: { wear: -0.01 } , trust: 0.25 }),
  PATCH_HULL: A({ self: { fatigue: +0.2, purpose: -0.4, upkeep: -0.5 }, vitals: +0.8, eff: (c) => 0.35 + c.body.apt.hullcraft * 0.65, ship: { wear: -0.16, hull: +1.4 }, mark: "clamps torqued and coolant topped" , trust: 0.3 }),
  DRILL: A({ self: { fatigue: +0.2, purpose: -0.35, stress: -0.05 }, vitals: +0.4, eff: (c) => 0.3 + c.body.apt.security * 0.7, ship: { drilled: true }, mark: "the passages were run under lights-out" , trust: 0.25 }),
  TREAT: A({ self: { fatigue: +0.1, purpose: -0.35 }, vitals: +0.6, eff: (c) => 0.3 + c.body.apt.firstAid * 0.7, allCrew: { morale: +1.2 }, mark: "sick call was held" , trust: 0.3 }),
  STOW: A({ self: { fatigue: +0.15, purpose: -0.3 }, vitals: +0.4, eff: (c) => 0.35 + c.body.apt.supplyChain * 0.65, ship: { stowed: true } , trust: 0.25 }),
  BOOK: A({ self: { fatigue: +0.08, purpose: -0.3 }, vitals: +0.3, eff: (c) => 0.3 + c.body.apt.commerce * 0.7 , trust: 0.25 }),
  SCAN_WATCH: A({ self: { fatigue: +0.1, purpose: -0.3 }, vitals: +0.4, eff: (c) => 0.3 + c.pheno.perception * 0.7 , trust: 0.25 }),
  PLOT: A({ self: { fatigue: +0.12, purpose: -0.35 }, vitals: +0.5, eff: (c) => 0.3 + c.body.apt.navigation * 0.7 , trust: 0.25 }),
  TEND: A({ self: { fatigue: +0.1, purpose: -0.3, hunger: -0.1 }, vitals: +0.5, eff: (c) => 0.3 + c.body.apt.agriculture * 0.7 , trust: 0.25 }),
  ASSAY: A({ self: { fatigue: +0.1, purpose: -0.4, curiosity: -0.2 }, vitals: +0.5, eff: (c) => 0.3 + c.body.apt.geology * 0.7 , trust: 0.25 }),
  WORK_LINE: A({ self: { fatigue: +0.2, purpose: -0.35 }, vitals: +0.4, eff: (c) => 0.3 + c.body.apt.heavyOps * 0.7 , trust: 0.25 }),
  COVER_SHIFT: A({ self: { fatigue: +0.3, purpose: -0.3 }, vitals: +0.2, eff: (c) => 0.3 + c.pheno.endurance * 0.7, ship: { wear: -0.05 }, note: (c) => `${firstName(c.m)} stood somebody else's watch as well as their own.` , trust: 0.6 }),
  SLACK_OFF: A({ self: { fatigue: -0.1, purpose: +0.15, stress: -0.1 }, vitals: -0.8, eff: () => 0.2, ship: { wear: +0.02 }, note: (c) => `${firstName(c.m)} was not where the board said they were.` , trust: -0.4 }),
  TINKER: A({ self: { fatigue: +0.12, purpose: -0.5, curiosity: -0.4 }, vitals: +1.2, eff: (c) => 0.3 + c.traits.curiosity * 0.4 + c.body.apt.precisionFab * 0.3, ship: { wear: -0.07 }, mark: "something that was not broken yet is now less likely to break" , trust: 0.3 }),
  MENTOR: A({ self: { fatigue: +0.12, purpose: -0.45, social: -0.3 }, vitals: +1.4, eff: (c) => 0.3 + c.pheno.intellect * 0.7, teach: true, note: (c) => `${firstName(c.m)} spent the watch showing a junior hand how it is done.` , trust: 0.45 }),

  BRACE: A({ self: { fatigue: +0.05, stress: +0.25 }, vitals: -0.5, eff: () => 0.6 }),
  MAN_GUNS: A({ self: { fatigue: +0.25, stress: +0.3, purpose: -0.5 }, vitals: +1, eff: (c) => 0.25 + c.body.apt.security * 0.45 + c.pheno.perception * 0.3 , trust: 0.5 }),
  REPEL_BOARDERS: A({ self: { fatigue: +0.4, stress: +0.45, purpose: -0.6 }, vitals: +1.6, eff: (c) => 0.2 + c.pheno.strength * 0.4 + c.body.apt.security * 0.4, boarders: true, note: (c) => `${firstName(c.m)} met them at the lock.` , trust: 0.8 }),
  EMERGENCY_PATCH: A({ self: { fatigue: +0.35, stress: +0.4, upkeep: -0.4 }, vitals: +2, eff: (c) => 0.2 + c.pheno.agility * 0.4 + c.body.apt.hullcraft * 0.4, ship: { hull: +3, wear: -0.08 }, mark: "a live breach was patched wet" , trust: 0.8 }),
  HELP_OTHER: A({ self: { fatigue: +0.2, stress: +0.2, social: -0.2 }, vitals: +1, eff: (c) => 0.3 + c.pheno.sociability * 0.7, other: { rapport: +14, morale: +4 }, note: (c) => `${firstName(c.m)} went back for ${firstName(c.focus?.m ?? { name: "somebody" })}.` , trust: 0.5 }),

  SLEEP: A({ self: { fatigue: -0.75, stress: -0.25 }, vitals: +1.5, eff: (c) => 0.4 + (c.body.genome[140] ?? 0.5) * 0.6 }),
  NAP: A({ self: { fatigue: -0.35, stress: -0.1 }, vitals: +0.5, eff: () => 0.5 }),
  EAT_MESS: A({ self: { hunger: -0.85, social: -0.1 }, vitals: +1, eff: () => 0.7 }),
  DRINK: A({ self: { stress: -0.4, social: -0.3, fatigue: +0.1 }, vitals: +1.5, eff: () => 0.6, risk: 0.2, note: (c) => `${firstName(c.m)} had a couple in the mess.` }),
  EXERCISE: A({ self: { fatigue: +0.15, stress: -0.3, play: -0.2 }, vitals: +1.2, eff: (c) => 0.3 + c.pheno.endurance * 0.7 }),
  GROOM: A({ self: { stress: -0.15 }, vitals: +0.6, eff: () => 0.8 }),

  TALK_TO: A({ self: { social: -0.55 }, vitals: +0.8, eff: (c) => 0.3 + c.pheno.sociability * 0.7, other: { rapport: +5, morale: +1 } }),
  SHARE_MEAL: A({ self: { social: -0.5, hunger: -0.7, intimacy: -0.15 }, vitals: +1.4, eff: () => 0.75, other: { rapport: +7, morale: +2 } }),
  PLAY_CARDS: A({ self: { social: -0.5, play: -0.7, stress: -0.2 }, vitals: +1.6, eff: () => 0.7, other: { rapport: +8, morale: +2 } }),
  VENT_TO: A({ self: { social: -0.4, stress: -0.55 }, vitals: +1.8, eff: (c) => 0.3 + c.pheno.sociability * 0.7, other: { rapport: +9, morale: -0.5 } }),
  GOSSIP: A({ self: { social: -0.4, play: -0.2 }, vitals: +0.5, eff: () => 0.5, other: { rapport: +4 }, gossip: true }),
  ARGUE: A({ self: { social: -0.2, stress: +0.2 }, vitals: -1.5, eff: (c) => 0.3 + c.pheno.temperament * 0.7, other: { rapport: -14, morale: -3 }, rivalry: true, note: (c) => `${firstName(c.m)} and ${firstName(c.focus?.m ?? { name: "somebody" })} had it out in front of the watch.` }),
  MEND_FENCES: A({ self: { social: -0.35, stress: -0.15 }, vitals: +1, eff: (c) => 0.25 + c.pheno.sociability * 0.5 + c.traits.loyalty * 0.25, other: { rapport: +16, morale: +2 }, heal: true, note: (c) => `${firstName(c.m)} made the first move toward ${firstName(c.focus?.m ?? { name: "a rival" })}.` }),
  AVOID: A({ self: { social: -0.1, stress: -0.05 }, vitals: -0.2, eff: () => 0.4 }),
  CONFRONT: A({ self: { grievance: -0.35, stress: -0.2, social: -0.2 }, vitals: -0.5, eff: (c) => 0.3 + c.pheno.dominanceRank * 0.7, trust: -2, ask: "grievance", note: (c) => `${firstName(c.m)} raised a grievance — wages, or the state of the hull.` }),
  ASK_CAPTAIN: A({ self: { social: -0.35, purpose: -0.2 }, vitals: +0.5, eff: (c) => 0.3 + c.pheno.sociability * 0.7, trust: +2, ask: "word", note: (c) => `${firstName(c.m)} wants a word with the captain.` }),
  SIT_WITH: A({ self: { intimacy: -0.7, social: -0.4, stress: -0.3 }, vitals: +2.4, eff: () => 0.8, other: { rapport: +10, morale: +4 } }),

  /* the ladder. Each of these moves crew/romance.js's spark for the pair as
   * well as the numbers here; applyAction routes them through `romance`. */
  NOTICE_THEM: A({ self: { intimacy: -0.1, social: -0.15 }, vitals: +0.8, eff: (c) => 0.4 + c.pheno.perception * 0.6, romance: "notice", other: { rapport: +4 } }),
  FLIRT: A({ self: { intimacy: -0.25, social: -0.3, play: -0.2 }, vitals: +1.4, eff: (c) => 0.3 + c.pheno.sociability * 0.7, romance: "flirt", other: { rapport: +7, morale: +2 } }),
  GIVE_GIFT: A({ self: { intimacy: -0.3, social: -0.2 }, vitals: +1.2, eff: (c) => 0.4 + c.pheno.sociability * 0.6, romance: "gift", other: { rapport: +9, morale: +3 }, cost: 40 }),
  WALK_OUT: A({ self: { intimacy: -0.45, social: -0.5, stress: -0.35, play: -0.4 }, vitals: +2.2, eff: () => 0.8, romance: "walkout", other: { rapport: +12, morale: +5 } }),
  CONFIDE: A({ self: { intimacy: -0.4, social: -0.5, stress: -0.4 }, vitals: +1.8, eff: (c) => 0.3 + c.pheno.sociability * 0.7, romance: "confide", other: { rapport: +11, morale: +3 }, trust: 1 }),
  PROPOSE: A({ self: { intimacy: -0.5, social: -0.3 }, vitals: +1.5, eff: (c) => 0.25 + c.pheno.dominanceRank * 0.45 + c.pheno.sociability * 0.3, romance: "propose" }),
  BOND: A({ self: { intimacy: -0.4, social: -0.4, stress: -0.3 }, vitals: +2, eff: () => 0.9, romance: "bond" }),
  PRIVATE_TIME: A({ self: { intimacy: -0.75, social: -0.4, stress: -0.45, fatigue: +0.1 }, vitals: +2.6, eff: () => 0.85, romance: "private" }),
  JEALOUS_WORDS: A({ self: { stress: +0.25, social: -0.15 }, vitals: -1.4, eff: (c) => 0.3 + c.pheno.temperament * 0.7, romance: "jealousy" }),
  BREAK_OFF: A({ self: { intimacy: +0.2, stress: +0.3 }, vitals: -2, eff: () => 0.6, romance: "breakoff" }),

  STUDY: A({ self: { purpose: -0.6, curiosity: -0.5, fatigue: +0.1 }, vitals: +1, eff: (c) => 0.25 + c.pheno.intellect * 0.5 + (c.body.genome[23] ?? 0.5) * 0.25, learn: true }),
  WRITE_HOME: A({ self: { social: -0.3, stress: -0.2, intimacy: -0.25 }, vitals: +1.2, eff: () => 0.7 }),
  BROOD: A({ self: { stress: +0.1, social: +0.05, intimacy: -0.12, purpose: -0.1 }, vitals: -1.2, eff: () => 0.3 , trust: -0.15 }),
  PLAN_EXIT: A({ self: { grievance: -0.1, stress: -0.1 }, vitals: -0.5, eff: (c) => 0.3 + c.traits.greed * 0.7, exit: true, note: (c) => `${firstName(c.m)} has been asking after berths on other hulls.` , trust: -0.3 }),
};

/* ---- consequences -------------------------------------------------------- */

/**
 * The ladder rungs. Each one moves the pair's spark (crew/romance.js) and, for
 * the three that are decisions rather than gestures, actually changes what the
 * two of them are to each other. `private` is a fade to black: it moves the
 * numbers and may start a pregnancy; it depicts nothing.
 */
function applyRomance(ctx, kind, efficacy, rng, out) {
  const m = ctx.m;
  const other = ctx.romance?.target ?? ctx.focus?.m ?? null;
  if (!other) return { blocked: true, blockedReason: "there was nobody there for it" };
  const name = other.name;
  switch (kind) {
    case "propose": {
      const can = canPropose(m, other);
      if (!can.ok) return { blocked: true, blockedReason: can.why, target: name };
      const res = makePartners(m, other);
      return { target: name, note: res.ok ? `${m.name} asked ${name}. ${name.split(" ")[0]} said yes.` : null, blocked: !res.ok, blockedReason: res.why };
    }
    case "bond": {
      const opts = { docked: ctx.ship.docked };
      const can = canBond(m, other, opts);
      if (!can.ok) return { blocked: true, blockedReason: can.why, target: name };
      bond(m, other, opts);
      return { target: name, note: `${m.name} and ${name} are bonded. The whole watch stood for it.` };
    }
    case "private": {
      const res = privateNight(m, other, rng);
      if (!res.ok) return { blocked: true, blockedReason: res.why, target: name };
      return { target: name, note: res.conceived ? `${res.carrier?.name} is expecting. ${res.sire?.name}'s.` : `${firstName(m)} and ${firstName(other)} took the evening behind a shut door.` };
    }
    case "breakoff": {
      breakOff(m, other);
      return { target: name };
    }
    case "jealousy": {
      const t = ctx.romance?.triangle;
      if (!t) return { blocked: true, blockedReason: "there was no triangle after all" };
      actOnJealousy(m, t.other ?? other, ctx.romance?.target ?? null);
      return { target: (t.other ?? other).name };
    }
    default: {
      moment(m, other, kind, 0.6 + efficacy * 0.6);
      return { target: name };
    }
  }
}

/**
 * Apply one decision. Mutates the member, the people in the room and the
 * hull, and reports exactly what moved so the record can be written from it.
 */
export function applyAction(ctx, id, spec, efficacy, rng, cycle = 0) {
  const { m, needs } = ctx;
  const out = { others: [], blocked: false, blockedReason: null, note: null, mark: null, targetName: null };

  for (const [k, d] of Object.entries(spec.self ?? {})) {
    if (!NEED_KEYS.includes(k)) continue;
    needs[k] = clamp01(needs[k] + d * (d < 0 ? 0.4 + efficacy * 0.6 : 1));
  }
  if (spec.vitals) {
    if (m.robot) m.condition = Math.max(0, Math.min(100, (m.condition ?? 100) + spec.vitals * efficacy));
    else adjustMorale(m, spec.vitals * (0.5 + efficacy * 0.5));
  }
  if (spec.trust) adjustTrust(m, spec.trust);

  const hull = ctx.hull;
  if (spec.ship) {
    if (spec.ship.wear != null) hull.addWear(spec.ship.wear * (spec.ship.wear < 0 ? efficacy : 1));
    if (spec.ship.hull != null) hull.repair(spec.ship.hull * efficacy);
    if (spec.ship.drilled) hull.flag("drilled");
    if (spec.ship.stowed) hull.flag("stowed");
  }
  if (spec.mark) out.mark = spec.mark;

  /* a rung of the ladder is always aimed at the person it is about, whatever
   * else was on this hand's mind when the watch started */
  const rt = ctx.romance?.target;
  const focus = spec.romance && rt
    ? { m: rt, id: rt.id, name: rt.name, tie: tieBetween(ctx.m, rt) }
    : ctx.focus;
  if (spec.other && focus?.m) {
    out.targetName = focus.name;
    const beforeR = rapportBetween(m, focus.m);
    const beforeM = focus.m.robot ? (focus.m.condition ?? 100) : (focus.m.morale ?? 70);
    const dR = Math.round(spec.other.rapport * (0.5 + efficacy * 0.5));
    adjustRapport(m, focus.m, dR);
    if (spec.other.morale) {
      if (focus.m.robot) focus.m.condition = Math.max(0, Math.min(100, (focus.m.condition ?? 100) + spec.other.morale));
      else adjustMorale(focus.m, spec.other.morale);
    }
    const afterR = rapportBetween(m, focus.m);
    const afterM = focus.m.robot ? (focus.m.condition ?? 100) : (focus.m.morale ?? 70);
    const changes = diffOf({ rapport: beforeR, morale: beforeM }, { rapport: afterR, morale: afterM }, 0.05);
    if (changes) out.others.push({ id: focus.id, name: focus.name, species: focus.m.raceId ?? "terran", relation: focus.tie ?? "shipmate", changes, killed: false });
  } else if (spec.other && !focus?.m) {
    out.blocked = true;
    out.blockedReason = "there was nobody there to say it to";
  }

  if (spec.allCrew) {
    for (const o of hull.roster) {
      if (o.id === m.id || o.robot) continue;
      const b = o.morale ?? 70;
      adjustMorale(o, spec.allCrew.morale * efficacy);
      const changes = diffOf({ morale: b }, { morale: o.morale }, 0.05);
      if (changes) out.others.push({ id: o.id, name: o.name, species: o.raceId ?? "terran", relation: tieBetween(m, o) ?? "shipmate", changes, killed: false });
    }
  }

  if (spec.rivalry && focus?.m && rng() < 0.45) { makeRivals(m, focus.m); }
  if (spec.heal && focus?.m) { adjustRapport(m, focus.m, 6); }
  if (spec.gossip) {
    for (const o of ctx.others) {
      if (!o.m || o.id === focus?.id) continue;
      adjustRapport(m, o.m, 2);
    }
  }
  if (spec.teach && ctx.others.length) {
    const pupil = ctx.others.find((o) => o.junior)?.m;
    if (pupil) {
      out.targetName = pupil.name;
      pupil.skills ??= {};
      const best = Object.entries(m.skills ?? {}).sort((a, b) => b[1] - a[1])[0];
      if (best) {
        const b = pupil.skills[best[0]] ?? 0;
        /* a pupil raised to this trade picks it up faster from anybody */
        pupil.skills[best[0]] = Math.min(100, b + Math.round((2 * efficacy + 1) * learningBonus(pupil, best[0])));
        const changes = diffOf({ [best[0]]: b }, { [best[0]]: pupil.skills[best[0]] }, 0.5);
        if (changes) out.others.push({ id: pupil.id, name: pupil.name, species: pupil.raceId ?? "terran", relation: "junior", changes, killed: false });
      }
      adjustRapport(m, pupil, 6);
    } else { out.blocked = true; out.blockedReason = "there was no junior hand to teach"; }
  }
  if (spec.learn) {
    m.skills ??= {};
    /* A person studies what their body is best at — weighted toward what their
     * house does, because that is the shelf the manuals are already on. */
    const house = new Set(houseSkills(m).slice(0, 4));
    const apt = Object.entries(ctx.body.apt)
      .map(([k, v]) => [k, v * (house.has(k) ? 1.5 : 1)])
      .sort((a, b) => b[1] - a[1]);
    /* 0.3.53: a hand the captain set to TRAIN studies that — and only as far
     * as their body lets them (js/crew/orders.js) */
    const focus = m.trainFocus && ctx.body.apt[m.trainFocus] != null ? m.trainFocus : null;
    const pick = focus ?? apt[Math.floor(rng() * Math.min(4, apt.length))]?.[0];
    if (pick) {
      const gain = (1 + efficacy * 2) * learningBonus(m, pick);
      const cap = focus ? Math.max(m.skills[pick] ?? 0, Math.round(ctx.body.apt[pick] * 100)) : 100;
      m.skills[pick] = Math.min(cap, (m.skills[pick] ?? 0) + Math.round(gain));
    }
  }
  if (!spec.romance && EVERYDAY_MOMENT[id] && focus?.m && !focus.m.robot && !ctx.m.robot) {
    moment(ctx.m, focus.m, EVERYDAY_MOMENT[id], 0.5 + efficacy * 0.7);
  }
  if (spec.romance) {
    const r = applyRomance(ctx, spec.romance, efficacy, rng, out);
    if (r) { out.blocked = out.blocked || r.blocked; out.blockedReason = out.blockedReason ?? r.blockedReason; if (r.note) out.note = r.note; if (r.target) out.targetName = r.target; }
  }
  if (spec.cost && ctx.hull.kind === "player" && (sim.ship?.credits ?? 0) >= spec.cost) sim.ship.credits -= spec.cost;
  if (spec.court && focus?.m) {
    out.targetName = focus.name;
    if (ctx.drawnToKin) { out.blocked = true; out.blockedReason = "they are blood, and both of them know it"; }
    else if (rapportBetween(m, focus.m) >= 55 && rng() < 0.4 && !m.partner && !focus.m.partner) {
      m.partner = focus.m.id; focus.m.partner = m.id;
      adjustMorale(m, 8); adjustMorale(focus.m, 8);
      out.note = `${m.name} and ${focus.name} have stopped pretending. It's official aboard.`;
      for (const [x, y] of [[m, focus.m], [focus.m, m]]) {
        const r = cradle.get(x.id);
        if (r) { r.partner = y.id; cradle.note(r.id, `Together with ${y.name} aboard ${hull.employer ?? "a ship"}`); }
      }
    }
  }
  const intruders = hull.intruders();
  if (spec.boarders && intruders.length) {
    const t = intruders[0];
    t.hp = Math.max(0, (t.hp ?? 10) - 4 * efficacy);
    if (t.hp <= 0) { intruders.shift(); out.note = `${firstName(m)} put one of them down.`; }
  }
  if (spec.risk && rng() < spec.risk * (1 - ctx.traits.caution)) {
    needs.stress = clamp01(needs.stress + 0.15);
    adjustMorale(m, -2);
    out.blocked = false;
    out.note = `${firstName(m)} had one too many and it showed on the next watch.`;
  }
  if (spec.ask) {
    m.wants = { kind: spec.ask, at: Date.now(), cycle, line: spec.ask === "grievance" ? "wages, or the state of the hull" : "something they will not put in the log" };
  }
  if (spec.exit) {
    m.lookingOn = (m.lookingOn ?? 0) + 1;
    const r = cradle.get(m.id);
    if (r && m.lookingOn === 2) cradle.note(r.id, `Started pricing berths off ${hull.employer ?? "a ship"}`);
  }

  if (!out.note && spec.note) out.note = spec.note(ctx);
  return out;
}

