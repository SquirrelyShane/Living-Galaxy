/* LIVING GALAXY — the company line.
 *
 * Settling a hand used to be the last time you spoke to them. They went onto
 * the rolls, a number arrived every cycle, and the only things you could
 * still do were read a row in CON › CORP › TOWN or fly all the way back and
 * RECALL them from the hall. Everything that happened to them after that —
 * a promotion, a wedding, a child, a strike — was a line in a log.
 *
 * This is the other end of the phone. Every member of staff in this sky is on
 * the company line, and it runs both ways:
 *
 *   YOU CALL     CALL opens the line to one person. What they say is read off
 *                their actual life: role, cycles served, mood, household,
 *                the last thing the town log wrote about them. What you can
 *                do on it moves real numbers — a bonus out of the treasury,
 *                a bigger cut, a push for promotion, passage to another
 *                port, passage out to meet the ship, or a clean release.
 *
 *   THEY CALL    what happens to them in the rolls (stationlife.js) lands in
 *                the company INBOX as a message from them, and a member whose
 *                mood is sliding asks for something before they walk. An ask
 *                carries the answers that would actually settle it; one left
 *                unanswered for three cycles costs mood.
 *
 * REGARD is the new number: what they think of you as an employer, carried
 * over from their trust aboard when they settled. It lifts the mood their
 * port drifts them toward, which is what keeps someone on the rolls. Mood is
 * what the rolls already had; regard is what you can do about it from orbit.
 *
 * No DOM. The console draws it (js/console/panels/corp-town.js).
 */

import { company, hasCompany, payOffAndRecord, COMPANY } from "./company.js";
import { stationById } from "./stations.js";
import { cradle, PRONOUNS } from "./npc/cradle.js";
import { logEvent, sim } from "./sim.js";
import { ROLES, roleAt, roleIndex, incomeOf, stationLife } from "./stationlife.js";
import { CYCLE_SECONDS } from "./crew.js";
import { nowOf } from "./stafflife.js";
import { clockAt } from "./stationclock.js";

export const LINE = {
  bonusCycles: 3,        // a bonus is this many cycles of what they bring in
  bonusCooldown: 3,      // cycles between bonuses to the same person
  raiseStep: 0.1,        // each raise gives them this much more of the share they earn
  raiseMax: 3,           // and there are only so many
  promoteCost: 5,        // cycles of income a sponsored promotion costs
  promoteServe: 8,       // cycles per rung a sponsored promotion wants (the rolls want 14)
  fareBase: 180,         // passage between ports
  farePerMm: 40,         // …plus this per million units
  transitMin: 45,        // sky seconds a trip takes at the least
  transitPerMm: 30,      // …plus this per million units
  askBelow: 48,          // mood under this and they ask for something
  askEvery: 6,           // cycles between asks from one person
  askPatience: 3,        // cycles an ask waits before it costs mood
  inboxMax: 40,
  logMax: 10,            // exchanges remembered per person
};

/* ---- state lives on the company, so it saves and syncs with it ------------ */

export function lineState() {
  company.line ??= { inbox: [], seq: 1 };
  company.line.inbox ??= [];
  return company.line;
}

const inThisSky = (s) => s.sky == null || s.sky === sim.skySeed;
const cycleNow = () => Math.floor((sim.time ?? 0) / CYCLE_SECONDS);
const first = (s) => String(s?.name ?? "").split(" ")[0] || "They";
const prOf = (s) => s?.pronouns ?? PRONOUNS.nonbinary;
const tr = (s, k) => s?.traits?.[k] ?? 0.5;
/** Their list wage — what a pay-off's severance is counted in. */
const listOf = (s) => Math.round(s.listWage ?? (s.baseIncome ?? s.income ?? 0) / COMPANY.staffShare);

export function staffById(id) {
  return company.staff.find((s) => s.id === id) ?? null;
}

/** What they think of you as an employer, 0..100. Seeded from their trust aboard. */
export function regardOf(s) {
  if (!s) return 0;
  if (s.regard == null) s.regard = Math.max(20, Math.min(90, s.trustAboard ?? 50));
  return s.regard;
}
function bumpRegard(s, d) { s.regard = Math.max(0, Math.min(100, regardOf(s) + d)); return s.regard; }

/**
 * How far their regard and their raises lift the mood their port pulls them
 * toward. stationlife.js adds this to its target every cycle.
 */
export function moodLift(s) {
  return (regardOf(s) - 50) * 0.22 + (s.raises ?? 0) * 4;
}

