/* LIVING GALAXY — talking to the crew.
 *
 * family.crewTopics() is the base list (praise, bonus, court, settle…) and
 * stays as it was. Above it sits a tree of topic nodes (talk-trees.js) with
 * trust tiers, `when` gates, once/cooldown, and choices that carry
 * consequences — trust, morale, credits, rapport with a crewmate, a duty, a
 * flag the roster and later talks read back. Everything said is remembered
 * on the member (`m.memory`) and mirrored to the CRADLE record, so a hand who
 * walks and signs on again still knows what you promised. Contract: §4.2.
 */

import { crew, crewHooks, firstName, rapportBetween } from "../crew.js";
import { crewTopics, greetLine, adjustTrust, adjustMorale, familyOf } from "../family.js";
import { cradle, PRONOUNS } from "../npc/cradle.js";
import { sim, logEvent } from "../sim.js";
import { mission } from "../mission/run.js";
import { adjustRapport, makeRivals, tiesOf } from "./bonds.js";
import { setDuty, dutyOf, postKind } from "./roster.js";
import { TREE, ROBOT_TOPICS } from "./talk-trees.js";
import { WANT_TOPICS } from "./talk-wants.js";
import { THREADS } from "./talk-threads.js";
import { runHooks } from "./hooks.js";
import { duties } from "./duties.js";
import { line as voiceLine, wrap as voiceWrap } from "./voice.js";
import { FRIEND_TIERS, FRIEND_INDEX, MORALE_INDEX, friendTier, tierGate, tiersOf } from "./tiers.js";

export { TREE, ROBOT_TOPICS, WANT_TOPICS, THREADS };

/**
 * The tree's four gates, read off the six-rung friendship ladder.
 *
 * There were two vocabularies for the same number: this file's
 * stranger/hand/confidant/friend at 0/25/50/75, and nothing at all for morale.
 * js/crew/tiers.js is the one ladder now — wary → civil → shipmate → friend →
 * confidant → sworn — and a node's `tier: 0..3` names a rung on it, so the
 * gate the tree applies and the tier the crew sheet prints are the same thing.
 */
const TIER_RUNG = ["wary", "shipmate", "friend", "confidant"];
export const TIERS = TIER_RUNG.map((id) => FRIEND_TIERS[FRIEND_INDEX(id)].at);
export const TIER_NAMES = TIER_RUNG.map((id) => FRIEND_TIERS[FRIEND_INDEX(id)].label.toLowerCase());
const LOG_MAX = 12;

/** 0..3 from where they stand on the friendship ladder */
export function tierOf(m) {
  const at = FRIEND_INDEX(friendTier(m).id);
  let tier = 0;
  for (let i = 0; i < TIER_RUNG.length; i++) if (at >= FRIEND_INDEX(TIER_RUNG[i])) tier = i;
  return tier;
}

/** → { topics: {id: n}, flags: {}, lastTalk, log: [{ t, topic, choice?, line }], used: {id: cycle} } */
export function memoryOf(m) {
  if (!m) return { topics: {}, flags: {}, lastTalk: -1, log: [], used: {} };
  if (!m.memory) {
    const rec = cradle.get(m.id);
    m.memory = rec?.memory ? { topics: {}, flags: {}, lastTalk: -1, log: [], used: {}, ...rec.memory } : { topics: {}, flags: {}, lastTalk: -1, log: [], used: {} };
  }
  m.memory.used ??= {};
  return m.memory;
}

/** Wipe what a hand remembers (tests, a fresh sky). */
export function forgetTalk(m) {
  if (!m) return;
  m.memory = null;
  const rec = cradle.get(m.id);
  if (rec && rec.memory) { delete rec.memory; cradle.put(rec); }
}

function mirror(m) {
  const rec = cradle.get(m.id);
  if (rec) { rec.memory = m.memory; cradle.put(rec); }
}

/** Everything a node needs to speak: the hand, their people, the ship's day. */
export function talkContext(m, ctx = {}) {
  const t = m.traits ?? {};
  const partner = m.partner === "player" ? { id: "player", name: "the captain" } : m.partner ? crew.aboard.find((x) => x.id === m.partner) ?? null : null;
  return {
    f: firstName(m), t, pr: m.pronouns ?? PRONOUNS.nonbinary, rec: cradle.get(m.id),
    docked: Boolean(sim.ship?.dockedAt), partner, kids: familyOf(m).children, ties: tiesOf(m),
    mission: mission?.active ?? null, missionState: mission?.state ?? "idle",
    cycle: m.cyclesAboard ?? 0, time: sim.time ?? 0, memory: memoryOf(m), tier: tierOf(m),
    others: crew.aboard.filter((x) => x.id !== m.id), force: false, ...ctx,
  };
}

