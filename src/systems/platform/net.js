// Living Galaxy — galaxy-server client.
//
// v1.03 replaces the relay with a real home for the galaxy: `server/main.js`, one Node
// process on one machine, speaking wss, owning accounts, wallets, per-system world
// deltas, and — the structural change — **rooms**. The relay fanned every packet to
// every connection, which was correct while all pilots shared one system and wrong the
// moment somebody jumped. Now the system node is the shard: your packets reach the
// pilots in the same system and nobody else, the host who simulates the NPCs is elected
// *per system*, and this module reports every node change so the server can re-room us.
//
// The authority split is unchanged in spirit: the client owns the flying and the pretty,
// the server owns identity, membership, money and anything that outlives a session. A
// callsign with a passphrase is an account; the wallet it carries lives on the server
// and no message from any client can set it, only ask the ledger to move it.
//
// The maths — clock offset, snapshot buffering, delta encoding — lives in netsync.js,
// which has no socket in it and can therefore be tested properly.

import { scene } from '../../world/scene.js';
import { S } from '../../core/state.js';
import { NET } from '../../core/config.js';
import { spawn } from '../../core/spawn.js';
import { fire } from '../combat/projectiles.js';
import { toast, status } from '../../core/notify.js';
import { makeClockSync, addSample, toServerTime, makeBuffer, pushFrame, sampleAt,
         encodeDelta, encodeFull, applyDelta, bufferDepth } from './netsync.js';
import { designation, nodeAt } from '../../world/galaxy.js';

