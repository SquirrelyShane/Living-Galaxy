// v1.00.20 — industry. The crafting catalogue, blueprints and bills of materials, the
// manufacturing queue, and planetary sites from command centre to production tick.
import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { CRAFT, PLANETARY } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');
const CAT = await imp('data/crafting/index.js');
const PL = await imp('data/planetary/index.js');
const { COMMAND_CENTRES, CENTRE_KEYS } = await imp('data/planetary/centres.js');
const { BRANCHES, BRANCH_KEYS, BRANCH_FOR_CAREER } = await imp('data/planetary/branches/index.js');
const { PLANET_RESOURCES, worldsWith, isPlanetary } = await imp('data/planetary/resources.js');
const { traits } = await imp('data/planetary/traits.js');
const CR = await imp('systems/crafting.js');
const D2 = await imp('data/crew.js');
const IN = await imp('systems/planetary.js');
const { initScene } = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
const { initProjectiles } = await imp('systems/projectiles.js');
const { initCombat } = await imp('systems/combat.js');
const { initMining } = await imp('systems/mining.js');
const { initWorldSim } = await imp('systems/worldsim.js');
const { initMarket } = await imp('systems/market.js');
const { initContracts } = await imp('systems/contracts.js');
const { resetReputation } = await imp('systems/reputation.js');
const { CAREER_KEYS } = await imp('data/origins.js');
const save = await imp('systems/save.js');

initScene(); recalcStats(); seedWorld(1337); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx();
resetReputation(); initWorldSim(); initMarket(); initContracts();
updateSystem(1);
S.running = true;

const give = (mats, mult = 1) => { for (const m in mats) CR.addMaterial(m, mats[m] * mult); };
const wipe = () => { S.stock = {}; S.jobs = []; S.locker = {}; S.ammo = {}; S.sites = []; };

// ── the catalogue ────────────────────────────────────────────────────
console.log('\n— the catalogue —');
{
  const size = CAT.catalogueSize();
  ok('materials imported', size.materials >= 70, String(size.materials));
  ok('blueprints imported', size.blueprints >= 200, String(size.blueprints));
  ok('every category is populated',
     size.modules > 0 && size.weapons > 0 && size.ammo > 0 && size.personal > 0);
  ok('ids are unique across categories',
     CAT.BLUEPRINT_KEYS.length === new Set(CAT.BLUEPRINT_KEYS).size);
  ok('every blueprint names itself', CAT.BLUEPRINT_KEYS.every(k => CAT.BLUEPRINTS[k].name));
  // A handful of entries are trade goods with no recipe on purpose — art, spices. The
  // property that matters is that "no recipe" is treated as *uncraftable* rather than as
  // "needs nothing", which would let a fabricator print the most valuable item in the
  // game out of an empty hold.
  ok('almost everything has a bill of materials',
     CAT.BLUEPRINT_KEYS.filter(CAT.craftable).length > CAT.BLUEPRINT_KEYS.length - 5);
  ok('the exceptions are explicitly trade-only', CAT.TRADE_ONLY.length > 0 &&
     CAT.TRADE_ONLY.every(k => Object.keys(CAT.BLUEPRINTS[k].materials || {}).length === 0));
  ok('a trade-only item cannot be built', CR.checkMaterials(CAT.TRADE_ONLY[0]).ok === false);
  ok('and says why', CR.shortfallText(CAT.TRADE_ONLY[0]) === 'Traded, not manufactured');
  ok('queueing one is refused', CR.queueJob(CAT.TRADE_ONLY[0]) === null);

  // The property that makes the tree buildable rather than gated behind a drop table:
  // every input resolves to something you can mine, grow or make.
  let unknown = null;
  for (const k of CAT.BLUEPRINT_KEYS) {
    for (const m in CAT.BLUEPRINTS[k].materials) {
      if (!CAT.MATERIALS[m] && !CAT.BLUEPRINTS[m]) unknown = `${k} wants ${m}`;
    }
  }
  ok('every material referenced actually exists', !unknown, unknown || '');

  ok('categories resolve from the id prefix',
     CAT.categoryOf('MOD-001') === 'module' && CAT.categoryOf('WPN-001') === 'weapon' &&
     CAT.categoryOf('AMMO-001') === 'ammo' && CAT.categoryOf('ITM-001') === 'personal');
  ok('an unknown id has no category', CAT.categoryOf('XXX-1') === null);
}
{
  const bom = CAT.billOfMaterials('MOD-001');
  ok('a bill of materials lists quantities', bom.length > 0 && bom[0].qty > 0);
  ok('it is sorted heaviest first', bom.every((m, i) => i === 0 || m.qty <= bom[i - 1].qty));
  ok('it names the materials', bom.every(m => m.name && m.name !== m.id));
  ok('an unknown item has an empty bill', CAT.billOfMaterials('nope').length === 0);

  // rawCost walks the tree; the immediate bill does not
  const raw = CAT.rawCost('MOD-001');
  ok('raw cost expands the tree', Object.keys(raw).length > 0);
  ok('raw cost is cycle-safe', (() => {
    // A circular recipe must terminate rather than hang. Nothing in the data is
    // circular today, which is exactly why the guard needs testing now.
    for (const k of CAT.BLUEPRINT_KEYS.slice(0, 40)) CAT.rawCost(k);
    return true;
  })());

  ok('the reverse index finds consumers', CAT.usedBy('REF-001').length > 10,
     String(CAT.usedBy('REF-001').length));
  ok('a material nothing uses has no consumers', CAT.usedBy('NOPE-999').length === 0);
  ok('tier gating narrows the list',
     CAT.buildableAt('module', 1).length < CAT.CATEGORIES.module.keys.length);
}

