// The galaxy server's pure parts: the encrypted vault, the wire codec, session tickets,
// the room table and the motion guard. No sockets, no processes — everything here is a
// function of its arguments, which is why the server keeps these in separate files.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { deriveKey, seal, unseal, hashSecret, secretMatches, openVault } from '../server/vault.js';
import { acceptKey, encodeFrame, makeParser, feed } from '../server/wire.js';
import { makeTicket, readTicket, newSecret } from '../server/tickets.js';
import { makeRooms, enterSystem, leaveAll, peersOf, systemOf, hostOf, occupancy,
         makeMotionGuard, checkMotion } from '../server/rooms.js';
import { makeRegistry } from '../server/registry.js';

let pass = 0, fail = 0;
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n + (e ? ' — ' + e : ''))); };

// ── crypto ───────────────────────────────────────────────────────────
console.log('\n— seal / unseal —');
{
  const key = deriveKey('open sesame', Buffer.from('0123456789abcdef'));
  const blob = seal(key, JSON.stringify({ credits: 500 }));
  ok('roundtrip', JSON.parse(unseal(key, blob).toString()).credits === 500);
  ok('two seals of one plaintext differ (fresh IV)',
     !seal(key, 'x').equals(seal(key, 'x')));

  const wrong = deriveKey('open sesame!', Buffer.from('0123456789abcdef'));
  ok('wrong key reads nothing', unseal(wrong, blob) === null);

  const bent = Buffer.from(blob);
  bent[bent.length - 1] ^= 1;                         // flip one ciphertext bit
  ok('a flipped bit is rejected, not decrypted', unseal(key, bent) === null);
  ok('a foreign blob is rejected', unseal(key, Buffer.from('not a vault record')) === null);

  const salt = 'a1b2';
  ok('password hash verifies', secretMatches('pw', salt, hashSecret('pw', salt)));
  ok('and rejects', !secretMatches('pw2', salt, hashSecret('pw', salt)));
}

// ── the store on disk ────────────────────────────────────────────────
console.log('\n— vault store —');
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lgv-'));
  const v = openVault(dir, 'hunter2');
  v.put('accounts/shane', { wallet: 42 });
  ok('get after put', v.get('accounts/shane').wallet === 42);
  ok('missing key falls back', v.get('accounts/ghost', 'none') === 'none');
  ok('keys() lists by prefix', v.keys('accounts').length === 1);
  ok('nothing on disk is plaintext',
     !fs.readFileSync(path.join(dir, v.keys('accounts')[0] + '.lgv')).includes('wallet'));
  ok('path traversal is folded harmless', (v.put('../evil', 1), !fs.existsSync(path.join(dir, '..', 'evil.lgv'))));

  // The check record is the whole point: a second open with the wrong passphrase must
  // refuse before it can write records under a second key next to the first.
  ok('reopen with the right passphrase', openVault(dir, 'hunter2') !== null);
  ok('reopen with the wrong passphrase refuses', openVault(dir, 'hunter3') === null);

  const reg = makeRegistry(v);
  ok('register', reg.register('Kestrel', 'pass1').ok === true);
  ok('duplicate register refused', /taken/.test(reg.register('kestrel', 'xxxxx').err));
  ok('bad callsign refused', !!reg.register('a', 'pass1').err);
  ok('login', reg.login('kestrel', 'pass1').ok === true);
  ok('wrong passphrase refused', /wrong/.test(reg.login('kestrel', 'nope').err));

  const key = 'accounts/kestrel';
  ok('deposit', reg.bank(key, 'deposit', 100).wallet === 100);
  ok('withdraw', reg.bank(key, 'withdraw', 30).wallet === 70);
  ok('overdraft refused', /insufficient/.test(reg.bank(key, 'withdraw', 1000).err));
  ok('negative deposit refused', !!reg.bank(key, 'deposit', -5).err);
  ok('the wallet survived on disk', v.get(key).wallet === 70);

  reg.delta(812, 'wreck:7', { at: [1, 2, 3] }, 1);
  reg.delta(812, 'wreck:7', { at: [4, 5, 6] }, 1);
  const d = reg.deltasFor(812);
  ok('latest value per delta key wins', d.length === 1 && d[0].v.at[0] === 4);
  ok('deltas are per system', reg.deltasFor(9).length === 0);
  fs.rmSync(dir, { recursive: true, force: true });
}

