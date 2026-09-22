/* LIVING GALAXY — hull spec + yard bill sanity.
 *
 * The bridge between the fleet registry and the ship generator must give
 * every def a real generator class, a drive the generator knows, and a parts
 * list made only of catalogue parts — and the yard must price every hull to
 * a finite, tier-ordered number with a raw-stock bill behind it. Pure data:
 * no three.js needed.
 *
 *   node --import ./test/three-register.mjs test/hullspec.test.mjs
 */

import { SHIP_DB, SIZE_BANDS } from "../js/shipdb.js";
import { hullSpec, genConfig, manifestTotals, MODULE_PARTS, registerAll } from "../js/hullspec.js";
import { componentBill, yardQuote, stockLines, partPrice, STOCK_MAP } from "../js/shipcost.js";
import { SHIP_CLASSES } from "../js/shipgen/data/classes.js";
import { PARTS } from "../js/shipgen/data/catalog/index.js";
import { DRIVE_TYPES } from "../js/shipgen/data/drives.js";
import { MATERIALS } from "../js/shipgen/data/materials.js";
import { MINERALS } from "../js/materials.js";
import { normalizeConfig, loadoutFor } from "../js/shipgen/generate.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.error("  FAIL", msg); } };

registerAll(SHIP_DB);

/* Every module word the grammar can use maps to real parts. */
const words = new Set();
for (const d of SHIP_DB) for (const m of d.grammar.modules ?? []) words.add(m);
for (const w of words) {
  ok(MODULE_PARTS[w]?.length > 0, `module "${w}" has a catalogue kit`);
  for (const id of MODULE_PARTS[w] ?? []) ok(PARTS[id], `module "${w}" → ${id} exists`);
}

/* Every raw stock the generator knows lands on a game mineral. */
const minerals = new Set(MINERALS.map((m) => m.id));
for (const m of Object.keys(MATERIALS)) {
  ok(STOCK_MAP[m] && minerals.has(STOCK_MAP[m]), `${m} maps to a mineral (${STOCK_MAP[m]})`);
}

