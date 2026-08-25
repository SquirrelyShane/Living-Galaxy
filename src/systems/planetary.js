// Living Galaxy — planetary industry.
//
// A site is a claim on a world with a command centre on it and facilities plugged into
// that centre. It extracts, it refines, it manufactures, and it does all of it while you
// are somewhere else — which is the point. The ship is where you spend attention; the
// ground is where you spend *time*.
//
// Three constraints shape every decision on a site, and they are deliberately different in
// kind so that no single number decides everything:
//
//   **Slots** are the hard cap. Ten on a PIC and that is that.
//   **Power** is a budget you can raise by spending slots on reactors — the classic
//     tradeoff, and the reason a well-built site is not simply the ten best facilities.
//   **Workforce** comes from habitation and multiplies output. It is the one that new
//     players miss, so it is visible on the site card rather than buried.
//
// Production is a tick, not a simulation: the site does not model individual conveyor
// belts. It accrues materials at a rate, and the rate is a product of richness, facility
// throughput, workforce and power satisfaction. That is enough for the decisions to matter
// and cheap enough to run twenty sites on a phone.

import { S } from '../core/state.js';
import { PLANETARY } from '../core/config.js';
import { COMMAND_CENTRES, FACILITIES, canBuild, resourcesFor, richnessOf,
         traits, upgradesFrom } from '../data/planetary/index.js';
import { MATERIALS, materialName } from '../data/crafting/index.js';
import { addMaterial, takeMaterial, held, buildHours, queueJob } from './crafting.js';
import { assayOf } from './orders.js';
import { featureAssayOf } from './survey.js';
import { toast, status } from '../ui/toast.js';
import { sfx } from './audio.js';

export const sites = () => (S.sites = S.sites || []);
export const siteAt = bodyName => sites().find(s => s.body === bodyName) || null;
export const siteById = id => sites().find(s => s.id === id) || null;

let nextSite = 1;

// ── founding ─────────────────────────────────────────────────────────

/**
 * Plant a command centre. This is the expensive, irreversible-ish act — everything after
 * it is incremental.
 */
/**
 * Why founding here would be refused, or null if it would go through.
 *
 * Split out of `foundSite()` so a panel can *show* the reason on a disabled button instead
 * of the player discovering it by pressing one and getting a toast. `foundSite()` still
 * performs every check itself — this is a second reader of the same rules, never a
 * replacement for them, because a UI that gates on a stale copy of a rule is worse than a
 * UI that does not gate at all.
 */
export function foundBlocker(body, centreKey) {
  const u = body && body.userData;
  if (!u || (u.kind !== 'planet' && u.kind !== 'moon')) return 'not a world';
  if (siteAt(u.name)) return 'occupied';
  const centre = COMMAND_CENTRES[centreKey];
  if (!centre) return 'unknown';
  if (!centre.worlds.includes(u.ptype)) return 'wrong world';
  if (sites().length >= PLANETARY.maxSites) return 'at limit';
  for (const m in centre.build) {
    if (held(m) < centre.build[m]) return 'short ' + materialName(m);
  }
  return null;
}

export function foundSite(body, centreKey) {
  const u = body && body.userData;
  if (!u || (u.kind !== 'planet' && u.kind !== 'moon')) {
    toast('A site needs a planet or a moon'); sfx.deny(); return null;
  }
  if (siteAt(u.name)) { toast(`${u.name} already has a site`); sfx.deny(); return null; }
  const centre = COMMAND_CENTRES[centreKey];
  if (!centre) return null;
  if (!centre.worlds.includes(u.ptype)) {
    toast(`A ${centre.name} cannot be built on a ${u.ptype} world`); sfx.deny(); return null;
  }
  if (sites().length >= PLANETARY.maxSites) {
    toast(`You can hold ${PLANETARY.maxSites} sites`); sfx.deny(); return null;
  }

  const cost = centre.build;
  for (const m in cost) {
    if (held(m) < cost[m]) {
      toast(`Short ${Math.ceil(cost[m] - held(m))} ${materialName(m)}`); sfx.deny(); return null;
    }
  }
  for (const m in cost) takeMaterial(m, cost[m]);

  const site = {
    id: nextSite++,
    body: u.name, ptype: u.ptype,
    centre: centreKey,
    facilities: [],
    store: {},
    built: S.time,
    buildRemaining: centre.hours,
    power: 0, workforce: 0
  };
  sites().push(site);
  status(`${centre.name} founded on ${u.name}`);
  toast(`${u.name} \u2014 ${centre.name} under construction, ${centre.hours}h`, 5000);
  sfx.pickup();
  return site;
}

