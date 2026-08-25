// Living Galaxy server — the beacon. A name on the door instead of an IP address.
//
// Players should type `https://galaxy.local:8765`, not `https://192.168.1.escapes-me`.
// The clean way to hand a custom name to every phone and laptop on a LAN — with no router
// settings, no hosts-file edits on each device, nothing installed anywhere — is multicast
// DNS: the standard every OS already uses to find printers. When a device asks the local
// network "who is galaxy.local?", this file answers with the laptop's addresses. iOS,
// macOS, Windows 10+, Android 12+ and every desktop Linux resolve .local out of the box;
// the printed IP fallback covers the stragglers.
//
// This is a *responder*, not a full mDNS stack, and stdlib-only like everything else in
// server/: one UDP socket on 5353, parse the question, answer the one name we own. The
// DNS packet maths is pure functions of buffers (parseQuery / buildAnswer) so the suite
// can beat on real packet bytes without a network. The socket part degrades politely: a
// machine that will not share port 5353 gets a logged warning and a galaxy that still
// works by IP — a beacon is a convenience, never a dependency.

import dgram from 'node:dgram';
import os from 'node:os';

const MCAST = '224.0.0.251';
const PORT = 5353;

// ── pure DNS packet maths ────────────────────────────────────────────

/**
 * Parse the questions out of a DNS packet. Returns [{name, type, unicast}] — or [] for
 * anything that is not a plain query: responses, empty packets, and names using
 * compression pointers (queries put the first name inline; a pointer here means a packet
 * shape we have no business guessing at).
 */
export function parseQuery(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return [];
  const flags = buf.readUInt16BE(2);
  if (flags & 0x8000) return [];                        // QR=1 — a response, not a question
  const qd = buf.readUInt16BE(4);
  const out = [];
  let off = 12;
  for (let q = 0; q < qd && q < 8; q++) {
    const labels = [];
    for (;;) {
      if (off >= buf.length) return out;
      const len = buf[off];
      if (len === 0) { off++; break; }
      if (len & 0xc0) return out;                        // compression pointer — bail politely
      if (off + 1 + len > buf.length) return out;
      labels.push(buf.toString('utf8', off + 1, off + 1 + len));
      off += 1 + len;
    }
    if (off + 4 > buf.length) return out;
    const type = buf.readUInt16BE(off);
    const qclass = buf.readUInt16BE(off + 2);
    off += 4;
    out.push({
      name: labels.join('.'),
      type,
      unicast: (qclass & 0x8000) !== 0                   // QU bit — asker wants a direct reply
    });
  }
  return out;
}

/** Case-insensitive — DNS names are, and Android asks in the case it feels like. */
export const sameName = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

/**
 * Build an mDNS response: one A record per address for `name`. ID 0 and the cache-flush
 * bit are what RFC 6762 wants from a multicast answer; TTL 120 keeps a stale record from
 * outliving a DHCP lease change by much.
 */
export function buildAnswer(name, ips, ttl = 120) {
  const parts = String(name).split('.').filter(Boolean);
  const nameBuf = Buffer.concat([
    ...parts.map(p => Buffer.concat([Buffer.from([p.length]), Buffer.from(p)])),
    Buffer.from([0])
  ]);
  const head = Buffer.alloc(12);
  head.writeUInt16BE(0, 0);                              // ID — always 0 in mDNS responses
  head.writeUInt16BE(0x8400, 2);                         // QR=1, AA=1
  head.writeUInt16BE(ips.length, 6);                     // ANCOUNT
  const answers = ips.map(ip => {
    const rr = Buffer.alloc(10);
    rr.writeUInt16BE(1, 0);                              // TYPE A
    rr.writeUInt16BE(0x8001, 2);                         // cache-flush | IN
    rr.writeUInt32BE(ttl, 4);
    rr.writeUInt16BE(4, 8);                              // RDLENGTH
    return Buffer.concat([nameBuf, rr, Buffer.from(ip.split('.').map(Number))]);
  });
  return Buffer.concat([head, ...answers]);
}

/** Every LAN IPv4 this machine has — the addresses the name should resolve to. */
export function localIPs() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces()))
    for (const i of list || [])
      if (i.family === 'IPv4' && !i.internal) out.push(i.address);
  return out;
}

// ── the responder ────────────────────────────────────────────────────

/**
 * Answer for `<name>.local` until stopped. `name` is the bare label ("galaxy").
 * Returns {fqdn, stop} on success or null when the port cannot be shared — the caller
 * logs it and carries on, because the galaxy must never fail to start over a nicety.
 */
export function startBeacon(name, log = () => {}) {
  const fqdn = `${String(name).toLowerCase()}.local`;
  const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  let up = false;

  sock.on('error', e => {
    if (!up) return;                                     // bind errors surface via the promise
    log(`beacon: ${e.message} — continuing without it`);
    try { sock.close(); } catch { /* already down */ }
  });

  sock.on('message', (buf, rinfo) => {
    const qs = parseQuery(buf);
    if (!qs.some(q => (q.type === 1 || q.type === 255) && sameName(q.name, fqdn))) return;
    const ips = localIPs();
    if (!ips.length) return;
    const reply = buildAnswer(fqdn, ips);
    const wantsUnicast = qs.some(q => q.unicast && sameName(q.name, fqdn));
    // Multicast is the norm (everyone's cache learns the name); a QU question also gets
    // the direct copy it asked for — some phone resolvers only listen for that one.
    sock.send(reply, PORT, MCAST, () => {});
    if (wantsUnicast) sock.send(reply, rinfo.port, rinfo.address, () => {});
  });

  return new Promise(resolve => {
    sock.once('error', () => resolve(null));
    sock.bind(PORT, () => {
      up = true;
      try {
        sock.addMembership(MCAST);
        sock.setMulticastTTL(255);
      } catch (e) {
        // Bound but cannot join the group — as good as dead for mDNS.
        try { sock.close(); } catch { /* best effort */ }
        return resolve(null);
      }
      resolve({ fqdn, stop: () => { try { sock.close(); } catch { /* down */ } } });
    });
  });
}
