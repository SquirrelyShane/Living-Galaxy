import { RUN_KEYS, RUN_PREFIXES, LEARNED_KEYS, PROFILE_KEY } from "../core/profile.js";
import { useGameStore } from "../core/store.js";
import { gnnPost } from "../comms/gnn.js";

export const SNAP_VERSION = 1;
export const SLOT = "default";
export const PILOT_SLOTS = ["p1", "p2", "p3"];
export const MAX_PILOTS = 3;
export const SYNC_EVERY_MS = 120000;
export const MIN_GAP_MS = 15000;
export const NEWS_MAX_AT_ONCE = 5;
export const STATE_KEY = "lgaa.account.v1";
export const NEWS_SEEN_KEY = "lgaa.news.seen.v1";
export const SITE_LINK = "https://living-galaxy.com";

export const SCOPE = Object.freeze({
  keys: Object.freeze([...RUN_KEYS, ...LEARNED_KEYS, PROFILE_KEY]),
  prefixes: Object.freeze([...RUN_PREFIXES]),
});

export const account = {
  site: null,
  user: null,
  status: "idle",
  error: "",
  slot: SLOT,
  pilots: null,
  guest: false,
  version: 0,
  hash: "",
  lastSync: 0,
  lastTry: 0,
  conflict: null,
  newer: null,
  busy: false,
  news: { fetched: false, posted: 0 },
  board: null,
  open: (url) => globalThis.open?.(url, "_blank", "noopener"),
  fetch: (...a) => globalThis.fetch(...a),
  reload: () => globalThis.location?.reload(),
  now: () => Date.now(),
  meta: null,
  flushers: [],
};

const store = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
const HEADERS = { "X-Requested-With": "lgsite", "Content-Type": "application/json" };

export function snapshot() {
  const ls = store();
  const keys = {};
  if (!ls) return { v: SNAP_VERSION, at: account.now(), keys };
  for (const fn of account.flushers) { try { fn(); } catch {} }
  for (const k of SCOPE.keys) {
    try { const v = ls.getItem(k); if (v != null) keys[k] = v; } catch {}
  }
  try {
    for (let i = 0; i < (ls.length ?? 0); i++) {
      const k = ls.key(i);
      if (k && SCOPE.prefixes.some((p) => k.startsWith(p))) keys[k] = ls.getItem(k);
    }
  } catch {}
  return { v: SNAP_VERSION, at: account.now(), keys };
}

export function hashOf(snap) {
  const names = Object.keys(snap.keys).sort();
  let h = 0x811c9dc5;
  const eat = (s) => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } };
  for (const k of names) { eat(k); eat("\u0000"); eat(snap.keys[k]); eat("\u0001"); }
  return h.toString(16).padStart(8, "0");
}

export function hasLocalPilot(snap = snapshot()) {
  return Boolean(snap.keys["lgaa-save-v1"] || snap.keys[PROFILE_KEY] || snap.keys["lgaa-company"]);
}

export function restore(snap) {
  const ls = store();
  if (!ls || !snap || typeof snap.keys !== "object") return 0;
  const doomed = [];
  for (const k of SCOPE.keys) doomed.push(k);
  try {
    for (let i = 0; i < (ls.length ?? 0); i++) {
      const k = ls.key(i);
      if (k && SCOPE.prefixes.some((p) => k.startsWith(p))) doomed.push(k);
    }
  } catch {}
  for (const k of doomed) { try { ls.removeItem(k); } catch {} }
  let n = 0;
  for (const [k, v] of Object.entries(snap.keys)) {
    if (typeof v !== "string") continue;
    if (!SCOPE.keys.includes(k) && !SCOPE.prefixes.some((p) => k.startsWith(p))) continue;
    try { ls.setItem(k, v); n++; } catch {}
  }
  return n;
}

