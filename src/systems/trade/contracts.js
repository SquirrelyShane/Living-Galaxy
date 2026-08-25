// Living Galaxy — the contract board.
//
// This is deliberately a different thing from the agent chain in systems/missions.js.
// That is five hand-written stories with a fixed order and a guaranteed payoff; this is a
// generated market of offers that expire whether or not you look at them, posted by
// stations that have their own reasons, gated on what those stations think of you.
// Sharing one engine between the two would have meant a story engine with expiry timers
// bolted on, or a market with a plot, and both are worse than two small files.
//
// The design rule that shapes everything below: **refusing is free, abandoning is not.**
// If accepting cost nothing, the dominant strategy is to accept every offer and see which
// ones happen to complete, and the board stops being a decision. Accepting is a promise
// with a deadline and a standing penalty attached.
//
// ## The desk (v1.02.39)
//
// Until this patch a contract was posted by a *bloc*: one of three, and `issuerOf()`
// returned 'coalition' for anything military or economic and 'independent' for everything
// else. That was the last enum standing between v1.02.36's record and it mattering.
// Standing lived per-power, the career ladder gated on named powers — `aurelian: 25`,
// `freewake: 40` — and nothing in the game could move a per-power number, so every rung
// above the second was reachable from the console and nowhere else. A ladder you cannot
// climb is a picture of a ladder.
//
// So a station now posts on behalf of **one of the nine powers**, and three things follow
// from that which did not follow from a bloc:
//
//   1. **Who posts what is a fact about them.** `POWERS[k].hires` was declared in .36 and
//      read by nobody. It is now the type table: the Directorate posts bounties because
//      its charter says it hires guns, and Vosk posts salvage and freight because that is
//      what a breaker's yard wants moved. Nobody posts the whole board.
//   2. **Work has tiers, and a tier is a gate the ladder opens.** A mid-tier haul asks for
//      the `haul-mid` qualification, which is exactly what rung 3 of the freight ladder
//      grants. The board is where the ladder pays out.
//   3. **Finishing a job moves standing with a power, so the corp war is felt.** Running
//      Directorate work costs you with Kessler, through `relationOf()` and the timeline,
//      without contracts knowing anything about who hates whom.
//
// The bloc numbers have not gone away — docking rights, who shoots first and the trade
// book still read them, and re-keying those is not this patch. Settlement moves both, at
// one call site, marked. See `docs/OPEN_ITEMS.md`.

import { S, cargoFree } from '../../core/state.js';
import { CONTRACTS, COMMODITIES } from '../../core/config.js';
import { stream, makeRng, hashString } from '../../core/rng.js';
import { standing, adjust, blocOf } from '../company/reputation.js';
import { practice } from '../crew/character.js';
import { crewEvent } from '../crew/crew.js';
import { toast, status } from '../../core/notify.js';
import { sfx } from '../platform/audio.js';
import { POWERS, POWER_KEYS, powersOf } from '../../data/factions.js';
import { playerDossier, adjustStanding, standingWith, qualifies, refreshRung,
         LADDER } from '../company/dossier.js';
import { landmarks } from '../../world/landmarks.js';
import { MISSION_TEMPLATES, eligible } from '../../data/missions/templates.js';
import { searchCount } from '../industry/salvage.js';

let refreshT = 0;

const TYPE_KEYS = Object.keys(CONTRACTS.types);
const rng = () => stream('contracts');

// ── who posts ────────────────────────────────────────────────────────

/**
 * The bloc a station's space belongs to. The old `issuerOf()`, kept under its own name
 * because docking rights, hostility and the trade book all still ask this question and
 * re-keying them is not this patch's job.
 */
export function issuerBlocOf(station) {
  const cat = station.userData.category;
  if (cat === 'pirate') return 'pirate';
  if (cat === 'military' || cat === 'economic') return 'coalition';
  return 'independent';
}

/** The bloc a power belongs to — the bridge between the two vocabularies. */
const blocOfPower = key => (POWERS[key] && POWERS[key].bloc) || 'independent';

/**
 * Which **power** a station posts on behalf of.
 *
 * Charter first: a power declares the kind of concern it is (`charter: 'military'`) and a
 * station declares the kind of place it is (`category: 'military'`), and where those agree
 * the desk belongs to that power. Where they do not — a habitat ring, which no power's
 * charter covers — the station falls back to any power in its own bloc.
 *
 * Deterministic per station, and derived rather than stored: a station's name and the
 * world seed produce the same desk on every device and every load, so nothing has to be
 * persisted and nothing can drift. Same rule the NPC layer has followed since v1.00.90.
 */
export function issuerOf(station) {
  const ud = (station && station.userData) || {};
  const bloc = issuerBlocOf(station);
  const pool = powersOf(bloc);
  if (!pool.length) return POWER_KEYS[0];

  const chartered = pool.filter(k => POWERS[k].charter === ud.category);
  const candidates = chartered.length ? chartered : pool;
  if (candidates.length === 1) return candidates[0];

  // Seeded by the name, not by the draw order: inserting a station must not re-assign the
  // desks of the ones beside it.
  const r = makeRng(`desk:${S.seed || 0}:${ud.name || '?'}`);
  return candidates[Math.floor(r.next() * candidates.length)];
}

