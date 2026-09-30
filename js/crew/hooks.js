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