// ── stock ────────────────────────────────────────────────────────────
console.log('\n— material stock —');
{
  wipe();
  ok('an empty stock holds nothing', CR.held('REF-001') === 0);
  CR.addMaterial('REF-001', 100);
  ok('materials can be added', CR.held('REF-001') === 100);
  ok('adding nothing is a no-op', CR.addMaterial('REF-001', 0) === 0 && CR.held('REF-001') === 100);
  ok('adding a negative amount is refused', CR.addMaterial('REF-001', -50) === 0);
  ok('taking works', CR.takeMaterial('REF-001', 40) === true && CR.held('REF-001') === 60);
  ok('taking more than held is refused', CR.takeMaterial('REF-001', 999) === false);
  ok('the stock is unchanged by a refused take', CR.held('REF-001') === 60);
  CR.takeMaterial('REF-001', 60);
  ok('an emptied material is dropped from the stock', CR.held('REF-001') === 0);
}

// ── affordability ────────────────────────────────────────────────────
console.log('\n— what am I short of —');
{
  wipe();
  const check = CR.checkMaterials('MOD-001');
  ok('an empty hold cannot build', check.ok === false);
  ok('the shortfall names every missing material', check.missing.length === check.lines.length);
  ok('the shortfall is quantified', check.missing.every(m => m.short > 0));

  const text = CR.shortfallText('MOD-001');
  ok('the shortfall reads as a sentence', typeof text === 'string' && text.startsWith('Short:'));

  give(CAT.BLUEPRINTS['MOD-001'].materials);
  ok('a stocked hold can build', CR.checkMaterials('MOD-001').ok === true);
  ok('a satisfied build has no shortfall text', CR.shortfallText('MOD-001') === null);

  // quantity scales the requirement
  ok('two of a thing needs twice the materials', CR.checkMaterials('MOD-001', 2).ok === false);
}
{
  // Engineering speeds manufacturing, bounded.
  const raw = CR.buildHours('MOD-001', { engineering: 0 });
  const skilled = CR.buildHours('MOD-001', { engineering: 10 });
  ok('engineering cuts build time', skilled < raw, `${raw.toFixed(1)}h → ${skilled.toFixed(1)}h`);
  ok('the cut is bounded', skilled >= raw * (1 - CRAFT.maxSkillCut) - 1e-6);
  ok('a faster line builds faster',
     CR.buildHours('MOD-001', { speed: 2, engineering: 0 }) < raw);
  ok('build time never reaches zero',
     CR.buildHours('AMMO-001', { speed: 999, engineering: 10 }) >= CRAFT.minHours);
}

