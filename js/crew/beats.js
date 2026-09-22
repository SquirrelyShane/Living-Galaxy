/* Living Galaxy — staged social acts.
 *
 * A beat is a short scene: a few stages, each waiting on the captain's answer,
 * a progress bar that moves when you answer, and an ending that is a buff
 * (trust / morale / spark) or a debuff — with the odds moved by what you said
 * on the way (0.3.17; it used to play itself on a timer). Nothing here is
 * explicit; addons may register extra beats through hooks.js.
 */

import { crew, crewHooks, firstName } from "../crew.js";
import { adjustMorale, adjustTrust, trustOf, social, loadSocial, playerAsPerson, couldCourt, pairWithPlayer } from "../family.js";
import { adjustRapport } from "./bonds.js";
import { moment, attraction } from "./romance.js";
import { runHooks } from "./hooks.js";
import { sim } from "../sim.js";

const hi = (t, k) => (t?.[k] ?? 0.5) > 0.6;
const lo = (t, k) => (t?.[k] ?? 0.5) < 0.4;
const Q = (m, s) => `${firstName(m)}: "${s}"`;


function roll(m, id) {
  const s = `${m.id}:${id}:${Math.round(sim.time ?? 0)}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/**
 * Apply what a beat resolved to, and report what actually landed.
 *
 * `o.with` is the other party. A captain's beat has none — you are not on the
 * crew's own ladder — so a `spark` with nobody to spark with used to be
 * dropped on the floor while the tag still promised it. It now goes where the
 * player's side of a relationship actually lives: trust.
 */
function applyOutcome(m, o) {
  const applied = { trust: 0, morale: 0, rapport: 0, spark: 0 };
  const other = o.with && o.with !== "player" ? o.with : null;
  if (o.trust) { adjustTrust(m, o.trust); applied.trust += o.trust; }
  if (o.morale) { adjustMorale(m, o.morale); applied.morale += o.morale; }
  if (o.rapport && other) { adjustRapport(m, other, o.rapport); applied.rapport += o.rapport; }
  if (o.spark) {
    if (other) { moment(m, other, o.sparkKind ?? "talk", o.spark); applied.spark += o.spark; }
    else { const d = o.spark * 3; adjustTrust(m, d); applied.trust += d; }
  }
  return applied;
}

/** Chance an act lands, from trust, morale, and whether they are drawn to you. */
function odds(m, kind) {
  loadSocial();
  const trust = trustOf(m);
  const morale = m.morale ?? 70;
  let p = 0.38 + trust / 220 + (morale - 50) / 280;
  if (kind === "romance") {
    if (social.romance === "off") return 0;
    if (m.partner && m.partner !== "player") p -= 0.25;
    if (m.partner === "player") p += 0.18;
    /* the ledger's own idea of who the captain is — the hand-built stand-in
     * had no race and no traits, so half of what attraction() reads was blank */
    p += (attraction(m, playerAsPerson()) || 0) * 0.15;
  }
  if (lo(m.traits, "loyalty") && kind === "friend") p -= 0.06;
  return Math.max(0.08, Math.min(0.92, p));
}


/* 0.3.17 — a beat is a scene the captain plays, not one that plays itself.
 *
 * It used to run on a setInterval: three unconnected lines drawn from three
 * separate bags of the voice bank, a progress bar filling on its own, and an
 * outcome rolled at the end with nothing the captain did in between. Now each
 * core beat is a SCENE: stages written to follow one another, each waiting on
 * the captain's answer, and what the captain says moves the odds the scene
 * lands (`lean`, per choice, and per trait where a hand would care). The bar
 * moves when you answer and not before; "Let it drop" still walks away.
 *
 * A beat that only has `steps()` (an addon's) still works: each line waits on
 * a "Go on".
 *
 *   stage  { line, choices: [{ id, label, lean?, say?(m) → the hand's reply }] }
 */
const who = (m) => firstName(m);
const tr = (m) => m.traits ?? {};
/* a lean that depends on who they are: pickLean(m, { caution: 0.1, grit: -0.05, else: 0 }) */
function pickLean(m, table) {
  for (const k of Object.keys(table)) if (k !== "else" && hi(tr(m), k)) return table[k];
  return table.else ?? 0;
}
function pickLine(m, table) {
  for (const k of Object.keys(table)) if (k !== "else" && hi(tr(m), k)) return table[k];
  return table.else;
}
const You = (s) => `You: "${s}"`;

export const CORE_BEATS = [
  {
    id: "watch",
    label: "Stand a watch with them",
    kind: "friend",
    when: (m) => !m.robot,
    scene: (m) => [
      { line: `You take the board next to ${who(m)}. The hull ticks. ${Q(m, pickLine(m, { caution: "Quiet one. I don't trust quiet ones.", curiosity: "Quiet one tonight. Good for looking.", else: "Quiet one tonight." }))}`,
        choices: [
          { id: "good", label: "Quiet's good", lean: pickLean(m, { caution: -0.04, else: 0.05 }), say: () => You("Quiet's good.") },
          { id: "trust", label: "Why don't you trust it?", lean: pickLean(m, { caution: 0.1, else: 0.02 }), say: () => You("Why don't you trust it?") },
          { id: "silent", label: "Say nothing. Watch the board", lean: pickLean(m, { grit: 0.1, caution: 0.06, else: -0.02 }), say: () => "You say nothing. The board glows." },
        ] },
      { line: Q(m, pickLine(m, { caution: "Because the last time it was this quiet, a seal went on the aft trunk and nobody heard it for an hour. I counted every minute after.", curiosity: "Did you ever count the stars on the long board? I lost count at four hundred once, on my first ship.", greed: "Quiet watches are paid the same as busy ones. Best rate in the trade, if you think about it.", loyalty: "I like it quiet with somebody on the next seat. Alone it's a different thing.", else: "Quiet's when you hear the ship. Every hull has a voice, if you sit long enough." })),
        choices: [
          { id: "more", label: "Tell me more", lean: 0.08, say: () => You("Tell me more.") },
          { id: "light", label: "Make a joke of it", lean: pickLean(m, { grit: 0.06, caution: -0.08, else: 0 }), say: () => You("And here I thought you just liked the chair.") },
          { id: "eyes", label: "Eyes on the board", lean: pickLean(m, { grit: 0.04, else: -0.1 }), say: () => You("Eyes on the board.") },
        ] },
      { line: `An hour goes by like that. A contact drifts across the far edge of the board and ${who(m)} calls it before you do.`,
        choices: [
          { id: "catch", label: "Good catch", lean: 0.08, say: () => You("Good catch.") },
          { id: "saw", label: "I saw it", lean: -0.06, say: () => You("I saw it.") },
        ] },
    ],
    resolve(m, rng) {
      const ok = rng() < odds(m, "friend");
      if (ok) return { ok, trust: 4, morale: 3, line: Q(m, pickLine(m, { loyalty: "Same seat next watch, captain? I'll bring the coffee.", grit: "You'll do. Same time tomorrow.", else: "That was a good watch. Same time next one?" })), tag: "+trust +morale" };
      return { ok, trust: -2, morale: -1, line: Q(m, pickLine(m, { grit: "I'll take the rest of it alone, if it's all the same.", else: "…I think I'd rather finish this one by myself, captain." })), tag: "−trust −morale" };
    },
  },
  {
    id: "mess",
    label: "Share the mess",
    kind: "friend",
    when: (m) => !m.robot,
    scene: (m) => [
      { line: `You sit. ${who(m)} looks at the empty chair first, then at you. ${Q(m, "Captain's table is the other end, you know.")}`,
        choices: [
          { id: "here", label: "The food's the same here", lean: 0.07, say: () => You("The food's the same at this end.") },
          { id: "rank", label: "Not tonight it isn't", lean: pickLean(m, { loyalty: 0.08, greed: -0.02, else: 0.03 }), say: () => You("Not tonight it isn't.") },
          { id: "ask", label: "Mind if I sit?", lean: pickLean(m, { caution: 0.08, else: 0.04 }), say: () => You("Mind if I sit?") },
        ] },
      { line: `${Q(m, "Suit yourself.")} ${who(m)} pushes the salt over without being asked. ${Q(m, pickLine(m, { greed: "Did you see what the port wanted for protein this cycle? Robbery. I'd have hauled it myself.", curiosity: "There's a cook on the ring who puts real pepper in things. Real, off a planet. I've been thinking about it for three days.", loyalty: "The others eat faster when you're not here. They'll slow down now.", else: "It's the same stew as yesterday. It'll be the same stew tomorrow. There's a comfort in it." }))}`,
        choices: [
          { id: "listen", label: "Ask them to go on", lean: 0.08, say: () => You("Go on.") },
          { id: "share", label: "Tell them about your day", lean: pickLean(m, { curiosity: 0.08, else: 0.02 }), say: () => You("You won't believe the day I've had.") },
          { id: "shop", label: "Talk about the run", lean: pickLean(m, { greed: 0.04, else: -0.08 }), say: () => You("While I've got you — the run.") },
        ] },
      { line: `The stew goes down. Somebody at the next table laughs at something, and ${who(m)} nearly does too.`,
        choices: [
          { id: "stay", label: "Stay for another cup", lean: 0.07, say: () => You("Another cup?") },
          { id: "go", label: "Leave them to it", lean: -0.02, say: () => "You get up and leave them to it." },
        ] },
    ],
    resolve(m, rng) {
      const ok = rng() < odds(m, "friend") + 0.08;
      if (ok) return { ok, trust: 3, morale: 5, line: Q(m, pickLine(m, { greed: "Next time you're buying. Well — the ship's buying. Same thing.", else: "Come back tomorrow. Bring the salt." })), tag: "+trust +morale" };
      return { ok, trust: -1, morale: -2, line: Q(m, "…the mess is where we get away from the bridge, captain. Just so you know."), tag: "−morale" };
    },
  },
  {
    id: "confide",
    label: "Ask what they're carrying",
    kind: "friend",
    when: (m) => !m.robot && trustOf(m) >= 20,
    scene: (m) => [
      { line: `You catch ${who(m)} after the watch, away from the mess. ${Q(m, "Captain. Something wrong?")}`,
        choices: [
          { id: "you", label: "That's what I'm asking you", lean: 0.06, say: () => You("That's what I'm asking you.") },
          { id: "noticed", label: "You've been quiet", lean: pickLean(m, { caution: 0.08, grit: -0.04, else: 0.04 }), say: () => You("You've been quiet. I noticed.") },
          { id: "order", label: "Out with it", lean: pickLean(m, { grit: 0.04, else: -0.1 }), say: () => You("Out with it.") },
        ] },
      { line: `${who(m)} looks down the corridor, both ways. ${Q(m, pickLine(m, { greed: "It's money. It's always money. There's somebody back home I owe, and they've started writing.", loyalty: "Somebody from my old crew didn't make it. I heard at the last port. I haven't said.", caution: "I keep thinking about the last bad burn. I did everything right, and it still nearly went.", curiosity: "I got an offer. A survey berth, out past the last beacon. I haven't said yes. I haven't said no.", grit: "It's nothing. It's a letter. I'll handle it.", else: "It's home. Things at home. I'm too far to do anything about it." }))}`,
        choices: [
          { id: "help", label: "What can I do?", lean: 0.08, say: () => You("What can I do?") },
          { id: "hear", label: "Just listen", lean: pickLean(m, { grit: 0.1, else: 0.06 }), say: () => "You say nothing, and let them keep going." },
          { id: "fix", label: "Tell them how to fix it", lean: pickLean(m, { caution: 0.03, else: -0.07 }), say: () => You("Here's what you do.") },
        ] },
      { line: `${Q(m, "…nobody's asked me that on this ship.")} The corridor lights cycle to night-watch blue.`,
        choices: [
          { id: "door", label: "My door's open", lean: 0.07, say: () => You("My door's open. Any watch.") },
          { id: "log", label: "Keep it off the log", lean: pickLean(m, { caution: 0.06, else: 0.03 }), say: () => You("This stays off the log.") },
        ] },
    ],
    resolve(m, rng) {
      const ok = rng() < odds(m, "friend");
      if (ok) return { ok, trust: 6, morale: 4, line: Q(m, "Thank you. I mean it. I'll sleep, I think."), tag: "+trust +morale" };
      return { ok, trust: -3, morale: -2, line: Q(m, "…forget I said anything, captain. I'll handle it."), tag: "−trust −morale" };
    },
  },
  {
    id: "walk",
    label: "Walk the port with them",
    kind: "romance",
    when: (m) => !m.robot && Boolean(sim.ship?.dockedAt) && social.romance !== "off",
    scene: (m) => [
      { line: `The lock cycles. ${who(m)} falls into step without being asked. ${Q(m, "Where are we going?")}`,
        choices: [
          { id: "nowhere", label: "Nowhere in particular", lean: 0.07, say: () => You("Nowhere in particular.") },
          { id: "market", label: "The market deck", lean: pickLean(m, { greed: 0.08, curiosity: 0.05, else: 0.02 }), say: () => You("The market deck.") },
          { id: "view", label: "The observation ring", lean: pickLean(m, { curiosity: 0.1, loyalty: 0.05, else: 0.03 }), say: () => You("The observation ring. I'm told you can see the belt.") },
        ] },
      { line: `The port hums around you — cargo sleds, a vendor calling prices, a child chasing a drone. ${Q(m, pickLine(m, { curiosity: "I love this. Every port smells different. This one smells like hot metal and oranges.", greed: "Look at those prices. We could sell half the hold here and the other half at the next ring.", caution: "Busy. I always feel like I'm about to lose somebody in a crowd like this.", else: "It's nice, being off the ship with nothing to do. I forget it's allowed." }))}`,
        choices: [
          { id: "close", label: "Walk a little closer", lean: pickLean(m, { caution: 0.06, else: 0.05 }), say: () => "You walk a little closer. Your sleeves brush." },
          { id: "ask", label: "Ask what they'd buy here", lean: 0.05, say: () => You("If you could take one thing from here back aboard?") },
          { id: "work", label: "Point out a buyer for the hold", lean: pickLean(m, { greed: 0.05, else: -0.1 }), say: () => You("That's a buyer for our ore, over there.") },
        ] },
      { line: `The ring turns you toward the viewport. The belt is a grey smear across the black, and ${who(m)} stops to look at it.`,
        choices: [
          { id: "look", label: "Stop and look with them", lean: 0.08, say: () => "You stop and look with them." },
          { id: "time", label: "Say you should get back", lean: -0.08, say: () => You("We should get back.") },
        ] },
    ],
    resolve(m, rng) {
      const ok = rng() < odds(m, "romance");
      if (ok) {
        const spark = m.partner === "player" ? 1.2 : 1;
        return { ok, trust: 5, morale: 6, spark, sparkKind: "walkout", line: Q(m, "…we should do this every port. I'm serious."), tag: "+trust +morale +spark" };
      }
      return { ok, trust: -2, morale: -3, line: Q(m, "It was a nice walk, captain. Let's leave it as a walk."), tag: "−trust −morale" };
    },
  },
  {
    id: "dinner",
    label: "Ask them to dinner",
    kind: "romance",
    /* the same gate the TALK topic uses: drawn to each other, not kin, and
     * enough trust to be asked. Without it the beat could pair you with
     * somebody who would have refused in conversation. */
    when: (m) => !m.robot && social.romance === "all" && m.partner !== "player"
      && (couldCourt(m).ok || Boolean(m.partner)),
    replaces: "court",
    scene: (m) => {
      const taken = m.partner && m.partner !== "player";
      if (taken) return [
        { line: `You say it in the corridor, not the mess — dinner, not a briefing. ${Q(m, "I'm already spoken for. You know that. Why are you asking it like this?")}`,
          choices: [
            { id: "sorry", label: "You're right. I'm sorry", lean: 0.1, say: () => You("You're right. I'm sorry.") },
            { id: "push", label: "Just dinner", lean: -0.1, say: () => You("It's just dinner.") },
          ] },
        { line: Q(m, "Don't put me in that position again. I like this crew. I like my life on it."), choices: [{ id: "ok", label: "Understood", lean: 0, say: () => You("Understood.") }] },
      ];
      return [
        { line: `You say it in the corridor, not the mess — dinner, not a briefing. ${who(m)} stops walking. ${Q(m, "Dinner. As in — dinner?")}`,
          choices: [
            { id: "yes", label: "As in dinner", lean: 0.08, say: () => You("As in dinner.") },
            { id: "casual", label: "Nothing formal", lean: pickLean(m, { caution: 0.08, else: 0.02 }), say: () => You("Nothing formal. Just us and something that isn't stew.") },
            { id: "shy", label: "Only if you want to", lean: pickLean(m, { grit: -0.04, else: 0.05 }), say: () => You("Only if you want to.") },
          ] },
        { line: `${Q(m, pickLine(m, { caution: "Somewhere off the ship. I don't want the whole mess watching.", curiosity: "There's a place on the ring with real pepper. If we're doing this, we're doing it there.", greed: "You're paying. Captain's wage.", else: "…alright. Where?" }))}`,
          choices: [
            { id: "ring", label: "Wherever you like", lean: 0.07, say: () => You("Wherever you like.") },
            { id: "cabin", label: "My cabin — I'll cook", lean: pickLean(m, { caution: -0.08, loyalty: 0.05, else: 0 }), say: () => You("My cabin. I'll cook.") },
          ] },
        { line: `Later. Two plates, one candle that is really a status lamp turned down. ${who(m)} is quiet for a while, then isn't.`,
          choices: [
            { id: "honest", label: "Tell them why you asked", lean: 0.08, say: () => You("I asked because I wanted to. That's the whole reason.") },
            { id: "light", label: "Keep it light", lean: 0, say: () => You("Good pepper, at least.") },
          ] },
      ];
    },
    resolve(m, rng) {
      if (m.partner && m.partner !== "player") {
        return { ok: false, trust: -4, morale: -2, line: Q(m, "No. And don't ask it like a joke next time."), tag: "−trust" };
      }
      const can = couldCourt(m);
      if (!can.ok) {
        return { ok: false, trust: -1, line: Q(m, can.why?.startsWith("not yet") ? "Ask me when you know me better than the duty board does." : "That isn't where we are."), tag: can.why ?? "" };
      }
      const ok = rng() < odds(m, "romance");
      if (ok) {
        /* one place does this, and it writes the ledger and the crew log */
        pairWithPlayer(m);
        return { ok, trust: 8, morale: 8, line: Q(m, "…ask me again next port. And the one after that."), tag: "together · +trust +morale" };
      }
      return { ok, trust: -3, morale: -1, line: Q(m, "It was kind. It's not what I want. I'm sorry, captain."), tag: "−trust" };
    },
  },
  {
    id: "evening",
    label: "An evening off the clock",
    kind: "romance",
    when: (m) => !m.robot && m.partner === "player" && social.romance !== "off",
    scene: (m) => [
      { line: `The duty board is someone else's problem for an hour. ${who(m)} kicks their boots off. ${Q(m, "No ship talk. Agreed?")}`,
        choices: [
          { id: "agreed", label: "Agreed", lean: 0.07, say: () => You("Agreed.") },
          { id: "one", label: "One bit of ship talk, then none", lean: -0.03, say: () => You("One bit. Then none.") },
        ] },
      { line: Q(m, pickLine(m, { curiosity: "Tell me something you've never told the crew. Anything. The weirder the better.", loyalty: "Tell me about before. Before this ship. I realised I don't know.", greed: "If we hit it big — really big — what's the first thing you'd buy?", else: "Tell me something. Anything that isn't a heading." })),
        choices: [
          { id: "true", label: "Tell them something true", lean: 0.09, say: () => You("Alright. Something true.") },
          { id: "funny", label: "Make them laugh", lean: pickLean(m, { grit: 0.06, else: 0.04 }), say: () => You("Did I ever tell you about my first docking?") },
          { id: "turn", label: "Turn it back on them", lean: -0.03, say: () => You("You first.") },
        ] },
      { line: `The hour runs long. Nobody checks the time.`,
        choices: [
          { id: "stay", label: "Stay a while longer", lean: 0.06, say: () => "You stay a while longer." },
          { id: "board", label: "Glance at the board", lean: -0.1, say: () => "You glance at the board. They notice." },
        ] },
    ],
    resolve(m, rng) {
      loadSocial();
      const ok = rng() < odds(m, "romance") + 0.1;
      if (ok) return { ok, trust: 5, morale: 7, line: Q(m, "That's the best hour I've had since we left port."), tag: "+trust +morale" };
      return { ok, trust: -2, morale: -4, line: Q(m, "…you were somewhere else tonight. It's fine. It's fine."), tag: "−morale" };
    },
  },
];

