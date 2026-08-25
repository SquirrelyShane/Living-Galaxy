#!/usr/bin/env node
// Living Galaxy server — the galaxy, living on one machine.
//
//     node server/main.js                        # first run makes galaxy-data/, asks a passphrase
//     node server/main.js --port=8765 --seed=42
//     GALAXY_PASS=... node server/main.js        # unattended start
//
// One process, three jobs, one port:
//
//   * serves the game itself (https://<laptop>:<port>/) so every player on the LAN gets
//     the same build from the same origin — no mixed-content fight between the page and
//     the socket, and "install the game" is "open the address";
//   * terminates the WebSocket connections and routes every real-time message to the
//     pilots in the same *system* — the room layer in rooms.js;
//   * owns everything durable — accounts, wallets, parked pilots, per-system world
//     deltas — through the encrypted vault.
//
// TLS is automatic: if galaxy-data/certs/server.key + server.crt exist (tools/make-certs.sh
// writes them) the same port speaks https/wss; without them it runs plain and says so,
// which is what the test suite uses. The passphrase unlocks the vault; a wrong one refuses
// to boot before any write can happen.
//
// What is deliberately NOT here: game logic. The server knows systems, identities, money
// and differences-from-seed. It does not know what a Nexis is. Each occupied system's
// oldest pilot simulates its NPCs (host election, now per room instead of global), and the
// upgrade path to server-side NPC authority is a headless client joining busy rooms — not
// a rewrite of this file.

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

import { upgrade, wrapSocket } from './wire.js';
import { openVault } from './vault.js';
import { makeTicket, readTicket } from './tickets.js';
import { makeRegistry } from './registry.js';
import { makeRooms, enterSystem, leaveAll, peersOf, systemOf, hostOf, occupancy,
         makeMotionGuard, checkMotion, clearMotion } from './rooms.js';
import { startBeacon, localIPs } from './beacon.js';
import { ensureCerts } from './certs.js';
import { makeForum } from './forum.js';
import { makeApi } from './api.js';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── configuration ────────────────────────────────────────────────────

const arg = (name, dflt) => {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : dflt;
};
const PORT = parseInt(arg('port', '8765'), 10);
const SEED = parseInt(arg('seed', '1337'), 10) >>> 0;
const DATA = path.resolve(arg('data', path.join(ROOT, 'galaxy-data')));
const INSECURE = process.argv.includes('--insecure');
// The name players type instead of an IP: `--name=galaxy` → https://galaxy.local:PORT,
// answered by the mDNS beacon. `--no-beacon` turns it off (or when 5353 is refused, it
// turns itself off — a beacon is a convenience, never a dependency).
const NAME = String(arg('name', process.env.GALAXY_NAME || 'galaxy')).replace(/[^a-zA-Z0-9-]/g, '') || 'galaxy';
const NO_BEACON = process.argv.includes('--no-beacon');
// Generation density is server law, like the seed: density is an input to generateSystem,
// so two pilots in one system with two densities would stand in two different worlds and
// never know it. First boot stores it; later flags are ignored in favour of the vault.
const DENSITY = Math.max(0.5, Math.min(3, parseFloat(arg('density', '1.4')) || 1.4));
const RESUME_TTL = 15 * 60;          // seconds a ticket resumes a dropped pilot
const SESSION_TTL = 12 * 3600;       // seconds a ticket is valid at all

// `--logfile=path` mirrors everything said to the console into a file. The Windows
// launcher used to get its log by redirecting the server's console instead — which left
// the server window BLANK, and a blank minimized window titled by cmd reads as a hang,
// not a galaxy. Now the window shows the live words and the file still exists for the
// launcher's failure diagnostics.
const LOGFILE = arg('logfile', null);
if (LOGFILE) {
  const stream = fs.createWriteStream(LOGFILE, { flags: 'w' });
  for (const chan of ['log', 'error']) {
    const real = console[chan].bind(console);
    console[chan] = (...a) => { real(...a); try { stream.write(a.join(' ') + '\n'); } catch { /* disk full is not fatal */ } };
  }
}

async function passphrase() {
  if (arg('pass', null) !== null) return arg('pass');
  if (process.env.GALAXY_PASS) return process.env.GALAXY_PASS;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(r => rl.question('Vault passphrase: ', r));
  rl.close();
  return answer;
}