const seenClasses = new Set();
const byTier = {};
for (const d of SHIP_DB) {
  const s = hullSpec(d);
  ok(hullSpec(d) === s, `${d.id}: spec cached`);
  ok(SHIP_CLASSES[s.classKey]?.registry === d.id, `${d.id}: registered as ${s.classKey}`);
  ok(SHIP_CLASSES[s.baseClass] && !SHIP_CLASSES[s.baseClass].registry, `${d.id}: base doctrine ${s.baseClass} is a generator class`);
  ok(DRIVE_TYPES[s.drive], `${d.id}: drive ${s.drive}`);
  ok(s.drivePart?.drive === s.drive, `${d.id}: drive core part ${s.drivePart?.id}`);
  ok(["vleo", "deep"].includes(s.regime), `${d.id}: regime ${s.regime}`);
  const cls = SHIP_CLASSES[s.classKey];
  ok(cls.engines[0] === d.grammar.engines[0] && cls.engines[1] === d.grammar.engines[1], `${d.id}: engine count carried over`);
  ok(cls.weapons === d.grammar.weapons, `${d.id}: weapon weight carried over`);
  ok(cls.length[0] <= 90 * 1.04 + 1e-6, `${d.id}: generator length capped (${cls.length[1].toFixed(1)} m)`);

  const ids = Object.keys(s.loadout);
  ok(ids.length >= 15, `${d.id}: ≥15 distinct parts (${ids.length})`);
  ok(ids.every((id) => PARTS[id] && s.loadout[id] > 0), `${d.id}: loadout is catalogue-only`);
  const turrets = ids.filter((id) => PARTS[id].tags.includes("weapon") && !PARTS[id].tags.includes("ammo") && !PARTS[id].tags.includes("internal")).reduce((a, id) => a + s.loadout[id], 0);
  ok(turrets >= d.stats.turrets, `${d.id}: ≥${d.stats.turrets} weapon mounts fitted (${turrets})`);
  if (d.grammar.weapons === "none" && d.stats.turrets === 0) ok(turrets === 0, `${d.id}: unarmed hull carries no weapons`);
  ok(ids.some((id) => PARTS[id].tags.includes("power") && PARTS[id].pwr > 0), `${d.id}: has a power plant`);
  if (d.stats.reactor > 70) ok(ids.some((id) => PARTS[id].tags.includes("reactor")), `${d.id}: has a reactor`);
  for (const m of d.grammar.modules ?? []) for (const id of MODULE_PARTS[m]) ok(s.loadout[id] > 0, `${d.id}: module ${m} fitted ${id}`);

  /* The generator accepts the config as-is and keeps the whole loadout. */
  const cfg = normalizeConfig(genConfig(d, "S", {}));
  ok(cfg.shipClass === s.classKey, `${d.id}: generator keeps the synthetic class`);
  const lo = loadoutFor(cfg);
  ok(Object.keys(lo).length === ids.length, `${d.id}: no part pruned by the generator gates`);
  const lite = genConfig(d, "S", { detail: "lite" });
  ok(Object.keys(lite.loadout).length < ids.length && lite.greeble === false, `${d.id}: lite config is smaller`);

  const tot = manifestTotals(s);
  ok(tot.count >= ids.length && tot.mass > 0, `${d.id}: manifest totals`);

  /* Yard bill. */
  const bill = componentBill(d);
  ok(Number.isFinite(bill.total) && bill.total > 0, `${d.id}: finite price (${bill.total})`);
  ok(bill.lines[0].section === "frame" && bill.lines.at(-1).section === "labour", `${d.id}: frame first, labour last`);
  ok(bill.lines.filter((l) => l.parts.length).every((l) => l.cost === l.parts.reduce((a, p) => a + p.each * p.count, 0)), `${d.id}: section cost is the sum of its parts`);
  ok(bill.partCount === tot.count, `${d.id}: bill counts the manifest`);
  const stock = stockLines(d);
  ok(stock.length >= 5 && stock.every((r) => r.tonnes > 0 && Number.isFinite(r.value)), `${d.id}: raw stock bill`);
  const q = yardQuote(d, { complexId: d.complex, letter: "G" });
  ok(q.inLine && q.total < q.list, `${d.id}: issue rate applies in line`);
  (byTier[d.tier] ??= []).push(yardQuote(d).list);
  seenClasses.add(s.baseClass);
}

/* Tiers stay ordered on average, and the bands stay where the economy was balanced. */
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const bands = { A: 4873, B: 13106, C: 24514, D: 50967, E: 88381, F: 168238, G: 416900 };
let prev = 0;
for (const t of "ABCDEFG") {
  const m = avg(byTier[t]);
  ok(m > prev, `tier ${t} prices above tier ${prev ? String.fromCharCode(t.charCodeAt(0) - 1) : "—"} (${Math.round(m)})`);
  ok(m > bands[t] * 0.8 && m < bands[t] * 1.25, `tier ${t} within the balanced band (${Math.round(m)} vs ${bands[t]})`);
  prev = m;
}
ok(seenClasses.size >= 10, `registry spans ≥10 generator doctrines (${[...seenClasses].join(", ")})`);

/* Part prices: every catalogue part prices to a finite number, weapons cost more than whips. */
let priced = 0;
for (const p of Object.values(PARTS)) { const pp = partPrice(p); if (Number.isFinite(pp.price) && pp.price >= 0) priced++; }
ok(priced === Object.keys(PARTS).length, `all ${Object.keys(PARTS).length} catalogue parts price (${priced})`);
ok(partPrice(PARTS["wp.rail"]).price > partPrice(PARTS["cm.omni"]).price * 10, "a railgun outprices an omni whip");

ok(SIZE_BANDS.length === 7, "size bands untouched");
console.log(`hullspec: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
