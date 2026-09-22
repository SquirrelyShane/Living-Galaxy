/* LIVING GALAXY — 0.3.10: ore becomes the parts the ports sell.
 *
 *   node --import ./test/three-register.mjs test/fabricate.test.mjs
 *
 * js/fabricate.js is a leaf — it imports the materials table and nothing else,
 * and the clock, the stock, the credits and the locker are injected. So the
 * solver AND the job queue both drive here with a fake port and no sim, which
 * is the whole reason it was built that way.
 */
import assert from "node:assert/strict";

let pass = 0, fail = 0;
const t = async (name, fn) => {
  try { await fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.log(`FAIL  ${name}\n      ${e.stack ?? e.message}`); fail++; }
};

const {
  FAB, fabJobs, recipeFor, billOfMaterials, fabMargin, planJob, canFabAt, fabMenuAt,
  orderFab, cancelFab, stepFab, fabQueueAt, fabReport, wireFab, resetFab,
} = await import("../js/fabricate.js");
const { ORES, COMPONENTS, MINERALS, ALL_GOODS } = await import("../js/materials.js");

/* ---- a world of our own ---------------------------------------------------- */
let NOW = 0;
const lockers = { p1: {}, p2: {} };
const purse = { player: 100000, company: 100000 };
const logs = [];
const PORT = { id: "p1", name: "Foundry Hold", sector: "industrial" };
const FARM = { id: "p2", name: "Vat Anchorage", sector: "agricultural" };
const RAIDER = { id: "p3", name: "Sump Post", sector: "pirate", hostile: true };

wireFab({
  now: () => NOW,
  stockAt: (stId) => ({ ...(lockers[stId] ?? {}) }),
  consume: (stId, by, use) => {
    for (const [k, v] of Object.entries(use)) {
      lockers[stId][k] = (lockers[stId][k] ?? 0) - v;
      if (lockers[stId][k] <= 1e-9) delete lockers[stId][k];
    }
  },
  deliver: (stId, by, id, qty) => { lockers[stId][id] = (lockers[stId][id] ?? 0) + qty; },
  pay: (by, cr) => { if (purse[by] < cr) return "Not enough credits"; purse[by] -= cr; return null; },
  log: (text) => logs.push(text),
});

const reset = () => {
  resetFab();
  lockers.p1 = {}; lockers.p2 = {};
  purse.player = 100000; purse.company = 100000;
  logs.length = 0;
  NOW = 0;
};

/* ---- the graph -------------------------------------------------------------- */

await t("the recipe graph is acyclic and every part reduces to ore", () => {
  const oreIds = new Set(ORES.map((o) => o.id));
  const colour = new Map();
  const cycles = [];
  const visit = (id, stack) => {
    if (colour.get(id) === "grey") { cycles.push([...stack, id].join(" -> ")); return; }
    if (colour.get(id) === "black") return;
    colour.set(id, "grey");
    const r = recipeFor(id);
    if (r) for (const k of Object.keys(r.from)) visit(k, [...stack, id]);
    colour.set(id, "black");
  };
  for (const g of ALL_GOODS) visit(g.id, []);
  assert.deepEqual(cycles, [], "no cycles — the solver recurses on this");

  /* and nothing bottoms out in something you cannot cut out of a rock */
  const unreachable = new Set();
  for (const c of COMPONENTS) {
    for (const leaf of Object.keys(billOfMaterials(c.id, 1))) if (!oreIds.has(leaf)) unreachable.add(leaf);
  }
  assert.deepEqual([...unreachable], [], "every component reduces to ores");
});

await t("an ore refines, a recipe makes, an ore itself is raw", () => {
  const steel = recipeFor("steel");
  assert.equal(steel.kind, "make");
  assert.deepEqual(steel.from, { iron: 3, carbon: 1 });

  const iron = recipeFor("iron");
  assert.equal(iron.kind, "refine", "a mineral with no recipe is smelted");
  assert.equal(iron.ore, "iron_ore");
  assert.ok(iron.from.iron_ore > 1, `it takes more than a unit of ore (${iron.from.iron_ore.toFixed(2)})`);

  assert.equal(recipeFor("iron_ore"), null, "ore is cut, not built");
  assert.equal(recipeFor("nonsense"), null);
});

