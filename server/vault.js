// Living Galaxy server — the vault. Everything the galaxy persists goes through here,
// encrypted at rest.
//
// The requirement is that the laptop hosting the galaxy can be lost, lent, or backed up
// to a drive that ends up in a drawer, without the account table and every pilot's
// history going with it in the clear. So: one passphrase at boot, stretched with scrypt
// into a 256-bit key, and every record sealed with AES-256-GCM under a fresh random IV.
// GCM rather than CBC because the auth tag makes tampering *loud* — a flipped byte in a
// wallet file becomes "record rejected", not a quietly different balance.
//
// The crypto (`seal`/`unseal`/`deriveKey`) is pure functions of buffers, tested without a
// filesystem. The store on top writes atomically — tmp file, then rename — because the
// one unacceptable failure is a power cut leaving half a ciphertext where an account was.
//
// Deliberately not a database. Records here are small JSON documents keyed like paths
// ("accounts/shane", "deltas/8412"), the write rate is human-scale, and the entire data
// set grows with player activity rather than with the size of the galaxy — the galaxy
// itself is a seed and costs nothing. If this ever hosts hundreds of pilots, the upgrade
// path is SQLite behind the same five functions, not a different design.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MAGIC = Buffer.from('LGV1');      // format tag, so a future format can migrate
const SCRYPT = { N: 16384, r: 8, p: 1 };

// ── pure crypto ──────────────────────────────────────────────────────

/** Stretch a passphrase into a key. The salt is per-galaxy, made once and kept. */
export function deriveKey(passphrase, salt) {
  return crypto.scryptSync(String(passphrase), salt, 32, SCRYPT);
}

/** plaintext Buffer|string → MAGIC ‖ iv(12) ‖ tag(16) ‖ ciphertext */
export function seal(key, plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([c.update(Buffer.from(plain)), c.final()]);
  return Buffer.concat([MAGIC, iv, c.getAuthTag(), body]);
}

/** Inverse of seal. Returns null on wrong key, tampering, or a foreign blob — never throws. */
export function unseal(key, blob) {
  try {
    if (!Buffer.isBuffer(blob) || blob.length < 32 || !blob.subarray(0, 4).equals(MAGIC)) return null;
    const iv = blob.subarray(4, 16), tag = blob.subarray(16, 32), body = blob.subarray(32);
    const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(body), d.final()]);
  } catch {
    return null;
  }
}

/** Password hashing for accounts — same scrypt, per-account salt, constant-time compare. */
export function hashSecret(secret, salt) {
  return crypto.scryptSync(String(secret), salt, 32, SCRYPT);
}
export function secretMatches(secret, salt, expected) {
  const got = hashSecret(secret, salt);
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}

// ── the store ────────────────────────────────────────────────────────

/**
 * Open (or create) a vault at `dir` with `passphrase`.
 *
 * A `check` record sealed at creation proves the passphrase on every later boot: unseal
 * fails → refuse to run, loudly, *before* any write could scribble records under a second
 * key next to records under the first — the one corruption this design cannot undo.
 */
export function openVault(dir, passphrase) {
  fs.mkdirSync(dir, { recursive: true });
  const saltPath = path.join(dir, 'salt');
  let salt;
  if (fs.existsSync(saltPath)) salt = fs.readFileSync(saltPath);
  else { salt = crypto.randomBytes(16); fs.writeFileSync(saltPath, salt); }

  const key = deriveKey(passphrase, salt);
  const checkPath = path.join(dir, 'check');
  if (fs.existsSync(checkPath)) {
    if (!unseal(key, fs.readFileSync(checkPath))) return null;   // wrong passphrase
  } else {
    fs.writeFileSync(checkPath, seal(key, 'living-galaxy'));
  }

  const fileFor = k => {
    // Keys look like paths but must never *be* path traversal. One flat namespace with
    // the separator folded into the name keeps `../` meaningless by construction.
    const safe = String(k).replace(/[^a-zA-Z0-9_.-]/g, '_');
    return path.join(dir, safe + '.lgv');
  };

  return {
    /** Read a JSON record, or `fallback` when absent/unreadable. */
    get(k, fallback = null) {
      const f = fileFor(k);
      if (!fs.existsSync(f)) return fallback;
      const plain = unseal(key, fs.readFileSync(f));
      if (!plain) return fallback;                // tampered or foreign — treated as absent
      try { return JSON.parse(plain.toString()); } catch { return fallback; }
    },

    /** Write a JSON record atomically. */
    put(k, value) {
      const f = fileFor(k);
      const tmp = f + '.tmp';
      fs.writeFileSync(tmp, seal(key, JSON.stringify(value)));
      fs.renameSync(tmp, f);                       // atomic on the same filesystem
    },

    /** Every stored key with the given prefix (post-folding, so use simple prefixes). */
    keys(prefix = '') {
      const safe = String(prefix).replace(/[^a-zA-Z0-9_.-]/g, '_');
      return fs.readdirSync(dir)
        .filter(f => f.endsWith('.lgv') && f.startsWith(safe))
        .map(f => f.slice(0, -4));
    },

    dir
  };
}