// ── what they post ───────────────────────────────────────────────────
//
// `hires` is the vocabulary the lore speaks — a power hires couriers, guns, salvors — and
// the board has four job types. This is the join, and it is deliberately many-to-one: a
// courier run and a bulk haul are the same verb at different scales, and inventing two
// more contract types to keep the words apart would be a table serving a synonym.
const HIRE_TYPES = {
  courier: 'haul',   haul: 'haul',
  supply:  'supply',
  // v1.02.50: `salvage` used to fold into `supply` because the board had no way to express
  // working a wreck field — the comment above says a table serving a synonym is not worth
  // having, and that was true while the two really were the same verb. They are not any
  // more. A breaker's yard that hires salvors now posts salvage.
  salvage: 'salvage',
  survey:  'survey',
  bounty:  'bounty', escort: 'bounty', patrol: 'bounty'
};

/**
 * The verb a template names decides the contract's type, not the other way round.
 *
 * `type` used to be drawn first and the job built to match. Templates invert that: the
 * template says what the work *is*, and `type` follows or it becomes a label contradicting
 * its own contract. Live for one test run, and the cheap symptom was a "haul" with no
 * commodity reaching `sell()` and throwing on `COMMODITIES[undefined]`. The expensive one
 * is a delivery that never loads its cargo and completes for free.
 */
const TYPE_FOR_VERB = {
  deliver: 'haul', acquire: 'supply', destroy: 'bounty',
  scan: 'survey', search: 'salvage', visit: 'survey'
};

/** The job types a power will actually post, weighted by how much of its charter they are. */
export function desksOf(power) {
  const hires = (POWERS[power] && POWERS[power].hires) || [];
  const w = {};
  for (const h of hires) {
    const t = HIRE_TYPES[h];
    if (t) w[t] = (w[t] || 0) + 1;
  }
  // A power that hires nothing the board can express still posts general freight rather
  // than an empty desk — an unreachable station is worse than a generic one.
  if (!Object.keys(w).length) w.haul = 1;
  return w;
}

function pickType(r, power) {
  const w = desksOf(power);
  const keys = Object.keys(w);
  const total = keys.reduce((a, k) => a + w[k] * CONTRACTS.types[k].weight, 0);
  let roll = r.next() * total;
  for (const k of keys) {
    roll -= w[k] * CONTRACTS.types[k].weight;
    if (roll <= 0) return k;
  }
  return keys[0];
}

// ── tiers, and the gate the ladder opens ─────────────────────────────
//
// Every qualification any rung of any career grants. Computed rather than listed, so a
// requirement can never ask for a certificate no ladder issues — which is the failure mode
// that turns a gated board into a wall.
// Computed on first use rather than at module load, and that is not a micro-optimisation.
// This module sits in an import cycle — contracts → dossier → character → company →
// contracts — and reading `LADDER` while this file is being evaluated reaches a binding
// that is still in its temporal dead zone. It threw on the first run after the cycle
// closed. A lazy read costs one null check and cannot be broken by import order, which is
// the right trade for a value that never changes.
let _grantable = null;
function grantable() {
  if (!_grantable) {
    _grantable = new Set(
      Object.values(LADDER).flatMap(l => l.rungs.flatMap(r => r.grants || []))
    );
  }
  return _grantable;
}

export const TIERS = [
  // The floor is free, on purpose and for the same reason rung 0 is: a new pilot has to
  // have work. Every gate in this game sits *above* what a character is handed at birth.
  { key: 'low',  name: 'Standard', weight: 58, pay: 1.00, standing: 0,  skill: 0 },
  { key: 'mid',  name: 'Bonded',   weight: 30, pay: 1.55, standing: 15, skill: 0.40 },
  { key: 'high', name: 'Sealed',   weight: 12, pay: 2.40, standing: 35, skill: 0.62 }
];

function pickTier(r) {
  const total = TIERS.reduce((a, t) => a + t.weight, 0);
  let roll = r.next() * total;
  for (const t of TIERS) { roll -= t.weight; if (roll <= 0) return t; }
  return TIERS[0];
}

/**
 * The qualification a tier asks for — **offset one rank below the tier's own name.**
 *
 * Bonded work asks for the *low* certificate, sealed work asks for the *mid* one. The
 * obvious mapping — bonded asks for `haul-mid` — was the first thing written here and it
 * is wrong twice over. It walls the floor, because `survey-low` is a real grant and a
 * standard survey would then demand it of a character who has never surveyed anything;
 * and it makes the first *earned* rung of every ladder buy nothing, because the thing it
 * grants is the thing the tier you were already doing requires.
 *
 * Offset, rung 1 immediately opens better-paying work, which is what a first promotion is
 * supposed to feel like.
 */
const TIER_QUAL = { low: null, mid: 'low', high: 'mid' };

/**
 * What a contract demands of whoever accepts it.
 *
 * Three claims at most — the tier's skill floor, standing with the *issuing power*, and
 * the ladder qualification — and the qualification is only asked for when some career
 * actually grants it. `qualifies()` reports all three at once and says which are missing,
 * which is what lets the board print a reason rather than a padlock.
 */
export function requirementFor(type, tier, issuer) {
  const req = {};
  if (tier.skill > 0) req.skills = { [CONTRACTS.types[type].skill]: tier.skill };
  if (tier.standing > 0) req.standing = { [issuer]: tier.standing };
  const rank = TIER_QUAL[tier.key];
  const qual = rank && `${type}-${rank}`;
  if (qual && grantable().has(qual)) req.quals = [qual];
  return req;
}

function otherStation(r, from) {
  const list = S.world.stations.filter(s => s !== from);
  if (!list.length) return from;
  return list[Math.floor(r.next() * list.length)];
}

