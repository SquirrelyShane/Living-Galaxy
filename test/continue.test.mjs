/* LIVING GALAXY — 0.3.42: FLY AS <callsign>. The pilot comes back.
 *
 * Until 0.3.42 nothing about the pilot was written anywhere: every launch was
 * makePilot() from the creation screen, which is a NEW run (js/profile.js
 * sweeps the old one). A returning player was a new character in the trainer
 * with the starting purse, whatever the save beside them said — measured in a
 * browser before this was built: purse 99,999 on disk, 3,100 after "Create
 * pilot" with the same callsign.
 *
 * This pins the record: what it holds, that a bad one is refused, that a
 * relaunch as the same pilot keeps rank, skills, hulls and cover, does not
 * collect the sign-on standing again, goes back to the last sky, and that a
 * new pilot still sweeps it.
 *
 *   node --import ./test/three-register.mjs test/continue.test.mjs
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

const P = await import("../js/profile.js");
const { pilot, makePilot, work, serializePilot, restorePilot, savePilot, loadPilot, PILOT_KEY, rankStatus, skillSheet, tryPromote } = await import("../js/pilot.js");
const { loadSave, useGameStore } = await import("../js/store.js");
const { sim, launchSim, tickSim, persistNow, currentShipId } = await import("../js/sim.js");
const { corpById, corps, buildCorps } = await import("../js/corps.js");
const { SHIP_DB, DEFAULT_SHIP_ID } = await import("../js/shipdb.js");
const { yardQuote } = await import("../js/shipcost.js");
const { buyCoverage } = await import("../js/ui/coverage.js");
const { policyFor, playerKey } = await import("../js/insurance.js");

const rec = () => JSON.parse(store.get(PILOT_KEY) ?? "null");
const topSkill = () => skillSheet()[0];

/* ---- 1. the key is a run's ------------------------------------------------ */
{
  ok(P.RUN_KEYS.includes(PILOT_KEY), "the pilot record is a RUN key: swept by a new pilot, carried by the account");
  ok(!P.DEVICE_KEYS.includes(PILOT_KEY) && !P.LEARNED_KEYS.includes(PILOT_KEY), "…and nothing else");
}

/* ---- 2. the record round-trips ------------------------------------------- */
{
  makePilot("Ada", "terran", "mining", null);
  ok(pilot.restored === false && pilot.dirty === true, "a made pilot is fresh, and worth writing");
  for (let i = 0; i < 40; i++) work("geology", 0.5);           // twenty whole points of mining
  const before = { rank: rankStatus().letter, skill: topSkill(), race: pilot.raceId, complex: pilot.complexId, mods: { ...pilot.mods } };
  const r = serializePilot({ hulls: ["x"], activeHull: "x", cover: [] });
  ok(r.v === 1 && r.name === "Ada" && r.raceId === "terran" && r.complexId === "mining" && r.character?.careers?.mining, "serializePilot() carries who they are");
  ok(r.hulls[0] === "x" && r.activeHull === "x", "…and what the sim hands it");
  const json = JSON.parse(JSON.stringify(r));
  makePilot("Nobody", "terran", "navigation", null);             // wipe the live pilot
  ok(topSkill()?.id !== before.skill?.id || topSkill()?.value !== before.skill?.value || pilot.complexId !== "mining", "the live pilot is somebody else now");
  ok(restorePilot(json) === true, "restorePilot() takes the JSON back");
  ok(pilot.name === "Ada" && pilot.complexId === "mining" && pilot.raceId === "terran", "…name, career, race");
  ok(rankStatus().letter === before.rank && topSkill().id === before.skill.id && topSkill().value === before.skill.value, `…rank ${rankStatus().letter} and the trained skill (${topSkill().id} ${topSkill().value})`);
  ok(JSON.stringify(pilot.mods) === JSON.stringify(before.mods), "…and the composed race × spec multipliers");
  ok(pilot.restored === true && pilot.record === json && pilot.dirty === false, "a restored pilot says so and keeps the record for the sim");
}

/* ---- 3. a bad record is refused, and touches nothing ---------------------- */
{
  const name = pilot.name;
  ok(restorePilot(null) === false && restorePilot({}) === false, "null / empty: refused");
  ok(restorePilot({ v: 99, character: { careers: {} }, complexId: "mining", raceId: "terran" }) === false, "wrong version: refused");
  ok(restorePilot({ v: 1, character: null, complexId: "mining", raceId: "terran" }) === false, "no character: refused");
  ok(restorePilot({ v: 1, character: { careers: {} }, complexId: "mining", raceId: "martian-cat" }) === false, "unknown race: refused");
  ok(pilot.name === name, "…and the live pilot is untouched");
  store.set(PILOT_KEY, "{not json");
  ok(loadPilot() === null, "a corrupt record on disk reads as none");
  store.delete(PILOT_KEY);
}

