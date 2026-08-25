// Living Galaxy — persistence. Falls back to memory if storage is blocked (private mode, sandbox).
//
// 0.2 makes the save format explicit rather than implicit. Every payload carries the
// schema it was written against and the build that wrote it; loading runs it forward
// through a migration chain instead of hoping missing fields default sensibly. A payload
// that will not parse is moved aside as `.corrupt` rather than being silently replaced,
// and the previous good save is kept as `.bak` — on a phone, a wiped save is the one
// failure a player can never recover from.

import { S, recalcStats } from '../../core/state.js';
import { SAVE_KEY, AUTOSAVE_INTERVAL, SPAWN, STAR } from '../../core/config.js';
import { SCHEMA, VERSION } from '../../core/version.js';
import { toast } from '../../core/notify.js';
import { serializeSim, restoreSim } from './worldsim.js';
import { serializeBelt, restoreBelt } from '../../world/asteroids.js';
import { resetReputation, FACTIONS } from '../company/reputation.js';
import { REP } from '../../core/config.js';
import { serializeMissions, restoreMissions } from '../trade/missions.js';
import { serializeContracts, restoreContracts } from '../trade/contracts.js';
import { serializeCrafting, restoreCrafting } from '../industry/crafting.js';
import { serializeSites, restoreSites } from '../industry/planetary.js';
import { serializeOrders, restoreOrders } from '../company/orders.js';
import { serializeTutorial, restoreTutorial } from './tutorial.js';
import { serializeComms, restoreComms } from '../npc/comms.js';
import { serializeCompany, restoreCompany } from '../company/company.js';
import { serializeManagers, restoreManagers, reconcileManagers } from '../company/managers.js';
import { serializeBrains, restoreBrains } from '../npc/npc-brain.js';
import { serializeAnomalies, restoreAnomalies } from '../flight/lagrange.js';
import { serializeGroups, restoreGroups } from '../combat/groups.js';
import { serializeNpcComms, restoreNpcComms } from '../npc/npc-comms.js';
import { serializeDeals, restoreDeals } from '../trade/deals.js';
import { serializeWelfare, restoreWelfare } from '../crew/welfare.js';
import { serializeResearch, restoreResearch } from '../industry/research.js';
import { serializeWear, restoreWear } from '../combat/wear.js';
import { serializeHabitat, restoreHabitat, resetHabitat } from '../industry/habitat.js';
import { serializeDiagnostics, restoreDiagnostics } from '../../data/npc-kb/index.js';
import { seedContractSeq } from '../company/fleet.js';
import { serializeDossiers, restoreDossiers } from '../company/dossier.js';
// The migration needs to place an old flight on the chart. Imported under explicit names
// because `classFor` and `placeExisting` are galaxy vocabulary and this file is not.
import { classFor as galaxyClassFor, placeExisting as galaxyPlaceExisting,
         designation as galaxyDesignation, nodeAt as galaxyNodeAt } from '../../world/galaxy.js';

const BAK_KEY = SAVE_KEY + '.bak';
const BAD_KEY = SAVE_KEY + '.corrupt';

let memoryFallback = null;
let sinceSave = 0;

