/* Living Galaxy — the DECK GRAPH: what a hand decides to do with their watch.
 *
 * The genome-agent project's decision graph is a 221-node brain for wolves,
 * fungi and golems. A crew member on a hull needs about a quarter of that and
 * none of the rest, so this is a purpose-built graph for one species in one
 * place: 53 nodes, built with the same engine (js/genome/behavior-graph.js),
 * validated by the same validator, traced the same way.
 *
 * The trace is the point. Every hop leaves a line of plain language behind it,
 * and those lines are what the journal prints as "what made me act this" —
 * so a hand who stops speaking to the cook has a readable reason on file,
 * three cycles before the captain notices.
 *
 * Gating is by capability, not by role: caps come off the genome (spacer.js),
 * so a synthetic hand never reaches the courting branch because `fertile` is
 * false for its entity type, not because a flag said "robot".
 *
 */

import { createGraph } from "../genome/behavior-graph.js";
import { kindPrior } from "./learn.js";

const act = (id, label, kind, why) => ({ type: "action", act: id, label, kind, why });

/** Every terminal action, with the label and category the journal prints. */
export const ACTION_META = {
  /* the watch */
  STAND_WATCH: { label: "stands their watch", kind: "duty" },
  PATCH_HULL: { label: "works the maintenance backlog", kind: "duty" },
  DRILL: { label: "runs a boarding drill", kind: "duty" },
  TREAT: { label: "holds sick call", kind: "care" },
  STOW: { label: "restows the hold", kind: "duty" },
  BOOK: { label: "squares the books", kind: "duty" },
  SCAN_WATCH: { label: "reads the scope", kind: "duty" },
  PLOT: { label: "works the plot", kind: "duty" },
  TEND: { label: "tends the growing racks", kind: "duty" },
  ASSAY: { label: "runs an assay", kind: "duty" },
  WORK_LINE: { label: "works the line", kind: "duty" },
  COVER_SHIFT: { label: "covers somebody else's watch", kind: "duty" },
  SLACK_OFF: { label: "finds somewhere to not be", kind: "idle" },
  TINKER: { label: "tinkers with something that was not broken yet", kind: "duty" },
  MENTOR: { label: "teaches a junior hand", kind: "care" },
  /* the emergency */
  BRACE: { label: "straps in and holds on", kind: "survival" },
  MAN_GUNS: { label: "mans a mount", kind: "combat" },
  REPEL_BOARDERS: { label: "meets boarders at the lock", kind: "combat" },
  EMERGENCY_PATCH: { label: "throws a patch at a live breach", kind: "survival" },
  HELP_OTHER: { label: "goes back for somebody", kind: "care" },
  /* the body */
  SLEEP: { label: "sleeps", kind: "rest" },
  NAP: { label: "gets their head down for an hour", kind: "rest" },
  EAT_MESS: { label: "eats", kind: "rest" },
  DRINK: { label: "drinks in the mess", kind: "social" },
  EXERCISE: { label: "works out", kind: "rest" },
  GROOM: { label: "cleans up", kind: "rest" },
  /* the others */
  TALK_TO: { label: "talks to somebody", kind: "social" },
  SHARE_MEAL: { label: "takes the mess shift with someone", kind: "social" },
  PLAY_CARDS: { label: "plays cards", kind: "social" },
  VENT_TO: { label: "tells a friend about it", kind: "social" },
  GOSSIP: { label: "passes on what they heard", kind: "social" },
  ARGUE: { label: "has it out with a rival", kind: "social" },
  MEND_FENCES: { label: "makes an approach to a rival", kind: "social" },
  AVOID: { label: "keeps out of the way", kind: "idle" },
  CONFRONT: { label: "raises a grievance", kind: "social" },
  ASK_CAPTAIN: { label: "wants a word with the captain", kind: "social" },
  SIT_WITH: { label: "sits with their partner", kind: "mate" },
  NOTICE_THEM: { label: "starts looking up when they come through", kind: "mate" },
  FLIRT: { label: "finds a reason to be where they are", kind: "mate" },
  GIVE_GIFT: { label: "gives them something", kind: "mate" },
  WALK_OUT: { label: "walks out with them at the port", kind: "mate" },
  CONFIDE: { label: "tells them something they tell nobody", kind: "mate" },
  PROPOSE: { label: "asks them", kind: "mate" },
  BOND: { label: "makes it permanent, in front of the watch", kind: "mate" },
  PRIVATE_TIME: { label: "takes the evening off with them", kind: "mate" },
  JEALOUS_WORDS: { label: "has words about somebody else's partner", kind: "social" },
  BREAK_OFF: { label: "ends it", kind: "mate" },
  /* the self */
  STUDY: { label: "studies", kind: "study" },
  WRITE_HOME: { label: "writes home", kind: "idle" },
  BROOD: { label: "broods", kind: "idle" },
  PLAN_EXIT: { label: "quietly prices a berth elsewhere", kind: "idle" },
};