// ── boot ─────────────────────────────────────────────────────────────

const vault = openVault(DATA, await passphrase());
if (!vault) {
  console.error('Wrong vault passphrase for ' + DATA + ' — refusing to run.');
  process.exit(1);
}
const registry = makeRegistry(vault);
const serverDoc = registry.serverDoc(SEED, DENSITY);
const SECRET = serverDoc.secret;
const started = Date.now() / 1000;
const age = () => serverDoc.age + (Date.now() / 1000 - started);

// Persist accumulated age so the galaxy's clock survives restarts — a pilot who banked
// their flight yesterday should not find the world younger than they left it.
setInterval(() => registry.saveAge(serverDoc, Date.now() / 1000 - started), 60_000).unref();

// ── the web suite (v1.04) ────────────────────────────────────────────

const forum = makeForum(vault);

// `--admin=Shane` makes that callsign the galaxy's administrator. If the account does
// not exist yet it is created with a one-time generated passphrase, printed exactly
// once — an admin credential must never be a default the whole internet knows.
const ADMIN = arg('admin', process.env.GALAXY_ADMIN || null);
if (ADMIN) {
  if (!registry.account(ADMIN)) {
    const pw = crypto.randomBytes(9).toString('base64url');
    const made = registry.register(ADMIN, pw);
    if (made.err) console.log(`admin: could not create "${ADMIN}" — ${made.err}`);
    else console.log(`admin account "${ADMIN}" created — passphrase: ${pw}   (write it down; it is not stored in the clear and will never be shown again)`);
  }
  const g = registry.setAdmin(ADMIN, true);
  if (g.ok) console.log(`admin: "${ADMIN}" has the keys`);
}

// `--web-origin=https://living-galaxy.com` — set when the static site is served from
// a CDN (GitHub → Cloudflare Pages) and only the galaxy runs here: the API then
// answers that one cross-origin site, with credentials.
const WEB_ORIGIN = arg('web-origin', process.env.WEB_ORIGIN || null);

const api = makeApi({
  registry, vault, forum, secret: SECRET, webOrigin: WEB_ORIGIN,
  live: () => ({
    galaxy: 'living', seed: serverDoc.seed, age: +age().toFixed(1),
    online: [...clients.values()].map(c => ({ name: c.name, sys: c.sys, user: c.user || null })),
    systems: occupancy(rooms), tls: !!tlsOpts,
    name: beacon ? beacon.fqdn : null,
    suspects: Object.fromEntries(guard.suspects)
  })
});

// ── live state ───────────────────────────────────────────────────────

const clients = new Map();   // id -> {conn, name, state, accKey, user, sys}
const parked = new Map();    // ticket -> {id, name, state, user, accKey, sys, until}
const rooms = makeRooms();
const guard = makeMotionGuard();
let counter = 0;

const roomSend = (sys, msg, exclude = 0) => {
  const r = rooms.bySys.get(sys);
  if (!r) return;
  for (const id of r.members) {
    if (id === exclude) continue;
    const c = clients.get(id);
    c && c.conn.sendJson(msg);
  }
};

/** Room description for whoever just arrived in `sys` — peers, host, and history. */
function roomBrief(sys, selfId) {
  const players = {};
  for (const id of peersOf(rooms, selfId))
    players[id] = { name: clients.get(id)?.name, state: clients.get(id)?.state };
  return { sys, host: hostOf(rooms, sys), players, deltas: registry.deltasFor(sys) };
}

/** Tell EVERYONE, in every system. Rooms scope the heavy traffic (state, npc, fire);
 *  who-is-where is a few bytes on join/jump/leave, and it is the difference between
 *  "we don't show up for each other" and "she's three jumps away, go". At a scale where
 *  this fan-out matters, it becomes a rate-limited digest — the message shape holds. */
const allSend = (msg, exclude = 0) => {
  for (const [id, c] of clients) if (id !== exclude) c.conn.sendJson(msg);
};

function moveTo(c, sys) {
  const move = enterSystem(rooms, c.id, sys);
  if (!move) return;
  c.sys = sys;
  clearMotion(guard, c.id);                    // a jump is not a teleport hack
  if (move.left) {
    roomSend(move.left.sys, { t: 'leave', id: c.id });
    roomSend(move.left.sys, { t: 'host', id: move.left.host });
  }
  roomSend(sys, { t: 'join', id: c.id, name: c.name, sys }, c.id);
  roomSend(sys, { t: 'host', id: move.joined.host });
  allSend({ t: 'who', id: c.id, name: c.name, sys }, c.id);
}

