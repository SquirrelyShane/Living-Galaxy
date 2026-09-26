/* LIVING GALAXY — talking with the children aboard (0.3.57).
 *
 * A child aboard had four buttons — spend the watch, teach, the terminal,
 * shadow a watch — and each answered with the same greeting line anybody on
 * the crew would give. Nobody ever talked WITH them. This is that:
 *
 *   YOU ASK      eight things a captain says to a child, answered by who they
 *                are: how old (little, a child, a teenager), their temperament,
 *                what they have been taught and by whom, their parents, the
 *                bond you have put in, where the ship is right now.
 *
 *   THEY ASK     every few watches a child brings YOU a question — why the
 *                stars move when we turn, whether they can fly the ship, where
 *                people go when they die, why they cannot sign on somewhere
 *                else — with three ways to answer. What you answer moves the
 *                bond, and an honest answer to a curious child teaches them
 *                something, up to what their body can carry.
 *
 *   THE GROWN-UPS  a working ship is a village: every watch there is a chance
 *                a parent or a hand does something with a child — reads to
 *                them, lets them hold the torque driver, loses an argument
 *                about the rota — and it goes in the crew log, and now and
 *                then the child picks up a point of that adult's trade.
 *
 * Everything is seeded per child and per watch: the same question twice in a
 * watch gets the same answer; a new watch answers fresh.
 */

import { cradle } from "../npc/cradle.js";
import { household, note, personById } from "../family.js";
import { crew, crewHooks, firstName, CYCLE_SECONDS } from "../crew.js";
import { sim } from "../sim.js";
import { stationById } from "../stations.js";
import { COMPLEXES } from "../careers/complexes.js";
import { bondWith, inheritance, APT_LABEL } from "./children.js";

export const CHILD = {
  little: 6,          // under this many cycles: little
  teen: 16,           // this many and over: a teenager
  askEvery: 3,        // watches between a child's questions, at the least
  askChance: 0.45,    // …and the chance each watch after that
  momentChance: 0.3,  // an adult–child moment per child per watch
  skillEvery: 3,      // one moment in this many teaches a point of the adult's trade
  logMax: 8,
};

const cycleNow = () => Math.floor((sim.time ?? 0) / CYCLE_SECONDS);
const bondKey = (id) => `bond:${id}`;

