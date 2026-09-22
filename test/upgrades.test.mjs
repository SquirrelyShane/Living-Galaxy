/* LIVING GALAXY — refit upgrades: mods into the pilot bag, fx into the ship, sector gating, save/load.
 *
 *   node --import ./test/three-register.mjs test/upgrades.test.mjs
 */

const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

import { sim, launchSim, tickSim, crewCapacity, robotCapacity, currentShipId } from "../js/sim.js";
import { shipById } from "../js/shipdb.js";
import { makePilot, pilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { BATTERY, batteryCap, buildDemand } from "../js/ship.js";
import {
  UPGRADES, upgrades, UPGRADES_KEY, hasUpgrade, fx, upgradeOptions, buyUpgrade, sellUpgrade, upgradeMods, upgradeLines, saveUpgrades, loadUpgrades,
} from "../js/upgrades.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Fitter", "terran", "mining", null);
launchSim("RefitTest", "sol");
sim.phase = "play";
const ship = sim.ship;
tickSim(1 / 60);
ship.credits = 100000;

const ind = stations.find((s) => s.sector === "industrial" && !s.hostile);
const mil = stations.find((s) => s.sector === "military" && !s.hostile);
const civ = stations.find((s) => s.sector === "civilian" && !s.hostile);
const log = stations.find((s) => s.sector === "logistic" && !s.hostile);
ok(ind && (mil || civ || log), `the sky has yards (${[ind, mil, civ, log].filter(Boolean).map((s) => s.sector).join(", ")})`);

/* ---- the table ---------------------------------------------------------------- */
/* The catalogue is wide; what is worth pinning is the VARIETY, not the count. */
ok(UPGRADES.length >= 36 && new Set(UPGRADES.map((u) => u.id)).size === UPGRADES.length, `a wide catalogue, every id distinct (${UPGRADES.length})`);
{
  const fxKeys = new Set(), modKeys = new Set(), sectors = new Set();
  for (const u of UPGRADES) {
    for (const k of Object.keys(u.fx ?? {})) fxKeys.add(k);
    for (const k of Object.keys(u.mods ?? {})) modKeys.add(k);
    for (const x of u.sector) sectors.add(x);
  }
  ok(modKeys.size >= 16, `every mod key a hull can carry is bought somewhere (${modKeys.size})`);
  ok(fxKeys.size >= 20, `and there are ${fxKeys.size} distinct non-mod effects on the table`);
  ok(sectors.size >= 5, `every yard sector fits something (${[...sectors].sort().join(", ")})`);
  const ids = new Set(UPGRADES.map((u) => u.id));
  ok(UPGRADES.every((u) => (u.excludes ?? []).every((x) => ids.has(x))), "every exclusion names a real upgrade");
  ok(UPGRADES.some((u) => u.excludes?.length), "and some choices are exclusive, so a refit is a decision");
}
/* 0.3.34 adds `resist` as a third kind of effect an upgrade can carry — an
 * additive percentage against a damage kind, deliberately outside the
 * multiplicative `mods` bag (see upgradeResists()). A refit that only grants
 * resistance is still a refit that does something. */
ok(UPGRADES.every((u) => u.price > 0 && u.sector.length && (u.mods || u.fx || u.resist) && u.blurb), "every upgrade has a price, a yard list, an effect and a blurb");
{
  const withResist = UPGRADES.filter((u) => u.resist);
  ok(withResist.length >= 3, `armour is something you can buy (${withResist.length} refits carry resistance)`);
  const kinds = new Set(withResist.flatMap((u) => Object.keys(u.resist)));
  ok(kinds.has("kinetic") && kinds.has("thermal") && kinds.has("em"), `all three damage kinds are answerable (${[...kinds].sort().join(", ")})`);
  ok(withResist.every((u) => Object.values(u.resist).every((v) => v > 0 && v <= 0.3)), "no single refit is a wall");
}
ok(upgrades.owned.length === 0 && fx("reactor", 1) === 1 && fx("battery", 0) === 0 && fx("missions", false) === false, "a stock hull: every fx is its default");

