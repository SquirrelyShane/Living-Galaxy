// Living Galaxy server — the galaxy signs its own papers.
//
// v1.03.01 shipped certificate generation as a bash script around openssl, which was two
// dependencies the rest of the server carefully has zero of — and on the first real
// Windows laptop, both were missing and the galaxy ran plain. That is exactly the failure
// the stdlib-only rule exists to prevent, so this file removes the rule's one exception:
// an X.509 certificate is just DER bytes, DER is just a handful of tag-length-value
// encodings, and node:crypto can make the keypair and sign the result. No openssl, no
// bash, no difference between the laptop that has Git installed and the one that does not.
//
// What gets made: ONE self-signed certificate (CA:TRUE, serverAuth, SANs for the beacon
// name, localhost, and every LAN address) — not a CA-plus-leaf chain. For a LAN galaxy
// the chain buys nothing: players either accept the browser warning once or import this
// one file as trusted, and both flows work identically with a single certificate while
// being half the moving parts.
//
// The encoder below is the minimal honest subset of ASN.1 this one certificate shape
// needs, not a library. Every helper is a pure function of buffers, and the suite proves
// the output three ways: node:crypto's own X509Certificate parser accepts it, checkHost /
// checkIP match the SANs, and a real TLS handshake completes against an https server
// using it.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ── DER primitives ───────────────────────────────────────────────────

function len(n) {
  if (n < 0x80) return Buffer.from([n]);
  const bytes = [];
  while (n > 0) { bytes.unshift(n & 0xff); n >>= 8; }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}
const tlv = (tag, body) => Buffer.concat([Buffer.from([tag]), len(body.length), body]);

const SEQ = (...parts) => tlv(0x30, Buffer.concat(parts));
const SET = (...parts) => tlv(0x31, Buffer.concat(parts));
const INT = buf => {
  // INTEGER is signed: a leading high bit needs a 0x00 so it stays positive.
  let b = Buffer.isBuffer(buf) ? buf : Buffer.from([buf]);
  while (b.length > 1 && b[0] === 0 && !(b[1] & 0x80)) b = b.subarray(1);
  return tlv(0x02, (b[0] & 0x80) ? Buffer.concat([Buffer.from([0]), b]) : b);
};
const BITSTR = buf => tlv(0x03, Buffer.concat([Buffer.from([0]), buf]));
const OCTETS = buf => tlv(0x04, buf);
const BOOL_TRUE = Buffer.from([0x01, 0x01, 0xff]);
const UTF8 = s => tlv(0x0c, Buffer.from(s, 'utf8'));
const IA5 = s => tlv(0x16, Buffer.from(s, 'ascii'));
const CTX = (n, body, constructed = true) => tlv((constructed ? 0xa0 : 0x80) | n, body);

function OID(dotted) {
  const parts = dotted.split('.').map(Number);
  const bytes = [parts[0] * 40 + parts[1]];
  for (const p of parts.slice(2)) {
    const enc = [];
    let v = p;
    do { enc.unshift(v & 0x7f); v >>= 7; } while (v > 0);
    for (let i = 0; i < enc.length - 1; i++) enc[i] |= 0x80;
    bytes.push(...enc);
  }
  return tlv(0x06, Buffer.from(bytes));
}

const utcTime = d => tlv(0x17, Buffer.from(
  d.toISOString().replace(/[-:T]/g, '').slice(2, 14) + 'Z'));

// ── the certificate ──────────────────────────────────────────────────

const OIDS = {
  ecdsaSha256: '1.2.840.10045.4.3.2',
  commonName: '2.5.4.3',
  basicConstraints: '2.5.29.19',
  subjectAltName: '2.5.29.17',
  extKeyUsage: '2.5.29.37',
  serverAuth: '',
  keyUsage: '2.5.29.15'
};

const rdnCN = cn => SEQ(SET(SEQ(OID(OIDS.commonName), UTF8(cn))));

const extension = (oid, critical, innerDer) =>
  SEQ(OID(oid), ...(critical ? [BOOL_TRUE] : []), OCTETS(innerDer));

function sanExtension(dnsNames, ips) {
  const names = [
    ...dnsNames.map(d => CTX(2, Buffer.from(d, 'ascii'), false)),          // dNSName
    ...ips.map(ip => CTX(7, Buffer.from(ip.split('.').map(Number)), false)) // iPAddress
  ];
  return extension(OIDS.subjectAltName, false, SEQ(...names));
}

/**
 * Make a self-signed server certificate covering `dnsNames` + `ips`.
 * Returns {certPem, keyPem}. ECDSA P-256 — small keys, quick handshakes, and every
 * browser and OS this game can reach has trusted it for a decade.
 */
