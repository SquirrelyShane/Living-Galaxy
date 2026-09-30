import { crew, firstName, rapportBetween } from "./ledger.js";
import { sim } from "../sim/sim.js";
import { deckmind, buildContext, stepHand, bodyOf } from "./deckmind.js";
import { NEED_KEYS } from "./deckacts.js";
import { tieBetween } from "./bonds.js";
import { ACTION_META } from "./deckgraph.js";
import { playerHull } from "./hull.js";
import { adjustMorale, adjustTrust } from "./family.js";
import { coach, DECK_KINDS } from "./learn.js";
import { SKILLS } from "../careers/skills.js";

const NEED_WORD = {
  fatigue: "Tiredness", hunger: "Hunger", social: "Company", stress: "Strain", intimacy: "Closeness",
  play: "Something to do", grievance: "Grievance", purpose: "Purpose", upkeep: "Work outstanding",
};

export const ORDER = {
  shoreLeave: 60,
  hearTrust: [1, 3],
};

const aboard = (id) => crew.aboard.find((x) => x.id === id) ?? null;

function bestMate(m) {
  let best = null, v = -1e9;
  for (const o of crew.aboard) {
    if (o.id === m.id || o.robot) continue;
    const r = rapportBetween(m, o);
    if (r > v) { v = r; best = o; }
  }
  return best;
}

export function grievanceCauses(m) {
  const st = playerHull().state();
  const out = [];
  if (st.shortfall) out.push("wages owed");
  if ((m.morale ?? 70) < 35) out.push("morale on the floor");
  if ((st.wear ?? 0) > 0.6) out.push("a hull nobody is keeping up");
  const rival = (m.ties ?? []).find((t) => t.kind === "rival");
  if (rival) out.push(`a rival aboard${aboard(rival.id) ? ` (${firstName(aboard(rival.id))})` : ""}`);
  if (m.heardAt != null && deckmind.cycle - m.heardAt < 5) out.push("heard — it weighs less for now");
  return out;
}

export function orderFor(m, need) {
  const docked = Boolean(sim.ship?.dockedAt);
  const partner = m.partner ? aboard(m.partner) : null;
  const mate = bestMate(m);
  const base = (() => {
    switch (need) {
      case "fatigue": return { id: "rest", label: "STAND DOWN", action: "SLEEP", hint: "off the rota to sleep it off" };
      case "hunger": return { id: "mess", label: "MESS CALL", action: "EAT_MESS", hint: "a proper meal, now" };
      case "social": return { id: "company", label: "SHARE A MEAL", action: "SHARE_MEAL", focus: mate, hint: mate ? `with ${firstName(mate)}` : "on their own, if nobody else is aboard" };
      case "stress": return docked
        ? { id: "leave", label: "SHORE LEAVE", custom: "leave", hint: `${ORDER.shoreLeave} cr · a night off the hull` }
        : { id: "ease", label: "EASE OFF", action: "EXERCISE", hint: "the gym, not the post" };
      case "intimacy": return partner
        ? { id: "close", label: `TIME WITH ${firstName(partner).toUpperCase()}`, action: "SIT_WITH", focus: partner, hint: "the two of them, off the rota" }
        : { id: "home", label: "WRITE HOME", action: "WRITE_HOME", hint: "nobody aboard to be close to — a letter" };
      case "play": return { id: "rec", label: "REC TIME", action: "PLAY_CARDS", focus: mate, hint: mate ? `cards with ${firstName(mate)}` : "cards" };
      case "grievance": return { id: "hear", label: "HEAR THEM OUT", custom: "hear", hint: grievanceCauses(m).join(" · ") || "nothing on their mind" };
      case "purpose": return { id: "goal", label: "GIVE A GOAL", action: "STUDY", hint: m.trainFocus ? `study ${SKILLS[m.trainFocus]?.name ?? m.trainFocus}` : "set a skill to TRAIN — or they choose" };
      case "upkeep": return { id: "backlog", label: "CLEAR THE BACKLOG", action: "PATCH_HULL", hint: "the maintenance list, now" };
      default: return null;
    }
  })();
  if (!base) return null;
  let why = null;
  if (m.robot && need !== "upkeep") why = "a frame does not need that";
  else if (m.orderCycle === deckmind.cycle) why = "already given an order this watch";
  else if (base.custom === "leave" && (sim.ship?.credits ?? 0) < ORDER.shoreLeave) why = `shore leave is ${ORDER.shoreLeave} cr`;
  else if (base.custom === "hear" && m.heardAt != null && deckmind.cycle - m.heardAt < 2) why = "you heard them out a watch ago";
  return { need, ...base, why };
}

export function ordersFor(m) { return NEED_KEYS.map((k) => orderFor(m, k)).filter(Boolean); }

