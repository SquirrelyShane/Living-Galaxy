import { applyReliable, applyRemoteState, dropRemote, shiftClock, sim } from "../sim/sim.js";
import { useGameStore } from "../core/store.js";

const RATE_HZ = 5;
const POLL_MS = 220;
const LONELY_HZ = 0.5;
const CLOCK_DEAD = 0.25;
const CLOCK_GAIN_MIN = 0.3;
const CLOCK_GAIN_RAMP = 0.06;
const CLOCK_GAIN_MAX = 0.85;

const LONELY_POLL_MS = 1000;
const LONELY_AFTER_MS = 10000;
const BACKOFF_MS = 4000;
const NO_RELAY_MS = 30000;
const NO_RELAY_MAX_MS = 600000;
let noRelayMisses = 0;

export const net = {
  online: false,
  room: null,
  selfId: "",
  peers: 0,
  lonelySince: 0,
  seq: 0,
  lastError: "",
  relay: null,
  worldBorn: 0,
  serverNow: 0,
  host: false,
  hostId: null,
  wseq: 0,
  roomListeners: new Set(),
  listeners: new Set(),
};

let pollTimer = 0;
let lastSend = 0;
export const lonely = () => net.lonelySince > 0 && performance.now() - net.lonelySince > LONELY_AFTER_MS;
let inflight = false;
let stopped = true;
let pollGen = 0;

function selfId() {
  if (net.selfId) return net.selfId;
  let id = "";
  try {
    id = sessionStorage.getItem("lgaa-net-id") || "";
  } catch {
  }
  if (!id) {
    id = `p${Math.random().toString(36).slice(2, 8)}`;
    try {
      sessionStorage.setItem("lgaa-net-id", id);
    } catch {
    }
  }
  net.selfId = id;
  sim.selfId = id;
  return id;
}

function noRelay(status, path) {
  if (net.relay === false) return;
  net.relay = false;
  net.online = false;
  console.warn(`[net] ${path} answered ${status} — this server has no relay (static host). Run \`python3 server.py 8080\` for shared skies; looking again at 30 s, backing off to every 10 min.`);
}