/* Small readers over the decision context. `c` is built by deckmind.js. */
const need = (c, k) => c.needs?.[k] ?? 0;
const cap = (c, k) => Boolean(c.caps?.[k]);
const gene = (c, k) => c.pheno?.[k] ?? 0.5;
const someone = (c, kind) => (c.others ?? []).some((o) => o.tie === kind);
const anyone = (c) => (c.others ?? []).length > 0;
const name = (c) => c.focusName ?? "them";

const nodes = {
  /* ---- routing ---------------------------------------------------------- */
  root: {
    type: "check",
    test: (c) => Boolean(c.ship?.alarm),
    then: "alarm.entry", else: "condition.check",
    why: (c, r) => (r
      ? `the ${c.ship.alarm} is running and nothing else matters this minute`
      : "nothing is on fire, so I got to choose"),
  },

  "condition.check": {
    type: "check",
    test: (c) => c.vitals.health < 18 || need(c, "fatigue") > 0.92,
    then: "condition.crisis", else: "mode.route",
    why: (c, r) => (r
      ? "I am not fit to be useful to anybody right now"
      : "I am holding together well enough to do something deliberate"),
  },

  "mode.route": {
    type: "switch",
    on: (c) => ["watch", "mess", "quarters"][c.phase ?? 0] ?? "watch",
    cases: { watch: "watch.entry", mess: "mess.entry", quarters: "quarters.entry" },
    default: "watch.entry",
    why: (c, k) => `by the rota this is my ${k === "watch" ? "watch" : k === "mess" ? "mess hour" : "own time"}`,
  },

  /* ---- the emergency ---------------------------------------------------- */
  "alarm.entry": {
    type: "switch",
    on: (c) => c.ship.alarm,
    cases: { boarding: "alarm.boarding", battle: "alarm.battle", breach: "alarm.breach" },
    default: "act.brace",
    why: (c, k) => `the board is calling it a ${k}`,
  },
  "alarm.boarding": {
    type: "select",
    options: [
      { to: "act.repelBoarders", weight: (c) => (cap(c, "armed") || c.postKind === "sec" ? 3 : 0.6) * (0.4 + gene(c, "dominanceRank")), why: "meet them at the lock — that is what the drill was for" },
      { to: "act.manGuns", weight: (c) => (c.ship.mounts ? 1.4 : 0), why: "get on a mount before they are inside" },
      { to: "act.helpOther", weight: (c) => 1.2 * gene(c, "sociability"), why: "get the people who are not fighters out of the passage" },
      { to: "act.brace", weight: (c) => 1.5 * (1 - gene(c, "dominanceRank")), why: "find a bulkhead and stay behind it" },
    ],
    default: "act.brace",
  },
  "alarm.battle": {
    type: "select",
    options: [
      { to: "act.manGuns", weight: (c) => (c.ship.mounts ? 2 : 0) * (0.5 + gene(c, "perception")), why: "somebody has to be on the mounts" },
      { to: "act.standWatch", weight: () => 1.6, why: "my post matters more in a fight, not less" },
      { to: "act.brace", weight: (c) => 1.2 * (1 - gene(c, "toughness")), why: "strap in and let the people who do this do it" },
    ],
    default: "act.brace",
  },
  "alarm.breach": {
    type: "select",
    options: [
      { to: "act.emergencyPatch", weight: (c) => 2.4 * (0.4 + gene(c, "agility")), why: "a breach gets worse every second it is open" },
      { to: "act.helpOther", weight: (c) => 1.3 * gene(c, "sociability"), why: "count heads first" },
      { to: "act.brace", weight: () => 0.8, why: "seal the section I am in and wait" },
    ],
    default: "act.brace",
  },

  /* ---- crisis ----------------------------------------------------------- */
  "condition.crisis": {
    type: "select",
    options: [
      { to: "act.sleep", weight: (c) => 2 + need(c, "fatigue") * 3, why: "sleep is the only thing that fixes this" },
      { to: "act.eatMess", weight: (c) => 1 + need(c, "hunger") * 3, why: "I have not eaten properly in days" },
      { to: "act.ventTo", guard: (c) => someone(c, "friend") || someone(c, "couple"), weight: (c) => 1.5 * gene(c, "sociability"), why: "say it out loud to somebody who will not repeat it" },
      { to: "act.planExit", guard: (c) => need(c, "grievance") > 0.5, weight: (c) => 2.5 * need(c, "grievance"), why: "this berth is costing me more than it pays" },
      { to: "act.brood", weight: () => 1.2, why: "sit with it" },
    ],
    default: "act.brood",
  },

  /* ---- the watch -------------------------------------------------------- */
  "watch.entry": {
    type: "gate",
    test: (c) => c.fitForPost,
    then: "watch.duty", else: "rest.entry",
    why: (c, r) => (r ? "I am fit to stand my post" : "I am in no state to be trusted with the post"),
  },
  "watch.duty": {
    type: "select",
    options: [
      { to: "duty.post", weight: (c) => 3 + gene(c, "discipline") * 2.5 - need(c, "grievance") * 1.5, why: "the work in front of me is the work" },
      { to: "act.coverShift", guard: (c) => c.shortHanded, weight: (c) => 1.8 * (0.3 + c.traits.loyalty), why: "somebody did not show and the post cannot be empty" },
      { to: "act.mentor", guard: (c) => cap(c, "verbal") && c.juniorAboard, weight: (c) => 1.1 * gene(c, "intellect") * (0.3 + c.traits.loyalty), why: "the new hand will be quicker if somebody shows them once" },
      { to: "act.tinker", guard: (c) => c.ship.wear > 0.25, weight: (c) => 1.4 * c.traits.curiosity, why: "there is something I can improve while I am here" },
      { to: "grievance.entry", guard: (c) => need(c, "grievance") > 0.5, weight: (c) => 2.2 * need(c, "grievance"), why: "there is something owed that I am not letting go of" },
      { to: "social.entry", guard: (c) => cap(c, "social") && anyone(c), weight: (c) => need(c, "social") * 1.6, why: "there is a conversation I have been putting off" },
      { to: "act.slackOff", weight: (c) => Math.max(0, 1.6 - gene(c, "discipline") * 2) + need(c, "grievance") * 1.5, why: "nobody is checking and I am owed" },
    ],
    default: "duty.post",
  },
  "duty.post": {
    type: "switch",
    on: (c) => c.postKind ?? "none",
    cases: {
      eng: "act.patchHull", sec: "act.drill", med: "act.treat", cargo: "act.stow",
      office: "act.book", sensor: "act.scanWatch", bridge: "act.plot",
      agri: "act.tend", lab: "act.assay", works: "act.workLine", industry: "act.workLine",
    },
    default: "act.standWatch",
    why: (c, k) => (k === "none" ? "no post of my own, so I made myself useful" : `my post is ${c.postName ?? k}`),
  },

  /* ---- the mess --------------------------------------------------------- */
  "mess.entry": {
    type: "select",
    options: [
      { to: "act.eatMess", weight: (c) => 1.5 + need(c, "hunger") * 3.5, why: "it is the mess hour and I am hungry" },
      { to: "act.shareMeal", guard: (c) => someone(c, "couple") || someone(c, "friend"), weight: (c) => 1.6 * gene(c, "sociability"), why: "eat with somebody rather than over the sink" },
      { to: "social.entry", guard: (c) => anyone(c), weight: (c) => 1.2 + need(c, "social") * 2, why: "the mess is where anything ever gets said" },
      { to: "act.playCards", guard: (c) => (c.others ?? []).length >= 2, weight: (c) => 1.1 * gene(c, "sociability") + need(c, "play") * 1.5, why: "there is a game on" },
      { to: "act.drink", guard: (c) => c.ship.stores?.drink !== false, weight: (c) => 0.8 + need(c, "stress") * 2 - c.traits.caution, why: "one, to take the edge off the watch" },
      { to: "intimate.entry", guard: (c) => c.romanceAllowed && Boolean(c.romance?.target), weight: (c) => 1.9 * (0.3 + need(c, "intimacy")) * (0.5 + (c.romance?.attraction ?? 0)), why: "they are in here, and I would rather sit with them" },
      { to: "grievance.entry", guard: (c) => need(c, "grievance") > 0.5, weight: (c) => 1.8 * need(c, "grievance"), why: "the mess is where a grievance gets said out loud" },
      { to: "act.groom", weight: () => 0.6, why: "clean up while there is hot water" },
    ],
    default: "act.eatMess",
  },

  /* ---- own time --------------------------------------------------------- */
  "quarters.entry": {
    type: "select",
    options: [
      { to: "act.sleep", weight: (c) => 1.6 + need(c, "fatigue") * 4, why: "the bunk is right there" },
      { to: "intimate.entry", guard: (c) => c.romanceAllowed && Boolean(c.romance?.target), weight: (c) => 2.4 * (0.4 + need(c, "intimacy")) * (0.5 + (c.romance?.attraction ?? 0)), why: "there is somebody I would rather be with than not" },
      { to: "act.study", guard: (c) => cap(c, "sapient"), weight: (c) => 1.3 * c.traits.curiosity * gene(c, "intellect") * 2, why: "I am not going to make rank by standing still" },
      { to: "act.writeHome", guard: (c) => Boolean(c.hasKin), weight: (c) => 0.9 * c.traits.loyalty, why: "the relay is up and somebody is waiting on a message" },
      { to: "rest.entry", weight: () => 1.1, why: "look after the body a bit" },
      { to: "social.entry", guard: (c) => cap(c, "social") && anyone(c), weight: (c) => need(c, "social") * 2.2, why: "own time is the only time anyone talks properly" },
      { to: "grievance.entry", guard: (c) => need(c, "grievance") > 0.5, weight: (c) => 1.5 * need(c, "grievance"), why: "I have been turning it over instead of sleeping" },
      { to: "act.brood", guard: (c) => c.vitals.health < 45, weight: (c) => 1.4 * (1 - c.vitals.health / 100), why: "sit in the dark with it for a while" },
    ],
    default: "act.sleep",
  },

  /* ---- a grievance -------------------------------------------------------
   * Owed wages, a hull nobody is maintaining, a rival on the same watch. It
   * does not need company in the room to matter, which is why it has its own
   * way in rather than hanging off social.entry.
   */
  "grievance.entry": {
    type: "select",
    options: [
      { to: "act.confront", guard: (c) => c.captainIsPlayer, weight: (c) => 2.4 * (0.3 + c.pheno.dominanceRank), why: "say it to the captain rather than to the mess" },
      { to: "act.confront", guard: (c) => !c.captainIsPlayer && anyone(c), weight: (c) => 1.4 * (0.3 + c.pheno.dominanceRank), why: "say it to whoever is standing here" },
      { to: "act.ventTo", guard: (c) => someone(c, "friend") || someone(c, "couple"), weight: (c) => 1.6 * gene(c, "sociability"), why: "tell somebody who will not repeat it" },
      { to: "act.planExit", weight: (c) => 1.2 * need(c, "grievance") * (0.4 + c.traits.greed), why: "this berth is costing me more than it pays" },
      { to: "act.slackOff", weight: (c) => 1.1 * (1 - gene(c, "discipline")), why: "give them exactly what they are paying for" },
      { to: "act.brood", weight: () => 0.8, why: "swallow it again" },
    ],
    default: "act.brood",
  },

  "rest.entry": {
    type: "select",
    options: [
      { to: "act.sleep", weight: (c) => need(c, "fatigue") * 3.5, why: "sleep it off properly" },
      { to: "act.nap", weight: (c) => 1 + need(c, "fatigue") * 1.5, why: "an hour will do" },
      { to: "act.eatMess", weight: (c) => 0.8 + need(c, "hunger") * 2.5, why: "eat something first" },
      { to: "act.exercise", guard: (c) => c.vitals.health > 45, weight: (c) => 0.9 * gene(c, "endurance") * 1.5, why: "the hull does not have gravity for free — you keep it or you lose it" },
      { to: "act.groom", weight: () => 0.7, why: "sort myself out" },
    ],
    default: "act.nap",
  },

  /* ---- other people ----------------------------------------------------- */
  "social.entry": {
    type: "gate",
    test: (c) => anyone(c),
    then: "social.who", else: "rest.entry",
    why: (c, r) => (r ? `there are ${(c.others ?? []).length} other people within earshot` : "there is nobody about"),
  },
  "social.who": {
    type: "switch",
    on: (c) => c.socialPull ?? "idle",
    cases: {
      partner: "intimate.entry",
      friend: "social.friend",
      rival: "conflict.entry",
      grievance: "act.confront",
      captain: "act.askCaptain",
      stranger: "act.talkTo",
    },
    default: "social.idle",
    why: (c, k) => (k === "idle" ? "no one in particular — just company" : `the person on my mind is ${name(c)}`),
  },
  "social.friend": {
    type: "select",
    options: [
      { to: "act.ventTo", weight: (c) => 1 + need(c, "stress") * 3, why: "they are the one I can say it to" },
      { to: "act.playCards", weight: (c) => 1.2 + need(c, "play") * 1.5, why: "cards, and nothing heavier" },
      { to: "act.talkTo", weight: () => 1.5, why: "just talk" },
      { to: "act.gossip", guard: (c) => (c.others ?? []).length > 1, weight: (c) => 0.8 * (1 - gene(c, "discipline")), why: "tell them what I heard" },
    ],
    default: "act.talkTo",
  },
  "social.idle": {
    type: "select",
    options: [
      { to: "act.talkTo", weight: (c) => 1.5 * gene(c, "sociability"), why: "make conversation with whoever is here" },
      { to: "act.jealousWords", guard: (c) => Boolean(c.romance?.triangle), weight: (c) => 1.3 * (c.romance?.triangle?.attraction ?? 0), why: "somebody has been circling" },
      { to: "act.gossip", weight: (c) => 0.8 * (1 - gene(c, "discipline")), why: "pass on what I heard" },
      { to: "act.playCards", guard: (c) => (c.others ?? []).length >= 2, weight: () => 1, why: "get a game going" },
      { to: "act.avoid", weight: (c) => 1.2 * (1 - gene(c, "sociability")), why: "I would rather not, actually" },
    ],
    default: "act.talkTo",
  },
  "conflict.entry": {
    type: "select",
    options: [
      { to: "act.argue", weight: (c) => 1.4 + gene(c, "temperament") * 2.5 + need(c, "stress") * 1.5, why: "this has been coming for a while" },
      { to: "act.mendFences", weight: (c) => 1.2 * gene(c, "sociability") * (0.4 + c.traits.loyalty) * 2, why: "we have to share a hull; somebody has to go first" },
      { to: "act.gossip", weight: (c) => 0.9 * (1 - gene(c, "discipline")), why: "let the others hear my side of it" },
      { to: "act.jealousWords", guard: (c) => Boolean(c.romance?.triangle), weight: (c) => 1.6 * (c.romance?.triangle?.attraction ?? 0), why: "it is not about the watch, and we both know it" },
      { to: "act.avoid", weight: (c) => 1.3 * c.traits.caution, why: "not today" },
    ],
    default: "act.avoid",
  },
  /* ---- the ladder ---------------------------------------------------------
   * strangers → noticed → interested → courting → together → bonded. Each rung
   * is a different thing to do, each needs the one below it, and every one of
   * them needs the interest to be mutual (crew/romance.js gates that, not a
   * die roll here).
   */
  "intimate.entry": {
    type: "gate",
    test: (c) => c.romanceAllowed && Boolean(c.romance?.target),
    then: "romance.route", else: "social.idle",
    why: (c, r) => (r ? `there is something between me and ${c.romance?.targetName ?? "them"}` : "there is nothing there to act on"),
  },
  "romance.route": {
    type: "switch",
    on: (c) => c.romance?.stage ?? "strangers",
    cases: {
      strangers: "act.noticeThem",
      noticed: "romance.early",
      interested: "romance.courting",
      courting: "romance.asking",
      together: "romance.together",
      bonded: "romance.together",
    },
    default: "act.shareMeal",
    why: (c, k) => `we ${({ strangers: "have not really met", noticed: "have noticed each other", interested: "are interested", courting: "are courting", together: "are together", bonded: "are bonded" })[k] ?? "are somewhere"}`,
  },
  "romance.early": {
    type: "select",
    options: [
      { to: "act.flirt", weight: (c) => 1.8 * (0.4 + (c.romance?.attraction ?? 0.3)), why: "find a reason to be where they are" },
      { to: "act.talkTo", weight: () => 1.2, why: "actually talk to them first" },
      { to: "act.shareMeal", weight: () => 1.1, why: "take the same mess shift" },
      { to: "act.giveGift", guard: (c) => c.ship.docked, weight: (c) => 0.9 * (0.3 + c.traits.greed), why: "there is a market right there" },
    ],
    default: "act.talkTo",
  },
  "romance.courting": {
    type: "select",
    options: [
      { to: "act.walkOut", guard: (c) => c.ship.docked, weight: () => 2.4, why: "get off the hull together for an hour" },
      { to: "act.confide", weight: (c) => 1.6 * gene(c, "sociability"), why: "tell them something I tell nobody" },
      { to: "act.giveGift", guard: (c) => c.ship.docked, weight: () => 1.2, why: "bring them something back" },
      { to: "act.flirt", weight: () => 1.1, why: "keep it light a while longer" },
      { to: "act.shareMeal", weight: () => 1, why: "eat together" },
    ],
    default: "act.shareMeal",
  },
  "romance.asking": {
    type: "select",
    options: [
      { to: "act.propose", guard: (c) => c.romance?.canPropose, weight: (c) => 2.6 * (0.3 + c.pheno.dominanceRank) * (0.4 + need(c, "intimacy")), why: "ask them, before somebody else does" },
      { to: "act.confide", weight: () => 1.4, why: "one more thing said first" },
      { to: "act.walkOut", guard: (c) => c.ship.docked, weight: () => 1.5, why: "somewhere that is not this corridor" },
      { to: "act.giveGift", guard: (c) => c.ship.docked, weight: () => 1, why: "something to mark it" },
      { to: "act.shareMeal", weight: () => 0.9, why: "no rush" },
    ],
    default: "act.confide",
  },
  "romance.together": {
    type: "select",
    options: [
      { to: "act.privateTime", guard: (c) => c.romance?.canPrivate, weight: (c) => 2.2 * (0.35 + need(c, "intimacy")), why: "we have a door that shuts and an evening to ourselves" },
      { to: "act.bond", guard: (c) => c.romance?.canBond, weight: () => 2, why: "make it permanent, in front of the watch" },
      { to: "act.sitWith", weight: () => 1.8, why: "be with them, without it being an occasion" },
      { to: "act.confide", weight: () => 1.1, why: "say the thing I have been not saying" },
      { to: "act.shareMeal", weight: () => 1.1, why: "eat together" },
      { to: "act.breakOff", guard: (c) => (c.m.morale ?? 70) < 25 && (c.romance?.spark ?? 0) < 30, weight: (c) => 1.4 * (1 - (c.m.morale ?? 70) / 100), why: "this has not been working for a while" },
    ],
    default: "act.sitWith",
  },

  /* ---- terminals -------------------------------------------------------- */
  "act.standWatch": act("STAND_WATCH", ACTION_META.STAND_WATCH.label, "duty"),
  "act.patchHull": act("PATCH_HULL", ACTION_META.PATCH_HULL.label, "duty"),
  "act.drill": act("DRILL", ACTION_META.DRILL.label, "duty"),
  "act.treat": act("TREAT", ACTION_META.TREAT.label, "care"),
  "act.stow": act("STOW", ACTION_META.STOW.label, "duty"),
  "act.book": act("BOOK", ACTION_META.BOOK.label, "duty"),
  "act.scanWatch": act("SCAN_WATCH", ACTION_META.SCAN_WATCH.label, "duty"),
  "act.plot": act("PLOT", ACTION_META.PLOT.label, "duty"),
  "act.tend": act("TEND", ACTION_META.TEND.label, "duty"),
  "act.assay": act("ASSAY", ACTION_META.ASSAY.label, "duty"),
  "act.workLine": act("WORK_LINE", ACTION_META.WORK_LINE.label, "duty"),
  "act.coverShift": act("COVER_SHIFT", ACTION_META.COVER_SHIFT.label, "duty"),
  "act.slackOff": act("SLACK_OFF", ACTION_META.SLACK_OFF.label, "idle"),
  "act.tinker": act("TINKER", ACTION_META.TINKER.label, "duty"),
  "act.mentor": act("MENTOR", ACTION_META.MENTOR.label, "care"),
  "act.brace": act("BRACE", ACTION_META.BRACE.label, "survival"),
  "act.manGuns": act("MAN_GUNS", ACTION_META.MAN_GUNS.label, "combat"),
  "act.repelBoarders": act("REPEL_BOARDERS", ACTION_META.REPEL_BOARDERS.label, "combat"),
  "act.emergencyPatch": act("EMERGENCY_PATCH", ACTION_META.EMERGENCY_PATCH.label, "survival"),
  "act.helpOther": act("HELP_OTHER", ACTION_META.HELP_OTHER.label, "care"),
  "act.sleep": act("SLEEP", ACTION_META.SLEEP.label, "rest"),
  "act.nap": act("NAP", ACTION_META.NAP.label, "rest"),
  "act.eatMess": act("EAT_MESS", ACTION_META.EAT_MESS.label, "rest"),
  "act.drink": act("DRINK", ACTION_META.DRINK.label, "social"),
  "act.exercise": act("EXERCISE", ACTION_META.EXERCISE.label, "rest"),
  "act.groom": act("GROOM", ACTION_META.GROOM.label, "rest"),
  "act.talkTo": act("TALK_TO", ACTION_META.TALK_TO.label, "social"),
  "act.shareMeal": act("SHARE_MEAL", ACTION_META.SHARE_MEAL.label, "social"),
  "act.playCards": act("PLAY_CARDS", ACTION_META.PLAY_CARDS.label, "social"),
  "act.ventTo": act("VENT_TO", ACTION_META.VENT_TO.label, "social"),
  "act.gossip": act("GOSSIP", ACTION_META.GOSSIP.label, "social"),
  "act.argue": act("ARGUE", ACTION_META.ARGUE.label, "social"),
  "act.mendFences": act("MEND_FENCES", ACTION_META.MEND_FENCES.label, "social"),
  "act.avoid": act("AVOID", ACTION_META.AVOID.label, "idle"),
  "act.confront": act("CONFRONT", ACTION_META.CONFRONT.label, "social"),
  "act.askCaptain": act("ASK_CAPTAIN", ACTION_META.ASK_CAPTAIN.label, "social"),
  "act.sitWith": act("SIT_WITH", ACTION_META.SIT_WITH.label, "mate"),
  "act.noticeThem": act("NOTICE_THEM", ACTION_META.NOTICE_THEM.label, "mate"),
  "act.flirt": act("FLIRT", ACTION_META.FLIRT.label, "mate"),
  "act.giveGift": act("GIVE_GIFT", ACTION_META.GIVE_GIFT.label, "mate"),
  "act.walkOut": act("WALK_OUT", ACTION_META.WALK_OUT.label, "mate"),
  "act.confide": act("CONFIDE", ACTION_META.CONFIDE.label, "mate"),
  "act.propose": act("PROPOSE", ACTION_META.PROPOSE.label, "mate"),
  "act.bond": act("BOND", ACTION_META.BOND.label, "mate"),
  "act.privateTime": act("PRIVATE_TIME", ACTION_META.PRIVATE_TIME.label, "mate"),
  "act.jealousWords": act("JEALOUS_WORDS", ACTION_META.JEALOUS_WORDS.label, "social"),
  "act.breakOff": act("BREAK_OFF", ACTION_META.BREAK_OFF.label, "mate"),
  "act.study": act("STUDY", ACTION_META.STUDY.label, "study"),
  "act.writeHome": act("WRITE_HOME", ACTION_META.WRITE_HOME.label, "idle"),
  "act.brood": act("BROOD", ACTION_META.BROOD.label, "idle"),
  "act.planExit": act("PLAN_EXIT", ACTION_META.PLAN_EXIT.label, "idle"),
};