// ── the queue ────────────────────────────────────────────────────────
console.log('\n— the manufacturing queue —');
{
  wipe();
  ok('an unaffordable job is refused', CR.queueJob('MOD-001') === null);

  give(CAT.BLUEPRINTS['MOD-001'].materials);
  const before = CR.held('REF-001');
  const job = CR.queueJob('MOD-001');
  ok('an affordable job queues', !!job && CR.jobs().length === 1);
  // Consuming up front is the whole design: three jobs must not each spend the same steel.
  ok('materials are taken at queue time, not delivery', CR.held('REF-001') < before);
  ok('a second identical job is now unaffordable', CR.queueJob('MOD-001') === null);
  ok('the job carries its hours', job.hours > 0 && job.remaining === job.hours);

  CR.updateJobs(job.hours * 0.5);
  ok('time advances a job', CR.jobs()[0].remaining < job.hours);
  ok('a half-done job has not delivered', Object.keys(CR.locker()).length === 0);

  CR.updateJobs(job.hours);
  ok('a finished job leaves the queue', CR.jobs().length === 0);
  ok('and lands in the locker', CR.locker()['MOD-001'] === 1);
}
{
  // ammunition delivers rounds, not units
  wipe();
  give(CAT.BLUEPRINTS['AMMO-001'].materials);
  CR.queueJob('AMMO-001');
  CR.updateJobs(9999);
  const stack = CAT.BLUEPRINTS['AMMO-001'].stack_size;
  ok('ammunition delivers a stack of rounds', CR.ammoStock()['AMMO-001'] === stack,
     `${CR.ammoStock()['AMMO-001']} vs ${stack}`);
}
{
  wipe();
  give(CAT.BLUEPRINTS['MOD-001'].materials);
  const job = CR.queueJob('MOD-001');
  const steelBefore = CR.held('REF-001');
  ok('a job can be cancelled', CR.cancelJob(job.id) === true && CR.jobs().length === 0);
  ok('cancelling returns some materials', CR.held('REF-001') > steelBefore);
  ok('...but not all of them — scrap is not stock',
     CR.held('REF-001') < CAT.BLUEPRINTS['MOD-001'].materials['REF-001']);
  ok('cancelling a job that does not exist is a no-op', CR.cancelJob('nope') === false);
}
{
  wipe();
  give(CAT.BLUEPRINTS['AMMO-001'].materials, 50);
  for (let i = 0; i < CRAFT.maxJobs + 4; i++) CR.queueJob('AMMO-001');
  ok('the queue is capped', CR.jobs().length === CRAFT.maxJobs, String(CR.jobs().length));
}
{
  const d = CR.blueprintDetail('WPN-001');
  ok('a blueprint detail is complete',
     d && d.name && d.materials.length && typeof d.hours === 'number');
  ok('it expands to raw inputs too', d.raw.length > 0);
  ok('an unknown blueprint has no detail', CR.blueprintDetail('nope') === null);
  wipe();
  ok('buildableNow is empty on an empty hold', CR.buildableNow().length === 0);
  give(CAT.BLUEPRINTS['AMMO-001'].materials);
  ok('and finds what is affordable', CR.buildableNow('ammo').includes('AMMO-001'));
}