const running = new Map();

/** Stop whatever is playing. One captain, one conversation at a time. */
export function stopAllBeats() {
  for (const stop of [...running.values()]) { try { stop(); } catch { /* already gone */ } }
  running.clear();
}

export function beatsFor(m) {
  loadSocial();
  const extra = runHooks("beats").flat().filter(Boolean);
  return [...CORE_BEATS, ...extra].filter((b) => {
    try { return !b.when || b.when(m); } catch { return false; }
  });
}

export function isRunning(memberId) {
  return running.has(memberId);
}

/**
 * Play a beat as a scene. `onStep({ i, n, frac, line, choices, tag })` shows a
 * stage and the answers it waits on; `onDone(result)` fires once. Nothing
 * advances by itself — the returned stop() carries `.advance(choiceId)`,
 * which answers the stage on screen (any answer for a "Go on" stage), and
 * `.stage()` which reports it. stop() walks away without applying anything.
 *
 * What the captain answers moves the odds: every choice carries a `lean`,
 * summed and taken off the roll the beat's own resolve() makes (a roll under
 * the odds is a success), so an addon's resolve gets it for free.
 */
export function playBeat(m, beatId, { onStep, onDone, rng = Math.random } = {}) {
  const beat = beatsFor(m).find((b) => b.id === beatId);
  if (!beat) { onDone?.({ ok: false, line: "That isn't on the board.", tag: "" }); return Object.assign(() => {}, { advance: () => false, stage: () => null }); }
  if (running.has(m.id)) {
    /* the caller's handlers used to be dropped on the floor here, leaving the
     * panel waiting on a beat that was never theirs */
    onDone?.({ ok: false, line: "You are already in the middle of that.", tag: "busy", cancelled: true });
    return running.get(m.id);
  }
  /* one at a time, across the whole crew */
  stopAllBeats();

  let stages;
  try {
    if (typeof beat.scene === "function") stages = (beat.scene(m, { social }) ?? []).filter(Boolean);
    else {
      /* an addon's lines: each one waits on "Go on"; a null closes the list */
      const steps = (beat.steps?.(m, { social }) ?? []).filter((x) => x != null);
      stages = steps.map((line) => ({ line }));
    }
  } catch (err) { stages = []; console.warn("[beats] scene", beat.id, err); }
  if (!Array.isArray(stages) || !stages.length) stages = [{ line: "…" }];
  for (const st of stages) if (!Array.isArray(st.choices) || !st.choices.length) st.choices = [{ id: "go", label: "Go on", lean: 0 }];
  const n = stages.length;
  let i = 0;
  let lean = 0;
  let stopped = false;
  let carry = "";           // the captain's answer, said before the next stage's line
  const said = [];          // what was answered, stage by stage

  const pub = () => ({ i, n, frac: i / (n + 1), line: (carry ? `${carry} ` : "") + (stages[i]?.line || "…"), choices: stages[i].choices.map((c) => ({ id: c.id, label: c.label })), tag: beat.label, answered: said.slice() });

  const finish = (apply) => {
    if (stopped) return;
    stopped = true;
    running.delete(m.id);
    if (!apply) { onDone?.({ ok: false, line: "You let it drop.", tag: "stopped", cancelled: true }); return; }
    /* somebody who has walked off the ship does not finish the conversation */
    if (!crew.aboard.includes(m)) {
      onDone?.({ ok: false, line: `${firstName(m)} is not aboard any more.`, tag: "gone", cancelled: true });
      return;
    }
    const leaned = () => Math.max(0, Math.min(0.999, rng() - lean));
    let res;
    try { res = beat.resolve(m, leaned); } catch (err) { console.warn("[beats] resolve", beat.id, err); res = null; }
    res = res ?? { ok: false, line: "—", tag: "" };
    const applied = applyOutcome(m, res);
    /* the tag is what the player reads: build it from what actually landed so
     * it can never promise something the outcome did not do */
    if (!res.tag) {
      const bits = [];
      if (applied.trust) bits.push(`${applied.trust > 0 ? "+" : "−"}trust`);
      if (applied.morale) bits.push(`${applied.morale > 0 ? "+" : "−"}morale`);
      if (applied.spark) bits.push("+spark");
      res.tag = bits.join(" ") || (res.ok ? "buff" : "debuff");
    }
    res.applied = applied;
    res.lean = Math.round(lean * 100) / 100;
    res.answered = said.slice();
    if (carry) res.line = `${carry} ${res.line ?? ""}`.trim();
    onStep?.({ i: n, n, frac: 1, line: res.line, choices: [], tag: res.tag, ok: res.ok });
    onDone?.(res);
  };

  /** Answer the stage on screen. Returns false when there is nothing to answer. */
  const advance = (choiceId = null) => {
    if (stopped) return false;
    if (!crew.aboard.includes(m)) { finish(false); return false; }
    const st = stages[i];
    const ch = st.choices.find((c) => c.id === choiceId) ?? (st.choices.length === 1 || choiceId == null ? st.choices[0] : null);
    if (!ch) return false;
    lean += Number(ch.lean) || 0;
    said.push({ stage: i, choice: ch.id, label: ch.label });
    let reply = "";
    try { reply = typeof ch.say === "function" ? ch.say(m) ?? "" : ch.say ?? ""; } catch { reply = ""; }
    carry = reply;
    i += 1;
    if (i >= n) { finish(true); return true; }
    onStep?.(pub());
    return true;
  };

  const stop = () => finish(false);
  stop.advance = advance;
  stop.stage = () => (stopped ? null : pub());
  running.set(m.id, stop);
  onStep?.(pub());
  return stop;
}

/** Answer the stage a hand's beat is waiting on (the talk view's buttons). */
export function advanceBeat(memberId, choiceId = null) {
  const s = running.get(memberId);
  return s?.advance ? s.advance(choiceId) : false;
}

/* a new sky is a new crew: a stale entry here would lock somebody out of
 * every beat for the rest of the session */
if (!crewHooks.reset.includes(stopAllBeats)) crewHooks.reset.push(stopAllBeats);
