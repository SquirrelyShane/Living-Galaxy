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
import { COMPANY, FLEET_ROLES, NPC_TYPES } from '../core/config.js';
import { fmtCr } from '../core/utils.js';
import { toast, status } from '../ui/toast.js';
import { hasCompany, fund, book } from './company.js';
import { spawnNpc } from '../entities/npcs.js';
import { stream } from '../core/rng.js';
import { recordDiagnostic } from '../data/npc-kb/index.js';
import { holdMass, holdCap } from './holds.js';
import { transmit } from './comms.js';
import { creditFleetProgress } from './orders.js';
import { hide, show, HIDE } from '../world/visibility.js';

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
    paid: COMPANY.hireFee,
    // Conscripted under a company contract, so the company owns the charter on it.
    owner: OWNER.COMPANY
  };
  roster().push(contract);

  const ship = hullShip(contract);
  if (ship && ship.userData) {
    ship.userData.contracted = contract.id;
    applyFleetTuning(ship.userData);
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
  if (ship && ship.userData && ship.userData.contracted === c.id) {
    ship.userData.contracted = null;
    clearFleetTuning(ship.userData);
  }

  list.splice(i, 1);
  if (!opts.silent) status(`${c.name} released from contract`);
  return { ok: true, contract: c, orderId: c.orderId || null };
}

// ── binding to objectives ────────────────────────────────────────────