// ── the router ───────────────────────────────────────────────────────

function onMessage(c, m) {
  const t = m.t;

  if (t === 'hello' && !c.id) return hello(c, m);
  if (!c.id) return;                            // nothing else before a welcome

  switch (t) {
    case 'ping':
      // Echo the stamp untouched next to the world age — the reference clock both ends
      // agree on, exactly as the relay did it.
      c.conn.sendJson({ t: 'pong', c: m.c, s: +age().toFixed(4) });
      break;

    case 'sys': {
      const sys = m.sys | 0;
      moveTo(c, sys);
      c.conn.sendJson({ t: 'room', ...roomBrief(sys, c.id) });
      break;
    }

    case 'state': {
      // Merge deltas into the stored state so late joiners get a whole picture.
      const merged = Object.assign({}, c.state || {});
      for (const [k, v] of Object.entries(m)) if (k !== 't') merged[k] = v;
      c.state = merged;
      checkMotion(guard, c.id, m.p, Date.now() / 1000, !!m.warp);
      roomSend(c.sys, { ...m, id: c.id, t2: +age().toFixed(4) }, c.id);
      break;
    }

    case 'npc':
      // Only the room's host may describe the room's world. Anyone else sending this is
      // a bug or an attack; either way it stops here.
      if (hostOf(rooms, c.sys) === c.id)
        roomSend(c.sys, { ...m, id: c.id, t2: +age().toFixed(4) }, c.id);
      break;

    case 'fire':
      roomSend(c.sys, { ...m, id: c.id }, c.id);
      break;

    case 'hit': {
      // Addressed, and only deliverable within the shooter's own system — a hull two
      // jumps away cannot be hurt by a packet no matter what the packet says.
      const target = clients.get(m.to | 0);
      if (target && target.sys === c.sys)
        target.conn.sendJson({ t: 'hit', to: target.id, d: m.d | 0, k: m.k || 'kinetic', id: c.id });
      break;
    }

    case 'delta':
      if (hostOf(rooms, c.sys) === c.id && typeof m.k === 'string' && m.k.length <= 64) {
        registry.delta(c.sys, m.k, m.v, c.id);
        roomSend(c.sys, { t: 'delta', sys: c.sys, k: m.k, v: m.v }, c.id);
      }
      break;

    case 'bank': {
      if (!c.accKey) return c.conn.sendJson({ t: 'bank', err: 'no account on this link' });
      const r = registry.bank(c.accKey, m.op, m.amt);
      c.conn.sendJson({ t: 'bank', op: m.op, ...r });
      break;
    }

    case 'bye':
      c.conn.close();
      break;
  }
}

function hello(c, m) {
  // Optional account. Login failure fails the *hello*, not the process — the client
  // falls back to solo and tells the player why.
  let accKey = null, user = null, wallet;
  if (m.auth && m.auth.user) {
    if (m.auth.register) {
      // "register" is idempotent from the client's point of view: an account that
      // already exists just falls through to login, where the passphrase decides.
      const made = registry.register(m.auth.user, m.auth.pass);
      if (made.err && made.err !== 'call sign taken')
        return c.conn.sendJson({ t: 'refuse', why: made.err });
    }
    const r = registry.login(m.auth.user, m.auth.pass);
    if (r.err) return c.conn.sendJson({ t: 'refuse', why: r.err });
    accKey = r.key; user = r.acc.user; wallet = r.acc.wallet;
  }

  // Resume: a valid ticket whose slot is still parked comes back as itself.
  let resumed = false, id = 0, name, state = null, sys;
  const claims = m.resume ? readTicket(SECRET, m.resume) : null;
  const slot = claims && parked.get(m.resume);
  if (slot && slot.until > Date.now() / 1000) {
    parked.delete(m.resume);
    ({ id, name, state, sys } = slot);
    accKey = accKey || slot.accKey; user = user || slot.user;
    resumed = true;
  } else {
    id = ++counter;
    name = String(m.name || user || `Pilot-${id}`).slice(0, 16);
    // A registered pilot re-enters where the galaxy last saw them, unless the client
    // says otherwise — the save on the phone knows better than the ledger does.
    const acc = accKey ? vault.get(accKey) : null;
    const p = acc && acc.pilots[name];
    sys = (m.sys !== undefined) ? m.sys | 0 : (p && p.sys != null ? p.sys : 0);
  }
  if (m.sys !== undefined) sys = m.sys | 0;

  c.id = id; c.name = name; c.state = state; c.accKey = accKey; c.user = user;
  clients.set(id, c);
  moveTo(c, sys ?? 0);

  const token = makeTicket(SECRET, { id, name, user }, SESSION_TTL);
  c.token = token;
  // `everyone` is the whole galaxy's roster — name and system per pilot — so a client
  // can say "Bravo is flying in XK-412" instead of leaving two friends in different
  // systems each staring at an empty sky wondering why the other "doesn't show up".
  const everyone = {};
  for (const [oid, o] of clients) if (oid !== id) everyone[oid] = { name: o.name, sys: o.sys };
  c.conn.sendJson({
    t: 'welcome', id, seed: serverDoc.seed, density: serverDoc.density,
    age: +age().toFixed(2), token,
    resumed, everyone, ...roomBrief(c.sys, id),
    ...(user ? { account: { user, wallet: wallet ?? registry.bank(accKey, 'balance').wallet } } : {})
  });
  console.log(`+ ${name}${user ? ` [${user}]` : ''} — sys ${c.sys}, ${clients.size} online${resumed ? ' [resumed]' : ''}`);
}

