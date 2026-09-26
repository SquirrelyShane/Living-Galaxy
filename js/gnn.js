/* LIVING GALAXY — the Galactic News Network.
 *
 * One GNN station sits somewhere in every sky (stations.js places it: a relay
 * archetype, civilian berths, its own orbit or a world's well). Its desks put
 * out bulletins that are accepted automatically — no ringing puck — and land
 * in chat with a link to the GNN desk panel, where the archive, the desks and
 * each bulletin's actions (mark the site, take the salvage paper) live.
 *
 *   gnnPost({ desk, title, body, actions })   → the bulletin
 *   gnnStation()                               → this sky's GNN station
 *   gnn.open                                   → set by the UI: opens the desk at a bulletin
 */

import { post } from "./chat.js";
import { stations } from "./stations.js";

export const DESKS = {
  news: { label: "News desk", tag: "GNN BULLETIN" },
  markets: { label: "Markets desk", tag: "GNN MARKETS" },
  security: { label: "Security desk", tag: "GNN SECURITY" },
  drones: { label: "Contractors desk", tag: "GNN CONTRACTORS" },
};

export const gnn = { posts: [], seq: 1, cap: 80, open: null, clock: () => 0 };

export function gnnStation() {
  return stations.find((s) => s.gnn) ?? null;
}

/** File a bulletin: archived on the desk, auto-accepted into chat with a desk link. */
export function gnnPost({ desk = "news", title = "", body = "", actions = [], source = "simulation" } = {}) {
  const b = { id: `gnn${gnn.seq++}`, at: gnn.clock(), publishedAt: Date.now(), source, desk, title, body, actions: actions.filter(Boolean).map((a) => ({ ...a, done: false })) };
  gnn.posts.push(b);
  if (gnn.posts.length > gnn.cap) gnn.posts.splice(0, gnn.posts.length - gnn.cap);
  const st = gnnStation();
  post({
    channel: "gnn",
    from: DESKS[desk]?.tag ?? "GNN",
    text: `${title}${title && body ? " — " : ""}${body}`,
    tone: desk === "security" ? "alert" : "news",
    links: [
      { label: st ? `GNN desk · ${st.name}` : "GNN desk", run: () => gnn.open?.(b.id) },
      ...b.actions.slice(0, 2).map((a, i) => ({ label: a.label, run: () => runAction(b, i) })),
    ],
    meta: { gnn: b.id },
  });
  return b;
}

/** Run a bulletin's action once (the chat link and the desk share this). */
export function runAction(b, i) {
  const a = b?.actions?.[i];
  if (!a || a.done) return false;
  a.done = !a.repeat;
  a.run?.();
  return true;
}

export function gnnById(id) { return gnn.posts.find((p) => p.id === id) ?? null; }

export function resetGnn() { gnn.posts.length = 0; }

/** Public text-only broadcast wire. Never publish action callbacks or site announcements. */
export function gnnBroadcastWire() {
  return gnn.posts.filter(p => p.source !== "site").slice(-40).map(p => ({
    id: String(p.id).slice(0, 80), at: Number(p.at) || 0,
    publishedAt: Number(p.publishedAt) || 0,
    desk: String(p.desk).slice(0, 24), title: String(p.title).slice(0, 180),
    body: String(p.body).slice(0, 1600)
  }));
}