function makeContract(r, station, now, forceTier, forceVerb, avoid) {
  const issuer = issuerOf(station);
  const type = pickType(r, issuer);
  const spec = CONTRACTS.types[type];
  const tier = forceTier || pickTier(r);
  // Standing with the *power*, not the bloc. This is the number the desk actually has an
  // opinion about, and since .36 it is the one that moves when you work for them.
  const rep = standingWith(playerDossier(), issuer);

  const int = (lo, hi) => Math.round(lo + r.next() * (hi - lo));
  const c = {
    id: `${type}-${Math.floor(r.next() * 1e9).toString(36)}`,
    type, issuer,
    tier: tier.key,
    // Provisional. Recomputed below once a template has settled what this job actually is —
    // a requirement derived from the pre-template draw asks for a `bounty-low` certificate
    // on a job that turned out to be freight, which `test/desks.mjs` catches by asserting
    // the qualification matches the type.
    req: requirementFor(type, tier, issuer),
    station: station.userData.name,
    posted: now,
    expires: now + int(CONTRACTS.life[0], CONTRACTS.life[1]),
    accepted: null, deadline: null,
    progress: 0, target: 1,
    pay: int(spec.pay[0], spec.pay[1]),
    rep: spec.rep,
    skill: spec.skill,
    done: false, failed: false
  };

  // ── where this job happens ─────────────────────────────────────────
  //
  // The change that ended the four-jobs-forever board. A template declares the kind of place
  // it needs; only templates the *live system* can satisfy are offered, and the place they
  // land on carries the variety. See `data/missions/templates.js`.
  //
  // The four legacy types survive as a fallback, and deliberately so: a system with no
  // charted landmarks at all — an early boot, a headless test, a jump mid-build — still has
  // a board rather than an empty panel.
  const marks = landmarks();
  const pool = eligible(marks, tier.key);

  // **A desk only posts work it hires.** `POWERS[k].hires` is a fact about the power and
  // `test/desks.mjs` asserts every offer honours it. The template path bypassed this on its
  // first pass and eleven stations immediately started posting salvage contracts for desks
  // whose charter says nothing about wrecks — which is exactly the enum-flattening the
  // per-power record was built to undo, arriving by a new route.
  //
  // So the type the template implies is checked against the desk before it is eligible, and
  // if a desk's charter admits none of the templates this system can host, the legacy path
  // below still gives it a board.
  const hires = desksOf(issuer);
  let usable = pool.filter(e => {
    const t = TYPE_FOR_VERB[e.tpl.verb];
    if (!hires[t]) return false;
    return e.tpl.verb !== 'deliver' || e.sites.some(x => x);
  });

  // `forceVerb` is how a guarantee asks for a kind of work rather than retrying until the
  // dice cooperate. A retry loop is a guarantee that holds *usually*, which is the same as
  // not holding — and it was: twelve draws against a shared stream kept returning supply,
  // and the board drained of the one job type with a consignment behind it.
  //
  // Charter still wins. A desk that does not hire freight is not made to post it; the caller
  // gets whatever the desk does hire and the system-wide guarantee finds another station.
  if (forceVerb) {
    const forced = usable.filter(e => e.tpl.verb === forceVerb);
    if (forced.length) usable = forced;
  }

  // **A desk does not post the same job twice.**
  //
  // Templates are matched against places, and a system has far more templates than it has
  // graveyards — two, typically. So the salvage templates all resolved onto the same field
  // and a four-slot board came back reading "Work the Rust Drift" four times, which is the
  // original complaint wearing new clothes: the variety was in the catalogue and not on the
  // board.
  //
  // `avoid` holds the template+site pairs already posted here. Filtered, not reweighted,
  // because a duplicate is not merely less interesting — it is the failure being fixed.
  //
  // If nothing fresh is left, this returns **null** and the caller drops the slot. A desk
  // whose charter admits two templates and whose system offers two matching places has two
  // jobs, and a three-offer board that is three different jobs reads better than a four-offer
  // board with a repeat in it. Padding a board to a fixed length with duplicates is the
  // original complaint in miniature.
  if (avoid && avoid.size) {
    const fresh = [];
    for (const e of usable) {
      const sites = e.sites.filter(x => !avoid.has(e.key + '@' + (x ? x.id : '-')));
      if (sites.length) fresh.push({ key: e.key, tpl: e.tpl, sites });
    }
    if (!fresh.length && !forceVerb) return null;
    if (fresh.length) usable = fresh;
  }

  if (usable.length) {
    const total = usable.reduce((sum, e) => sum + (e.tpl.weight || 1), 0);
    let roll = r.next() * total;
    let choice = usable[usable.length - 1];
    for (const e of usable) { roll -= (e.tpl.weight || 1); if (roll <= 0) { choice = e; break; } }

    const site = choice.sites[Math.floor(r.next() * choice.sites.length)] || null;
    const tpl = choice.tpl;
    const ctx = { station: station.userData.name, issuer };

    c.template = choice.key;
    c.verb = tpl.verb;
    c.type = TYPE_FOR_VERB[tpl.verb] || c.type;
    c.skill = tpl.skill || c.skill;
    c.rep = tpl.rep || c.rep;
    c.pay = int(tpl.pay[0], tpl.pay[1]);
    if (site) { c.site = site.id; c.siteName = site.name; c.siteKind = site.kind; }

    if (tpl.kg) {
      c.commodity = tpl.commodity ||
        Object.keys(COMMODITIES)[Math.floor(r.next() * Object.keys(COMMODITIES).length)];
      c.target = int(tpl.kg.lo, tpl.kg.hi);
      if (tpl.verb === 'deliver' && site) c.dest = site.name;
    } else {
      c.target = int(tpl.count[0], tpl.count[1]);
    }

    c.title = tpl.title(site, ctx);
    c.brief = tpl.brief(site, ctx);

    // Distance is part of the fee. A run to the far side of the system is worth more than
    // one to the next berth, and before this nothing in the board knew how far anything was.
    if (site && site.orbit) {
      const reach = Math.min(2.2, 1 + Math.abs(site.orbit - (station.userData.orbitRadius || 0)) / 26000);
      c.pay = Math.round(c.pay * reach);
      c.reach = +reach.toFixed(2);
    }
  } else if (type === 'haul' || type === 'supply') {
    const keys = Object.keys(COMMODITIES);
    c.commodity = keys[Math.floor(r.next() * keys.length)];
    c.target = int(spec.kg[0], spec.kg[1]);
    const dest = type === 'haul' ? otherStation(r, station) : station;
    c.dest = dest.userData.name;
    c.verb = type === 'haul' ? 'deliver' : 'acquire';
    c.title = type === 'haul'
      ? `Haul ${c.target} kg ${COMMODITIES[c.commodity].name.toLowerCase()} to ${c.dest}`
      : `Supply ${c.target} kg ${COMMODITIES[c.commodity].name.toLowerCase()}`;
    c.brief = type === 'haul'
      ? `${station.userData.name} consigns a load to you. Carry it to ${c.dest} and hand it over — the fee is the payment, the cargo is not yours to sell.`
      : `${station.userData.name} is short. Bring it in and sell it here.`;
  } else if (type === 'bounty') {
    c.target = int(spec.kills[0], spec.kills[1]);
    c.verb = 'destroy';
    c.title = `Bounty — ${c.target} hostile${c.target > 1 ? 's' : ''}`;
    c.brief = 'Raiders in the lanes. Destroy them; the board does not care where.';
  } else {
    c.target = int(spec.targets[0], spec.targets[1]);
    c.verb = 'scan';
    c.title = `Survey ${c.target} bod${c.target > 1 ? 'ies' : 'y'}`;
    c.brief = 'Resolve detail on bodies nobody has bothered to look at properly.';
  }

  // The type may have moved when a template claimed this contract, so the gate is derived
  // from the settled type rather than from the draw that started it.
  c.req = requirementFor(c.type, tier, issuer);

  // A sealed job is worth more than a standard one for the same verb. Tier is baked in
  // because a job's difficulty does not change while it sits there.
  c.basePay = Math.round(c.pay * tier.pay);
  c.rep = Math.round((c.rep || spec.rep) * tier.pay);
  c.title = tier.key === 'low' ? c.title : `${c.title} · ${tier.name}`;

  // **Standing is not baked in.** It is applied by `payFor()` on read, for exactly the
  // reason the padlock below is: an offer sitting on a board while the player earns
  // standing with that desk has to improve, and a fee cached at generation time makes the
  // reputation system feel inert in the one place it is most visible.
  //
  // This was latent until v1.02.50. The old pay bands were narrow enough that a stored fee
  // and a live one were rarely far apart, and `test/economy.mjs` compared two *different*
  // boards and got away with it because a 40% standing bonus outran the variance. Template
  // pay bands are much wider, the difference stopped being invisible, and the test started
  // failing — correctly, and on a real defect rather than on the change that exposed it.
  c.pay = payFor(c);

  // `locked` is *not* stored as a verdict. It is recomputed on read, because a contract
  // sitting on a board while the player earns a rung has to unlock itself — a padlock
  // cached at generation time is the thing that would make the ladder feel inert again.
  return c;
}