/** The share they bring in after any raise you gave them. */
export function cutOf(s) {
  return Math.max(0.5, 1 - (s.raises ?? 0) * LINE.raiseStep);
}

/** Where they are, or where they are going. */
export function whereOf(s) {
  if (s.transit) {
    const to = stationById(s.transit.to);
    const left = Math.max(0, Math.round(s.transit.at - (sim.time ?? 0)));
    return { moving: true, text: `in transit to ${to?.name ?? "a port"} · ${left}s`, to, left };
  }
  const st = inThisSky(s) ? stationById(s.stationId) : null;
  return { moving: false, text: st?.name ?? "another sky", st };
}

/* ---- the transcript -------------------------------------------------------- */

function say(s, who, text) {
  s.lineLog ??= [];
  s.lineLog.unshift({ at: sim.time ?? 0, who, text });
  if (s.lineLog.length > LINE.logMax) s.lineLog.length = LINE.logMax;
  return text;
}
export function lineLog(s, n = 6) { return (s?.lineLog ?? []).slice(0, n); }

/* One seeded pick per person per cycle per topic — the same call twice in a
 * cycle reads the same, a new cycle reads fresh. */
function pick(s, topic, arr) {
  let h = 2166136261;
  const k = `${s.id}:${topic}:${cycleNow()}`;
  for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 16777619);
  return arr[(h >>> 0) % arr.length];
}

function moodWord(m) {
  return m >= 80 ? "flying" : m >= 65 ? "good" : m >= 52 ? "fine" : m >= 40 ? "worn thin" : "done with it";
}

/* ---- what they can say, read off their real life --------------------------- */

function household(s) {
  const h = stationLife.households?.[s.id] ?? { partner: null, children: [] };
  const partner = h.partner ? staffById(h.partner)?.name ?? cradle.get(h.partner)?.name ?? null : null;
  const kids = (h.children ?? []).map((id) => {
    const k = stationLife.kids.find((x) => x.id === id);
    return k ? { name: k.name.split(" ")[0], age: k.age } : null;
  }).filter(Boolean);
  return { partner, kids, expecting: h.expecting?.due ?? null };
}

function lastNews(s) {
  return stationLife.log.find((e) => e.who === s.name) ?? null;
}

function checkIn(s) {
  const w = whereOf(s);
  const h = household(s);
  const mood = Math.round(s.mood ?? 74);
  const role = roleAt(s.role).label.toLowerCase();
  const bits = [];
  if (w.moving) bits.push(pick(s, "ci-move", [`Still on the liner. ${w.left}s out from ${w.to?.name ?? "the port"}.`, `Somewhere between ports — ${w.left}s to go. The food is worse than you'd think.`]));
  else {
    /* 0.3.52: they are somewhere, doing something, at an hour of their day */
    const now = nowOf(s, sim.time ?? 0);
    const hh = clockAt(sim.time ?? 0).hhmm;
    if (now.id === "sleep") bits.push(pick(s, "ci-sleep", [`Mm — it's ${hh} here. I was asleep.`, `${hh}. You know what time it is down here? …Go on.`, `I'm up, I'm up. It's ${hh}.`]));
    else if (now.id === "work") bits.push(pick(s, "ci-work", [`On shift — ${s.job}. I've got a minute.`, `Can't talk long, I'm on the ${s.job}.`, `${hh}, middle of my shift on the ${s.job}.`]));
    else if (now.id === "strike") bits.push("I'm on the picket line. You know why.");
    else if (now.id === "meal" || now.id === "supper") bits.push(pick(s, "ci-eat", ["Eating. Talk with my mouth full, you don't mind.", "In the mess. It's not bad today.", "Caught me at the table."]));
    else if (now.id === "family") bits.push(pick(s, "ci-home", ["I'm home. It's loud.", "At home — good timing, actually.", "Home. Hang on, let me step out."]));
    else bits.push(pick(s, "ci-own", [`Off shift — ${now.label}.`, `My own time. I'm ${now.label}.`]));
  }
  if (!w.moving) bits.push(pick(s, "ci-open", [
    `${w.text}'s holding. ${s.cycles ?? 0} cycles on the rolls now, ${role}.`,
    `It's ${w.text}, it's a job. ${role[0].toUpperCase()}${role.slice(1)}, ${s.cycles ?? 0} cycles in.`,
    `Floor's busy at ${w.text}. I'm ${role} — ${s.cycles ?? 0} cycles since you set me down.`,
  ]));
  bits.push(mood >= 65
    ? pick(s, "ci-up", ["Honestly? I'm good.", "Can't complain, and I've tried.", "Better than I expected, if I'm being straight with you."])
    : mood >= 50
      ? pick(s, "ci-mid", ["I'm fine. It's fine.", "Getting by.", "Some days are longer than others."])
      : pick(s, "ci-low", ["I won't lie to you — I'm worn thin.", "It's not what you said it would be.", "I'm thinking about my options, if you want it plain."]));
  if (h.partner) bits.push(`${h.partner} says hello.`);
  if (h.expecting != null) bits.push(`The baby's due in ${h.expecting} cycle${h.expecting === 1 ? "" : "s"}.`);
  if (h.kids.length) bits.push(`${h.kids.map((k) => k.name).join(" and ")} ${h.kids.length === 1 ? "is" : "are"} growing like weeds.`);
  const news = lastNews(s);
  if (news && (sim.time ?? 0) - news.at < CYCLE_SECONDS * 8) bits.push(pick(s, "ci-news", ["You'll have seen the log.", "You heard what happened?", "Word gets around, I suppose."]));
  return bits.join(" ");
}