/* ---- planning ---------------------------------------------------------------- */

await t("a job cascades all the way down to ore", () => {
  reset();
  const p = planJob("motor", 1, {});
  assert.equal(p.ok, false, "nothing in stock, so it cannot run");
  assert.ok(Object.keys(p.short).length > 0);
  for (const k of Object.keys(p.short)) {
    assert.ok(ORES.some((o) => o.id === k), `${k} is an ore — the cascade bottomed out`);
  }
  assert.ok(p.summary.some((s) => s.id === "bearing"), "it planned the bearing inside the motor");
  assert.ok(p.summary.some((s) => s.id === "stainless"), "and the stainless inside the bearing");
  assert.equal(p.summary.at(-1).id, "motor", "the thing you asked for is made last");
});

await t("what it asks you to bring is exactly what makes it run", () => {
  reset();
  const dry = planJob("motor", 1, {});
  assert.ok(Object.keys(dry.need).length > 0, "it says what to bring");
  const wet = planJob("motor", 1, dry.need);
  assert.equal(wet.ok, true, `bringing the shopping list is enough (${wet.why})`);
  assert.equal(Object.keys(wet.short).length, 0);
});

await t("stock nearest the finished part is used first", () => {
  reset();
  /* three steel in hand is exactly one plate: it must not smelt fresh iron */
  const p = planJob("steel_plate", 1, { steel: 10 });
  assert.ok(p.use.steel > 0, "the steel was used");
  assert.equal(p.use.iron_ore ?? 0, 0, "no ore was touched");
  assert.equal(p.summary.length, 1, "one production: the plate itself");
  assert.equal(p.summary[0].id, "steel_plate");

  /* and with nothing in hand the same job goes all the way down */
  const deep = planJob("steel_plate", 1, {});
  assert.ok(deep.summary.length > 1, "no stock, so it builds the chain");
  assert.ok(deep.summary.some((s) => s.id === "steel"));
});

await t("a bigger job costs proportionally more work and time", () => {
  reset();
  const one = planJob("steel_plate", 1, {});
  const ten = planJob("steel_plate", 10, {});
  assert.ok(ten.ops > one.ops * 5, `ten plates is more work than one (${one.ops} → ${ten.ops})`);
  assert.ok(ten.secs > one.secs, "and takes longer");
  assert.ok(ten.fee > one.fee, "and costs more in fees");
  assert.ok(one.secs >= FAB.minSecs, "nothing is instant");
});

await t("no recipe destroys value, and the margin is reported on every one", () => {
  /* CONTRACT CHANGED IN 0.3.11, and tightened rather than loosened.
   *
   * 0.3.10 asserted the opposite — that a minority of recipes were loss-making
   * — because running the graph for the first time found eleven that cost more
   * in raw ore than the product sold for (a Gyroscope was 1,726 cr of ore for
   * an 1,120 cr part). That was true of the data and the planner reported it
   * honestly rather than hiding it.
   *
   * Those eleven values were raised to 1.25x in 0.3.11, so the honest assertion
   * now is the strong one: NOTHING you can build is worth less than the rock it
   * came out of. This catches a future table edit that reintroduces a trap,
   * which the old "some are bad" assertion could never do. */
  const losers = [...MINERALS, ...COMPONENTS]
    .filter((g) => fabMargin(g.id).ratio < 1)
    .map((g) => `${g.name} ${fabMargin(g.id).ratio.toFixed(2)}×`);
  assert.deepEqual(losers, [], "every recipe is worth at least the ore it eats");

  const motor = fabMargin("motor");
  assert.ok(motor.ratio > 1.2, `a motor is clearly worth making (${motor.ratio.toFixed(2)}×)`);
  const gyro = fabMargin("gyro");
  assert.ok(gyro.ratio >= 1.2, `and the worst offender was fixed, not hidden (gyroscope ${gyro.ratio.toFixed(2)}×)`);

  /* the spread is still a spread: fabricating should be a choice, not a faucet */
  const ratios = COMPONENTS.map((c) => fabMargin(c.id).ratio).sort((a, b) => a - b);
  assert.ok(ratios[0] >= 1, `the worst component clears its ore (${ratios[0].toFixed(2)}×)`);
  assert.ok(ratios.at(-1) > 3, `and the best is still well worth the trip (${ratios.at(-1).toFixed(2)}×)`);
});

