/* LIVING GALAXY — the account: a pilot that follows you between devices.
 *
 * 0.3.40. The website (living-galaxy.com, its own product line: lgsite.py)
 * keeps one versioned blob per account, and this module is the game's half of
 * that: it takes everything js/profile.js says belongs to a PILOT — the run
 * keys, the callsign-suffixed families, the learned nets, the profile record
 * — and syncs that whole namespace as one object. Device settings (mixer,
 * rock quality, fullscreen) and the CRADLE (the sky's population, which the
 * relay already shares) stay on the device, on purpose.
 *
 * WHERE IT WORKS. The game is played from three places: the website's
 * `/play/` (same origin as the API — cookies just work), a phone's own
 * server.py on the LAN, and a bare static host. Only the first has an account
 * behind it. So the module PROBES once at boot: `GET /api/me` answering JSON
 * means the site is there; a 404 (server.py, a static host) or a network error
 * means it is not, and every account feature reads "sign in at
 * living-galaxy.com to carry this pilot across devices" and does nothing else.
 * No CORS, no third origin, no token in the URL — the site's own security model
 * (HttpOnly cookie + the X-Requested-With header as the CSRF proof) is reused
 * as-is.
 *
 * VERSIONS AND CONFLICTS. Every upload carries `base_version`, the server
 * version this device last synced to. The server refuses a stale base with 409
 * — a second device wrote in between — and NOTHING is overwritten until the
 * pilot says which copy wins (the ACCOUNT panel puts both side by side). The
 * same question is asked on first sign-in when both the device and the account
 * already have a pilot. Restoring the account's copy rewrites localStorage and
 * RELOADS: two dozen modules read their keys at import or at launch, and
 * hot-swapping a pilot under a running sim is the kind of cleverness that eats
 * saves.
 *
 * WHEN IT SYNCS. A hash of the snapshot is kept, and an upload goes out only
 * when it changed: every SYNC_EVERY_MS while playing, when the tab is hidden
 * (after the other modules' own hidden-flushes, hence the setTimeout), on
 * pagehide with keepalive, and on SYNC NOW in the panel. The server allows 60
 * saves per ten minutes per account; this never gets near it.
 *
 * NEWS. `GET /api/news` is the site's announcement feed; each item is posted
 * to the GNN news desk once per device (the seen-set is a DEVICE key, so a new
 * pilot does not re-read the patch notes).
 *
 * No DOM at import. `fetch`, `reload` and `meta` are fields so the tests can
 * hand in fakes; nothing here imports the sim.
 */

import { RUN_KEYS, RUN_PREFIXES, LEARNED_KEYS, PROFILE_KEY } from "./profile.js";
import { useGameStore } from "./store.js";
import { gnnPost } from "./gnn.js";

export const SNAP_VERSION = 1;
export const SLOT = "default";
export const SYNC_EVERY_MS = 120000;      // the periodic check while playing
export const MIN_GAP_MS = 15000;          // never two uploads closer than this (server: 60 / 10 min)
export const NEWS_MAX_AT_ONCE = 5;        // bulletins posted per boot at most, newest of the unseen
export const STATE_KEY = "lgaa.account.v1";   // device: { version, hash, user } of the last sync
export const NEWS_SEEN_KEY = "lgaa.news.seen.v1"; // device: site news ids already put on the desk
export const SITE_LINK = "https://living-galaxy.com";

/** What belongs to a pilot and travels with the account. */
export const SCOPE = Object.freeze({
  keys: Object.freeze([...RUN_KEYS, ...LEARNED_KEYS, PROFILE_KEY]),
  prefixes: Object.freeze([...RUN_PREFIXES]),
});

export const account = {
  site: null,          // null = not probed yet · false = no site behind this origin · true = living-galaxy.com
  user: null,          // { id, username, verified, role } or null when signed out
  status: "idle",      // idle · probing · offline · signed-out · unverified · syncing · synced · conflict · error
  error: "",
  version: 0,          // the server version of SLOT this device last synced to
  hash: "",            // hash of the snapshot that version holds
  lastSync: 0,         // Date.now() of the last successful upload
  lastTry: 0,
  conflict: null,      // { server: {...}, local: {...} } while the pilot has a choice to make
  newer: null,         // { version, updatedAt, callsign } — a newer account copy seen while flying; the panel offers it
  busy: false,
  news: { fetched: false, posted: 0 },
  board: null,         // { pilots: [...], total, at } from /api/leaderboard — null until fetched, or on a site without one (0.3.43)
  open: (url) => globalThis.open?.(url, "_blank", "noopener"),   // how a bulletin's READ / DISCUSS gets out
  /* injection points — the tests hand in fakes, the browser uses the real ones */
  fetch: (...a) => globalThis.fetch(...a),
  reload: () => globalThis.location?.reload(),
  now: () => Date.now(),
  meta: null,          // () => { callsign, career, sky, credits } — wired by mountAccount
  flushers: [],        // () => void — modules that debounce their own saves flush here first
};

