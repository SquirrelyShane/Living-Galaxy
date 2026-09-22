/* LIVING GALAXY 0.3.23 — NPC chat, separated from the engine that drives it.
 *
 *   node --import ./test/three-register.mjs test/npcchat.test.mjs
 *
 * The simulation keeps deciding who speaks, to whom, about what, and what it
 * costs in regard and standing. A registered VOICE only re-words the finished
 * line — and only at a rating the player has set, only on a channel that
 * rating is allowed, and never in a way that can silence a hull.
 */

import { sim, launchSim, tickSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { traffic } from "../js/npc/traffic.js";
import { chatter, talkTo, syncBand, speech, resetSpeech, talkChips, unitOf } from "../js/npc/speech.js";
import {
  npcChat, RATINGS, CHANNELS, registerVoice, unregisterVoice, clearVoices, voicesFor,
  dressLine, dressReply, extraChips, setChatRating, chatRating, chatReport, loadChatRating,
} from "../js/npc/chat.js";
import { rngFromSeed } from "../js/generate.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

makePilot("Chatter", "terran", "commerce", null);
launchSim("ChatTest", "sol");
sim.phase = "play";
for (let i = 0; i < 400; i++) tickSim(1 / 60);

/* ---- the gate ------------------------------------------------------------------- */
{
  clearVoices();
  ok(chatRating() === "core" && RATINGS[0] === "core", "the band speaks at 'core' until somebody says otherwise");
  registerVoice({ id: "t-core", rating: "core", line: () => "CORE VOICE", reply: () => "CORE REPLY" });
  registerVoice({ id: "t-adult", rating: "adult", priority: 5, channels: CHANNELS, line: () => "ADULT VOICE", reply: () => "ADULT REPLY" });
  ok(voicesFor("open").length === 1 && voicesFor("open")[0].id === "t-core", "a higher-rated voice is not consulted at a lower rating");
  ok(dressLine({ text: "plain", channel: "open" }) === "CORE VOICE", "a core voice may dress the open band");
  setChatRating("adult");
  ok(chatRating() === "adult" && store.get("lgaa.npcchat.v1") === "adult", "the rating is the player's, and it is remembered on the device");
  ok(dressLine({ text: "plain", channel: "open" }) === "CORE VOICE", "…and an adult voice still may not touch the open channel, whatever it asked for");
  ok(dressReply({ text: "plain", channel: "direct" }) === "ADULT REPLY", "on a call you opened yourself, it may");
  ok(voicesFor("direct").map((v) => v.id).join(",") === "t-adult,t-core", "priority orders the queue");
  setChatRating("core");
  ok(dressReply({ text: "plain", channel: "direct" }) === "CORE REPLY", "turning the rating back down takes it out again, live");
  ok(setChatRating("nonsense") === "core", "and a rating that does not exist is not a rating");
}

/* ---- a voice can decline, and a broken voice cannot break the band ----------------- */
{
  clearVoices();
  registerVoice({ id: "picky", rating: "core", line: (b) => (b.topic === "ore" ? "PICKY" : null) });
  ok(dressLine({ text: "engine words", channel: "open", topic: "cargo" }) === "engine words", "a voice that declines leaves the engine's own words");
  ok(dressLine({ text: "engine words", channel: "open", topic: "ore" }) === "PICKY", "and takes the line when it wants it");
  registerVoice({ id: "broken", rating: "core", priority: 99, line: () => { throw new Error("pack bug"); } });
  const before = npcChat.stats.errors;
  const warn = console.warn; console.warn = () => {};
  ok(dressLine({ text: "engine words", channel: "open", topic: "cargo" }) === "engine words", "a voice that throws does not silence the hull");
  console.warn = warn;
  ok(npcChat.stats.errors === before + 1, "the throw is counted, not swallowed");
  registerVoice({ id: "broken", rating: "core", priority: 1, line: () => "REPLACED" });
  ok(npcChat.providers.filter((v) => v.id === "broken").length === 1, "registering the same id twice replaces it rather than stacking");
  ok(unregisterVoice("broken") && !unregisterVoice("broken"), "and it comes off again");
}

/* ---- filters --------------------------------------------------------------------- */
{
  clearVoices();
  registerVoice({ id: "miners", rating: "core", roles: ["mine"], line: () => "ROCK TALK" });
  ok(dressLine({ text: "x", channel: "open", role: "mine" }) === "ROCK TALK" && dressLine({ text: "x", channel: "open", role: "trade" }) === "x", "a voice can be for one role only");
  clearVoices();
  registerVoice({ id: "one", rating: "core", topics: ["ore"], line: () => "ORE TALK" });
  ok(dressLine({ text: "x", channel: "open", topic: "ore" }) === "ORE TALK" && dressLine({ text: "x", channel: "open", topic: "lane" }) === "x", "or for one topic only");
}

/* ---- it is really the band's words that come through ------------------------------- */
{
  clearVoices();
  resetSpeech(sim.skySeed);
  syncBand(sim.ship.pos, sim.skySeed);
  ok(speech.units.length > 1, `${speech.units.length} hulls on the band`);
  const rnd = rngFromSeed("chat-band");
  let plain = null;
  for (let i = 0; i < 40 && !plain; i++) plain = chatter(sim.ship.pos, sim.time + i * 7, rnd);
  ok(plain?.lines?.length, `the band talks: "${plain?.lines?.[0]?.text?.slice(0, 64)}"`);
  const seen = [];
  registerVoice({ id: "tap", rating: "core", line: (b) => { seen.push(b); return null; } });
  let again = null;
  for (let i = 0; i < 40 && !again; i++) again = chatter(sim.ship.pos, sim.time + 400 + i * 7, rngFromSeed(`chat-band-2:${i}`));
  ok(again?.lines?.length && seen.length >= again.lines.length, `every line of an exchange is offered to the voices (${seen.length} offered)`);
  const b = seen[0];
  ok(b.text && b.topic && b.speaker && b.listener && typeof b.regard === "number" && b.channel === "open", `and a beat carries what a voice needs: topic "${b.topic}", ${b.move}, regard ${b.regard.toFixed(2)}, role ${b.role}`);
  clearVoices();
  registerVoice({ id: "shout", rating: "core", line: () => "ALL SHIPS, THIS IS A TEST" });
  let loud = null;
  for (let i = 0; i < 40 && !loud; i++) loud = chatter(sim.ship.pos, sim.time + 900 + i * 7, rngFromSeed(`chat-band-3:${i}`));
  ok(loud?.lines?.every((l) => l.text === "ALL SHIPS, THIS IS A TEST"), "a voice that takes every line really does replace what the band says");
  ok(loud?.topic && loud?.channel, "while the topic, the channel and the memory behind it stay the engine's");
}

/* ---- a private call, and the chips ------------------------------------------------- */
{
  clearVoices();
  const n = traffic.find((x) => x.job !== "down") ?? null;
  ok(n, `talking to ${n?.name}`);
  const vanilla = talkTo(n, "Hello there.", sim.time);
  ok(vanilla?.text, `vanilla answer: "${vanilla?.text?.slice(0, 60)}"`);
  registerVoice({ id: "call", rating: "core", channels: ["direct"], reply: (b) => `HEARD: ${b.said}` });
  const dressed = talkTo(n, "How is the lane?", sim.time + 5);
  ok(dressed?.text === "HEARD: How is the lane?", "a direct-call voice answers in its own words, and is handed what you said");
  ok(typeof dressed.standing === "number" && dressed.speaker, "the standing and the speaker are still the engine's");
  clearVoices();
  const base = talkChips(n, 0);
  registerVoice({ id: "chips", rating: "core", channels: ["direct"], chips: () => [{ label: "TEST CHIP", text: "a test line" }] });
  const more = talkChips(n, 0);
  ok(more.length === base.length + 1 && more.some((c) => c.label === "TEST CHIP"), `a pack can add things to say (${base.length} → ${more.length})`);
  ok(extraChips(unitOf(n), 0, "open").length === 0, "…on the call panel, not on the open band");
}

/* ---- the report -------------------------------------------------------------------- */
{
  clearVoices();
  registerVoice({ id: "a", rating: "core", line: () => null });
  registerVoice({ id: "b", rating: "adult", line: () => null });
  const r = chatReport();
  ok(r.rating === "core" && r.providers.length === 2 && r.providers.find((p) => p.id === "a").live && !r.providers.find((p) => p.id === "b").live, "the report says what is registered and what is actually live");
  store.set("lgaa.npcchat.v1", "mature");
  ok(loadChatRating() === "mature", "and the rating comes back off the device on the next launch");
  setChatRating("core");
  clearVoices();
}

console.log(`npcchat: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