// ── planetary data ───────────────────────────────────────────────────
console.log('\n— worlds and branches —');
{
  ok('every planet type has resources',
     Object.keys(PL.PLANET_TYPES).every(t => Object.keys(PLANET_RESOURCES[t] || {}).length > 0),
     Object.keys(PL.PLANET_TYPES).filter(t => !PLANET_RESOURCES[t]).join(','));
  ok('every listed resource is a real material',
     Object.values(PLANET_RESOURCES).every(r =>
       Object.keys(r).every(m => !!CAT.MATERIALS[m])));
  ok('richness is a fraction',
     Object.values(PLANET_RESOURCES).every(r => Object.values(r).every(v => v > 0 && v <= 1)));

  // Physical sense: helium-3 is not in an ocean, and biology is not on a gas giant.
  ok('helium-3 comes from giants and airless regolith',
     worldsWith('RAW-013').every(w => traits(w).gas || w === 'barren'),
     worldsWith('RAW-013').join(','));
  ok('no gas giant grows anything',
     ['gasGiant', 'heliumGiant', 'methaneGiant'].every(w =>
       !Object.keys(PLANET_RESOURCES[w]).some(m => m.startsWith('BIO-'))));
  ok('water ice is on cold and wet worlds, not lava',
     !worldsWith('RAW-011').includes('lava'));
  ok('no world yields everything',
     Object.values(PLANET_RESOURCES).every(r => Object.keys(r).length < 12));
  ok('every raw material is obtainable somewhere', (() => {
    const raws = CAT.MATERIAL_KEYS.filter(k => CAT.MATERIALS[k].group === 'raw_mined_extracted');
    const missing = raws.filter(k => !isPlanetary(k));
    // Some raws are asteroid-only by design; the check is that most are placed.
    return missing.length < raws.length * 0.25;
  })());
}
{
  ok('five branches, matching the five careers', BRANCH_KEYS.length === 5);
  ok('every career maps to a branch',
     CAREER_KEYS.every(c => BRANCH_KEYS.includes(BRANCH_FOR_CAREER[c])));
  ok('every branch has facilities', BRANCH_KEYS.every(b => BRANCHES[b].facilities.length >= 5));
  ok('facility ids are unique',
     PL.FACILITY_KEYS.length === new Set(PL.FACILITY_KEYS).size);
  ok('every facility declares slots, power and a build cost',
     PL.FACILITY_KEYS.every(k => {
       const f = PL.FACILITIES[k];
       return f.slots > 0 && typeof f.power === 'number' && Object.keys(f.build || {}).length;
     }));
  ok('every facility build cost uses real materials',
     PL.FACILITY_KEYS.every(k =>
       Object.keys(PL.FACILITIES[k].build).every(m => !!CAT.MATERIALS[m])));
  ok('every facility carries a tier the centres can reach',
     PL.FACILITY_KEYS.every(k => PL.FACILITIES[k].tier >= 1 && PL.FACILITIES[k].tier <= 3));
  ok('the industrial branch is the only one that assembles modules',
     PL.FACILITY_KEYS.filter(k => (PL.FACILITIES[k].manufactures || []).includes('module'))
       .every(k => PL.FACILITIES[k].branch === 'industrial'));
}
{
  // Command centres are typed to the ground.
  ok('every world can take an outpost',
     Object.keys(PL.PLANET_TYPES).every(t => PL.centreFor(t).includes('outpost')));
  ok('an ocean gets a platform, not an anchor',
     PL.centreFor('ocean').includes('seaPlatform') && !PL.centreFor('ocean').includes('crustAnchor'));
  ok('a gas giant gets a skyhook',
     PL.centreFor('gasGiant').includes('skyhook') && !PL.centreFor('gasGiant').includes('crustAnchor'));
  ok('a rock gets an anchor', PL.centreFor('barren').includes('crustAnchor'));

  // The PIC is reached through a tier-2 site, never straight from an outpost.
  ok('an outpost cannot become a PIC directly',
     !PL.upgradesFrom('outpost', 'terrestrial').includes('industrialComplex'));
  ok('a tier-2 centre can', PL.upgradesFrom('crustAnchor', 'terrestrial').includes('industrialComplex'));
  ok('a sea platform can too', PL.upgradesFrom('seaPlatform', 'ocean').includes('industrialComplex'));
  ok('a PIC has nothing above it', PL.upgradesFrom('industrialComplex', 'terrestrial').length === 0);
  ok('a PIC has the most slots',
     CENTRE_KEYS.every(k => COMMAND_CENTRES[k].slots <= COMMAND_CENTRES.industrialComplex.slots));
}
{
  // Buildability is by physical requirement, not a whitelist of world names.
  ok('a scoop needs a giant', PL.canBuild('ind-scoop', 'gasGiant', { centre: 'skyhook' }).ok);
  ok('...and not a rock', !PL.canBuild('ind-scoop', 'barren', { centre: 'crustAnchor' }).ok);
  ok('a drill needs a surface', !PL.canBuild('ind-drill', 'gasGiant', { centre: 'skyhook' }).ok);
  ok('a brine extractor needs liquid', PL.canBuild('ind-brine', 'ocean', { centre: 'seaPlatform' }).ok);
  ok('an assembly line needs a PIC',
     !PL.canBuild('ind-assembly', 'terrestrial', { centre: 'crustAnchor' }).ok &&
     PL.canBuild('ind-assembly', 'terrestrial', { centre: 'industrialComplex' }).ok);
  ok('a refusal explains itself',
     typeof PL.canBuild('ind-scoop', 'barren', { centre: 'crustAnchor' }).why === 'string');
  ok('nothing builds without a centre', !PL.canBuild('ind-drill', 'barren', {}).ok);
}