/**
 * What this job pays *right now*, given what the desk currently thinks of you.
 *
 * Pure and cheap, so the board renderer can call it per row every frame. `basePay` is the
 * generated fee with tier and distance already in it; standing is the live part.
 */
export function payFor(c) {
  const base = c.basePay != null ? c.basePay : c.pay;
  const rep = standingWith(playerDossier(), c.issuer);
  return Math.round(base * (1 + Math.max(0, rep) * CONTRACTS.payPerStanding));
}

/** Refresh the displayed fee on every offer at a station. Called by the board renderer. */
export function repriceBoard(list) {
  for (const c of (list || [])) if (!c.accepted) c.pay = payFor(c);
  return list;
}

/**
 * Can this character take this job, and if not, exactly what is missing.
 *
 * One function, asked by the board renderer, by `acceptBlocker()` and by the tests, so
 * there is no way for the screen to show a lock the accept path disagrees with.
 */
export function eligibility(c) {
  const me = playerDossier();
  const disliked = standingWith(me, c.issuer) < CONTRACTS.minStanding;
  if (disliked) {
    const nm = (POWERS[c.issuer] && POWERS[c.issuer].short) || c.issuer;
    return { ok: false, why: `${nm} will not deal with you`, missing: [] };
  }
  return qualifies(me, c.req);
}

/** Kept as a property for the UI's convenience, derived on every read. */
const isLocked = c => !eligibility(c).ok;


/**
 * The two things a board must always be true of, wherever it came from.
 *
 * Factored out because there are now two ways a board changes — a scheduled refresh, and a
 * slot backfilled the instant a player accepts something — and a guarantee that only one of
 * them honours is not a guarantee. `test/haul.mjs` found this by accepting freight four
 * times in a row: the refresh path guaranteed freight, the backfill path did not, and the
 * board drained of exactly the thing the guarantee existed to protect.
 */
