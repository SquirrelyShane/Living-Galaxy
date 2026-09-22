/* LIVING GALAXY — the next part of the conversation.
 *
 * 0.3.17. The talk tree used to be a list of openers: pick one, hear a line,
 * pick an answer, hear a line, done — and the next time you sat down with
 * that hand it was a fresh conversation. The flags the tree set (`hopeBacked`,
 * `longLane`, `looksAfter`, `watchesReactor`, `kidBerth`, `connOffered`) were
 * written and never read by anything.
 *
 * These topics are the other end of those threads. Each one only appears
 * because of something said before, reads the ship as it is now — the mate
 * you said you'd look after and how their morale has actually moved, what
 * payroll actually did since you promised it, how much the hope fund actually
 * holds, what is actually in the lockers — and carries on from there, with
 * choices that answer it. A thread can close, loop back, or leave a new flag
 * for the next part.
 *
 * The labels start with ↻ so a continuing conversation reads as one.
 */

import { crew, crewHooks, firstName, rapportBetween } from "../crew.js";
import { sim, logEvent } from "../sim.js";
import { duties, wearLine } from "./duties.js";
import { baseValue } from "../materials.js";

const Q = (c, s) => `${c.f}: "${s}"`;
const go = (c, text, choices) => ({ text: Q(c, text), choices });
const hi = (t, k) => (t?.[k] ?? 0.5) > 0.6;
const F = (c) => c.memory.flags;
const mate = (id) => crew.aboard.find((x) => x.id === id) ?? null;

/** Credits the fund holds for a hand: what they put aside plus what the captain matched. */
export function hopeFundOf(m) {
  return Math.round(m?.memory?.flags?.hopeSaved ?? 0);
}