// ── storage shims ────────────────────────────────────────────────────
function readRaw(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function writeRaw(key, text) {
  try { localStorage.setItem(key, text); return true; } catch (e) { return false; }
}
function dropRaw(key) {
  try { localStorage.removeItem(key); } catch (e) { /* nothing to clear */ }
}

// ── payload ──────────────────────────────────────────────────────────
export function snapshot() {
  const p = S.player;
  return {
    v: SCHEMA,
    build: VERSION,
    savedAt: Date.now(),
    seed: S.seed,
    // Where that seed came from (schema 22). The system seed stays in the payload rather than
    // being recomputed on load: a save must reopen in exactly the system it was written in, and
    // "derive it again from the node" would silently move somebody's flight the first time the
    // seed chain changed. The node is where it *sits*; the seed is what it *is*.
    galaxy: { seed: (S.galaxy && S.galaxy.seed) >>> 0, node: (S.galaxy && S.galaxy.node) | 0 },
    // Which system this flight is in, as a *choice* rather than an inference (schema 18).
    //
    // The seed alone is not enough. Generation is deterministic, but it is deterministic
    // *for a given generator*: if world/genesis.js ever places a station differently, a
    // save that only carried a seed would silently reopen in a system that is subtly not
    // the one it was written in — a hauler's route pointing at a berth that moved, a
    // company registered at an office that is now a different class of station. Recording
    // the layout and the generator version makes that detectable instead of silent.
    //
    // 'solaris' is the authored twelve-world system every save before this schema was
    // written in, and it is what the migration below assigns them.
    layout: (S.systemPlan && S.systemPlan.layout) || 'solaris',
    genesis: (S.systemPlan && S.systemPlan.version) || 0,
    // What the generator was *asked for* (schema 23), not only which generator it was. The
    // main menu scales system density, and density changes the plan a seed produces — so a
    // flight has to reopen at the density it was created at, whatever the slider says now.
    density: (S.systemPlan && S.systemPlan.density) || 1,
    playtime: Math.round(S.playtime || 0),
    classKey: p.classKey,
    pos: [p.position.x, p.position.y, p.position.z],
    yaw: p.yaw, pitch: p.pitch,
    energy: p.energy, shield: p.shield, armor: p.armor, hull: p.hull, kills: p.kills,
    credits: S.credits,
    cargo: { ore: S.cargo.ore, salvage: S.cargo.salvage, data: S.cargo.data },
    probes: S.probes,
    survey: S.survey,
    upgrades: Object.assign({}, S.upgrades),
    ownedHulls: Object.assign({}, S.ownedHulls),
    weapon: S.weapon,
    ownedWeapons: Object.assign({}, S.ownedWeapons),
    ownedModules: Object.assign({}, S.ownedModules),
    fit: S.fit ? { weapon: S.fit.weapon.slice(), utility: S.fit.utility.slice(), core: S.fit.core.slice() } : null,
    // v1.00.70: which group each hardpoint belongs to, and which is under the trigger.
    // Keyed on hardpoint index, so it travels with the fit it describes.
    groups: serializeGroups(),
    crew: (S.crew || []).map(c => ({ id: c.id, name: c.name, role: c.role, trait: c.trait,
                                     level: c.level, xp: c.xp, morale: c.morale,
                                     fatigue: c.fatigue || 0,
                                     // v1.00.10: where they stand, whether they are on
                                     // watch, and how badly they are hurt.
                                     post: c.post || null, onDuty: c.onDuty !== false,
                                     injury: c.injury || 0, served: Math.round(c.served || 0),
                                     // v1.00.30: needs, resolve, breaks and rank.
                                     hunger: c.hunger || 0, thirst: c.thirst || 0,
                                     will: c.will ?? 0.5, onBreak: !!c.onBreak,
                                     breakT: c.breakT || 0, dutyT: Math.round(c.dutyT || 0),
                                     overseer: !!c.overseer, dispatched: !!c.dispatched })),
    recruits: S.recruits || null,
    crewPayT: S.crewPayT || 0,
    scans: S.scans,
    settings: Object.assign({}, S.settings),

    // ── the living world (schema 4) ──────────────────────────────────
    reputation: Object.assign({}, S.reputation),
    sim: serializeSim(),
    belt: serializeBelt(),

    // ── the pilot (schema 5) ─────────────────────────────────────────
    character: S.character ? JSON.parse(JSON.stringify(S.character)) : null,
    // Individual records — the player's, and every NPC who has done something worth
    // remembering (schema 20). Derived NPC dossiers are deliberately not written: they
    // rebuild identically from the world seed and their own name.
    dossiers: serializeDossiers(),
    licences: Object.assign({}, S.licences),
    missions: serializeMissions(),
    contracts: serializeContracts(),

    // ── industry (v1.00.20) ──────────────────────────────────────────
    crafting: serializeCrafting(),
    sites: serializeSites(),
    orders: serializeOrders(),

    // ── onboarding, radio, company, staff (v1.00.31, schema 8) ───────
    tutorial: serializeTutorial(),
    comms: serializeComms(),
    company: serializeCompany(),
    managers: serializeManagers(),

    // ── NPC minds (v1.00.32, schema 9) ───────────────────────────────
    brains: serializeBrains(),

    // ── deep space (v1.00.50, schema 10) ─────────────────────────────
    // One flag per worked Lagrange site. What is *at* a point is seeded from the world
    // seed and its name, so the only thing that needs saving is whether you took it.
    anomalies: serializeAnomalies(),

    // v1.00.90: pair cooldowns for NPC-to-NPC exchanges. What characters actually *know*
    // rides with their personas in `brains`; this is only the bookkeeping that stops two
    // ships repeating themselves across a reload.
    npcComms: serializeNpcComms(),

    // v1.01.00: open obligations between characters.
    deals: serializeDeals(),

    // v1.01.40: crew comfort fittings. Shore-leave and training flags ride on the crew
    // records themselves, which the crew payload already carries.
    comfort: serializeWelfare(),

    // v1.01.50: findings gathered, projects completed, and the one in the lab.
    research: serializeResearch(),

    // v1.01.70: how worn each fitted hardpoint is. Keyed by slot index, so it travels with
    // the fit it describes — the same reason `groups` is keyed that way. NPC holds are
    // deliberately *not* here: ships are not persisted, so a hold lives and dies with one.
    // What survives is what the cargo did — station stock, and the ledger.
    wear: serializeWear(),
    // The NPC knowledge-base diagnostic log. New in schema 17 — before this it lived on
    // globalThis and never reached the save at all.
    npcKb: serializeDiagnostics(),

    // v1.02.60: how far the arrays are out, and what the farm has grown. Small, but it has
    // to travel or a save written mid-deployment loads into a hull that is pinned by a bar
    // at 60% with nothing driving it back down.
    habitat: serializeHabitat()
  };
}

export function saveGame(quiet = true) {
  const data = snapshot();
  const text = JSON.stringify(data);
  const prev = readRaw(SAVE_KEY);
  if (!writeRaw(SAVE_KEY, text)) memoryFallback = data;
  else if (prev && prev !== text) writeRaw(BAK_KEY, prev);   // one step of undo
  if (!quiet) toast('Flight saved');
  sinceSave = 0;
  return data;
}

// ── migrations ───────────────────────────────────────────────────────
// Keyed by the schema being upgraded *from*. Each returns the payload one version newer.
// Never delete one of these: an old save on a phone that has not been opened in months
// still has to walk the whole chain.
const MIGRATIONS = {
  // v1 (pre-fitting) → v2: fitting existed only as a bare weapon key.
  1(d) {
    d.fit = d.fit || null;
    d.ownedWeapons = d.ownedWeapons || (d.weapon ? { [d.weapon]: true } : {});
    d.ownedModules = d.ownedModules || {};
    d.crew = Array.isArray(d.crew) ? d.crew : [];
    d.crewPayT = d.crewPayT || 0;
    d.scans = d.scans || {};
    d.v = 2;
    return d;
  },
  // v2 (0.1 line) → v3: build stamp, playtime, advanced upgrade keys guaranteed present.
  2(d) {
    d.build = d.build || '0.1.x';
    d.savedAt = d.savedAt || Date.now();
    d.playtime = d.playtime || 0;
    d.upgrades = Object.assign(
      { shield: 0, armor: 0, cargo: 0, thrust: 0, weapon: 0, mining: 0,
        regenField: 0, overclock: 0, deepScan: 0, warpTuner: 0, autoRepair: 0, pointDef: 0 },
      d.upgrades || {}
    );
    d.v = 3;
    return d;
  },
  // v3 (0.2–0.4) → v4: the living world becomes persistent. An old save has no record of
  // it, so the world it wakes into is a fresh one — which is exactly what that save always
  // meant. Reputation starts from the defaults rather than at zero, so a returning pilot
  // is not treated as a stranger by everyone at once.
  3(d) {
    d.reputation = d.reputation || Object.assign({}, REP.start);
    d.sim = d.sim || null;
    d.belt = d.belt || null;
    d.v = 4;
    return d;
  },
  // v4 (0.5) → v5: the pilot becomes a thing. A save from before this has no character
  // at all, and inventing one would be worse than admitting it: the flight keeps its
  // hull, credits and standing, and `character: null` tells the boot sequence to offer
  // creation. Licences are granted for every hull already owned, because grounding a
  // returning pilot in a ship they have flown for hours would be a punishment for
  // upgrading.
  4(d) {
    d.character = d.character || null;
    d.missions = d.missions || null;
    if (!d.licences) {
      d.licences = {};
      for (const k in (d.ownedHulls || {})) if (d.ownedHulls[k]) d.licences[k] = true;
      if (d.classKey) d.licences[d.classKey] = true;
    }
    d.v = 5;
    return d;
  },
  // v5 (0.6) → v6: the contract board. A save from before it has no board and no accepted
  // work; it gets a fresh board on load rather than an invented history, because a
  // half-finished job the player never accepted is worse than no job.
  5(d) {
    d.contracts = d.contracts || null;
    d.v = 6;
    return d;
  },
  // v6 (0.7–v1.00.10) → v7: material stock, the manufacturing queue and planetary sites.
  // A save from before them simply has none, which is what a pilot who has never crafted
  // anything or planted a site actually has — there is nothing to invent.
  6(d) {
    d.crafting = d.crafting || null;
    d.sites = d.sites || null;
    d.v = 7;
    return d;
  },
  // v7 (v1.00.20–30) → v8: training progress, the comms log, the company and the
  // experimental site managers.
  //
  // The training flag is the one that needed thought. A pilot mid-flight on an old save
  // has demonstrably already worked the game out, and dropping a seven-step checklist on
  // them would be an insult — so an existing save arrives with training marked done and
  // skipped rather than pending. Only a genuinely new pilot is ever offered it.
  7(d) {
    d.tutorial = d.tutorial || { active: false, done: true, skipped: true, stage: 0 };
    d.comms = d.comms || null;
    d.company = d.company || null;
    d.managers = d.managers || null;
    d.v = 8;
    return d;
  },
  // v8 → v9: NPC personas. Nothing to invent — a character with no stored memories is
  // fully reconstructible from their name and the world seed, so an old save simply
  // arrives with an empty persona table and rebuilds identities on first contact.
  8(d) {
    d.brains = d.brains || null;
    d.v = 9;
    return d;
  },
  // v9 → v10: Lagrange sites. An old save has worked none of them, which is the correct
  // answer — the points did not exist to be worked. Everything else about an anomaly is
  // derived from the seed, so there is nothing else to backfill.
  9(d) {
    d.anomalies = d.anomalies || {};
    d.v = 10;
    return d;
  },
  // v10 → v11: weapon groups. An old save has every hardpoint in group I firing on ALL,
  // which is exactly the behaviour it had — a fit with no groups assigned fires together,
  // which is what every fit did before this slice.
  10(d) {
    d.groups = d.groups || { slots: {}, active: 'all' };
    d.v = 11;
    return d;
  },
  // v11 → v12: NPC-to-NPC exchange cooldowns. An old save has none, which means every pair
  // is free to speak on the first sweep — correct, since none of them have.
  11(d) {
    d.npcComms = d.npcComms || { pairs: {}, exchanges: 0 };
    d.v = 12;
    return d;
  },
  // v12 → v13: the deal ledger. An old save has no open obligations, which is right — none
  // were ever made.
  12(d) {
    d.deals = d.deals || { open: [], done: 0, failed: 0 };
    d.v = 13;
    return d;
  },
  // v13 → v14: crew comfort fittings. An old save has none, which is what every hull comes
  // with — level 0 is the baseline, not a missing value.
  13(d) {
    d.comfort = d.comfort || { quarters: 0, galley: 0, infirmary: 0 };
    d.v = 14;
    return d;
  },
  // v14 → v15: research. An old save has no findings and nothing researched, which locks
  // the seven tier-5 blueprints it could previously have queued. That is the one place this
  // slice takes something away, and it is why nothing below tier 5 is gated: the loss is
  // seven exotic entries a pilot almost certainly had not built, recoverable by doing the
  // research, rather than a catalogue that silently shrank.
  14(d) {
    d.research = d.research || { findings: {}, done: [], active: null, seen: {} };
    d.v = 15;
    return d;
  },
  // v15 → v16: module condition. An old save arrives with everything yard-fresh, which is
  // the generous reading and the correct one: a pilot cannot be billed for wear the build
  // that wrote their save had no way to accrue. Unlike the v14 → v15 step, this migration
  // takes nothing away.
  15(d) {
    d.wear = d.wear || { weapon: [], utility: [], core: [] };
    d.v = 16;
    return d;
  },
  // v16 → v17: the NPC knowledge-base diagnostic log, contracted hulls, and fleet
  // objectives all become part of the payload. All three arrive empty, and all three are
  // *additions* — nothing an older save carried is dropped or reinterpreted.
  //
  // The company is the one that needs touching rather than defaulting: a v16 company was
  // written before hulls existed, so it has no roster key at all, and code that reads
  // `co.fleet.length` would throw rather than see zero.
  16(d) {
    d.npcKb = d.npcKb || { seq: 1, events: [] };
    if (d.orders && typeof d.orders === 'object' && !Array.isArray(d.orders.fleet)) {
      d.orders.fleet = [];
    }
    if (d.company && typeof d.company === 'object') {
      if (!Array.isArray(d.company.fleet)) d.company.fleet = [];
      if (typeof d.company.upkeepT !== 'number') d.company.upkeepT = 0;
    }
    d.v = 17;
    return d;
  },
  // v17 → v18: procedural systems. Everything a save says about the world it is in — the
  // scans it has archived, the surveys it has run, the office its company is registered
  // at, the berths its haulers run between, which rocks it has already mined out — is
  // keyed by *name*. Regenerating a v17 save's seed with the new generator would rename
  // every one of those and dangle all of them at once.
  //
  // So a v17 save is declared to be exactly where it has always been: the authored Solaris
  // layout, which `world/genesis.js` still carries verbatim for this purpose. Nothing is
  // lost and nothing moves. New games get a generated system; old flights keep theirs.
  17(d) {
    d.layout = 'solaris';
    d.genesis = 0;
    d.v = 18;
    return d;
  },
  // v18 → v19: the company's construction order book. An addition — a save written before
  // builders had work simply has none on the books, which is exactly true of it.
  18(d) {
    if (d.company && typeof d.company === 'object' && !Array.isArray(d.company.projects)) {
      d.company.projects = [];
    }
    d.v = 19;
    return d;
  },
  // v19 → v20: individual dossiers. An addition, and a deliberately empty one — a save
  // written before this had no per-power standing to convert, and inventing one from the
  // old three bloc numbers would be putting words in a character's mouth. They start at
  // zero with everybody, which is what this patch says everybody starts at.
  19(d) {
    d.dossiers = d.dossiers || {};
    d.v = 20;
    return d;
  },
  // v20 → v21: a contract is posted by a power, not a bloc.
  //
  // Two different jobs here, and they get different treatment on purpose.
  //
  // The **boards** are thrown away. They are generated, they expire on their own within
  // fifteen minutes of play, and every offer on them carries an issuer in the retired
  // vocabulary and no tier. Regenerating them costs nothing and converting them would be
  // inventing a desk for an offer nobody had accepted.
  //
  // The **accepted** contracts are kept, because those are promises the player made and
  // dropping one would delete a deadline they are currently flying to meet. Each is
  // re-keyed onto a real power in the bloc it used to name, and pinned to the free tier
  // with no requirement — a job already in hand must not become unacceptable retroactively
  // because the character cannot meet a gate that did not exist when they took it.
  20(d) {
    const FALLBACK = { coalition: 'meridian', independent: 'freewake', pirate: 'kessler' };
    if (d.contracts && typeof d.contracts === 'object') {
      d.contracts.boards = {};
      d.contracts.active = (d.contracts.active || []).map(c => {
        if (!c) return c;
        if (FALLBACK[c.issuer]) c.issuer = FALLBACK[c.issuer];
        c.tier = c.tier || 'low';
        c.req = c.req || {};
        delete c.locked;
        return c;
      });
    }
    d.v = 21;
    return d;
  },
  // v21 → v22: the flight gets a place in the galaxy.
  //
  // **The system does not change.** This is the v17 rule again: everything a save remembers
  // about its world — stations, contracts, the company's registered office, a hauler's route —
  // is keyed by name, so regenerating the world underneath a returning pilot dangles all of it
  // at once. The seed stays exactly as written and the system reopens identical.
  //
  // What is added is a *position*. The node is chosen so the chart agrees with the sky: the
  // first node in the home band whose star class matches the class this save is actually
  // orbiting. Written here rather than resolved at boot because a placement that is recomputed
  // every load is a placement that moves the first time the galaxy constants are tuned, and a
  // system that wanders around the map between sessions is worse than no map.
  // v22 → v23: density did not exist, and everything before it was generated at 1.0.
  22(d) {
    if (typeof d.density !== 'number' || !isFinite(d.density)) d.density = 1;
    d.v = 23;
    return d;
  },

  21(d) {
    if (!d.galaxy) {
      const gs = (d.seed ?? 0) >>> 0;
      // The class this save's own star actually is, from the seed it already carries.
      const cls = galaxyClassFor(gs).key;
      const node = galaxyPlaceExisting(gs, cls);
      d.galaxy = { seed: gs, node: node.i };
    }
    d.v = 22;
    return d;
  }
};

/** Walk a payload up to the current schema. Returns null if it cannot be understood. */
export function migrate(data) {
  if (!data || typeof data !== 'object') return null;
  let d = data;
  let v = typeof d.v === 'number' ? d.v : 1;
  let hops = 0;
  while (v < SCHEMA) {
    const step = MIGRATIONS[v];
    // The cap is a runaway guard, not a policy. A v1 save legitimately walks every step in
    // the chain, so a hardcoded 17 turned into a *refusal to load the oldest saves* the
    // moment schema 18 shipped — and it did, silently, until schema 19 pushed a v1 payload
    // past it and `test/core.mjs` caught it. Derived from the chain's own length now, so
    // adding a migration cannot quietly start rejecting history again.
    if (!step || ++hops > SCHEMA + 2) return null;   // unknown vintage — refuse rather than guess
    d = step(d);
    v = d.v;
  }
  if (v > SCHEMA) return null;                      // written by a newer build than this one
  return d;
}

// ── load ─────────────────────────────────────────────────────────────
function readPayload() {
  const raw = readRaw(SAVE_KEY);
  if (raw) {
    try { return JSON.parse(raw); }
    catch (e) {
      writeRaw(BAD_KEY, raw);                        // keep the evidence, clear the slot
      dropRaw(SAVE_KEY);
      const bak = readRaw(BAK_KEY);
      if (bak) { try { return JSON.parse(bak); } catch (e2) { /* both gone */ } }
      return null;
    }
  }
  return memoryFallback;
}

export function loadGame() {
  const parsed = readPayload();
  if (!parsed) return false;

  const data = migrate(parsed);
  if (!data) { toast('Save is from a different build — starting fresh'); return false; }
  const migrated = data.v !== (parsed.v || 1);
  if (migrated) { writeRaw(BAK_KEY, JSON.stringify(parsed)); saveGame(true); }

  const p = S.player;
  if (data.seed != null) S.seed = data.seed;

  // Where in the galaxy this save is — and **this is a restore, not a boot read**.
  //
  // `savedGalaxy()` covers the ordinary path, because boot reads it before the world is built.
  // It does not cover `importSave()` or `restoreBackup()`, which both call this function
  // mid-session with no reload, and the consequence was not cosmetic: `snapshot()` writes
  // `S.galaxy` back out, so the next autosave — thirty seconds later — would stamp the
  // *previous* flight's coordinates onto the imported one and permanently move it on the chart.
  //
  // `layout` and `genesis` are deliberately *not* restored here and are not the same case: they
  // decide how the world is generated, which has already happened by the time this runs, so
  // applying them mid-session would describe a system that is not on screen. Two integers
  // saying where you are can be applied at any moment; a generator choice cannot.
  if (data.galaxy && Number.isFinite(data.galaxy.seed)) {
    S.galaxy = { seed: data.galaxy.seed >>> 0, node: data.galaxy.node | 0 };
    // Keep the printed designation with the placement, or the HUD names the system the player
    // just left.
    if (S.systemPlan) {
      S.systemPlan.designation = galaxyDesignation(galaxyNodeAt(S.galaxy.seed, S.galaxy.node));
    }
  }
  if (data.classKey) p.classKey = data.classKey;
  Object.assign(S.upgrades, data.upgrades || {});
  if (data.ownedHulls) S.ownedHulls = Object.assign({}, data.ownedHulls);
  if (data.ownedWeapons) S.ownedWeapons = Object.assign({}, data.ownedWeapons);
  if (data.ownedModules) S.ownedModules = Object.assign({}, data.ownedModules);
  if (data.weapon !== undefined) S.weapon = data.weapon;
  // The fit is normalised against the hull inside recalcStats(), so a save from a
  // bigger ship simply loses whatever no longer has a hardpoint.
  if (data.fit) S.fit = data.fit;
  if (Array.isArray(data.crew)) {
    S.crew = data.crew.map(c => Object.assign(
      { morale: 1, xp: 0, level: 1, fatigue: 0, post: null, onDuty: true, injury: 0, served: 0,
        // A record written before these existed must not arrive starving, mute or asleep.
        hunger: 0, thirst: 0, will: 0.5, onBreak: false, breakT: 0, dutyT: 0,
        overseer: false, dispatched: false },
      c));
  }
  S.recruits = data.recruits || null;
  S.crewPayT = data.crewPayT || 0;
  S.scans = data.scans || {};
  S.playtime = data.playtime || 0;

  // The pilot before anything derived from them: recalcStats() reads character bonuses,
  // and detection reads lineage signature on the first frame.
  S.character = data.character || null;
  S.licences = Object.assign({}, data.licences || {});

  // Reputation first: NPC behaviour on the very first frame after a load reads it.
  resetReputation();
  if (data.reputation) {
    for (const f of FACTIONS) {
      if (typeof data.reputation[f] === 'number') {
        S.reputation[f] = Math.max(REP.min, Math.min(REP.max, data.reputation[f]));
      }
    }
  }
  // guard: you always own the hull you're flying
  S.ownedHulls[p.classKey] = true;
  Object.assign(S.settings, data.settings || {});
  recalcStats();

  if (data.pos) p.position.set(data.pos[0], data.pos[1], data.pos[2]);
  // migration: saves written before the spawn moved could sit inside the corona
  if (p.position.length() < STAR.dangerRadius) p.position.set(SPAWN.x, SPAWN.y, SPAWN.z);
  p.yaw = data.yaw || 0;
  p.pitch = data.pitch || 0;
  p.velocity.set(0, 0, 0);
  p.energy = data.energy ?? S.stats.energyCap;
  p.shield = data.shield ?? S.stats.shieldMax;
  p.armor = data.armor ?? S.stats.armorMax;
  p.hull = data.hull ?? S.stats.hullMax;
  p.kills = data.kills || 0;
  S.credits = data.credits ?? 1500;
  S.cargo.ore = data.cargo?.ore || 0;
  S.cargo.salvage = data.cargo?.salvage || 0;
  S.cargo.data = data.cargo?.data || 0;
  if (typeof data.probes === 'number') S.probes = data.probes;
  S.survey = data.survey || {};

  // The world last: sites and claims spawn ships, and those want a settled player state
  // to spawn around. A save with no sim block simply keeps the freshly generated world.
  if (data.sim) restoreSim(data.sim);
  if (data.belt) restoreBelt(data.belt);
  S.missions = null;
  if (data.missions) restoreMissions(data.missions);
  if (data.contracts) restoreContracts(data.contracts);
  restoreDossiers(data.dossiers || null);
  restoreCrafting(data.crafting || null);
  restoreSites(data.sites || null);
  restoreOrders(data.orders || null);
  restoreTutorial(data.tutorial || null);
  restoreComms(data.comms || null);
  restoreCompany(data.company || null);
  restoreManagers(data.managers || null);
  // A manager whose site is gone is dropped rather than left pointing at nothing.
  reconcileManagers();
  restoreBrains(data.brains || null);
  restoreAnomalies(data.anomalies || null);
  restoreGroups(data.groups || null, ((S.fit && S.fit.weapon) || []).length);
  restoreNpcComms(data.npcComms || null);
  restoreDeals(data.deals || null);
  restoreWelfare(data.comfort || null);
  restoreResearch(data.research || null);
  restoreWear(data.wear || null);
  // A save from before the arrays existed has no habitat block, and a blank one is the
  // correct reading of "this hull has never deployed anything".
  if (!restoreHabitat(data.habitat || null)) resetHabitat();
  restoreDiagnostics(data.npcKb || null);
  seedContractSeq((S.company && S.company.fleet) || []);

  recalcStats();
  return true;
}

/** The seed a previous flight was generated with, without applying the whole save. */
/** The galaxy placement a previous flight was in, before the whole save is applied. */
export function savedGalaxy() {
  const d = readPayload();
  if (!d || !d.galaxy) return null;
  return { seed: d.galaxy.seed >>> 0, node: d.galaxy.node | 0 };
}

export function savedSeed() {
  const d = readPayload();
  return d && d.seed != null ? d.seed : null;
}

/**
 * The system layout a previous flight was in, without applying the whole save.
 *
 * Read at boot, *before* the world is built, because the plan has to exist before
 * `createSystem()` runs. Returns null when there is no save — which is a new game, and a
 * new game generates.
 */
/**
 * The density a save's system was generated at, or 1 for anything that predates the field.
 *
 * Read at boot and handed to `planFor`, so a flight is rebuilt with the arguments it was
 * made with. The slider on the menu describes the *next* galaxy, never this one.
 */
export function savedDensity() {
  const d = readPayload();
  if (!d) return null;
  return typeof d.density === 'number' && isFinite(d.density) ? d.density : 1;
}

export function savedLayout() {
  const d = readPayload();
  if (!d) return null;
  // A payload predating schema 18 has no layout key and is, by definition, Solaris.
  return d.layout || 'solaris';
}

/**
 * The generator version a save was written by, or 0 if it predates the field.
 *
 * Schema 18 has recorded this since v1.02.33 for the express purpose of making a generator
 * change *detectable rather than silent* — and for nine patches **nothing read it**, which
 * made the whole apparatus a comment with a field attached. `docs/EXECUTIVE_ARC.md` has
 * carried it as an open item since .34: "a GENESIS_VERSION mismatch is recorded but nothing
 * acts on it". Closed at v1.02.43 — see `genesisWarning()` below and its one caller.
 */
function savedGenesis() {
  const d = readPayload();
  return d ? (d.genesis ?? 0) : null;
}

/**
 * What to tell the player, if anything, about the generator that built their flight.
 *
 * Only for procedural saves: an authored Solaris layout is carried verbatim by `genesis.js`
 * and does not move when the generator does, which is exactly why the v17 migration pinned old
 * saves to it. And only *older*, never newer — a save from a future build is a different
 * problem and not one a warning helps with.
 */
export function genesisWarning(current) {
  const layout = savedLayout();
  if (layout !== 'procedural') return null;
  const was = savedGenesis();
  if (was == null || was === 0 || was >= current) return null;
  return `This flight was charted by generator v${was}; this build is v${current}. ` +
         'Bodies keep their names and positions — the plan is stored with the save — but a ' +
         'newly generated system would not look the same.';
}

/** Header only — build, schema, age, playtime. For the boot screen and diagnostics. */
export function saveInfo() {
  const d = readPayload();
  if (!d) return null;
  return {
    schema: d.v || 1,
    build: d.build || 'unknown',
    seed: d.seed ?? null,
    layout: d.layout || 'solaris',
    genesis: d.genesis ?? 0,
    savedAt: d.savedAt || null,
    playtime: d.playtime || 0,
    credits: d.credits ?? null,
    pilot: d.character ? { name: d.character.name, level: d.character.level,
                           lineage: d.character.lineage, career: d.character.career } : null,
    stale: (d.v || 1) < SCHEMA
  };
}

export function hasSave() {
  return !!readRaw(SAVE_KEY) || !!memoryFallback;
}

export function wipeSave() {
  memoryFallback = null;
  dropRaw(SAVE_KEY);
  dropRaw(BAK_KEY);
  dropRaw(BAD_KEY);
}

/** Roll back to the previous good save. Returns false if there isn't one. */
export function restoreBackup() {
  const bak = readRaw(BAK_KEY);
  if (!bak) return false;
  writeRaw(SAVE_KEY, bak);
  return loadGame();
}

// ── transfer ─────────────────────────────────────────────────────────
// localStorage is per-origin and per-browser: change phones, change browsers, or clear
// site data and the flight is gone. These two are the escape hatch, text you can paste.
export function exportSave() {
  return JSON.stringify(snapshot());
}

export function importSave(text) {
  let parsed;
  try { parsed = JSON.parse(String(text)); } catch (e) { return false; }
  const data = migrate(parsed);
  if (!data || data.classKey == null) return false;
  const prev = readRaw(SAVE_KEY);
  if (prev) writeRaw(BAK_KEY, prev);
  if (!writeRaw(SAVE_KEY, JSON.stringify(data))) memoryFallback = data;
  return loadGame();
}

export function autosave(dt) {
  sinceSave += dt;
  if (sinceSave >= AUTOSAVE_INTERVAL) saveGame(true);
}
