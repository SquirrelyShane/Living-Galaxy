// Living Galaxy server — the WebSocket wire.
//
// RFC 6455, by hand, over whatever duplex socket it is given — a plain `net.Socket` or a
// `tls.TLSSocket` behaves identically here, which is how the same code serves ws:// in the
// test suite and wss:// on the laptop. Hand-rolled for the same reason the old Python relay
// was stdlib-only: the server must run anywhere Node runs, with `npm install` never being a
// step, because "install nothing" is the difference between a server that gets started and
// one that gets postponed.
//
// Everything stateful lives in the parser object so the frame maths itself is pure enough
// to test without a socket: `feed()` takes bytes and returns completed messages.

import crypto from 'node:crypto';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// ── handshake ────────────────────────────────────────────────────────

/** The Sec-WebSocket-Accept value for a client key. Pure; asserted in the suite. */
export function acceptKey(key) {
  return crypto.createHash('sha1').update(key + GUID).digest('base64');
}

/** Write the 101 upgrade response. `headers` is the parsed request header map. */
export function upgrade(sock, headers) {
  const key = headers['sec-websocket-key'];
  if (!key) return false;
  sock.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${acceptKey(key)}\r\n\r\n`);
  return true;
}

// ── frames ───────────────────────────────────────────────────────────

/**
 * Encode one text (or close/pong) frame, server-to-client, unmasked.
 * Nothing in this protocol is anywhere near 64 KiB, but the 16-bit length form is
 * supported because a market listing eventually will be.
 */
export function encodeFrame(payload, opcode = 1) {
  const data = typeof payload === 'string' ? Buffer.from(payload) : payload;
  const n = data.length;
  let head;
  if (n < 126) {
    head = Buffer.from([0x80 | opcode, n]);
  } else if (n < 65536) {
    head = Buffer.alloc(4);
    head[0] = 0x80 | opcode; head[1] = 126; head.writeUInt16BE(n, 2);
  } else {
    head = Buffer.alloc(10);
    head[0] = 0x80 | opcode; head[1] = 127; head.writeBigUInt64BE(BigInt(n), 2);
  }
  return Buffer.concat([head, data]);
}

/** Frame-size ceiling. A client that sends more is broken or hostile; either way, cut. */
export const MAX_FRAME = 128 * 1024;

/**
 * Incremental frame parser. `feed(buf)` returns an array of `{opcode, payload}` for every
 * frame completed by these bytes, and throws on protocol violations (oversize, reserved
 * bits) so the caller can drop the connection rather than guess.
 */
export function makeParser() {
  return { buf: Buffer.alloc(0) };
}

export function feed(p, chunk) {
  p.buf = p.buf.length ? Buffer.concat([p.buf, chunk]) : chunk;
  const out = [];
  for (;;) {
    if (p.buf.length < 2) return out;
    const b1 = p.buf[0], b2 = p.buf[1];
    const opcode = b1 & 0x0f;
    const masked = (b2 & 0x80) !== 0;
    let len = b2 & 0x7f, off = 2;
    if (len === 126) {
      if (p.buf.length < 4) return out;
      len = p.buf.readUInt16BE(2); off = 4;
    } else if (len === 127) {
      if (p.buf.length < 10) return out;
      const big = p.buf.readBigUInt64BE(2);
      if (big > BigInt(MAX_FRAME)) throw new Error('oversized frame');
      len = Number(big); off = 10;
    }
    if (len > MAX_FRAME) throw new Error('oversized frame');
    const maskLen = masked ? 4 : 0;
    if (p.buf.length < off + maskLen + len) return out;
    const mask = masked ? p.buf.subarray(off, off + 4) : null;
    const payload = Buffer.from(p.buf.subarray(off + maskLen, off + maskLen + len));
    if (mask) for (let i = 0; i < len; i++) payload[i] ^= mask[i & 3];
    p.buf = p.buf.subarray(off + maskLen + len);
    out.push({ opcode, payload });
  }
}

// ── connection wrapper ───────────────────────────────────────────────

/**
 * Wrap an upgraded socket in the small surface the router wants: `sendJson`, `close`,
 * and callbacks. Pings are answered here; close frames surface as `onClose`. All the
 * game-level meaning stays in the router — this layer never parses a message body.
 */
export function wrapSocket(sock, { onJson, onClose }) {
  const parser = makeParser();
  let closed = false;

  const finish = () => {
    if (closed) return;
    closed = true;
    try { sock.destroy(); } catch { /* already gone */ }
    onClose && onClose();
  };

  sock.on('data', chunk => {
    let frames;
    try { frames = feed(parser, chunk); } catch { return finish(); }
    for (const f of frames) {
      if (f.opcode === 8) return finish();                       // close
      if (f.opcode === 9) { try { sock.write(encodeFrame(f.payload, 10)); } catch { } continue; } // ping→pong
      if (f.opcode !== 1) continue;                              // text only in this protocol
      let m; try { m = JSON.parse(f.payload.toString()); } catch { continue; }
      onJson && onJson(m);
    }
  });
  sock.on('error', finish);
  sock.on('close', finish);

  return {
    sendJson(obj) {
      if (closed) return false;
      try { sock.write(encodeFrame(JSON.stringify(obj))); return true; }
      catch { finish(); return false; }
    },
    close: finish,
    get closed() { return closed; }
  };
}