/* ---- topics ------------------------------------------------------------------
 * Each: { id, label, hint(s) → string, ok(s) → null | reason, run(s, arg) → line }.
 * `ok` returning a string greys the button with that reason. Money comes out of
 * the treasury first and your pocket if the company cannot cover it. */

function payFrom(amount, text) {
  if (company.treasury >= amount) { company.treasury -= amount; bookLine(text, -amount); return "treasury"; }
  if ((sim.ship?.credits ?? 0) >= amount) { sim.ship.credits -= amount; bookLine(`${text} (from your pocket)`, 0); return "pocket"; }
  return null;
}
function bookLine(text, delta) {
  company.book.unshift({ at: sim.time ?? 0, text, delta, kind: "line" });
  if (company.book.length > 60) company.book.length = 60;
  if (delta < 0) company.spend -= delta;
}
const canPay = (amount) => company.treasury >= amount || (sim.ship?.credits ?? 0) >= amount;

export function bonusCost(s) { return Math.max(60, Math.round(incomeOf(s) * LINE.bonusCycles)); }
export function promoteCost(s) { return Math.max(120, Math.round(incomeOf(s) * LINE.promoteCost)); }

/** Passage from one port to another: a fare and a flight time off the distance. */
export function passage(fromId, toId) {
  const a = stationById(fromId), b = stationById(toId);
  const mm = a && b ? Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) / 1e6 : 1;
  return { fare: Math.round(LINE.fareBase + mm * LINE.farePerMm), secs: Math.round(LINE.transitMin + mm * LINE.transitPerMm) };
}

/** Ports a member could be moved to: where the company has people, its office, and where you are docked. */
export function destinations(s) {
  const ids = new Set();
  for (const o of company.staff) if (inThisSky(o) && !o.transit) ids.add(o.stationId);
  if (company.hq && (company.hqSky == null || company.hqSky === sim.skySeed)) ids.add(company.hq);
  if (sim.ship?.dockedAt) ids.add(sim.ship.dockedAt);
  ids.delete(s.stationId);
  return [...ids].map((id) => stationById(id)).filter((st) => st && !(st.hostile && !st.claimed));
}

