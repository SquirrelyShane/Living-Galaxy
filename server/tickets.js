// Living Galaxy server — session tickets.
//
// The old relay's resume token was `"{id}-{ms%1000000}"` — guessable in one loop by
// anyone on the LAN, which mattered less when a stolen slot got you a position and
// nothing else. Now a slot can be attached to an account with a wallet, so the token
// has to actually be a credential.
//
// A ticket is `payload.signature`: base64url JSON, HMAC-SHA256 under a per-boot (or
// persisted) server secret. Stateless to verify, expiring, and unforgeable without the
// secret. This is the small end of the gateway/ticket model a sharded deployment would
// use — the same ticket format would survive the server splitting into processes.
//
// Pure functions of (secret, data, now); the suite beats on expiry and forgery directly.

import crypto from 'node:crypto';

const b64u = buf => Buffer.from(buf).toString('base64url');

function sign(secret, body) {
  return crypto.createHmac('sha256', secret).update(body).digest('base64url');
}

/** Make a ticket carrying `claims`, valid for `ttl` seconds from `now` (unix seconds). */
export function makeTicket(secret, claims, ttl, now = Date.now() / 1000) {
  const body = b64u(JSON.stringify({ ...claims, exp: Math.floor(now + ttl) }));
  return body + '.' + sign(secret, body);
}

/**
 * Verify and unpack. Returns the claims object, or null for anything wrong — bad shape,
 * bad signature, expired. One return path for all failures on purpose: the caller never
 * branches on *why* a ticket failed, and the wire never learns either.
 */
export function readTicket(secret, ticket, now = Date.now() / 1000) {
  if (typeof ticket !== 'string') return null;
  const dot = ticket.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = ticket.slice(0, dot), sig = ticket.slice(dot + 1);
  const want = sign(secret, body);
  const a = Buffer.from(sig), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let claims;
  try { claims = JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
  if (typeof claims.exp !== 'number' || claims.exp < now) return null;
  return claims;
}

/** A fresh server secret. Persisted in the vault so tickets survive a restart. */
export const newSecret = () => crypto.randomBytes(32).toString('hex');
