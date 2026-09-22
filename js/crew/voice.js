/* Sample the voice bank. Trait + seed pick a stable line for a moment,
 * so the same hand doesn't recite a new novel every paint, but a new
 * conversation (new time / topic) draws a different one.
 */
import { BANK, BANK_SIZE } from "./voice-bank.js";

export { BANK_SIZE };

const TRAIT_KEYS = ["grit", "caution", "greed", "loyalty", "curiosity"];

export function hashN(s, n) {
  let h = 2166136261;
  const str = String(s ?? "");
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return n > 0 ? (h >>> 0) % n : 0;
}

export function leanTrait(t = {}) {
  let best = "else", v = 0.55;
  for (const k of TRAIT_KEYS) {
    const x = t[k] ?? 0.5;
    if (x > v) { v = x; best = k; }
  }
  return best;
}

/** Pick one line from a bag. `bags` may be a key or a list of keys (first hit). */
export function line(bags, seed, fallback = "") {
  const keys = Array.isArray(bags) ? bags : [bags];
  for (const key of keys) {
    const arr = BANK[key];
    if (arr?.length) return arr[hashN(`${key}:${seed}`, arr.length)];
  }
  return fallback;
}

/** Trait-flavoured pick: tries `${prefix}_${trait}` then `${prefix}_else` then prefix. */
export function byTrait(prefix, t, seed, fallback = "") {
  const lean = leanTrait(t);
  return line([`${prefix}_${lean}`, `${prefix}_else`, prefix], seed, fallback);
}

export function wrap(name, text) {
  const n = String(name ?? "").split(" ")[0] || "Hand";
  const s = String(text ?? "").trim();
  if (!s) return `${n}: "…"`;
  if (s.startsWith(n) || s.includes(": \"")) return s;
  return `${n}: "${s}"`;
}