// ── wire ─────────────────────────────────────────────────────────────
console.log('\n— wire codec —');
{
  // RFC 6455's own worked example — the one constant every implementation must agree on.
  ok('accept key matches the RFC example',
     acceptKey('dGhlIHNhbXBsZSBub25jZQ==') === 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=');

  // server frames are unmasked; simulate a masked client frame by hand
  const p = makeParser();
  const body = Buffer.from('{"t":"ping"}');
  const mask = Buffer.from([1, 2, 3, 4]);
  const masked = Buffer.from(body.map((b, i) => b ^ mask[i & 3]));
  const frame = Buffer.concat([Buffer.from([0x81, 0x80 | body.length]), mask, masked]);
  const [got] = feed(p, frame);
  ok('masked client frame decodes', got && got.payload.toString() === '{"t":"ping"}');

  // byte-at-a-time arrival must yield exactly one message, at the end
  const p2 = makeParser();
  let out = [];
  for (const b of frame) out = out.concat(feed(p2, Buffer.from([b])));
  ok('fragmented arrival reassembles', out.length === 1 && out[0].payload.toString() === '{"t":"ping"}');

  const enc = encodeFrame('hello');
  ok('server frames are unmasked text', enc[0] === 0x81 && enc[1] === 5);
  ok('16-bit length form', encodeFrame('x'.repeat(300))[1] === 126);
  let threw = false;
  try { feed(makeParser(), Buffer.concat([Buffer.from([0x81, 127]), Buffer.alloc(8, 0xff)])); }
  catch { threw = true; }
  ok('an absurd length is an error, not an allocation', threw);
}

// ── tickets ──────────────────────────────────────────────────────────
console.log('\n— tickets —');
{
  const secret = newSecret();
  const t = makeTicket(secret, { id: 7, name: 'Kestrel' }, 60, 1000);
  const claims = readTicket(secret, t, 1030);
  ok('claims come back', claims && claims.id === 7 && claims.name === 'Kestrel');
  ok('expiry is enforced', readTicket(secret, t, 1061) === null);
  ok('a different secret reads nothing', readTicket(newSecret(), t, 1030) === null);
  const forged = t.slice(0, -2) + 'zz';
  ok('a bent signature reads nothing', readTicket(secret, forged, 1030) === null);
  ok('garbage reads nothing', readTicket(secret, 'not.a.ticket', 1030) === null &&
     readTicket(secret, null, 1030) === null);
}

// ── rooms ────────────────────────────────────────────────────────────
console.log('\n— rooms —');
{
  const R = makeRooms();
  enterSystem(R, 1, 100);
  enterSystem(R, 2, 100);
  enterSystem(R, 3, 200);
  ok('peers are room-scoped', peersOf(R, 1).length === 1 && peersOf(R, 1)[0] === 2);
  ok('a pilot in another system is not a peer', !peersOf(R, 1).includes(3));
  ok('each room elects its own host', hostOf(R, 100) === 1 && hostOf(R, 200) === 3);
  ok('occupancy counts by system', occupancy(R)[100] === 2 && occupancy(R)[200] === 1);

  const move = enterSystem(R, 1, 200);
  ok('a jump reports both rooms', move.left.sys === 100 && move.joined.sys === 200);
  ok('the old room re-elects on departure', hostOf(R, 100) === 2);
  ok('an arrival does not unseat a sitting host', hostOf(R, 200) === 3);
  ok('repeat entry is a no-op', enterSystem(R, 1, 200) === null);

  const left = leaveAll(R, 3);
  ok('the host leaving re-elects', left.host === 1 && hostOf(R, 200) === 1);
  leaveAll(R, 1);
  ok('an empty system costs nothing', !R.bySys.has(200));
  ok('membership is forgotten', systemOf(R, 1) === undefined);
}

// ── motion guard ─────────────────────────────────────────────────────
console.log('\n— motion guard —');
{
  const G = makeMotionGuard(1000);
  ok('first report always passes', checkMotion(G, 1, [0, 0, 0], 10));
  ok('sane motion passes', checkMotion(G, 1, [500, 0, 0], 11));
  ok('teleport is flagged', !checkMotion(G, 1, [90000, 0, 0], 12));
  ok('and counted', G.suspects.get(1) === 1);
  ok('a declared warp is allowed to be fast', checkMotion(G, 1, [500000, 0, 0], 13, true));
  ok('a long gap at sane speed is innocent', checkMotion(G, 1, [500000 + 900 * 60, 0, 0], 73));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