export const TOPICS = [
  {
    id: "checkin", label: "How are things?",
    hint: () => "what the floor is like, and them",
    ok: () => null,
    run(s) {
      const c = cycleNow();
      if (s.lastCheckIn !== c) {
        /* waking someone to ask how they are is still asking, but it costs a little */
        const asleep = !s.transit && nowOf(s, sim.time ?? 0).id === "sleep";
        bumpRegard(s, asleep ? 0.5 : 2); s.mood = Math.min(100, (s.mood ?? 74) + (asleep ? -1 : 1.5)); s.lastCheckIn = c;
      }
      return checkIn(s);
    },
  },
  {
    id: "bonus", label: "Send a bonus",
    hint: (s) => `${bonusCost(s)} cr · mood and regard up`,
    ok(s) {
      const left = LINE.bonusCooldown - (cycleNow() - (s.lastBonus ?? -99));
      if (left > 0) return `again in ${left} cycle${left === 1 ? "" : "s"}`;
      return canPay(bonusCost(s)) ? null : `needs ${bonusCost(s)} cr`;
    },
    run(s) {
      const cost = bonusCost(s);
      if (!payFrom(cost, `Bonus to ${s.name}`)) return null;
      s.lastBonus = cycleNow();
      s.mood = Math.min(100, (s.mood ?? 74) + 12);
      bumpRegard(s, 5);
      settleAsk(s, "bonus");
      return tr(s, "greed") > 0.6
        ? pick(s, "bonus-g", [`${cost}? …That'll do. For now.`, `About time. Thank you — I mean it.`])
        : pick(s, "bonus", [`You didn't have to do that. Thank you.`, `That's — thank you. Really.`, `I'll put some of it away and spend the rest badly.`]);
    },
  },
  {
    id: "raise", label: "Raise their cut",
    hint: (s) => `they keep ${Math.round(LINE.raiseStep * 100)}% more · company −${Math.max(1, Math.round(incomeOf(s) * LINE.raiseStep / cutOf(s)))} cr/cycle`,
    ok: (s) => ((s.raises ?? 0) >= LINE.raiseMax ? "already at the top of the scale" : null),
    run(s) {
      s.raises = (s.raises ?? 0) + 1;
      s.mood = Math.min(100, (s.mood ?? 74) + 6);
      bumpRegard(s, 6);
      settleAsk(s, "raise");
      bookLine(`${s.name}'s cut raised (step ${s.raises})`, 0);
      return pick(s, "raise", [`A bigger share? I'll hold you to it.`, `That changes things. Thank you.`, `Now that's how you keep people.`]);
    },
  },
  {
    id: "promote", label: "Push for promotion",
    hint: (s) => {
      const next = ROLES[roleIndex(s.role) + 1];
      return next ? `${next.label} · ${promoteCost(s)} cr` : "at the top";
    },
    ok(s) {
      const i = roleIndex(s.role);
      if (i >= ROLES.length - 1) return "nowhere higher to go";
      const want = LINE.promoteServe * (i + 1);
      if ((s.cycles ?? 0) < want) return `needs ${want} cycles served (${s.cycles ?? 0})`;
      if ((s.mood ?? 74) < 55) return "not while they're unhappy";
      return canPay(promoteCost(s)) ? null : `needs ${promoteCost(s)} cr`;
    },
    run(s) {
      const st = stationById(s.stationId);
      const cost = promoteCost(s);
      if (!payFrom(cost, `Sponsored ${s.name} for promotion`)) return null;
      const next = ROLES[Math.min(ROLES.length - 1, roleIndex(s.role) + 1)];
      s.role = next.id;
      s.income = incomeOf(s);
      s.mood = Math.min(100, (s.mood ?? 74) + 8);
      bumpRegard(s, 8);
      const rec = cradle.get(s.id);
      if (rec) { rec.title = next.label; cradle.note(rec.id, `Made ${next.label} at ${st?.name ?? "the port"} on the company's word`); }
      logEvent(`${s.name} made ${next.label} at ${st?.name ?? "the port"} — ${s.income} cr/cycle`, "company");
      return pick(s, "promote", [`${next.label}. Me. I won't let you down.`, `You put my name up? …Right. I'd better earn it.`]);
    },
  },
  {
    id: "family", label: "How's the family?",
    hint: (s) => { const h = household(s); return h.kids.length ? `${h.kids.length} child${h.kids.length === 1 ? "" : "ren"}${h.partner ? `, ${h.partner}` : ""}` : h.partner ? `with ${h.partner}` : "nobody yet"; },
    ok: () => null,
    run(s) {
      const h = household(s);
      bumpRegard(s, 1);
      if (!h.partner && !h.kids.length && h.expecting == null) return pick(s, "fam-0", ["Just me. The floor's my family, for now.", "Nobody yet. Ask me again in a few cycles."]);
      const bits = [];
      if (h.partner) bits.push(pick(s, "fam-p", [`${h.partner} is well.`, `${h.partner} and I are good. Better than good.`]));
      for (const k of h.kids) bits.push(k.age < 6 ? `${k.name} is ${k.age} cycle${k.age === 1 ? "" : "s"} old and into everything.` : k.age < 24 ? `${k.name}'s in the station school, asking about ships.` : `${k.name} is nearly grown — talks about the rolls like it's already settled.`);
      if (h.expecting != null) bits.push(`And one on the way — ${h.expecting} cycle${h.expecting === 1 ? "" : "s"}.`);
      return bits.join(" ");
    },
  },
  {
    id: "move", label: "Move them",
    hint: () => "passage to another company port",
    ok: (s) => (s.transit ? "already travelling" : destinations(s).length ? null : "the company has no other port"),
    options: (s) => destinations(s).map((st) => ({ id: st.id, label: st.name, hint: `${passage(s.stationId, st.id).fare} cr · ${passage(s.stationId, st.id).secs}s` })),
    run(s, toId) {
      const to = stationById(toId);
      if (!to) return null;
      const p = passage(s.stationId, toId);
      if (!payFrom(p.fare, `Passage for ${s.name} to ${to.name}`)) return null;
      s.transit = { to: toId, at: (sim.time ?? 0) + p.secs, from: s.stationId };
      bumpRegard(s, tr(s, "curiosity") > 0.55 ? 3 : -2);
      settleAsk(s, "move");
      return tr(s, "curiosity") > 0.55
        ? pick(s, "move-y", [`${to.name}? Good. I was going stale here.`, `New floor. I'll send word when I land.`])
        : pick(s, "move-n", [`If that's where you need me. I'll pack.`, `${to.name}. Right. Fine.`]);
    },
  },
  {
    id: "sendfor", label: "Come out to the ship",
    hint: () => "passage to the port you are docked at — then RECALL from the hall",
    ok(s) {
      if (s.transit) return "already travelling";
      const here = sim.ship?.dockedAt;
      if (!here) return "dock somewhere first";
      if (here === s.stationId) return "they're here — RECALL in the port's HALL";
      const st = stationById(here);
      if (st?.hostile && !st.claimed) return "not to a free port";
      return canPay(passage(s.stationId, here).fare) ? null : `needs ${passage(s.stationId, here).fare} cr`;
    },
    run(s) { return TOPICS.find((t) => t.id === "move").run(s, sim.ship.dockedAt); },
  },
  {
    id: "release", label: "Let them go",
    hint: (s) => `severance ${listOf(s) * 3} cr · address kept`,
    ok: (s) => ((sim.ship?.credits ?? 0) >= listOf(s) * 3 ? null : `severance is ${listOf(s) * 3} cr`),
    confirm: true,
    run(s) {
      const i = company.staff.indexOf(s);
      if (i < 0) return null;
      const st = stationById(s.stationId);
      const m = { ...s, wage: listOf(s) };
      /* severance comes from the pocket, like any pay-off */
      const err = payOffAndRecord(m, [], "released from the company", st);
      if (err) return null;
      company.staff.splice(company.staff.indexOf(s), 1);
      const inbox = lineState().inbox;
      for (let k = inbox.length - 1; k >= 0; k--) if (inbox[k].staffId === s.id) inbox.splice(k, 1);
      return pick(s, "release", [`Understood. It was good work while it lasted.`, `…Right. Look after yourself out there.`]);
    },
  },
];

