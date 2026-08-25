// Living Galaxy server — the web API. Everything the portal, forum and admin pages
// talk to, in one dispatcher next to (not inside) the WebSocket router.
//
// Sessions are the same HMAC tickets the game uses, carried in an HttpOnly cookie —
// stateless to verify, nothing stored per-session, and the admin bit inside the
// ticket is re-checked against the account record on every admin call so revoking
// admin actually revokes it. The same account works everywhere: register on the
// portal, fly with it on the boot screen, post with it on the forum.
//
// Auth endpoints are rate-limited per address, because the tunnel put this door on
// the open internet: scrypt is deliberately slow, which protects passwords AND makes
// unthrottled login attempts a cheap way to peg a laptop's CPU.

import { makeTicket, readTicket } from './tickets.js';
import { mailConfig, sendMail } from './mail.js';

const SESSION_TTL = 7 * 24 * 3600;      // a week of not re-typing a passphrase

export function makeApi({ registry, vault, forum, secret, live, webOrigin = null }) {
  const smtp = () => mailConfig(vault);

  // ── per-address throttle for the expensive/abusable endpoints ──────
  const hits = new Map();               // ip -> [timestamps]
  function throttled(ip, max = 20, windowS = 600) {
    const now = Date.now() / 1000;
    const list = (hits.get(ip) || []).filter(t => now - t < windowS);
    list.push(now);
    hits.set(ip, list);
    if (hits.size > 5000) hits.clear(); // bounded, crude, sufficient
    return list.length > max;
  }

  // ── session plumbing ───────────────────────────────────────────────
  function session(req) {
    const m = /(?:^|;\s*)lg_session=([^;]+)/.exec(req.headers.cookie || '');
    const claims = m && readTicket(secret, decodeURIComponent(m[1]));
    if (!claims || claims.s !== 'web') return null;
    const acc = registry.account(claims.user);
    if (!acc) return null;
    return { user: acc.user, admin: !!acc.admin, acc };
  }
  // With the static site on a CDN and the galaxy behind the tunnel, the cookie is
  // cross-site — which browsers only allow as SameSite=None over TLS. Same-origin
  // deployments keep the stricter Lax.
  const sameSite = webOrigin ? 'None; Secure' : 'Lax';
  const cookie = (user, tls) =>
    `lg_session=${encodeURIComponent(makeTicket(secret, { user, s: 'web' }, SESSION_TTL))}; ` +
    `Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${SESSION_TTL}${(tls && !webOrigin) ? '; Secure' : ''}`;
  const clearCookie = 'lg_session=; Path=/; HttpOnly; Max-Age=0';

  async function mailCode(acc, code) {
    const r = await sendMail(smtp(), acc.email,
      'Living Galaxy — verification code',
      `Your verification code is ${code}\n\nEnter it on the portal to verify ${acc.user}.\n` +
      `If you did not register at this galaxy, ignore this.\n`);
    if (r.err) console.log(`verify code for ${acc.user} <${acc.email}>: ${code} (mail: ${r.err} — hand it out from the admin page)`);
    return !r.err;
  }

  /**
   * Handle one request if it is ours. Returns true when handled. `body` is the parsed
   * JSON body (or {}), `send` writes a JSON reply, `ip` is the peer address.
   */
  return async function handle(req, res, { pathname, tls }) {
    if (!pathname.startsWith('/api/')) return false;
    const ip = req.socket.remoteAddress || '?';

    // CORS: only the one origin named at server start, only with a real match. A
    // wildcard with credentials is forbidden by browsers and would be wrong anyway.
    const origin = req.headers.origin;
    const cors = (webOrigin && origin === webOrigin) ? {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      vary: 'origin'
    } : {};
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        ...cors,
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '86400'
      });
      res.end();
      return true;
    }

    const send = (code, obj, extra = {}) => {
      res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors, ...extra });
      res.end(JSON.stringify(obj));
      return true;
    };
    const body = await readJson(req);
    const who = session(req);
    const route = req.method + ' ' + pathname;

    switch (route) {
      // ── identity ───────────────────────────────────────────────────
      case 'POST /api/register': {
        if (throttled(ip)) return send(429, { err: 'slow down' });
        const made = registry.register(body.user, body.pass);
        if (made.err && made.err !== 'call sign taken')
          return send(400, { err: made.err });
        if (made.err) return send(400, { err: 'call sign taken — log in instead' });
        const login = registry.login(body.user, body.pass);
        if (login.err) return send(400, { err: login.err });
        let verifyPending = false;
        if (body.email) {
          const c = registry.issueCode(login.key, String(body.email).trim().slice(0, 120));
          if (c.err) return send(400, { err: c.err });
          verifyPending = true;
          mailCode(registry.account(body.user), c.code);   // fire and forget; fallback logs
        }
        return send(200, { ok: true, user: login.acc.user, verifyPending },
                    { 'set-cookie': cookie(login.acc.user, tls) });
      }

      case 'POST /api/login': {
        if (throttled(ip)) return send(429, { err: 'slow down' });
        const r = registry.login(body.user, body.pass);
        if (r.err) return send(401, { err: r.err });
        return send(200, {
          ok: true, user: r.acc.user, admin: !!r.acc.admin,
          wallet: r.acc.wallet, verified: !!r.acc.verified, email: r.acc.email || null
        }, { 'set-cookie': cookie(r.acc.user, tls) });
      }

      case 'POST /api/logout':
        return send(200, { ok: true }, { 'set-cookie': clearCookie });

      case 'GET /api/me':
        if (!who) return send(200, { guest: true });
        return send(200, {
          user: who.user, admin: who.admin, wallet: who.acc.wallet,
          verified: !!who.acc.verified, email: who.acc.email || null,
          pilots: Object.keys(who.acc.pilots || {})
        });

      case 'POST /api/verify': {
        if (!who) return send(401, { err: 'log in first' });
        const r = registry.verifyCode('accounts/' + who.user.toLowerCase(), body.code);
        return send(r.err ? 400 : 200, r);
      }

      case 'POST /api/resend': {
        if (!who) return send(401, { err: 'log in first' });
        if (throttled(ip, 5)) return send(429, { err: 'slow down' });
        const c = registry.issueCode('accounts/' + who.user.toLowerCase(), body.email);
        if (c.err) return send(400, { err: c.err });
        const mailed = await mailCode(registry.account(who.user), c.code);
        return send(200, { ok: true, mailed });
      }

      // ── forum ──────────────────────────────────────────────────────
      case 'GET /api/forum':
        return send(200, { boards: forum.boards(), me: who ? who.user : null, admin: !!(who && who.admin) });

      case 'GET /api/forum/thread': {
        const t = forum.thread(new URL(req.url, 'http://x').searchParams.get('id'));
        return t ? send(200, { thread: t, me: who ? who.user : null, admin: !!(who && who.admin) })
                 : send(404, { err: 'no such thread' });
      }

      case 'POST /api/forum/thread': {
        if (!who) return send(401, { err: 'log in to post' });
        if (throttled(ip, 30)) return send(429, { err: 'slow down' });
        const r = forum.post(body.board, body.title, body.body, who.user, who.admin);
        return send(r.err ? 400 : 200, r);
      }

      case 'POST /api/forum/reply': {
        if (!who) return send(401, { err: 'log in to post' });
        if (throttled(ip, 30)) return send(429, { err: 'slow down' });
        const r = forum.reply(body.id, body.body, who.user, who.admin);
        return send(r.err ? 400 : 200, r);
      }

      case 'POST /api/forum/mod': {
        if (!who || !who.admin) return send(403, { err: 'admin only' });
        const r = forum.moderate(body.id, body.op);
        return send(r.err ? 400 : 200, r);
      }

      // ── admin ──────────────────────────────────────────────────────
      case 'GET /api/admin': {
        if (!who || !who.admin) return send(403, { err: 'admin only' });
        const pending = [];
        for (const k of vault.keys('accounts')) {
          const a = vault.get(k);
          if (a && a.code) pending.push({ user: a.user, email: a.email, code: a.code });
        }
        return send(200, {
          ...live(),                       // online pilots, systems, suspects — from main.js
          smtp: !!smtp(), pending,
          accounts: vault.keys('accounts').length
        });
      }
    }
    return send(404, { err: 'no such endpoint' });
  };
}

function readJson(req) {
  return new Promise(resolve => {
    if (req.method !== 'POST') return resolve({});
    let data = '';
    req.on('data', c => { data += c; if (data.length > 64 * 1024) { req.destroy(); resolve({}); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