/** Contracts with no objective, optionally filtered to a hull role. */
export function freeHulls(role = null) {
  // A hull the pilot has taken back is still on the roster — you can see it, refit it and
  // hand it over again — but it does not take company objectives.
  return roster().filter(c => !c.orderId && !(c.refitT > 0) &&
                              ownerOf(c) === OWNER.COMPANY &&
                              (!role || c.role === role));
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
        applyFleetTuning(ship.userData);
        watchForAttack(c, ship.userData, dt);
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

  // Yard time. A hull in refit is unavailable and cannot be dispatched — canRefit()
  // refuses a second one, and pickHull() skips it below.
  for (const c of list) {
    if (!(c.refitT > 0)) continue;
    c.refitT -= dt;
    if (c.refitT <= 0) completeRefit(c);
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
      // What is actually in the hold. The Ops roster showed structure, distance and upkeep
      // but never the cargo, so a hull carrying 2,344 kg read as idle on the Executive
      // screen while a scan of the same ship showed a full manifest.
      hold: holdMass(u || {}),
      holdCap: holdCap(u || {}),
      holdPct: holdCap(u || {}) > 0 ? holdMass(u || {}) / holdCap(u || {}) : 0,
      manifest: (u && u.hold) ? Object.assign({}, u.hold) : {},
      runningIn: !!(u && u.runningIn),
      berth: (u && u.berth && u.berth.userData) ? u.berth.userData.name : null,
      underFire: (c.alarmT || 0) > 0,
      owner: ownerOf(c),
      docked: hullDocked(u),
      dockedAt: (u && u.dockedAt) || null,
      refitting: c.refitT > 0 ? Math.ceil(c.refitT) : 0,
      refitTo: c.refitTo || null,
      commissioned: !!c.commissioned,
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

// ── refit ────────────────────────────────────────────────────────────
//
// The gap this closes: a hull conscripted as a patrol ship was a patrol ship forever. The
// command tree gates every objective on `requires`, so a company whose only free hull was
// combat-rated simply could not be told to mine, no matter how much was in the treasury.
// Buying an industrial ship did not help either — that changes the *player's* ship, which
// is not on the roster and cannot be given an objective.
//
// Refit converts a contract from one trade to another. Nothing else has to know: npcs.js
// dispatches its working routines on `userData.role`, so a hull that becomes `mine` starts
// running `minerStep()` on the next frame without a line of AI being written.

/** What this hull could be converted into, with the price of each. */
export function refitOptions(id) {
  const c = roster().find(x => x.id === id);
  if (!c) return [];
  return Object.keys(FLEET_ROLES)
    .filter(r => r !== c.role)
    .map(r => ({
      role: r,
      name: FLEET_ROLES[r].name,
      desc: FLEET_ROLES[r].desc,
      branch: FLEET_ROLES[r].branch,
      fee: refitFee(r),
      seconds: COMPANY.refitSeconds
    }));
}

/** In-charter conversions are cheaper. The charter is meant to mean something. */
export function refitFee(role) {
  const spec = FLEET_ROLES[role];
  if (!spec) return COMPANY.refitFee;
  const inCharter = hasCompany() && spec.branch === S.company.charter;
  return Math.round(COMPANY.refitFee * (inCharter ? 1 : COMPANY.refitCrossBranch));
}

/** Whether a refit would go through, and the sentence to show if not. */
export function canRefit(id, role) {
  if (!hasCompany()) return { ok: false, reason: 'No company on file.' };
  const c = roster().find(x => x.id === id);
  if (!c) return { ok: false, reason: 'No such contract.' };
  if (!FLEET_ROLES[role]) return { ok: false, reason: `No yard fits a "${role}" hull.` };
  if (c.role === role) return { ok: false, reason: `${c.name} is already fitted for that.` };
  if (c.refitT > 0) return { ok: false, reason: `${c.name} is already in the yard.` };
  if (c.orderId) return { ok: false, reason: `${c.name} is on an objective — recall it first.` };

  // A yard is a place. Converting a hull mid-belt would make the whole roster fungible
  // from anywhere, which removes the only spatial decision the fleet layer has.
  const ship = hullShip(c);
  if (!ship) return { ok: false, reason: `${c.name} is out of contact.` };
  const near = nearestStation(ship.position);
  if (!near || near.dist > COMPANY.refitRange) {
    return { ok: false, reason: `${c.name} is too far from a yard — send it station-keeping first.` };
  }

  const fee = refitFee(role);
  if (S.company.treasury < fee) {
    return { ok: false, reason: `Refit costs ${fmtCr(fee)} — the treasury holds ${fmtCr(Math.round(S.company.treasury))}.` };
  }
  return { ok: true, fee, yard: near.station };
}

/**
 * Convert a hull. The ship goes into the yard for `refitSeconds` and comes out fitted for
 * the new trade — hull type, hold, and the role its behaviour keys off.
 */
export function refitHull(id, role) {
  const gate = canRefit(id, role);
  if (!gate.ok) { toast(gate.reason); return gate; }

  const c = roster().find(x => x.id === id);
  if (!fund(gate.fee, FLEET_ROLES[role].branch)) {
    return { ok: false, reason: 'The treasury could not cover the refit.' };
  }

  c.refitTo = role;
  c.refitT = COMPANY.refitSeconds;
  c.refitYard = gate.yard.userData.name;

  recordDiagnostic({
    subjectId: c.id,
    t: S.time || 0,
    kind: 'contract',
    situation: 'fleet:refit',
    summary: `${c.name} into the yard at ${c.refitYard} — ${FLEET_ROLES[c.role].name} to ${FLEET_ROLES[role].name}`,
    context: { from: c.role, to: role, fee: gate.fee },
    salience: 0.6,
    tags: ['fleet', 'refit', role]
  });

  toast(`${c.name} in the yard at ${c.refitYard} — ${FLEET_ROLES[role].name} in ${COMPANY.refitSeconds}s`, 4600);
  return { ok: true, contract: c, fee: gate.fee, seconds: COMPANY.refitSeconds };
}

/** Called by the tick when yard time runs out. */
function completeRefit(c) {
  const role = c.refitTo;
  const spec = FLEET_ROLES[role];
  c.refitT = 0;
  c.refitTo = null;
  if (!spec) return;

  const from = c.role;
  c.role = role;
  c.type = spec.hull;

  // The ship in the world has to agree, or the roster says "extraction" while the hull
  // keeps flying a patrol pattern.
  const ship = hullShip(c);
  if (ship && ship.userData) {
    const u = ship.userData;
    const t = NPC_TYPES[spec.hull];
    u.role = role;
    u.type = spec.hull;
    if (t) {
      // Keep the damage it has taken; a refit is not a repair.
      const frac = u.maxHp > 0 ? u.hp / u.maxHp : 1;
      u.maxHp = t.hp;
      u.hp = Math.max(1, Math.round(t.hp * frac));
      u.speed = t.speed; u.turn = t.turn; u.sensor = t.sensor; u.range = t.range;
      u.dmg = t.dmg; u.pspeed = t.pspeed; u.pcool = t.pcool;
      // The refit resets speed to the new hull's base, so the company tuning has to be
      // re-applied on top of it rather than left pointing at the old hull's figure.
      u.__fleetTuned = false; u.__baseSpeed = null;
      applyFleetTuning(u);
      u.profile = t.profile || u.profile;
    }
    // Clear whatever the old routine was in the middle of.
    u.rock = null; u.locked = null; u.runningIn = false; u.berth = null; u.target = null;
  }

  recordDiagnostic({
    subjectId: c.id,
    t: S.time || 0,
    kind: 'contract',
    situation: 'fleet:refit-done',
    summary: `${c.name} out of the yard — now ${spec.name}`,
    context: { from, to: role },
    salience: 0.5,
    tags: ['fleet', 'refit', role]
  });
  toast(`${c.name} refitted — ${spec.name}`, 4200);
  status(`${c.name} is now ${spec.name.toLowerCase()}`);
}

/** Nearest station to a point, with its distance. */
function nearestStation(pos) {
  let best = null, bestD = Infinity;
  for (const st of (S.world && S.world.stations) || []) {
    const d = st.position.distanceTo(pos);
    if (d < bestD) { bestD = d; best = st; }
  }
  return best ? { station: best, dist: bestD } : null;
}

// ── commissioning ────────────────────────────────────────────────────
//
// Conscription needs a willing hull in range. Commissioning does not: the company orders a
// ship from the yard it is docked at and takes delivery fitted for whatever trade it asked
// for. This is what a player means by "I saved up and bought an industrial ship" — the
// shipyard on the Ledger buys *your* hull, which is not on the roster and cannot be given
// an objective.

export function commissionFee(role) {
  const spec = FLEET_ROLES[role];
  const t = spec && NPC_TYPES[spec.hull];
  // Priced off the hull's own worth — salvage value is the only figure NPC_TYPES carries
  // that scales with how substantial a ship is.
  const worth = t ? (t.salvage || 60) * 40 + (t.hp || 100) * 12 : 6000;
  return Math.round(worth * COMPANY.commissionMarkup);
}

export function commissionOptions() {
  return Object.keys(FLEET_ROLES).map(r => ({
    role: r,
    name: FLEET_ROLES[r].name,
    desc: FLEET_ROLES[r].desc,
    branch: FLEET_ROLES[r].branch,
    fee: commissionFee(r)
  }));
}

export function canCommission(role) {
  if (!hasCompany()) return { ok: false, reason: 'No company on file — register a charter first.' };
  if (!FLEET_ROLES[role]) return { ok: false, reason: `No yard builds a "${role}" hull.` };
  if (!S.docked) return { ok: false, reason: 'Ships are ordered at a station — dock first.' };
  if (roster().length >= COMPANY.fleetCap) {
    return { ok: false, reason: `Fleet is full at ${COMPANY.fleetCap} hulls. Release one first.` };
  }
  const fee = commissionFee(role);
  if (S.company.treasury < fee) {
    return { ok: false, reason: `That hull costs ${fmtCr(fee)} — the treasury holds ${fmtCr(Math.round(S.company.treasury))}.` };
  }
  return { ok: true, fee };
}

/**
 * How a hull is lettered. The registered name, trimmed only if it would not fit on a hull —
 * and trimmed at a word boundary, so "Meridian Extraction Consortium" becomes "Meridian
 * Extraction" rather than "Meridian Extracti".
 */
export function companyTag() {
  const full = (S.company && S.company.name) || 'Independent';
  if (full.length <= 22) return full;
  const words = full.split(/\s+/);
  let out = words[0];
  for (const w of words.slice(1)) {
    if ((out + ' ' + w).length > 22) break;
    out += ' ' + w;
  }
  return out;
}

/** Buy a hull into the fleet. It spawns at the station you ordered it from. */
export function commissionHull(role) {
  const gate = canCommission(role);
  if (!gate.ok) { toast(gate.reason); return gate; }

  const spec = FLEET_ROLES[role];
  if (!fund(gate.fee, spec.branch)) {
    return { ok: false, reason: 'The treasury could not cover the order.' };
  }

  const st = S.docked;
  const ship = spawnNpc(spec.hull, Math.floor(stream('fleet').next() * 89) + 10);
  if (!ship) return { ok: false, reason: 'The yard could not lay the hull down.' };

  // Delivered onto a pad, not left floating alongside. Undocking is the first thing an
  // objective makes it do, and a ship that was never docked cannot undock.
  ship.position.copy(st.position);
  const u = ship.userData;
  u.faction = 'independent';
  u.role = role;
  // The hull's name has to be unique, because `hullShip()` resolves a contract to a ship by
  // matching on it. Numbering by roster length repeated as soon as a hull was released — two
  // ships called "Skud Extraction 01" and the contract silently resolved to whichever came
  // first in the world array, which is how a freshly docked hull could report itself adrift.
  // The contract id is already unique, so the tail of it goes in the name.
  const cid = nextContractId();
  const tag = cid.split('-').slice(1).join('').toUpperCase().slice(0, 4);
  // The *company's* name, not its first word. Taking `split(' ')[0]` off "Skae Merch Co."
  // produced "Skae Extractor", which reads as the founder's own ship — and with the default
  // company name being "<pilot forename> Holdings" it literally was the pilot's name on the
  // hull. A commissioned hull belongs to the company and is lettered like company property.
  u.name = `${companyTag()} ${spec.name} ${tag}`;
  // `spawnNpc()` already adds to the scene, registers interpolation *and* pushes to
  // S.world.npcs. Pushing again put the same Object3D in the array twice: it rendered once
  // and appeared on the nav map once — both draw the one object at the one position — but
  // every list that walks the array saw it twice, which is the doubled Contacts entry. It
  // also meant the hull was stepped twice per frame, so a commissioned ship quietly
  // accelerated, mined and burned upkeep at double rate.

  const contract = {
    id: cid,
    npcName: u.name,
    name: u.name,
    role,
    type: spec.hull,
    signedAt: S.time || 0,
    orderId: null,
    mode: 'active',
    paid: gate.fee,
    commissioned: true,
    // Bought with the treasury through Ops, so it is the company's.
    owner: OWNER.COMPANY
  };
  roster().push(contract);
  u.contracted = contract.id;
  u.owner = OWNER.COMPANY;
  dockHull(ship, u, st);
  applyFleetTuning(u);

  recordDiagnostic({
    subjectId: contract.id,
    t: S.time || 0,
    kind: 'contract',
    situation: 'fleet:commission',
    summary: `${contract.name} commissioned at ${st.userData.name} for ${fmtCr(gate.fee)}`,
    context: { role, fee: gate.fee },
    salience: 0.6,
    tags: ['fleet', 'contract', role]
  });

  toast(`${contract.name} delivered at ${st.userData.name}`, 4600);
  status(`${contract.name} joins the fleet — ${spec.name}`);
  return { ok: true, contract, fee: gate.fee };
}

// ── extraction revenue ───────────────────────────────────────────────
//
// `minerStep()` in entities/npcs.js already ran the loop a player would draw on a napkin:
// cut a rock, fill up, run it in to a berth, sell, go again. What it did not do was pay
// anybody — the ore moved the station's price and vanished. So an extraction objective was
// a countdown with nothing behind it, and "send a ship to mine for me" was not a thing the
// game could do however the order was phrased.
//
// These two functions are the join. npcs.js asks where a company hull should take its ore,
// and tells us when it sold some.

/** Where a company hull runs its ore. The registered office if there is one. */
export function extractionBerth(u, from) {
  const list = (S.world && S.world.stations) || [];
  if (!list.length) return null;
  const pos = from || (u && u.__pos) || null;
  const hq = hasCompany() && S.company.hqStation
    ? list.find(s => s.userData && s.userData.name === S.company.hqStation)
    : null;
  if (!pos) return hq || null;

  // The office by preference, but not at any distance. A belt sitting 11,000 units out and
  // an office on the far side of the system turns every load into an hours-long transit,
  // so the office only wins when it is not much further than the nearest berth.
  let near = null, nearD = Infinity;
  for (const st of list) {
    const d = st.position.distanceTo(pos);
    if (d < nearD) { nearD = d; near = st; }
  }
  if (hq && near) {
    const hqD = hq.position.distanceTo(pos);
    return hqD <= nearD * 1.25 ? hq : near;
  }
  return hq || near;
}

/**
 * Company hulls run harder than ambient ones. Applied once per contract and marked, so a
 * hull that is hired, refitted and released does not compound the multiplier.
 */
function applyFleetTuning(u) {
  if (!u || u.__fleetTuned) return;
  u.__baseSpeed = u.speed;
  u.speed = u.speed * COMPANY.fleetSpeed;
  u.__fleetTuned = true;
}

function clearFleetTuning(u) {
  if (!u || !u.__fleetTuned) return;
  if (u.__baseSpeed != null) u.speed = u.__baseSpeed;
  u.__fleetTuned = false;
  u.__baseSpeed = null;
}

/**
 * A contracted hull sold a load. Bank it, and advance whatever objective it was flying.
 *
 * Revenue is booked against the charter, so an industrial company mining ore gets the
 * in-charter rate and a military one does not — the same slope every other company
 * transaction runs on.
 */
export function creditExtraction(contractId, commodity, kg, value, berth) {
  const c = roster().find(x => x.id === contractId);
  if (!c || !(kg > 0)) return 0;

  const banked = hasCompany() ? book(value, FLEET_ROLES[c.role] ? FLEET_ROLES[c.role].branch : null) : 0;
  c.delivered = (c.delivered || 0) + kg;
  c.earned = (c.earned || 0) + banked;

  if (c.orderId) creditFleetProgress(c.orderId, kg);

  recordDiagnostic({
    subjectId: c.id,
    t: S.time || 0,
    kind: 'performance',
    situation: 'fleet:delivery',
    summary: `${c.name} ran in ${Math.round(kg)} kg ${commodity} to ` +
             `${(berth && berth.userData && berth.userData.name) || 'a berth'} for ${fmtCr(Math.round(banked))}`,
    context: { kg: Math.round(kg), value: Math.round(banked), commodity },
    salience: 0.45,
    tags: ['fleet', 'extraction', commodity]
  });

  status(`${c.name} delivered ${Math.round(kg)} kg ${commodity} · ${fmtCr(Math.round(banked))}`);
  return banked;
}

/** How a hull's contract is performing, for the roster panel. */
export function hullPerformance(id) {
  const c = roster().find(x => x.id === id);
  if (!c) return null;
  const paid = (c.paid || 0);
  return {
    delivered: Math.round(c.delivered || 0),
    earned: Math.round(c.earned || 0),
    paid,
    net: Math.round((c.earned || 0) - paid)
  };
}

// ── under fire ───────────────────────────────────────────────────────
//
// A contracted hull could be shot to pieces on the far side of the system and the first the
// owner knew of it was the contract closing itself with "lost contact". A ship you are
// paying upkeep on being attacked is information you are entitled to *before* it becomes a
// wreck.
//
// Watched here rather than in combat.js because damage arrives from several places —
// projectiles, collisions, the star — and what matters is not who fired but that a hull on
// the roster is losing structure it had a moment ago.

const ATTACK = {
  quiet: 6.0,        // s without further damage before the alarm clears
  repeat: 20,        // s before the same hull raises the channel again
  criticalAt: 0.35   // hull fraction below which the alarm escalates
};

/** The hull in the worst trouble right now, or null. Read by the HUD each frame. */
export function fleetUnderFire() {
  let worst = null;
  for (const c of roster()) {
    if (!(c.alarmT > 0)) continue;
    const frac = c.hullFrac == null ? 1 : c.hullFrac;
    if (!worst || frac < worst.hullFrac) worst = { name: c.name, hullFrac: frac, id: c.id };
  }
  return worst;
}

function watchForAttack(c, u, dt) {
  if (!u) return;
  const frac = u.maxHp > 0 ? u.hp / u.maxHp : 1;
  const last = c.lastHp == null ? u.hp : c.lastHp;
  c.lastHp = u.hp;
  c.hullFrac = frac;

  if (u.hp < last - 0.5) {
    const first = !(c.alarmT > 0);
    c.alarmT = ATTACK.quiet;
    c.sinceCall = (c.sinceCall || 0) + dt;
    if (first || c.sinceCall > ATTACK.repeat) {
      c.sinceCall = 0;
      const critical = frac < ATTACK.criticalAt;
      transmit({
        from: c.name, faction: 'company', channel: 'distress',
        text: critical
          ? `${c.name} — taking heavy fire, structure ${Math.round(frac * 100)}%. Cannot hold.`
          : `${c.name} — under attack, structure ${Math.round(frac * 100)}%. Request support.`
      });
      toast(critical ? `${c.name} is being destroyed` : `${c.name} is under attack`, 5200);
      recordDiagnostic({
        subjectId: c.id, t: S.time || 0, kind: 'incident',
        situation: 'fleet:under-fire',
        summary: `${c.name} took fire at ${Math.round(frac * 100)}% structure`,
        salience: critical ? 0.95 : 0.75,
        tags: ['fleet', 'attack', critical ? 'critical' : 'contact']
      });
    }
    return;
  }
  if (c.alarmT > 0) c.alarmT = Math.max(0, c.alarmT - dt);
}

// ── the hangar ───────────────────────────────────────────────────────
//
// A commissioned hull used to be pushed into the world 220 units off the station and left
// floating there, which is why it looked as though it "auto appeared at the belt": it never
// undocked because it was never docked, and the first thing the objective did was fly it
// away. A ship you have just bought should be *on a pad*, and leaving that pad should be
// the first thing anyone sees it do.
//
// Docked hulls are held out of the world's collision and combat passes by `dockedAt`, and
// parked at the station's own position so the nav map shows them there rather than adrift.

/** Put a hull on a pad at a station. */
export function dockHull(ship, u, station) {
  if (!ship || !u || !station) return false;
  u.dockedAt = station.userData ? station.userData.name : null;
  u.lastDock = u.dockedAt;
  u.padFrom = { x: station.position.x, y: station.position.y, z: station.position.z };
  u.target = null;
  u.locked = null;
  u.rock = null;
  u.runningIn = false;
  u.berth = null;
  ship.position.copy(station.position);
  hide(ship, HIDE.dock);   // it is inside the ring — and LOD may also have an opinion
  return true;
}

/** Take a hull off the pad. It comes out alongside, not on top of the ring. */
export function undockHull(ship, u) {
  if (!ship || !u) return false;
  const from = u.padFrom;
  u.dockedAt = null;
  show(ship, HIDE.dock);
  if (from) {
    // Offset so it is outside the hull of the station rather than inside it.
    ship.position.x = from.x + 240;
    ship.position.y = from.y + 30;
    ship.position.z = from.z;
  }
  return true;
}

/** Is this hull sitting on a pad? */
export const hullDocked = u => !!(u && u.dockedAt);

// ── ownership ────────────────────────────────────────────────────────
//
// Two ways to come by a ship and they mean different things. A hull ordered through
// Ops → Staff is bought with the treasury and belongs to the company. A hull bought at a
// station's own yard is bought with the pilot's credits and belongs to the pilot. Both end
// up as ships in the world, so the difference has to be recorded rather than inferred, and
// it has to be changeable — a founder lending their own ship to the company, or taking one
// back out of it, is an ordinary thing to want to do.

export const OWNER = { COMPANY: 'company', PLAYER: 'player' };

/** Who owns this contract's hull. Contracts written before v1.01.93 are company hulls. */
export const ownerOf = c => (c && c.owner) || OWNER.COMPANY;

/**
 * Move a hull between the company and the pilot.
 *
 * Transferring *to* the company puts it on the roster and makes it dispatchable; the
 * company picks up the upkeep. Transferring *out* leaves the ship exactly where it is and
 * simply stops it being the company's problem — and recalls whatever it was flying, because
 * an objective is a company instruction and the ship is no longer taking those.
 */
export function transferHull(id, to) {
  const c = roster().find(x => x.id === id || x.name === id);
  if (!c) return { ok: false, reason: 'No such hull.' };
  // v1.02.00: a hull the company paid for stays the company's. It used to be transferable
  // to the pilot, which made the treasury a personal wallet with extra steps — sign a
  // contract, move the hull across, and the board is funding your private fleet. The
  // charter is what the licence is for; if the founder wants a ship of their own they buy
  // it with their own credits at a yard, like everyone else.
  //
  // The verb stays, because the other direction is still needed: a pilot may sign their own
  // ship over *to* the company, and later slices will want to sell or lease one back.
  if (to === OWNER.PLAYER) {
    return { ok: false, reason: 'Company hulls stay on the company books. Buy your own at a yard.' };
  }
  const target = OWNER.COMPANY;
  if (ownerOf(c) === target) {
    return { ok: false, reason: `${c.name} is already ${target === OWNER.PLAYER ? 'yours' : 'company property'}.` };
  }
  c.owner = target;
  const ship = hullShip(c);
  if (ship && ship.userData) ship.userData.owner = target;

  recordDiagnostic({
    subjectId: c.id, t: S.time || 0, kind: 'contract',
    situation: 'fleet:transfer',
    summary: `${c.name} transferred to ${target === OWNER.PLAYER ? 'the pilot' : 'the company'}`,
    salience: 0.5, tags: ['fleet', 'ownership', target]
  });
  status(`${c.name} is now ${target === OWNER.PLAYER ? 'your ship' : 'company property'}`);
  return { ok: true, owner: target };
}

/** Hulls the company may actually give orders to. */
export const companyHulls = () => roster().filter(c => ownerOf(c) === OWNER.COMPANY);