function ensureGuarantees(board, station, now, r) {
  // **Every board offers at least one job anybody can take.**
  //
  // Tiers are drawn independently, so with four draws at 58/30/12 roughly one board in
  // fourteen comes out with nothing on the free tier — and that is a station a new pilot
  // docks at, reads four padlocks on, and concludes the game is broken. The odds of it are
  // small and the cost of it is total, which is the shape of fault worth spending a line
  // on. Measured on the 1337 seed before this: station one posted three Bonded and one
  // Sealed, and nothing on it was takeable by a fresh character.
  //
  // The last slot is the one that gives, so the top of a board still reads as aspirational.
  if (board.length && !board.some(c => c.tier === 'low')) {
    board[board.length - 1] = makeContract(r, station, now, TIERS[0]) || board[board.length - 1];
  }

  // **Every board offers freight.**
  //
  // Same shape of guarantee as the tier floor above, and it arrived for the same reason:
  // templates widened the board from four job types to eighteen, and a station could now
  // legitimately roll four surveys and no freight at all. Freight is the spine of the game —
  // it is how a new pilot earns, it is what the logistics career is made of, and it is the
  // only job type with a consignment mechanic behind it. A board without any is a station
  // where the most common activity in the game is unavailable, arrived at by dice.
  //
  // Found by `test/haul.mjs`, which walks every station looking for a takeable haul and had
  // simply been assuming one existed. It did, until it did not.
  //
  // The first slot gives, rather than the last: the tier floor already owns the last one,
  // and two guarantees writing to the same index means whichever runs second wins and the
  // other silently stops holding.
  //
  // Specifically a *consignment*, not merely freight. `supply` is freight too, but `haul` is
  // the one the station loads onto your hull and expects back somewhere else — it is the
  // only job type with the consignment mechanic behind it, and it is what a new pilot's
  // first hour is made of.
  //
  // **A preference, not a mandate, and the charter is why.** A desk only posts work it
  // hires, and a refinery's charter says nothing about courier runs — forcing freight onto
  // every station would flatten the per-power record back into "every desk posts the whole
  // board", which is the exact collapse v1.02.39 existed to undo. So this asks, and a desk
  // that does not hire freight declines. The guarantee that actually matters is the
  // system-wide one in `initContracts`: *somewhere* in this system there is a consignment.
  if (board.length && !board.some(c => c.type === 'haul')) {
    const pick = makeContract(r, station, now, TIERS[0], 'deliver');
    if (pick && pick.type === 'haul') board[0] = pick;
  }


  // Last word on duplicates.
  //
  // The guarantees above write into fixed slots and can therefore reintroduce the pair the
  // dedupe just removed — a forced consignment landing on the same destination as the one
  // already posted. Cheaper to sweep once at the end than to teach every guarantee to check,
  // and it means a guarantee added later cannot quietly reopen this.
  const seen = new Set();
  for (let i = board.length - 1; i >= 0; i--) {
    const k = (board[i].template || board[i].type) + '@' + (board[i].site || '-');
    if (seen.has(k)) board.splice(i, 1); else seen.add(k);
  }

  return board;
}

/** Rebuild one station's board, keeping anything the player has accepted. */
export function refreshBoard(station, now = S.time) {
  const name = station.userData.name;
  if (!S.contracts) S.contracts = { boards: {}, active: [], history: { done: 0, failed: 0 } };

  // ── the board is a function of where and when, not of call order ───
  //
  // This used to draw from the shared `stream('contracts')`, which made a board depend on
  // how many boards had been built before it. Two consequences, one cosmetic and one not:
  //
  //   Refreshing the same station twice at the same moment produced two *different* boards.
  //   `test/economy.mjs` compares the fee on a board before and after a standing change and
  //   had been comparing two unrelated boards, which only passed because the old pay bands
  //   were narrow enough that a 40% standing bonus outran the noise.
  //
  //   Two clients in a shared galaxy handed the same seed would disagree about what is
  //   posted at a station, because they would have visited stations in a different order.
  //
  // Seeded on the station and the refresh epoch instead, so the same station at the same
  // time gives the same board on any machine, however you got there. The same discipline
  // `world/genesis.js` uses, and for the same reason.
  const epoch = Math.floor(now / Math.max(1, CONTRACTS.refresh));
  const r = makeRng((S.seed ^ hashString('board:' + name + ':' + epoch)) >>> 0);
  const board = [];
  const posted = new Set();
  for (let i = 0; i < CONTRACTS.perStation; i++) {
    // null means "nothing left this desk could post that it has not already posted" — the
    // board is honestly shorter rather than padded with a repeat.
    const c = makeContract(r, station, now, null, null, posted);
    if (!c) break;
    posted.add((c.template || c.type) + '@' + (c.site || '-'));
    board.push(c);
  }

  ensureGuarantees(board, station, now, r);

  S.contracts.boards[name] = board;
  return board;
}

export function boardFor(station) {
  if (!S.contracts) initContracts();
  const name = station.userData.name;
  const b = S.contracts.boards[name];
  if (!b) return refreshBoard(station);
  // Expired offers are dropped on read rather than on a timer: nobody needs to be told
  // about a job going stale at a station they are not standing in.
  const live = b.filter(c => c.expires > S.time);
  if (live.length !== b.length) S.contracts.boards[name] = live;
  // Priced on read, for the same reason the padlock is judged on read: standing earned
  // while an offer sat here has to show up in the fee.
  return repriceBoard(live);
}

