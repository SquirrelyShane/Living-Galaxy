// Living Galaxy — multiplayer client.
//
// The 0.1 protocol was a relay and nothing more: everyone got the same world seed, and
// positions and tracers were forwarded between pilots. It worked, and the README was
// honest that it left the biggest hole in the game — **every pilot fought their own
// private Nexis**. Two people in the same system could sit in the same belt shooting at
// entirely different pirates and never affect each other.
//
// 0.10 closes that. The relay is a stdlib Python socket server with no game logic in it
// and no intention of acquiring any, so the NPCs have to be simulated by somebody's
// client: the oldest connected pilot is the **host**, runs the world, and broadcasts it.
// Everyone else receives it. If the host leaves, the next-oldest takes over — and because
// every client already generates the identical world from the shared seed, the handover
// is a change of who is authoritative rather than a resynchronisation.
//
// The maths — clock offset, snapshot buffering, delta encoding — lives in netsync.js,
// which has no socket in it and can therefore be tested properly.

import { scene } from '../world/scene.js';
import { S } from '../core/state.js';
import { NET } from '../core/config.js';
import { buildShip } from '../entities/shipmesh.js';
import { fire } from './projectiles.js';
import { toast, status } from '../ui/toast.js';
import { makeClockSync, addSample, toServerTime, makeBuffer, pushFrame, sampleAt,
         encodeDelta, encodeFull, applyDelta, bufferDepth } from './netsync.js';

export const net = {
  ws: null, id: 0, connected: false, remotes: new Map(),
  host: 0, isHost: false, sync: makeClockSync(),
  url: null, name: null, token: null,
  retries: 0, retryAt: 0, lastNpcAt: 0,
  stats: { sent: 0, recv: 0, bytesOut: 0, bytesIn: 0, deltas: 0, fulls: 0 }
};

let sendT = 0, pingT = 0, npcT = 0;
let lastSent = null;
const _v = new THREE.Vector3();
const ghosts = new Map();          // NPC id -> mesh, for non-host clients

const now = () => (typeof performance !== 'undefined' && performance.now
  ? performance.now() / 1000 : Date.now() / 1000);

// ── connection ───────────────────────────────────────────────────────

/** Resolves {seed, age} on welcome, or null on any failure — never rejects. */
export function connectNet(url, name, timeout = 4000) {
  net.url = url; net.name = name;
  return new Promise(resolve => {
    if (typeof WebSocket === 'undefined') { toast('Multiplayer: WebSocket unavailable'); return resolve(null); }
    let ws, done = false;
    const fail = why => {
      if (done) return; done = true;
      try { ws && ws.close(); } catch (e) { /* already gone */ }
      toast('Multiplayer: ' + why);
      resolve(null);
    };
    try { ws = new WebSocket(url); } catch (e) { return fail('bad server URL'); }
    const timer = setTimeout(() => fail('no response from ' + url), timeout);

    ws.onerror = () => fail('connection failed');
    ws.onopen = () => send(ws, { t: 'hello', name, resume: net.token || undefined });
    ws.onmessage = ev => {
      net.stats.recv++;
      net.stats.bytesIn += (ev.data && ev.data.length) || 0;
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }

      if (m.t === 'welcome' && !done) {
        done = true; clearTimeout(timer);
        net.ws = ws; net.id = m.id; net.connected = true;
        net.token = m.token || null;
        net.retries = 0;
        net.sync = makeClockSync();
        lastSent = null;
        setHost(m.host || 0, true);
        ws.onclose = () => onClose();
        for (const [id, p] of Object.entries(m.players || {})) addRemote(+id, p.name, p.state);
        toast(m.resumed
          ? `Link restored — ${net.remotes.size} other pilot(s) in system`
          : `Linked as ${name || 'Pilot-' + m.id} · ${net.remotes.size} other pilot(s) in system`);
        pingNow();
        resolve({ seed: m.seed, age: m.age || 0 });
        return;
      }
      route(m);
    };
  });
}

function onClose() {
  net.connected = false;
  net.isHost = false;
  clearGhosts();
  // The slot is held server-side for NET.resumeWindow, so a dropped phone that comes back
  // inside that window rejoins as itself rather than as a stranger with a new id.
  if (net.token && net.retries < 6) scheduleRetry();
  else { toast('Multiplayer link lost'); clearRemotes(); }
}

function scheduleRetry() {
  // Exponential backoff with a ceiling. A client that retries every 200 ms against a relay
  // that has actually stopped is a denial of service against your own laptop.
  const delay = Math.min(20, Math.pow(2, net.retries)) * 1000;
  net.retries++;
  net.retryAt = now() + delay / 1000;
  status(`Link lost — retrying in ${Math.round(delay / 1000)}s`);
  setTimeout(() => {
    if (net.connected) return;
    connectNet(net.url, net.name).then(r => {
      if (!r) return;                       // connectNet already scheduled nothing; onClose will
      status('Link restored');
    });
  }, delay);
}