/**
 * Upgrade the command centre. A PIC is reached *through* a tier-2 site, never directly
 * from an outpost — see centres.js. The facilities already installed survive: you are
 * rebuilding the core, not the works around it.
 */
/**
 * Why an upgrade would be refused, or null. Same relationship to `upgradeCentre()` as
 * `foundBlocker()` has to `foundSite()`: a second reader of the rules so a panel can put the
 * reason on the button, never a replacement for the checks in the verb itself.
 */
export function upgradeBlocker(siteId, centreKey) {
  const site = siteById(siteId);
  if (!site) return 'no site';
  if (site.buildRemaining > 0) return 'building';
  if (!upgradesFrom(site.centre, site.ptype).includes(centreKey)) return 'not a step up';
  const centre = COMMAND_CENTRES[centreKey];
  if (!centre) return 'unknown';
  for (const m in centre.build) {
    if (held(m) < centre.build[m]) return 'short ' + materialName(m);
  }
  return null;
}

export function upgradeCentre(siteId, centreKey) {
  const site = siteById(siteId);
  if (!site) return false;
  const options = upgradesFrom(site.centre, site.ptype);
  if (!options.includes(centreKey)) {
    toast(`Cannot upgrade straight to that from a ${COMMAND_CENTRES[site.centre].name}`);
    sfx.deny(); return false;
  }
  const centre = COMMAND_CENTRES[centreKey];
  for (const m in centre.build) {
    if (held(m) < centre.build[m]) {
      toast(`Short ${Math.ceil(centre.build[m] - held(m))} ${materialName(m)}`);
      sfx.deny(); return false;
    }
  }
  for (const m in centre.build) takeMaterial(m, centre.build[m]);
  site.centre = centreKey;
  site.buildRemaining = centre.hours;
  toast(`${site.body} upgrading to ${centre.name} \u2014 ${centre.hours}h`, 5000);
  sfx.pickup();
  return true;
}

export function abandonSite(siteId) {
  const list = sites();
  const i = list.findIndex(s => s.id === siteId);
  if (i < 0) return false;
  const site = list[i];
  // Whatever is in the store comes with you; the buildings do not.
  for (const m in site.store) addMaterial(m, Math.floor(site.store[m]));
  list.splice(i, 1);
  toast(`${site.body} abandoned \u2014 stores recovered`);
  return true;
}

// ── facilities ───────────────────────────────────────────────────────

export const slotsUsed = site =>
  site.facilities.reduce((a, f) => a + (FACILITIES[f.id] ? FACILITIES[f.id].slots : 0), 0);

export const slotsTotal = site => (COMMAND_CENTRES[site.centre] || {}).slots || 0;

export const powerDraw = site =>
  site.facilities.filter(f => f.on !== false)
    .reduce((a, f) => a + (FACILITIES[f.id] ? FACILITIES[f.id].power : 0), 0);

export const powerSupply = site => {
  const base = (COMMAND_CENTRES[site.centre] || {}).power || 0;
  const extra = site.facilities.filter(f => f.on !== false)
    .reduce((a, f) => a + ((FACILITIES[f.id] && FACILITIES[f.id].effect &&
                            FACILITIES[f.id].effect.power) || 0), 0);
  return base + extra;
};

/**
 * How much of what the site wants to draw it can actually feed, 0–1.
 *
 * Brownout rather than blackout, for the same reason the fitting budget in 0.7 degrades
 * rather than refusing: a site that silently stops is a bug report, and a site running at
 * 60% with a red number on the card is a decision.
 */