function focusEntry(m, o) {
  return { id: o.id, name: o.name, m: o, tie: tieBetween(m, o), rapport: rapportBetween(m, o), samePost: false, junior: (o.cyclesAboard ?? 0) < 3, drawn: false };
}

export function giveOrder(m, need) {
  if (!m || !crew.aboard.includes(m)) return { ok: false, why: "not aboard" };
  const o = orderFor(m, need);
  if (!o) return { ok: false, why: "no such order" };
  if (o.why) return { ok: false, why: o.why };
  const first = firstName(m);
  if (o.custom === "hear") {
    const causes = grievanceCauses(m).filter((c) => !/^heard/.test(c));
    m.heardAt = deckmind.cycle;
    m.orderCycle = deckmind.cycle;
    const loyal = m.traits?.loyalty ?? 0.5;
    adjustTrust(m, ORDER.hearTrust[0] + (ORDER.hearTrust[1] - ORDER.hearTrust[0]) * loyal);
    adjustMorale(m, 2);
    buildContext(m, { peek: true });
    const line = causes.length
      ? `${first} tells you: ${causes[0]}${causes.length > 1 ? `, and ${causes.slice(1).join(", ")}` : ""}. It helps that you asked.`
      : `${first} shrugs. Nothing specific — it helps that you asked.`;
    return { ok: true, line };
  }
  if (o.custom === "leave") {
    sim.ship.credits -= ORDER.shoreLeave;
    const n = m.need ?? {};
    n.stress = Math.max(0, (n.stress ?? 0.25) - 0.6);
    n.play = Math.max(0, (n.play ?? 0.25) - 0.35);
    n.social = Math.max(0, (n.social ?? 0.25) - 0.3);
    n.fatigue = Math.min(1, (n.fatigue ?? 0.25) + 0.05);
    adjustMorale(m, 4);
    m.orderCycle = deckmind.cycle;
    return { ok: true, line: `${first} took a night ashore. Came back lighter.` };
  }
  const ctx = buildContext(m, { peek: true });
  const focusM = o.focus && o.focus !== m ? o.focus : null;
  if (focusM) { ctx.focus = focusEntry(m, focusM); ctx.focusName = focusM.name; }
  if (o.action === "SIT_WITH" && focusM) ctx.partnerAboard = true;
  const v0 = m.need?.[need] ?? 0;
  const rec = stepHand(m, { ctx, order: { action: o.action, why: `the captain's orders — ${o.label.toLowerCase()}` } });
  m.orderCycle = deckmind.cycle;
  const v1 = m.need?.[need] ?? 0;
  const did = ACTION_META[o.action]?.label ?? o.label.toLowerCase();
  const line = rec?.action?.blocked
    ? `${first} could not — ${rec.action.blockedReason}.`
    : `${first} ${did}${rec?.action?.targetName ? ` with ${rec.action.targetName.split(" ")[0]}` : ""}, on your orders. ${NEED_WORD[need]} ${v0.toFixed(2)} → ${v1.toFixed(2)}.`;
  return { ok: true, rec, line };
}

export function ceilingOf(m, skill) {
  const b = bodyOf(m);
  return Math.round((b?.apt?.[skill] ?? 0) * 100);
}

export function setTraining(m, skill) {
  if (!m) return null;
  m.trainFocus = skill && m.trainFocus !== skill && (SKILLS[skill] || bodyOf(m)?.apt?.[skill] != null) ? skill : null;
  return m.trainFocus;
}

export function coachHabit(m, kind, sign) {
  if (!m || !DECK_KINDS.includes(kind)) return { ok: false, why: "no such habit" };
  m.coached ??= {};
  if (m.coached[kind] === deckmind.cycle) return { ok: false, why: "you have said your piece on that this watch" };
  const ctx = buildContext(m, { peek: true });
  coach(m, ctx, kind, sign > 0 ? 1 : -1);
  m.coached[kind] = deckmind.cycle;
  const first = firstName(m);
  if (sign > 0) { adjustTrust(m, 0.5); return { ok: true, line: `${first} takes it in. More of that, then.` }; }
  if ((m.traits?.loyalty ?? 0.5) < 0.6) adjustMorale(m, -1);
  return { ok: true, line: `${first} hears it. Whether they like it is another thing.` };
}

export const TRAIT_MEANS = {
  grit: "holds a post when it goes bad; fights before it runs; rests less",
  caution: "braces early; keeps clear of risk; slower to act",
  greed: "works for the pay; asks for more; eyes other berths",
  loyalty: "stands the watch; stays; takes a correction without sulking",
  curiosity: "studies and tinkers; talks to everyone; goes stale on routine",
};
