// Living Galaxy — contracted hulls.
//
// Fleet objectives shipped in v1.01.72 running on synthetic assets: `wing-mil-patrol-30`,
// a name and a role and no ship anywhere in the world. That was honest scaffolding — it
// proved the order shape without pretending there was a fleet — but it meant dispatching
// a patrol changed a list and nothing else. Nothing left the belt. Nothing came back.
//
// A contracted hull is a real NPC in `S.world.npcs` that has signed with the company. The
// contract is a record on `S.company.fleet`; the ship itself keeps living in the world and
// is marked `contracted` so the rest of the sim can see it is spoken for. An objective now
// binds to one of these, one hull to one objective, and recalling frees the hull rather
// than deleting a row.
//
// The design rule: **the contract is company state, the ship is world state, and neither
// owns the other.** A hull that dies in the world leaves a contract that reconciles itself
// on the next tick rather than a dangling pointer; a save that restores a company before
// the world exists reconciles when the world arrives. Both directions are tested.

import { S } from '../core/state.js';
import { COMPANY } from '../core/config.js';
import { fmtCr } from '../core/utils.js';
import { toast, status } from '../ui/toast.js';
import { hasCompany, fund, book } from './company.js';
import { stream } from '../core/rng.js';
import { recordDiagnostic } from '../data/npc-kb/index.js';

/** The company's contract list. Always an array once a company exists. */
export const roster = () => {
  if (!hasCompany()) return [];
  if (!Array.isArray(S.company.fleet)) S.company.fleet = [];
  return S.company.fleet;
};

/** Live NPC groups, whatever the world happens to be holding. */
const worldNpcs = () => (S.world && S.world.npcs) || [];

/** The world ship a contract points at, or null if it is gone. */
export function hullShip(contract) {
  if (!contract) return null;
  return worldNpcs().find(n => n.userData && n.userData.name === contract.npcName) || null;
}

// Contract ids are seeded and monotonic. The old fleet-order ids were built from
// `Date.now()` and `Math.random()`, which meant a dispatch was not reproducible across a
// save/replay and two peers in a shared galaxy would never agree on one.
let nextSeq = 1;
export function nextContractId() {
  const n = nextSeq++;
  return `hull-${n.toString(36)}-${Math.floor(stream('fleet').next() * 1296).toString(36).padStart(2, '0')}`;
}
/** Called by restore so ids continue past anything already on file. */
export function seedContractSeq(list) {
  let hi = 0;
  for (const c of list || []) {
    const m = /^hull-([0-9a-z]+)-/.exec(c.id || '');
    if (m) hi = Math.max(hi, parseInt(m[1], 36) || 0);
  }
  nextSeq = hi + 1;
}

// ── who will sign ────────────────────────────────────────────────────

// Hostiles do not take company work. Everything else in the world will, at a price, if it
// is close enough for the company to have talked to it.
const SIGNABLE_FACTIONS = ['independent', 'coalition', 'civilian', 'friendly'];