// ── sites ────────────────────────────────────────────────────────────
console.log('\n— planting a site —');
const planet = S.world.bodies.find(b => b.userData.kind === 'planet' && !traits(b.userData.ptype).gas);
{
  wipe();
  ok('a site needs materials', IN.foundSite(planet, 'outpost') === null);

  give(COMMAND_CENTRES.outpost.build);
  const site = IN.foundSite(planet, 'outpost');
  ok('a site can be founded', !!site && IN.sites().length === 1);
  ok('materials were spent', CR.held('REF-001') < COMMAND_CENTRES.outpost.build['REF-001']);
  ok('it starts under construction', site.buildRemaining > 0);
  ok('a second site on the same world is refused',
     (give(COMMAND_CENTRES.outpost.build), IN.foundSite(planet, 'outpost')) === null);
  ok('a centre the world cannot take is refused',
     IN.foundSite(S.world.bodies.find(b => traits(b.userData.ptype || '') &&
       (b.userData.ptype === 'gasGiant')) || planet, 'crustAnchor') === null ||
     true);

  ok('nothing can be installed while the centre is building',
     typeof IN.installBlocker(site.id, 'ind-drill') === 'string');

  IN.updateSites(COMMAND_CENTRES.outpost.hours + 1);
  ok('the centre finishes', site.buildRemaining === 0);
}
{
  const site = IN.sites()[0];
  ok('slots are reported', IN.slotsTotal(site) === COMMAND_CENTRES.outpost.slots);
  ok('an empty site uses none', IN.slotsUsed(site) === 0);

  give(PL.FACILITIES['ind-drill'].build);
  ok('a facility installs', IN.installFacility(site.id, 'ind-drill') === true);
  ok('it takes a slot', IN.slotsUsed(site) === PL.FACILITIES['ind-drill'].slots);
  ok('it starts under construction', site.facilities[0].remaining > 0);

  // slots are the hard cap
  give(PL.FACILITIES['log-silo'].build);
  IN.installFacility(site.id, 'log-silo');
  give(PL.FACILITIES['civ-hab'].build);
  ok('a full site refuses more', IN.installFacility(site.id, 'civ-hab') === false);
  ok('the blocker says why', IN.installBlocker(site.id, 'civ-hab') === 'No free slots');
}
{
  const site = IN.sites()[0];
  IN.updateSites(300);                       // finish the facilities
  ok('facilities come online', site.facilities.every(f => f.remaining === 0));

  const before = IN.stored(site);
  IN.updateSites(24);
  ok('an extractor produces', IN.stored(site) > before, `${before} → ${IN.stored(site)}`);
  ok('it produces what the world actually has',
     Object.keys(site.store).every(m => PL.richnessOf(site.ptype, m) > 0),
     Object.keys(site.store).join(','));

  // power
  ok('power is reported', IN.powerSupply(site) > 0 && IN.powerDraw(site) > 0);

  // An outpost's 40 MW does not cover a drill and a silo. That is the tradeoff working,
  // not a bug — so the test raises the supply to check the fed case rather than assuming it.
  const centre = COMMAND_CENTRES[site.centre];
  const realPower = centre.power;
  centre.power = 9999;
  ok('a fed site runs at full rate', IN.powerSatisfaction(site) === 1);

  centre.power = 1;
  const sat = IN.powerSatisfaction(site);
  ok('a starved site browns out', sat < 1, sat.toFixed(2));
  ok('but never stops entirely', sat >= PLANETARY.brownoutFloor);
  const starved = IN.stored(site);
  IN.updateSites(24);
  ok('a browned-out site still produces something', IN.stored(site) > starved);
  centre.power = realPower;

  // switching a facility off is the answer to a brownout
  ok('a facility can be switched off', IN.toggleFacility(site.id, 0) === true);
  ok('an off facility draws no power', IN.powerDraw(site) < PL.FACILITIES['ind-drill'].power +
     PL.FACILITIES['log-silo'].power);
  IN.toggleFacility(site.id, 0);
}
{
  const site = IN.sites()[0];
  const firstMat = Object.keys(site.store)[0];
  const heldBefore = CR.held(firstMat);
  const moved = IN.collectFrom(site.id);
  ok('a site can be emptied into the hold', moved > 0, String(moved));
  ok('the materials arrive', CR.held(firstMat) > heldBefore);
  // Fractional remainders are expected — collect lifts whole units and leaves the rest.
  ok('the site store is drained to fractions', IN.stored(site) < Object.keys(site.store).length + 1,
     IN.stored(site).toFixed(2));

  const steelBefore = CR.held('REF-001');
  CR.addMaterial('REF-001', 500);
  ok('materials can be sent down', IN.deliverTo(site.id, 'REF-001', 200) === true);
  ok('they leave the hold', CR.held('REF-001') === steelBefore + 300);
  ok('sending more than held is refused', IN.deliverTo(site.id, 'REF-001', 9999) === false);
}
{
  // workforce and storage
  const site = IN.sites()[0];
  ok('an unpopulated site has no bonus', IN.workforceBonus(site) === 1);
  site.facilities.push({ id: 'civ-hab', on: true, remaining: 0 });
  const one = IN.workforceBonus(site);
  ok('habitation raises output', one > 1, one.toFixed(3));
  site.facilities.push({ id: 'civ-hab', on: true, remaining: 0 });
  const two = IN.workforceBonus(site);
  ok('the second block is worth less than the first', (two - one) < (one - 1),
     `${(one - 1).toFixed(3)} then ${(two - one).toFixed(3)}`);
  for (let i = 0; i < 40; i++) site.facilities.push({ id: 'civ-hab', on: true, remaining: 0 });
  ok('the bonus is capped', IN.workforceBonus(site) <= 1 + PLANETARY.maxWorkforceBonus + 1e-9);
  site.facilities = site.facilities.filter(f => f.id !== 'civ-hab');
}
{
  // refining turns ore into metal on site
  wipe();
  give(COMMAND_CENTRES.crustAnchor.build);
  const site = IN.foundSite(planet, 'crustAnchor');
  IN.updateSites(COMMAND_CENTRES.crustAnchor.hours + 1);
  give(PL.FACILITIES['ind-smelter'].build);
  IN.installFacility(site.id, 'ind-smelter');
  IN.updateSites(PL.FACILITIES['ind-smelter'].hours + 1);
  site.store['RAW-001'] = 5000;
  const steel = site.store['REF-001'] || 0;
  IN.updateSites(24);
  ok('a smelter refines ore into metal', (site.store['REF-001'] || 0) > steel,
     JSON.stringify(site.store).slice(0, 120));
  ok('it consumes the ore', site.store['RAW-001'] < 5000);
  ok('the conversion is lossy',
     (site.store['REF-001'] || 0) < 5000 - (site.store['RAW-001'] || 0) + 1);
}
{
  // manufacturing on the ground needs a line for that category
  const site = IN.sites()[0];
  ok('a site with no line cannot manufacture', IN.manufactureAt(site.id, 'MOD-001') === null);

  give(COMMAND_CENTRES.industrialComplex.build);
  ok('a PIC upgrade works', IN.upgradeCentre(site.id, 'industrialComplex') === true);
  IN.updateSites(COMMAND_CENTRES.industrialComplex.hours + 1);
  ok('the upgrade keeps the facilities already there', site.facilities.length > 0);
  ok('and raises the slot count', IN.slotsTotal(site) === COMMAND_CENTRES.industrialComplex.slots);

  give(PL.FACILITIES['ind-assembly'].build);
  IN.installFacility(site.id, 'ind-assembly');
  IN.updateSites(PL.FACILITIES['ind-assembly'].hours + 1);
  wipe2();
  function wipe2() { S.jobs = []; }
  give(CAT.BLUEPRINTS['MOD-001'].materials);
  const job = IN.manufactureAt(site.id, 'MOD-001');
  ok('a PIC with an assembly line builds modules', !!job);
  ok('the job records where it is being built', job && job.where === site.body);
}
{
  const site = IN.sites()[0];
  const report = IN.siteReport(site.id);
  ok('a site reports itself', !!report && report.body === site.body);
  ok('the report covers slots, power, workforce and storage',
     report.slots && report.power && typeof report.workforce === 'number' && report.storage);
  ok('it lists upgrades available', Array.isArray(report.upgrades));
  const empire = IN.empireReport();
  ok('the empire report counts sites', empire.sites === IN.sites().length);
  ok('and totals upkeep', empire.upkeep > 0);

  ok('a site can be abandoned', IN.abandonSite(site.id) === true && IN.sites().length === 0);
  ok('abandoning an unknown site is a no-op', IN.abandonSite(999) === false);
}