/* ---- who will build what ------------------------------------------------------ */

await t("a port builds what it sells, and an industrial yard builds anything", () => {
  assert.ok(canFabAt(PORT, "motor"), "industrial: anything");
  assert.ok(canFabAt(PORT, "chip"), "including electronics");
  assert.ok(canFabAt(FARM, "fertiliser"), "the farm makes what it sells");
  assert.ok(!canFabAt(FARM, "chip"), "and not what it does not");
  assert.ok(!canFabAt(RAIDER, "motor"), "a hostile free port builds nothing for you");

  const menu = fabMenuAt(PORT);
  assert.ok(menu.length > 10, `the yard has a menu (${menu.length} lines)`);
  assert.ok(!menu.some((m) => m.tier === "ore"), "ore is not on it — ore is cut");
  assert.ok(menu[0].ratio >= menu.at(-1).ratio, "best margin first");
});

/* ---- the queue ----------------------------------------------------------------- */

await t("a job takes its materials, runs on sim time, and lands in the locker", () => {
  reset();
  const need = planJob("steel_plate", 2, {}).need;
  lockers.p1 = { ...need };
  const before = purse.player;

  const oreBefore = need.iron_ore;
  const r = orderFab({ st: PORT, id: "steel_plate", qty: 2, by: "player" });
  assert.equal(r.ok, true, `ordered (${r.why ?? ""})`);
  assert.ok(purse.player < before, `the works took its fee (${before - purse.player} cr)`);
  /* the shopping list is rounded up to the nearest hundredth, so a sliver is
   * left on the shelf rather than exactly nothing — what matters is that the
   * materials went into the job the moment it was ordered, not on delivery */
  assert.ok((lockers.p1.iron_ore ?? 0) < oreBefore * 0.02,
    `the ore came off the shelf immediately (${oreBefore.toFixed(2)} → ${(lockers.p1.iron_ore ?? 0).toFixed(3)})`);
  assert.equal(fabQueueAt("p1").length, 1, "one job on the line");
  assert.equal(lockers.p1.steel_plate ?? 0, 0, "and nothing delivered yet");

  NOW = r.job.done - 1;
  assert.equal(stepFab(NOW), 0, "not before its time");
  assert.equal(lockers.p1.steel_plate ?? 0, 0);

  NOW = r.job.done;
  assert.equal(stepFab(NOW), 1, "and then it lands");
  assert.equal(lockers.p1.steel_plate, 2, "two plates in the locker");
  assert.equal(fabQueueAt("p1").length, 0, "the line is clear");
});

await t("a job it cannot supply is refused, and charges nothing", () => {
  reset();
  const before = purse.player;
  const r = orderFab({ st: PORT, id: "motor", qty: 1, by: "player" });
  assert.equal(r.ok, false);
  assert.match(r.why, /short/i, `it says what is missing (${r.why})`);
  assert.equal(purse.player, before, "and took no fee for a job it did not start");
  assert.equal(fabJobs.length, 0);
});

await t("a port with no line for it says so", () => {
  reset();
  lockers.p2 = planJob("chip", 1, {}).need;
  const r = orderFab({ st: FARM, id: "chip", qty: 1, by: "player" });
  assert.equal(r.ok, false);
  assert.match(r.why, /no line/i, r.why);
});

await t("the company pays from its own account, not the pilot's", () => {
  reset();
  lockers.p1 = planJob("girder", 1, {}).need;
  const pilot = purse.player, corp = purse.company;
  const r = orderFab({ st: PORT, id: "girder", qty: 1, by: "company" });
  assert.equal(r.ok, true, r.why);
  assert.equal(purse.player, pilot, "the pilot's credits are untouched");
  assert.ok(purse.company < corp, `the treasury paid (${corp - purse.company} cr)`);
  assert.equal(r.job.by, "company");
});