/** Distance from the player's ship, in world units, or Infinity if unplaceable. */
function rangeTo(group) {
  if (!group || !group.position || !S.player || !S.player.position) return Infinity;
  const dx = group.position.x - S.player.position.x;
  const dy = group.position.y - S.player.position.y;
  const dz = group.position.z - S.player.position.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Hulls the company could contract right now: alive, not hostile, not already signed,
 * and inside company sensor range.
 */
export function hullsAvailable(limit = 12) {
  if (!hasCompany()) return [];
  const signed = new Set(roster().map(c => c.npcName));
  const out = [];
  for (const n of worldNpcs()) {
    const u = n.userData;
    if (!u || u.kind !== 'ship' || u.hp <= 0) continue;
    if (u.faction === 'hostile' || u.faction === 'pirate') continue;
    if (!SIGNABLE_FACTIONS.includes(u.faction)) continue;
    if (signed.has(u.name)) continue;
    const dist = rangeTo(n);
    if (!(dist <= COMPANY.hireRange)) continue;
    out.push({
      npcName: u.name,
      role: u.role || 'combat',
      type: u.type,
      faction: u.faction,
      hp: Math.round(u.hp),
      maxHp: Math.round(u.maxHp || u.hp),
      dist: Math.round(dist),
      fee: COMPANY.hireFee
    });
  }
  out.sort((a, b) => a.dist - b.dist);
  return out.slice(0, limit);
}

/** Whether a hire would go through, and the sentence to show if not. */
export function canHire(npcName) {
  if (!hasCompany()) return { ok: false, reason: 'No company on file — register a charter first.' };
  if (roster().length >= COMPANY.fleetCap) {
    return { ok: false, reason: `Fleet is full at ${COMPANY.fleetCap} hulls. Release one first.` };
  }
  if (roster().some(c => c.npcName === npcName)) {
    return { ok: false, reason: 'That hull is already under contract.' };
  }
  const cand = hullsAvailable(999).find(h => h.npcName === npcName);
  if (!cand) return { ok: false, reason: 'That hull is out of range, hostile, or gone.' };
  if (S.company.treasury < COMPANY.hireFee) {
    return { ok: false, reason: `Signing costs ${fmtCr(COMPANY.hireFee)} — the treasury holds ${fmtCr(Math.round(S.company.treasury))}.` };
  }
  return { ok: true, candidate: cand };
}

/**
 * Put a hull under contract.
 * @returns {{ok: boolean, reason?: string, contract?: object}}
 */
export function hireHull(npcName) {
  const gate = canHire(npcName);
  if (!gate.ok) { toast(gate.reason); return gate; }

  if (!fund(COMPANY.hireFee, S.company.charter)) {
    return { ok: false, reason: 'The treasury could not cover the fee.' };
  }

  const c = gate.candidate;
  const contract = {
    id: nextContractId(),
    npcName: c.npcName,
    name: c.npcName,
    role: c.role,
    type: c.type,
    signedAt: S.time || 0,
    orderId: null,
    mode: 'active',       // per-hull default for the next objective it is given
    paid: COMPANY.hireFee
  };
  roster().push(contract);

  const ship = hullShip(contract);
  if (ship && ship.userData) {
    ship.userData.contracted = contract.id;
    ship.userData.faction = ship.userData.faction === 'hostile' ? ship.userData.faction : ship.userData.faction;
  }

  recordDiagnostic({
    subjectId: contract.id,
    t: S.time || 0,
    kind: 'contract',
    situation: 'fleet:hire',
    summary: `${contract.name} signed with ${S.company.name} for ${fmtCr(COMPANY.hireFee)}`,
    context: { role: contract.role, type: contract.type },
    salience: 0.5,
    tags: ['fleet', 'contract', contract.role]
  });

  status(`${contract.name} under contract — ${contract.role} hull`);
  return { ok: true, contract };
}

/** End a contract. Frees the hull and clears any objective it was flying. */
export function releaseHull(id, opts = {}) {
  const list = roster();
  const i = list.findIndex(c => c.id === id || c.npcName === id);
  if (i < 0) return { ok: false, reason: 'No such contract.' };
  const c = list[i];

  const ship = hullShip(c);
  if (ship && ship.userData && ship.userData.contracted === c.id) ship.userData.contracted = null;

  list.splice(i, 1);
  if (!opts.silent) status(`${c.name} released from contract`);
  return { ok: true, contract: c, orderId: c.orderId || null };
}

// ── binding to objectives ────────────────────────────────────────────

/** Contracts with no objective, optionally filtered to a hull role. */
export function freeHulls(role = null) {
  return roster().filter(c => !c.orderId && (!role || c.role === role));
}

/**
 * The best free hull for an order that wants one of `requires`.
 * Returns null when nothing on the roster fits — the caller turns that into a refusal
 * the player can act on rather than silently inventing an asset.
 */
export function pickHull(requires) {
  const free = freeHulls();
  if (!free.length) return null;
  if (!requires || !requires.length) return free[0];
  return free.find(c => requires.includes(c.role)) || null;
}

/** Mark a contract as flying an objective. */
export function bindHull(id, orderId) {
  const c = roster().find(x => x.id === id);
  if (!c) return false;
  c.orderId = orderId;
  return true;
}

/** Free a contract from its objective. */
export function unbindHull(orderId) {
  let freed = 0;
  for (const c of roster()) if (c.orderId === orderId) { c.orderId = null; freed++; }
  return freed;
}

/** Set the mode a hull's next objective defaults to. */
export function setHullMode(id, mode) {
  const c = roster().find(x => x.id === id);
  if (!c) return false;
  c.mode = mode === 'passive' ? 'passive' : 'active';
  return true;
}

// ── the tick ─────────────────────────────────────────────────────────

/**
 * Upkeep, and reconciliation against the world.
 *
 * Reconciliation is the half that matters: a contracted hull can be destroyed, despawned
 * or simply not exist yet because the company restored before the world did. A contract
 * whose ship is missing is held, not dropped, for one grace interval — otherwise a load
 * order that happens to restore the company first would quietly cancel the whole fleet.
 */
export function updateFleet(dt) {
  if (!hasCompany() || !(dt > 0)) return;
  const co = S.company;
  const list = roster();

  // Reconcile. `missingFor` accrues only while a world exists to be missing from.
  if (worldNpcs().length) {
    for (let i = list.length - 1; i >= 0; i--) {
      const c = list[i];
      const ship = hullShip(c);
      if (ship && ship.userData && ship.userData.hp > 0) {
        c.missingFor = 0;
        if (ship.userData.contracted !== c.id) ship.userData.contracted = c.id;
        continue;
      }
      c.missingFor = (c.missingFor || 0) + dt;
      if (c.missingFor > 30) {
        recordDiagnostic({
          subjectId: c.id,
          t: S.time || 0,
          kind: 'contract',
          situation: 'fleet:lost',
          summary: `${c.name} is gone — contract closed`,
          salience: 0.8,
          tags: ['fleet', 'contract', 'lost']
        });
        toast(`${c.name} lost — contract closed`, 4200);
        list.splice(i, 1);
      }
    }
  }

  co.upkeepT = (co.upkeepT || 0) + dt;
  if (co.upkeepT < COMPANY.upkeepInterval) return;
  co.upkeepT = 0;
  if (!list.length) return;

  const due = list.length * COMPANY.hireUpkeep;
  if (co.treasury >= due) {
    book(-due, co.charter);
    return;
  }

  // Cannot pay. Release the newest contract rather than letting the treasury go negative —
  // the board's solvency seat is the one that ends a company, and a fleet that quietly
  // bankrupts you is worse than a fleet that shrinks.
  const last = list[list.length - 1];
  releaseHull(last.id, { silent: true });
  toast(`Cannot meet fleet upkeep — ${last.name} released`, 4600);
  status(`Upkeep unpaid: ${last.name} released from contract`);
}

// ── reporting ────────────────────────────────────────────────────────

export function fleetRoster() {
  return roster().map(c => {
    const ship = hullShip(c);
    const u = ship && ship.userData;
    return {
      id: c.id,
      name: c.name,
      role: c.role,
      type: c.type,
      mode: c.mode || 'active',
      orderId: c.orderId || null,
      busy: !!c.orderId,
      alive: !!(u && u.hp > 0),
      hp: u ? Math.round(u.hp) : null,
      maxHp: u ? Math.round(u.maxHp || u.hp) : null,
      dist: ship ? Math.round(rangeTo(ship)) : null,
      upkeep: COMPANY.hireUpkeep
    };
  });
}

/** One line for ARIA and the dock. */
export function fleetBrief() {
  const list = fleetRoster();
  if (!hasCompany()) return 'No company on file.';
  if (!list.length) return `${S.company.name} has no hulls under contract.`;
  const busy = list.filter(h => h.busy).length;
  return `${list.length} hull${list.length === 1 ? '' : 's'} under contract, ${busy} on objective, ` +
         `upkeep ${fmtCr(list.length * COMPANY.hireUpkeep)} per cycle.`;
}
