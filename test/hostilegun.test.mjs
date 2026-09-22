/* LIVING GALAXY — who is shooting at you, and with what.
 *
 *   node --import ./test/three-register.mjs test/hostilegun.test.mjs
 *
 * THE BUG THIS EXISTS TO PREVENT.
 *
 * js/turrets.js has two loops that shoot at the player. `stepDrones` fires the
 * ambient swarm this file spawns itself. `stepPirates` fires everything in
 * HOSTILE_ROLES — and js/npc/rogues.js does `HOSTILE_ROLES.add("rogue")`, so
 * the 0.3.30 nest wave drones, the ones that actually swarm the belt, were
 * firing on the PIRATE profile: 6 damage on a 1.16 s cycle, 5.19 dps each,
 * against 1.82 for a drone.
 *
 * 0.3.34 lowered "drone damage" from 7 to 4 and measured it — against the
 * wrong loop. The drones doing the killing never changed. Measured end to end
 * through the real chain, a trainer died to seven nest drones in six seconds
 * and to a fifteen-drone surge in three, while the patch notes claimed
 * eighteen and seven.
 *
 * The lesson is not "check the number", it is that ONE gun for everything in
 * a set that other modules can add to is a bug waiting for the next arrival.
 * So the profile is per role, and this suite fails if a hostile role ever
 * appears without one, or if a drone is ever handed a crewed hull's gun.
 */
import { readFileSync } from "node:fs";
import { HOSTILE_ROLES } from "../js/npc/traffic.js";
import "../js/npc/rogues.js";          // this is what adds "rogue" to the set

const ROOT = new URL("../", import.meta.url).pathname;
const src = readFileSync(ROOT + "js/turrets.js", "utf8");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

const num = (re, what) => {
  const m = src.match(re);
  ok(Boolean(m), `${what} is readable from the source`);
  return m ? Number(m[1]) : NaN;
};

/* ---- 1. every hostile role has its own gun ------------------------------- */
{
  const table = src.match(/const HOSTILE_GUN = \{([\s\S]*?)\n\};/);
  ok(Boolean(table), "there is a per-role gun table");
  const roles = [...(table?.[1] ?? "").matchAll(/^\s{2}(\w+):\s*\{/gm)].map((m) => m[1]);
  ok(roles.length >= 2, `it covers more than one role (${roles.join(", ")})`);

  /* the actual guard: nothing hostile may fall through to a default it was
   * never designed for */
  const missing = [...HOSTILE_ROLES].filter((r) => !roles.includes(r));
  ok(
    missing.length === 0,
    `every hostile role has a gun profile — missing: ${missing.join(", ") || "none"}. ` +
    "A role added to HOSTILE_ROLES without one silently inherits a crewed raider's gun, which is exactly how the nest drones ended up at 2.9x their intended damage.",
  );
  ok(HOSTILE_ROLES.has("rogue"), "…and rogue really is in the set, which is what made this possible");
  ok(HOSTILE_ROLES.has("pirate"), "…alongside pirate");
}

/* ---- 2. a drone does not shoot like a crewed hull ------------------------ */
{
  const droneDmg = num(/const DRONE_DMG = ([\d.]+)/, "the drone's damage");
  const pirateDmg = num(/pirate:\s*\{\s*dmg:\s*([\d.]+)/, "the pirate's damage");
  const pirateWing = num(/pirate:\s*\{[^}]*wing:\s*([\d.]+)/, "the pirate's wing damage");

  ok(droneDmg < pirateDmg, `a nest drone hits softer than a crewed raider (${droneDmg} vs ${pirateDmg})`);
  ok(droneDmg <= 4, `and the drone gun is at or below the level this was tuned to (${droneDmg})`);

  /* the rogue entry must actually reference the drone constants rather than
   * repeating a literal that can drift away from them */
  const rogue = src.match(/rogue:\s*\{([^}]*\}[^}]*)\}/)?.[1] ?? "";
  ok(/dmg:\s*DRONE_DMG/.test(rogue), "the rogue profile uses DRONE_DMG itself, so the two can never drift apart");
  ok(/DRONE_CD_MIN/.test(rogue) && /DRONE_CD_SPAN/.test(rogue), "…and the drone's cadence, not the pirate's");
  ok(/wing:\s*DRONE_DMG/.test(rogue), "a wave is not a wing: a rogue gets no engagement bonus");
  ok(pirateWing > pirateDmg, `a crewed wing still hits harder than a lone raider (${pirateWing} vs ${pirateDmg})`);
}

/* ---- 3. the dps that follows from all of it ------------------------------ */
{
  const droneDmg = num(/const DRONE_DMG = ([\d.]+)/, "drone damage");
  const cdMin = num(/DRONE_CD_MIN = ([\d.]+)/, "drone cooldown floor");
  const cdSpan = num(/DRONE_CD_SPAN = ([\d.]+)/, "drone cooldown span");
  const pirateDmg = num(/pirate:\s*\{\s*dmg:\s*([\d.]+)/, "pirate damage");
  const pirateRate = num(/const PIRATE_RATE = ([\d.]+)/, "pirate rate");

  const droneDps = droneDmg / (cdMin + cdSpan / 2);
  const pirateDps = pirateDmg / (pirateRate * 1.05);
  ok(droneDps < pirateDps, `a drone is the lesser threat per hull (${droneDps.toFixed(2)} vs ${pirateDps.toFixed(2)} dps)`);
  ok(droneDps < 2, `a single drone cannot out-damage a screen's regen on its own (${droneDps.toFixed(2)} dps)`);

  /* the surge case, which is the one that was killing people */
  const surge = droneDps * 15;
  ok(surge < 40, `a fifteen-drone surge lands ${surge.toFixed(0)} dps — it was 78 when they were on the pirate gun`);
  ok(surge > 12, `…but a surge is still a surge (${surge.toFixed(0)} dps)`);
}

/* ---- 4. the loops are still where we think they are ---------------------- */
{
  ok(/function stepDrones\(/.test(src) && /function stepPirates\(/.test(src), "both fire loops are still here");
  ok(/HOSTILE_GUN\[c\.role\]/.test(src), "stepPirates picks the gun by the shooter's role");
  ok(!/fire\(c, ship\.pos, 560, inWing \? 8 : 6, c\.id, "hostile"\)/.test(src),
    "the old one-gun-for-everything line is gone");
}

console.log(`hostilegun: ${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
