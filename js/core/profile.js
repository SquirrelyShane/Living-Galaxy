export const SKY_KEYS = [
  "lgaa.cradle.v1",
  "lgaa.gdb.v1",
];

export const DEVICE_KEYS = [
  "lgaa.audio.mix",
  "lgaa.rocks",
  "lgaa.dockcine",
  "lgaa.fullscreen",
  "lgaa.lens",
  "lgaa.attract",
  "lgaa-adult-pack",
  "lgaa.npcchat.v1",
  "lgaa.account.v1",
  "lgaa.news.seen.v1",
];

export const LEARNED_KEYS = [
  "lgaa.aria.v1",
  "lgaa.housebrain.v1",
  "lgaa.tape.v1",
];

export const RUN_KEYS = [
  "lgaa-company",
  "lgaa-fleet",
  "lgaa-social",
  "lgaa-save-v1",
  "lgaa-save-v0",
  "lgaa.con.recents.v1",
  "lgaa.tutorial.v1",
  "lgaa.tutorial.core.v1",
  "lgaa.pilot.v1",
];

export const RUN_PREFIXES = [
  "lgaa.upgrades.v1:",
  "lgaa.robots.v1:",
  "lgaa.missions.v1:",
  "lgaa.mission.run.v1:",
  "lgaa.drones.v1:",
  "lgaa.fab.v1:",
];

export const PROFILE_KEY = "lgaa.profile.v1";

const store = () => {
  try { return globalThis.localStorage ?? null; } catch { return null; }
};

function read() {
  try {
    const raw = store()?.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function write(p) {
  try { store()?.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
}

function mintId() {
  const t = Date.now().toString(36);
  const r = Math.floor(Math.random() * 0x1000000).toString(36).padStart(5, "0");
  return `${t}-${r}`;
}

export function profile() {
  return read();
}

export function runId() {
  return read()?.id ?? "";
}

export function runCallsign() {
  return read()?.callsign ?? "";
}

export function clearRun() {
  const ls = store();
  if (!ls) return [];
  const had = [];
  for (const k of RUN_KEYS) {
    try {
      if (ls.getItem(k) != null) had.push(k);
      ls.removeItem(k);
    } catch {}
  }
  const doomed = [];
  try {
    for (let i = 0; i < (ls.length ?? 0); i++) {
      const k = ls.key(i);
      if (k && RUN_PREFIXES.some((p) => k.startsWith(p))) doomed.push(k);
    }
  } catch {}
  for (const k of doomed) {
    try { ls.removeItem(k); had.push(k); } catch {}
  }
  return had;
}

export function startRun(callsign) {
  const previous = read();
  const cleared = clearRun();
  const p = {
    id: mintId(),
    callsign: String(callsign ?? "").trim() || "Pilot",
    createdAt: Date.now(),
    previous: previous?.id ?? null,
    previousCallsign: previous?.callsign ?? null,
  };
  write(p);
  return { ...p, cleared };
}

export function renameRun(callsign) {
  const p = read();
  if (!p) return startRun(callsign);
  p.callsign = String(callsign ?? "").trim() || p.callsign;
  write(p);
  return p;
}

export function forgetRun() {
  const cleared = clearRun();
  try { store()?.removeItem(PROFILE_KEY); } catch {}
  return cleared;
}
