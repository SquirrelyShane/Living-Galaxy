/* LIVING GALAXY — what a hull can take.
 *
 *   node --import ./test/three-register.mjs test/defence.test.mjs
 *
 * Reported: rogue drones kill you quickly and there is nothing to be done
 * about it. The measurement behind 0.3.34:
 *
 *   EVERY hull in the game had exactly 100 hull and 100 shield. Not a balance
 *   choice — `hullMaxOf()` read `ship.hullMax ?? 100` and nothing anywhere
 *   ever set `hullMax`. A 468,000 cr World Frame at 7,500 tonnes was as
 *   fragile as a 4,400 cr skiff at nine, and tier bought thrust, cargo and
 *   reactor but not one point of survivability.
 *
 *   Seven drones killed a stock hull in 8.5 seconds. A full fifteen-drone
 *   surge did it in 3.6. The best armour refit in the game bought 0.9 extra
 *   seconds. And since 0.3.33 a hull at zero is a hull gone for good.
 *
 * So this suite pins three things that have to hold together: that the pools
 * come off the frame, that shields and armour are good at opposite things,
 * and that the numbers land where they were aimed — dangerous, escapable, and
 * meaningfully different between a trainer and a capital frame.
 */

import {
  KINDS, POOL, RESIST_CAP, SHIELD_RESIST,
  hullPoolFor, shieldPoolFor, resistsFor, defenceReport, throughShield, throughArmour,
} from "../js/defence.js";
import { SHIP_DB, shipById, DEFAULT_SHIP_ID } from "../js/shipdb.js";
import { makeShip, applyDamage } from "../js/ship.js";
import { UPGRADES } from "../js/upgrades.js";
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const byTier = (t) => SHIP_DB.filter((d) => d.tier === t);

/* ---- 1. the pools come off the frame ------------------------------------- */
{
  const a = byTier("A")[0], g = byTier("G")[0];
  ok(hullPoolFor(a) < hullPoolFor(g), `a G frame outlasts an A (${hullPoolFor(a)} vs ${hullPoolFor(g)} hull)`);
  const ratio = hullPoolFor(g) / hullPoolFor(a);
  ok(ratio > 5 && ratio < 15, `…by a real margin but not an absurd one (x${ratio.toFixed(1)}; mass differs by x${(g.stats.massT / a.stats.massT).toFixed(0)})`);
  ok(shieldPoolFor(g) > shieldPoolFor(a), `and carries a bigger screen (${shieldPoolFor(a)} vs ${shieldPoolFor(g)})`);

  /* monotonic up the tiers — no tier is a downgrade in survivability */
  let last = 0, monotonic = true;
  for (const t of "ABCDEFG") {
    const h = Math.max(...byTier(t).map(hullPoolFor));
    if (h < last) monotonic = false;
    last = h;
  }
  ok(monotonic, "hull pools never go backwards up the tiers");

  /* and the whole registry is sane */
  const pools = SHIP_DB.map(hullPoolFor);
  ok(pools.every((p) => p >= 50 && p <= POOL.hullCap), `every one of the ${SHIP_DB.length} hulls lands in range (${Math.min(...pools)}–${Math.max(...pools)})`);
  ok(SHIP_DB.map(shieldPoolFor).every((p) => p > 0 && p <= POOL.shieldCap), "…and every screen does too");
  ok(hullPoolFor(null) === POOL.hullBase && shieldPoolFor({}) === POOL.shieldBase, "an unknown hull falls back rather than returning NaN");

  /* the thing that was actually broken: the trainer is no longer the same as
   * a capital frame */
  const trainer = shipById(DEFAULT_SHIP_ID);
  ok(hullPoolFor(trainer) !== hullPoolFor(g), "the trainer and a World Frame are no longer the same ship defensively");
}