export function disconnectNet() {
  net.token = null;                          // a deliberate leave does not want a resume
  try { net.ws && net.ws.send(JSON.stringify({ t: 'bye' })); } catch (e) { /* best effort */ }
  try { net.ws && net.ws.close(); } catch (e) { /* best effort */ }
  net.connected = false;
  clearRemotes();
  clearGhosts();
}

function send(ws, obj) {
  const text = JSON.stringify(obj);
  net.stats.sent++;
  net.stats.bytesOut += text.length;
  ws.send(text);
}

const push = obj => { try { if (net.connected) send(net.ws, obj); } catch (e) { /* link died */ } };

// ── routing ──────────────────────────────────────────────────────────

function route(m) {
  switch (m.t) {
    case 'join':
      addRemote(m.id, m.name);
      toast(m.name + ' entered the system');
      break;

    case 'leave': {
      const r = net.remotes.get(m.id);
      if (r) { toast(r.name + ' left the system'); scene.remove(r.group); net.remotes.delete(m.id); }
      break;
    }

    case 'host':
      setHost(m.id);
      break;

    case 'pong':
      // `m.c` is the local time we stamped on the way out, echoed back untouched, so the
      // round trip is measured without either side trusting the other's clock.
      addSample(net.sync, m.c, m.s, now());
      break;

    case 'state': {
      const r = net.remotes.get(m.id);
      if (!r) return;
      r.state = applyDelta(r.state, m);
      if (m.cls && m.cls !== r.cls) restyle(r, m.cls);
      // Stamped with the *server's* clock, which is the only clock both ends agree on.
      pushFrame(r.buf, m.t2 !== undefined ? m.t2 : toServerTime(net.sync, now()), r.state);
      break;
    }

    case 'npc':
      if (net.isHost) return;                // our own broadcast, echoed back
      net.lastNpcAt = now();
      applyNpcSnapshot(m);
      break;

    case 'fire':
      // Visual tracer only — remote shots resolve on the shooter's own client, so a
      // packet that never arrives costs a spark rather than a hit that should not have
      // happened or one that should have.
      fire(new THREE.Vector3(m.p[0], m.p[1], m.p[2]),
           new THREE.Vector3(m.d[0], m.d[1], m.d[2]).normalize(),
           m.s || 600, 0, 'fx', m.c || 0x66ddff);
      break;
  }
}

function setHost(id, quiet) {
  const was = net.isHost;
  net.host = id;
  net.isHost = (id === net.id && id !== 0);
  if (net.isHost && !was) {
    clearGhosts();                            // our own NPCs are the real ones now
    if (!quiet) toast('You are now simulating the system for everyone', 4200);
  } else if (!net.isHost && was) {
    toast('Another pilot is now simulating the system');
  }
}

// ── remote pilots ────────────────────────────────────────────────────

function addRemote(id, name, state) {
  if (id === net.id || net.remotes.has(id)) return;
  const cls = (state && state.cls) || 'civilian';
  const group = buildShip(cls);
  group.userData = { kind: 'pilot', name };
  scene.add(group);
  const r = {
    id, name: name || 'Pilot-' + id, cls, group,
    state: state ? Object.assign({}, state) : null,
    buf: makeBuffer(), init: false
  };
  if (state && state.p) {
    group.position.set(state.p[0], state.p[1], state.p[2]);
    pushFrame(r.buf, toServerTime(net.sync, now()), state);
    r.init = true;
  }
  net.remotes.set(id, r);
}

function restyle(r, cls) {
  scene.remove(r.group);
  r.group = buildShip(cls);
  r.group.userData = { kind: 'pilot', name: r.name };
  scene.add(r.group);
  r.cls = cls;
}

function clearRemotes() {
  for (const r of net.remotes.values()) scene.remove(r.group);
  net.remotes.clear();
}

// ── shared NPCs ──────────────────────────────────────────────────────
// The host sends the ships nearest to itself, which is a deliberate compromise rather
// than an oversight: sending all 63 at 5 Hz is more bandwidth than a phone hotspot wants,
// and the ships that matter to *anyone* are the ones near *someone*. A guest far from the
// host sees an emptier system than they would if hosting — which is a smaller wrong than
// a stuttering link, and the reason the roster cap is a tuning number in NET.

function buildNpcSnapshot() {
  const list = S.world.npcs;
  const out = [];
  for (let i = 0; i < list.length && out.length < NET.npcMax; i++) {
    const n = list[i], u = n.userData;
    if (u.hp <= 0) continue;
    out.push([
      u.netId || (u.netId = ++npcSeq),
      +n.position.x.toFixed(0), +n.position.y.toFixed(0), +n.position.z.toFixed(0),
      u.type, Math.round(u.hp)
    ]);
  }
  return out;
}
let npcSeq = 0;