export const powerSatisfaction = site => {
  const draw = powerDraw(site);
  if (draw <= 0) return 1;
  return Math.max(PLANETARY.brownoutFloor, Math.min(1, powerSupply(site) / draw));
};

export const workforce = site =>
  site.facilities.filter(f => f.on !== false)
    .reduce((a, f) => a + ((FACILITIES[f.id] && FACILITIES[f.id].effect &&
                            FACILITIES[f.id].effect.population) || 0), 0);

/** Output multiplier from habitation. Diminishing, so the answer is never "all habs". */
export const workforceBonus = site => {
  const pop = workforce(site);
  return 1 + Math.min(PLANETARY.maxWorkforceBonus,
                      Math.sqrt(pop / PLANETARY.workforceRef) * PLANETARY.workforceScale);
};

export const storageCap = site => {
  const base = PLANETARY.baseStorage;
  const extra = site.facilities.filter(f => f.on !== false)
    .reduce((a, f) => a + ((FACILITIES[f.id] && FACILITIES[f.id].effect &&
                            FACILITIES[f.id].effect.storage) || 0), 0);
  return base + extra;
};

export const stored = site =>
  Object.values(site.store || {}).reduce((a, b) => a + b, 0);

export function installBlocker(siteId, facilityId) {
  const site = siteById(siteId);
  const f = FACILITIES[facilityId];
  if (!site || !f) return 'Unknown site or facility';
  if (site.buildRemaining > 0) return 'Command centre still under construction';
  const check = canBuild(facilityId, site.ptype, site);
  if (!check.ok) return check.why;
  if (slotsUsed(site) + f.slots > slotsTotal(site)) return 'No free slots';
  for (const m in f.build) {
    if (held(m) < f.build[m]) return `Short ${Math.ceil(f.build[m] - held(m))} ${materialName(m)}`;
  }
  return null;
}

export function installFacility(siteId, facilityId) {
  const why = installBlocker(siteId, facilityId);
  if (why) { toast(why); sfx.deny(); return false; }
  const site = siteById(siteId);
  const f = FACILITIES[facilityId];
  for (const m in f.build) takeMaterial(m, f.build[m]);
  site.facilities.push({ id: facilityId, on: true, remaining: f.hours, progress: 0 });
  toast(`${f.name} under construction on ${site.body} \u2014 ${f.hours}h`, 4200);
  sfx.pickup();
  return true;
}

export function removeFacility(siteId, index) {
  const site = siteById(siteId);
  if (!site || !site.facilities[index]) return false;
  const inst = site.facilities[index];
  const f = FACILITIES[inst.id];
  site.facilities.splice(index, 1);
  // Salvage back what a teardown realistically recovers.
  for (const m in f.build) addMaterial(m, Math.floor(f.build[m] * PLANETARY.teardownRefund));
  toast(`${f.name} dismantled \u2014 ${Math.round(PLANETARY.teardownRefund * 100)}% recovered`);
  return true;
}

/** Switch a facility off without dismantling it — the answer to a brownout. */
export function toggleFacility(siteId, index) {
  const site = siteById(siteId);
  const inst = site && site.facilities[index];
  if (!inst) return false;
  inst.on = inst.on === false;
  return true;
}

// ── production ───────────────────────────────────────────────────────

/** What a single extractor pulls, per hour, from this world. */
function extractionFor(site, inst, hours, mult) {
  const f = FACILITIES[inst.id];
  const kinds = { ore: ['RAW'], gas: ['RAW'], liquid: ['RAW'], bio: ['BIO'] };
  const prefixes = kinds[f.extracts] || ['RAW'];
  const out = {};
  const list = resourcesFor(site.ptype).filter(r => prefixes.some(p => r.id.startsWith(p)));
  if (!list.length) return out;

  // A drill on a world rich in six things pulls all six, proportionally. Splitting the
  // rate rather than picking one keeps a site's output legible: what you get is what the
  // survey said was down there.
  const total = list.reduce((a, r) => a + r.richness, 0);
  // A world a survey crew has worked pays out better forever. This is the one thing in the
  // game that compounds: the order costs hours once and every extractor you ever build
  // there is paid on it.
  // A survey crew raises the assay; a surface feature you found yourself raises it too,
  // and permanently. This is the line that makes probing a world before you build on it
  // worth the probe. See systems/survey.js.
  const surveyed = 1 + assayOf(site.body) + featureAssayOf(site.body);
  for (const r of list) {
    out[r.id] = f.rate * hours * mult * surveyed *
                (r.richness / total) * list.length * PLANETARY.yieldScale;
  }
  return out;
}