/* Router nodes stand for a whole category of thing-to-do; terminals carry
 * their own. The learned prior (learn.js) weighs options by category, so it
 * needs to know what an edge leads toward before the walk gets there. */
export const NODE_KIND = {
  "duty.post": "duty", "watch.entry": "duty", "watch.duty": "duty",
  "rest.entry": "rest", "mess.entry": "rest", "quarters.entry": "rest",
  "social.entry": "social", "social.who": "social", "social.friend": "social",
  "social.idle": "social", "conflict.entry": "social", "grievance.entry": "social",
  "intimate.entry": "mate", "romance.route": "mate", "romance.early": "mate",
  "romance.courting": "mate", "romance.asking": "mate", "romance.together": "mate",
  "alarm.entry": "survival", "alarm.boarding": "combat", "alarm.battle": "combat",
  "alarm.breach": "survival", "condition.crisis": "rest",
};

/** The category an edge leads toward: the node's own, or its action's. */
export function kindOfNode(id) {
  if (NODE_KIND[id]) return NODE_KIND[id];
  const n = nodes[id];
  if (n?.type === "action") return ACTION_META[n.act]?.kind ?? n.kind ?? null;
  return null;
}

/*
 * Every `select` in the graph gets its weights bent by what this particular
 * hand has learned works for them. One wrap, here, rather than forty edits to
 * forty weight functions — and `behavior-graph.js` stays the verbatim port it
 * was, with no idea that any of this is happening.
 *
 * A hand with nothing on file multiplies by exactly one, so a fresh crew
 * behaves the way they did before there was a brain to consult.
 */
for (const id of Object.keys(nodes)) {
  const n = nodes[id];
  if (n.type !== "select" || !n.options) continue;
  n.options = n.options.map((o) => {
    const kind = kindOfNode(o.to);
    const base = o.weight;
    if (!kind) return o;
    return {
      ...o,
      weight: (c) => {
        const w = typeof base === "function" ? base(c) : (base ?? 1);
        return w <= 0 ? w : w * kindPrior(c, kind);
      },
    };
  });
}

export const deckGraph = createGraph({
  id: "living-galaxy-deck",
  root: "root",
  fallback: "act.standWatch",
  nodes,
});

export { nodes as deckNodes };