const store = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
const HEADERS = { "X-Requested-With": "lgsite", "Content-Type": "application/json" };

/* ---- the snapshot ------------------------------------------------------- */

/** Every key in SCOPE that is holding something, as { key: rawString }. */
export function snapshot() {
  const ls = store();
  const keys = {};
  if (!ls) return { v: SNAP_VERSION, at: account.now(), keys };
  for (const fn of account.flushers) { try { fn(); } catch { /* one bad flusher is not the snapshot's problem */ } }
  for (const k of SCOPE.keys) {
    try { const v = ls.getItem(k); if (v != null) keys[k] = v; } catch { /* skip */ }
  }
  try {
    for (let i = 0; i < (ls.length ?? 0); i++) {
      const k = ls.key(i);
      if (k && SCOPE.prefixes.some((p) => k.startsWith(p))) keys[k] = ls.getItem(k);
    }
  } catch { /* a Storage without length/key: the fixed keys are still in */ }
  return { v: SNAP_VERSION, at: account.now(), keys };
}

/** FNV-1a over the keys in a fixed order — change detection, not security. */
export function hashOf(snap) {
  const names = Object.keys(snap.keys).sort();
  let h = 0x811c9dc5;
  const eat = (s) => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } };
  for (const k of names) { eat(k); eat("\u0000"); eat(snap.keys[k]); eat("\u0001"); }
  return h.toString(16).padStart(8, "0");
}

/** True when the device has a pilot at all (a save, a profile, or a corp). */
export function hasLocalPilot(snap = snapshot()) {
  return Boolean(snap.keys["lgaa-save-v1"] || snap.keys[PROFILE_KEY] || snap.keys["lgaa-company"]);
}

/**
 * Put an account snapshot on this device: clear the scope first (a key the
 * account does not have must not survive from the previous pilot), then write.
 * Returns how many keys landed. The caller reloads.
 */
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
  } catch { /* fixed keys only */ }
  for (const k of doomed) { try { ls.removeItem(k); } catch { /* ignore */ } }
  let n = 0;
  for (const [k, v] of Object.entries(snap.keys)) {
    if (typeof v !== "string") continue;
    if (!SCOPE.keys.includes(k) && !SCOPE.prefixes.some((p) => k.startsWith(p))) continue; // never let a blob write outside its scope
    try { ls.setItem(k, v); n++; } catch { /* quota */ }
  }
  return n;
}

/* ---- device-side sync record -------------------------------------------- */

function readState() {
  try { const raw = store()?.getItem(STATE_KEY); if (raw) return JSON.parse(raw); } catch { /* corrupt */ }
  return null;
}
function writeState() {
  try { store()?.setItem(STATE_KEY, JSON.stringify({ version: account.version, hash: account.hash, user: account.user?.username ?? null, at: account.lastSync })); } catch { /* quota */ }
}

/* ---- HTTP --------------------------------------------------------------- */

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

/** One look for the site behind this origin; sets `account.site` and the signed-in user. */
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
  if (user && st && st.user === user.username) { account.version = st.version | 0; account.hash = st.hash ?? ""; account.lastSync = st.at ?? 0; }
  else { account.version = 0; account.hash = ""; account.lastSync = 0; }
  account.status = !user ? "signed-out" : !user.verified ? "unverified" : "synced";
  account.error = "";
}

/** Sign in with the site's JSON login; then reconcile the device with the account. */
export async function signIn(username, password) {
  if (!account.site) return fail("no site behind this origin");
  if (account.busy) return false;
  account.busy = true;
  try {
    const r = await call("/api/login", { method: "POST", body: { username, password } });
    if (r.status !== 200 || !r.json?.ok) return fail(r.json?.error || r.json?.message || `sign-in refused (${r.status})`);
    adopt(r.json.user);
    if (!r.json.user?.verified) return true; // signed in, but the account cannot save until the email is verified
    return await reconcile();
  } catch (e) {
    return fail(`sign-in failed: ${e?.message ?? e}`);
  } finally { account.busy = false; }
}

export async function signOut() {
  if (!account.site) return false;
  try { await call("/api/logout", { method: "POST", body: {} }); } catch { /* the cookie is dead either way */ }
  account.user = null; account.conflict = null; account.version = 0; account.hash = ""; account.lastSync = 0;
  account.status = "signed-out";
  try { store()?.removeItem(STATE_KEY); } catch { /* ignore */ }
  return true;
}