/* ---- 2. shields and armour are good at opposite things ------------------- */
{
  const d = byTier("D")[0];
  const r = resistsFor(d, null);
  ok(r.shield.em > r.shield.kinetic, `a screen bleeds off induction better than it stops mass (${Math.round(r.shield.em * 100)}% vs ${Math.round(r.shield.kinetic * 100)}%)`);
  ok(r.hull.kinetic > r.hull.em, `plate is the reverse (${Math.round(r.hull.kinetic * 100)}% kinetic vs ${Math.round(r.hull.em * 100)}% em)`);
  ok(SHIELD_RESIST.kinetic === 0, "a bare screen stops no part of a round at all — that is why drones go through it");

  for (const k of KINDS) {
    ok(r.hull[k] <= RESIST_CAP && r.shield[k] <= RESIST_CAP, `${k} resistance is capped short of immunity`);
  }
  /* heavier frames carry more plate */
  const a = resistsFor(byTier("A")[0]), g = resistsFor(byTier("G")[0]);
  ok(g.hull.kinetic > a.hull.kinetic, `a G frame is better plated (${Math.round(g.hull.kinetic * 100)}% vs ${Math.round(a.hull.kinetic * 100)}%)`);
  ok(g.shield.em === a.shield.em, "but a screen is a screen — the field does not care what it is bolted to");

  /* the yard's trade shows in the profile */
  const sec = SHIP_DB.find((x) => x.complex === "security" && x.tier === "D");
  const res = SHIP_DB.find((x) => x.complex === "research" && x.tier === "D");
  if (sec && res) {
    ok(resistsFor(sec).hull.kinetic > resistsFor(res).hull.kinetic, "a security frame is plated against being shot");
    ok(resistsFor(res).hull.em > resistsFor(sec).hull.em, "a research frame is shielded against its own instruments");
  }
}

/* ---- 3. the arithmetic does what it says --------------------------------- */
{
  const r = { hull: { kinetic: 0.25, thermal: 0, em: 0 }, shield: { kinetic: 0, thermal: 0.5, em: 0 } };
  ok(throughArmour(100, "kinetic", r) === 75, "25% armour lets three quarters through");
  ok(throughShield(100, "thermal", r) === 50, "50% shield resistance halves a beam");
  ok(throughShield(100, "kinetic", r) === 100, "and zero resistance changes nothing");
  ok(throughArmour(100, "kinetic", null) === 100, "no profile is not a crash");
}

/* ---- 4. damage kind reaches the ship ------------------------------------- */
{
  const mk = (resists) => {
    const s = makeShip();
    s.powered = { shields: false };      // straight to the plate, so armour is what we measure
    s.pressurized = true;
    s.mods = { hull: 1 };
    s.hullMax = 500; s.hull = 500; s.shieldMax = 0; s.shieldCharge = 0;
    s.resists = resists;
    return s;
  };
  const prof = { hull: { kinetic: 0.5, thermal: 0, em: 0 }, shield: { kinetic: 0, thermal: 0, em: 0 } };
  const a = mk(prof), b = mk(prof), c = mk(null);
  applyDamage(a, 100, null, 0, "kinetic");
  applyDamage(b, 100, null, 0, "thermal");
  applyDamage(c, 100, null, 0, "kinetic");
  ok(a.hull === 450, `a resisted kind lands for half (${500 - a.hull} of 100)`);
  ok(b.hull === 400, `an unresisted kind lands in full (${500 - b.hull} of 100)`);
  ok(c.hull === 400, "a ship with no profile takes it all, as before");

  /* the default is kinetic, so an old call site keeps its old meaning */
  const d = mk(prof);
  applyDamage(d, 100, null, 0);
  ok(d.hull === 450, "applyDamage defaults to kinetic");

  /* the screen spends itself first, and resists on the way in */
  const e = mk({ hull: { kinetic: 0, thermal: 0, em: 0 }, shield: { kinetic: 0, thermal: 0, em: 0.5 } });
  e.powered = { shields: true }; e.shieldMax = 100; e.shieldCharge = 100;
  applyDamage(e, 50, null, 0, "em");
  ok(e.shieldCharge < 100 && e.hull === 500, "the screen takes it before the hull does");
  ok(e.shieldCharge === 60, `and a 50% screen resist spends 40 rather than 80 (${e.shieldCharge} left)`);
}

