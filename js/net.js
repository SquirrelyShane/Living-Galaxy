/* LIVING GALAXY — the wire between pilots.
 *
 * server.py carries a tiny relay (POST /net/send, GET /net/poll). This client
 * plugs it into the hooks sim.js already exposes:
 *
 *   sim.broadcast(d)    → ship state, throttled to RATE_HZ
 *   sim.send(d, id)     → reliable message (beacon, scan, comms) to one pilot or all
 *   applyRemoteState    ← other pilots' hulls, which become "peer" contacts
 *   applyReliable       ← their beacons and surveys
 *   onMessage(from, d)  ← anything else (comms.js listens here for hails)
 *
 * Plain fetch polling, no sockets: it works from Termux over Wi-Fi and it
 * survives the phone browser suspending the tab. When the server has no
 * relay (a static host) the first poll fails and the client goes quiet.
 */

import { applyReliable, applyRemoteState, dropRemote, shiftClock, sim } from "./sim.js";
import { useGameStore } from "./store.js";

const RATE_HZ = 5;
const POLL_MS = 220;
/* alone in the room: nobody reads the state stream, so keep a heartbeat (the relay drops a pilot
 * after STATE_TTL 6 s) and look for company once a second instead of five times */
const LONELY_HZ = 0.5;
/* The shared-clock chase (see the poll handler). A quarter of a second is
 * below anything a pilot can perceive in a timetable and well inside one
 * poll's jitter; the ramp means a badly drifted client closes fast and a
 * nearly-synced one is nudged. */
const CLOCK_DEAD = 0.25;
const CLOCK_GAIN_MIN = 0.3;
const CLOCK_GAIN_RAMP = 0.06;
const CLOCK_GAIN_MAX = 0.85;

const LONELY_POLL_MS = 1000;
const LONELY_AFTER_MS = 10000;
const BACKOFF_MS = 4000;
const NO_RELAY_MS = 30000;   // a static host (404/405 on the relay routes): look again rarely…
const NO_RELAY_MAX_MS = 600000; // …and more rarely each time it still is not there (30 s, 1, 2, 4, 8, then every 10 min)
let noRelayMisses = 0;