export function initContracts() {
  S.contracts = { boards: {}, active: [], history: { done: 0, failed: 0 } };
  refreshT = 0;
  for (const st of S.world.stations) refreshBoard(st, 0);
  ensureSystemFreight(0);
  return S.contracts;
}

/**
 * **Somewhere in this system, a consignment is available.**
 *
 * The per-station attempt is a preference that a desk's charter may decline, and it should:
 * a refinery does not hire couriers. But if *every* desk in a system declines, the player is
 * in a system where the most common activity in the game cannot be started — which is a
 * soft-lock produced by a dice roll, the same shape of fault as a system with no shipyard.
 *
 * So the guarantee is system-wide. The desk that gives is one that actually hires freight,
 * so no charter is violated to satisfy it; if genuinely no desk in the system hires freight,
 * nothing is forced and the system is honestly a place you cannot take a consignment.
 */
export function ensureSystemFreight(now = S.time) {
  const stations = S.world.stations || [];
  if (!stations.length) return false;
  for (const st of stations) {
    const b = S.contracts.boards[st.userData.name];
    if (b && b.some(c => c.type === 'haul')) return true;
  }
  // Nobody has one. Ask the desks that hire freight, best first.
  const willing = stations.filter(st => desksOf(issuerOf(st)).haul);
  if (!willing.length) return false;
  const st = willing[0];
  const b = S.contracts.boards[st.userData.name];
  if (!b || !b.length) return false;
  const pick = makeContract(rng(), st, now, TIERS[0], 'deliver');
  if (!pick || pick.type !== 'haul') return false;
  b[b.length - 1] = pick;
  return true;
}

// ── accepting ────────────────────────────────────────────────────────

export const activeContracts = () => (S.contracts && S.contracts.active) || [];

/**
 * @param c     the offer
 * @param opts  `{ toFleet: true }` when a company hull will fly this rather than the player.
 *
 * `toFleet` exists because an executive has no hold worth speaking of and is not going
 * anywhere. A haul tendered to a freighter is consigned to *that* ship at the origin — the
 * founder's own cargo bay is not part of the transaction, and checking it refused office
 * work for a reason that had nothing to do with the office. Caught by `test/boardroom.mjs`
 * as a tender that returned null with no blocker to explain it.
 */
export function acceptBlocker(c, opts = {}) {
  if (!c) return 'No such contract';
  // The gate says what it wants, in the same words the board prints. A refusal that will
  // not name the thing it is refusing over is what makes progression feel arbitrary — the
  // reason `qualifies()` was built to report every gap in v1.02.36.
  const gate = eligibility(c);
  if (!gate.ok) return gate.why;
  if (activeContracts().length >= CONTRACTS.maxActive) return `Already holding ${CONTRACTS.maxActive}`;
  if (activeContracts().some(a => a.id === c.id)) return 'Already accepted';
  if (c.expires <= S.time) return 'Offer expired';
  // Haul contracts load the cargo onto the ship at acceptance. Without free hold space
  // the load cannot board, so the offer is blocked rather than accepted into an impossible state.
  if (!opts.toFleet && isConsignment(c) && c.target > 0) {
    if (cargoFree() < c.target) {
      return `Hold full — need ${c.target} kg free for the load`;
    }
  }
  return null;
}

export function acceptContract(c, opts = {}) {
  const blocked = acceptBlocker(c, opts);
  if (blocked) { toast(blocked); sfx.deny(); return false; }

  const r = rng();
  c.accepted = S.time;
  c.deadline = S.time + Math.round(CONTRACTS.deadline[0] +
    r.next() * (CONTRACTS.deadline[1] - CONTRACTS.deadline[0]));
  c.progress = 0;
  // The baseline is taken at acceptance, so a bounty for three kills means three *more*.
  c.base = baselineFor(c);
  S.contracts.active.push(c);

  // **Backfill the slot.**
  //
  // An accepted offer leaves the board and nothing replaced it until the next ninety-second
  // refresh, so a station's board shrank as you worked it — dock, take the three jobs you
  // want, and the desk is bare until a timer you cannot see says otherwise.
  //
  // That was survivable while the board had four job types and every station posted much the
  // same four. With templates it stopped being: `test/haul.mjs` accepts freight four times
  // in a row with no time passing and on the fourth found every board in the system stripped
  // of it, because the offers it wanted were the ones it had already taken.
  //
  // A desk that has just placed a job posts another. Same generator, same guarantees.
  const slot = S.contracts.boards[c.station];
  if (slot) {
    const i = slot.findIndex(x => x.id === c.id);
    if (i >= 0) {
      const desk = S.world.stations.find(x => x.userData.name === c.station);
      slot.splice(i, 1);
      if (desk) {
        const posted = new Set(slot.map(x => (x.template || x.type) + '@' + (x.site || '-')));
        const fill = makeContract(rng(), desk, S.time, null, null, posted);
        if (fill) slot.push(fill);
        // Through the same guarantees the refresh path uses, so a board cannot be drained of
        // the thing the guarantee protects simply by taking it.
        ensureGuarantees(slot, desk, S.time, rng());
      }
    }
  }

  // Haul: the station consigns the load onto your ship. You fly it to the destination and
  // hand it over there.
  //
  // `loaded` is what makes this a consignment rather than a gift. The cargo occupies your
  // hold and counts against capacity, but it is not yours to sell — see consignedFor()
  // below and the guard in economy.js sell(). Without that distinction, accepting a haul
  // and selling the load at the station that gave it to you was free money: measured at
  // +12,038 cr against a contract that only paid 8,264, which made abandoning strictly
  // better than delivering.
  //
  // A fleet-flown haul loads nothing here. The freighter picks the consignment up at the
  // origin as part of its logistics run, so putting it in the player's hold as well would
  // create the cargo twice and make `consignedFor()` lock a bay the founder is not using.
  if (!opts.toFleet && isConsignment(c) && c.target > 0) {
    S.cargo[c.commodity] = (S.cargo[c.commodity] || 0) + c.target;
    c.loaded = c.target;
  }

  const board = S.contracts.boards[c.station];
  if (board) S.contracts.boards[c.station] = board.filter(x => x.id !== c.id);

  toast(`Contract accepted — ${c.title}`, 4200);
  status(c.title);
  return true;
}

