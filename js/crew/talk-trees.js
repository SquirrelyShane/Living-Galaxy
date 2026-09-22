/* LIVING GALAXY — what the crew will talk about.
 *
 * Data for crew/talk.js. Every node: { id, label, cls?, tier, when?, once?,
 * cooldown?, say(m, c) → string | { text, choices }, remember? }. `c` is
 * talk.talkContext(): f (first name), t (traits 0..1 on cradle's five axes:
 * grit, caution, greed, loyalty, curiosity), pr (pronouns), rec (cradle
 * record), docked, partner, kids, ties, mission, cycle, memory, others.
 *
 * Voice rules: lines are theirs, first person, short. A trait leans a line,
 * it never scripts a person — a greedy hand can still be kind, and the
 * choices are the captain's, with consequences the roster shows.
 */

import { firstName, rapportBetween } from "../crew.js";
import { trustOf } from "../family.js";
import { duties, wearLine } from "./duties.js";
import { dutyOptions, dutyOf, KIND_LABEL } from "./roster.js";
import { line as V, byTrait } from "./voice.js";

const Q = (c, s) => `${c.f}: "${s}"`;
const hi = (t, k) => (t[k] ?? 0.5) > 0.6;
const lo = (t, k) => (t[k] ?? 0.5) < 0.4;
/** First trait in `table`'s key order that leans high, else `else`. */
function pick(t, table) {
  for (const k of Object.keys(table)) if (k !== "else" && hi(t, k)) return table[k];
  return table.else;
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const lowest = (c) => c.others.filter((o) => !o.robot).sort((a, b) => (a.morale ?? 70) - (b.morale ?? 70))[0] ?? null;

/* 0.3.17 — conversations are threads now, not one line and done.
 *
 * A choice's `say` may return a string (the exchange ends) or `{ text,
 * choices }` — the hand answers AND carries it on, and the captain's next
 * options answer what was just said. Every topic below runs two or three
 * turns. And the ends of threads leave flags that later conversations pick
 * up (talk-threads.js): what you promised, what they told you, who you said
 * you would look after — so the next time you sit down with them it is the
 * next part of the same conversation, not a fresh one. */
const go = (c, text, choices) => ({ text: Q(c, text), choices });

/* ---- the human tree -------------------------------------------------------- */

export const TREE = [
  /* STATION — tier 0 */
  {
    id: "station", label: "What needs fixing?", tier: 0, cooldown: 1,
    say(m, c) {
      const here = dutyOf(m);
      const kind = here?.kind ?? "";
      const own = kind === "eng" ? V("watch_eng", `${m.id}:eng:${c.cycle}`, "I'm on it. Slowly.") : V("watch_other", `${m.id}:fix:${c.cycle}`, "Somebody in Engineering would help.");
      const choices = [];
      const canEng = dutyOptions().some((o) => o.kind === "eng");
      if (canEng && m.duty !== "eng") choices.push({ id: "eng", label: "You're on Engineering", cls: "accent", fx: { duty: "eng", trust: 1 }, say: (m2, c2) => go(c2, `${V("watch_posted", `${m2.id}:post:${c2.cycle}`, "Aye. Clamps first.")} Where do you want me to start — the clamps or the coolant?`, [
        { id: "clamps", label: "The clamps", fx: { flag: { engFocus: "clamps" } }, say: (m3, c3) => Q(c3, "Clamps. They're what holds us to a port, so they're what I'd want done first too.") },
        { id: "coolant", label: "The coolant", fx: { flag: { engFocus: "coolant" } }, say: (m3, c3) => Q(c3, "Coolant. Smart — a hot reactor makes every other fault worse.") },
        { id: "yours", label: "Your call", fx: { trust: 2, flag: { engFocus: "own" } }, say: (m3, c3) => Q(c3, "Then worst first. I'll tell you what that was when it's done.") },
      ]) });
      choices.push({ id: "carry", label: "Carry on as you are", fx: {}, say: (m2, c2) => go(c2, `${V("watch_carry", `${m2.id}:carry`, here ? `Aye. ${here.name} it is.` : "Aye.")} One thing, though — ${pick(c2.t, { caution: "if the backlog passes sixty, I want to be pulled off whatever I'm on.", grit: "if it gets bad, don't ask me, just post me.", else: "tell me when the wear gets bad. I don't always see the whole board." })}`, [
        { id: "deal", label: "Deal", cls: "accent", fx: { trust: 2, flag: "wearWatch" }, say: (m3, c3) => Q(c3, "Good. Then I'll stop worrying about it and do my job.") },
        { id: "see", label: "We'll see", fx: { trust: -1 }, say: (m3, c3) => Q(c3, "Aye. We'll see.") },
      ]) });
      if (m.duty) choices.push({ id: "trade", label: "Back to your own trade", fx: { duty: null, morale: 2 }, say: (m2, c2) => Q(c2, V("watch_trade", `${m2.id}:trade`, "Back where I'm useful. Thank you.")) });
      return { text: `${Q(c, wearLine())} ${Q(c, own)}`, choices };
    },
  },
  /* THE RUN — tier 0, reads mission.active */
  {
    id: "run", label: "The run", tier: 0, cooldown: 1,
    say(m, c) {
      const t = c.t;
      const name = c.mission?.name ?? null;
      const state = c.missionState;
      const view = name
        ? `${name}, ${state}. ${byTrait("run", t, `${m.id}:${name}:${c.cycle}`, "It's a run.")}`
        : byTrait("runidle", t, `${m.id}:idle:${c.cycle}`, "No plan yet. I'll be in the mess.");
      const choices = [];
      if (hi(t, "greed")) {
        choices.push({ id: "noted", label: "Noted — we'll stash", cls: "accent", fx: { trust: 2, flag: "adviceHeard" }, say: (m2, c2) => go(c2, "You'll see it in the ledger. Want me to keep a tally of what we'd have lost selling cheap?", [
          { id: "tally", label: "Keep the tally", cls: "accent", fx: { trust: 1, flag: { keepsTally: c2.time } }, say: (m3, c3) => Q(c3, "I'll have a number for you next time we talk. You'll like it or you won't.") },
          { id: "notally", label: "No need", fx: {}, say: (m3, c3) => Q(c3, "Your ledger.") },
        ]) });
        choices.push({ id: "mine", label: "I sell where I please", fx: { trust: -2, morale: -1 }, say: (m2, c2) => Q(c2, "Your hull, your loss.") });
      } else if (hi(t, "caution")) {
        choices.push({ id: "watch", label: "Watch the reactor for me", fx: { trust: 2, flag: "watchesReactor" }, say: (m2, c2) => go(c2, "I already do. Now it's official. Then I want the alarms on my bunk panel too.", [
          { id: "all", label: "Every alarm", fx: { trust: 2, flag: { reactorAlarms: "all" } }, say: (m3, c3) => Q(c3, "Every one. I'll sleep worse and the ship will sleep better.") },
          { id: "red", label: "Only the red ones", fx: { flag: { reactorAlarms: "red" } }, say: (m3, c3) => Q(c3, "Red ones. Fair. The ambers are mostly the sensor lying anyway.") },
        ]) });
        choices.push({ id: "fine", label: "The numbers are fine", fx: { trust: -1 }, say: (m2, c2) => Q(c2, "Numbers usually are, right up to the moment.") });
      } else if (hi(t, "curiosity")) {
        choices.push({ id: "lane", label: "Next time, the long lane", cls: "accent", fx: { morale: 4, trust: 2, flag: "longLane" }, say: (m2, c2) => go(c2, "I'll hold you to that, captain. There's an old survey marker on the long lane — could we stop, just for an hour?", [
          { id: "stop", label: "If there's time", cls: "accent", fx: { morale: 3, flag: { markerPromised: true } }, say: (m3, c3) => Q(c3, "There's always time. You just have to take it before somebody else does.") },
          { id: "cargo", label: "Not with cargo aboard", fx: { morale: -1 }, say: (m3, c3) => Q(c3, "Then an empty run. I'll keep asking.") },
        ]) });
        choices.push({ id: "short", label: "We fly the short way", fx: { morale: -1 }, say: (m2, c2) => Q(c2, "Aye. Short way.") });
      } else {
        choices.push({ id: "ok", label: "Good to hear", fx: { trust: 1 }, say: (m2, c2) => go(c2, "Aye. Anything you want from me on it?", [
          { id: "eyes", label: "Eyes on the board", fx: { trust: 1 }, say: (m3, c3) => Q(c3, "They're always on the board. But I'll say it out loud if I see something.") },
          { id: "rest", label: "Rest while you can", fx: { morale: 2 }, say: (m3, c3) => Q(c3, "Now that's an order I'll follow.") },
        ]) });
      }
      return { text: Q(c, view), choices };
    },
  },
  /* RECORD — tier 0 */
  {
    id: "record", label: "Your record", tier: 0, cooldown: 2,
    say(m, c) {
      const h = c.rec?.history ?? [];
      const text = h.length ? `${m.name}'s record: ${h.slice(-3).map((x) => x.text).join(" · ")}` : `${m.name} has no record before this ship.`;
      return { text, choices: [
        { id: "fair", label: "A fair record", fx: { trust: 1 }, say: (m2, c2) => Q(c2, h.some((x) => /walked|dismissed/i.test(x.text)) ? "Most of it. The rest I'd tell differently." : "It's honest, at least.") },
        { id: "gaps", label: "There are gaps", fx: { trust: -1 }, say: (m2, c2) => go(c2, `${pick(c2.t, { grit: "Everyone's has gaps. Mine are mine.", caution: "Gaps are where I kept my head down.", else: "…some of it I'd rather not have on paper." })} You want the story, or do you want to leave it?`, [
          { id: "tell", label: "Tell me", fx: { trust: 3, flag: "toldStory" }, say: (m3, c3) => Q(c3, pick(c3.t, { grit: "A captain who ran with the hold still full and the crew still in the lock. I got the crew out. The record calls that 'insubordination'.", caution: "A contract that went quiet for a year. I waited it out on a station with no work rather than fly for the wrong people.", greed: "I bought a share in a hull that never flew. Two years paying it off. That's the gap.", loyalty: "Somebody I owed needed nursing. You don't log that. You just go.", curiosity: "I went out past the last beacon with a survey crew. We came back. The paperwork didn't.", else: "Nothing dramatic. I was between things, and between things doesn't go in a record." })) },
          { id: "leave", label: "It's behind you", fx: { morale: 2 }, say: (m3, c3) => Q(c3, "…thank you. It is.") },
        ]) },
      ] };
    },
  },
  /* PAST — tier 1 */
  {
    id: "origin", label: "Where are you from?", tier: 1, cooldown: 4, remember: "past",
    say(m, c) {
      const o = c.rec?.origin ?? "nowhere worth the name";
      return { text: Q(c, `${cap(o)}. ${pick(c.t, { curiosity: "Left the day I could. There was a whole sky and one window.", loyalty: "Still send money back. Still would.", greed: "Poor as dust. I'm not going back poor.", else: "It was fine. It was small." })}`), choices: [
        { id: "miss", label: "Do you miss it?", fx: { trust: 2 }, say: (m2, c2) => go(c2, `${pick(c2.t, { loyalty: "Every watch. I don't say so.", curiosity: "I miss the people. Not the place.", else: "…sometimes. When the hull's quiet." })} Do you ever send word home, captain?`, [
          { id: "every", label: "Every port", fx: { trust: 1 }, say: (m3, c3) => Q(c3, "Then you know. It's the one message that's never the wrong length.") },
          { id: "noone", label: "No one to send it to", fx: { trust: 3, flag: "knowsCaptainAlone" }, say: (m3, c3) => Q(c3, "…then you've got a crew. That's something. Not the same, but something.") },
          { id: "you", label: "Do you?", fx: { trust: 2, flag: "sendsHome" }, say: (m3, c3) => Q(c3, pick(c3.t, { loyalty: "Every cycle, a slice of the wage. They don't know where it comes from. That's how I want it.", greed: "Not money. Not yet. A picture, sometimes, of a port they'll never see.", else: "When there's something worth saying. There usually isn't. I send it anyway." })) },
        ]) },
        { id: "why", label: "Why did you leave?", fx: { trust: 1 }, say: (m2, c2) => go(c2, `${pick(c2.t, { greed: "Nobody out there pays. Everybody out here does, eventually.", grit: "Nothing left to do there that wasn't already done.", caution: "It was getting dangerous, and I was getting good at noticing.", else: "A berth came up. I took it." })} Would you have? In my place?`, [
          { id: "yes", label: "In a heartbeat", fx: { trust: 2, morale: 1 }, say: (m3, c3) => Q(c3, "Good. I'd hate to be the only one who thinks the sky was worth it.") },
          { id: "no", label: "I'd have stayed", fx: { trust: 0 }, say: (m3, c3) => Q(c3, "Then you'd have been happier and I'd never have met you. Swings and roundabouts.") },
        ]) },
      ] };
    },
  },
  {
    id: "firstShip", label: "Your first ship", tier: 1, once: true, remember: "past",
    say(m, c) {
      return { text: Q(c, pick(c.t, { grit: "A belt tug with one working seal. We flew her anyway. Learned more from that hull than any school.", caution: "A liner, actually. Clean decks, three backups on everything. Spoiled me for anything that groans.", greed: "A prospector. Took a two percent cut and thought I was rich.", curiosity: "A survey boat. Six of us and a telescope. Never slept.", else: "A freighter. She was old. Everyone's first is." })), choices: [
        { id: "what", label: "What happened to her?", fx: { trust: 2 }, say: (m2, c2) => go(c2, `${pick(c2.t, { grit: "Scrapped. I kept a bolt.", caution: "Still flying, last I heard. Good ships are boring.", else: "Sold out from under us. That's how I ended up in the halls." })} What was yours, captain?`, [
          { id: "mine", label: "This one", fx: { trust: 2, morale: 2 }, say: (m3, c3) => Q(c3, "…then we're both learning her. That's a good way to start.") },
          { id: "notsay", label: "Another time", fx: {}, say: (m3, c3) => Q(c3, "I'll ask again. I'm patient.") },
        ]) },
        { id: "back", label: "Would you go back?", fx: { trust: 1 }, say: (m2, c2) => Q(c2, hi(c2.t, "loyalty") ? "This is my ship now, captain." : "No. But I'd take her captain's call.") },
      ] };
    },
  },
  {
    id: "lastBerth", label: "Why'd you leave your last berth?", tier: 1, cooldown: 6, remember: "past",
    say(m, c) {
      const h = c.rec?.history ?? [];
      const walked = h.some((x) => /walked/i.test(x.text)), sacked = h.some((x) => /dismissed/i.test(x.text));
      const text = walked ? "Payroll stopped. I gave it three cycles, then I gave it up." : sacked ? "Captain and I didn't see eye to eye. Captain had the eye that counted." : pick(c.t, { loyalty: "Ship was sold. I'd have stayed to the last bolt.", greed: "Better cut on the next one. Then a better cut on this one.", curiosity: "Same rock, same lane, same faces. I needed a new window.", else: "Contract ended. They all do." });
      return { text: Q(c, text), choices: [
        { id: "here", label: "That won't happen here", fx: { trust: hi(c.t, "loyalty") ? 3 : 1 }, say: (m2, c2) => go(c2, `${walked ? "Then keep the payroll straight and I'll keep the watch." : "Words. But I'll take them."} So I'll say it plain: pay on the cycle, and I'm yours.`, [
          { id: "every", label: "On the cycle, every cycle", cls: "accent", fx: { trust: 2, flag: "payPromise" }, say: (m3, c3) => Q(c3, "Then we understand each other. I'll remember you said it.") },
          { id: "when", label: "When I can", fx: { trust: -1 }, say: (m3, c3) => Q(c3, "…honest, at least. That's worth something.") },
        ]) },
        { id: "loss", label: "Their loss", fx: { morale: 2, trust: 1 }, say: (m2, c2) => Q(c2, "Kind of you to say.") },
      ] };
    },
  },
  /* MESS TALK — tier 1 */
  {
    id: "mess", label: "Mess talk", tier: 1, cooldown: 2, when: (m, c) => c.others.some((o) => !o.robot),
    say(m, c) {
      const low = lowest(c);
      const lf = low ? firstName(low) : null;
      const text = !low ? "Quiet mess. That's not a complaint." : (low.morale ?? 70) < 40 ? `${lf}'s not right. Eats alone, doesn't finish. Somebody should ask.` : (low.morale ?? 70) < 65 ? `${lf} grumbles. Pay, watch rota, the coffee. Nothing you couldn't fix.` : `The mess is good. ${lf} tells the worst jokes, which is how you know.`;
      return { text: Q(c, text), choices: [
        { id: "talk", label: low ? `I'll talk to ${lf}` : "Good", fx: { trust: 2, flag: low ? { looksAfter: low.id, looksAfterMorale: Math.round(low.morale ?? 70), looksAfterAt: c.cycle } : "looksAfter" }, say: (m2, c2) => (low ? go(c2, `Good. Do it soon. Want me to sit with ${lf} first? Soften the ground?`, [
          { id: "first", label: "Yes — you go first", cls: "accent", fx: { trust: 1, rapport: { with: low.id, d: 4 } }, say: (m3, c3) => Q(c3, `I'll take ${lf} a coffee at the change of watch. You come by after.`) },
          { id: "myself", label: "I'll do it myself", fx: {}, say: (m3, c3) => Q(c3, `Then don't make it a meeting. ${lf} hates meetings.`) },
        ]) : Q(c2, "Aye.")) },
        { id: "not", label: "Not my problem", fx: { trust: -2, morale: -1 }, say: (m2, c2) => Q(c2, pick(c2.t, { loyalty: "…it's all our problem, captain. That's what a crew is.", else: "Aye. Just saying." })) },
      ] };
    },
  },
  /* CREWMATES — tier 1, one choice per tie */
  {
    id: "mates", label: "About the others", tier: 1, cooldown: 1, when: (m, c) => c.ties.length > 0,
    say(m, c) {
      const lines = c.ties.slice(0, 4).map((tie) => {
        const n = firstName({ name: tie.name });
        if (tie.kind === "couple") return `${n} — you know about ${n} and me.`;
        if (tie.kind === "friend") return `${n}? ${pick(c.t, { grit: "Solid. I'd go through a hatch after that one.", curiosity: "We talk for whole watches. About nothing.", else: "Good hand. Good company." })}`;
        return `${n}. ${pick(c.t, { grit: "We don't speak. It's better for the hull.", caution: "I keep clear. It's not a fight, it's a distance.", greed: "Thinks the cut should be even. It shouldn't.", else: "We had words. They stuck." })}`;
      });
      const choices = [];
      for (const tie of c.ties.slice(0, 4)) {
        const n = firstName({ name: tie.name });
        if (tie.kind === "couple") choices.push({ id: `glad:${tie.with}`, label: `Happy for you and ${n}`, fx: { morale: 2, trust: 1 }, say: (m2, c2) => Q(c2, "…thanks, captain.") });
        else if (tie.kind === "friend") choices.push({ id: `glad:${tie.with}`, label: `Glad you and ${n} get on`, fx: { rapport: { with: tie.with, d: 3 }, morale: 2 }, say: (m2, c2) => Q(c2, "Makes the long watches short.") });
        else {
          choices.push({ id: `mend:${tie.with}`, label: `Sort it out with ${n}`, cls: "accent", fx: { rapport: { with: tie.with, d: 8 }, trust: -1, flag: { mending: tie.with } }, say: (m2, c2) => go(c2, `${pick(c2.t, { grit: "…fine. One mess shift. I'm not promising anything past that.", else: "If you're asking, I'll try." })} What do I even open with?`, [
            { id: "job", label: "Start with the job", fx: { rapport: { with: tie.with, d: 2 } }, say: (m3, c3) => Q(c3, `The job. Right. ${n} can't argue with a torque spec.`) },
            { id: "sorry", label: "Start with sorry", fx: { rapport: { with: tie.with, d: hi(c2.t, "grit") ? -1 : 5 } }, say: (m3, c3) => Q(c3, hi(c3.t, "grit") ? "…I'll start with the job." : "Sorry. Fine. It'll cost me, but fine.") },
          ]) });
          choices.push({ id: `side:${tie.with}`, label: `${n} is in the wrong`, cls: "danger", fx: { rapport: { with: tie.with, d: -5 }, trust: 3, morale: 3 }, say: (m2, c2) => Q(c2, "Thank you. Nobody else says it.") });
        }
      }
      if (!choices.length) { lines.push("I keep to myself. It's a small hull."); choices.push({ id: "fine", label: "Fair enough", fx: {}, say: (m2, c2) => Q(c2, "Aye.") }); }
      return { text: lines.map((s) => Q(c, s)).join(" "), choices };
    },
  },
  /* FEARS / HOPES — tier 2 */
  {
    id: "fears", label: "What keeps you up?", tier: 2, cooldown: 5, need: { morale: "steady" },
    say(m, c) {
      const text = pick(c.t, { caution: "A seal I didn't check. That's the whole list.", greed: "Dying broke. Everyone dies; not everyone dies with nothing to send home.", curiosity: "Never getting past the belt. Same three ports until the hull gives out.", loyalty: "Being the one who's left. I've buried a crew. Twice is too many.", grit: "Not much. The quiet after boarding, maybe. When you count heads.", else: "The airlock cycling when nobody's near it. Every ship has one noise." });
      const soft = lo(c.t, "grit");
      return { text: Q(c, text), choices: [
        { id: "safe", label: "I'll keep you safe", fx: { trust: soft ? 4 : -1 }, say: (m2, c2) => (soft
          ? go(c2, "…I'll hold you to that. How, though? Say it so I can stop thinking about it.", [
            { id: "seals", label: "No more cold seals — I'll sign every check", fx: { trust: 2, flag: { fearAnswer: "seals" } }, say: (m3, c3) => Q(c3, "Every check. I'll bring you the clipboard, then. Don't groan.") },
            { id: "watches", label: "Double watch on the lock", fx: { trust: 2, morale: 1, flag: { fearAnswer: "watches" } }, say: (m3, c3) => Q(c3, "Two on the lock. Aye. I'll sleep, I think.") },
          ])
          : Q(c2, "I don't need minding, captain. But I heard you.")) },
        { id: "all", label: "We all carry one", fx: { trust: 2, morale: 1 }, say: (m2, c2) => go(c2, "Aye. Yours?", [
          { id: "ship", label: "Losing the ship", fx: { trust: 2, flag: { sharedFear: "ship" } }, say: (m3, c3) => Q(c3, "She's a good hull. We'll keep her. That's the crew's job as much as yours.") },
          { id: "crew", label: "Losing the crew", fx: { trust: 4, morale: 2, flag: { sharedFear: "crew" } }, say: (m3, c3) => Q(c3, "…then we're afraid of the same thing from different ends. That helps, oddly.") },
          { id: "mine", label: "I don't say mine", fx: { trust: -1 }, say: (m3, c3) => Q(c3, "Fair. The offer stands.") },
        ]) },
      ] };
    },
  },
  {
    id: "hopes", label: "What do you want out of this?", tier: 2, cooldown: 5, need: { morale: "steady" },
    say(m, c) {
      const text = pick(c.t, { greed: "A hull of my own. Small. Paid off.", curiosity: "To see a ring from the inside. Just once, without a manifest.", loyalty: "A crew that stays. This one might be it.", caution: "To get old. Out here that's ambition.", grit: "Nothing I'd say out loud. Enough work to stop thinking.", else: "A berth I don't have to leave. That's it." });
      return { text: Q(c, text), choices: [
        { id: "help", label: "I'll help you get there", cls: "accent", fx: { trust: 3, morale: 3, flag: { hopeBacked: true, hopeAt: c.cycle } }, say: (m2, c2) => go(c2, `${pick(c2.t, { greed: "Then start with the bonus.", else: "…nobody's said that to me before." })} Can I put a little of each cycle aside toward it? On the ship's books, so I can't spend it.`, [
          { id: "match", label: "Put it aside — I'll match it", cls: "accent", fx: { trust: 3, morale: 3, flag: { hopeFund: "matched" } }, say: (m3, c3) => Q(c3, "Matched. …I'll bring you the number every few cycles. So you know it's real.") },
          { id: "own", label: "Put aside what you like", fx: { trust: 1, flag: { hopeFund: "own" } }, say: (m3, c3) => Q(c3, "I'll start small. Small is how it gets done.") },
        ]) },
        { id: "watch", label: "Keep your head on the watch", fx: { trust: -2, morale: -2 }, say: (m2, c2) => Q(c2, "It's on the watch. It's also mine.") },
      ] };
    },
  },
  /* WAGE — tier 2 */
  {
    id: "wage", label: "About your wage", tier: 2, cooldown: 4, when: (m) => !m.robot,
    say(m, c) {
      const first = m.firstHand ? " The first-hand rate, still — I noticed." : "";
      return { text: Q(c, `${m.wage} a cycle.${first} ${V("wage", `${m.id}:w:${c.cycle}`)}`), choices: [
        { id: "raise", label: "Ten percent more", cls: "accent", fx: { wage: 1.1, morale: 6, trust: 4 }, say: (m2, c2) => Q(c2, V("wage_yes", `${m2.id}:wy`)) },
        { id: "no", label: "You're paid what you're worth", fx: { morale: hi(c.t, "greed") ? -6 : -1, trust: hi(c.t, "greed") ? -3 : 0 }, say: (m2, c2) => go(c2, `${V("wage_no", `${m2.id}:wn`)} Then tell me what would make me worth more.`, [
          { id: "rank", label: "Your next rank", fx: { trust: 2, flag: { raiseOn: "rank" } }, say: (m3, c3) => Q(c3, "Next rank. I'll be at the board more than you'd think, then.") },
          { id: "time", label: "Ten more cycles aboard", fx: { trust: 2, flag: { raiseOn: "tenure", raiseAt: c2.cycle + 10 } }, say: (m3, c3) => Q(c3, "Ten cycles. I'm counting from today. So are you, now.") },
          { id: "none", label: "Nothing will", cls: "danger", fx: { trust: -3, morale: -3 }, say: (m3, c3) => Q(c3, "…noted, captain.") },
        ]) },
      ] };
    },
  },
  /* APOLOGY — after a dressing-down */
  {
    id: "apology", label: "About earlier", tier: 0, when: (m, c) => (c.memory.topics.chew ?? 0) > 0 && c.memory.flags.settledChew === false,
    say(m, c) {
      return { text: Q(c, V("apology_open", `${m.id}:ap:${c.cycle}`)), choices: [
        { id: "sorry", label: "I was out of line", cls: "accent", fx: { trust: 5, morale: 4, flag: { settledChew: true } }, say: (m2, c2) => go(c2, `${V("apology_yes", `${m2.id}:aps`)} Want to know what actually set me off? It wasn't you.`, [
          { id: "tell", label: "Tell me", fx: { trust: 2 }, say: (m3, c3) => Q(c3, pick(c3.t, { greed: "Payroll. It always comes back to payroll. You just walked into it.", caution: "A reading I didn't like on the aft trunk. I was already wound tight.", loyalty: "Somebody on the crew was being talked about. I don't like that.", else: "A bad watch. That's all. Nobody's fault." })) },
          { id: "lie", label: "Let it lie", fx: { morale: 1 }, say: (m3, c3) => Q(c3, "Aye. Lying there nicely.") },
        ]) },
        { id: "stand", label: "You needed to hear it", fx: { trust: hi(c.t, "grit") ? 1 : -3, flag: { settledChew: true } }, say: (m2, c2) => Q(c2, V("apology_stand", `${m2.id}:apd`)) },
      ] };
    },
  },
  /* PARTNER (crew) — tier 2 */
  {
    id: "partnerDeep", label: (m, c) => `Are you and ${c.partner ? firstName(c.partner) : "they"} alright?`, tier: 2, cooldown: 3, when: (m, c) => c.partner && c.partner.id !== "player",
    say(m, c) {
      const p = c.partner;
      if (!p || p.id === "player") return { text: Q(c, "There's no one, captain. Unless you're asking something else."), choices: [{ id: "deck", label: "Never mind", fx: {}, say: (m2, c2) => Q(c2, "Aye.") }] };
      const r = rapportBetween(m, p), pf = firstName(p);
      const text = r > 80 ? `${pf}. ${V("partner_good", `${m.id}:${p.id}:g`)}` : r > 55 ? V("partner_good", `${m.id}:${p.id}:m`) : `${V("partner_thin", `${m.id}:${p.id}:t`)} ${pf} would say the same.`;
      return { text: Q(c, text), choices: [
        { id: "same", label: "Take the same watch", cls: "accent", fx: { sameWatch: true, morale: 3, partnerMorale: 3, rapport: { with: "partner", d: 4 } }, say: (m2, c2) => Q(c2, "That'll help. Thank you.") },
        { id: "deck", label: "Keep it off the deck", fx: { trust: -1 }, say: (m2, c2) => go(c2, `It is off the deck, captain. That's the problem. Give us a night off together now and then and it'll stay there.`, [
          { id: "night", label: "Next port, the night's yours", cls: "accent", fx: { trust: 3, morale: 3, partnerMorale: 3, flag: { nightOff: true } }, say: (m3, c3) => Q(c3, `Next port. I'll tell ${pf}. …thank you.`) },
          { id: "nonight", label: "Not while we're short-handed", fx: { morale: -2 }, say: (m3, c3) => Q(c3, "Then we'll manage. We always do.") },
        ]) },
      ] };
    },
  },
  /* KIDS — tier 2 */
  {
    id: "kidsFuture", label: "What do you want for the children?", tier: 2, cooldown: 4, need: { morale: "sullen" }, when: (m, c) => c.kids.length > 0,
    say(m, c) {
      const k = c.kids[0]?.name.split(" ")[0] ?? "the kid";
      return { text: Q(c, `${k}. ${V("kids", `${m.id}:kids:${c.cycle}`)}`), choices: [
        { id: "berth", label: "A berth on this ship, when they're grown", cls: "accent", fx: { trust: 4, morale: 2, flag: "kidBerth" }, say: (m2, c2) => go(c2, `…that's a promise I'll remember, captain. Would you teach ${k} the board yourself?`, [
          { id: "teach", label: "I'll teach them myself", cls: "accent", fx: { trust: 3, flag: { kidTeacher: "captain" } }, say: (m3, c3) => Q(c3, `Then ${k}'s going to be insufferable. Good.`) },
          { id: "you", label: "That's your job", fx: { trust: 1, flag: { kidTeacher: "parent" } }, say: (m3, c3) => Q(c3, "Aye. It is. I'll do it properly.") },
        ]) },
        { id: "settle", label: "A deck that doesn't move", fx: { trust: 2 }, say: (m2, c2) => Q(c2, c2.docked ? "Then let's talk about settling. Here, maybe." : "Then find us a port worth the name.") },
      ] };
    },
  },
  /* PROMISE — tier 3, once */
  {
    id: "promise", label: "Stay on after this contract?", tier: 3, once: true, cls: "accent", need: { morale: "willing" },
    say(m, c) {
      const loyal = !lo(c.t, "loyalty");
      const choices = [];
      if (loyal) {
        choices.push({ id: "shake", label: "Shake on it", cls: "accent", fx: { trust: 5, morale: 4, flag: "promised" }, say: (m2, c2) => go(c2, "Done. You've got me. …and what do I get? Not money. Say something true.", [
          { id: "trust", label: "My back, every time", fx: { trust: 3 }, say: (m3, c3) => Q(c3, "That'll do. That'll more than do.") },
          { id: "say", label: "A say in where we fly", fx: { trust: 2, morale: 3, flag: { routeSay: true } }, say: (m3, c3) => Q(c3, "A say. I'll use it sparingly. Mostly.") },
        ]) });
        if (hi(c.t, "greed")) choices.push({ id: "raise", label: "Stay for a raise — twenty percent", fx: { wage: 1.2, trust: 3, morale: 6, flag: "promised" }, say: (m2, c2) => Q(c2, "Twenty. You've got me and my whole watch.") });
        choices.push({ id: "later", label: "Ask me at the next port", fx: { trust: 1 }, say: (m2, c2) => Q(c2, "I'll ask.") });
      } else {
        choices.push({ id: "fast", label: "Think fast", fx: { trust: -2 }, say: (m2, c2) => Q(c2, "Then the answer's no, for now.") });
        choices.push({ id: "time", label: "Take your time", fx: { trust: 2, morale: 1 }, say: (m2, c2) => Q(c2, "…that's why I might.") });
      }
      const text = loyal ? V("promise_yes", `${m.id}:p:${c.cycle}`) : V("promise_no", `${m.id}:pn:${c.cycle}`);
      return { text: Q(c, text), choices };
    },
  },
  /* THE CONN — tier 3 */
  {
    id: "captaincy", label: "Could you hold the conn?", tier: 3, cooldown: 6, need: { friend: "confidant", morale: "steady" },
    say(m, c) {
      return { text: Q(c, V("conn", `${m.id}:conn:${c.cycle}`)), choices: [
        { id: "yes", label: "Then you'll have it, when it counts", cls: "accent", fx: { trust: 3, morale: 3, flag: "connOffered" }, say: (m2, c2) => go(c2, `Aye. ${trustOf(m2) >= 90 ? "I won't let her down." : "I'll be on the bridge."} Then teach me your habits. How do you take a gravity well?`, [
          { id: "close", label: "Close and slow", fx: { trust: 1, flag: { connStyle: "close" } }, say: (m3, c3) => Q(c3, "Close and slow. Saves fuel and scares the passengers. Noted.") },
          { id: "wide", label: "Wide and fast", fx: { trust: 1, flag: { connStyle: "wide" } }, say: (m3, c3) => Q(c3, "Wide and fast. Burns more, and nobody's ever died of a wide line. Noted.") },
        ]) },
        { id: "no", label: "Not yet", fx: { morale: -1 }, say: (m2, c2) => Q(c2, "Fair. Ask again.") },
      ] };
    },
  },
];

/* ---- robots: three topics, no wage, no dinner --------------------------------- */

export const ROBOT_TOPICS = [
  {
    id: "status", label: "Status", tier: 0,
    say(m, c) {
      const here = dutyOf(m);
      const cond = Math.round(m.condition ?? 100);
      const text = Q(c, `Condition ${cond}%. ${m.idle ? "Below service threshold — idle. Service at a yard." : `Posted to ${here?.name ?? "no station"}${m.duty ? " by directive" : " by design"}. Draw ${m.kw ?? 1} kW.`}`);
      return { text, choices: [{ id: "ok", label: "Carry on", fx: {}, say: (m2, c2) => Q(c2, "Continuing.") }] };
    },
  },
  {
    id: "diagnostic", label: "Diagnostic", tier: 0,
    say(m, c) {
      const w = Math.round(duties.wear * 100);
      const text = Q(c, `Hull maintenance backlog ${w}%. ${w > 60 ? "Recommend a hand or unit at Engineering immediately." : w > 30 ? "Within tolerance. Engineering coverage advised." : "Nominal."} Own condition ${Math.round(m.condition ?? 100)}%${(m.condition ?? 100) < 50 ? " — degradation accelerating with backlog" : ""}.`);
      return { text, choices: [{ id: "ack", label: "Acknowledged", fx: {}, say: (m2, c2) => Q(c2, "Logged.") }] };
    },
  },
  {
    id: "directive", label: "Directive", tier: 0,
    say(m, c) {
      const opts = dutyOptions();
      const choices = opts.slice(0, 4).map((o) => ({ id: `post:${o.kind}`, label: `Post to ${o.label}`, cls: m.duty === o.kind ? "accent" : "", fx: { duty: o.kind }, say: (m2, c2) => Q(c2, `Directive accepted. Relocating to ${o.label}.`) }));
      choices.push({ id: "auto", label: "Default station", fx: { duty: null }, say: (m2, c2) => Q(c2, "Reverting to design station.") });
      return { text: Q(c, `Awaiting directive. Current post: ${m.duty ? KIND_LABEL[m.duty] ?? m.duty : "design default"}.`), choices };
    },
  },
];
