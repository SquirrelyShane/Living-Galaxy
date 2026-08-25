// Living Galaxy server — outbound mail, for account verification.
//
// A home server has no mail infrastructure, and pretending otherwise is how "email
// auth" becomes a form that lies. So this is honest on both paths:
//
//   * With SMTP configured (env SMTP_HOST / SMTP_USER / SMTP_PASS / SMTP_FROM, or a
//     sealed `smtp` record in the vault), verification codes are actually mailed —
//     a minimal SMTP-over-TLS client, stdlib only, speaking to port 465 the way every
//     relay (Gmail app password, Mailgun, Zoho, ...) expects.
//   * Without it, `sendMail` reports "not configured", the caller keeps the code, and
//     the admin panel shows it — the operator hands codes out by hand. Small-galaxy
//     scale, zero deception.
//
// Not a general mail client: one recipient, plain text, no attachments, no retries.
// The SMTP dialogue is a lockstep read-reply loop because that is what SMTP is.

import tls from 'node:tls';

export function mailConfig(vault) {
  const env = process.env;
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    return {
      host: env.SMTP_HOST, port: parseInt(env.SMTP_PORT || '465', 10),
      user: env.SMTP_USER, pass: env.SMTP_PASS,
      from: env.SMTP_FROM || env.SMTP_USER
    };
  }
  const stored = vault && vault.get('smtp');
  return (stored && stored.host && stored.user && stored.pass)
    ? { port: 465, from: stored.user, ...stored }
    : null;
}

/**
 * Send one plain-text mail. Resolves {ok:true} or {err} — never throws, never hangs
 * (hard 15 s ceiling). `cfg` from mailConfig(); null cfg short-circuits to the honest
 * "not configured" answer.
 */
export function sendMail(cfg, to, subject, text) {
  if (!cfg) return Promise.resolve({ err: 'smtp not configured' });
  return new Promise(resolve => {
    const sock = tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host });
    let buf = '', step = 0, done = false;
    const finish = r => { if (!done) { done = true; try { sock.destroy(); } catch { } resolve(r); } };
    const timer = setTimeout(() => finish({ err: 'smtp timeout' }), 15_000);
    const b64 = s => Buffer.from(s).toString('base64');

    // The message body. Dot-stuffing per RFC 5321 — a line that is just "." would end
    // the DATA section early and truncate every code that happened to follow one.
    const body =
      `From: Living Galaxy <${cfg.from}>\r\nTo: <${to}>\r\nSubject: ${subject.replace(/[\r\n]/g, ' ')}\r\n` +
      `MIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n` +
      text.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..') + '\r\n.\r\n';

    // Each entry: what to send when the previous reply was good.
    const script = [
      { expect: /^220/, send: () => `EHLO living-galaxy\r\n` },
      { expect: /^250/, send: () => `AUTH LOGIN\r\n` },
      { expect: /^334/, send: () => b64(cfg.user) + '\r\n' },
      { expect: /^334/, send: () => b64(cfg.pass) + '\r\n' },
      { expect: /^235/, send: () => `MAIL FROM:<${cfg.from}>\r\n` },
      { expect: /^250/, send: () => `RCPT TO:<${to}>\r\n` },
      { expect: /^250/, send: () => `DATA\r\n` },
      { expect: /^354/, send: () => body },
      { expect: /^250/, send: () => `QUIT\r\n` },
      { expect: /^221|^250/, send: null }                    // done
    ];

    sock.on('data', d => {
      buf += d.toString();
      // SMTP multiline replies end with "NNN " (space, not dash) — wait for that.
      if (!/^\d{3} [^]*\r\n$/m.test(buf) && !/^\d{3} /.test(buf)) return;
      const reply = buf; buf = '';
      const s = script[step++];
      if (!s) return;
      if (!s.expect.test(reply)) {
        clearTimeout(timer);
        return finish({ err: `smtp said: ${reply.split('\r\n')[0]}` });
      }
      if (!s.send) { clearTimeout(timer); return finish({ ok: true }); }
      sock.write(s.send());
    });
    sock.on('error', e => { clearTimeout(timer); finish({ err: e.message }); });
  });
}