/* ---- 4. the launch writes it; a relaunch as the same pilot keeps everything */
{
  makePilot("Ada", "terran", "mining", null);
  launchSim("Ada", "sol");
  sim.phase = "play";
  ok(rec()?.name === "Ada" && rec().hulls.length === 0 && rec().activeHull === null, "the launch writes the record (no hulls yet)");
  /* sign on with a corp and note the standing */
  buildCorps(() => 0.42);
  const corp = corps[0];
  makePilot("Ada", "terran", "mining", corp.id);
  launchSim("Ada", "sol");
  sim.phase = "play";
  const signedOn = corpById(corp.id).standing;
  ok(signedOn > 0, `signing on with ${corp.name} earned standing (${signedOn})`);
  /* train, buy a hull, insure it, earn */
  for (let i = 0; i < 60; i++) work("geology", 0.5);
  const hull = SHIP_DB.find((d) => d.id !== DEFAULT_SHIP_ID && yardQuote(d).total < 60000) ?? SHIP_DB[1];
  sim.ship.credits = 500000;
  sim.ownedHulls = [hull.id]; sim.activeHullId = hull.id;
  const value = yardQuote(hull, { complexId: null, letter: "A" }).total;
  ok(Boolean(buyCoverage(sim.ship, hull.id, "gold", value)), "gold cover written on the bought hull");
  const purse = sim.ship.credits;
  const rank = rankStatus().letter, skill = topSkill();
  ok(persistNow() === true, "persistNow() writes");
  const onDisk = rec();
  ok(onDisk.hulls[0] === hull.id && onDisk.activeHull === hull.id, `the record carries the hull (${hull.name})`);
  ok(onDisk.cover.length === 1 && onDisk.cover[0].tier === "gold" && onDisk.cover[0].key === playerKey(hull.id), "…and the cover on it");
  ok(loadSave().lastSky === "sol" && loadSave().credits === purse, "the save carries the sky and the purse");

  /* the next morning: FLY AS Ada */
  makePilot("Nobody", "terran", "navigation", null);          // the page reloaded: the live pilot is blank
  ok(restorePilot(loadPilot()) === true, "the start card restores the record");
  launchSim("Ada", loadSave().lastSky);
  sim.phase = "play";
  ok(pilot.name === "Ada" && pilot.corpId === corp.id && rankStatus().letter === rank && topSkill().id === skill.id && topSkill().value === skill.value, `the same pilot: rank ${rank}, ${skill.id} ${skill.value}`);
  ok(currentShipId() === hull.id && sim.ownedHulls.includes(hull.id), `flying the bought hull, not the trainer (${currentShipId()})`);
  ok(policyFor(playerKey(hull.id))?.tier === "gold", "the gold cover is still on it");
  ok(sim.ship.credits === purse, `the purse came back (${sim.ship.credits})`);
  ok(corpById(corp.id).standing === signedOn, `no second sign-on, and the standing itself came back: ${corpById(corp.id).standing} (corps are regrown from the seed on every load)`);
  ok(rec().standing?.sol?.[corp.id] === signedOn, "…because the record carries a standing table per sky");
}

/* ---- 5. the 30 s writer picks up rank and skills without a credit moving --- */
{
  const w0 = store.get(PILOT_KEY);
  for (let i = 0; i < 10; i++) work("geology", 0.5);           // five points: dirty, no credits moved
  const t0 = sim.wall;
  tickSim(0.05);
  ok(store.get(PILOT_KEY) === w0, "nothing written on the next tick");
  sim.wall = t0 + 31;
  tickSim(0.05);
  ok(store.get(PILOT_KEY) !== w0 && rec().character.skills.geology > JSON.parse(w0).character.skills.geology, "…half a minute later the trained skill is on disk");
  ok(pilot.dirty === false, "…and the record is clean until the next change");
}

/* ---- 6. a lost hull is on the record at once ------------------------------ */
{
  const { loseHull } = await import("../js/sim.js");
  const had = sim.ownedHulls[0];
  loseHull(sim.ship, "test");
  tickSim(0.05);
  ok(!rec().hulls.includes(had) && rec().activeHull === null, "loseHull() strikes the hull off the record on the next frame");
}

/* ---- 7. a new pilot sweeps it --------------------------------------------- */
{
  ok(loadPilot() !== null, "the record is there");
  P.startRun("Bea");
  ok(loadPilot() === null && loadSave().credits === null, "startRun() sweeps the record and the save — a new pilot is a new run");
}

void useGameStore; void tryPromote;
console.log(`continue: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