await t("a broke account cannot start a job", () => {
  reset();
  lockers.p1 = planJob("girder", 1, {}).need;
  purse.player = 0;
  const r = orderFab({ st: PORT, id: "girder", qty: 1, by: "player" });
  assert.equal(r.ok, false);
  assert.match(r.why, /credits/i, r.why);
  assert.equal(fabJobs.length, 0, "and nothing was queued");
  assert.ok(lockers.p1.iron_ore > 0, "and the materials are still on the shelf");
});

await t("a port runs only so many lines at once", () => {
  reset();
  for (let i = 0; i < FAB.perPort + 1; i++) {
    const need = planJob("steel_plate", 1, {}).need;
    for (const [k, v] of Object.entries(need)) lockers.p1[k] = (lockers.p1[k] ?? 0) + v;
  }
  let okCount = 0, refused = null;
  for (let i = 0; i < FAB.perPort + 1; i++) {
    const r = orderFab({ st: PORT, id: "steel_plate", qty: 1, by: "player" });
    if (r.ok) okCount++; else refused = r.why;
  }
  assert.equal(okCount, FAB.perPort, `${FAB.perPort} lines run`);
  assert.match(refused ?? "", /full/i, `and the next is turned away (${refused})`);
});

await t("cancelling hands the materials back", () => {
  reset();
  const need = planJob("girder", 1, {}).need;
  lockers.p1 = { ...need };
  const r = orderFab({ st: PORT, id: "girder", qty: 1, by: "player" });
  assert.equal(r.ok, true, r.why);
  const held = lockers.p1.iron_ore ?? 0;
  assert.ok(held < need.iron_ore * 0.02, `materials are in the job (${held.toFixed(3)} left)`);
  const c = cancelFab(r.job.id);
  assert.equal(c.ok, true);
  assert.ok((lockers.p1.iron_ore ?? 0) > need.iron_ore * 0.9,
    `and back on the shelf when it is pulled (${(lockers.p1.iron_ore ?? 0).toFixed(2)} of ${need.iron_ore.toFixed(2)})`);
  assert.equal(fabJobs.length, 0);
});

await t("the report says what is on every line and how far along", () => {
  reset();
  lockers.p1 = planJob("steel_plate", 1, {}).need;
  const r = orderFab({ st: PORT, id: "steel_plate", qty: 1, by: "player" });
  NOW = r.job.start + r.job.secs / 2;
  const rep = fabReport();
  assert.equal(rep.length, 1);
  assert.equal(rep[0].port, "Foundry Hold");
  assert.equal(rep[0].name, "Steel plate");
  assert.ok(rep[0].frac > 0.4 && rep[0].frac < 0.6, `half done (${rep[0].frac.toFixed(2)})`);
  assert.ok(rep[0].left > 0, "and says how long is left");
});

await t("several jobs finish in their own time, not all at once", () => {
  reset();
  for (const q of [1, 4]) {
    const need = planJob("girder", q, {}).need;
    for (const [k, v] of Object.entries(need)) lockers.p1[k] = (lockers.p1[k] ?? 0) + v;
  }
  const a = orderFab({ st: PORT, id: "girder", qty: 1, by: "player" });
  const b = orderFab({ st: PORT, id: "girder", qty: 4, by: "player" });
  assert.ok(a.ok && b.ok, `${a.why ?? ""} ${b.why ?? ""}`);
  assert.ok(b.job.secs > a.job.secs, "the bigger job takes longer");
  NOW = a.job.done;
  assert.equal(stepFab(NOW), 1, "the short one lands first");
  assert.equal(lockers.p1.girder, 1);
  NOW = b.job.done;
  assert.equal(stepFab(NOW), 1);
  assert.equal(lockers.p1.girder, 5, "and then the rest");
});

console.log(`\nfabricate: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
