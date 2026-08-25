<<<<<<< HEAD
// The galaxy server's live protocol: a real server/main.js subprocess, real WebSocket
// clients (Node 22 built-in), a throwaway vault in a temp directory. Everything the old
// relay promised still holds — welcome, roster, state relay, clock echo, host authority,
// resume — plus the v1.03 shape: rooms. Two pilots in different systems must not hear
// each other, and each system elects its own host.
import { spawn } from 'child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 8991;
const ROOT = new URL('../', import.meta.url).pathname;
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'lg-net-'));
=======
// Multiplayer integration: real server.py subprocess, real WebSocket clients (Node 22 built-in).
import { spawn } from 'child_process';

const PORT = 8991;
const ROOT = new URL('../', import.meta.url).pathname;
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
let pass = 0, fail = 0;
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n + (e ? ' — ' + e : ''))); };
const wait = ms => new Promise(r => setTimeout(r, ms));

<<<<<<< HEAD
const srv = spawn('node', ['server/main.js', `--port=${PORT}`, '--seed=555', '--insecure',
                           '--no-beacon', `--data=${DATA}`, '--pass=testvault'], { cwd: ROOT });
let srvOut = '';
srv.stdout.on('data', d => srvOut += d);
srv.stderr.on('data', d => srvOut += d);
await wait(900);

function client(name, opts = {}) {
=======
const srv = spawn('python3', ['server.py', `--port=${PORT}`, '--seed=555'], { cwd: ROOT });
let srvOut = '';
srv.stdout.on('data', d => srvOut += d);
srv.stderr.on('data', d => srvOut += d);
await wait(600);

function client(name, resume) {
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  return new Promise((res, rej) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
    const msgs = [];
    ws.onmessage = e => { try { msgs.push(JSON.parse(e.data)); } catch (err) {} };
<<<<<<< HEAD
    ws.onopen = () => ws.send(JSON.stringify({
      t: 'hello', name, resume: opts.resume || undefined,
      sys: opts.sys ?? 0, auth: opts.auth || undefined
    }));
=======
    ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', name, resume: resume || undefined }));
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
    ws.onerror = () => rej(new Error('socket error'));
    const until = (pred, ms = 3000) => new Promise((r2, j2) => {
      const t0 = Date.now();
      (function chk() {
        const m = msgs.find(pred);
        if (m) return r2(m);
        if (Date.now() - t0 > ms) return j2(new Error('timeout: ' + JSON.stringify(msgs)));
        setTimeout(chk, 25);
      })();
    });
<<<<<<< HEAD
    until(m => m.t === 'welcome' || m.t === 'refuse')
      .then(w => res({ ws, msgs, until, welcome: w })).catch(rej);
  });
}

console.log('\n— galaxy server —');
=======
    until(m => m.t === 'welcome').then(w => res({ ws, msgs, until, welcome: w })).catch(rej);
  });
}

