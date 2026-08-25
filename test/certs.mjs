// The galaxy's self-issued papers: the pure-Node X.509 generator, judged by the
// strictest parser in reach (node:crypto's X509Certificate, which is OpenSSL's own
// parser under the hood) and then by an actual TLS handshake. This suite exists because
// the openssl-script flow it replaced failed HALF-WAY on the first real Windows machine
// — a server.key with no server.crt — and the server crashed reading the missing half.
// Every regression here is one of those states.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import { X509Certificate } from 'node:crypto';
import { makeCert, ensureCerts } from '../server/certs.js';

let pass = 0, fail = 0;
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n + (e ? ' — ' + e : ''))); };

// ── the certificate itself ───────────────────────────────────────────
console.log('\n— makeCert —');
const { certPem, keyPem } = makeCert(['galaxy.local', 'localhost'], ['127.0.0.1', '192.168.1.50']);
{
  let x = null;
  try { x = new X509Certificate(certPem); } catch (e) { ok('the DER parses at all', false, e.message); }
  if (x) {
    ok('the DER parses at all', true);
    ok('subject and issuer agree (self-signed)', x.subject === x.issuer && /Living Galaxy/.test(x.subject));
    ok('signature verifies with its own key', x.verify(x.publicKey) === true);
    ok('CA flag set (importable as a trusted root)', x.ca === true);
    ok('every DNS name is covered', !!x.checkHost('galaxy.local') && !!x.checkHost('localhost'));
    ok('names are matched, not prefixed', !x.checkHost('galaxy.localhost'));
    ok('every IP is covered', !!x.checkIP('127.0.0.1') && !!x.checkIP('192.168.1.50'));
    ok('an uncovered IP is refused', !x.checkIP('10.9.9.9'));
    const validFor = (new Date(x.validTo) - new Date()) / 86400_000;
    ok('validity is ~825 days', validFor > 800 && validFor < 830, String(validFor));
    ok('not-before absorbs clock skew', new Date(x.validFrom) < new Date());
    ok('the key is PKCS8 PEM', /BEGIN PRIVATE KEY/.test(keyPem));
    ok('two certs differ (serial, key)', new X509Certificate(
       makeCert(['galaxy.local'], ['127.0.0.1']).certPem).serialNumber !== x.serialNumber);
  } else { fail += 11; }
}

// ── a real handshake ─────────────────────────────────────────────────
console.log('\n— TLS handshake —');
await new Promise(resolve => {
  const srv = https.createServer({ key: keyPem, cert: certPem }, (req, res) => {
    res.writeHead(200); res.end('lit');
  });
  srv.listen(0, '127.0.0.1', () => {
    const req = https.get({
      host: '127.0.0.1', port: srv.address().port, path: '/',
      rejectUnauthorized: false
    }, res => {
      // Read the peer cert now — by 'end' the socket has already been detached.
      const peer = res.socket.getPeerCertificate();
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        ok('an https server accepts the pair and answers', res.statusCode === 200 && body === 'lit');
        ok('the wire cert carries the SANs', /galaxy\.local/.test((peer && peer.subjectaltname) || ''),
           peer && peer.subjectaltname);
        srv.close(resolve);
      });
    });
    req.on('error', e => { ok('an https server accepts the pair and answers', false, e.message); srv.close(resolve); });
  });
  srv.on('error', e => { ok('an https server accepts the pair and answers', false, e.message); resolve(); });
});

// ── ensureCerts lifecycle ────────────────────────────────────────────
console.log('\n— ensureCerts —');
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lgc-'));

  const first = ensureCerts(dir, 'galaxy');
  ok('first run issues', first !== null && first.made === true);
  ok('both halves exist as a pair', fs.existsSync(path.join(dir, 'server.crt')) &&
     fs.existsSync(path.join(dir, 'server.key')));

  const second = ensureCerts(dir, 'galaxy');
  ok('a covering cert is kept, not churned', second.made === false &&
     second.cert.equals(first.cert));

  // The Windows failure state: a key with no certificate. Must reissue, not crash.
  fs.rmSync(path.join(dir, 'server.crt'));
  fs.writeFileSync(path.join(dir, 'ca.key'), 'openssl leavings');
  const healed = ensureCerts(dir, 'galaxy');
  ok('a half-state heals instead of crashing', healed !== null && healed.made === true);
  ok('foreign leavings are swept', !fs.existsSync(path.join(dir, 'ca.key')));

  // A cert that no longer covers the machine (different name) must be reissued.
  const renamed = ensureCerts(dir, 'nexis');
  ok('a rename reissues', renamed.made === true);
  ok('and the new name is covered',
     !!new X509Certificate(fs.readFileSync(path.join(dir, 'server.crt'))).checkHost('nexis.local'));

  // Garbage on disk where a cert should be: reissue, never crash.
  fs.writeFileSync(path.join(dir, 'server.crt'), 'not a certificate');
  ok('corruption heals instead of crashing', ensureCerts(dir, 'nexis').made === true);

  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
