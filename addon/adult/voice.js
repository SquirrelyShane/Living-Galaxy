/* Picker for the isolated 18+ bank. Core never imports this. */
import { ADULT_BANK, ADULT_BANK_SIZE } from "./voice-bank.js";

export { ADULT_BANK_SIZE };

export function hashN(s, n) {
  let h = 2166136261;
  const str = String(s ?? "");
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return n > 0 ? (h >>> 0) % n : 0;
}

export function adultLine(bags, seed, fallback = "") {
  const keys = Array.isArray(bags) ? bags : [bags];
  for (const key of keys) {
    const arr = ADULT_BANK[key];
    if (arr?.length) return arr[hashN(`${key}:${seed}`, arr.length)];
  }
  return fallback;
}

export function flavorBags(m, base) {
  const race = String(m?.raceId ?? "");
  const beast = /korrash|haask|vantari|ashwalker|myrrin|delvath|veyd|kethran|brann|sirrah/.test(race);
  const slave = Boolean(m?.captive || m?.collar || m?.status === "captive");
  const port = Boolean(m?.portWorker || m?.trade === "comfort");
  const extra = [];
  if (beast) extra.push("beast_do", "mix_beast", "beast_body");
  if (slave) extra.push("slave_do", "mix_slave");
  if (port) extra.push("port_do", "mix_port");
  return extra.length ? [base, ...extra] : [base, "mix_partner"];
}