function readState() {
  try { const raw = store()?.getItem(STATE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return null;
}
function writeState() {
  try { store()?.setItem(STATE_KEY, JSON.stringify({ version: account.version, hash: account.hash, user: account.user?.username ?? null, at: account.lastSync, slot: account.slot })); } catch {}
}

async function call(path, { method = "GET", body = null, keepalive = false } = {}) {
  const init = { method, headers: HEADERS, cache: "no-store", credentials: "same-origin", keepalive };
  if (body != null) init.body = JSON.stringify(body);
  const res = await account.fetch(path, init);
  let json = null;
  const ct = res.headers?.get?.("content-type") ?? "";
  if (/json/.test(ct)) { try { json = await res.json(); } catch { json = null; } }
  return { status: res.status, ok: res.ok, json };
}

const fail = (msg) => { account.status = "error"; account.error = msg; return false; };

export async function probe() {
  if (account.site !== null) return account.site;
  account.status = "probing";
  try {
    const r = await call("/api/me");
    if (r.status !== 200 || !r.json || !("user" in r.json)) { account.site = false; account.status = "offline"; return false; }
    account.site = true;
    adopt(r.json.user);
  } catch {
    account.site = false; account.status = "offline"; return false;
  }
  return true;
}

function adopt(user) {
  account.user = user ?? null;
  const st = readState();
  if (user && st && st.user === user.username) { account.version = st.version | 0; account.hash = st.hash ?? ""; account.lastSync = st.at ?? 0; account.slot = st.slot || SLOT; }
  else { account.version = 0; account.hash = ""; account.lastSync = 0; account.slot = SLOT; }
  account.guest = !user?.verified;
  account.status = !user ? "signed-out" : !user.verified ? "unverified" : "synced";
  account.error = "";
}

export async function signIn(username, password) {
  if (!account.site) return fail("no site behind this origin");
  if (account.busy) return false;
  account.busy = true;
  try {
    const r = await call("/api/login", { method: "POST", body: { username, password } });
    if (r.status !== 200 || !r.json?.ok) return fail(r.json?.error || r.json?.message || `sign-in refused (${r.status})`);
    adopt(r.json.user);
    if (!r.json.user?.verified) return true;
    return await reconcile();
  } catch (e) {
    return fail(`sign-in failed: ${e?.message ?? e}`);
  } finally { account.busy = false; }
}

export async function signOut() {
  if (!account.site) return false;
  try { await call("/api/logout", { method: "POST", body: {} }); } catch {}
  account.user = null; account.conflict = null; account.version = 0; account.hash = ""; account.lastSync = 0;
  account.status = "signed-out";
  try { store()?.removeItem(STATE_KEY); } catch {}
  return true;
}

export async function pull() {
  const r = await call(`/api/save?slot=${encodeURIComponent(account.slot)}`);
  if (r.status === 404) return null;
  if (r.status !== 200 || !r.json?.data) throw new Error(r.json?.error || `pull failed (${r.status})`);
  return { version: r.json.version, updatedAt: r.json.updated_at, data: r.json.data };
}

export function describe(snap) {
  const d = { callsign: "", career: "", credits: null, purse: null, sky: "", corp: "" };
  try {
    const s = JSON.parse(snap?.keys?.["lgaa-save-v1"] ?? "null");
    if (s?.callsign) d.callsign = s.callsign;
    if (Number.isFinite(s?.credits)) d.purse = Math.round(s.credits);
  } catch {}
  try { const p = JSON.parse(snap?.keys?.[PROFILE_KEY] ?? "null"); if (!d.callsign && p?.callsign) d.callsign = p.callsign; } catch {}
  try { const c = JSON.parse(snap?.keys?.["lgaa-company"] ?? "null"); if (c?.name) d.corp = c.name; if (typeof c?.treasury === "number") d.credits = Math.round(c.treasury); } catch {}
  return d;
}

async function reconcile() {
  let remote;
  try { remote = await pull(); } catch (e) { return fail(e.message); }
  const local = snapshot();
  const lh = hashOf(local);
  if (!remote) {
    if (!hasLocalPilot(local)) { account.status = "synced"; return true; }
    return push({ force: true });
  }
  const rh = hashOf(remote.data);
  if (rh === lh || !hasLocalPilot(local)) {
    account.version = remote.version; account.hash = rh; account.lastSync = account.now(); writeState();
    if (rh !== lh) { restore(remote.data); account.status = "restoring"; account.reload(); }
    else account.status = "synced";
    return true;
  }
  account.conflict = { server: { version: remote.version, updatedAt: remote.updatedAt, ...describe(remote.data), data: remote.data }, local: describe(local) };
  account.status = "conflict";
  return true;
}

export async function push({ force = false, keepalive = false } = {}) {
  if (!account.site || !account.user?.verified) return false;
  const snap = snapshot();
  const h = hashOf(snap);
  if (!force && h === account.hash && account.version) { account.status = "synced"; return true; }
  if (!hasLocalPilot(snap)) return true;
  let base = account.version;
  if (force && account.conflict) base = account.conflict.server.version;
  const meta = safeMeta(snap);
  account.status = "syncing";
  account.lastTry = account.now();
  let r;
  try {
    r = await call("/api/save", { method: "POST", keepalive, body: { slot: account.slot, data: snap, base_version: base, meta } });
  } catch (e) { return fail(`sync failed: ${e?.message ?? e}`); }
  if (r.status === 409) {
    let remote = null;
    try { remote = await pull(); } catch {}
    account.conflict = { server: remote ? { version: remote.version, updatedAt: remote.updatedAt, ...describe(remote.data), data: remote.data } : { version: base + 1 }, local: describe(snap) };
    account.status = "conflict";
    return false;
  }
  if (r.status === 401 || r.status === 403) { account.user = null; account.status = "signed-out"; account.error = r.json?.error || "signed out"; return false; }
  if (r.status !== 200 || !r.json?.ok) return fail(r.json?.error || `sync refused (${r.status})`);
  account.version = r.json.version; account.hash = h; account.lastSync = account.now(); account.conflict = null;
  account.status = "synced"; account.error = "";
  writeState();
  return true;
}

function safeMeta(snap) {
  let m = null;
  try { m = account.meta?.() ?? null; } catch { m = null; }
  const d = describe(snap);
  return {
    callsign: String(m?.callsign ?? d.callsign ?? "").slice(0, 40),
    career: String(m?.career ?? "").slice(0, 32),
    sky: String(m?.sky ?? "").slice(0, 32),
    credits: Math.max(0, Math.round(Number(m?.credits ?? d.purse ?? d.credits ?? 0) || 0)),
  };
}

export async function resolve(choice) {
  const c = account.conflict;
  if (!c) return false;
  if (choice === "account") {
    let data = c.server.data;
    if (!data) { try { data = (await pull())?.data; } catch {} }
    if (!data) return fail("could not fetch the account copy");
    restore(data);
    account.version = c.server.version; account.hash = hashOf(data); account.lastSync = account.now(); account.conflict = null;
    writeState();
    account.status = "restoring";
    account.reload();
    return true;
  }
  if (choice === "device") return push({ force: true });
  return false;
}

export async function checkRemote({ auto = true } = {}) {
  if (!account.site || !account.user?.verified || account.conflict) return false;
  let r;
  try { r = await call("/api/save"); } catch { return false; }
  const row = (r.json?.saves ?? []).find((s) => s.slot === account.slot);
  account.newer = null;
  if (!row || row.version <= account.version) return false;
  const local = snapshot();
  const unchanged = !hasLocalPilot(local) || hashOf(local) === account.hash;
  if (!unchanged) {
    let remote = null;
    try { remote = await pull(); } catch {}
    account.conflict = { server: remote ? { version: remote.version, updatedAt: remote.updatedAt, ...describe(remote.data), data: remote.data } : { version: row.version }, local: describe(local) };
    account.status = "conflict";
    return true;
  }
  if (!auto) { account.newer = { version: row.version, updatedAt: row.updated_at, callsign: row.callsign }; return true; }
  let remote;
  try { remote = await pull(); } catch (e) { return fail(e.message); }
  if (!remote) return false;
  restore(remote.data);
  account.version = remote.version; account.hash = hashOf(remote.data); account.lastSync = account.now();
  writeState();
  account.status = "restoring";
  account.reload();
  return true;
}

export async function takeNewer() {
  if (!account.newer) return false;
  account.newer = null;
  let remote;
  try { remote = await pull(); } catch (e) { return fail(e.message); }
  if (!remote) return false;
  restore(remote.data);
  account.version = remote.version; account.hash = hashOf(remote.data); account.lastSync = account.now();
  writeState();
  account.status = "restoring";
  account.reload();
  return true;
}

export async function sync({ keepalive = false, force = false } = {}) {
  if (!account.site || !account.user?.verified || account.conflict || account.busy) return false;
  if (!force && account.now() - account.lastTry < MIN_GAP_MS) return false;
  account.busy = true;
  try { return await push({ keepalive }); } finally { account.busy = false; }
}

function seenNews() {
  try { return new Set(JSON.parse(store()?.getItem(NEWS_SEEN_KEY) || "[]")); } catch { return new Set(); }
}
function markSeen(ids) {
  const s = seenNews();
  for (const id of ids) s.add(id);
  try { store()?.setItem(NEWS_SEEN_KEY, JSON.stringify([...s].slice(-200))); } catch {}
}

export function plainText(s) {
  return String(s ?? "").replace(/```[\s\S]*?```/g, " ").replace(/[*`_]+/g, "").replace(/^>\s?/gm, "").replace(/\s+/g, " ").trim();
}

const KIND_TAG = { news: "", update: "UPDATE · ", patch: "PATCH NOTES · ", event: "EVENT · " };

export async function postNews() {
  if (!account.site || account.news.fetched) return 0;
  account.news.fetched = true;
  let items = [];
  try {
    const r = await call("/api/news");
    if (r.status !== 200 || !Array.isArray(r.json?.news)) return 0;
    items = r.json.news;
  } catch { return 0; }
  const seen = seenNews();
  const fresh = items.filter((n) => n && n.id != null && !seen.has(n.id)).slice(0, NEWS_MAX_AT_ONCE).reverse();
  for (const n of fresh) {
    gnnPost({ source: "site", desk: "news", title: `${KIND_TAG[n.kind] ?? ""}${plainText(n.title)}`.slice(0, 120), body: plainText(n.text).slice(0, 400), actions: newsActions(n) });
  }
  markSeen(items.map((n) => n.id));
  account.news.posted += fresh.length;
  return fresh.length;
}

export function newsActions(n) {
  const acts = [];
  const safe = (u) => typeof u === "string" && /^\/[^/\\]/.test(u);
  if (safe(n.url)) acts.push({ label: "Read", repeat: true, run: () => account.open(n.url) });
  if (safe(n.discuss)) acts.push({ label: n.replies > 0 ? `Discuss (${n.replies})` : "Discuss", repeat: true, run: () => account.open(n.discuss) });
  return acts;
}

export const BOARD_EVERY_MS = 60000;

export async function loadBoard({ force = false } = {}) {
  if (!account.site) return null;
  if (!force && account.board && account.now() - account.board.at < BOARD_EVERY_MS) return account.board;
  try {
    const r = await call("/api/leaderboard");
    if (r.status !== 200 || !Array.isArray(r.json?.pilots)) { account.board = null; return null; }
    account.board = { pilots: r.json.pilots.slice(0, 10), total: r.json.total | 0, at: account.now() };
  } catch { account.board = null; }
  return account.board;
}

export function accountLine() {
  switch (account.status) {
    case "idle": case "probing": return "Looking for the site…";
    case "offline": return "Play from living-galaxy.com to carry this pilot across devices.";
    case "signed-out": return "Not signed in.";
    case "unverified": return `${account.user?.username} — verify your email to sync.`;
    case "syncing": return "Syncing…";
    case "synced": return account.newer ? `${account.user?.username} · a newer copy (v${account.newer.version}) is on the account`
      : account.lastSync ? `${account.user?.username} · synced v${account.version}` : `${account.user?.username} · nothing to sync yet`;
    case "conflict": return "Two copies — choose one below.";
    case "restoring": return "Loading the account copy…";
    case "error": return `Error: ${account.error}`;
    default: return account.status;
  }
}

export async function listPilots() {
  if (!account.site || !account.user?.verified) { account.pilots = []; return []; }
  let r;
  try { r = await call("/api/save"); } catch { account.pilots = account.pilots ?? []; return account.pilots; }
  account.pilots = r.status === 200 ? (r.json?.saves ?? []).filter((p) => p.slot === SLOT || PILOT_SLOTS.includes(p.slot)) : [];
  return account.pilots;
}

export async function flyPilot(slot) {
  if (!account.site || !account.user?.verified) return false;
  const was = account.slot;
  account.slot = slot;
  let remote;
  try { remote = await pull(); } catch (e) { account.slot = was; return fail(e.message); }
  if (!remote) { account.slot = was; return fail("that pilot is not on the account any more"); }
  restore(remote.data);
  account.version = remote.version; account.hash = hashOf(remote.data); account.lastSync = account.now();
  account.conflict = null; account.newer = null;
  account.status = "synced";
  writeState();
  return true;
}

export function newPilotSlot() {
  const taken = new Set((account.pilots ?? []).map((p) => p.slot));
  if (taken.size >= MAX_PILOTS) return null;
  const slot = PILOT_SLOTS.find((s) => !taken.has(s)) ?? null;
  if (!slot) return null;
  restore({ keys: {} });
  account.slot = slot; account.version = 0; account.hash = ""; account.lastSync = 0;
  account.conflict = null; account.newer = null;
  writeState();
  return slot;
}

export async function deletePilot(slot) {
  if (!account.site || !account.user?.verified) return false;
  let r;
  try { r = await call("/api/save", { method: "DELETE", body: { slot } }); } catch { return false; }
  if (r.status !== 200) return false;
  account.pilots = (account.pilots ?? []).filter((p) => p.slot !== slot);
  if (account.slot === slot) { account.slot = SLOT; account.version = 0; account.hash = ""; writeState(); }
  return true;
}

export function eraseGuest() {
  if (!account.site || !account.guest) return 0;
  return restore({ keys: {} });
}

function emitReady() {
  try { globalThis.document?.dispatchEvent?.(new CustomEvent("lg-account", { detail: account })); } catch {}
}

function paintStartLine() {
  const el = globalThis.document?.getElementById?.("account-line");
  if (!el) return;
  if (!account.site) { el.hidden = true; return; }
  el.hidden = false;
  el.classList.toggle("on", Boolean(account.user?.verified));
  el.textContent = "";
  if (account.status === "restoring") { el.textContent = "Loading your pilot from the account…"; return; }
  if (account.user?.verified) { el.textContent = `Signed in as ${account.user.username} · pilots save to your account`; return; }
  if (account.user) { el.textContent = `${account.user.username} — verify your email to save pilots. Until then you fly as a guest in Sol.`; return; }
  const a = globalThis.document.createElement("a");
  a.href = "/login?next=/play/"; a.textContent = "Sign in";
  el.append(a, " to save pilots and pick a system. Guests fly in Sol and are not kept.");
}

export function mountAccount({ meta = null, flushers = [] } = {}) {
  if (meta) account.meta = meta;
  account.flushers = flushers;
  const doc = globalThis.document ?? null;
  let timer = 0;
  probe().then((ok) => {
    paintStartLine();
    if (!ok) { emitReady(); return; }
    let posted = false;
    const tryNews = (s) => { if (!posted && s.phase === "play") { posted = true; postNews(); } };
    tryNews(useGameStore.getState());
    if (!posted) useGameStore.subscribe(tryNews);
    if (account.user?.verified) { account.pilots = null; emitReady(); listPilots().then(() => { paintStartLine(); emitReady(); }); }
    else { eraseGuest(); emitReady(); }
    timer = setInterval(() => sync(), SYNC_EVERY_MS);
    timer.unref?.();
  });
  if (doc?.addEventListener) {
    doc.addEventListener("visibilitychange", () => {
      if (doc.visibilityState === "hidden") setTimeout(() => sync({ keepalive: true, force: true }), 0);
      else if (account.site && account.user?.verified && useGameStore.getState().phase === "play") checkRemote({ auto: false });
    });
  }
  if (globalThis.window?.addEventListener) {
    window.addEventListener("pagehide", () => { sync({ keepalive: true, force: true }); });
  }
  if (globalThis.window?.__lg) window.__lg.account = { account, sync, push, pull, signIn, signOut, resolve, snapshot, restore, postNews, checkRemote, takeNewer, loadBoard, listPilots, flyPilot, newPilotSlot, deletePilot, eraseGuest };
  return () => { if (timer) clearInterval(timer); };
}
