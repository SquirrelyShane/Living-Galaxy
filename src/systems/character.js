// Living Galaxy — the pilot, as opposed to the ship.
//
// Before 0.6 "character" meant one string: which hull you had selected. Everything else
// about you was interchangeable. This is the other half — who you are, what you are good
// at, and how that changes because of what you actually spend your time doing.
//
// Two tracks, deliberately, because they answer different questions:
//
//   Skills rise from *use*. Mine ore and Extraction climbs. This is the honest one: it
//   says what you have actually been doing, and it cannot be gamed into a build you did
//   not fly. Lineage affinity scales the rate, so a Belter learns the belt faster than a
//   Core-born ever will — but the Core-born still gets there by doing the work.
//
//   Points are earned per level and spent wherever you like. This is the one that lets
//   you *decide* something: a prospector who wants to learn to shoot has a route that
//   does not require getting shot at for six hours first.
//
// Neither track alone is enough. Use-only progression punishes trying anything new;
// points-only progression makes what you do irrelevant.

import { S, recalcStats, registerCharacterBonuses, seatWeapon } from '../core/state.js';
import { CHAR } from '../core/config.js';
import { foundCompany, placeAtHQ } from './company.js';
import { SKILL_KEYS, LINEAGES, CORPORATIONS, CAREERS, agentFor } from '../data/origins.js';
import { toast, status } from '../ui/toast.js';

// ── construction ─────────────────────────────────────────────────────

/** A blank pilot. Never used directly in play — createCharacter fills it in. */
export function emptyCharacter() {
  const skills = {};
  for (const k of SKILL_KEYS) skills[k] = 0;
  return {
    name: '', lineage: null, corp: null, career: null, agent: null,
    level: 1, xp: 0, points: 0, spent: {},
    skills, progress: Object.assign({}, skills), created: false
  };
}

/**
 * Build a pilot from the three choices. Everything downstream — starting hull, weapon,
 * credits, standing, licences, the agent who will talk to you — falls out of these.
 */
export function createCharacter({ name, lineage, corp, career }) {
  const L = LINEAGES[lineage], C = CORPORATIONS[corp], K = CAREERS[career];
  if (!L || !C || !K) return null;
  // A corp you have no connection to should not be selectable, and the UI does not offer
  // it — but the function is also called from a save, so it checks rather than assumes.
  if (!L.corps.includes(corp)) return null;

  const ch = emptyCharacter();
  ch.name = (name || '').trim().slice(0, 16) || 'Unnamed';
  ch.lineage = lineage;
  ch.corp = corp;
  ch.career = career;
  ch.agent = K.agent;
  ch.created = true;

  for (const k of SKILL_KEYS) {
    ch.skills[k] = (L.start[k] || 0) + (K.start[k] || 0);
    ch.progress[k] = 0;
  }
  ch.points = CHAR.startingPoints;

  S.character = ch;
  S.licences = { [K.licence]: true };
  S.player.classKey = K.hull;
  S.ownedHulls = { [K.hull]: true };
  S.weapon = K.weapon;
  S.ownedWeapons = { [K.weapon]: true };
  S.credits = (L.credits || 0) + (C.credits || 0);
  S.probes = (S.probes || 0) + (C.probes || 0);

  // Owning an emitter and having one bolted on are two different facts, and the game
  // used to conflate them: `S.weapon` was set, the hardpoint stayed empty, and the ship
  // fired anyway out of a mount that did not exist. The yard now actually installs it.
  S.fit = null;                      // the career's hull may have different hardpoints
  recalcStats();
  seatWeapon(K.weapon);

  S.reputation = {};
  for (const bloc of ['coalition', 'pirate', 'independent']) {
    S.reputation[bloc] = (L.standing[bloc] || 0) + (C.standing[bloc] || 0);
  }

  // An executive does not launch as a pilot with a job; they launch as a founder with a
  // charter, a treasury and a board that will want to hear from them — and they start
  // already docked at the registered office, not drifting in open space.
  if (K.company) {
    foundCompany(ch, K.company);
    placeAtHQ();
  }

  recalcStats();
  return ch;
}

export const character = () => S.character;
export const hasCharacter = () => !!(S.character && S.character.created);

// ── skills ───────────────────────────────────────────────────────────