/* ---- 5. armour is something you can buy ---------------------------------- */
{
  const withResist = UPGRADES.filter((u) => u.resist);
  ok(withResist.length >= 3, `${withResist.length} refits carry resistance (before 0.3.34: none did)`);
  const d = byTier("C")[0];
  const bare = resistsFor(d, null);
  const plated = resistsFor(d, { resist: { kinetic: 0.12 } });
  ok(plated.hull.kinetic > bare.hull.kinetic, `plating moves the number (${Math.round(bare.hull.kinetic * 100)}% → ${Math.round(plated.hull.kinetic * 100)}%)`);
  const screened = resistsFor(d, { resist: { shield_kinetic: 0.10 } });
  ok(screened.shield.kinetic > bare.shield.kinetic, "a screen lattice gives the field something to bite mass with");
  ok(screened.hull.kinetic === bare.hull.kinetic, "…and does nothing for the plate, which is the point of having two");

  /* stacking everything must still not make anyone immune */
  const stacked = resistsFor(byTier("G")[0], { resist: { kinetic: 5, thermal: 5, em: 5, shield_em: 5 } });
  for (const k of KINDS) ok(stacked.hull[k] <= RESIST_CAP && stacked.shield[k] <= RESIST_CAP, `${k} stays capped even stacked absurdly (${Math.round(stacked.hull[k] * 100)}%)`);
}

/* ---- 6. where the numbers actually land ---------------------------------- */
{
  /* the whole reason for the patch. A drone round is 4 kinetic on a 1.5–2.9 s
   * cycle (js/turrets.js); this is that, against the real damage model. */
  const DRONE_DMG = 4;
  function ttk(def, n, seedOffset = 0) {
    const s = makeShip();
    s.powered = { shields: true }; s.pressurized = true; s.mods = { hull: 1 };
    s.hullMax = hullPoolFor(def); s.hull = s.hullMax;
    s.shieldMax = shieldPoolFor(def); s.shieldCharge = s.shieldMax;
    s.resists = resistsFor(def, null);
    const dt = 1 / 30;
    let t = 0;
    /* fixed phase offsets rather than Math.random, so this is a measurement
     * and not a lottery */
    const cds = Array.from({ length: n }, (_, i) => ((i + seedOffset) % 7) * 0.31);
    while (t < 1200 && s.hull > 0) {
      t += dt;
      if (s.shieldCharge < s.shieldMax) s.shieldCharge = Math.min(s.shieldMax, s.shieldCharge + 5.5 * (s.shieldMax / 100) * dt);
      for (let i = 0; i < cds.length; i++) {
        cds[i] -= dt;
        if (cds[i] > 0) continue;
        cds[i] = 2.2;                       // the mean of 1.5 + 0…1.4
        applyDamage(s, DRONE_DMG, null, t, "kinetic");
      }
    }
    return s.hull > 0 ? Infinity : t;
  }

  const trainer = shipById(DEFAULT_SHIP_ID);
  const pack = ttk(trainer, 7);
  const surge = ttk(trainer, 15);
  ok(pack > 12, `a trainer survives a seven-drone pack for a usable stretch (${pack.toFixed(0)}s; it was 8.5s before 0.3.34)`);
  ok(pack < 60, `…but not indefinitely — the belt is still somewhere you think twice about (${pack.toFixed(0)}s)`);
  ok(surge > 4, `a full fifteen-drone surge leaves time to run (${surge.toFixed(0)}s; it was 3.6s)`);
  ok(surge < pack, "…and a surge is still worse than a pack");

  /* tier has to be worth buying */
  const mid = ttk(byTier("D")[0], 7);
  const cap = ttk(byTier("G")[0], 7);
  ok(mid > pack * 1.5, `a mid-tier frame is meaningfully harder to kill (${mid.toFixed(0)}s vs ${pack.toFixed(0)}s)`);
  ok(cap > mid, `and a capital frame harder again (${cap.toFixed(0)}s)`);
  ok(ttk(trainer, 1) === Infinity, "one drone alone can never finish a hull — the screen outruns it");
}

