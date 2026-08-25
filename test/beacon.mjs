// The beacon: the DNS packet maths as pure buffers, then a live responder answering a
// real UDP query. The live half uses the QU (unicast-reply) bit so the test never depends
// on multicast delivery working inside whatever sandbox the suite runs in — the beacon
// always *sends* the multicast copy, but the copy we assert on comes straight back.
import dgram from 'node:dgram';
import { parseQuery, buildAnswer, sameName, startBeacon, localIPs } from '../server/beacon.js';

let pass = 0, fail = 0;
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n + (e ? ' — ' + e : ''))); };

/** A DNS query for `name`, type A, optionally with the QU bit — built by hand. */
function query(name, { qu = false, qr = false } = {}) {
  const head = Buffer.alloc(12);
  head.writeUInt16BE(qr ? 0x8000 : 0, 2);
  head.writeUInt16BE(1, 4);                              // one question
  const labels = Buffer.concat([
    ...name.split('.').map(p => Buffer.concat([Buffer.from([p.length]), Buffer.from(p)])),
    Buffer.from([0])
  ]);
  const tail = Buffer.alloc(4);
  tail.writeUInt16BE(1, 0);                              // type A
  tail.writeUInt16BE(qu ? 0x8001 : 0x0001, 2);           // IN, maybe QU
  return Buffer.concat([head, labels, tail]);
}

// ── packet maths ─────────────────────────────────────────────────────
console.log('\n— DNS codec —');
{
  const qs = parseQuery(query('galaxy.local'));
  ok('a question parses', qs.length === 1 && qs[0].name === 'galaxy.local' && qs[0].type === 1);
  ok('QU bit is read', parseQuery(query('galaxy.local', { qu: true }))[0].unicast === true &&
     qs[0].unicast === false);
  ok('a response is not a question', parseQuery(query('galaxy.local', { qr: true })).length === 0);
  ok('garbage parses to nothing', parseQuery(Buffer.from('hello')).length === 0 &&
     parseQuery(Buffer.alloc(0)).length === 0);
  ok('names match case-insensitively', sameName('Galaxy.LOCAL', 'galaxy.local') &&
     !sameName('galaxy.local', 'galaxia.local'));

  const ans = buildAnswer('galaxy.local', ['192.168.1.50', '10.0.0.7'], 120);
  ok('answer flags say authoritative response', ans.readUInt16BE(2) === 0x8400);
  ok('mDNS response id is zero', ans.readUInt16BE(0) === 0);
  ok('one A record per address', ans.readUInt16BE(6) === 2);
  // walk to the first record's rdata and read the IP back
  const nameLen = 1 + 6 + 1 + 5 + 1;                     // labels "galaxy","local", root
  const rd = 12 + nameLen + 10;
  ok('the address survives the trip',
     [...ans.subarray(rd, rd + 4)].join('.') === '192.168.1.50');
  ok('cache-flush | IN class', ans.readUInt16BE(12 + nameLen + 2) === 0x8001);
}

// ── a live answer ────────────────────────────────────────────────────
console.log('\n— live responder —');
{
  const beacon = await startBeacon('galaxy');
  ok('the beacon binds 5353', beacon !== null && beacon.fqdn === 'galaxy.local');

  if (beacon) {
    const reply = await new Promise(resolve => {
      const client = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      const timer = setTimeout(() => { client.close(); resolve(null); }, 2500);
      client.on('message', buf => { clearTimeout(timer); client.close(); resolve(buf); });
      client.bind(0, '127.0.0.1', () =>
        client.send(query('GALAXY.local', { qu: true }), 5353, '127.0.0.1'));
    });
    ok('a QU query gets a direct answer', reply !== null);
    if (reply) {
      ok('the answer is an authoritative response', reply.readUInt16BE(2) === 0x8400);
      const n = reply.readUInt16BE(6);
      ok('it carries this machine\'s addresses', n >= 1 && n === localIPs().length,
         `${n} vs ${localIPs().length}`);
    } else { fail += 2; }

    // the beacon must ignore names it does not own
    const silence = await new Promise(resolve => {
      const client = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      const timer = setTimeout(() => { client.close(); resolve(true); }, 800);
      client.on('message', () => { clearTimeout(timer); client.close(); resolve(false); });
      client.bind(0, '127.0.0.1', () =>
        client.send(query('printer.local', { qu: true }), 5353, '127.0.0.1'));
    });
    ok('a foreign name gets silence', silence === true);

    beacon.stop();
  }
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