function onGone(c) {
  if (!c.id || !clients.has(c.id)) return;
  clients.delete(c.id);
  clearMotion(guard, c.id);
  if (c.accKey) registry.parkPilot(c.accKey, c.name, c.state, c.sys);
  if (c.token) parked.set(c.token, {
    id: c.id, name: c.name, state: c.state, user: c.user, accKey: c.accKey,
    sys: c.sys, until: Date.now() / 1000 + RESUME_TTL
  });
  const left = leaveAll(rooms, c.id);
  if (left) {
    roomSend(left.sys, { t: 'leave', id: c.id });
    roomSend(left.sys, { t: 'host', id: left.host });
  }
  allSend({ t: 'gone', id: c.id });
  console.log(`- ${c.name} — ${clients.size} online`);
}

// Reap expired parked slots so the map cannot grow without bound.
setInterval(() => {
  const now = Date.now() / 1000;
  for (const [tok, p] of parked) if (p.until < now) parked.delete(tok);
}, 30_000).unref();

// ── static files + status API ────────────────────────────────────────

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.wasm': 'application/wasm',
  '.md': 'text/plain'
};

// The routes people type. `/` is the portal now — the front door of the galaxy — and
// the game lives at `/play` (served as index.html; its relative asset paths already
// resolve against `/`, so nothing inside the game moved).
const ROUTES = {
  '/': 'web/portal.html',
  '/play': 'index.html',
  '/forum': 'web/forum.html',
  '/admin': 'web/admin.html'
};

// ── static serving that respects distance ────────────────────────────
// The game is ~300 small ES modules. Served naively over the tunnel, that is ~300
// uncached, uncompressed round trips through Cloudflare — the whole reason "it takes
// a while to load". Three fixes, all standard:
//   * gzip for text (JS compresses ~4×), cached in memory per file mtime;
//   * ETag + If-None-Match so a warm browser revalidates for free;
//   * Cache-Control so Cloudflare's edge keeps the modules close to the players —
//     max-age 600 for assets (a patch is visible within ten minutes; the version
//     stamp on the boot screen says which build actually loaded), no-cache for HTML.
const gzCache = new Map();               // file -> {mtime, buf}