/** The account's copy of SLOT, or null when there is none yet. */
export async function pull() {
  const r = await call(`/api/save?slot=${encodeURIComponent(SLOT)}`);
  if (r.status === 404) return null;
  if (r.status !== 200 || !r.json?.data) throw new Error(r.json?.error || `pull failed (${r.status})`);
  return { version: r.json.version, updatedAt: r.json.updated_at, data: r.json.data };
}

/** Describe a snapshot for the conflict card without loading the sim. */
export function describe(snap) {
  const d = { callsign: "", career: "", credits: null, purse: null, sky: "", corp: "" };
  try {
    const s = JSON.parse(snap?.keys?.["lgaa-save-v1"] ?? "null");
    if (s?.callsign) d.callsign = s.callsign;
    if (Number.isFinite(s?.credits)) d.purse = Math.round(s.credits);   // 0.3.41: the wallet rides in the save
  } catch { /* skip */ }
  try { const p = JSON.parse(snap?.keys?.[PROFILE_KEY] ?? "null"); if (!d.callsign && p?.callsign) d.callsign = p.callsign; } catch { /* skip */ }
  try { const c = JSON.parse(snap?.keys?.["lgaa-company"] ?? "null"); if (c?.name) d.corp = c.name; if (typeof c?.treasury === "number") d.credits = Math.round(c.treasury); } catch { /* skip */ }
  return d;
}

/**
 * First sign-in on a device: three cases.
 *   account empty            → upload what is here (if anything)
 *   device empty             → take the account's copy and reload
 *   both hold a pilot        → the same bytes: adopt the version · different: ask
 */
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

/**
 * Upload the device's pilot. `force` sends the server's current version as the
 * base (the pilot chose this copy); otherwise the last synced version goes and
 * a 409 becomes a conflict for the panel.
 */