function applyNpcSnapshot(m) {
  const seen = new Set();
  const t = m.t2 !== undefined ? m.t2 : toServerTime(net.sync, now());

  for (const row of (m.n || [])) {
    const [id, x, y, z, type, hp] = row;
    seen.add(id);
    let g = ghosts.get(id);
    if (!g) {
      g = buildShip('civilian');
      g.userData = { kind: 'npcGhost', type, name: type };
      g.buf = makeBuffer();
      scene.add(g);
      ghosts.set(id, g);
    }
    pushFrame(g.buf, t, { p: [x, y, z], hull: hp });
  }

  // A ship the host stopped sending is either dead or out of its roster. Either way we
  // should not keep drawing it — but it is removed on the next snapshot rather than
  // immediately, so one dropped packet does not blink the entire system out of existence.
  for (const [id, g] of ghosts) {
    if (seen.has(id)) { g.missed = 0; continue; }
    if (++g.missed > 2) { scene.remove(g); ghosts.delete(id); }
  }
}

function clearGhosts() {
  for (const g of ghosts.values()) scene.remove(g);
  ghosts.clear();
}

export const ghostCount = () => ghosts.size;

// ── frame ────────────────────────────────────────────────────────────

export function updateNet(dt) {
  drawRemotes();

  if (!net.connected || !S.running) return;

  // clock sync
  pingT += dt;
  if (pingT >= 1 / NET.pingHz) { pingT = 0; pingNow(); }

  // our own state, delta-encoded
  sendT += dt;
  if (sendT >= 1 / NET.sendHz) {
    sendT = 0;
    const p = S.player;
    const full = encodeFull({
      p: [p.position.x, p.position.y, p.position.z],
      yaw: p.yaw, pitch: p.pitch, cls: p.classKey,
      hull: Math.round((p.hull / Math.max(1, S.stats.hullMax)) * 100)
    });
    const delta = encodeDelta(full, lastSent);
    if (delta) {
      lastSent = full;
      net.stats.deltas++;
      push(Object.assign({ t: 'state' }, delta));
    }
  }

  // the world, if we are the one running it
  if (net.isHost) {
    npcT += dt;
    if (npcT >= 1 / NET.npcHz) {
      npcT = 0;
      push({ t: 'npc', n: buildNpcSnapshot() });
    }
  } else if (net.host && net.lastNpcAt && now() - net.lastNpcAt > NET.hostGrace) {
    // The host has gone quiet. The server will reassign, but saying so is better than a
    // system that silently stops moving while the player wonders what they broke.
    net.lastNpcAt = now();
    status('Waiting for a new host…');
  }
}

function pingNow() { push({ t: 'ping', c: now() }); }

/**
 * Draw every remote at `serverNow - interpDelay`. Both the pilots and the host's NPCs
 * come through the same buffer, because they are the same problem.
 */
function drawRemotes() {
  const renderTime = toServerTime(net.sync, now()) - NET.interpDelay;

  for (const r of net.remotes.values()) {
    const s = sampleAt(r.buf, renderTime);
    if (!s) continue;
    blend(r.group, s);
    if (s.a.yaw !== undefined) {
      r.group.rotation.y = lerpAngle(s.a.yaw, s.b.yaw ?? s.a.yaw, s.t);
      r.group.rotation.x = (s.a.pitch || 0) + (((s.b.pitch || 0) - (s.a.pitch || 0)) * s.t);
    }
    r.init = true;
  }

  for (const g of ghosts.values()) {
    const s = sampleAt(g.buf, renderTime);
    if (s) blend(g, s);
  }
}

function blend(obj, s) {
  const a = s.a.p, b = s.b.p;
  if (!a || !b) return;
  obj.position.set(
    a[0] + (b[0] - a[0]) * s.t,
    a[1] + (b[1] - a[1]) * s.t,
    a[2] + (b[2] - a[2]) * s.t
  );
}

/** Shortest way round the circle — a yaw crossing π must not spin the long way. */
function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function sendFire(origin, dir, speed, color) {
  if (!net.connected) return;
  push({
    t: 'fire',
    p: [+origin.x.toFixed(1), +origin.y.toFixed(1), +origin.z.toFixed(1)],
    d: [+dir.x.toFixed(3), +dir.y.toFixed(3), +dir.z.toFixed(3)],
    s: speed, c: color
  });
}

/** Everything the diagnostics panel wants to say about the link. */
export function netReport() {
  const depths = [...net.remotes.values()].map(r => bufferDepth(r.buf));
  return {
    connected: net.connected,
    id: net.id, host: net.host, isHost: net.isHost,
    pilots: net.remotes.size,
    ghosts: ghosts.size,
    rtt: Math.round((net.sync.rtt || 0) * 1000),
    bestRtt: Math.round((net.sync.bestRtt === Infinity ? 0 : net.sync.bestRtt) * 1000),
    offset: +(net.sync.offset || 0).toFixed(3),
    synced: net.sync.synced,
    buffer: depths.length ? Math.round(depths.reduce((a, b) => a + b, 0) / depths.length) : 0,
    retries: net.retries,
    stats: net.stats
  };
}