export const topicById = (id) => TOPICS.find((t) => t.id === id) ?? null;

/** Say something on the line. Returns { ok, line, why }. */
export function callTopic(staffId, topicId, arg = null) {
  const s = staffById(staffId);
  if (!s) return { ok: false, why: "Not on the rolls" };
  if (!inThisSky(s)) return { ok: false, why: "Their port is in another sky" };
  const t = topicById(topicId);
  if (!t) return { ok: false, why: "No such topic" };
  const why = t.ok(s);
  if (why) return { ok: false, why };
  say(s, "you", t.label);
  const line = t.run(s, arg);
  if (line == null) return { ok: false, why: "It did not go through" };
  if (company.staff.includes(s)) say(s, "them", line);
  s.lastCall = sim.time ?? 0;
  for (const m of lineState().inbox) if (m.staffId === s.id) m.read = true;
  const rec = cradle.get(s.id);
  if (rec && topicId !== "checkin" && topicId !== "family") cradle.note(rec.id, `On the company line: ${t.label.toLowerCase()}`);
  return { ok: true, line };
}

/* ---- the inbox: they call you ------------------------------------------------ */

/** Which of the rolls' events are worth a call from the person it happened to. */
const CALLS = {
  promotion: "Wanted you to hear it from me —",
  marriage: "News —",
  birth: "It's a child —",
  "coming-of-age": "I'm on the rolls —",
  feud: "Something's going on down here —",
  strike: "You should know —",
  accident: "I'm all right —",
  incident: "I'm fine. Mostly —",
  transfer: "New floor —",
  commendation: "Small thing —",
  windfall: "Good news for the books —",
  expecting: "News —",
};

/* the ones worth a toast on the HUD as well as a line in the inbox */
const TOAST = new Set(["birth", "marriage", "promotion", "coming-of-age", "accident", "incident", "strike"]);