/**
 * Advance every site by `hours` of game time.
 *
 * Runs on the same slow cadence as the rest of the world simulation rather than per frame:
 * a planetary industry that needed 60 Hz would be a planetary industry nobody could afford
 * to have twenty of.
 */
export function updateSites(hours) {
  if (!(hours > 0)) return;
  for (const site of sites()) {
    if (site.buildRemaining > 0) {
      site.buildRemaining -= hours;
      if (site.buildRemaining <= 0) {
        site.buildRemaining = 0;
        toast(`${site.body} \u2014 ${COMMAND_CENTRES[site.centre].name} operational`, 5000);
      }
      continue;
    }

    const power = powerSatisfaction(site);
    const crew = workforceBonus(site);
    const mult = power * crew;
    const cap = storageCap(site);

    for (const inst of site.facilities) {
      if (inst.on === false) continue;
      const f = FACILITIES[inst.id];
      if (!f) continue;

      if (inst.remaining > 0) {
        inst.remaining -= hours;
        if (inst.remaining <= 0) {
          inst.remaining = 0;
          status(`${f.name} online at ${site.body}`);
        }
        continue;
      }

      if (f.extracts) {
        const yielded = extractionFor(site, inst, hours, mult);
        for (const m in yielded) {
          if (stored(site) >= cap) break;      // a full store idles the pit, visibly
          site.store[m] = (site.store[m] || 0) + yielded[m];
        }
      }

      if (f.refines) refineTick(site, f, hours, mult);
    }

    site.power = power;
    site.workforce = workforce(site);
  }
}

/**
 * Refining: consume the cheapest thing the site holds that this facility can upgrade, and
 * produce the refined form.
 *
 * Deliberately simple — a full recipe solver on the ground would be a second crafting
 * system with its own bugs. A smelter turns ore into metal at a ratio; the interesting
 * decisions are which world, which facilities and how much power, not which of nine
 * smelting recipes to pick.
 */
function refineTick(site, f, hours, mult) {
  const throughput = f.throughput * hours * mult;
  const pairs = f.bio ? PLANETARY.bioChain : PLANETARY.refineChain;
  for (const [from, to, ratio] of pairs) {
    const have = site.store[from] || 0;
    if (have <= 0) continue;
    const used = Math.min(have, throughput);
    site.store[from] = have - used;
    if (site.store[from] <= 0.001) delete site.store[from];
    site.store[to] = (site.store[to] || 0) + used * ratio;
    return;                                  // one chain per tick per facility
  }
}

// ── transfer ─────────────────────────────────────────────────────────

/** Pull a site's store into the ship's material stock. Needs to be in range. */
export function collectFrom(siteId, matId = null) {
  const site = siteById(siteId);
  if (!site) return 0;
  let moved = 0;
  for (const m in site.store) {
    if (matId && m !== matId) continue;
    const qty = Math.floor(site.store[m]);
    if (qty <= 0) continue;
    addMaterial(m, qty);
    site.store[m] -= qty;
    if (site.store[m] <= 0.001) delete site.store[m];
    moved += qty;
  }
  if (moved) { toast(`${moved} units lifted from ${site.body}`); sfx.pickup(); }
  return moved;
}

/**
 * Push materials down to a site, so its fabricators have something to work with.
 *
 * Returns the quantity actually landed, which is not always what was asked for. Two clamps,
 * and the second one was a bug found at v1.01.98 while giving the caller a quantity control:
 * production ticks respect `storageCap()` and this did not, so a hand delivery could push a
 * ground store past a cap the site's own facilities honour. It now fills to the cap and says
 * how much it took, rather than silently overfilling or silently refusing.
 */
