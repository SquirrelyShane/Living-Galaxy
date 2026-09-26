/* LIVING GALAXY — 0.3.58: a belt is mostly empty, and mostly rock.
 *
 * Reported: too many asteroids, and mining alone made you rich (a starter hull
 * on the MINE LOOP made 2,641 cr a minute on 0.3.57; one hold of vein monazite
 * sold for 28,971 cr). Pinned here: rocks per cell, empty cells, the matrix
 * share, the vein share, the look matching the ore, and what a MINE LOOP pays.
 *
 *   node --import ./test/three-register.mjs test/belt.test.mjs
 */
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
Math.random = mulberry32(0x5eed);

const { sim, launchSim, tickSim } = await import("../js/sim.js");
const { makePilot } = await import("../js/pilot.js");
const { rocksInCell, veinAt, BELT, CELL, BELT_HALF_HEIGHT } = await import("../js/field.js");
const { currentSystem } = await import("../js/bodies.js");
const { CLASSES } = await import("../js/bodygen/classes.js");
const { MINE_YIELD } = await import("../js/turrets.js");
const { presets } = await import("../js/mission/script.js");
const { startMission } = await import("../js/mission/run.js");
const { corps } = await import("../js/corps.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

makePilot("BELT", "terran", "mining", null);
launchSim("BeltTest", "sol");
sim.phase = "play";
tickSim(1 / 60);

/* ---- 1. the census of a belt ------------------------------------------------------------ */
const belt = currentSystem.belt;
ok(Boolean(belt), `this sky has a main belt (${Math.round(belt.inner)}–${Math.round(belt.outer)})`);
let cells = 0, empty = 0, rocks = 0, plain = 0, rich = 0, veinCells = 0, lookOk = 0;
const MATRIX_ORES = new Set(["silicate", "regolith", "iron_ore", "carbonaceous"]);
for (let a = 0; a < 360; a += 3) {
  const rad = belt.inner + (belt.outer - belt.inner) * (0.1 + ((a * 7) % 80) / 100);
  const x = Math.cos((a * Math.PI) / 180) * rad, z = Math.sin((a * Math.PI) / 180) * rad;
  const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
  for (const cy of [-1, 0]) {
    cells++;
    if (veinAt(cx, cy, cz, belt)) veinCells++;
    const list = rocksInCell(cx, cy, cz).filter((r) => !r.site && Math.abs(r.y) <= BELT_HALF_HEIGHT);
    if (!list.length) empty++;
    for (const r of list) {
      rocks++;
      if (r.ice) continue;
      if (MATRIX_ORES.has(r.ore)) plain++;
      if (r.rich) rich++;
      if ((CLASSES[r.cls]?.ores?.[r.ore] ?? 0) > 0 || r.rich) lookOk++;
    }
  }
}
const perCell = rocks / cells;
ok(perCell < 4.2 && perCell > 1.5, `about half the rocks a cell used to carry (${perCell.toFixed(2)} a cell; 0.3.57 carried 6.3)`);
ok(empty / cells > 0.12, `a real share of the belt is empty space (${Math.round((empty / cells) * 100)}% of cells)`);
ok(plain / rocks >= 0.55, `most of what you cut is the matrix — silicates, regolith, iron-stone, carbon rock (${Math.round((plain / rocks) * 100)}%)`);
ok(veinCells / cells < 0.07, `vein cells are rare (${veinCells} of ${cells})`);
ok(lookOk / Math.max(1, rocks) > 0.9, `a rock looks like what it carries (${Math.round((lookOk / Math.max(1, rocks)) * 100)}%)`);
ok(BELT.veinShare < 0.8 && MINE_YIELD < 0.5, "a vein is thinner and the cutter slower than 0.3.57");

/* ---- 2. what the MINE LOOP pays ------------------------------------------------------------ */
{
  for (const c of corps) c.standing = 60;
  const ship = sim.ship;
  ship.credits = 5000;
  const cr0 = ship.credits;
  const m = presets().find((p) => p.id === "preset-mine");
  startMission(JSON.parse(JSON.stringify(m)));
  const MIN = 12;
  for (let i = 0; i < 60 * 60 * MIN; i++) tickSim(1 / 60);
  const perMin = (ship.credits - cr0) / MIN;
  ok(perMin > 100, `mining still pays (${Math.round(perMin)} cr a minute on the starter hull)`);
  ok(perMin < 1500, `…but it is a living, not a fortune (${Math.round(perMin)} cr/min; 0.3.57: 2,600–4,300)`);
}

console.log(`belt: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
