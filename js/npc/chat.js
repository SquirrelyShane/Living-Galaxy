const KEY = "lgaa.npcchat.v1";

export const RATINGS = ["core", "mature", "adult"];
const rank = (r) => Math.max(0, RATINGS.indexOf(r));

export const CHANNELS = ["open", "direct", "hail", "distress"];

const ALLOWED = { core: CHANNELS, mature: ["direct", "hail"], adult: ["direct"] };

export const npcChat = {
  rating: "core",
  providers: [],
  stats: { asked: 0, dressed: 0, declined: 0, errors: 0 },
};

function persist() {
  try { globalThis.localStorage?.setItem(KEY, npcChat.rating); } catch {}
}

export function loadChatRating() {
  try {
    const v = globalThis.localStorage?.getItem(KEY);
    if (v && RATINGS.includes(v)) npcChat.rating = v;
  } catch {}
  return npcChat.rating;
}

export function setChatRating(r) {
  if (!RATINGS.includes(r)) return npcChat.rating;
  npcChat.rating = r;
  persist();
  return npcChat.rating;
}
export const chatRating = () => npcChat.rating;

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

export function dressLine(beat) {
  if (!beat?.text || !npcChat.providers.length) return beat?.text ?? "";
  for (const v of voicesFor(beat.channel ?? "open", beat)) {
    if (!v.line) continue;
    const out = run(v.line, v, beat);
    if (out) return out;
  }
  return beat.text;
}

export function dressReply(beat) {
  if (!beat?.text || !npcChat.providers.length) return beat?.text ?? "";
  for (const v of voicesFor(beat.channel ?? "direct", beat)) {
    if (!v.reply) continue;
    const out = run(v.reply, v, beat);
    if (out) return out;
  }
  return beat.text;
}

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