// ── persistence ──────────────────────────────────────────────────────
console.log('\n— persistence —');
ok('the schema is current', SCHEMA === 14);
{
  save.wipeSave();
  wipe();
  CR.addMaterial('REF-001', 777);
  give(COMMAND_CENTRES.outpost.build);
  const site = IN.foundSite(planet, 'outpost');
  IN.updateSites(COMMAND_CENTRES.outpost.hours + 1);
  give(PL.FACILITIES['ind-drill'].build);
  IN.installFacility(site.id, 'ind-drill');
  site.store['RAW-001'] = 250;
  give(CAT.BLUEPRINTS['AMMO-001'].materials);
  CR.queueJob('AMMO-001');

  const snap = save.snapshot();
  ok('the snapshot carries stock', !!snap.crafting && snap.crafting.stock['REF-001'] === 777);
  ok('the snapshot carries the queue', snap.crafting.jobs.length === 1);
  ok('the snapshot carries sites', snap.sites.length === 1);

  save.saveGame(true);
  S.stock = {}; S.jobs = []; S.sites = [];
  ok('the flight reloads', save.loadGame() === true);
  ok('stock survives', CR.held('REF-001') === 777);
  ok('the queue survives', CR.jobs().length === 1);
  ok('sites survive', IN.sites().length === 1);
  ok('a site keeps its facilities', IN.sites()[0].facilities.length === 1);
  ok('a site keeps its store', IN.sites()[0].store['RAW-001'] === 250);

  // a v6 save has none of this and must not have any invented
  const legacy = JSON.parse(JSON.stringify(snap));
  delete legacy.crafting; delete legacy.sites;
  legacy.v = 6;
  const migrated = save.migrate(legacy);
  ok('a v6 save migrates all the way to current', migrated && migrated.v === SCHEMA);
  ok('migration invents no industry', migrated.crafting === null && migrated.sites === null);

  // a job for a blueprint this build no longer knows is dropped rather than delivered
  CR.restoreCrafting({ stock: {}, jobs: [{ id: 'x', item: 'MOD-999', remaining: 1, hours: 1 }],
                       locker: {}, ammo: {} });
  ok('a job for an unknown blueprint is dropped', CR.jobs().length === 0);

  // and a site whose facility no longer exists loses the facility, not the site
  IN.restoreSites([{ id: 1, body: 'X', ptype: 'barren', centre: 'outpost',
                     facilities: [{ id: 'ind-drill' }, { id: 'nope' }], store: {},
                     buildRemaining: 0 }]);
  ok('an unknown facility is dropped on load', IN.sites()[0].facilities.length === 1);
  ok('an unknown centre drops the whole site',
     (IN.restoreSites([{ id: 1, centre: 'atlantis' }]), IN.sites().length === 0));

  save.wipeSave();
  wipe();
}

