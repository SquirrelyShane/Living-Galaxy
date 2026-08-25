// The durable galaxy: what survives when the server dies and comes back.
//
// A relay could be restarted harmlessly because it remembered nothing. This server's
// whole reason to exist is the opposite claim, so the suite makes it the hard way:
// register an account, bank credits, record world deltas, kill the process, start a new
// one on the same vault, and demand it all back — then demand it all STAYS unreachable
// under the wrong passphrase.
import { spawn } from 'child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 8992;
const ROOT = new URL('../', import.meta.url).pathname;
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'lg-gal-'));
let pass = 0, fail = 0;
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n + (e ? ' — ' + e : ''))); };
const wait = ms => new Promise(r => setTimeout(r, ms));

function boot(passphrase = 'vaultpass') {
  const p = spawn('node', ['server/main.js', `--port=${PORT}`, '--seed=901', '--insecure',
                           '--no-beacon', `--data=${DATA}`, `--pass=${passphrase}`,
                           `--logfile=${path.join(DATA, 'run.log')}`], { cwd: ROOT });
  let out = '';
  p.stdout.on('data', d => out += d);
  p.stderr.on('data', d => out += d);
  return { p, out: () => out };
}

function client(name, opts = {}) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
    const msgs = [];
    ws.onmessage = e => { try { msgs.push(JSON.parse(e.data)); } catch (err) {} };
    // `sys` is only sent when the test says so — omitting it is how a real client with
    // no local save asks the server "where did you last see me?".
    ws.onopen = () => ws.send(JSON.stringify({
      t: 'hello', name, sys: opts.sys, auth: opts.auth || undefined
    }));
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
    until(m => m.t === 'welcome' || m.t === 'refuse')
      .then(w => res({ ws, msgs, until, welcome: w })).catch(rej);
  });
}

console.log('\n— first life —');
let srv = boot();
await wait(900);
try {
  const A = await client('Kestrel', { sys: 33, auth: { user: 'Kestrel', pass: 'secret9', register: true } });
  ok('an account is made on first use', A.welcome.t === 'welcome' &&
     A.welcome.account && A.welcome.account.user === 'Kestrel', JSON.stringify(A.welcome));
  ok('a fresh wallet is empty', A.welcome.account.wallet === 0);

  A.ws.send(JSON.stringify({ t: 'bank', op: 'deposit', amt: 250 }));
  const dep = await A.until(m => m.t === 'bank');
  ok('a deposit is confirmed by the ledger', dep.ok === true && dep.wallet === 250);

  // the room host records two persistent differences from the seed
  A.ws.send(JSON.stringify({ t: 'delta', k: 'claim:rock-4', v: { by: 'Kestrel' } }));
  A.ws.send(JSON.stringify({ t: 'delta', k: 'wreck:19', v: { hull: 'pirate-cutter' } }));
  await wait(300);

  // an anonymous guest may fly but not bank
  const G = await client('Drifter');
  G.ws.send(JSON.stringify({ t: 'bank', op: 'deposit', amt: 10 }));
  const no = await G.until(m => m.t === 'bank');
  ok('a guest cannot touch the ledger', !!no.err);
  G.ws.close();

  const W = await client('Wrongpass', { auth: { user: 'Kestrel', pass: 'nope', register: true } });
  ok('the passphrase decides, even with register set', W.welcome.t === 'refuse' &&
     /wrong/.test(W.welcome.why), JSON.stringify(W.welcome));

  A.ws.close();
  await wait(200);
} catch (e) {
  ok('first life completed', false, e.message + '\n' + srv.out());
}
srv.p.kill('SIGTERM');
await wait(400);

console.log('\n— second life, same vault —');
srv = boot();
await wait(900);
try {
  const A2 = await client('Kestrel', { auth: { user: 'Kestrel', pass: 'secret9' } });
  ok('the account outlives the process', A2.welcome.account &&
     A2.welcome.account.wallet === 250, JSON.stringify(A2.welcome.account));
  ok('a registered pilot re-enters where the galaxy last saw them',
     A2.welcome.sys === 33, String(A2.welcome.sys));
  const keys = (A2.welcome.deltas || []).map(d => d.k).sort();
  ok('world deltas outlive the process',
     keys.join(',') === 'claim:rock-4,wreck:19', keys.join(','));
  ok('the galaxy is older than a fresh boot', A2.welcome.age > 0.5, String(A2.welcome.age));

  A2.ws.send(JSON.stringify({ t: 'bank', op: 'withdraw', amt: 100 }));
  const wd = await A2.until(m => m.t === 'bank');
  ok('the ledger still balances', wd.ok === true && wd.wallet === 150);
  A2.ws.close();
  await wait(200);
} catch (e) {
  ok('second life completed', false, e.message + '\n' + srv.out());
}
srv.p.kill('SIGTERM');
await wait(400);

// The console is mirrored to --logfile (the Windows launcher's diagnostics read it
// while the server window keeps its own words visible).
{
  const mirrored = fs.readFileSync(path.join(DATA, 'run.log'), 'utf8');
  ok('the logfile mirrors the console', /Living Galaxy on .*port/.test(mirrored),
     mirrored.slice(0, 120));
}

console.log('\n— wrong passphrase —');
{
  const bad = boot('letmein');
  const code = await new Promise(r => bad.p.on('exit', c => r(c)));
  ok('the vault refuses to open', code === 1, String(code));
  ok('and says so before serving anything', /refusing to run/.test(bad.out()), bad.out());
}

// The vault on disk must never leak the things it holds.
{
  const files = fs.readdirSync(DATA).filter(f => f.endsWith('.lgv'));
  const leaked = files.some(f => {
    const raw = fs.readFileSync(path.join(DATA, f));
    return raw.includes('Kestrel') || raw.includes('claim:rock-4') || raw.includes('secret9');
  });
  ok('nothing legible rests on disk', files.length >= 3 && !leaked, files.join(','));
}

fs.rmSync(DATA, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