/* ---- sector gating ------------------------------------------------------------ */
{
  const opts = upgradeOptions(ind);
  ok(opts.length === UPGRADES.length, "options list every upgrade");
  ok(opts.filter((o) => !o.blocker).every((o) => o.sector.includes("industrial")), "buyable here means this sector fits it");
  ok(opts.find((o) => o.id === "shield_cap").blocker && /industrial/.test(opts.find((o) => o.id === "shield_cap").blocker), "a military-only line is blocked at the industrial yard");
  ok(buyUpgrade("shield_cap", ind) !== null && !hasUpgrade("shield_cap"), "…and refuses to sell");
  ship.credits = 100;
  ok(/short/.test(upgradeOptions(ind).find((o) => o.id === "cargo_racks").blocker), "no credits shows the shortfall");
  ok(buyUpgrade("cargo_racks", ind) !== null, "…and refuses");
  ship.credits = 100000;
  ok(buyUpgrade("nope", ind) !== null, "an unknown id refuses");
  ok(upgradeOptions(null).every((o) => o.blocker), "undocked, nothing is buyable");
}

/* ---- mods land in one refreshMods ------------------------------------------------ */
{
  const mine0 = pilot.mods.mine, cargo0 = pilot.mods.cargo;
  ok(buyUpgrade("cutter_lens", ind) === null, "a cutter lens is fitted");
  ok(Math.abs(pilot.mods.mine / mine0 - 1.12) < 1e-9, `pilot.mods.mine ×1.12 at once (${(pilot.mods.mine / mine0).toFixed(3)})`);
  ok(fx("minerRange", 0) === 150, "the lens adds 150 u of reach");
  ok(buyUpgrade("cargo_racks", ind) === null && Math.abs(pilot.mods.cargo / cargo0 - 1.15) < 1e-9, "racking ×1.15 cargo");
  tickSim(1 / 60);
  ok(ship.mods === pilot.mods && Math.abs(ship.mods.mine / mine0 - 1.12) < 1e-9, "the ship reads the same bag");
  ok(buyUpgrade("cutter_lens", ind) !== null, "buying twice refuses");
  const bag = upgradeMods();
  ok(Math.abs(bag.mine - 1.12) < 1e-9 && Math.abs(bag.cargo - 1.15) < 1e-9 && bag.hull === 1, "upgradeMods is the product over owned");
  const lines = upgradeLines();
  ok(lines.length === 2 && lines.every((l) => l.name && l.effect) && /Mining yield \+12%/.test(lines[0].effect) && /150 u/.test(lines[0].effect), `lines: ${lines.map((l) => `${l.name}: ${l.effect}`).join(" | ")}`);
}