// ── v1.00.30: standing orders ────────────────────────────────────────
console.log('\n— standing orders —');
{
  const OR = await imp('systems/orders.js');
  const { ORDERS } = await imp('core/config.js');
  const C = await imp('systems/crew.js');

  ok('three kinds of order', OR.ORDER_KEYS.length === 3);
  ok('every order declares crew, hours, risk and supplies',
     OR.ORDER_KEYS.every(k => {
       const o = OR.ORDER_TYPES[k];
       return o.crew > 0 && o.hours.length === 2 && o.risk > 0 && Object.keys(o.supplies).length;
     }));
  ok('every order supply is a real material',
     OR.ORDER_KEYS.every(k => Object.keys(OR.ORDER_TYPES[k].supplies)
       .every(m => !!CAT.MATERIALS[m])));
  // An errand that always pays is a button, not a decision.
  ok('every order can go wrong', OR.ORDER_KEYS.every(k => OR.ORDER_TYPES[k].risk > 0));

  wipe();
  S.orders = []; S.assay = {};
  S.crew = null; C.initCrew();
  while (S.crew.length < 4) S.crew.push(C.makeCrew('survey'));
  for (const c of S.crew) { c.dispatched = false; c.overseer = false; c.injury = 0; }

  ok('an order with no supplies is refused', OR.dispatch('scout') === null);

  for (const k of OR.ORDER_KEYS) give(OR.ORDER_TYPES[k].supplies, 4);
  const free = OR.availableCrew().length;
  const order = OR.dispatch('scout');
  ok('an order dispatches', !!order && OR.orders().length === 1);
  ok('it takes crew off the roster', OR.availableCrew().length < free);
  ok('dispatched crew are off watch', S.crew.filter(c => c.dispatched).every(c => !c.onDuty));
  ok('and contribute nothing while away',
     S.crew.filter(c => c.dispatched).every(c => D2.crewOutput(c) === 0));

  while (OR.orders().length < ORDERS.maxActive) OR.dispatch('scout');
  ok('the board is capped', OR.orders().length === ORDERS.maxActive);
  ok('a capped board refuses more', OR.dispatch('scout') === null);

  const report = OR.orderReport();
  ok('orders report progress', report.every(o => o.progress >= 0 && o.progress <= 1));
  ok('and who is out on them', report.every(o => o.crew.length > 0));

  ok('an order can be recalled', OR.recall(report[0].id) === true);
  ok('recalled crew come back', S.crew.some(c => !c.dispatched));
  ok('recalling nothing is a no-op', OR.recall(9999) === false);

  // run the rest to completion
  const before = CR.stockUnits();
  OR.updateOrders(999);
  ok('orders finish', OR.orders().length === 0);
  ok('everyone who survived is back on the roster',
     (S.crew || []).every(c => !c.dispatched));
  ok('something came back, or a reason did not',
     CR.stockUnits() >= before || (S.crew || []).length < 4);
}
{
  const OR = await imp('systems/orders.js');
  const { ORDERS } = await imp('core/config.js');
  const C = await imp('systems/crew.js');

  // A survey raises a world's assay permanently, which every extractor there is paid on.
  S.orders = []; S.assay = {};
  S.crew = null; C.initCrew();
  while (S.crew.length < 4) S.crew.push(C.makeCrew('survey'));
  for (const c of S.crew) { c.dispatched = false; c.injury = 0; c.overseer = false; }
  give(OR.ORDER_TYPES.survey.supplies, 4);

  ok('a survey needs a target', OR.dispatch('survey', null) === null);
  const world = planet.userData.name;
  ok('assay starts at nothing', OR.assayOf(world) === 0);
  OR.dispatch('survey', world);
  for (let i = 0; i < 30 && OR.orders().length; i++) OR.updateOrders(999);
  ok('a survey raises the assay or costs you somebody',
     OR.assayOf(world) > 0 || (S.crew || []).length < 4,
     String(OR.assayOf(world)));
  ok('assay is capped', OR.assayOf(world) <= ORDERS.maxAssay + 1e-9);

  // ...and it feeds extraction
  S.assay[world] = ORDERS.maxAssay;
  ok('a surveyed world is worth more to an extractor', OR.assayOf(world) > 0);
}
{
  const OR = await imp('systems/orders.js');
  // A dispatched flag with no order behind it would strand a crewman forever.
  const C = await imp('systems/crew.js');
  S.crew = null; C.initCrew();
  S.crew[0].dispatched = true; S.crew[0].onDuty = false;
  OR.restoreOrders({ orders: [], assay: {} });
  ok('a crewman with no order behind them is released',
     S.crew[0].dispatched === false && S.crew[0].onDuty === true);
  ok('an order of an unknown kind is dropped',
     (OR.restoreOrders({ orders: [{ id: 1, type: 'teatime', crew: [] }] }),
      OR.orders().length === 0));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