export const net = {
  online: false,
  room: null,
  selfId: "",
  peers: 0,
  lonelySince: 0,      // performance.now() when the room last went empty of others; 0 = someone is here
  seq: 0,
  lastError: "",
  /* false once the server answered 404/405 on a relay route — a plain file
   * server. Nothing is sent until a later poll finds the relay; the console
   * gets one line, not one per state packet. */
  relay: null,
  worldBorn: 0,
  serverNow: 0,
  /* the held sky: who runs the rocks */
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
let pollGen = 0;   // bumped by connect/disconnect: a poll answered from before it is dropped

function selfId() {
  if (net.selfId) return net.selfId;
  let id = "";
  try {
    id = sessionStorage.getItem("lgaa-net-id") || "";
  } catch {
    /* private mode */
  }
  if (!id) {
    id = `p${Math.random().toString(36).slice(2, 8)}`;
    try {
      sessionStorage.setItem("lgaa-net-id", id);
    } catch {
      /* ignore */
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
  if (net.relay === false) return; // static host: nobody is listening
  if (kind === "state" && !net.online) return; // relay unreachable: state is throwaway, do not queue 5 Hz of it
  const body = JSON.stringify({ room: net.room, from: selfId(), kind, to: to || undefined, data });
  const res = await fetch("/net/send", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  if (res.status === 404 || res.status === 405 || res.status === 501) noRelay(res.status, "/net/send");
  if (!res.ok) throw new Error(`send ${res.status}`);
}

/** Anything not a ship state or a beacon lands here (comms hails, lines, …). */
export function onMessage(fn) {
  net.listeners.add(fn);
  return () => net.listeners.delete(fn);
}

/** Room facts after every poll: { host, hostId, wseq, wseqMoved, peers, fresh, offline }. worldsync.js listens. */
export function onRoom(fn) {
  net.roomListeners.add(fn);
  return () => net.roomListeners.delete(fn);
}

/** The host's snapshot of the sky, or null. */
export async function fetchWorld() {
  const q = new URLSearchParams({ room: net.room });
  const res = await fetch(`/net/world?${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`world ${res.status}`);
  return res.json();
}

/** Host only: publish the sky. */
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
    if (gen !== pollGen) return; // reconnected while this was out: stale room
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
    /* 0.3.44 — THE ROOM WAS REBORN. A relay restart (a reboot, `--update`
     * restarting lg-relay, the room swept after standing empty) starts the
     * ring and its cursor over at zero, and `born` moves. A client still
     * holding its old, larger cursor then asks for "everything after 4,812"
     * of a ring that has seen three messages — and receives nothing, for
     * every hail and beacon, until the new ring outgrows the old number.
     * Measured: a pilot who stayed connected through a relay restart never
     * got another message. So a moved `born` is a fresh join: take the new
     * cursor, do not replay the ring, resync the clock from scratch. */
    if (typeof j.born === "number" && net.worldBorn && j.born !== net.worldBorn) {
      console.info(`[net] the relay restarted (room reborn) — rejoining at cursor ${j.seq ?? 0}`);
      net.seq = j.seq ?? 0;
      net.rebirths = (net.rebirths ?? 0) + 1;
      sim.clockSynced = false;
      fresh = true;
    } else {
      net.seq = Math.max(net.seq, j.seq ?? 0);
    }
    /* shared world clock: the room was born when the first pilot joined it.
     * every client chases that clock so the same slot fires the same event. */
    if (typeof j.born === "number" && typeof j.now === "number") {
      net.worldBorn = j.born;
      net.serverNow = j.now;
      const shared = Math.max(0, j.now - j.born);
      if (!sim.clockSynced) {
        shiftClock(shared - sim.time);
        sim.clockSynced = true;
      } else {
        /* CHASE THE ROOM'S CLOCK.
         *
         * A slow frame loop (dt is capped) lets the local clock fall behind
         * the room's, so it has to be pulled back or timetables drift apart.
         *
         * 0.3.37 — this had three faults, and together they desynced a shared
         * sky by whole seconds:
         *
         *   The dead zone was 2.5 s PER CLIENT. Nothing corrected inside it,
         *   so one pilot could settle 2.4 s ahead of the room and another 2.4
         *   behind, and the two of them were five seconds apart from each
         *   other, permanently. Measured: two browsers in one room disagreeing
         *   by 4.3 to 6.8 s, which is exactly that band.
         *
         *   The gains were INVERTED. More than 12 s out corrected at 20% a
         *   poll while 6–12 s out corrected at 60%, so the worse the drift the
         *   slower it closed.
         *
         *   And the whole middle branch was gated on `sim.timeScale === 1`,
         *   which is nearly always true online (js/sim.js forces the scale
         *   back to 1 whenever a remote pilot is present) but silently
         *   disabled the chase for the frames around someone joining at 40x.
         *
         * Now: one proportional chase, a gain that RISES with the error, and
         * a dead zone of a quarter second — small enough that two clients can
         * never be meaningfully apart, wide enough that a settled clock is not
         * jittered by poll noise. */
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
    /* who holds the sky, and whether its snapshot moved */
    const me = selfId();
    net.hostId = j.host ?? null;
    net.host = j.host == null || j.host === me; // no live state yet means nobody else is here
    const wseqBefore = net.wseq;
    net.wseq = j.wseq ?? net.wseq;
    for (const fn of net.roomListeners) fn({ host: net.host, hostId: net.hostId, wseq: net.wseq, wseqMoved: net.wseq !== wseqBefore, peers: net.peers, fresh });
    useGameStore.getState().patchHud({ joined: true, peers: [...sim.remotes.values()].map((r) => ({ id: r.id, name: r.name })) });
  } catch (e) {
    if (gen !== pollGen) return;
    if (net.online) for (const id of [...sim.remotes.keys()]) dropRemote(id);
    net.online = false;
    net.peers = 0;
    net.host = true; // offline: our sky, our rocks
    for (const fn of net.roomListeners) fn({ host: true, hostId: null, wseq: net.wseq, wseqMoved: false, peers: 0, fresh: false, offline: true });
    net.lastError = String(e?.message ?? e);
    delay = net.relay === false ? Math.min(NO_RELAY_MAX_MS, NO_RELAY_MS * 2 ** Math.min(5, noRelayMisses++)) : BACKOFF_MS;
  } finally {
    /* a stale poll owns nothing: the generation that replaced it has its own inflight and timer */
    if (gen === pollGen) {
      inflight = false;
      if (!stopped && !document.hidden) pollTimer = window.setTimeout(poll, delay);
    }
  }
}

/** Joins a room. Called at launch with the sky's seed — same sky, same room. */
export function connectNet(room) {
  disconnectNet();
  net.room = String(room || "sol").slice(0, 32);
  stopped = false;
  pollGen++;
  inflight = false;
  net.seq = -1; // -1 = fresh join: first poll only syncs the cursor, never replays the ring
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

/* The tab going to sleep should not leave a ghost on everybody's sensors:
 * the relay expires us on its own, but polling stops the moment we wake. */
document.addEventListener("visibilitychange", () => {
  clearTimeout(pollTimer); // a poll that lands while hidden does not reschedule (see finally); one chain, not two
  if (!document.hidden && !stopped && !inflight) poll();
});
