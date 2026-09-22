/* LIVING GALAXY — the chat bus.
 *
 * One stream for everything said to you or near you: the open channel (NPC
 * chatter from the speech band), GNN bulletins (auto-accepted — they never
 * ring the puck), your drones' reports, and system lines. Each message can
 * carry links — "GNN desk", "Mark it", "Set up MINER-01" — that run an
 * action when tapped.
 *
 * The bus is the data layer the new HUD's chatbox renders (see ui-demos/).
 * Until that HUD lands, the comms ticker and the flight log mirror it, and
 * CMD › COMMS › Channel log lists it.
 *
 *   post({ channel, from, text, links, tone })   → message
 *   onChat(fn)                                    → unsubscribe
 *   recent(n, channel)                            → last n messages
 */

export const CHANNELS = {
  local: { label: "Local", hint: "hulls and ports on your band" },
  gnn: { label: "GNN", hint: "news, markets, security desks" },
  drones: { label: "Drones", hint: "your drones' reports" },
  you: { label: "You", hint: "what you said" },
  sys: { label: "System", hint: "ship and port notices" },
};

export const chat = { log: [], seq: 1, cap: 240, subs: new Set(), unread: {}, clock: () => 0 };  // sim sets clock

/** Post a message. `links`: [{ label, run }] — run() is called when it is tapped. */
export function post({ channel = "sys", from = "", text = "", links = [], tone = "neutral", at = null, meta = null } = {}) {
  if (!text) return null;
  const m = { id: chat.seq++, at: at ?? chat.clock(), channel, from, text, links: links.filter((l) => l && l.label), tone, meta };
  chat.log.push(m);
  if (chat.log.length > chat.cap) chat.log.splice(0, chat.log.length - chat.cap);
  chat.unread[channel] = (chat.unread[channel] ?? 0) + 1;
  for (const fn of chat.subs) { try { fn(m); } catch { /* a bad listener is not the bus's problem */ } }
  return m;
}

export function onChat(fn) { chat.subs.add(fn); return () => chat.subs.delete(fn); }

export function recent(n = 40, channel = null) {
  const src = channel ? chat.log.filter((m) => m.channel === channel) : chat.log;
  return src.slice(-n);
}

export function markRead(channel = null) {
  if (channel) chat.unread[channel] = 0;
  else for (const k of Object.keys(chat.unread)) chat.unread[k] = 0;
}

/** Run a message's link by index (the chatbox and the deck both call this). */
export function follow(m, i = 0) {
  const l = m?.links?.[i];
  if (!l?.run) return false;
  l.run();
  return true;
}

export function resetChat() {
  chat.log.length = 0;
  chat.unread = {};
}