function hash(s) {
  let h = 2166136261;
  s = String(s);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pick = (key, arr) => arr[hash(key) % arr.length];
const roll = (key) => (hash(key) % 10000) / 10000;

export function stageOf(c) {
  const a = c?.age ?? 0;
  return a < CHILD.little ? "little" : a < CHILD.teen ? "child" : "teen";
}

function traitsOf(c) { return cradle.get(c.id)?.traits ?? c.traits ?? {}; }
const tr = (c, k) => traitsOf(c)[k] ?? 0.5;

function addBond(c, d) {
  household.bonds ??= {};
  household.bonds[bondKey(c.id)] = Math.max(0, Math.min(100, bondWith(c) + d));
  return bondWith(c);
}

/** A point of a skill, capped by what the body can carry (the rule heritage and raise() use). */
function teach(c, skill, n = 1) {
  const rec = cradle.get(c.id);
  if (!rec || !skill) return false;
  rec.skills ??= {};
  const ceiling = Math.round(28 + (rec.aptitude?.[skill] ?? 0.5) * 42);
  const before = rec.skills[skill] ?? 0;
  if (before >= ceiling) return false;   // teaching gets them there sooner; it does not get them past it
  rec.skills[skill] = Math.min(ceiling, before + n);
  if (rec.skills[skill] > before) { cradle.put(rec); return true; }
  return false;
}

function talkLog(c) {
  household.talk ??= {};
  household.talk[c.id] ??= [];
  return household.talk[c.id];
}
function say(c, who, text) {
  const log = talkLog(c);
  log.unshift({ at: sim.time ?? 0, who, text });
  if (log.length > CHILD.logMax) log.length = CHILD.logMax;
  return text;
}
export function childTalkLog(c, n = 6) { return talkLog(c).slice(0, n); }

function parents(c) {
  return (c.parents ?? []).map((id) => (id === "player" ? { id: "player", name: "you", player: true } : crew.aboard.find((m) => m.id === id) ?? personById(id) ?? cradle.get(id))).filter(Boolean);
}
function where() {
  const st = sim.ship?.dockedAt ? stationById(sim.ship.dockedAt) : null;
  if (st) return { kind: "port", name: st.name };
  const d = sim.dominant;
  return d ? { kind: d.kind === "star" ? "star" : "world", name: d.name ?? "a world" } : { kind: "void", name: "nothing much" };
}
function topSkill(c) {
  const rec = cradle.get(c.id);
  const s = Object.entries(rec?.skills ?? {}).sort((a, b) => b[1] - a[1])[0];
  return s ? s[0] : null;
}
function topApt(c) {
  const rec = cradle.get(c.id);
  const a = Object.entries(rec?.aptitude ?? {}).sort((x, y) => y[1] - x[1])[0];
  return a ? a[0] : null;
}
/* "checks the seal twice" → "check the seal twice": the trait lines are written about them */
function firstPerson(label) {
  const [w, ...rest] = String(label).split(" ");
  const verb = w === "does" ? "do" : w === "content" ? "am content" : /(ch|sh|ss|x)es$/.test(w) ? w.slice(0, -2) : /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w;
  return [verb, ...rest].join(" ");
}
const aptWord = (k) => APT_LABEL[k] ?? (k ? k.replace(/([A-Z])/g, " $1").toLowerCase() : "something");

/* ---- you ask ------------------------------------------------------------------ */

export const CHILD_TOPICS = [
  {
    id: "howare", label: "How are you doing?",
    run(c, k) {
      const b = bondWith(c), s = stageOf(c);
      const d = 1;
      if (s === "little") return { d, line: pick(k, ["I made a boat out of a ration tin! It doesn't float. Nothing floats.", "Good! Is it nearly dinner? It's always nearly dinner.", "I'm being a comet. Comets are fast. Watch."]) };
      if (s === "child") return { d, line: b >= 40 ? pick(k, ["Good. I found a place behind the scrubber where you can hear the whole ship.", "Better now you're here. Everyone's busy."]) : pick(k, ["Fine.", "Okay. Bored. It's the same corridor every day."]) };
      return { d, line: b >= 55 ? pick(k, ["Honestly? Good. Don't tell anyone.", "Tired. Good tired, though."]) : b >= 25 ? pick(k, ["Fine.", "…Why, what did you hear?"]) : pick(k, ["Can we not do this.", "Fine. Is that it?"]) };
    },
  },
  {
    id: "learned", label: "What did you learn today?",
    run(c, k) {
      const sk = topSkill(c);
      const house = inheritance(c).complex?.name;
      const s = stageOf(c);
      if (!sk) return { d: 1, line: s === "little" ? "I learned that if you press the red button everybody shouts." : "Nothing yet. Nobody's shown me anything." };
      const word = sk.replace(/([A-Z])/g, " $1").toLowerCase();
      if (s === "little") return { d: 2, line: `${pick(k, ["Look! I can", "I learned", "Watch, I can"])} — um — ${word}! A bit.` };
      if (s === "child") return { d: 2, line: `${word[0].toUpperCase()}${word.slice(1)}. ${house ? `The ${house} way — ` : ""}${pick(k, ["it's harder than it looks.", "I'm getting it, I think.", "Ask me something. Go on."])}` };
      return { d: 1, line: `${word[0].toUpperCase()}${word.slice(1)}, mostly. ${tr(c, "curiosity") > 0.6 ? "And some things nobody meant to teach me." : "Same as yesterday."}` };
    },
  },
  {
    id: "parents", label: "How are your parents?",
    run(c, k) {
      const ps = parents(c);
      const aboard = ps.filter((p) => p.player || crew.aboard.some((m) => m.id === p.id));
      const gone = ps.filter((p) => !p.player && !crew.aboard.some((m) => m.id === p.id));
      const you = ps.some((p) => p.player);
      if (!ps.length) return { d: 1, line: "I don't really have any. I've got the ship." };
      const bits = [];
      if (you) bits.push(pick(k, ["You're my parent. You know how you are.", "You'd know. You're one of them."]));
      const said = aboard.filter((x) => !x.player);
      const h0 = hash(`${k}:p`);
      said.forEach((p, i) => { const opts = [`${firstName(p)}'s working. ${firstName(p)} is always working.`, `${firstName(p)} said I can help later.`, `${firstName(p)} snores. Don't tell.`, `${firstName(p)} let me stay up for the jump.`]; bits.push(opts[(h0 + i) % opts.length]); });
      for (const p of gone) bits.push(pick(`${k}:g:${p.id}`, [`I miss ${firstName(p)}. Do you think they miss me?`, `${firstName(p)} isn't aboard any more. Nobody talks about it.`]));
      return { d: gone.length ? 3 : 1, line: bits.join(" ") };
    },
  },
  {
    id: "future", label: "What do you want to be?",
    run(c, k) {
      const apt = topApt(c);
      const house = inheritance(c).complex?.name;
      const s = stageOf(c);
      if (s === "little") return { d: 1, line: pick(k, ["A starship! …No, a captain. No — a starship.", "The person who pushes the big button.", "A comet."]) };
      if (s === "teen" && bondWith(c) < 25) return { d: 0, line: "Somewhere that isn't here." };
      return { d: 2, line: `${house && tr(c, "loyalty") > 0.5 ? `${house}, like everyone.` : pick(k, ["I don't know yet.", "Something with my hands."])} ${apt ? `${pick(`${k}:a`, ["People say I've got", "Somebody on the crew says I've got", "Apparently I have"])} ${aptWord(apt)}.` : ""}`.trim() };
    },
  },
  {
    id: "window", label: "Look out the port with me",
    run(c, k) {
      const w = where();
      const s = stageOf(c);
      if (w.kind === "port") return { d: 2, line: s === "little" ? `Is that ${w.name}? It's got so many lights. Do people live in all of them?` : `${w.name}. Can I go ashore? Just to the market. Just once.` };
      if (w.kind === "world") return { d: 3, line: s === "little" ? `${w.name}! It's so BIG. Is there anyone down there?` : s === "child" ? `That's ${w.name}. I looked it up. ${pick(k, ["It's older than anything.", "The weather down there would kill you in a minute.", "I'd go down. I'd take a suit."])}` : `${w.name}. …Okay, it's beautiful. Don't make it a thing.` };
      if (w.kind === "star") return { d: 2, line: "It's just dark, and far. Are we lost? We're not lost. …Are we?" };
      return { d: 1, line: "There's nothing out there. That's the scary bit." };
    },
  },
  {
    id: "story", label: "Tell them a story",
    run(c, k) {
      const s = stageOf(c);
      if (s === "teen" && bondWith(c) < 55) return { d: 0, line: "I'm not five. …Which one?" };
      const q = tr(c, "curiosity") > 0.6 ? ` ${pick(`${k}:q`, ["But what happened to the ship after?", "Was any of it true?", "Why did the captain go back?"])}` : "";
      return { d: s === "teen" ? 3 : 4, line: `${pick(k, ["Again! Tell the bit with the pirates again.", "…and then what? You can't stop there.", "That's not how it ends. You always change the end."])}${q}` };
    },
  },
  {
    id: "proud", label: "I'm proud of you",
    run(c, k) {
      const boon = inheritance(c).boons[0];
      const s = stageOf(c);
      if (s === "teen" && bondWith(c) < 25) return { d: 2, line: "…Okay. Why?" };
      const why = !boon ? "" : boon.kind === "apt" ? ` ${pick(`${k}:b`, ["Is it because I've got", "Everyone says I've got"])} ${boon.label}?` : ` Is it because I ${firstPerson(boon.label)}?`;
      return { d: 4, line: `${pick(k, ["Really?", "You mean it?", "…Thanks."])}${why}` };
    },
  },
  {
    id: "rules", label: "Set a rule",
    run(c, k) {
      const s = stageOf(c);
      const takes = tr(c, "loyalty") > 0.55 || tr(c, "caution") > 0.6;
      if (s === "little") return { d: 0, line: pick(k, ["Okay. …What's a rule?", "But WHY can't I go in the airlock?"]) };
      if (takes) { teach(c, "lifeSupport"); return { d: 0, line: pick(k, ["Fine. Suit checks before the hatch. Every time.", "Okay. I get it. I do."]) }; }
      return { d: -2, line: s === "teen" ? pick(k, ["You're not the boss of — okay, you are the captain. Fine.", "Whatever."]) : "That's not fair." };
    },
  },
];

export const childTopicById = (id) => CHILD_TOPICS.find((t) => t.id === id) ?? null;

/** Ask a child something. → { ok, line, bond, why? } — each topic once a watch per child. */
export function talkToChild(c, topicId) {
  if (!c || !household.children.includes(c)) return { ok: false, why: "not aboard" };
  const t = childTopicById(topicId);
  if (!t) return { ok: false, why: "no such topic" };
  household.talked ??= {};
  const key = `${c.id}:${t.id}`;
  const cyc = cycleNow();
  const again = household.talked[key] === cyc;
  const out = t.run(c, `${c.id}:${t.id}:${cyc}`);
  say(c, "you", t.label);
  say(c, "them", out.line);
  if (!again) { household.talked[key] = cyc; addBond(c, out.d ?? 0); }
  return { ok: true, line: out.line, bond: bondWith(c), delta: again ? 0 : (out.d ?? 0) };
}

/* ---- they ask ------------------------------------------------------------------ */

export const CHILD_ASKS = [
  {
    id: "stars", stages: ["little", "child"], q: "Why do the stars move when we turn?",
    answers: [
      { id: "explain", label: "Explain it properly", bond: 2, skill: "navigation", line: "So it's US moving? The whole ship? …Do it again." },
      { id: "game", label: "Make it a game", bond: 3, line: "Spin it again! Spin it again!" },
      { id: "later", label: "Not now", bond: -2, line: "You always say not now." },
    ],
  },
  {
    id: "drive", stages: ["little", "child", "teen"], q: "Can I fly the ship?",
    answers: [
      { id: "helm", label: "Sit at the helm with me", bond: 3, skill: "piloting", line: "My hands are on it. MY HANDS ARE ON IT." },
      { id: "older", label: "When you're older", bond: 1, line: "Everything's when I'm older." },
      { id: "no", label: "No.", bond: -2, line: "Fine. I didn't want to anyway." },
    ],
  },
  {
    id: "die", stages: ["child", "teen"], q: "Where do people go when they die?",
    answers: [
      { id: "believe", label: "Tell them what you believe", bond: 3, line: "…Okay. I'll think about that." },
      { id: "ledger", label: "Into the ledger — nobody is forgotten", bond: 2, line: "The GDB keeps everyone? Even me? …Good." },
      { id: "subject", label: "Change the subject", bond: -1, line: "You don't know either." },
    ],
  },
  {
    id: "fair", stages: ["child"], q: "Why do the grown-ups get the good ration packs?",
    answers: [
      { id: "share", label: "Give them yours", bond: 3, line: "Really? …I'll save you half." },
      { id: "work", label: "Because they stand the watches", bond: 1, skill: "commerce", line: "So if I stand a watch I get one? Deal." },
      { id: "life", label: "Life isn't fair", bond: -1, line: "That's what people say when they're winning." },
    ],
  },
  {
    id: "leave", stages: ["teen"], q: "Why can't I sign on with another ship?",
    answers: [
      { id: "needed", label: "Because you're needed here", bond: 2, line: "…Needed. Okay. Nobody said that before." },
      { id: "can", label: "You can, when you're of age", bond: 3, line: "Seriously? You'd let me? …Maybe I'll stay anyway." },
      { id: "later", label: "Ask me again later", bond: -1, line: "You always say later." },
    ],
  },
  {
    id: "watch", stages: ["teen"], q: "Can I have a watch of my own? A real one?",
    answers: [
      { id: "post", label: "Give them a real post", bond: 3, skill: "house", line: "I won't mess it up. I won't." },
      { id: "shadow", label: "Shadow somebody first", bond: 1, skill: "house", line: "Fine. But I'm writing everything down." },
      { id: "no", label: "No.", bond: -3, line: "You don't trust me. Got it." },
    ],
  },
];

/** The question a child has open for you, if any. */
export function openChildAsk(c) {
  household.asks ??= {};
  const a = household.asks[c.id];
  return a && !a.answered ? { ...a, ask: CHILD_ASKS.find((x) => x.id === a.id) } : null;
}

/** Answer it. → { ok, line, bond, taught? } */
export function answerChild(c, answerId) {
  const open = openChildAsk(c);
  if (!open?.ask) return { ok: false, why: "nothing asked" };
  const ans = open.ask.answers.find((x) => x.id === answerId);
  if (!ans) return { ok: false, why: "no such answer" };
  household.asks[c.id].answered = ans.id;
  addBond(c, ans.bond);
  let taught = null;
  if (ans.skill) {
    const key = ans.skill === "house" ? (COMPLEXES[inheritance(c).complex?.id]?.primarySkills ?? [])[0] ?? topApt(c) : ans.skill;
    if ((tr(c, "curiosity") > 0.45 || ans.skill === "house") && teach(c, key)) taught = key;
  }
  say(c, "you", ans.label);
  say(c, "them", ans.line);
  note(`${firstName(c)} asked "${open.ask.q}" — you: ${ans.label.toLowerCase()}.`);
  return { ok: true, line: ans.line, bond: bondWith(c), taught };
}

/** Once a watch: children ask, and the grown-ups do things with them. */
export function tickChildren() {
  const cyc = cycleNow();
  household.asks ??= {};
  for (const c of household.children) {
    const s = stageOf(c);
    /* a question */
    const cur = household.asks[c.id];
    if ((!cur || cur.answered) && cyc - (cur?.cycle ?? -99) >= CHILD.askEvery && roll(`${c.id}:ask:${cyc}`) < CHILD.askChance) {
      const pool = CHILD_ASKS.filter((a) => a.stages.includes(s) && a.id !== cur?.id);
      if (pool.length) {
        const a = pool[hash(`${c.id}:which:${cyc}`) % pool.length];
        household.asks[c.id] = { id: a.id, cycle: cyc, answered: null };
        say(c, "them", a.q);
        note(`${firstName(c)} has a question for you: "${a.q}"`);
      }
    }
    /* a grown-up and a child */
    if (roll(`${c.id}:moment:${cyc}`) < CHILD.momentChance) momentFor(c, cyc);
  }
}

const MOMENTS = {
  little: ["{a} lets {c} hold the torque driver, with both hands, very seriously.", "{a} reads {c} the docking manual, doing all the voices.", "{c} falls asleep on {a}'s jacket in the mess.", "{a} teaches {c} to count rivets. They get to forty and start again."],
  child: ["{a} shows {c} how to read a pressure gauge.", "{c} follows {a} on rounds, asking about every valve.", "{a} and {c} race paper gliders down the spine corridor.", "{a} lets {c} log the watch. The handwriting is terrible."],
  teen: ["{c} argues with {a} about the watch rota, and loses.", "{a} lets {c} run the pre-flight checklist alone.", "{c} asks {a} what it was like before they came aboard. {a} answers.", "{a} catches {c} in the airlock with a borrowed suit. It is a long conversation."],
};

function momentFor(c, cyc) {
  const ps = parents(c).filter((p) => !p.player && crew.aboard.some((m) => m.id === p.id));
  const pool = ps.length ? ps : crew.aboard.filter((m) => !m.robot);
  if (!pool.length) return null;
  const a = pool[hash(`${c.id}:who:${cyc}`) % pool.length];
  const line = pick(`${c.id}:line:${cyc}`, MOMENTS[stageOf(c)]).replace(/\{a\}/g, firstName(a)).replace(/\{c\}/g, firstName(c));
  note(line);
  /* now and then it sticks: a point of the grown-up's own trade */
  if (hash(`${c.id}:skill:${cyc}`) % CHILD.skillEvery === 0) {
    const sk = Object.entries(a.skills ?? cradle.get(a.id)?.skills ?? {}).sort((x, y) => y[1] - x[1])[0]?.[0];
    if (sk) teach(c, sk);
  }
  return line;
}

if (!crewHooks.cycle.includes(tickChildren)) crewHooks.cycle.push(tickChildren);
