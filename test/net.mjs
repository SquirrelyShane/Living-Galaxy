// Multiplayer integration: real server.py subprocess, real WebSocket clients (Node 22 built-in).
import { spawn } from 'child_process';

const PORT = 8991;
const ROOT = new URL('../', import.meta.url).pathname;
let pass = 0, fail = 0;
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n + (e ? ' — ' + e : ''))); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const srv = spawn('python3', ['server.py', `--port=${PORT}`, '--seed=555'], { cwd: ROOT });
let srvOut = '';
srv.stdout.on('data', d => srvOut += d);
srv.stderr.on('data', d => srvOut += d);
await wait(600);

function client(name, resume) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
    const msgs = [];
    ws.onmessage = e => { try { msgs.push(JSON.parse(e.data)); } catch (err) {} };
    ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', name, resume: resume || undefined }));
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
    until(m => m.t === 'welcome').then(w => res({ ws, msgs, until, welcome: w })).catch(rej);
  });
}

console.log('\n— relay server —');
try {
  const A = await client('Alpha');
  ok('handshake + welcome', A.welcome.id === 1 && A.welcome.seed === 555,
     JSON.stringify(A.welcome));
  ok('server reports its age', typeof A.welcome.age === 'number');

  const B = await client('Bravo');
  ok('second pilot gets the same seed', B.welcome.seed === 555);
  ok('late joiner sees the roster', B.welcome.players && '1' in B.welcome.players &&
     B.welcome.players['1'].name === 'Alpha', JSON.stringify(B.welcome.players));

  const join = await A.until(m => m.t === 'join');
  ok('join broadcast to existing pilots', join.id === 2 && join.name === 'Bravo');

  A.ws.send(JSON.stringify({ t: 'state', p: [1200.5, 30, -400], yaw: 0.5, pitch: -0.1, cls: 'military' }));
  const st = await B.until(m => m.t === 'state');
  ok('state relays with sender id', st.id === 1 && st.p[0] === 1200.5 && st.cls === 'military');

  A.ws.send(JSON.stringify({ t: 'fire', p: [0, 0, 0], d: [0, 0, -1], s: 760, c: 6741247 }));
  const fr = await B.until(m => m.t === 'fire');
  ok('fire relays with sender id', fr.id === 1 && fr.s === 760);

  // late joiner receives Alpha's cached state through the roster
  const C = await client('Charlie');
  const cached = C.welcome.players['1'] && C.welcome.players['1'].state;
  ok('roster carries last known positions', !!cached && cached.p[0] === 1200.5,
     JSON.stringify(C.welcome.players['1']));

  // ── clock echo ─────────────────────────────────────────────────
  console.log('\n— clock sync —');
  const sent = 12345.678;
  A.ws.send(JSON.stringify({ t: 'ping', c: sent }));
  const pong = await A.until(m => m.t === 'pong');
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
  const cId = C.welcome.id, cToken = C.welcome.token;
  C.ws.send(JSON.stringify({ t: 'state', p: [777, 0, 888], yaw: 1, cls: 'industrial' }));
  await wait(200);
  C.ws.close();
  await wait(300);

  const C2 = await client('Charlie', cToken);
  ok('a token resumes the same pilot', C2.welcome.id === cId,
     `${cId} → ${C2.welcome.id}`);
  ok('a resume is flagged as one', C2.welcome.resumed === true);

  const D = await client('Delta');
  ok('a fresh join is not flagged as a resume', D.welcome.resumed === false);
  ok('a new pilot gets a new id', D.welcome.id !== cId);
  ok('a spent token cannot be reused', (await client('Ghost', cToken)).welcome.resumed === false);

  C2.ws.close(); D.ws.close();
} catch (e) {
  ok('relay flow completed', false, e.message + '\nserver output:\n' + srvOut);
}
await wait(200);
srv.kill();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
