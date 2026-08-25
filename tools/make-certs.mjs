#!/usr/bin/env node
// Living Galaxy — reissue the server certificate by hand.
//
//     node tools/make-certs.mjs                    # beacon name + localhost + every LAN IP
//     node tools/make-certs.mjs 192.168.1.50 vpn.example
//     GALAXY_NAME=nexis node tools/make-certs.mjs
//
// Normally nobody runs this: the server issues and refreshes its own certificate at boot
// (server/certs.js, pure Node — the openssl script this replaced failed half-way on the
// first real Windows machine and left the exact broken state that crashed the server).
// This wrapper exists for the one manual case — adding names the server cannot guess,
// like a VPN address or a hostname players reach you by from another subnet.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeCert, ensureCerts } from '../server/certs.js';
import fs from 'node:fs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'galaxy-data', 'certs');
const NAME = (process.env.GALAXY_NAME || 'galaxy').replace(/[^a-zA-Z0-9-]/g, '') || 'galaxy';
const extra = process.argv.slice(2);

if (!extra.length) {
  // The standard set — same call the server makes at boot.
  const r = ensureCerts(DIR, NAME, m => console.log(m));
  console.log(r ? `certs ready in ${DIR}` : 'FAILED — see above');
  process.exit(r ? 0 : 1);
}

// Extra names asked for: build the full set by hand.
import('node:os').then(({ default: os }) => {
  const ips = ['127.0.0.1'];
  for (const list of Object.values(os.networkInterfaces()))
    for (const i of list || []) if (i.family === 'IPv4' && !i.internal) ips.push(i.address);
  const dns = [`${NAME}.local`, 'localhost'];
  for (const a of extra) (/^[0-9.]+$/.test(a) ? ips : dns).push(a);

  fs.mkdirSync(DIR, { recursive: true });
  const { certPem, keyPem } = makeCert(dns, ips);
  fs.writeFileSync(path.join(DIR, 'server.key'), keyPem, { mode: 0o600 });
  fs.writeFileSync(path.join(DIR, 'server.crt'), certPem);
  console.log(`issued for ${dns.join(', ')} + ${ips.join(', ')}`);
  console.log(`certs ready in ${DIR} — restart the server.`);
});