export const net = {
  ws: null, id: 0, connected: false, remotes: new Map(),
  host: 0, isHost: false, sync: makeClockSync(),
  url: null, name: null, pass: null, token: null, account: null,
  sys: null, worldDeltas: new Map(), pilots: new Map(),
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

/**
 * Resolves {seed, age} on welcome, or null on any failure — never rejects.
 * `pass` is optional: with it, the hello carries an account login (created on first use
 * for an unknown callsign — the server treats registration as idempotent, the passphrase
 * decides everything after that).
 */
export function connectNet(url, name, pass, timeout = 4000) {
  net.url = url; net.name = name; net.pass = pass || null;
  return new Promise(resolve => {
    if (typeof WebSocket === 'undefined') { toast('Multiplayer: WebSocket unavailable'); return resolve(null); }
    let ws, done = false;
    const fail = why => {
      if (done) return; done = true;
      try { ws && ws.close(); } catch (e) { /* already gone */ }
      toast('Galaxy link: ' + why);
      resolve(null);
    };
    try { ws = new WebSocket(url); } catch (e) { return fail('bad server URL'); }
    const timer = setTimeout(() => fail('no response from ' + url), timeout);

    ws.onerror = () => fail('connection failed');
    ws.onopen = () => send(ws, {
      t: 'hello', name,
      resume: net.token || undefined,
      sys: (S.galaxy && S.galaxy.node) | 0,
      auth: (pass && name) ? { user: name, pass, register: true } : undefined
    });
    ws.onmessage = ev => {
      net.stats.recv++;
      net.stats.bytesIn += (ev.data && ev.data.length) || 0;
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }

      if (m.t === 'refuse' && !done) return fail(m.why || 'refused');

      if (m.t === 'welcome' && !done) {
        done = true; clearTimeout(timer);
        net.ws = ws; net.id = m.id; net.connected = true;
        net.token = m.token || null;
        net.account = m.account || null;
        net.sys = m.sys | 0;
        net.retries = 0;
        net.sync = makeClockSync();
        lastSent = null;
        setHost(m.host || 0, true);
        ws.onclose = () => onClose();
        for (const [id, p] of Object.entries(m.players || {})) addRemote(+id, p.name, p.state);
        applyDeltas(m.deltas);
        net.pilots.clear();
        for (const [id, p] of Object.entries(m.everyone || {})) net.pilots.set(+id, p);
        toast(m.resumed
          ? `Link restored — ${net.pilots.size} other pilot(s) online`
          : `Linked as ${name || 'Pilot-' + m.id}` +
            (net.account ? ` · account ${net.account.user} (${net.account.wallet} cr banked)` : '') +
            ` · ${net.pilots.size} other pilot(s) online`);
        // Say where they are, by name — the answer to two friends in different systems
        // each staring at an empty sky. The chart is how you close the distance.
        for (const p of net.pilots.values()) toast(whereIs(p), 6000);
        pingNow();
        resolve({ seed: m.seed, age: m.age || 0, density: m.density });
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
  else { toast('Multiplayer link lost'); clearRemotes(); net.pilots.clear(); }
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
    connectNet(net.url, net.name, net.pass).then(r => {
      if (!r) return;                       // connectNet already scheduled nothing; onClose will
      status('Link restored');
    });
  }, delay);
}

function disconnectNet() {
  net.token = null;                          // a deliberate leave does not want a resume
  try { net.ws && net.ws.send(JSON.stringify({ t: 'bye' })); } catch (e) { /* best effort */ }
  try { net.ws && net.ws.close(); } catch (e) { /* best effort */ }
  net.connected = false;
  clearRemotes();
  clearGhosts();
  net.pilots.clear();
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

    case 'room':
      // The server's answer to our jump: a fresh peer list, a fresh host, and every way
      // this system differs from its seed. The old room's ships were removed the moment
      // we asked to move — anything still on screen from there is stale by definition.
      net.sys = m.sys | 0;
      clearRemotes(); clearGhosts();
      net.worldDeltas.clear();
      setHost(m.host || 0, true);
      for (const [id, p] of Object.entries(m.players || {})) addRemote(+id, p.name, p.state);
      applyDeltas(m.deltas);
      break;

    case 'delta':
      // The room host recorded a persistent difference from the seed (a claimed rock, a
      // wreck that should stay). Stored generically; game systems subscribe for the keys
      // they understand and ignore the rest.
      net.worldDeltas.set(m.k, m.v);
      if (deltaHandler) deltaHandler(m.k, m.v);
      break;

    case 'bank': {
      const cb = bankQueue.shift();
      if (cb) cb(m);
      if (m.ok && net.account) net.account.wallet = m.wallet;
      break;
    }

    case 'who': {
      // Somebody joined the galaxy or jumped systems — anywhere in it. The room handles
      // pilots in *this* sky; this keeps the rest of the galaxy from being a rumour.
      const prev = net.pilots.get(m.id);
      net.pilots.set(m.id, { name: m.name, sys: m.sys });
      if (!prev) toast(whereIs({ name: m.name, sys: m.sys }), 6000);
      else if (prev.sys !== m.sys && m.sys !== net.sys) toast(whereIs({ name: m.name, sys: m.sys }), 4000);
      break;
    }

    case 'gone': {
      const p = net.pilots.get(m.id);
      net.pilots.delete(m.id);
      if (p && p.sys !== net.sys) toast(`${p.name} left the galaxy`);
      break;
    }

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

    case 'hit':
      // Addressed, not broadcast: the relay fans every packet out to everybody, so a hit
      // meant for one pilot arrives at all of them and each has to check it is the one
      // being shot at.
      if (m.to === net.id && hitHandler) hitHandler(m.d || 0, m.k || 'kinetic');
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

/** "Bravo is flying in XK-412" — with the system named so the chart can be aimed at it. */
function whereIs(p) {
  if (p.sys === net.sys) return `${p.name} is here in this system`;
  try {
    const gs = (S.galaxy && S.galaxy.seed) >>> 0;
    return `${p.name} is flying in ${designation(nodeAt(gs, p.sys | 0))} — find it on the chart`;
  } catch (e) {
    return `${p.name} is flying in another system`;
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
  const group = spawn('hull', cls, 'pilot-' + id, { noseMinusZ: true });
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
  r.group = spawn('hull', cls, 'pilot-' + r.id, { noseMinusZ: true });
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
      g = spawn('hull', 'civilian', 'ghost', { noseMinusZ: true });
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

const ghostCount = () => ghosts.size;

// ── frame ────────────────────────────────────────────────────────────

export function updateNet(dt) {
  drawRemotes();

  if (!net.connected || !S.running) return;

  // Re-room on jump. Polled rather than hooked so this module keeps zero coupling to the
  // jump code: the fact that `S.galaxy.node` changed IS the event, whoever caused it.
  const here = (S.galaxy && S.galaxy.node) | 0;
  if (net.sys !== null && here !== net.sys) {
    net.sys = here;
    clearRemotes(); clearGhosts();          // nobody from the old system is in this sky
    lastSent = null;                        // next state packet must be a full one
    push({ t: 'sys', sys: here });
  }

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
      const msg = Object.assign({ t: 'state' }, delta);
      // The server's motion guard flags kinematically impossible moves. Warp is the one
      // legitimate way to be impossibly fast, so say so while the drive is doing it.
      if (S.warp && S.warp.state !== 'idle') msg.warp = 1;
      push(msg);
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

// ── taking a hit from another pilot (v1.02.57) ───────────────────────
//
// Detection happens on the shooter's client and damage is applied on the target's — see the
// note on the `'fire'` case above for why the tracer already worked this way round. The
// handler is registered rather than imported so this module keeps pointing downhill: the
// combat layer knows how to hurt a hull, and the link layer only knows that somebody said
// it should. With nothing registered a hit is dropped, which is what a headless run wants.
let hitHandler = null;
export function registerNetHit(fn) { hitHandler = typeof fn === 'function' ? fn : null; }

// ── persistent world deltas (v1.03) ──────────────────────────────────
//
// The server keeps, per system, a small list of ways the world differs from its seed —
// written by the room's host, replayed to every arrival, surviving restarts inside the
// encrypted vault. The mechanism is generic on purpose: the server never learns what a
// key means, so game systems can start persisting wrecks, claims and station facts one
// key at a time without a protocol change. Same registration pattern as the hit handler,
// for the same layering reason.

let deltaHandler = null;
export function registerDeltas(fn) { deltaHandler = typeof fn === 'function' ? fn : null; }

function applyDeltas(list) {
  for (const d of (list || [])) {
    net.worldDeltas.set(d.k, d.v);
    if (deltaHandler) deltaHandler(d.k, d.v);
  }
}

/** Record a persistent difference from the seed. Only honoured when we host the room. */
export function sendDelta(k, v) {
  if (net.connected && net.isHost) push({ t: 'delta', k, v });
}

// ── the bank (v1.03) ─────────────────────────────────────────────────
// Credits banked with the galaxy live on the server, under the account, and survive a
// wiped browser or a different machine. Requests resolve in order because the socket is
// ordered — a queue of callbacks is the entire correlation scheme.

const bankQueue = [];
export function netBank(op, amt) {
  return new Promise(resolve => {
    if (!net.connected) return resolve({ err: 'no link' });
    if (!net.account) return resolve({ err: 'no account — add a passphrase on the boot screen' });
    bankQueue.push(resolve);
    push({ t: 'bank', op, amt });
  });
}

/**
 * Where the other pilots are, in the shape `combat/projectiles.js` wants for its hit test.
 * Live positions, not a copy: a snapshot taken once a frame would be a frame stale, and a
 * round crossing four hundred units in that frame would miss by four hundred units.
 */
export function remoteTargets() {
  const out = [];
  for (const [id, r] of net.remotes) if (r.group) out.push({ id, position: r.group.position });
  return out;
}

/** Tell the relay that one of our rounds connected with pilot `id`. */
export function sendHit(id, dmg, dtype) {
  if (!net.connected) return;
  push({ t: 'hit', to: id, d: Math.round(dmg), k: dtype || 'kinetic' });
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
    sys: net.sys, account: net.account ? net.account.user : null,
    wallet: net.account ? net.account.wallet : null,
    worldDeltas: net.worldDeltas.size,
    everywhere: [...net.pilots.values()].map(p => ({ name: p.name, sys: p.sys })),
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