function gate(node, m, c) {
  if (c.force) return { ok: true };
  const mem = memoryOf(m);
  if ((node.tier ?? 0) > tierOf(m)) return { ok: false, why: `needs ${TIER_NAMES[node.tier]} · trust ${TIERS[node.tier]}` };
  /* the richer gate: a topic can also want a mood, or a rung on the romantic
   * ladder. A sullen hand has an answer, it is just not that answer. */
  if (node.need && !tierGate(m, node.need)) {
    const t = tiersOf(m);
    const want = node.need.morale && MORALE_INDEX(t.morale.id) < MORALE_INDEX(node.need.morale) ? `not while they are ${t.morale.label.toLowerCase()}`
      : node.need.romance ? "not where you two are" : `needs ${node.need.friend}`;
    return { ok: false, why: want };
  }
  if (node.when && !node.when(m, c)) return { ok: false, hidden: true };
  if (node.once && mem.topics[node.id]) return { ok: false, hidden: true };
  if (node.cooldown && mem.used[node.id] != null) {
    const left = node.cooldown - (c.cycle - mem.used[node.id]);
    if (left > 0) return { ok: false, why: `again in ${left} cycle${left === 1 ? "" : "s"}` };
  }
  return { ok: true };
}

/** The base list from family.js, each a tier-0 node whose say() is its run(). */
function baseNodes(m, c) {
  if (m.robot) return [];
  return crewTopics(m, c).map((tp) => ({ id: tp.id, label: tp.label, cls: tp.cls, tier: 0, base: true, say: () => tp.run() }));
}

/* What the hand brought to the captain comes first — a flagged grievance
 * should not be three taps down a list of small talk. */
/* 0.3.17: a conversation that is picking up where the last one left off
 * (talk-threads.js) comes right after anything they flagged themselves.
 *
 * And one id, one topic. family.js's "How's the watch?" and the WANT list's
 * "How's your watch been?" were both `watch`; the lookup found the WANT one
 * first, so tapping the family one ran the other — and when that one was
 * hidden or cooling down the tap answered with nothing. The base topic now
 * stands aside while the richer one is on the board, and comes back when it
 * is not. */
function allNodes(m, c) {
  if (m.robot) return ROBOT_TOPICS;
  const extra = runHooks("talkTopics", m, c).flat().filter(Boolean);
  const lead = [...WANT_TOPICS, ...THREADS];
  const live = new Set(lead.filter((n) => gate(n, m, c).ok).map((n) => n.id));
  const shadowed = new Set(lead.map((n) => n.id));
  const base = baseNodes(m, c).filter((n) => !live.has(n.id));
  const leadShown = lead.filter((n) => !(shadowed.has(n.id) && base.some((b) => b.id === n.id)));
  return [...leadShown, ...base, ...TREE, ...extra];
}

const labelOf = (n, m, c) => (typeof n.label === "function" ? n.label(m, c) : n.label);
const pub = (n, m, c) => ({ id: n.id, label: labelOf(n, m, c), cls: n.cls ?? "", tier: n.tier ?? 0, base: Boolean(n.base) });

/** Topics this hand will talk about right now (tier/when/once/cooldown applied). */
export function topicsFor(m, ctx = {}) {
  if (!m) return [];
  const c = talkContext(m, ctx);
  return allNodes(m, c).filter((n) => gate(n, m, c).ok).map((n) => pub(n, m, c));
}

/** Topics that exist but are shut for now, with the reason: [{ id, label, tier, why }]. */
export function lockedTopicsFor(m, ctx = {}) {
  if (!m) return [];
  const c = talkContext(m, ctx);
  const out = [];
  for (const n of allNodes(m, c)) {
    const g = gate(n, m, c);
    if (!g.ok && !g.hidden) out.push({ ...pub(n, m, c), why: g.why });
  }
  return out;
}

function nodeById(m, id, c) {
  return allNodes(m, c).find((n) => n.id === id) ?? null;
}

function normalise(res) {
  if (res == null) return { text: "", choices: [] };
  if (typeof res === "string") return { text: res, choices: [] };
  return { text: String(res.text ?? ""), choices: Array.isArray(res.choices) ? res.choices.filter(Boolean) : [] };
}

function remember(m, entry) {
  const mem = memoryOf(m);
  mem.log.push({ t: sim.time ?? 0, ...entry });
  if (mem.log.length > LOG_MAX) mem.log.splice(0, mem.log.length - LOG_MAX);
  mem.lastTalk = sim.time ?? 0;
  mirror(m);
}