/**
 * The baseline a job is measured against, taken at acceptance.
 *
 * Keyed on `verb` rather than on `type` since v1.02.50 — a template names the verb, and two
 * templates with completely different fiction ("clear the approach", "break the scavengers")
 * are judged by the same counter. Old saves have no `verb`, so `type` is the fallback and a
 * contract accepted before this patch still completes.
 */
/**
 * Is this contract a consignment — goods the issuer loads onto you to carry elsewhere?
 *
 * `type === 'haul'` used to answer this, and after v1.02.50 it no longer can: a template
 * names a `verb`, and several templates with quite different fiction ("Consignment to
 * Nadir Halt", "Relief run — Iron Reach") are all deliveries while carrying whatever legacy
 * `type` the weighted draw happened to produce.
 *
 * Defined once and used at every site that cares, because the failure mode of getting it
 * wrong in one place is subtle and expensive: a delivery whose load is never put in the
 * hold completes for free, and a delivery whose load is never reclaimed on failure is a
 * gift. Both were live for exactly one test run.
 */
const isConsignment = c =>
  !!c && !!c.commodity && (c.verb ? c.verb === 'deliver' : c.type === 'haul') && !!c.dest;

function baselineFor(c) {
  const verb = c.verb || (c.type === 'bounty' ? 'destroy' : c.type === 'survey' ? 'scan' : 'deliver');
  if (verb === 'destroy') return { kills: S.player.kills };
  if (verb === 'scan') return { scans: Object.keys(S.scans || {}).length };
  if (verb === 'search') return { sweeps: searchCount() };
  if (verb === 'visit') return { visited: 0 };
  return { sold: 0 };            // deliver/acquire are credited by the sell hook
}

export function abandonContract(c) {
  const list = activeContracts();
  const i = list.findIndex(x => x.id === c.id);
  if (i < 0) return false;
  list.splice(i, 1);
  reclaim(c);
  penalise(c, 'abandoned');
  return true;
}

// ── consignment ──────────────────────────────────────────────────────

/**
 * How much of a commodity in the hold belongs to a contract rather than to the pilot.
 *
 * Derived from the active contracts rather than stored alongside the cargo, deliberately:
 * a second number that has to be kept in step with `loaded` is a second number that can
 * drift out of step with it, and this one already persists with the contract.
 */
export function consignedFor(key) {
  let n = 0;
  for (const c of activeContracts()) {
    if (isConsignment(c) && c.commodity === key) n += c.loaded || 0;
  }
  return Math.min(n, S.cargo[key] || 0);
}

/** What the pilot may actually sell — the hold less anything under consignment. */
export function sellableOf(key) {
  return Math.max(0, (S.cargo[key] || 0) - consignedFor(key));
}

/** Active hauls carrying a load that this station is the destination for. */
export function deliverableAt(station) {
  const name = station && station.userData && station.userData.name;
  if (!name) return [];
  return activeContracts().filter(c =>
    isConsignment(c) && c.dest === name && (c.loaded || 0) > 0);
}

/**
 * Hand over every load this station is waiting for. Removes the consigned cargo and
 * credits the contract; `updateContracts` sees the progress on its next pass and pays.
 *
 * Delivery is a separate act from selling because the load was never the pilot's to sell.
 * The contract fee is the payment for moving it.
 */
export function deliverConsignment(station = S.docked) {
  const due = deliverableAt(station);
  let moved = 0;
  for (const c of due) {
    const have = Math.min(c.loaded, S.cargo[c.commodity] || 0);
    if (have <= 0) continue;
    S.cargo[c.commodity] -= have;
    c.loaded -= have;
    c.progress += have;
    moved += have;
    toast(`Delivered ${Math.round(have)} kg ${COMMODITIES[c.commodity].name.toLowerCase()} — ${c.title}`, 4200);
  }
  if (moved) sfx.pickup();
  return moved;
}

/**
 * Take back a load that is not going to arrive. Called when a haul is abandoned or
 * expires — the goods were the issuer's, and a failed contract does not turn them into
 * yours. Clamped, because the hold can legitimately have less than was loaded: a raid or
 * a death can empty it, and a pilot cannot hand back what was shot out of them.
 */
function reclaim(c) {
  if (!c || !isConsignment(c) || !(c.loaded > 0)) return 0;
  const have = Math.min(c.loaded, S.cargo[c.commodity] || 0);
  if (have > 0) S.cargo[c.commodity] -= have;
  const short = c.loaded - have;
  c.loaded = 0;
  if (short > 0.5) {
    status(`${Math.round(short)} kg of the consignment was never recovered`);
  }
  return have;
}