/* ---- 7. NPC hulls are measured the same way ------------------------------ */
{
  /* 0.3.39. `hullPerf` scaled toughness by `clamp(massT / 60, 0.6, 2.4)` —
   * linear and clamped, against a registry whose mass runs 9 t to 7,500 t.
   * It SATURATED AT 144 t, so a 260 t barge, a 700 t, a 2,200 t and a 7,500 t
   * all came out at exactly 624 hp and 139 shield: four tiers with no
   * difference between them. The bottom was truncated too.
   *
   * It uses the same power curve as the player's pools now, so both sides of
   * a fight are measured the same way — which is the point of checking it
   * here, in the suite that owns that curve. */
  const { hullPerf } = await import("../js/npc/flight.js");
  const perf = (t) => hullPerf({ role: "hauler", ship: byTier(t)[0].id });

  const tiers = [...("ABCDEFG")].map((t) => perf(t).hp);
  for (let i = 1; i < tiers.length; i++) {
    ok(tiers[i] > tiers[i - 1], `an NPC ${("ABCDEFG")[i]} frame outlasts a ${("ABCDEFG")[i - 1]} (${tiers[i - 1]} → ${tiers[i]} hp)`);
  }
  ok(new Set(tiers).size === tiers.length, `every tier is distinct (${tiers.join(", ")}) — four of them used to be identical`);

  const all = SHIP_DB.map((d) => hullPerf({ role: "hauler", ship: d.id }).hp);
  const spread = Math.max(...all) / Math.min(...all);
  ok(spread > 6, `NPC toughness spans the registry (x${spread.toFixed(1)}; the clamp held it to x4.0)`);
  const pool = SHIP_DB.map(hullPoolFor);
  const playerSpread = Math.max(...pool) / Math.min(...pool);
  ok(Math.abs(spread - playerSpread) < 3, `…on roughly the player's own curve (NPC x${spread.toFixed(1)} vs player x${playerSpread.toFixed(1)})`);

  /* screens come off the plant on both sides */
  const small = hullPerf({ role: "hauler", ship: byTier("A")[0].id });
  const big = hullPerf({ role: "hauler", ship: byTier("G")[0].id });
  ok(big.shield > small.shield, `a bigger plant holds a bigger screen (${small.shield} → ${big.shield})`);

  /* and no role falls through to a default nobody tuned */
  const src = readFileSync(new URL("../js/npc/flight.js", import.meta.url).pathname, "utf8");
  const tough = src.match(/const TOUGH = \{([\s\S]*?)\n\};/)?.[1] ?? "";
  const accel = src.match(/const ACCEL = \{([^}]*)\}/)?.[1] ?? "";
  const roles = [...accel.matchAll(/(\w+):/g)].map((m) => m[1]);
  const missing = roles.filter((r) => !new RegExp(`\\b${r}:`).test(tough));
  ok(missing.length === 0,
    `every role with a flight profile has a toughness profile — missing: ${missing.join(", ") || "none"}. ` +
    "supply and rogue were in ACCEL and TURN but not TOUGH, so both silently took DEFAULT_TOUGH.");
  ok(/rogue:/.test(tough), "a nest drone has numbers of its own rather than a generic hull's");
  const rogue = hullPerf({ role: "rogue", ship: "salvage_a" });
  const trader = hullPerf({ role: "trader", ship: "salvage_a" });
  ok(rogue.hp < trader.hp, `and it is the more fragile of the two (${rogue.hp} vs ${trader.hp} hp) — the wave is the threat, not the unit`);
}

/* ---- 8. the report a pilot reads ----------------------------------------- */
{
  const d = byTier("E")[0];
  const r = defenceReport(d, null);
  ok(r.hullMax === hullPoolFor(d) && r.shieldMax === shieldPoolFor(d), "the report carries both pools");
  ok(KINDS.every((k) => Number.isInteger(r.hull[k]) && Number.isInteger(r.shield[k])), "resistances come out as whole percentages");
  ok(r.tier === d.tier && r.complex === d.complex, "and it says which frame it is describing");
  const withMods = defenceReport(d, { hull: 1.15 });
  ok(withMods.hullMax > r.hullMax, `a hull modifier raises the pool (${r.hullMax} → ${withMods.hullMax})`);
}

console.log(`defence: ${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
