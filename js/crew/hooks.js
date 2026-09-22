/* Living Galaxy — optional addon hooks.
 *
 * Core never imports addon code. An addon folder that is present registers
 * here; if the folder is deleted the game keeps vanilla talk, romance and
 * fade-to-black private evenings. Restricted models can build against core
 * without reading the 18+ pack.
 */

/* What each bucket is handed, and what it is expected to give back.
 *
 *   beats           () => Beat[]                     see crew/beats.js CORE_BEATS
 *                   A Beat may carry `replaces: "<topicId>"`, and the staged
 *                   version then takes that topic's place in the TALK list.
 *   talkTopics      (m, c) => Topic[]                see crew/talk-trees.js
 *   onPrivateNight  (a, b, res) => void              res is the fade-to-black
 *                   result: { ok, conceived, chance, carrier, sire }
 *   houseRules      (root, kit) => void              kit is the console kit —
 *                   { el, section, note, row, button, group, chips, setBar,
 *                     social, setSocial, loadSocial, repaint }
 *                   Build with `row(root, label, { value, hint })` so the row
 *                   matches every other row on the sheet.
 */
const buckets = {
  beats: [],
  talkTopics: [],
  onPrivateNight: [],
  houseRules: [],
};

export function addHook(name, fn) {
  if (!buckets[name]) buckets[name] = [];
  if (typeof fn === "function") buckets[name].push(fn);
  return () => {
    const i = buckets[name].indexOf(fn);
    if (i >= 0) buckets[name].splice(i, 1);
  };
}

export function runHooks(name, ...args) {
  const out = [];
  for (const fn of buckets[name] ?? []) {
    try { out.push(fn(...args)); } catch (err) { console.warn("[hooks]", name, err); }
  }
  return out;
}

export function listHooks(name) {
  return buckets[name] ?? [];
}

export const addons = {
  adult: false,
  mark(id, on = true) { addons[id] = on; },
};