/**
 * Move standing for a settled contract — with the desk that posted it, and with the bloc.
 *
 * The one place the two vocabularies meet, and deliberately the only one. The per-power
 * number is the real one: it feeds the career ladder, it gates the board, and going
 * through `adjustStanding()` means the Directorate's enemies notice you took Directorate
 * work, derived from the timeline rather than from a table contracts has to know about.
 *
 * The bloc number moves at a discount because it is a *coarser* claim — three numbers
 * standing in for nine — and letting it track a single power one-for-one would let a run
 * of Kestrel work talk the whole independent bloc into liking you. Docking rights, who
 * shoots first and the trade book all still read it; re-keying those is a later slice.
 */
function settleStanding(power, delta, reason) {
  adjustStanding(playerDossier(), power, delta, reason);
  adjust(blocOfPower(power), delta * CONTRACTS.blocShare, reason);
}

function penalise(c, why) {
  S.contracts.history.failed++;
  const fee = Math.round(c.pay * CONTRACTS.failCredits);
  S.credits = Math.max(0, S.credits - fee);
  settleStanding(c.issuer, CONTRACTS.failStanding, `contract ${why}`);
  toast(`Contract ${why} — ${c.title}${fee ? ` · −${fee} cr` : ''}`, 5200);
  sfx.deny();
}

// ── progress ─────────────────────────────────────────────────────────

/**
 * Called by economy.js when cargo is sold. Haul and supply contracts are credited here
 * rather than by polling, because "did a sale happen at the right station" is an event
 * and reconstructing it from state each frame would be guesswork.
 */
export function creditDelivery(station, key, kg) {
  for (const c of activeContracts()) {
    // Haul is credited by deliverConsignment(), not by selling. Crediting it here as well
    // double-counted: a pilot who had mined the same commodity could satisfy the contract
    // from their own stock and keep the consignment, collecting the fee and the goods.
    if (c.type !== 'supply') continue;
    if (c.commodity !== key) continue;
    if (c.dest && station.userData.name !== c.dest) continue;
    c.progress += kg;
  }
}

/** Polled once per frame. Cheap: at most CONTRACTS.maxActive predicates. */
export function updateContracts(dt) {
  if (!S.contracts) return;

  refreshT += dt;
  if (refreshT >= CONTRACTS.refresh) {
    refreshT = 0;
    // Refresh one station per cycle rather than all of them, so the board turns over
    // gradually and a player watching one station does not see it blink wholesale.
    const list = S.world.stations;
    if (list.length) refreshBoard(list[Math.floor(rng().next() * list.length)]);
  }

  const active = S.contracts.active;
  for (let i = active.length - 1; i >= 0; i--) {
    const c = active[i];

    // Polled, not evented, so a step can be satisfied by any route the player finds. Keyed
    // on the verb the template named; `type` is the pre-1.02.50 fallback.
    const verb = c.verb || (c.type === 'bounty' ? 'destroy' : c.type === 'survey' ? 'scan' : 'deliver');
    if (verb === 'destroy') c.progress = S.player.kills - c.base.kills;
    else if (verb === 'scan') c.progress = Object.keys(S.scans || {}).length - c.base.scans;
    else if (verb === 'search') c.progress = searchCount() - (c.base.sweeps || 0);
    else if (verb === 'visit') c.progress = c.base.visited || 0;

    if (c.progress >= c.target) { active.splice(i, 1); complete(c); continue; }
    if (S.time > c.deadline) { active.splice(i, 1); reclaim(c); penalise(c, 'expired'); }
  }
}

function complete(c) {
  c.done = true;
  S.contracts.history.done++;
  S.credits += c.pay;
  settleStanding(c.issuer, c.rep, 'contract completed');
  practice(c.skill, CONTRACTS.practicePerJob);
  crewEvent('contract');

  // The loop this patch exists to close. Work moves a skill and a standing; a skill and a
  // standing are what a rung asks for; a rung grants the qualification the next tier of
  // work demands. Checked here rather than polled, because "a rung was earned" is an
  // event and reconstructing it every frame would be guesswork.
  const me = playerDossier();
  const was = me.rung || 0;
  me.proficiency = playerDossier().proficiency;
  const now = refreshRung(me);
  if (now > was) {
    const rung = (LADDER[me.career] || { rungs: [] }).rungs[now];
    if (rung) {
      status(`Career rung — ${rung.title}`);
      toast(`${rung.title}. New work is open to you.`, 5600);
    }
  }

  sfx.pickup();
  toast(`Contract complete — ${c.title} · +${c.pay} cr`, 5200);
  status('Contract complete');
}

// ── reporting and persistence ────────────────────────────────────────

export function contractProgress(c) {
  if (!c || !c.target) return 0;
  return Math.max(0, Math.min(1, c.progress / c.target));
}

export const timeLeft = c => c.deadline ? Math.max(0, c.deadline - S.time) : Math.max(0, c.expires - S.time);

export function serializeContracts() {
  if (!S.contracts) return null;
  return {
    boards: S.contracts.boards,
    active: S.contracts.active,
    history: S.contracts.history
  };
}

export function restoreContracts(data) {
  if (!data) return false;
  S.contracts = {
    boards: data.boards || {},
    active: (data.active || []).filter(c => c && c.id && c.type),
    history: data.history || { done: 0, failed: 0 }
  };
  return true;
}
