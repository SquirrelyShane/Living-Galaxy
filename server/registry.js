// Living Galaxy server — the registry: accounts, pilots, the wallet, and the world's
// persistent differences from its seed.
//
// Three kinds of record, all in the vault:
//
//   accounts/<user>    — salted scrypt hash, wallet balance, the pilots flown under it.
//                        An account is optional: an anonymous hello still flies, exactly
//                        as before, it just persists nothing. Registering is what turns
//                        "a connection" into "a pilot the galaxy remembers".
//   deltas/<sys>       — the append-only list of ways system <sys> differs from its seed.
//                        This is the only world state the server stores, and it is the
//                        reason a million-system galaxy fits on a laptop: the static
//                        universe is a seed, and the data set grows with what players
//                        *did*, not with what exists.
//   server             — galaxy seed, accumulated world age, the ticket secret.
//
// The wallet lives here and nowhere else. Credits banked with the galaxy survive a wiped
// browser, a new phone, a different machine — and no message from a client ever *sets* a
// balance; they ask to deposit or withdraw and the ledger answers.

import { hashSecret, secretMatches } from './vault.js';
import crypto from 'node:crypto';

const NAME_RE = /^[a-zA-Z0-9_.-]{2,24}$/;

export function makeRegistry(vault) {
  return {
    vault,

    // ── accounts ─────────────────────────────────────────────────────

    /** Create. Returns {ok} or {err} — messages are for humans on the boot screen. */
    register(user, pass) {
      if (!NAME_RE.test(String(user || ''))) return { err: 'call sign must be 2–24 plain characters' };
      if (String(pass || '').length < 4) return { err: 'passphrase too short' };
      const k = 'accounts/' + user.toLowerCase();
      if (vault.get(k)) return { err: 'call sign taken' };
      const salt = crypto.randomBytes(16).toString('hex');
      vault.put(k, {
        user, salt,
        hash: hashSecret(pass, salt).toString('hex'),
        wallet: 0, created: Date.now(), pilots: {}
      });
      return { ok: true };
    },

    login(user, pass) {
      const k = 'accounts/' + String(user || '').toLowerCase();
      const acc = vault.get(k);
      if (!acc || !acc.salt || !acc.hash) return { err: 'unknown call sign' };
      if (!secretMatches(pass, acc.salt, Buffer.from(acc.hash, 'hex')))
        return { err: 'wrong passphrase' };
      return { ok: true, acc, key: k };
    },

    /** Merge-and-save one pilot's parked state under its account. */
    parkPilot(accKey, pilotName, state, sys) {
      const acc = vault.get(accKey);
      if (!acc) return;
      acc.pilots[pilotName] = { state: state || null, sys: sys ?? null, seen: Date.now() };
      vault.put(accKey, acc);
    },

    // ── the wallet ───────────────────────────────────────────────────
    // Deposits are clamped per call rather than trusted: the client is a rendering and
    // input device that occasionally lies, and a lie should cost it a rejected message,
    // not mint credits.

    bank(accKey, op, amt) {
      const acc = vault.get(accKey);
      if (!acc) return { err: 'no account' };
      amt = Math.floor(Number(amt) || 0);
      if (op === 'balance') return { ok: true, wallet: acc.wallet };
      if (amt <= 0 || amt > 1e9) return { err: 'bad amount' };
      if (op === 'deposit') acc.wallet += amt;
      else if (op === 'withdraw') {
        if (acc.wallet < amt) return { err: 'insufficient funds' };
        acc.wallet -= amt;
      } else return { err: 'bad op' };
      vault.put(accKey, acc);
      return { ok: true, wallet: acc.wallet, moved: amt };
    },

    // ── world deltas ─────────────────────────────────────────────────
    // Generic on purpose. The server does not know what a wreck or a claim is; it knows
    // that the host of system N said key K is now V, and that a pilot arriving in N next
    // month should be told. Game systems adopt this one key at a time without the server
    // changing — the same trick as the reasoner emitting directives, not actions.

    delta(sys, k, v, by) {
      const key = 'deltas/' + (sys | 0);
      const list = vault.get(key, []);
      // Latest value per key wins; the list stays a list for ordering and audit.
      const filtered = list.filter(d => d.k !== k);
      filtered.push({ k, v, by: by | 0, at: Date.now() });
      // A system's differences are bounded so one busy host cannot grow a file forever.
      vault.put(key, filtered.slice(-500));
    },

    deltasFor(sys) {
      return vault.get('deltas/' + (sys | 0), []);
    },

    // ── server identity ──────────────────────────────────────────────

    /** Load-or-create the server document. Age accumulates across restarts. */
    serverDoc(seed, density = 1.4) {
      let doc = vault.get('server');
      if (!doc) {
        doc = { seed: seed >>> 0, density, age: 0, secret: crypto.randomBytes(32).toString('hex'), created: Date.now() };
        vault.put('server', doc);
      }
      if (doc.density == null) { doc.density = density; vault.put('server', doc); }  // pre-1.03.04 doc
      return doc;
    },

    saveAge(doc, uptime) {
      vault.put('server', { ...doc, age: doc.age + uptime });
    }
  };
}