export function skill(key) {
  const ch = S.character;
  const base = ch && ch.skills ? ch.skills[key] || 0 : 0;
  const spent = ch && ch.spent ? ch.spent[key] || 0 : 0;
  return Math.min(CHAR.maxRank, base + spent);
}

/** Multiplier a skill contributes. Rank 0 is 1.0 — a fresh pilot is not penalised. */
export function skillMult(key) {
  return 1 + skill(key) * (CHAR.perRank[key] !== undefined ? CHAR.perRank[key] : CHAR.perRankDefault);
}

/** Lineage affinity for a skill: how fast it climbs from doing the thing. */
export function affinity(key) {
  const ch = S.character;
  const L = ch && LINEAGES[ch.lineage];
  return (L && L.affinity && L.affinity[key]) || 1;
}

/**
 * Record having done something. `amount` is in arbitrary practice units — the callers
 * scale it so that a minute of the relevant activity is worth roughly the same across
 * skills, because otherwise progression just measures which activity ticks fastest.
 */
export function practice(key, amount) {
  const ch = S.character;
  if (!ch || !ch.created || !SKILL_KEYS.includes(key) || !(amount > 0)) return 0;
  if (skill(key) >= CHAR.maxRank) return 0;

  const gain = amount * affinity(key) * CHAR.practiceRate;
  ch.progress[key] = (ch.progress[key] || 0) + gain;

  // Each rank costs more than the last, so early ranks come quickly and the last few
  // are a real commitment rather than a formality.
  const need = rankCost(ch.skills[key] || 0);
  if (ch.progress[key] >= need) {
    ch.progress[key] -= need;
    ch.skills[key] = (ch.skills[key] || 0) + 1;
    onRankUp(key);
  }
  addXp(gain * CHAR.xpPerPractice);
  return gain;
}

export const rankCost = rank => CHAR.rankBase * Math.pow(CHAR.rankGrowth, rank);
export const rankProgress = key => {
  const ch = S.character;
  if (!ch) return 0;
  return Math.min(1, (ch.progress[key] || 0) / rankCost(ch.skills[key] || 0));
};

function onRankUp(key) {
  recalcStats();
  status(`${key.charAt(0).toUpperCase() + key.slice(1)} rank ${skill(key)}`);
  toast(`Skill up — ${key} is now rank ${skill(key)}`, 2800);
}

// ── levels and points ────────────────────────────────────────────────

export const levelCost = level => Math.round(CHAR.levelBase * Math.pow(CHAR.levelGrowth, level - 1));

export function addXp(amount) {
  const ch = S.character;
  if (!ch || !ch.created || !(amount > 0)) return;
  ch.xp += amount;
  let guard = 0;
  while (ch.xp >= levelCost(ch.level) && ch.level < CHAR.maxLevel && guard++ < 64) {
    ch.xp -= levelCost(ch.level);
    ch.level++;
    ch.points += CHAR.pointsPerLevel;
    toast(`Level ${ch.level} — ${CHAR.pointsPerLevel} skill point${CHAR.pointsPerLevel > 1 ? 's' : ''} available`, 3600);
    status(`Pilot level ${ch.level}`);
  }
}

/** Spend a point. Returns false rather than throwing when it cannot be done. */
export function spendPoint(key) {
  const ch = S.character;
  if (!ch || !ch.created) return false;
  if (!SKILL_KEYS.includes(key)) return false;
  if (ch.points <= 0) return false;
  if (skill(key) >= CHAR.maxRank) return false;
  ch.spent[key] = (ch.spent[key] || 0) + 1;
  ch.points--;
  recalcStats();
  toast(`${key} raised to rank ${skill(key)}`);
  return true;
}

/** Total invested, for the UI and for respec pricing later. */
export const pointsSpent = () =>
  Object.values((S.character && S.character.spent) || {}).reduce((a, b) => a + b, 0);

// ── licences ─────────────────────────────────────────────────────────
// The hybrid the design asked for: your career hands you one licence on day one, and
// every other hull is unlocked later by being demonstrably ready for it. Skills bring
// the price down, so a pilot who has actually flown the work pays less than one who
// simply saved up.

export function hasLicence(hullKey) {
  return !!(S.licences && S.licences[hullKey]);
}