/** Open a topic → { text, choices: [{ id, label, cls }] }. Records the topic in memory. */
export function open(m, topicId, ctx = {}) {
  if (!m) return { text: "", choices: [] };
  const c = talkContext(m, ctx);
  const node = nodeById(m, topicId, c);
  if (!node) return { text: "", choices: [] };
  const g = gate(node, m, c);
  if (!g.ok) return { text: g.why ? `(${c.f} is not ready for that — ${g.why}.)` : "", choices: [] };
  const res = normalise(node.say(m, c));
  const mem = memoryOf(m);
  mem.topics[topicId] = (mem.topics[topicId] ?? 0) + 1;
  mem.used[topicId] = c.cycle;
  if (node.remember) mem.topics[node.remember] = (mem.topics[node.remember] ?? 0) + 1;
  if (topicId === "chew") mem.flags.settledChew = false;
  mem.pending = res.choices.length ? { topic: topicId, choices: res.choices } : null;
  remember(m, { topic: topicId, label: labelOf(node, m, c), line: res.text });
  /* a settle or a dismissal took them off the deck: nothing more to say */
  if (!crew.aboard.includes(m)) mem.pending = null;
  return { text: res.text, choices: res.choices.map((ch) => ({ id: ch.id, label: ch.label, cls: ch.cls ?? "" })) };
}

/** Apply a choice's consequences. Returns null, or a line that refuses it. */
function applyFx(m, fx, c) {
  if (!fx) return null;
  if (fx.credits && fx.credits < 0 && (sim.ship?.credits ?? 0) < -fx.credits) return `${c.f}: "…with what, captain?"`;
  if (fx.credits) { sim.ship.credits += fx.credits; if (fx.credits < 0) logEvent(`${-fx.credits} cr to ${m.name}`, "crew"); }
  if (fx.trust) adjustTrust(m, fx.trust);
  if (fx.morale) adjustMorale(m, fx.morale);
  if (fx.partnerMorale && c.partner && c.partner.id !== "player") adjustMorale(c.partner, fx.partnerMorale);
  if (fx.rapport) {
    const withId = fx.rapport.with === "partner" ? m.partner : fx.rapport.with;
    if (withId && withId !== "player") adjustRapport(m, withId, fx.rapport.d);
  }
  if (fx.rival) makeRivals(m, fx.rival);
  if (fx.flag) { const mem = memoryOf(m); if (typeof fx.flag === "string") mem.flags[fx.flag] = true; else Object.assign(mem.flags, fx.flag); }
  if (fx.unflag) delete memoryOf(m).flags[fx.unflag];
  if ("duty" in fx) setDuty(m.id, fx.duty);
  if (fx.sameWatch && c.partner && c.partner.id !== "player") setDuty(c.partner.id, m.duty ?? postKind(dutyOf(m)));
  if (fx.wage && !m.robot) { m.wage = Math.max(20, Math.round((m.wage ?? 50) * fx.wage)); m.listWage = Math.max(m.listWage ?? 0, m.wage); }
  return null;
}

/** Pick a choice on an open topic → { text }. Applies its fx and records it. */
export function choose(m, topicId, choiceId, ctx = {}) {
  if (!m) return { text: "" };
  const c = talkContext(m, ctx);
  const mem = memoryOf(m);
  let choices = mem.pending?.topic === topicId ? mem.pending.choices : null;
  if (!choices) {
    const node = nodeById(m, topicId, c);
    if (!node) return { text: "" };
    choices = normalise(node.say(m, c)).choices;
  }
  const ch = choices.find((x) => x.id === choiceId);
  if (!ch) return { text: "" };
  const refused = applyFx(m, ch.fx, c);
  const node = nodeById(m, topicId, c);
  const raw = refused
    ? refused
    : (!ch.say && typeof node?.reply === "function")
      ? node.reply(m, choiceId, c)
      : (typeof ch.say === "function" ? ch.say(m, talkContext(m, ctx)) : ch.say);
  const next = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null;
  const text = next ? String(next.text ?? "") : String(raw ?? "");
  const follow = Array.isArray(next?.choices) ? next.choices.filter(Boolean) : [];
  mem.pending = follow.length ? { topic: topicId, choices: follow } : null;
  remember(m, { topic: topicId, choice: choiceId, label: ch.label, line: text });
  return {
    text: text || `${c.f} nods.`,
    choices: follow.map((x) => ({ id: x.id, label: x.label, cls: x.cls ?? "" })),
  };
}

/* ---- free text ------------------------------------------------------------ */