function onRequest(req, res) {
  const url = new URL(req.url, 'http://x');
  const pathname = path.posix.normalize('/' + decodeURIComponent(url.pathname));

  if (pathname === '/api/status') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({
      galaxy: 'living', seed: serverDoc.seed, age: +age().toFixed(1),
      online: clients.size, systems: occupancy(rooms),
      tls: !!tlsOpts, name: beacon ? beacon.fqdn : null, ips: localIPs(),
      suspects: Object.fromEntries(guard.suspects)
    }));
  }
  if (pathname.startsWith('/api/')) {
    api(req, res, { pathname, tls: !!tlsOpts }).catch(e => {
      console.error('api:', e.message);
      try { res.writeHead(500, { 'content-type': 'application/json' }); res.end('{"err":"server error"}'); } catch { }
    });
    return;
  }

  // Traversal-proof, vault unreachable however the path is spelled.
  const routed = ROUTES[pathname];
  let file = path.resolve(ROOT, routed || ('.' + pathname));
  if (!file.startsWith(ROOT) || file.startsWith(DATA)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }

  const st = fs.statSync(file);
  const ext = path.extname(file);
  const etag = `"${st.mtimeMs}-${st.size}"`;
  const isHtml = ext === '.html';
  const headers = {
    'content-type': MIME[ext] || 'application/octet-stream',
    etag,
    'cache-control': isHtml ? 'no-cache' : 'public, max-age=600'
  };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }

  const wantsGz = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  const textual = ['.html', '.js', '.mjs', '.css', '.json', '.svg', '.md'].includes(ext);
  if (wantsGz && textual && st.size > 512) {
    let e = gzCache.get(file);
    if (!e || e.mtime !== st.mtimeMs) {
      e = { mtime: st.mtimeMs, buf: zlib.gzipSync(fs.readFileSync(file)) };
      gzCache.set(file, e);
      if (gzCache.size > 600) gzCache.clear();       // a patch touched everything; start over
    }
    res.writeHead(200, { ...headers, 'content-encoding': 'gzip', vary: 'accept-encoding' });
    return res.end(e.buf);
  }
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
}

// ── listen ───────────────────────────────────────────────────────────

// TLS is not optional equipment any more: the server issues its own certificate in pure
// Node (server/certs.js) — no openssl, no bash, no scripts — and reissues it when the
// laptop's addresses change. v1.03.01 checked for server.key and then read server.crt,
// which crashed the whole process when a half-failed openssl run had left one without
// the other; ensureCerts owns both files as a pair, atomically, so that state cannot
// recur. `--insecure` remains the explicit way to run plain (the suite uses it).
const certDir = path.join(DATA, 'certs');
let tlsOpts = null;
if (!INSECURE) {
  tlsOpts = ensureCerts(certDir, NAME, m => console.log('certs: ' + m));
  if (!tlsOpts) console.log('certs: unavailable — running PLAIN');
}

const srv = tlsOpts ? https.createServer(tlsOpts, onRequest) : http.createServer(onRequest);

srv.on('error', e => {
  // The commonest way a second launch dies. Say it in words, not a stack trace — this
  // line is what the launcher shows the player when readiness fails.
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already taken — a galaxy is probably still running.` +
                  ` Stop it (or pass --port=<other>) and start again.`);
  } else {
    console.error('server: ' + e.message);
  }
  process.exit(1);
});

const beacon = NO_BEACON ? null : await startBeacon(NAME, console.log);

srv.on('upgrade', (req, sock) => {
  const headers = {};
  for (let i = 0; i < req.rawHeaders.length; i += 2)
    headers[req.rawHeaders[i].toLowerCase()] = req.rawHeaders[i + 1];
  if (!upgrade(sock, headers)) return sock.destroy();
  const c = { id: 0, conn: null, name: null, state: null, accKey: null, user: null, sys: 0, token: null };
  c.conn = wrapSocket(sock, {
    onJson: m => { try { onMessage(c, m); } catch (e) { console.error('route:', e.message); } },
    onClose: () => onGone(c)
  });
});

srv.listen(PORT, '0.0.0.0', () => {
  const proto = tlsOpts ? 'https/wss' : 'http/ws (PLAIN)';
  const scheme = tlsOpts ? 'https' : 'http';
  console.log(`Living Galaxy on ${proto} port ${PORT} · seed ${serverDoc.seed} · age ${Math.round(age())}s`);
  console.log(`vault: ${DATA}`);
  if (beacon) console.log(`players join at: ${scheme}://${beacon.fqdn}:${PORT}/`);
  else console.log(NO_BEACON ? 'beacon off (--no-beacon)'
                             : 'beacon: port 5353 unavailable — players join by IP');
  for (const ip of localIPs()) console.log(`         (by IP: ${scheme}://${ip}:${PORT}/)`);
});

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => {
  registry.saveAge(serverDoc, Date.now() / 1000 - started);
  for (const c of clients.values()) if (c.accKey) registry.parkPilot(c.accKey, c.name, c.state, c.sys);
  process.exit(0);
});