export function licenceReq(hullKey) {
  return CHAR.licences[hullKey] || null;
}

/**
 * What a licence costs right now: a base fee, discounted by how far past the required
 * rank you are, and by Commerce.
 */
export function licencePrice(hullKey) {
  const req = licenceReq(hullKey);
  if (!req) return null;
  const over = Math.max(0, skill(req.skill) - req.rank);
  const skillCut = Math.min(CHAR.licenceMaxCut, over * CHAR.licenceCutPerRank);
  const commerceCut = Math.min(0.20, (skill('commerce') * 0.02));
  return Math.round(req.price * (1 - skillCut) * (1 - commerceCut));
}

/** Why you cannot buy it, in words, or null if you can. */
export function licenceBlocker(hullKey) {
  if (hasLicence(hullKey)) return 'Already held';
  const req = licenceReq(hullKey);
  if (!req) return 'No licence exists for that hull';
  if (skill(req.skill) < req.rank) return `${req.skill} rank ${req.rank} required`;
  if (S.credits < licencePrice(hullKey)) return 'Insufficient credits';
  return null;
}

export function buyLicence(hullKey) {
  const blocked = licenceBlocker(hullKey);
  if (blocked) { toast(blocked); return false; }
  const price = licencePrice(hullKey);
  S.credits -= price;
  S.licences[hullKey] = true;
  toast(`${hullKey} licence issued`, 3200);
  status('Licence issued');
  return true;
}

// ── derived effects ──────────────────────────────────────────────────
// Read by recalcStats(). Kept as one function so there is exactly one place that decides
// what a rank is worth, and the tests can assert against it directly.

export function characterBonuses() {
  const ch = S.character;
  const out = { weaponMult: 0, miningMult: 0, energyRegenAdd: 0, warpSpeedMult: 0,
                sensorMult: 0, scanRate: 0, tradeBonus: 0, signatureMult: 0, cargoPct: 0,
                repairDiscount: 0, upgradeDiscount: 0, dockDiscount: 0 };
  if (!ch || !ch.created) return out;

  out.weaponMult    += skill('gunnery')     * CHAR.perRank.gunnery;
  out.energyRegenAdd += skill('engineering') * CHAR.engineeringRegen;
  out.miningMult    += skill('extraction')  * CHAR.perRank.extraction;
  out.warpSpeedMult += skill('navigation')  * CHAR.perRank.navigation;
  out.tradeBonus    += skill('commerce')    * CHAR.perRank.commerce;
  out.sensorMult    += skill('sensors')     * CHAR.perRank.sensors;
  out.scanRate      += skill('sensors')     * 0.06;
  // Sensor discipline cuts your own signature as well as extending your reach — the
  // skill is about understanding emissions, and that cuts both ways.
  out.signatureMult -= skill('sensors')     * CHAR.sensorQuieting;

  const L = LINEAGES[ch.lineage];
  if (L && L.signature) out.signatureMult += (L.signature - 1);

  const C = CORPORATIONS[ch.corp];
  if (C && C.bonus) for (const k in C.bonus) out[k] = (out[k] || 0) + C.bonus[k];

  return out;
}

/** Multiplier applied to the player's detection signature. Never below a hard floor. */
export function signatureScale() {
  return Math.max(CHAR.signatureFloor, 1 + (characterBonuses().signatureMult || 0));
}

// ── reporting ────────────────────────────────────────────────────────

registerCharacterBonuses(characterBonuses, skill);

export function characterSheet() {
  const ch = S.character;
  if (!ch || !ch.created) return null;
  const L = LINEAGES[ch.lineage], C = CORPORATIONS[ch.corp], K = CAREERS[ch.career];
  return {
    name: ch.name,
    lineage: L && L.name, corp: C && C.name, career: K && K.name,
    machine: !!(L && L.machine),
    level: ch.level, xp: Math.round(ch.xp), toNext: levelCost(ch.level), points: ch.points,
    agent: agentFor(ch.career, ch.lineage),
    skills: SKILL_KEYS.map(k => ({
      key: k, rank: skill(k), progress: rankProgress(k),
      affinity: affinity(k), spent: (ch.spent && ch.spent[k]) || 0
    })),
    licences: Object.keys(S.licences || {}).filter(k => S.licences[k])
  };
}