export async function push({ force = false, keepalive = false } = {}) {
  if (!account.site || !account.user?.verified) return false;
  const snap = snapshot();
  const h = hashOf(snap);
  if (!force && h === account.hash && account.version) { account.status = "synced"; return true; }
  if (!hasLocalPilot(snap)) return true; // nothing to carry yet
  let base = account.version;
  if (force && account.conflict) base = account.conflict.server.version;
  const meta = safeMeta(snap);
  account.status = "syncing";
  account.lastTry = account.now();
  let r;
  try {
    r = await call("/api/save", { method: "POST", keepalive, body: { slot: SLOT, data: snap, base_version: base, meta } });
  } catch (e) { return fail(`sync failed: ${e?.message ?? e}`); }
  if (r.status === 409) {
    let remote = null;
    try { remote = await pull(); } catch { /* the card shows less */ }
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

/** The pilot's answer to a conflict: "account" takes the server copy (reloads); "device" overwrites it. */
export async function resolve(choice) {
  const c = account.conflict;
  if (!c) return false;
  if (choice === "account") {
    let data = c.server.data;
    if (!data) { try { data = (await pull())?.data; } catch { /* fall through */ } }
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

/**
 * A device that is already signed in looks up once at boot: did another device
 * write a newer version? If this one has not changed since its own last sync
 * the newer copy is simply taken (the phone-then-desk case, no question to
 * ask); if both moved it is a conflict for the panel. `auto` false only
 * reports (`account.newer`), for a check made while the pilot is flying —
 * a reload mid-burn is not a favour.
 */
export async function checkRemote({ auto = true } = {}) {
  if (!account.site || !account.user?.verified || account.conflict) return false;
  let r;
  try { r = await call("/api/save"); } catch { return false; }
  const row = (r.json?.saves ?? []).find((s) => s.slot === SLOT);
  account.newer = null;
  if (!row || row.version <= account.version) return false;
  const local = snapshot();
  const unchanged = !hasLocalPilot(local) || hashOf(local) === account.hash;
  if (!unchanged) {
    let remote = null;
    try { remote = await pull(); } catch { /* the card shows less */ }
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

/** The panel's "take the newer copy" button, when checkRemote({auto:false}) found one. */
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

/** The periodic / lifecycle entry: upload if signed in, verified, unblocked, changed, and not too soon. */
export async function sync({ keepalive = false, force = false } = {}) {
  if (!account.site || !account.user?.verified || account.conflict || account.busy) return false;
  if (!force && account.now() - account.lastTry < MIN_GAP_MS) return false;
  account.busy = true;
  try { return await push({ keepalive }); } finally { account.busy = false; }
}

/* ---- news → the GNN desk ------------------------------------------------ */

function seenNews() {
  try { return new Set(JSON.parse(store()?.getItem(NEWS_SEEN_KEY) || "[]")); } catch { return new Set(); }
}
function markSeen(ids) {
  const s = seenNews();
  for (const id of ids) s.add(id);
  try { store()?.setItem(NEWS_SEEN_KEY, JSON.stringify([...s].slice(-200))); } catch { /* quota */ }
}

/** Site markup is bold/italic/code/quotes; the desk reads plain text. */
export function plainText(s) {
  return String(s ?? "").replace(/```[\s\S]*?```/g, " ").replace(/[*`_]+/g, "").replace(/^>\s?/gm, "").replace(/\s+/g, " ").trim();
}

const KIND_TAG = { news: "", update: "UPDATE · ", patch: "PATCH NOTES · ", event: "EVENT · " };

/** Fetch the site's feed and put every unseen item on the GNN news desk, oldest first. */
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

/** 0.3.43 — a bulletin from the site links back to it: the item's page, and
 * its discussion thread with the reply count. Both repeat (a link is not a
 * thing you do once), both stay inside the site's origin, and a feed from a
 * site without them (0.1.0) simply has no buttons. */
export function newsActions(n) {
  const acts = [];
  const safe = (u) => typeof u === "string" && /^\/[^/\\]/.test(u);   // same-origin paths only — never a scheme, never //host
  if (safe(n.url)) acts.push({ label: "Read", repeat: true, run: () => account.open(n.url) });
  if (safe(n.discuss)) acts.push({ label: n.replies > 0 ? `Discuss (${n.replies})` : "Discuss", repeat: true, run: () => account.open(n.discuss) });
  return acts;
}

/* ---- the pilots board -------------------------------------------------- */

export const BOARD_EVERY_MS = 60000;

/** Top pilots by purse from the site. null on a site without the board (0.1.0) or offline. */
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

/* ---- boot --------------------------------------------------------------- */

/** Everything the panel shows in one line. */
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

/** The line under the callsign on the start card, when there is a site to speak of. */
function paintStartLine() {
  const el = globalThis.document?.getElementById?.("account-line");
  if (!el) return;
  if (!account.site) { el.hidden = true; return; }
  el.hidden = false;
  el.classList.toggle("on", Boolean(account.user?.verified));
  el.textContent = "";
  if (account.status === "restoring") { el.textContent = "Loading your pilot from the account…"; return; }
  if (account.user?.verified) { el.textContent = `Signed in as ${account.user.username} · this pilot syncs to your account`; return; }
  if (account.user) { el.textContent = `${account.user.username} — verify your email to sync this pilot`; return; }
  const a = globalThis.document.createElement("a");
  a.href = "/login?next=/play/"; a.textContent = "Sign in";
  el.append(a, ` at living-galaxy.com to bring your pilot here, or play as a guest.`);
}

/**
 * Wire the lifecycle. `meta()` supplies the summary the account page shows;
 * `flushers` are the modules that debounce their own saves. Returns the timer
 * so a test can stop it. Safe without a window.
 */
export function mountAccount({ meta = null, flushers = [] } = {}) {
  if (meta) account.meta = meta;
  account.flushers = flushers;
  const doc = globalThis.document ?? null;
  let timer = 0;
  probe().then((ok) => {
    paintStartLine();
    if (!ok) return;
    /* the feed lands once the pilot is flying, not on the menu screen */
    let posted = false;
    const tryNews = (s) => { if (!posted && s.phase === "play") { posted = true; postNews(); } };
    tryNews(useGameStore.getState());
    if (!posted) useGameStore.subscribe(tryNews);
    if (account.user?.verified) {
      const p = !account.version ? reconcile() : checkRemote({ auto: useGameStore.getState().phase !== "play" });
      p.then(paintStartLine);
    }
    timer = setInterval(() => sync(), SYNC_EVERY_MS);
    timer.unref?.();
  });
  if (doc?.addEventListener) {
    doc.addEventListener("visibilitychange", () => {
      if (doc.visibilityState === "hidden") setTimeout(() => sync({ keepalive: true, force: true }), 0);
      else if (account.site && account.user?.verified) checkRemote({ auto: useGameStore.getState().phase !== "play" });
    });
  }
  if (globalThis.window?.addEventListener) {
    window.addEventListener("pagehide", () => { sync({ keepalive: true, force: true }); });
  }
  if (globalThis.window?.__lg) window.__lg.account = { account, sync, push, pull, signIn, signOut, resolve, snapshot, restore, postNews, checkRemote, takeNewer, loadBoard };
  return () => { if (timer) clearInterval(timer); };
}
