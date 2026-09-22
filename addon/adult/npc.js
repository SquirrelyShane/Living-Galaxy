/* Adult pack — the NPC band's mature voice.
 *
 * 0.3.23. Core opened a seam (js/npc/chat.js): the engine still decides who
 * speaks to whom, about what, on which channel, and what it does to regard and
 * standing. A registered VOICE only re-words the finished line. This is the
 * pack's voice, built on the bank the pack already ships (./voice.js).
 *
 * Three rules it keeps, because core cannot enforce taste for it:
 *
 *   1. It is registered at rating "adult", so it is consulted only when the
 *      player has set that rating themselves. Default is "core" and nothing
 *      here is ever reached.
 *   2. It asks for `direct` only — the one-to-one call you opened. Core caps
 *      the adult rating to that channel anyway; asking for it makes the intent
 *      readable rather than accidental.
 *   3. It declines unless the hull already likes you. Regard is the engine's
 *      own auditable number, so "somebody you have flown with" is a fact, not
 *      a mood — a stranger on the band gets the vanilla answer.
 *
 * It declines by returning null, and a decline always leaves core's own words
 * standing, so the pack can never make an NPC go quiet.
 */

import { registerVoice } from "../../js/npc/chat.js";
import { adultLine } from "./voice.js";
import { social } from "../../js/family.js";

const WARM = 0.45;            // regard at or above which a hull will talk like this
const INTENTS = new Set(["greet", "gossip", "about", "offer", "help", "thanks", "banter"]);

/* The pack's bank holds act prose and one TALK bag. A radio call is talk, so
 * the band voice draws from the talk bag and from nothing else — the act bags
 * belong to a private scene between two people who chose it, and the open
 * question of who is listening on a comms channel is reason enough on its own. */
const TALK_BAGS = ["mix_talk"];

const seedOf = (beat) => `${beat.speaker?.name ?? "npc"}:${beat.topic ?? "x"}:${Math.round((beat.regard ?? 0) * 20)}:${beat.turn ?? 0}`;

registerVoice({
  id: "adult-npc",
  label: "Adult pack — band voice",
  rating: "adult",
  priority: 10,
  channels: ["direct"],
  reply(beat) {
    if (!social.adult) return null;                             // house rules still govern
    if ((beat.regard ?? 0) < WARM) return null;                 // strangers get the vanilla answer
    if (beat.topic && !INTENTS.has(beat.topic)) return null;    // business stays business
    return adultLine(TALK_BAGS, seedOf(beat), "") || null;
  },
  chips() {
    if (!social.adult) return [];
    return [{ label: "OFF THE CLOCK?", text: "Off the clock — what do you do for company out here?" }];
  },
});

export const ADULT_NPC_VOICE = "adult-npc";