console.log('\n— relay server —');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
try {
  const A = await client('Alpha');
  ok('handshake + welcome', A.welcome.id === 1 && A.welcome.seed === 555,
     JSON.stringify(A.welcome));
  ok('server reports its age', typeof A.welcome.age === 'number');
<<<<<<< HEAD
  ok('welcome names the system', A.welcome.sys === 0);
=======
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

  const B = await client('Bravo');
  ok('second pilot gets the same seed', B.welcome.seed === 555);
  ok('late joiner sees the roster', B.welcome.players && '1' in B.welcome.players &&
     B.welcome.players['1'].name === 'Alpha', JSON.stringify(B.welcome.players));

  const join = await A.until(m => m.t === 'join');
  ok('join broadcast to existing pilots', join.id === 2 && join.name === 'Bravo');

  A.ws.send(JSON.stringify({ t: 'state', p: [1200.5, 30, -400], yaw: 0.5, pitch: -0.1, cls: 'military' }));
  const st = await B.until(m => m.t === 'state');
  ok('state relays with sender id', st.id === 1 && st.p[0] === 1200.5 && st.cls === 'military');
<<<<<<< HEAD
  ok('state carries the server clock', typeof st.t2 === 'number');
=======
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

  A.ws.send(JSON.stringify({ t: 'fire', p: [0, 0, 0], d: [0, 0, -1], s: 760, c: 6741247 }));
  const fr = await B.until(m => m.t === 'fire');
  ok('fire relays with sender id', fr.id === 1 && fr.s === 760);

<<<<<<< HEAD
=======
  // late joiner receives Alpha's cached state through the roster
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  const C = await client('Charlie');
  const cached = C.welcome.players['1'] && C.welcome.players['1'].state;
  ok('roster carries last known positions', !!cached && cached.p[0] === 1200.5,
     JSON.stringify(C.welcome.players['1']));

<<<<<<< HEAD
  // ── rooms ──────────────────────────────────────────────────────
  console.log('\n— rooms: the system is the shard —');
  const X = await client('Xeno', { sys: 812 });
  ok('a pilot in another system is not in the roster',
     !Object.values(C.welcome.players).some(p => p.name === 'Xeno') &&
     Object.keys(X.welcome.players).length === 0, JSON.stringify(X.welcome.players));
  ok('that pilot hosts their own room', X.welcome.host === X.welcome.id);

  // ...but the whole galaxy knows OF them: welcome carries everyone, and joins/jumps
  // are announced everywhere. Rooms scope the heavy traffic, never the knowledge.
  ok('welcome names generation density', typeof X.welcome.density === 'number');
  ok('welcome lists every pilot in the galaxy, with systems',
     Object.values(X.welcome.everyone || {}).some(p => p.name === 'Alpha' && p.sys === 0),
     JSON.stringify(X.welcome.everyone));
  const whoX = await A.until(m => m.t === 'who' && m.name === 'Xeno');
  ok('a join is announced across systems', whoX.sys === 812);

  X.ws.send(JSON.stringify({ t: 'state', p: [5, 5, 5], cls: 'civilian' }));
  await wait(300);
  ok('state does not cross systems', !A.msgs.some(m => m.t === 'state' && m.id === X.welcome.id));

  // hits are addressed AND room-checked
  X.ws.send(JSON.stringify({ t: 'hit', to: 1, d: 40, k: 'kinetic' }));
  await wait(300);
  ok('a hull two systems away cannot be hurt', !A.msgs.some(m => m.t === 'hit'));

  // jumping re-rooms: Bravo jumps to 812
  B.msgs.length = 0;
  B.ws.send(JSON.stringify({ t: 'sys', sys: 812 }));
  const room = await B.until(m => m.t === 'room');
  ok('a jump is answered with the room brief', room.sys === 812 &&
     Object.values(room.players).some(p => p.name === 'Xeno'), JSON.stringify(room));
  ok('the room brief names its own host', room.host === X.welcome.id);
  const lv0 = await A.until(m => m.t === 'leave');
  ok('the old system is told', lv0.id === 2);
  const jn = await X.until(m => m.t === 'join');
  ok('the new system is told', jn.id === 2 && jn.name === 'Bravo');

  B.ws.send(JSON.stringify({ t: 'state', p: [9, 9, 9], cls: 'logistics' }));
  const xs = await X.until(m => m.t === 'state' && m.id === 2);
  ok('state now reaches the new room', xs.p[0] === 9);
  await wait(200);
  ok('and no longer the old one', !A.msgs.some(m => m.t === 'state' && m.id === 2));
  ok('the jump was announced across systems',
     A.msgs.some(m => m.t === 'who' && m.id === 2 && m.sys === 812));

=======
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  // ── clock echo ─────────────────────────────────────────────────
  console.log('\n— clock sync —');
  const sent = 12345.678;
  A.ws.send(JSON.stringify({ t: 'ping', c: sent }));
  const pong = await A.until(m => m.t === 'pong');
<<<<<<< HEAD
  ok('the client stamp comes back untouched', pong.c === sent, String(pong.c));
  ok('the server reports its own clock', typeof pong.s === 'number' && pong.s > 0);

  // ── host authority, per room ───────────────────────────────────
  console.log('\n— host authority —');
  ok('a host is named at welcome', A.welcome.host === 1, String(A.welcome.host));

  A.ws.send(JSON.stringify({ t: 'npc', n: [[7, 100, 0, 200, 'pirate', 60]] }));
  const npc = await C.until(m => m.t === 'npc');
  ok('the room host may describe the world', npc.n[0][0] === 7 && npc.id === 1);
  ok('npc packets carry a server timestamp', typeof npc.t2 === 'number');

  C.ws.send(JSON.stringify({ t: 'npc', n: [[99, 0, 0, 0, 'fake', 1]] }));
  await wait(300);
  ok('a non-host cannot describe the world',
     !A.msgs.some(m => m.t === 'npc' && m.n && m.n[0] && m.n[0][0] === 99));

  X.msgs.length = 0;
  A.msgs.length = 0;
  B.ws.send(JSON.stringify({ t: 'npc', n: [[50, 0, 0, 0, 'ghost', 1]] }));
  await wait(300);
  ok('room hosting is per system — a guest there is not host here',
     !X.msgs.some(m => m.t === 'npc'));

  // the host of room 812 leaving hands authority to Bravo, inside 812 only
  X.ws.close();
  const handoff = await B.until(m => m.t === 'host' && m.id === 2);
  ok('the host leaving reassigns within the room', !!handoff);
  const goneX = await A.until(m => m.t === 'gone');
  ok('a departure is announced across systems', goneX.id === X.welcome.id);
  await wait(200);
  ok('other systems never hear about the host change', !A.msgs.some(m => m.t === 'host'));

  // ── resume ─────────────────────────────────────────────────────
  console.log('\n— reconnect —');
  ok('welcome carries a resume token', typeof C.welcome.token === 'string' && C.welcome.token.includes('.'));
=======
  ok('ping is answered', !!pong);
  ok('the client stamp comes back untouched', pong.c === sent, String(pong.c));
  ok('the server reports its own clock', typeof pong.s === 'number' && pong.s > 0);
  const pong2 = await (async () => {
    A.ws.send(JSON.stringify({ t: 'ping', c: sent + 1 }));
    return A.until(m => m.t === 'pong' && m.c === sent + 1);
  })();
  ok('the server clock advances', pong2.s >= pong.s);

  // ── host authority ─────────────────────────────────────────────
  console.log('\n— host authority —');
  ok('a host is named at welcome', A.welcome.host === 1, String(A.welcome.host));
  ok('later joiners agree on the host', C.welcome.host === 1, String(C.welcome.host));

  A.ws.send(JSON.stringify({ t: 'npc', n: [[7, 100, 0, 200, 'pirate', 60]] }));
  const npc = await B.until(m => m.t === 'npc');
  ok('the host may describe the world', npc.n[0][0] === 7 && npc.id === 1);
  ok('npc packets carry a server timestamp', typeof npc.t2 === 'number');

  // ...and nobody else may
  B.ws.send(JSON.stringify({ t: 'npc', n: [[99, 0, 0, 0, 'fake', 1]] }));
  await wait(300);
  ok('a non-host cannot describe the world',
     !C.msgs.some(m => m.t === 'npc' && m.n && m.n[0] && m.n[0][0] === 99));

  B.ws.close();
  const lv = await A.until(m => m.t === 'leave');
  ok('leave broadcast on disconnect', lv.id === 2);

  // The host leaving must hand off, not strand everyone. Clearing the log first matters:
  // C has already received a `host` message from its own join, and matching that one
  // would pass regardless of whether a handover ever happened.
  const beforeHost = A.welcome.host;
  C.msgs.length = 0;
  A.ws.close();
  const handoff = await C.until(m => m.t === 'host');
  ok('the host leaving reassigns authority', handoff.id !== beforeHost && handoff.id > 0,
     JSON.stringify(handoff));

  // ── resume ─────────────────────────────────────────────────────
  console.log('\n— reconnect —');
  ok('welcome carries a resume token', typeof C.welcome.token === 'string' && C.welcome.token);
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  const cId = C.welcome.id, cToken = C.welcome.token;
  C.ws.send(JSON.stringify({ t: 'state', p: [777, 0, 888], yaw: 1, cls: 'industrial' }));
  await wait(200);
  C.ws.close();
  await wait(300);

<<<<<<< HEAD
  const C2 = await client('Charlie', { resume: cToken });
  ok('a token resumes the same pilot', C2.welcome.id === cId, `${cId} → ${C2.welcome.id}`);
=======
  const C2 = await client('Charlie', cToken);
  ok('a token resumes the same pilot', C2.welcome.id === cId,
     `${cId} → ${C2.welcome.id}`);
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  ok('a resume is flagged as one', C2.welcome.resumed === true);

  const D = await client('Delta');
  ok('a fresh join is not flagged as a resume', D.welcome.resumed === false);
  ok('a new pilot gets a new id', D.welcome.id !== cId);
<<<<<<< HEAD
  ok('a spent token cannot be reused',
     (await client('Ghost', { resume: cToken })).welcome.resumed === false);
  ok('a forged token is just a fresh join',
     (await client('Mallory', { resume: cToken.slice(0, -3) + 'abc' })).welcome.resumed === false);

  A.ws.close(); B.ws.close(); C2.ws.close(); D.ws.close();
} catch (e) {
  ok('galaxy server flow completed', false, e.message + '\nserver output:\n' + srvOut);
}
await wait(200);
srv.kill();
fs.rmSync(DATA, { recursive: true, force: true });
=======
  ok('a spent token cannot be reused', (await client('Ghost', cToken)).welcome.resumed === false);

  C2.ws.close(); D.ws.close();
} catch (e) {
  ok('relay flow completed', false, e.message + '\nserver output:\n' + srvOut);
}
await wait(200);
srv.kill();
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