async function post(kind, data, to) {
  if (net.relay === false) return;
  if (kind === "state" && !net.online) return;
  const body = JSON.stringify({ room: net.room, from: selfId(), kind, to: to || undefined, data });
  const res = await fetch("/net/send", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  if (res.status === 404 || res.status === 405 || res.status === 501) noRelay(res.status, "/net/send");
  if (!res.ok) throw new Error(`send ${res.status}`);
}

export function onMessage(fn) {
  net.listeners.add(fn);
  return () => net.listeners.delete(fn);
}

export function onRoom(fn) {
  net.roomListeners.add(fn);
  return () => net.roomListeners.delete(fn);
}

export async function fetchWorld() {
  const q = new URLSearchParams({ room: net.room });
  const res = await fetch(`/net/world?${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`world ${res.status}`);
  return res.json();
}

export async function primeSol(timeoutMs = 2500) {
  const ctl = typeof AbortController === "function" ? new AbortController() : null;
  const timer = setTimeout(() => ctl?.abort(), timeoutMs);
  try {
    const res = await fetch("/net/world?room=sol", { cache: "no-store", signal: ctl?.signal });
    if (!res.ok) return null;
    const j = await res.json();
    if (typeof j?.now !== "number") return null;
    const world = j.world && j.world.v === 1 ? j.world : null;
    const time = world && Number.isFinite(world.time)
      ? world.time + Math.min(5, Math.max(0, j.now - (j.at ?? j.now)))
      : Math.max(0, j.now - (j.born ?? j.now));
    return { time, world, wseq: j.wseq ?? 0, worldRevision: j.worldRevision ?? null, at: performance.now() };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function pushWorld(world) {
  const body = JSON.stringify({ room: net.room, from: selfId(), world });
  const res = await fetch("/net/world", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  if (!res.ok) throw new Error(`world ${res.status}`);
  const j = await res.json();
  net.wseq = j.wseq ?? net.wseq;
  return j;
}

async function poll() {
  if (stopped || inflight) return;
  const gen = pollGen;
  inflight = true;
  let delay = POLL_MS;
  try {
    const q = new URLSearchParams({ room: net.room, self: selfId(), since: String(net.seq) });
    const res = await fetch(`/net/poll?${q}`, { cache: "no-store" });
    if (gen !== pollGen) return;
    if (res.status === 404 || res.status === 405 || res.status === 501) noRelay(res.status, "/net/poll");
    if (!res.ok) throw new Error(`poll ${res.status}`);
    const j = await res.json();
    if (gen !== pollGen) return;
    if (net.relay === false) console.info("[net] relay found — shared sky online");
    net.relay = true;
    noRelayMisses = 0;
    net.online = true;
    net.lastError = "";
    let fresh = net.seq < 0;
    if (typeof j.born === "number" && net.worldBorn && j.born !== net.worldBorn) {
      console.info(`[net] the relay restarted (room reborn) — rejoining at cursor ${j.seq ?? 0}`);
      net.seq = j.seq ?? 0;
      net.rebirths = (net.rebirths ?? 0) + 1;
      sim.clockSynced = false;
      fresh = true;
    } else {
      net.seq = Math.max(net.seq, j.seq ?? 0);
    }
    if (typeof j.born === "number" && typeof j.now === "number") {
      net.worldBorn = j.born;
      net.serverNow = j.now;
      const shared = Math.max(0, Number.isFinite(j.solTime) ? j.solTime : j.now - j.born);
      if (!sim.clockSynced) {
        shiftClock(shared - sim.time);
        sim.clockSynced = true;
      } else {
        const off = shared - sim.time;
        const mag = Math.abs(off);
        if (mag > CLOCK_DEAD) {
          const gain = Math.min(CLOCK_GAIN_MAX, CLOCK_GAIN_MIN + mag * CLOCK_GAIN_RAMP);
          shiftClock(off * gain);
        }
      }
    }

    const seen = new Set();
    for (const [id, data] of Object.entries(j.states ?? {})) {
      if (!data || data.t !== "ship") continue;
      seen.add(id);
      applyRemoteState(id, data);
    }
    for (const id of [...sim.remotes.keys()]) if (!seen.has(id)) dropRemote(id);
    net.peers = seen.size;
    if (seen.size) net.lonelySince = 0;
    else if (!net.lonelySince) net.lonelySince = performance.now();
    if (lonely()) delay = LONELY_POLL_MS;

    for (const m of fresh ? [] : (j.msgs ?? [])) {
      const d = m.data ?? {};
      if (d.t === "beacon" || d.t === "scan" || d.t === "sky") applyReliable(m.from, d);
      else for (const fn of net.listeners) fn(m.from, d);
    }
    const me = selfId();
    net.hostId = j.host ?? null;
    net.host = j.host == null || j.host === me;
    const wseqBefore = net.wseq;
    net.wseq = j.wseq ?? net.wseq;
    for (const fn of net.roomListeners) fn({ host: net.host, hostId: net.hostId, wseq: net.wseq, worldRevision: j.worldRevision, wseqMoved: net.wseq !== wseqBefore, peers: net.peers, fresh });
    useGameStore.getState().patchHud({ joined: true, peers: [...sim.remotes.values()].map((r) => ({ id: r.id, name: r.name })) });
  } catch (e) {
    if (gen !== pollGen) return;
    if (net.online) for (const id of [...sim.remotes.keys()]) dropRemote(id);
    net.online = false;
    net.peers = 0;
    net.host = true;
    for (const fn of net.roomListeners) fn({ host: true, hostId: null, wseq: net.wseq, worldRevision: null, wseqMoved: false, peers: 0, fresh: false, offline: true });
    net.lastError = String(e?.message ?? e);
    delay = net.relay === false ? Math.min(NO_RELAY_MAX_MS, NO_RELAY_MS * 2 ** Math.min(5, noRelayMisses++)) : BACKOFF_MS;
  } finally {
    if (gen === pollGen) {
      inflight = false;
      if (!stopped && !document.hidden) pollTimer = window.setTimeout(poll, delay);
    }
  }
}

export function connectNet(room) {
  disconnectNet();
  net.room = String(room || "sol").slice(0, 32);
  stopped = false;
  pollGen++;
  inflight = false;
  net.seq = -1;
  net.host = true;
  net.hostId = null;
  net.wseq = 0;
  sim.broadcast = (d) => {
    const now = performance.now();
    if (now - lastSend < 1000 / (lonely() ? LONELY_HZ : RATE_HZ)) return;
    lastSend = now;
    post("state", d).catch(() => {});
  };
  sim.send = (d, id) => {
    post("msg", d, id).catch(() => {});
  };
  poll();
}

if (globalThis.window) queueMicrotask(() => { if (window.__lg) window.__lg.net = net; });

export function disconnectNet() {
  stopped = true;
  pollGen++;
  inflight = false;
  clearTimeout(pollTimer);
  sim.broadcast = () => {};
  sim.send = () => {};
  for (const id of [...sim.remotes.keys()]) dropRemote(id);
  net.online = false;
  net.peers = 0;
  net.lonelySince = 0;
}

globalThis.document?.addEventListener("visibilitychange", () => {
  clearTimeout(pollTimer);
  if (!document.hidden && !stopped && !inflight) poll();
});
