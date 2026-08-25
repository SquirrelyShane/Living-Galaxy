// The web suite, end to end against a real server: routes, compression, caching,
// accounts over HTTP, email-verification codes, the forum, and the admin gate.
// Everything a browser would do, done with fetch and a hand-carried cookie.
import { spawn } from 'child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 8994;
const ROOT = new URL('../', import.meta.url).pathname;
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'lg-web-'));
const B = `http://127.0.0.1:${PORT}`;
let pass = 0, fail = 0;
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n + (e ? ' — ' + e : ''))); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const srv = spawn('node', ['server/main.js', `--port=${PORT}`, '--seed=77', '--insecure', '--no-beacon',
                           '--admin=Overseer', `--data=${DATA}`, '--pass=webtest'], { cwd: ROOT });
let srvOut = '';
srv.stdout.on('data', d => srvOut += d);
srv.stderr.on('data', d => srvOut += d);
await wait(1200);

// The generated admin passphrase is printed exactly once at boot — read it like an
// operator would.
const adminPass = (srvOut.match(/passphrase: (\S+)/) || [])[1];

/** fetch with a named cookie jar (one cookie is all this API uses). */
const jars = {};
async function go(jar, method, url, body) {
  const r = await fetch(B + url, {
    method, redirect: 'manual',
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(jars[jar] ? { cookie: jars[jar] } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const set = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  if (set.length) jars[jar] = set[0].split(';')[0];
  return r;
}
const json = async (...a) => (await go(...a)).json();

console.log('\n— routes & the fast path —');
try {
  ok('admin passphrase was printed at boot', !!adminPass, srvOut.slice(0, 300));

  const portal = await fetch(B + '/');
  const portalHtml = await portal.text();
  ok('/ is the portal', /PILOT REGISTRY/.test(portalHtml) && /LIVING GALAXY/.test(portalHtml));
  ok('html is never cached stale', portal.headers.get('cache-control') === 'no-cache');

  const play = await (await fetch(B + '/play')).text();
  ok('/play is the game', /boot-start/.test(play));
  ok('/forum and /admin are pages', /COMMS BOARDS|forum/i.test(await (await fetch(B + '/forum')).text()) &&
     /ADMIN DECK/.test(await (await fetch(B + '/admin')).text()));

  const gz = await fetch(B + '/src/main.js', { headers: { 'accept-encoding': 'gzip' } });
  ok('modules are gzipped for the wire', gz.headers.get('content-encoding') === 'gzip');
  ok('modules are edge-cacheable', /max-age=600/.test(gz.headers.get('cache-control')));
  const etag = gz.headers.get('etag');
  ok('modules carry an etag', !!etag);
  const notMod = await fetch(B + '/src/main.js', { headers: { 'if-none-match': etag } });
  ok('a warm client revalidates for free', notMod.status === 304);
  const vault = await fetch(B + '/galaxy-data/server.lgv');
  ok('the vault is unreachable over http', vault.status === 403 || vault.status === 404);

  // ── accounts over http ─────────────────────────────────────────
  console.log('\n— pilot registry —');
  ok('a guest is a guest', (await json('g', 'GET', '/api/me')).guest === true);

  const reg = await json('kes', 'POST', '/api/register',
    { user: 'Kestrel', pass: 'flying9', email: 'kes@example.com' });
  ok('registration signs you in', reg.ok === true && reg.user === 'Kestrel');
  ok('an email means a pending verification', reg.verifyPending === true);
  const me = await json('kes', 'GET', '/api/me');
  ok('the cookie carries the session', me.user === 'Kestrel' && me.verified === false);

  ok('a wrong passphrase is refused',
     !!(await json('x', 'POST', '/api/login', { user: 'Kestrel', pass: 'nope' })).err);
  ok('the same account logs in over http',
     (await json('kes2', 'POST', '/api/login', { user: 'kestrel', pass: 'flying9' })).ok === true);

  ok('a wrong code is refused', !!(await json('kes', 'POST', '/api/verify', { code: '000000' })).err);

  // ── admin ──────────────────────────────────────────────────────
  console.log('\n— admin deck —');
  ok('the deck is gated', (await go('kes', 'GET', '/api/admin')).status === 403);
  const al = await json('adm', 'POST', '/api/login', { user: 'Overseer', pass: adminPass });
  ok('the generated admin credential works', al.ok === true && al.admin === true, JSON.stringify(al));
  const deck = await json('adm', 'GET', '/api/admin');
  ok('the deck reports the galaxy', typeof deck.age === 'number' && Array.isArray(deck.online));
  const pend = deck.pending.find(p => p.user === 'Kestrel');
  ok('pending codes are visible to the operator (mail fallback)', !!pend && /^\d{6}$/.test(pend.code));

  const ver = await json('kes', 'POST', '/api/verify', { code: pend.code });
  ok('the operator-delivered code verifies', ver.ok === true);
  ok('verification sticks', (await json('kes', 'GET', '/api/me')).verified === true);

  // ── forum ──────────────────────────────────────────────────────
  console.log('\n— forum —');
  const boards = await json('g', 'GET', '/api/forum');
  ok('boards are seeded', boards.boards.length === 4 && boards.boards.some(b => b.slug === 'flight-deck'));
  ok('a guest cannot post', (await go('g', 'POST', '/api/forum/thread',
     { board: 'flight-deck', title: 'x', body: 'y' })).status === 401);

  const th = await json('kes', 'POST', '/api/forum/thread',
    { board: 'flight-deck', title: 'First light over Solaris', body: 'The <b>galaxy</b> is live.' });
  ok('a pilot can open a thread', th.ok === true && th.id > 0);
  const rd = await json('g', 'GET', `/api/forum/thread?id=${th.id}`);
  ok('anyone can read it', rd.thread.title === 'First light over Solaris');
  ok('markup is data, not markup', rd.thread.posts[0].body.includes('<b>'));  // stored raw; rendered as textContent

  ok('a reply lands', (await json('kes', 'POST', '/api/forum/reply', { id: th.id, body: 'o7' })).ok === true);
  ok('moderation is admin-only', (await go('kes', 'POST', '/api/forum/mod', { id: th.id, op: 'lock' })).status === 403);
  ok('the admin can lock', (await json('adm', 'POST', '/api/forum/mod', { id: th.id, op: 'lock' })).ok === true);
  ok('a locked thread refuses pilots',
     !!(await json('kes', 'POST', '/api/forum/reply', { id: th.id, body: 'still here' })).err);
  ok('...but not the admin', (await json('adm', 'POST', '/api/forum/reply', { id: th.id, body: 'noted' })).ok === true);
  ok('the admin can delete', (await json('adm', 'POST', '/api/forum/mod', { id: th.id, op: 'delete' })).ok === true);
  ok('deleted is gone', (await go('g', 'GET', `/api/forum/thread?id=${th.id}`)).status === 404);

  // ── logout ─────────────────────────────────────────────────────
  await go('kes', 'POST', '/api/logout');
  ok('logout ends the session', (await json('kes', 'GET', '/api/me')).guest === true);
} catch (e) {
  ok('web suite flow completed', false, e.message + '\nserver output:\n' + srvOut);
}

srv.kill('SIGTERM');
await wait(300);
fs.rmSync(DATA, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
