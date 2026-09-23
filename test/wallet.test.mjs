/* LIVING GALAXY — 0.3.41: the wallet survives a reload.
 *
 * Until 0.3.41 `ship.credits` was whatever makeShip() and the race bonus
 * issued, every launch. A session's trade was gone on reload while the corp
 * treasury beside it survived. This pins the whole path: the save carries the
 * purse, a launch restores it (once — the race bonus is a new pilot's and is
 * not paid again), the sim writes it while credits move, persistNow() writes
 * it when the tab hides, and a save from before 0.3.41 still launches with the
 * starting purse rather than zero.
 *
 *   node --import ./test/three-register.mjs test/wallet.test.mjs
 */

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  get length() { return store.size; },
  key: (i) => [...store.keys()][i] ?? null,
};

const { loadSave, useGameStore } = await import("../js/store.js");
const { sim, launchSim, tickSim, persistNow } = await import("../js/sim.js");
const { makePilot, pilot, raceTraits } = await import("../js/pilot.js");
const { traitsOf } = await import("../js/races.js").catch(() => ({ traitsOf: null }));

const saved = () => JSON.parse(store.get("lgaa-save-v1") ?? "null");

/* ---- 1. the store round-trips the purse -------------------------------- */
{
  ok(loadSave().credits === null, "no save: the purse is null, not 0 — the launch issues the starting one");
  useGameStore.setState({ callsign: "Purse", credits: 4321, room: "sol" });
  useGameStore.getState().persist();
  ok(saved().credits === 4321, `persist() writes the wallet (${saved().credits})`);
  ok(loadSave().credits === 4321, "…and loadSave() reads it back");
  useGameStore.setState({ credits: Number.NaN });
  useGameStore.getState().persist();
  ok(saved().credits === 4321, "a NaN in the store does not overwrite a good purse");
  store.delete("lgaa-save-v1");
}

/* ---- 2. a fresh pilot launches with the starting purse ------------------- */
{
  makePilot("Fresh", "terran", "mining", null);
  launchSim("Fresh", "sol");
  sim.phase = "play";
  const start = sim.ship.credits;
  const bonus = raceTraits?.()?.credits ?? 0;
  ok(start === 2500 + bonus, `a new pilot starts with 2500 plus the race bonus (${start}, bonus ${bonus})`);
  ok(saved()?.credits === start, `…and the launch persist already carries it (${saved()?.credits})`);
  ok(sim.walletSaved === start, "the sim knows what it last wrote");
}

/* ---- 3. earnings come back on the next launch, the bonus does not -------- */
{
  sim.ship.credits = 9876;
  persistNow();
  ok(saved().credits === 9876, `persistNow() writes the purse (${saved().credits})`);
  /* the next morning */
  launchSim("Fresh", "sol");
  sim.phase = "play";
  ok(sim.ship.credits === 9876, `a relaunch restores the purse exactly (${sim.ship.credits}) — no race bonus on top`);
}

/* ---- 4. the periodic write while credits move ---------------------------- */
{
  const before = saved().credits;
  sim.ship.credits += 250;
  const t0 = sim.wall;
  tickSim(0.05);
  ok(saved().credits === before, "one tick after a sale: nothing written yet (writes are spaced)");
  sim.wall = t0 + 31;
  tickSim(0.05);
  ok(saved().credits === sim.ship.credits && saved().credits === before + 250, `…half a minute later it is on disk (${saved().credits})`);
  const w1 = saved().credits;
  sim.wall += 31;
  tickSim(0.05);
  ok(saved().credits === w1, "no change, no write — the sim does not stringify the save every 30 s for nothing");
}

/* ---- 5. a pre-0.3.41 save (no purse) is not read as zero ----------------- */
{
  const s = saved();
  delete s.credits;
  store.set("lgaa-save-v1", JSON.stringify(s));
  ok(loadSave().credits === null, "an old save has no purse");
  launchSim("Fresh", "sol");
  sim.phase = "play";
  const bonus = raceTraits?.()?.credits ?? 0;
  ok(sim.ship.credits === 2500 + bonus, `…so the launch issues the starting purse, not 0 (${sim.ship.credits})`);
}

/* ---- 6. a new run does not inherit the old pilot's purse ----------------- */
{
  const { startRun } = await import("../js/profile.js");
  sim.ship.credits = 55555;
  persistNow();
  ok(saved().credits === 55555, "the old pilot is rich");
  startRun("Newbie");
  ok(loadSave().credits === null, "startRun clears the save, purse included");
  makePilot("Newbie", "terran", "freight", null);
  launchSim("Newbie", "sol");
  sim.phase = "play";
  ok(sim.ship.credits < 55555 && sim.ship.credits >= 2500, `the new pilot starts fresh (${sim.ship.credits})`);
}

/* ---- 7. persistNow refuses outside play --------------------------------- */
{
  sim.phase = "menu";
  const w = saved().credits;
  sim.ship.credits = 1;
  ok(persistNow() === false && saved().credits === w, "persistNow() on the menu writes nothing");
  sim.phase = "play";
}

void pilot; void traitsOf;
console.log(`wallet: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