/** stationlife.js calls this on every event it files. */
export function hearFrom(kind, who, text) {
  if (!CALLS[kind] || !who) return null;
  const s = staffById(who.id) ?? company.staff.find((x) => x.name === who.name);
  if (!s) return null;
  if (TOAST.has(kind) && sim) { sim.toast = `Company line · ${s.name} — ${kind.replace(/-/g, " ")}`; sim.lastToastAt = sim.time; }
  return post(s, kind, `${CALLS[kind]} ${text}`);
}

function post(s, kind, text, asks = null) {
  const L = lineState();
  const msg = { id: `ln${L.seq++}`, staffId: s.id, name: s.name, at: sim.time ?? 0, cycle: cycleNow(), kind, text, asks, read: false };
  L.inbox.unshift(msg);
  if (L.inbox.length > LINE.inboxMax) L.inbox.length = LINE.inboxMax;
  say(s, "them", text);
  return msg;
}

/** An open ask from this person, if any. */
export function openAsk(s) {
  return lineState().inbox.find((m) => m.staffId === s.id && m.asks && !m.answered) ?? null;
}
function settleAsk(s, topicId) {
  const a = openAsk(s);
  if (a && a.asks.includes(topicId)) { a.answered = topicId; a.read = true; s.mood = Math.min(100, (s.mood ?? 74) + 4); }
}

export function unread() { return lineState().inbox.filter((m) => !m.read).length; }
export function markRead(id = null) { for (const m of lineState().inbox) if (id == null || m.id === id) m.read = true; }

/**
 * Once a cycle, after the rolls: finish journeys, raise asks from the
 * unhappy, and charge for asks left hanging.
 */
export function tickLine() {
  if (!hasCompany()) return;
  const c = cycleNow();
  const t = sim.time ?? 0;
  for (const s of company.staff) {
    if (!inThisSky(s)) continue;
    regardOf(s);
    /* a journey ends */
    if (s.transit && t >= s.transit.at) {
      const to = stationById(s.transit.to);
      s.stationId = s.transit.to;
      s.transit = null;
      const rec = cradle.get(s.id);
      if (rec) { rec.station = s.stationId; cradle.note(rec.id, `Arrived at ${to?.name ?? "a port"} on company passage`); }
      post(s, "arrived", `Landed at ${to?.name ?? "the port"}. ${sim.ship?.dockedAt === s.stationId ? "I'm on the floor if you want me aboard — the hall has my name." : "I'll get my bearings."}`);
      logEvent(`${s.name} arrived at ${to?.name ?? "a port"}`, "company");
    }
    /* an ask left hanging costs */
    const a = openAsk(s);
    if (a && c - a.cycle >= LINE.askPatience && !a.lapsed) {
      a.lapsed = true;
      s.mood = Math.max(0, (s.mood ?? 74) - 5);
      bumpRegard(s, -6);
      post(s, "ignored", pick(s, "ign", ["I guess I have my answer.", "Right. I'll stop asking, then.", "Heard nothing. Noted."]));
    }
    /* sliding: ask for something before they walk */
    if (!a && (s.mood ?? 74) < LINE.askBelow && c - (s.lastAsk ?? -99) >= LINE.askEvery) {
      s.lastAsk = c;
      const asks = ["bonus", "raise"];
      if (destinations(s).length && tr(s, "curiosity") > 0.4) asks.push("move");
      const text = tr(s, "greed") > 0.6
        ? pick(s, "ask-g", ["We need to talk about the rate. What I'm bringing in and what I'm seeing are two different numbers.", "I've had an offer. I'd rather stay — make it worth my while."])
        : tr(s, "curiosity") > 0.6
          ? pick(s, "ask-c", ["I'm going stale on this floor. Move me, or give me a reason to stay.", "Same corridors every cycle. I need something to change."])
          : pick(s, "ask", ["I don't like asking. I'm asking. Things aren't good down here.", "I need something from the company, or I don't see how I stay."]);
      post(s, "ask", text, asks);
      sim.notice = `Company line — ${s.name}: "${text.slice(0, 80)}${text.length > 80 ? "…" : ""}"`;
    }
  }
}

/** One line for a HUD chip or a heading. */
export function lineSummary() {
  if (!hasCompany() || !company.staff.length) return "";
  const n = unread();
  const asks = company.staff.filter((s) => openAsk(s)).length;
  return `${company.staff.length} on the line${n ? ` · ${n} unread` : ""}${asks ? ` · ${asks} asking` : ""}`;
}

