/* LIVING GALAXY — the chatbox.
 *
 * Sits where the thumbstick was (the nose is steered by dragging the sky).
 * One stream over chat.js: the open channel (speech band), GNN bulletins,
 * your drones' reports, ship notices — with tabs, unread badges and the
 * tappable links each message carries. What you type goes out on the band:
 * to the live call if one is up, otherwise to the nearest hull or port in
 * reach, answered in character by the speech engine.
 */

import { chat, CHANNELS, onChat, recent, markRead, follow, post } from "../chat.js";
import { sim } from "../sim.js";
import { stations } from "../stations.js";
import { contacts } from "../turrets.js";
import { traffic } from "../npc/traffic.js";
import { talkTo, SPEECH_RANGE } from "../npc/speech.js";
import { comms } from "../comms/comms.js";

const TABS = [["all", "All"], ["local", "Local"], ["gnn", "GNN"], ["drones", "Drones"]];
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export const chatbox = { channel: "all", size: 0, root: null, seen: 0 };   // size: 0 folded to the input · 1 open · 2 tall

function ago(at) { const s = Math.max(0, Math.round(sim.time - at)); return s < 90 ? `${s}s` : s < 5400 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`; }

function row(m) {
  const r = el("div", `cb-row ${m.channel} ${m.tone}`);
  const head = el("div", "cb-head");
  if (m.from) head.append(el("b", null, m.from));
  if (m.meta?.to) head.append(el("i", null, `› ${m.meta.to}`));
  head.append(el("span", "cb-when", ago(m.at)));
  r.append(head, el("p", "cb-text", m.text));
  if (m.links?.length) {
    const L = el("div", "cb-links");
    m.links.forEach((l, i) => { const b = el("button", "cb-link", l.label); b.type = "button"; b.addEventListener("click", () => follow(m, i)); L.append(b); });
    r.append(L);
  }
  return r;
}

/* unread on the open tab: "All" counts every channel */
function unreadHere() {
  if (chatbox.channel === "all") return Object.values(chat.unread).reduce((a, n) => a + n, 0);
  return chat.unread[chatbox.channel] ?? 0;
}
function paintUnread() {
  const b = $("cb-unread"), n = $("cb-unread-n");
  if (!b || !n) return;
  const k = unreadHere();
  n.textContent = k > 99 ? "99+" : String(k);
  b.classList.toggle("has", k > 0);
  b.hidden = chatbox.size !== 0;
  const f = $("cb-fold"); if (f) f.hidden = chatbox.size === 0;
}
function setSize(size) {
  chatbox.size = size;
  const hud = $("hud");
  chatbox.root?.classList.toggle("open", size === 2);
  chatbox.root?.classList.toggle("folded", size === 0);
  hud?.classList.toggle("chat-folded", size === 0);
  if (size > 0) { markRead(chatbox.channel === "all" ? null : chatbox.channel); paintTabs(); paintLog(); }
  paintUnread();
}

function paintTabs() {
  const tabs = $("cb-tabs");
  if (!tabs) return;
  tabs.innerHTML = "";
  for (const [id, label] of TABS) {
    const b = el("button", `cb-tab${chatbox.channel === id ? " on" : ""}`, label);
    b.type = "button";
    const n = id === "all" ? 0 : chat.unread[id] ?? 0;
    if (n) b.append(el("i", "cb-badge", String(Math.min(99, n))));
    b.addEventListener("click", () => { chatbox.channel = id; markRead(id === "all" ? null : id); paintTabs(); paintLog(); });
    tabs.append(b);
  }
}

function paintLog() {
  const log = $("cb-log");
  if (!log) return;
  log.innerHTML = "";
  const list = recent(60, chatbox.channel === "all" ? null : chatbox.channel);
  if (!list.length) log.append(el("p", "cb-empty", CHANNELS[chatbox.channel]?.hint ?? "Quiet band."));
  for (const m of list) log.append(row(m));
  log.scrollTop = log.scrollHeight;
}

/** Who a typed line reaches: the live call, else the nearest hull or port in speech range. */
function target() {
  const s = comms.session;
  if (s && s.isLive) return { session: s };
  let best = null, bd = SPEECH_RANGE;
  for (const c of contacts) {
    if (c.kind !== "npc") continue;
    const d = d3(c, sim.ship.pos);
    if (d >= bd) continue;
    const n = traffic.find((v) => v.id === c.id);
    bd = d;
    /* the person, not the hull: the band labels a voice by who is flying, and
     * a reply to you that used the hull name made the same ship look like two
     * different contacts in the same log */
    best = { entity: n, kind: "vessel", name: n?.captain || c.name, hull: c.name };
  }
  for (const st of stations) { if (st.hostile && !st.claimed) continue; const d = d3(st, sim.ship.pos) * 0.7; if (d < bd) { bd = d; best = { entity: st, kind: "station", name: st.name }; } }
  return best;
}

function send() {
  const inp = $("cb-in");
  const text = inp?.value.trim();
  if (!text) return;
  inp.value = "";
  const t = target();
  post({ channel: "you", from: sim.callsign || "You", text, meta: { to: t?.name ?? t?.session?.peerName ?? null }, tone: "you" });
  if (!t) { post({ channel: "sys", text: "Nobody in range of the band." }); return; }
  if (t.session) { t.session.say(text); return; }
  setTimeout(() => {
    const r = talkTo(t.entity, text, sim.time, t.kind);
    if (!r?.text) { post({ channel: "local", from: t.name, text: "…", tone: "neutral" }); return; }
    /* talkTo hands back the band's own label for this voice — use it, so a
     * reply and the same voice's chatter carry one name */
    post({ channel: "local", from: r.speaker || t.name, text: r.text, tone: t.entity?.sector === "pirate" ? "hostile" : "neutral", meta: { to: sim.callsign || "you" } });
  }, 700 + Math.min(1800, text.length * 30));
}

export function mountChatbox() {
  const root = $("chatbox");
  if (!root) return;
  chatbox.root = root;
  root.addEventListener("pointerdown", (e) => e.stopPropagation());
  /* the toggle cycles folded → open → tall → folded; the unread badge opens it */
  $("cb-toggle")?.addEventListener("click", () => setSize((chatbox.size + 1) % 3));
  $("cb-unread")?.addEventListener("click", () => setSize(1));
  $("cb-fold")?.addEventListener("click", () => { $("cb-in")?.blur(); setSize(0); });
  $("cb-in")?.addEventListener("focus", () => { if (chatbox.size === 0) setSize(1); });
  $("cb-send")?.addEventListener("click", send);
  $("cb-in")?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); send(); } e.stopPropagation(); });
  $("cb-in")?.addEventListener("keyup", (e) => e.stopPropagation());
  /* Proxies for controls that live on the retired dash pages: tap the visible
   * one, the real button gets the click, and its status text is mirrored here
   * each paint. The APPROACH bar is the live user (index.html); the DOCK and
   * HAIL side keys were removed in 0.3.07 — not because the mechanism failed,
   * but because `.side-keys` was painted UNDER the 3D canvas, so every tap on
   * them went to the sky instead. Anything added here needs to sit in a
   * stacking context above #view or it will be dead in exactly the same way. */
  const proxies = [...document.querySelectorAll("[data-proxy]")];
  for (const b of proxies) b.addEventListener("click", () => $(b.dataset.proxy)?.click());
  paintTabs(); paintLog();
  setSize(0);
  onChat((m) => {
    if (chatbox.size === 0) { paintUnread(); paintTabs(); root.classList.add("pulse"); setTimeout(() => root.classList.remove("pulse"), 1100); return; }
    if (chatbox.channel !== "all" && m.channel !== chatbox.channel) { paintTabs(); return; }
    if (chatbox.channel === "all") markRead(m.channel);
    const log = $("cb-log");
    if (!log) return;
    log.querySelector(".cb-empty")?.remove();
    log.append(row(m));
    while (log.children.length > 60) log.firstChild.remove();
    log.scrollTop = log.scrollHeight;
    root.classList.add("pulse");
    setTimeout(() => root.classList.remove("pulse"), 1100);
  });
  if (globalThis.window?.__lg) window.__lg.chatbox = { chatbox, paintLog, send, target, setSize, unreadHere };
  return function paintChat() {
    for (const b of proxies) {
      const st = $(b.dataset.proxySt)?.textContent ?? "";
      const sm = b.querySelector("small") ?? b.querySelector(".warp-state");
      if (sm && sm.textContent !== st) sm.textContent = st;
      const src = $(b.dataset.proxy);
      b.classList.toggle("on", src?.classList.contains("on") || /^ON|DOCKED|LIVE|RING/.test(st));
    }
    /* every ~10 s the ages tick over */
    const now = performance.now();
    if (now - chatbox.seen < 10000) return;
    chatbox.seen = now;
    for (const [i, m] of recent(60, chatbox.channel === "all" ? null : chatbox.channel).entries()) {
      const w = $("cb-log")?.children[i]?.querySelector(".cb-when");
      if (w) w.textContent = ago(m.at);
    }
  };
}