export const THREADS = [
  /* hopes → "I'll help you get there" */
  {
    id: "t-hope", label: "↻ That thing you're saving for", cls: "thread", tier: 1, cooldown: 3,
    when: (m, c) => F(c).hopeBacked === true && c.cycle - (F(c).hopeAt ?? c.cycle) >= 2,
    say(m, c) {
      const fund = hopeFundOf(m);
      const missed = F(c).hopeMissed ?? 0;
      const goal = hi(c.t, "greed") ? "the hull" : hi(c.t, "curiosity") ? "the ring" : "it";
      const text = F(c).hopeFund
        ? `The fund's at ${fund.toLocaleString("en-US")} credits.${missed ? ` You missed the match ${missed} time${missed === 1 ? "" : "s"} — I noticed.` : ""} Slow. But it's real, and nobody's ever made ${goal} real for me before.`
        : `I still think about ${goal}. You said you'd help. I haven't forgotten you said it.`;
      return go(c, text, [
        { id: "keep", label: "Keep at it", fx: { trust: 1, morale: 1 }, say: (m2, c2) => Q(c2, "Aye. Cycle by cycle.") },
        { id: "gift", label: "Here — 250 for the fund", cls: "accent", fx: { credits: -250, trust: 4, morale: 4 }, say: (m2, c2) => { m2.memory.flags.hopeSaved = (m2.memory.flags.hopeSaved ?? 0) + 250; return Q(c2, `…${hopeFundOf(m2).toLocaleString("en-US")}. Captain, I don't know what to say. So I won't.`); } },
        { id: "change", label: "Things change", cls: "danger", fx: { trust: -5, morale: -4, unflag: "hopeBacked" }, say: (m2, c2) => Q(c2, "…they do. I'll stop bringing it up.") },
      ]);
    },
  },
  /* mess talk → "I'll talk to <them>" */
  {
    id: "t-looked", label: (m, c) => `↻ How's ${firstName(mate(F(c).looksAfter) ?? { name: "they" })} doing?`, cls: "thread", tier: 1, cooldown: 2,
    when: (m, c) => typeof F(c).looksAfter === "string" && Boolean(mate(F(c).looksAfter)) && c.cycle - (F(c).looksAfterAt ?? c.cycle) >= 1,
    say(m, c) {
      const o = mate(F(c).looksAfter);
      const n = firstName(o);
      const was = F(c).looksAfterMorale ?? 50, now = Math.round(o.morale ?? 70);
      const d = now - was;
      const text = d >= 8 ? `Better. Eating with the rest of us again. Whatever you said to ${n}, it landed.`
        : d <= -8 ? `Worse, if anything. Did you actually talk to ${n}, captain? Because it doesn't look like anybody did.`
        : `About the same. ${n}'s not sinking, but not coming up either.`;
      return go(c, text, [
        d <= -8
          ? { id: "will", label: "Not yet — I will", fx: { trust: -1, flag: { looksAfterAt: c.cycle, looksAfterMorale: now } }, say: (m2, c2) => Q(c2, "Soon, then. I'll keep an eye out till you do.") }
          : { id: "did", label: "I did. Keep an eye on them", fx: { trust: 2, rapport: { with: o.id, d: 3 } }, say: (m2, c2) => Q(c2, `I will. ${n} would never ask, so I'll just be there.`) },
        { id: "done", label: "Then that's done", fx: { unflag: "looksAfter" }, say: (m2, c2) => Q(c2, d >= 8 ? "It's done. Good work, captain." : "…if you say so.") },
      ]);
    },
  },
  /* the run → "Watch the reactor for me" */
  {
    id: "t-reactor", label: "↻ Anything on the reactor?", cls: "thread", tier: 0, cooldown: 2,
    when: (m, c) => Boolean(F(c).watchesReactor),
    say(m, c) {
      const w = Math.round(duties.wear * 100);
      const alarms = F(c).reactorAlarms === "all" ? "Every alarm's on my panel, like you said." : F(c).reactorAlarms === "red" ? "Only the reds come to my bunk." : "";
      const text = `${wearLine()} Backlog's at ${w} percent. ${alarms} ${w > 60 ? "I want an engineer on it before the next burn." : w > 30 ? "Nothing that'll hurt us this leg." : "She's running sweet."}`.replace(/\s+/g, " ");
      return go(c, text, [
        w > 30
          ? { id: "post", label: "Post somebody to Engineering", cls: "accent", fx: { trust: 2 }, say: (m2, c2) => Q(c2, "Then do it on the duty board — I'll brief whoever it is.") }
          : { id: "good", label: "Good. Keep watching", fx: { trust: 1 }, say: (m2, c2) => Q(c2, "Always.") },
        { id: "stop", label: "You can stand down on it", fx: { unflag: "watchesReactor", morale: 1 }, say: (m2, c2) => Q(c2, "Aye. I'll still look. I just won't report it.") },
      ]);
    },
  },
  /* the run → "Keep the tally" */
  {
    id: "t-tally", label: "↻ The tally", cls: "thread", tier: 0, cooldown: 3,
    when: (m, c) => F(c).keepsTally != null,
    say(m, c) {
      let units = 0, worth = 0, ports = 0;
      for (const [, locker] of Object.entries(sim.stash ?? {})) {
        let any = false;
        for (const [id, q] of Object.entries(locker ?? {})) { if (q > 0) { units += q; worth += q * baseValue(id) * 10; any = true; } }
        if (any) ports++;
      }
      const text = units > 0
        ? `${Math.round(units).toLocaleString("en-US")} units in lockers across ${ports} port${ports === 1 ? "" : "s"}. At book that's about ${Math.round(worth).toLocaleString("en-US")} credits we haven't sold cheap. That's the tally.`
        : "Nothing stashed yet. The tally's zero, and zero's a bad number for a ledger, captain.";
      return go(c, text, [
        { id: "more", label: "Keep counting", fx: { trust: 1 }, say: (m2, c2) => Q(c2, "I never stop.") },
        { id: "enough", label: "Enough counting", fx: { unflag: "keepsTally" }, say: (m2, c2) => Q(c2, "Your ledger. I'll count in my head.") },
      ]);
    },
  },
  /* the run → "Next time, the long lane" → "If there's time" */
  {
    id: "t-marker", label: "↻ That survey marker", cls: "thread", tier: 0, cooldown: 4,
    when: (m, c) => F(c).markerPromised === true,
    say(m, c) {
      const busy = Boolean(c.mission);
      return go(c, busy ? `We're on ${c.mission.name ?? "a run"}. I know. I'm just reminding you there's an hour on the long lane with my name on it.` : "No run on. The long lane's right there, captain. One hour at the marker.", [
        { id: "next", label: "Next empty run", fx: { morale: 2 }, say: (m2, c2) => Q(c2, "Next empty run. I'm writing it on the board.") },
        { id: "went", label: "We'll go now", cls: "accent", fx: { morale: 8, trust: 3, unflag: "markerPromised", flag: { markerSeen: true } }, say: (m2, c2) => Q(c2, "…now? Captain, I'll get my coat. Well. I'll get the scope.") },
        { id: "never", label: "It's not happening", cls: "danger", fx: { morale: -5, trust: -3, unflag: "markerPromised" }, say: (m2, c2) => Q(c2, "Then don't say 'if there's time' next time.") },
      ]);
    },
  },
  /* last berth → "On the cycle, every cycle" */
  {
    id: "t-pay", label: "↻ About payroll", cls: "thread", tier: 0, cooldown: 2,
    when: (m, c) => F(c).payPromise === true && ((crew.lastPay?.shortfall ?? 0) > 0 || (!F(c).payKept && c.cycle - (F(c).payFrom ?? c.cycle) >= 5)),
    say(m, c) {
      const short = crew.lastPay?.shortfall ?? 0;
      if (short > 0) {
        return go(c, `You said every cycle. Payroll came up ${short} short. I'm asking once.`, [
          { id: "settle", label: `Settle the ${short} now`, cls: "accent", fx: { credits: -short, trust: 6, morale: 6 }, say: (m2, c2) => { crew.lastPay = { ...(crew.lastPay ?? {}), shortfall: 0 }; return Q(c2, "Squared. That's all I wanted."); } },
          { id: "tight", label: "Things are tight", fx: { trust: -6, morale: -4 }, say: (m2, c2) => Q(c2, "They're tight for all of us. You're the one who promised.") },
        ]);
      }
      return go(c, "Five cycles, paid on the day, every one. I said I'd remember you said it. I remember you did it, too.", [
        { id: "always", label: "Always will", fx: { trust: 3, morale: 2, flag: { payKept: true } }, say: (m2, c2) => Q(c2, "I believe you. That's rarer than you'd think.") },
      ]);
    },
  },
  /* fears → "I'll keep you safe" → how */
  {
    id: "t-fear", label: "↻ Sleeping any better?", cls: "thread", tier: 1, cooldown: 6,
    when: (m, c) => Boolean(F(c).fearAnswer),
    say(m, c) {
      const how = F(c).fearAnswer === "seals" ? "You've signed every check I've brought you. I've started sleeping through the shift change." : "Two on the lock. It's stupid how much that helps.";
      return go(c, how, [
        { id: "good", label: "Good. That's the point", fx: { trust: 2, morale: 2 }, say: (m2, c2) => Q(c2, "I know. Thank you for making it the point.") },
        { id: "drop", label: "We can stop that now", fx: { morale: -2, unflag: "fearAnswer" }, say: (m2, c2) => Q(c2, "…if you think so. I'll manage.") },
      ]);
    },
  },
  /* fears → "We all carry one" → the captain's own */
  {
    id: "t-yourfear", label: "↻ What you said, the other watch", cls: "thread", tier: 1, once: true,
    when: (m, c) => F(c).sharedFear === "ship" || F(c).sharedFear === "crew",
    say(m, c) {
      const what = F(c).sharedFear === "crew" ? "losing the crew" : "losing the ship";
      return go(c, `You said you were afraid of ${what}. I've been thinking about it. You're not going to — not while I'm on the watch.`, [
        { id: "thanks", label: "…thank you", fx: { trust: 4, morale: 3 }, say: (m2, c2) => Q(c2, "Don't. Just fly well.") },
        { id: "cant", label: "You can't promise that", fx: { trust: 2 }, say: (m2, c2) => Q(c2, "No. But I can mean it.") },
      ]);
    },
  },
  /* partner → "Next port, the night's yours" */
  {
    id: "t-night", label: "↻ That night off", cls: "thread", tier: 1, cooldown: 3,
    when: (m, c) => F(c).nightOff === true && c.docked && c.partner && c.partner.id !== "player",
    say(m, c) {
      const pf = firstName(c.partner);
      return go(c, `We're on the clamps. You said the night was ours — ${pf} and me.`, [
        { id: "take", label: "Take it. Both of you", cls: "accent", fx: { morale: 6, partnerMorale: 6, trust: 3, rapport: { with: "partner", d: 6 }, unflag: "nightOff" }, say: (m2, c2) => Q(c2, "We'll be back before the watch. …probably.") },
        { id: "later", label: "Not this port", fx: { morale: -3, trust: -2 }, say: (m2, c2) => Q(c2, "The next one, then. You did say it.") },
      ]);
    },
  },
  /* kids → "I'll teach them myself" */
  {
    id: "t-kid", label: "↻ The kid at the board", cls: "thread", tier: 1, cooldown: 5,
    when: (m, c) => F(c).kidTeacher === "captain" && c.kids.length > 0,
    say(m, c) {
      const k = c.kids[0]?.name.split(" ")[0] ?? "the kid";
      return go(c, `${k} keeps asking when the captain's going to show them the board. I said you'd promised. Don't make me a liar.`, [
        { id: "now", label: "Bring them up next watch", cls: "accent", fx: { trust: 4, morale: 4 }, say: (m2, c2) => Q(c2, `${k} won't sleep tonight. Thank you.`) },
        { id: "busy", label: "When things are quieter", fx: { trust: -2 }, say: (m2, c2) => Q(c2, "Things are never quieter. That's the whole trouble.") },
      ]);
    },
  },
  /* wage → "Ten more cycles aboard" */
  {
    id: "t-raise", label: "↻ It's been ten cycles", cls: "thread", tier: 1, cooldown: 3,
    when: (m, c) => F(c).raiseOn === "tenure" && c.cycle >= (F(c).raiseAt ?? Infinity),
    say(m, c) {
      return go(c, `Ten cycles, captain. You said ten, and I'm still here. ${m.wage} a cycle.`, [
        { id: "raise", label: "Ten percent — earned", cls: "accent", fx: { wage: 1.1, trust: 5, morale: 6, unflag: "raiseOn" }, say: (m2, c2) => Q(c2, "Earned. That's the word I wanted.") },
        { id: "not", label: "Not yet", cls: "danger", fx: { trust: -6, morale: -6, unflag: "raiseOn" }, say: (m2, c2) => Q(c2, "…then I'll stop counting. You might want to start.") },
      ]);
    },
  },
  /* captaincy → habits at the conn */
  {
    id: "t-conn", label: "↻ Your habits at the conn", cls: "thread", tier: 2, once: true,
    when: (m, c) => Boolean(F(c).connStyle),
    say(m, c) {
      const style = F(c).connStyle === "close" ? "close and slow" : "wide and fast";
      return go(c, `I've been practising it your way — ${style}. On the sim, not the ship. Want to see my numbers?`, [
        { id: "see", label: "Show me", fx: { trust: 3 }, say: (m2, c2) => Q(c2, "Better than last week, worse than you. That's where I want to be for now.") },
        { id: "trust", label: "I trust them", fx: { trust: 2, morale: 3 }, say: (m2, c2) => Q(c2, "Then I'll stop showing and start doing.") },
      ]);
    },
  },
  /* record → "Tell me" */
  {
    id: "t-story", label: "↻ About what I told you", cls: "thread", tier: 1, once: true,
    when: (m, c) => F(c).toldStory === true,
    say(m, c) {
      return go(c, "That story. I haven't told it on any other ship. You haven't repeated it — I'd have heard.", [
        { id: "yours", label: "It's yours to tell", fx: { trust: 4 }, say: (m2, c2) => Q(c2, "Aye. And now it's a bit yours too.") },
      ]);
    },
  },
  /* mates → "Sort it out with <them>" */
  {
    id: "t-mend", label: (m, c) => `↻ You and ${firstName(mate(F(c).mending) ?? { name: "them" })}`, cls: "thread", tier: 1, cooldown: 3,
    when: (m, c) => typeof F(c).mending === "string" && Boolean(mate(F(c).mending)),
    say(m, c) {
      const o = mate(F(c).mending);
      const n = firstName(o);
      const r = rapportBetween(m, o);
      const text = r >= 55 ? `${n} and I are fine now. Better than fine, some watches. You were right to push.`
        : r >= 30 ? `${n} and I are… civil. We did the one mess shift. Nobody died.`
        : `It didn't take. ${n} and I tried. We're better apart.`;
      return go(c, text, [
        { id: "good", label: r >= 30 ? "That's enough" : "Then keep your distance", fx: { unflag: "mending", trust: 1 }, say: (m2, c2) => Q(c2, "Aye.") },
        { id: "again", label: "Try once more", fx: { rapport: { with: o.id, d: r >= 30 ? 4 : 6 }, trust: -1 }, say: (m2, c2) => Q(c2, `…once more. For you, not for ${n}.`) },
      ]);
    },
  },
];

/* ---- the fund, cycle by cycle -------------------------------------------------
 * "Put it aside — I'll match it" is a promise with a price: every cycle the hand
 * puts a tenth of the wage in, and the ship matches it or it doesn't. */
function tickThreads() {
  for (const m of crew.aboard) {
    if (m.robot || !m.memory?.flags) continue;
    const f = m.memory.flags;
    if (f.payPromise && f.payFrom == null) f.payFrom = m.cyclesAboard ?? 0;
    if (!f.hopeBacked || !f.hopeFund) continue;
    const slice = Math.max(1, Math.round((m.wage ?? 50) * 0.1));
    f.hopeSaved = (f.hopeSaved ?? 0) + slice;
    if (f.hopeFund === "matched") {
      if ((sim.ship?.credits ?? 0) >= slice) { sim.ship.credits -= slice; f.hopeSaved += slice; }
      else { f.hopeMissed = (f.hopeMissed ?? 0) + 1; m.morale = Math.max(0, (m.morale ?? 70) - 2); logEvent(`Missed ${m.name}'s fund match (${slice} cr)`, "crew"); }
    }
  }
}
if (!crewHooks.cycle.includes(tickThreads)) crewHooks.cycle.push(tickThreads);