export function deliverTo(siteId, matId, qty) {
  const site = siteById(siteId);
  if (!site || !(qty > 0)) return 0;

  const room = Math.floor(storageCap(site) - stored(site));
  if (room <= 0) { toast(`${site.body} ground store is full`); sfx.deny(); return 0; }

  const want = Math.min(Math.floor(qty), room);
  if (!takeMaterial(matId, want)) { toast(`Not carrying ${want} ${materialName(matId)}`); return 0; }
  site.store[matId] = (site.store[matId] || 0) + want;
  if (want < Math.floor(qty)) toast(`Only ${want} fit — ${site.body} store is at cap`);
  return want;
}

/** Queue a build at a site rather than aboard the ship. */
export function manufactureAt(siteId, itemId, qty = 1) {
  const site = siteById(siteId);
  if (!site) return null;
  const cat = itemId.startsWith('AMMO-') ? 'ammo'
            : itemId.startsWith('WPN-') ? 'weapon'
            : itemId.startsWith('ITM-') ? 'personal' : 'module';
  const line = site.facilities.find(inst => {
    const f = FACILITIES[inst.id];
    return f && inst.on !== false && inst.remaining <= 0 &&
           f.manufactures && f.manufactures.includes(cat);
  });
  if (!line) { toast(`${site.body} has no line for ${cat}s`); sfx.deny(); return null; }
  const f = FACILITIES[line.id];
  return queueJob(itemId, { qty, where: site.body, facility: line.id, speed: f.speed || 1 });
}

// ── reporting ────────────────────────────────────────────────────────

export function siteReport(siteId) {
  const site = siteById(siteId);
  if (!site) return null;
  const centre = COMMAND_CENTRES[site.centre];
  return {
    id: site.id, body: site.body, ptype: site.ptype,
    centre: centre.name, tier: centre.tier,
    building: site.buildRemaining > 0 ? site.buildRemaining : 0,
    slots: { used: slotsUsed(site), total: slotsTotal(site) },
    power: { draw: powerDraw(site), supply: powerSupply(site),
             satisfaction: powerSatisfaction(site) },
    workforce: workforce(site),
    workforceBonus: workforceBonus(site),
    storage: { used: stored(site), cap: storageCap(site) },
    upgrades: upgradesFrom(site.centre, site.ptype),
    facilities: site.facilities.map((inst, i) => {
      const f = FACILITIES[inst.id];
      return { index: i, id: inst.id, name: f ? f.name : inst.id,
               branch: f ? f.branch : null, on: inst.on !== false,
               building: inst.remaining > 0 ? inst.remaining : 0 };
    }),
    store: Object.keys(site.store).map(m => ({
      id: m, name: materialName(m), qty: Math.floor(site.store[m])
    })).sort((a, b) => b.qty - a.qty)
  };
}

export const empireReport = () => ({
  sites: sites().length,
  operational: sites().filter(s => s.buildRemaining <= 0).length,
  facilities: sites().reduce((a, s) => a + s.facilities.length, 0),
  stored: sites().reduce((a, s) => a + stored(s), 0),
  upkeep: sites().reduce((a, s) => a + ((COMMAND_CENTRES[s.centre] || {}).upkeep || 0), 0)
});

// ── persistence ──────────────────────────────────────────────────────

export const serializeSites = () => sites();

export function restoreSites(list) {
  S.sites = Array.isArray(list) ? list.filter(s => s && COMMAND_CENTRES[s.centre]) : [];
  // Facilities from a build that no longer defines them are dropped rather than left as
  // dead slots nobody can explain.
  for (const s of S.sites) {
    s.facilities = (s.facilities || []).filter(f => FACILITIES[f.id]);
    s.store = s.store || {};
  }
  nextSite = S.sites.length ? Math.max(...S.sites.map(s => s.id)) + 1 : 1;
  return true;
}