export function makeCert(dnsNames, ips, { cn = 'Living Galaxy', days = 825, now = new Date() } = {}) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const algId = SEQ(OID(OIDS.ecdsaSha256));
  const name = rdnCN(cn);
  const notBefore = new Date(now.getTime() - 3600_000);            // an hour of clock skew grace
  const notAfter = new Date(now.getTime() + days * 86400_000);

  const tbs = SEQ(
    CTX(0, INT(2)),                                                // version v3
    INT(crypto.randomBytes(12)),                                   // serial — random, positive
    algId,
    name,                                                          // issuer = subject: self-signed
    SEQ(utcTime(notBefore), utcTime(notAfter)),
    name,
    spki,
    CTX(3, SEQ(
      // CA:TRUE so the same single file can be imported as a trusted root — the whole
      // reason there is no separate CA. keyCertSign(2)+digitalSignature(0) to match.
      extension(OIDS.basicConstraints, true, SEQ(BOOL_TRUE)),
      extension(OIDS.keyUsage, true, BITSTR(Buffer.from([0xa4]))), // sign, certSign, keyAgree
      extension(OIDS.extKeyUsage, false, SEQ(OID(OIDS.serverAuth))),
      sanExtension(dnsNames, ips)
    ))
  );

  const signature = crypto.sign('sha256', tbs, privateKey);        // DER ECDSA sig
  const cert = SEQ(tbs, algId, BITSTR(signature));

  const pem = (label, der) =>
    `-----BEGIN ${label}-----\n` +
    der.toString('base64').replace(/(.{64})/g, '$1\n').trimEnd() +
    `\n-----END ${label}-----\n`;

  return {
    certPem: pem('CERTIFICATE', cert),
    keyPem: privateKey.export({ type: 'pkcs8', format: 'pem' })
  };
}

// ── keeping the papers current ───────────────────────────────────────

const localIPv4s = () => {
  const out = [];
  for (const list of Object.values(os.networkInterfaces()))
    for (const i of list || []) if (i.family === 'IPv4' && !i.internal) out.push(i.address);
  return out;
};

/**
 * Ensure `dir` holds a certificate covering `name`.local, localhost and every current
 * LAN address — generating on first run and REgenerating when the laptop's address
 * changed since last time (the commonest way a working galaxy stops being reachable).
 * A regenerated self-signed cert costs each player one more "accept" click, which is
 * cheaper than a name that stopped resolving to a covered address. Returns
 * {key, cert, made} for https, or null only if writing failed.
 */
export function ensureCerts(dir, name, log = () => {}) {
  const certPath = path.join(dir, 'server.crt');
  const keyPath = path.join(dir, 'server.key');
  const wanted = {
    dns: [`${String(name).toLowerCase()}.local`, 'localhost'],
    ips: ['127.0.0.1', ...localIPv4s()]
  };

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    try {
      const x = new crypto.X509Certificate(fs.readFileSync(certPath));
      const covered = [...wanted.dns.map(d => !!x.checkHost(d)),
                       ...wanted.ips.map(ip => !!x.checkIP(ip))].every(Boolean);
      const fresh = new Date(x.validTo) > new Date(Date.now() + 86400_000);
      if (covered && fresh) return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath), made: false };
      log(`certificate no longer covers this machine (${covered ? 'expiring' : 'address or name changed'}) — reissuing`);
    } catch {
      log('unreadable certificate — reissuing');
    }
  }

  try {
    fs.mkdirSync(dir, { recursive: true });
    // Sweep the leavings of the retired openssl flow (a ca.key with no ca.crt, a
    // server.key with no server.crt — exactly the half-state a failed script leaves,
    // and exactly what crashed the first Windows deployment). Anything this module
    // did not issue is noise here now.
    for (const f of ['ca.key', 'ca.crt', 'ca.srl', 'server.csr'])
      try { fs.rmSync(path.join(dir, f), { force: true }); } catch { /* fine */ }
    const { certPem, keyPem } = makeCert(wanted.dns, wanted.ips);
    // tmp + rename, same discipline as the vault: a power cut must not leave half a key.
    for (const [p, data] of [[keyPath, keyPem], [certPath, certPem]]) {
      fs.writeFileSync(p + '.tmp', data, { mode: 0o600 });
      fs.renameSync(p + '.tmp', p);
    }
    log(`issued a certificate for ${wanted.dns.join(', ')} + ${wanted.ips.length} address(es)`);
    return { key: Buffer.from(keyPem), cert: Buffer.from(certPem), made: true };
  } catch (e) {
    log(`could not write certificates: ${e.message}`);
    return null;
  }
}
