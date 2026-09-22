/* Living Galaxy — the topics a hand brings to YOU.
 *
 * Every other topic in the tree is the captain opening a subject. These three
 * come the other way: a hand decided something on their own watch (deckmind),
 * and now it is on the board to be dealt with.
 *
 *   wants — they asked for a word. Either a grievance (wages, or the state of
 *           the hull) or something they will not put in the log. Hearing them
 *           out costs a minute and buys trust; brushing it off does the
 *           opposite, and the grievance does not go away.
 *   watch — "how has your watch been?" reads their last filed decision back
 *           in their own words, including the reason they gave for it.
 *   blood — if the ledger says somebody aboard is family, they know.
 *
 */

import { crew, firstName, relatedTo } from "../crew.js";
import { wearLine } from "./duties.js";
import { journal } from "./journal.js";
import { kinLabel } from "../genome/spacer.js";

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export const WANT_TOPICS = [
  {
    id: "wants",
    label: (m) => (m.wants?.kind === "grievance" ? "⚑ They want a word — grievance" : "⚑ They want a word"),
    cls: "accent",
    tier: 0,
    when: (m) => Boolean(m.wants),
    say(m, c) {
      const grievance = m.wants?.kind === "grievance";
      const owed = crew.lastPay?.shortfall ?? 0;
      const text = grievance
        ? (owed
          ? `"${cap(c.f)} here. Payroll came up ${owed} short last cycle. I'm not the only one counting."`
          : `"It's the hull, captain. ${wearLine()} I'd rather say it to you than to the mess."`)
        : `"Got a minute? Nothing for the log. Just — a minute."`;
      const choices = [
        { id: "hear", label: "HEAR THEM OUT", fx: { trust: 6, morale: 4 } },
        grievance && owed
          ? { id: "settle", label: `SETTLE ${owed} CR`, cls: "accent", fx: { credits: -owed, trust: 10, morale: 10 } }
          : { id: "fix", label: "I'LL SEE TO IT", fx: { trust: 4, morale: 6 } },
        { id: "later", label: "NOT NOW", cls: "danger", fx: { trust: -5, morale: -4 } },
      ].filter(Boolean);
      return { text, choices };
    },
    reply(m, choiceId) {
      if (choiceId === "later") return `"…Right. Later."`;
      m.wants = null;
      if (choiceId === "settle") { crew.lastPay = { ...(crew.lastPay ?? {}), shortfall: 0 }; return `"Appreciated. I'll tell the others it's squared."`; }
      if (choiceId === "fix") { m.need && (m.need.grievance = Math.max(0, (m.need.grievance ?? 0) - 0.4)); return `"That's all I wanted to hear."`; }
      m.need && (m.need.grievance = Math.max(0, (m.need.grievance ?? 0) - 0.25));
      return `"Thanks, captain. That's it, that's all."`;
    },
  },
  {
    id: "watch",
    label: "How's your watch been?",
    tier: 0,
    cooldown: 2,
    when: (m) => Boolean(journal.last(m.id)),
    say(m, c) {
      const r = journal.last(m.id);
      if (!r) return `"Quiet enough."`;
      /* the last line of a trace is the commitment ("committed to EXERCISE");
       * the one before it is the reason a person would actually give */
      const chain = r.whatMadeMeActThis.reasoning;
      const why = chain[chain.length - 2] ?? chain[chain.length - 1] ?? "";
      const drive = r.observedSelf.dominantDrive;
      const limit = r.observedSelf.limitingFactor;
      const line = `"${cap(r.action.label)}, mostly. ${cap(why)}."`;
      const tail = limit ? ` ${cap(c.pr.subj)} ${c.pr.subj === "they" ? "are" : "is"} ${limit}.` : "";
      return {
        text: `${line}${tail}`,
        choices: [
          { id: "good", label: "GOOD WORK", fx: { trust: 3, morale: 4 } },
          { id: "more", label: `WHAT'S ${drive.toUpperCase()} ABOUT IT?`, fx: { trust: 2 } },
          { id: "nod", label: "NOD", fx: {} },
        ],
      };
    },
    reply(m, choiceId) {
      const r = journal.last(m.id);
      if (choiceId === "more" && r) {
        const taken = new Set(r.whatMadeMeActThis.path);
        const alts = r.whatMadeMeActThis.alternativesConsidered
          .filter((a) => a.rationale && !taken.has(a.option))
          .slice(0, 2);
        return alts.length
          ? `"I could have: ${alts.map((a) => a.rationale).join("; ")}. Went with what I went with."`
          : `"Nothing else was on the table, captain."`;
      }
      if (choiceId === "good") return `"Noted."`;
      return `"…"`;
    },
  },
  {
    id: "blood",
    label: "You two are related",
    tier: 1,
    cooldown: 8,
    when: (m) => crew.aboard.some((o) => o.id !== m.id && !o.robot && relatedTo(m, o) >= 0.1),
    say(m, c) {
      const kin = crew.aboard
        .filter((o) => o.id !== m.id && !o.robot && relatedTo(m, o) >= 0.1)
        .map((o) => ({ o, r: relatedTo(m, o) }))
        .sort((a, b) => b.r - a.r)[0];
      if (!kin) return `"Not that I know of."`;
      return {
        text: `"${kin.o.name}? ${cap(kinLabel(kin.r))}, going by the registry. We didn't plan it — the halls are smaller than they look."`,
        choices: [
          { id: "same", label: "PUT THEM ON THE SAME WATCH", fx: { rapport: { with: kin.o.id, d: 10 }, trust: 3 } },
          { id: "apart", label: "KEEP THEM APART", fx: { rapport: { with: kin.o.id, d: -4 }, trust: -1 } },
          { id: "drop", label: "LEAVE IT", fx: {} },
        ],
      };
    },
    reply(m, choiceId) {
      if (choiceId === "same") return `"Suits me. ${firstName(m)} works better with somebody who knows the shorthand."`;
      if (choiceId === "apart") return `"…Your ship, captain."`;
      return `"Fair enough."`;
    },
  },
];