/* ---- fx land in the ship --------------------------------------------------------- */
{
  ok(batteryCap(ship) === BATTERY, "stock battery");
  ok(buyUpgrade("battery_bank", ind) === null && batteryCap(ship) === BATTERY + 400, `a bank grows the cap to ${batteryCap(ship)}`);
  ship.charge = BATTERY + 400;
  ship.throttle = 0; ship.shields = false; ship.turretsArmed = false; ship.miningMode = "off"; ship.localGravity = false;
  tickSim(1 / 60);
  ok(ship.charge > BATTERY, `the cells hold past the old cap (${Math.round(ship.charge)})`);
  const r0 = ship.reactor;
  ok(buyUpgrade("reactor_coil", ind) === null, "a coil is fitted");
  tickSim(1 / 60);
  ok(Math.abs(ship.reactor / r0 - 1.1) < 1e-6, `reactor ×1.10 (${ship.reactor.toFixed(1)})`);
  const t0 = ship.thrustScale;
  ok(buyUpgrade("plating", ind) === null, "plating is fitted");
  tickSim(1 / 60);
  ok(Math.abs(ship.thrustScale / t0 - 0.97) < 1e-6 && Math.abs(ship.mods.hull / upgradeMods().hull - ship.mods.hull / 1.15) < 1e-9, "plating: thrust ×0.97, hull ×1.15");
  const cap0 = sim.crewCapacity;
  ok(buyUpgrade("quarters", ind) === null, "quarters are fitted");
  tickSim(1 / 60);
  ok(sim.crewCapacity === cap0 + 2, `berths ${cap0} → ${sim.crewCapacity}`);
  /* The bug this pins: the hiring hall computed its own cap off the bare hull stat,
   * so buying berths bought nothing you could hire into — while the robot yard
   * read sim.crewCapacity and would still take a frame. One source now. */
  ok(crewCapacity() === sim.crewCapacity, "crewCapacity() is the one source the hall and the tick both read");
  ok(crewCapacity() === (shipById(currentShipId())?.stats.crew ?? 2) + fx("berths", 0), "…and it is the hull stat plus the refit, never one without the other");
  ok(robotCapacity() === crewCapacity(), "robot frames start level with the berths");
  ok(buyUpgrade("robot_frames", ind) === null && robotCapacity() === crewCapacity() + 2, `frame racks add frames without adding berths (${crewCapacity()} berths, ${robotCapacity()} with frames)`);
  if (log || mil) ok(buyUpgrade("nav_core", log ?? mil) === null && fx("missions", false) === true && hasUpgrade("nav_core"), "the mission core flag reads true once fitted");
  const d = buildDemand(ship, 0, false, 0);
  ship.extraDraw = 3.3;
  ok(Math.abs(buildDemand(ship, 0, false, 0).base - d.base - 3.3) < 1e-9, "extraDraw sits in the demand base");
  ship.extraDraw = 0;
}

/* ---- sell refunds half ------------------------------------------------------------- */
{
  const cr = ship.credits;
  const n = upgrades.owned.length;
  ok(sellUpgrade("battery_bank") === null && ship.credits - cr === 1800 && !hasUpgrade("battery_bank") && upgrades.owned.length === n - 1, "the bank sells for 1,800");
  ok(batteryCap(ship) === BATTERY, "and the cap drops back");
  ok(sellUpgrade("battery_bank") !== null, "selling what you do not own refuses");
  const mine = pilot.mods.mine;
  ok(sellUpgrade("cutter_lens") === null && Math.abs(pilot.mods.mine - mine / 1.12) < 1e-9, "selling the lens takes the mod out at once");
}

/* ---- save / load --------------------------------------------------------------------- */
{
  const owned = [...upgrades.owned];
  ok(owned.length >= 3, `owned: ${owned.join(", ")}`);
  saveUpgrades();
  ok(store.has(UPGRADES_KEY()) && UPGRADES_KEY().includes("RefitTest"), `saved under ${UPGRADES_KEY()}`);
  upgrades.owned.length = 0;
  loadUpgrades();
  ok(upgrades.owned.join() === owned.join() && Math.abs(pilot.mods.cargo / upgradeMods().cargo - pilot.mods.cargo / 1.15) < 1e-9, "load restores the fit and re-applies the mods");
  store.set(UPGRADES_KEY(), JSON.stringify([...owned, "bogus", owned[0]]));
  loadUpgrades();
  ok(upgrades.owned.join() === owned.join(), "unknown and duplicate ids are dropped on load");
  launchSim("RefitTest", "sol");
  ok(upgrades.owned.join() === owned.join() && batteryCap(sim.ship) === BATTERY, "relaunching the sky keeps the fit");
  launchSim("Stranger", "sol");
  ok(upgrades.owned.length === 0 && fx("reactor", 1) === 1 && Math.abs(upgradeMods().cargo - 1) < 1e-9, "another pilot starts stock");
}

console.log(`upgrades: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