const FREE = [
  { re: /\b(pay|wage|credits?|money|bonus|cut|cr)\b/i, key: "pay" },
  { re: /\b(home|family|kids?|child|children|parents?|mother|father)\b/i, key: "home" },
  { re: /\b(hull|engine|reactor|coolant|clamp|ship|drive|warp)\b/i, key: "ship" },
  { re: /\b(pirates?|raid|board|danger|scared|afraid|fear|die|dead)\b/i, key: "danger" },
  { re: /\b(thanks?|thank you|cheers|appreciate)\b/i, key: "thanks" },
  { re: /\b(sorry|apolog)/i, key: "sorry" },
  { re: /\b(idiot|useless|stupid|shut up|worthless|lazy)\b/i, key: "insult" },
  { re: /\b(love|kiss|date|dinner|drink)\b/i, key: "romance" },
  { re: /\b(plan|mission|next|where|heading|course)\b/i, key: "plan" },
];

function hashN(s, n) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) % n;
}

/** A reply to anything typed, flavoured by trait and tier. Always a string. */
export function answerFreeText(m, text) {
  if (!m) return "";
  const c = talkContext(m);
  const said = String(text ?? "").trim();
  const f = c.f, t = c.t;
  if (!said) return `${f} waits.`;
  const key = FREE.find((x) => x.re.test(said))?.key ?? (said.endsWith("?") ? "question" : "other");
  const v = hashN(`${m.id}:${said}`, 3);
  let line;
  const seed = `${m.id}:${key}:${said}`;
  if (m.robot) {
    line = voiceLine("free_robot", seed, "Query parsed. No directive found.");
    if (key === "ship") line = `Wear is ${Math.round(duties.wear * 100)}%. Assign me to Engineering to reduce it.`;
    remember(m, { topic: "free", label: said, line });
    return `${f}: "${line}"`;
  }
  switch (key) {
    case "pay": line = voiceLine("free_pay", seed); break;
    case "home": line = c.rec?.origin ? `${c.rec.origin.replace(/^a /, "A ")} — that's home. Or was. ${voiceLine("free_home", seed)}` : voiceLine("free_home", seed, "Not much to tell."); break;
    case "ship": line = voiceLine("free_ship", seed); break;
    case "danger": line = voiceLine("free_danger", seed); break;
    case "thanks": adjustTrust(m, 1); line = voiceLine("free_thanks", seed); break;
    case "sorry": adjustTrust(m, 2); adjustMorale(m, 2); line = voiceLine("free_sorry", seed); break;
    case "insult": adjustTrust(m, -3); adjustMorale(m, -2); line = voiceLine("free_insult", seed); break;
    case "romance": line = m.partner === "player" ? voiceLine("free_romance", seed, "Not on the deck, captain.") : c.partner ? `I'm with ${firstName(c.partner)}, captain. You know that.` : voiceLine("free_romance", seed, "If that's an ask, ask it properly."); break;
    case "plan": line = c.mission ? `We're on ${c.mission.name ?? "the run"}. ${voiceLine("free_plan", seed)}` : voiceLine("free_plan", seed); break;
    case "question": line = voiceLine("free_question", seed + c.tier); break;
    default: line = voiceLine("free_other", seed, "Aye.");
  }
  remember(m, { topic: "free", label: said, line: `${f}: "${line}"` });
  return `${f}: "${line}"`;
}

/** A greeting that remembers the last thing you talked about. */
export function greet(m) {
  if (!m) return "";
  const base = greetLine(m);
  const mem = memoryOf(m);
  const last = [...mem.log].reverse().find((e) => e.topic !== "free" && e.label);
  const bits = [];
  if (last && (sim.time ?? 0) - (last.t ?? 0) > 60) bits.push(`Last time: "${last.label}".`);
  if (mem.flags.promised) bits.push(`${firstName(m)} said ${(m.pronouns ?? PRONOUNS.nonbinary).subj}'d stay on.`);
  if (mem.flags.adviceHeard) bits.push("You took their advice on the run.");
  /* 0.3.17: a thread waiting to be picked up is the first thing they'd raise */
  const c = talkContext(m);
  const waiting = THREADS.find((n) => gate(n, m, c).ok);
  if (waiting) bits.push(`${firstName(m)} has something to pick up from last time.`);
  return bits.length ? `${base} (${bits.join(" ")})` : base;
}

/** Last exchanges, newest last: [{ t, topic, label, choice?, line }]. */
export function talkLog(m, n = 6) {
  return memoryOf(m).log.slice(-n);
}

/* a promise kept keeps a floor under morale */
function tickTalkCycle() {
  for (const m of crew.aboard) {
    if (m.robot) continue;
    const flags = memoryOf(m).flags;
    if (flags.promised && (m.morale ?? 70) < 35) m.morale = 35;
  }
}
if (!crewHooks.cycle.includes(tickTalkCycle)) crewHooks.cycle.push(tickTalkCycle);

export { rapportBetween };
