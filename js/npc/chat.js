/* LIVING GALAXY — NPC chat, separated from the speech engine that drives it.
 *
 * 0.3.23. Until now "what an NPC says" and "how the band decides who says it"
 * were the same file: js/npc/speech.js built the band, chose the pair, chose
 * the topic, and handed the speech engine's own words straight to the comms
 * log. There was no seam — so no pack, no mod and no addon could give a hull
 * a different voice without editing core.
 *
 * This is the seam. The ENGINE still decides who speaks, to whom, about what,
 * on which channel, and what it means for regard and standing — all of that is
 * the simulation and stays in core. A VOICE PROVIDER only gets the finished
 * beat and may re-word it:
 *
 *   { id, rating, priority, channels, roles, topics,
 *     line(beat)   → string | null     re-word one line of an exchange
 *     reply(beat)  → string | null     re-word an answer to something you said
 *     chips(u, t)  → [{label, text}]   extra things you can say to this hull }
 *
 * A provider that returns null (or throws) declines and the core words stand,
 * so a broken pack degrades to vanilla instead of to silence.
 *
 * RATING is the gate, and it is off by default. A provider declares the rating
 * it writes at; nothing above the rating the player has set is ever consulted.
 * "core" is the vanilla band. Anything higher is opt-in, is remembered per
 * device, and — because the open channel is a public room — may only dress the
 * channels it is allowed to: an adult provider is confined to `direct`, the
 * one-to-one call you opened yourself, and never to open-band chatter.
 */

const KEY = "lgaa.npcchat.v1";

/** Ratings in order. A provider is consulted only at or below the set rating. */
export const RATINGS = ["core", "mature", "adult"];
const rank = (r) => Math.max(0, RATINGS.indexOf(r));

/** Channels a provider may be handed. `open` is the band everyone hears. */
export const CHANNELS = ["open", "direct", "hail", "distress"];

/** Which channels a rating is allowed to touch, whatever a provider asks for. */
const ALLOWED = { core: CHANNELS, mature: ["direct", "hail"], adult: ["direct"] };

export const npcChat = {
  rating: "core",
  providers: [],
  stats: { asked: 0, dressed: 0, declined: 0, errors: 0 },
};

function persist() {
  try { globalThis.localStorage?.setItem(KEY, npcChat.rating); } catch { /* private mode */ }
}

export function loadChatRating() {
  try {
    const v = globalThis.localStorage?.getItem(KEY);
    if (v && RATINGS.includes(v)) npcChat.rating = v;
  } catch { /* private mode */ }
  return npcChat.rating;
}

/** The rating the band is allowed to speak at. Anything but "core" is opt-in. */
export function setChatRating(r) {
  if (!RATINGS.includes(r)) return npcChat.rating;
  npcChat.rating = r;
  persist();
  return npcChat.rating;
}
export const chatRating = () => npcChat.rating;

/**
 * Register a voice. Returns a function that takes it off again, so a pack can
 * be unloaded at runtime. Re-registering the same id replaces it.
 */
export function registerVoice(spec) {
  if (!spec?.id) return () => {};
  const v = {
    id: String(spec.id),
    rating: RATINGS.includes(spec.rating) ? spec.rating : "core",
    priority: Number(spec.priority ?? 0),
    channels: Array.isArray(spec.channels) ? spec.channels : CHANNELS,
    roles: Array.isArray(spec.roles) ? spec.roles : null,
    topics: Array.isArray(spec.topics) ? spec.topics : null,
    line: typeof spec.line === "function" ? spec.line : null,
    reply: typeof spec.reply === "function" ? spec.reply : null,
    chips: typeof spec.chips === "function" ? spec.chips : null,
    label: spec.label ?? spec.id,
  };
  unregisterVoice(v.id);
  npcChat.providers.push(v);
  npcChat.providers.sort((a, b) => b.priority - a.priority || rank(b.rating) - rank(a.rating));
  return () => unregisterVoice(v.id);
}

export function unregisterVoice(id) {
  const i = npcChat.providers.findIndex((v) => v.id === String(id));
  if (i >= 0) npcChat.providers.splice(i, 1);
  return i >= 0;
}

export function clearVoices() { npcChat.providers.length = 0; }

/** Every provider that may speak on this channel right now, best first. */
export function voicesFor(channel = "open", beat = null) {
  const cap = rank(npcChat.rating);
  return npcChat.providers.filter((v) => {
    if (rank(v.rating) > cap) return false;
    if (!(ALLOWED[v.rating] ?? CHANNELS).includes(channel)) return false;
    if (!v.channels.includes(channel)) return false;
    if (beat && v.roles && !v.roles.includes(beat.role)) return false;
    if (beat && v.topics && !v.topics.includes(beat.topic)) return false;
    return true;
  });
}

function run(fn, v, beat) {
  npcChat.stats.asked++;
  try {
    const out = fn.call(v, beat);
    if (typeof out === "string" && out.trim()) { npcChat.stats.dressed++; return out.trim(); }
    npcChat.stats.declined++;
    return null;
  } catch (err) {
    npcChat.stats.errors++;
    console.warn("[npcchat]", v.id, err);
    return null;
  }
}

/**
 * Give the providers one line of an exchange. `beat` is everything a voice
 * could want: { text, channel, topic, move, frame, turn, speaker, listener,
 * role, register, regard, place, ref }. First one to answer wins; nobody
 * answering means the core words stand, which is the normal case.
 */
export function dressLine(beat) {
  if (!beat?.text || !npcChat.providers.length) return beat?.text ?? "";
  for (const v of voicesFor(beat.channel ?? "open", beat)) {
    if (!v.line) continue;
    const out = run(v.line, v, beat);
    if (out) return out;
  }
  return beat.text;
}

/** The same, for an answer to something you said on a one-to-one call. */
export function dressReply(beat) {
  if (!beat?.text || !npcChat.providers.length) return beat?.text ?? "";
  for (const v of voicesFor(beat.channel ?? "direct", beat)) {
    if (!v.reply) continue;
    const out = run(v.reply, v, beat);
    if (out) return out;
  }
  return beat.text;
}

/** Extra things a pack lets you say to this hull, appended to the core chips. */
export function extraChips(unit, turn = 0, channel = "direct") {
  const out = [];
  for (const v of voicesFor(channel, unit ? { role: unit.role, topic: null } : null)) {
    if (!v.chips) continue;
    try {
      for (const c of v.chips(unit, turn) ?? []) if (c?.label && c?.text) out.push({ ...c, from: v.id });
    } catch (err) { npcChat.stats.errors++; console.warn("[npcchat]", v.id, err); }
  }
  return out.slice(0, 3);
}

/** For the console: what is speaking, and at what rating. */
export function chatReport() {
  return {
    rating: npcChat.rating,
    providers: npcChat.providers.map((v) => ({ id: v.id, label: v.label, rating: v.rating, priority: v.priority, channels: v.channels, live: rank(v.rating) <= rank(npcChat.rating) })),
    ...npcChat.stats,
  };
}

export function wireNpcChat() {
  loadChatRating();
  if (globalThis.window?.__lg) window.__lg.npcchat = { npcChat, chatReport, setChatRating, registerVoice, unregisterVoice, RATINGS };
}
